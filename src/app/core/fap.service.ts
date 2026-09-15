import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  docData,
  getCountFromServer,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
import { FapCounts } from '../shared/fap.model';
import { FriendsService } from './friends.service';
import { GroupsService } from './groups.service';
import { PerUserStreams } from './per-user-streams';

interface FapStatsDoc {
  solitario?: number;
  compania?: number;
}

// Máximo de escrituras por batch de Firestore (500), con margen.
const FAN_OUT_BATCH_SIZE = 450;

// Totales en fapStats/{uid} (solo los lee su dueño). Al sumar o borrar, el usuario propaga
// sus totales a social/{amigo} y a cada grupo suyo: sumar es mucho menos frecuente que abrir
// pantallas, así que las listas de amigos y grupos se leen de 1 documento en vez de N.
@Injectable({
  providedIn: 'root',
})
export class FapService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private streams = new PerUserStreams(authState(inject(Auth)));
  private fapsCollection = collection(this.firestore, 'faps');

  // Totales propios; {0, 0} si aún no existen.
  fapCounts$(uid: string): Observable<FapCounts> {
    return this.streams.get('fapStats', uid, () =>
      (this.inContext(() => docData(this.statsRef(uid))) as Observable<FapStatsDoc | undefined>).pipe(
        map((stats) => ({ solitario: stats?.solitario ?? 0, compania: stats?.compania ?? 0 }))
      )
    );
  }

  async addFap(uid: string, solitario: boolean): Promise<void> {
    const current = await firstValueFrom(this.fapCounts$(uid));

    const batch = writeBatch(this.firestore);
    batch.set(doc(this.fapsCollection), {
      uid,
      solitario,
      numero: 1,
      fecha: serverTimestamp(),
    });
    batch.set(this.statsRef(uid), this.statsDelta(solitario, 1), { merge: true });
    await batch.commit();

    await this.fanOut(uid, this.applyDelta(current, solitario, 1));
  }

  async removeLastFap(uid: string): Promise<void> {
    const q = query(this.fapsCollection, where('uid', '==', uid), orderBy('fecha', 'desc'), limit(1));
    const snapshot = await this.inContext(() => getDocs(q));
    const last = snapshot.docs[0];
    if (!last) {
      return;
    }
    const solitario = last.data()['solitario'] === true;
    const current = await firstValueFrom(this.fapCounts$(uid));

    const batch = writeBatch(this.firestore);
    batch.delete(last.ref);
    batch.set(this.statsRef(uid), this.statsDelta(solitario, -1), { merge: true });
    try {
      await batch.commit();
    } catch (error) {
      // Totales desfasados (p. ej. quedarían en negativo y las reglas lo rechazan):
      // se borra el fap igualmente y se recalculan desde cero.
      console.warn('No se pudo actualizar fapStats al borrar; se recalcula', error);
      const retry = writeBatch(this.firestore);
      retry.delete(last.ref);
      await retry.commit();
      await this.reconcileStats(uid);
      return;
    }

    await this.fanOut(uid, this.applyDelta(current, solitario, -1));
  }

  // Recalcula fapStats a partir de los faps reales con consultas de agregación (1 lectura por
  // cada 1000 faps, sin descargar documentos) y propaga el resultado. Se ejecuta una vez por
  // dispositivo (AppComponent) y cuando se detecta un desfase.
  async reconcileStats(uid: string): Promise<void> {
    const countWhere = (solitario: boolean) =>
      this.inContext(() =>
        getCountFromServer(query(this.fapsCollection, where('uid', '==', uid), where('solitario', '==', solitario)))
      );
    const [solitario, compania] = await Promise.all([countWhere(true), countWhere(false)]);
    const counts = { solitario: solitario.data().count, compania: compania.data().count };
    await setDoc(this.statsRef(uid), { ...counts, updatedAt: serverTimestamp() });
    await this.fanOut(uid, counts);
  }

  // Escribe valores absolutos (no incrementos): si alguna copia quedó desfasada, se corrige
  // en la siguiente propagación. Amigos y grupos salen de los listeners ya abiertos en la
  // sesión, así que normalmente no cuesta lecturas. Nunca lanza: el fap ya está guardado.
  private async fanOut(uid: string, counts: FapCounts): Promise<void> {
    try {
      const [social, groups] = await Promise.all([
        firstValueFrom(this.friendsService.social$(uid)),
        firstValueFrom(this.groupsService.groupsForUser$(uid)),
      ]);

      // Amigos: en batches. Mi entrada en el documento de cada amigo no la puedo leer, así que
      // se escribe siempre (las reglas aceptan que el valor no cambie).
      for (let i = 0; i < social.friends.length; i += FAN_OUT_BATCH_SIZE) {
        const batch = writeBatch(this.firestore);
        social.friends
          .slice(i, i + FAN_OUT_BATCH_SIZE)
          .forEach((friend) =>
            batch.set(doc(this.firestore, 'social', friend.uid), { friends: { [uid]: counts } }, { merge: true })
          );
        await batch.commit();
      }

      // Grupos: mi entrada sí está en memoria, así que solo se escriben los que cambian. Uno a
      // uno, para que un grupo del que acaban de sacarme no impida actualizar los demás.
      const outdated = groups.filter((group) => {
        const mine = group.members?.[uid];
        return group.id && (mine?.solitario !== counts.solitario || mine?.compania !== counts.compania);
      });
      await Promise.allSettled(
        outdated.map((group) =>
          updateDoc(doc(this.firestore, 'groups', group.id!), {
            [`members.${uid}.solitario`]: counts.solitario,
            [`members.${uid}.compania`]: counts.compania,
          })
        )
      );
    } catch (error) {
      console.warn('No se pudieron propagar los totales', error);
    }
  }

  private applyDelta(counts: FapCounts, solitario: boolean, delta: number): FapCounts {
    const field = solitario ? 'solitario' : 'compania';
    return { ...counts, [field]: Math.max(0, counts[field] + delta) };
  }

  private statsRef(uid: string) {
    return doc(this.firestore, 'fapStats', uid);
  }

  private statsDelta(solitario: boolean, delta: number) {
    return {
      [solitario ? 'solitario' : 'compania']: increment(delta),
      updatedAt: serverTimestamp(),
    };
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
