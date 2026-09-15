import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  deleteDoc,
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
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
import {
  DayBuckets,
  Fap,
  FapCounts,
  FapDetails,
  FapStats,
  Goals,
  HourBuckets,
  RatingBuckets,
  STATS_VERSION,
  StatsBucket,
  TagBuckets,
  normalizeTag,
} from '../shared/fap.model';
import { dayKey, hourKey } from '../shared/stats';
import { PerUserStreams } from './per-user-streams';
import { SharingService } from './sharing.service';

interface FapStatsDoc {
  solitario?: number;
  compania?: number;
  days?: DayBuckets;
  hours?: HourBuckets;
  tags?: TagBuckets;
  ratings?: RatingBuckets;
  goals?: Goals;
  v?: number;
}

// Lo mínimo para descontar un fap de las estadísticas al borrarlo o editar sus detalles.
export interface FapRef extends FapDetails {
  id: string;
  solitario: boolean;
  fecha: Date | null;
}

export interface FapEntry extends FapRef {
  snapshot: QueryDocumentSnapshot;
}

export interface FapPage {
  entries: FapEntry[];
  // Cursor para la siguiente página; null si no hay más.
  next: QueryDocumentSnapshot | null;
}

// fapStats/{uid} (solo lo lee su dueño) guarda totales, recuentos por día/hora/etiqueta/
// valoración y objetivos: Sumar y las estadísticas leen ese único documento. Al sumar o borrar se
// publican los totales a amigos y grupos (SharingService).
@Injectable({
  providedIn: 'root',
})
export class FapService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private sharing = inject(SharingService);
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
          tags: stats?.tags ?? {},
          ratings: stats?.ratings ?? {},
          goals: stats?.goals ?? {},
          v: stats?.v ?? null,
        }))
      )
    );
  }

  fapCounts$(uid: string): Observable<FapCounts> {
    return this.stats$(uid).pipe(map(({ solitario, compania }) => ({ solitario, compania })));
  }

  // Sin `fecha` se registra ahora (hora del servidor); con ella, un fap olvidado en esa fecha.
  // Devuelve lo necesario para deshacerlo o añadirle detalles después.
  async addFap(uid: string, solitario: boolean, fecha?: Date, details: FapDetails = {}): Promise<FapRef> {
    const ref = doc(this.fapsCollection);
    const clean = cleanDetails(details);
    const when = fecha ?? new Date();

    const batch = writeBatch(this.firestore);
    batch.set(ref, {
      uid,
      solitario,
      numero: 1,
      fecha: fecha ? Timestamp.fromDate(fecha) : serverTimestamp(),
      ...clean,
    });
    batch.set(this.statsRef(uid), this.statsDelta({ solitario, fecha: when, ...clean }, 1), { merge: true });
    await batch.commit();

    await this.publish(uid);
    return { id: ref.id, solitario, fecha: when, ...clean };
  }

  async removeLastFap(uid: string): Promise<void> {
    const q = query(this.fapsCollection, where('uid', '==', uid), orderBy('fecha', 'desc'), limit(1));
    const snapshot = await this.inContext(() => getDocs(q));
    if (snapshot.docs[0]) {
      await this.removeFap(uid, toFapRef(snapshot.docs[0]));
    }
  }

  // Borra un fap concreto (historial, "Borrar último" o "Deshacer") y descuenta sus recuentos.
  async removeFap(uid: string, fap: FapRef): Promise<void> {
    const ref = doc(this.firestore, 'faps', fap.id);
    const batch = writeBatch(this.firestore);
    batch.delete(ref);
    batch.set(this.statsRef(uid), this.statsDelta({ ...fap, fecha: fap.fecha ?? new Date() }, -1), { merge: true });
    try {
      await batch.commit();
    } catch (error) {
      // Totales desfasados (p. ej. quedarían en negativo y las reglas lo rechazan):
      // se borra el fap igualmente y se reconstruyen las estadísticas.
      console.warn('No se pudo actualizar fapStats al borrar; se reconstruye', error);
      await deleteDoc(ref);
      await this.rebuildStats(uid);
      return;
    }
    await this.publish(uid);
  }

  // Cambia nota, valoración y etiquetas de un fap y ajusta los recuentos por etiqueta/valoración.
  async updateDetails(uid: string, fap: FapRef, details: FapDetails): Promise<FapRef> {
    const next = cleanDetails(details);
    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'faps', fap.id), {
      nota: next.nota ?? null,
      valoracion: next.valoracion ?? null,
      etiquetas: next.etiquetas ?? null,
    });
    const field = fap.solitario ? 's' : 'c';
    const tags: Record<string, StatsBucket> = {};
    for (const tag of fap.etiquetas ?? []) {
      tags[tag] = { [field]: increment(-1) } as StatsBucket;
    }
    for (const tag of next.etiquetas ?? []) {
      tags[tag] = (fap.etiquetas ?? []).includes(tag) ? ({} as StatsBucket) : ({ [field]: increment(1) } as StatsBucket);
    }
    const ratings: Record<string, StatsBucket> = {};
    if (fap.valoracion !== next.valoracion) {
      if (fap.valoracion) {
        ratings[String(fap.valoracion)] = { [field]: increment(-1) } as StatsBucket;
      }
      if (next.valoracion) {
        ratings[String(next.valoracion)] = { [field]: increment(1) } as StatsBucket;
      }
    }
    batch.set(this.statsRef(uid), { tags: dropEmpty(tags), ratings, updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
    return { ...fap, nota: next.nota ?? null, valoracion: next.valoracion ?? null, etiquetas: next.etiquetas ?? null };
  }

  async setGoals(uid: string, goals: Goals): Promise<void> {
    await setDoc(this.statsRef(uid), { goals: { semana: goals.semana ?? null, mes: goals.mes ?? null } }, { merge: true });
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
      entries: snapshot.docs.map((d) => ({ ...toFapRef(d), snapshot: d })),
      next: snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null,
    };
  }

  // Todos los faps del usuario (1 lectura por fap): reconstrucción y borrado de cuenta.
  async allFapRefs(uid: string): Promise<DocumentReference[]> {
    const snapshot = await this.inContext(() => getDocs(query(this.fapsCollection, where('uid', '==', uid))));
    return snapshot.docs.map((d) => d.ref);
  }

  // Reconstruye fapStats leyendo todos los faps del usuario. Cuesta 1 lectura por fap, pero solo
  // ocurre una vez por usuario: al pasar a esta versión del formato (AppComponent) o si se detecta
  // un desfase al borrar. Conserva los objetivos.
  async rebuildStats(uid: string): Promise<void> {
    const [snapshot, current] = await Promise.all([
      this.inContext(() => getDocs(query(this.fapsCollection, where('uid', '==', uid)))),
      firstValueFrom(this.stats$(uid)),
    ]);
    const days: DayBuckets = {};
    const hours: HourBuckets = {};
    const tags: TagBuckets = {};
    const ratings: RatingBuckets = {};
    let solitario = 0;
    let compania = 0;
    const bump = (buckets: Record<string, StatsBucket>, key: string, field: 's' | 'c') => {
      const bucket = (buckets[key] ??= {});
      bucket[field] = (bucket[field] ?? 0) + 1;
    };

    for (const d of snapshot.docs) {
      const fap = d.data() as Fap;
      const field = fap.solitario ? 's' : 'c';
      fap.solitario ? solitario++ : compania++;
      if (fap.fecha instanceof Timestamp) {
        const date = fap.fecha.toDate();
        bump(days, dayKey(date), field);
        bump(hours, hourKey(date), field);
      }
      (fap.etiquetas ?? []).forEach((tag) => bump(tags, tag, field));
      if (fap.valoracion) {
        bump(ratings, String(fap.valoracion), field);
      }
    }

    await setDoc(this.statsRef(uid), {
      solitario,
      compania,
      days,
      hours,
      tags,
      ratings,
      goals: current.goals,
      v: STATS_VERSION,
      updatedAt: serverTimestamp(),
    });
    await this.publish(uid);
  }

  // Publica los totales actuales. El listener de fapStats ya refleja la escritura local.
  async publish(uid: string): Promise<void> {
    await this.sharing.publish(uid, await firstValueFrom(this.stats$(uid)));
  }

  private statsRef(uid: string) {
    return doc(this.firestore, 'fapStats', uid);
  }

  // Incremento (o decremento) de totales y de los recuentos del día, la hora, las etiquetas y la
  // valoración del fap.
  private statsDelta(fap: FapDetails & { solitario: boolean; fecha: Date }, delta: number) {
    const field = fap.solitario ? 's' : 'c';
    const bucket = () => ({ [field]: increment(delta) });
    return {
      [fap.solitario ? 'solitario' : 'compania']: increment(delta),
      days: { [dayKey(fap.fecha)]: bucket() },
      hours: { [hourKey(fap.fecha)]: bucket() },
      ...(fap.etiquetas?.length ? { tags: Object.fromEntries(fap.etiquetas.map((tag) => [tag, bucket()])) } : {}),
      ...(fap.valoracion ? { ratings: { [String(fap.valoracion)]: bucket() } } : {}),
      updatedAt: serverTimestamp(),
    };
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}

function toFapRef(snapshot: QueryDocumentSnapshot): FapRef {
  const fap = snapshot.data() as Fap;
  return {
    id: snapshot.id,
    solitario: fap.solitario,
    fecha: fap.fecha instanceof Timestamp ? fap.fecha.toDate() : null,
    nota: fap.nota ?? null,
    valoracion: fap.valoracion ?? null,
    etiquetas: fap.etiquetas ?? null,
  };
}

// Normaliza los detalles: sin vacíos, etiquetas en minúsculas y sin repetir.
function cleanDetails(details: FapDetails): FapDetails {
  const nota = details.nota?.trim().slice(0, 280) || null;
  const valoracion = details.valoracion && details.valoracion >= 1 && details.valoracion <= 5 ? Math.round(details.valoracion) : null;
  const etiquetas = [...new Set((details.etiquetas ?? []).map(normalizeTag).filter(Boolean))].slice(0, 10);
  return {
    ...(nota ? { nota } : {}),
    ...(valoracion ? { valoracion } : {}),
    ...(etiquetas.length ? { etiquetas } : {}),
  };
}

function dropEmpty(buckets: Record<string, StatsBucket>): Record<string, StatsBucket> {
  return Object.fromEntries(Object.entries(buckets).filter(([, bucket]) => Object.keys(bucket).length > 0));
}
