import { User } from '@angular/fire/auth';
import { Observable, filter, finalize, shareReplay, takeUntil } from 'rxjs';

// Cada listener de Firestore cobra una lectura por documento al engancharse. Para no pagar
// dos veces la misma consulta cuando varias pantallas (o la propagación de totales) la
// necesitan, se mantiene un único listener por usuario durante toda la sesión y se corta
// al cerrar sesión o cambiar de usuario.
export class PerUserStreams {
  private streams = new Map<string, Observable<unknown>>();

  constructor(private readonly user$: Observable<User | null>) {}

  get<T>(key: string, uid: string, factory: () => Observable<T>): Observable<T> {
    const id = `${key}:${uid}`;
    let stream = this.streams.get(id) as Observable<T> | undefined;
    if (!stream) {
      stream = factory().pipe(
        takeUntil(this.user$.pipe(filter((user) => user?.uid !== uid))),
        finalize(() => this.streams.delete(id)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.streams.set(id, stream);
    }
    return stream;
  }
}
