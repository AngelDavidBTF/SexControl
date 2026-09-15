import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  docData,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
import { DayBuckets, Fap, FapCounts, FapStats, HourBuckets, STATS_VERSION } from '../shared/fap.model';
import { dayKey, hourKey } from '../shared/stats';
import { FriendsService } from './friends.service';
import { GroupsService } from './groups.service';
import { PerUserStreams } from './per-user-streams';

interface FapStatsDoc {
  solitario?: number;
  compania?: number;
  days?: DayBuckets;
  hours?: HourBuckets;
  v?: number;
}

export interface FapEntry {
  id: string;
  solitario: boolean;
  fecha: Date | null;
  snapshot: QueryDocumentSnapshot;
}

export interface FapPage {
  entries: FapEntry[];
  // Cursor para la siguiente página; null si no hay más.
  next: QueryDocumentSnapshot | null;
}

// Máximo de escrituras por batch de Firestore (500), con margen.
const FAN_OUT_BATCH_SIZE = 450;

// fapStats/{uid} (solo lo lee su dueño) guarda totales y recuentos por día y hora: Sumar y las
// estadísticas leen ese único documento. Al sumar o borrar, el usuario propaga sus totales a
// social/{amigo} y a cada grupo suyo: sumar es mucho menos frecuente que abrir pantallas.
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

  stats$(uid: string): Observable<FapStats> {
    return this.streams.get('fapStats', uid, () =>
      (this.inContext(() => docData(this.statsRef(uid))) as Observable<FapStatsDoc | undefined>).pipe(
        map((stats) => ({
          solitario: stats?.solitario ?? 0,
          compania: stats?.compania ?? 0,
          days: stats?.days ?? {},
          hours: stats?.hours ?? {},
          v: stats?.v ?? null,
        }))
      )
    );
  }

  fapCounts$(uid: string): Observable<FapCounts> {
    return this.stats$(uid).pipe(map(({ solitario, compania }) => ({ solitario, compania })));
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
    batch.set(this.statsRef(uid), this.statsDelta(solitario, new Date(), 1), { merge: true });
    await batch.commit();

    await this.fanOut(uid, this.applyDelta(current, solitario, 1));
  }

  async removeLastFap(uid: string): Promise<void> {
    const q = query(this.fapsCollection, where('uid', '==', uid), orderBy('fecha', 'desc'), limit(1));
    const snapshot = await this.inContext(() => getDocs(q));
    if (snapshot.docs[0]) {
      await this.removeFap(uid, snapshot.docs[0]);
    }
  }

  // Borra un fap concreto (desde el historial o "Borrar último") y descuenta sus recuentos.
  async removeFap(uid: string, fapDoc: DocumentSnapshot | QueryDocumentSnapshot): Promise<void> {
    const data = fapDoc.data() as Fap | undefined;
    if (!data) {
      return;
    }
    const current = await firstValueFrom(this.fapCounts$(uid));
    const fecha = data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date();

    const batch = writeBatch(this.firestore);
    batch.delete(fapDoc.ref);
    batch.set(this.statsRef(uid), this.statsDelta(data.solitario, fecha, -1), { merge: true });
    try {
      await batch.commit();
    } catch (error) {
      // Totales desfasados (p. ej. quedarían en negativo y las reglas lo rechazan):
      // se borra el fap igualmente y se reconstruyen las estadísticas.
      console.warn('No se pudo actualizar fapStats al borrar; se reconstruye', error);
      const retry = writeBatch(this.firestore);
      retry.delete(fapDoc.ref);
      await retry.commit();
      await this.rebuildStats(uid);
      return;
    }

    await this.fanOut(uid, this.applyDelta(current, data.solitario, -1));
  }

  // Historial bajo demanda, del más reciente al más antiguo (lecturas solo de la página pedida).
  async fapsPage(uid: string, pageSize: number, after: QueryDocumentSnapshot | null): Promise<FapPage> {
    const constraints = [
      where('uid', '==', uid),
      orderBy('fecha', 'desc'),
      ...(after ? [startAfter(after)] : []),
      limit(pageSize),
    ];
    const snapshot = await this.inContext(() => getDocs(query(this.fapsCollection, ...constraints)));
    return {
      entries: snapshot.docs.map((d) => {
        const fap = d.data() as Fap;
        return {
          id: d.id,
          solitario: fap.solitario,
          fecha: fap.fecha instanceof Timestamp ? fap.fecha.toDate() : null,
          snapshot: d,
        };
      }),
      next: snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null,
    };
  }

  // Reconstruye fapStats (totales y recuentos por día/hora) leyendo todos los faps del usuario.
  // Cuesta 1 lectura por fap, pero solo ocurre una vez por usuario: al pasar a esta versión del
  // formato (AppComponent) o si se detecta un desfase al borrar.
  async rebuildStats(uid: string): Promise<void> {
    const snapshot = await this.inContext(() => getDocs(query(this.fapsCollection, where('uid', '==', uid))));
    const days: DayBuckets = {};
    const hours: HourBuckets = {};
    let solitario = 0;
    let compania = 0;

    for (const d of snapshot.docs) {
      const fap = d.data() as Fap;
      const field = fap.solitario ? 's' : 'c';
      fap.solitario ? solitario++ : compania++;
      if (fap.fecha instanceof Timestamp) {
        const date = fap.fecha.toDate();
        const day = (days[dayKey(date)] ??= {});
        day[field] = (day[field] ?? 0) + 1;
        const hour = (hours[hourKey(date)] ??= {});
        hour[field] = (hour[field] ?? 0) + 1;
      }
    }

    const counts = { solitario, compania };
    await setDoc(this.statsRef(uid), { ...counts, days, hours, v: STATS_VERSION, updatedAt: serverTimestamp() });
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

  // Incremento (o decremento) de totales y de los recuentos del día y la hora locales de `fecha`.
  private statsDelta(solitario: boolean, fecha: Date, delta: number) {
    const bucketField = solitario ? 's' : 'c';
    return {
      [solitario ? 'solitario' : 'compania']: increment(delta),
      days: { [dayKey(fecha)]: { [bucketField]: increment(delta) } },
      hours: { [hourKey(fecha)]: { [bucketField]: increment(delta) } },
      updatedAt: serverTimestamp(),
    };
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
