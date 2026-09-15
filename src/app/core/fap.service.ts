import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
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
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { FapCounts } from '../shared/fap.model';

interface FapStatsDoc {
  solitario?: number;
  compania?: number;
}

// Los totales se leen de fapStats/{uid} (un documento por usuario) en lugar de contar los faps:
// así amigos y grupos escalan aunque haya muchos amigos o muchos faps por persona.
@Injectable({
  providedIn: 'root',
})
export class FapService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private fapsCollection = collection(this.firestore, 'faps');

  // null si el usuario aún no tiene totales o no hay permiso para verlos.
  fapCounts$(uid: string): Observable<FapCounts | null> {
    return (this.inContext(() => docData(this.statsRef(uid))) as Observable<FapStatsDoc | undefined>).pipe(
      map((stats) => (stats ? { solitario: stats.solitario ?? 0, compania: stats.compania ?? 0 } : null))
    );
  }

  async addFap(uid: string, solitario: boolean): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.fapsCollection), {
      uid,
      solitario,
      numero: 1,
      fecha: serverTimestamp(),
    });
    batch.set(this.statsRef(uid), this.statsDelta(solitario, 1), { merge: true });
    await batch.commit();
  }

  async removeLastFap(uid: string): Promise<void> {
    const q = query(this.fapsCollection, where('uid', '==', uid), orderBy('fecha', 'desc'), limit(1));
    const snapshot = await this.inContext(() => getDocs(q));
    const last = snapshot.docs[0];
    if (!last) {
      return;
    }

    const batch = writeBatch(this.firestore);
    batch.delete(last.ref);
    batch.set(this.statsRef(uid), this.statsDelta(last.data()['solitario'] === true, -1), { merge: true });
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
    }
  }

  // Recalcula fapStats a partir de los faps reales con consultas de agregación (no descarga
  // documentos). Se ejecuta al iniciar sesión: da de alta los totales de usuarios con faps
  // anteriores a fapStats y corrige cualquier desfase.
  async reconcileStats(uid: string): Promise<void> {
    const countWhere = (solitario: boolean) =>
      this.inContext(() =>
        getCountFromServer(query(this.fapsCollection, where('uid', '==', uid), where('solitario', '==', solitario)))
      );
    const [solitario, compania] = await Promise.all([countWhere(true), countWhere(false)]);
    await setDoc(this.statsRef(uid), {
      solitario: solitario.data().count,
      compania: compania.data().count,
      updatedAt: serverTimestamp(),
    });
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
