import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Fap } from '../shared/fap.model';
import { FapCounts } from '../shared/friend.model';

// Se ordena en el cliente (por fecha) en lugar de usar orderBy en Firestore para no
// requerir un índice compuesto (uid + fecha): el volumen por usuario es pequeño (contador personal).
function byFechaAsc(a: Fap, b: Fap): number {
  return (a.fecha?.toMillis() ?? 0) - (b.fecha?.toMillis() ?? 0);
}

@Injectable({
  providedIn: 'root',
})
export class FapService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private fapsCollection = collection(this.firestore, 'faps');

  fapsForUser$(uid: string): Observable<Fap[]> {
    const q = query(this.fapsCollection, where('uid', '==', uid));
    return (this.inContext(() => collectionData(q, { idField: 'id' })) as Observable<Fap[]>).pipe(
      map((faps) => [...faps].sort(byFechaAsc))
    );
  }

  fapCounts$(uid: string): Observable<FapCounts> {
    const q = query(this.fapsCollection, where('uid', '==', uid));
    return (this.inContext(() => collectionData(q)) as Observable<Fap[]>).pipe(
      map((faps) => ({
        solitario: faps.filter((fap) => fap.solitario).length,
        compania: faps.filter((fap) => !fap.solitario).length,
      }))
    );
  }

  async addFap(uid: string, solitario: boolean): Promise<void> {
    await addDoc(this.fapsCollection, {
      uid,
      solitario,
      numero: 1,
      fecha: serverTimestamp(),
    });
  }

  async removeLastFap(uid: string): Promise<void> {
    const q = query(this.fapsCollection, where('uid', '==', uid));
    const snapshot = await this.inContext(() => getDocs(q));
    const faps = snapshot.docs
      .map((d) => ({ id: d.id, ...(d.data() as Fap) }))
      .sort(byFechaAsc);
    const lastDoc = faps[faps.length - 1];
    if (lastDoc?.id) {
      await deleteDoc(doc(this.firestore, 'faps', lastDoc.id));
    }
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
