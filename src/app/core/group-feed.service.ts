import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Firestore, deleteField, doc, docData, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Group, FeedEntry, FeedItem, FeedKind, GroupFeed } from '../shared/group.model';
import { feedText } from '../shared/group-feed';

// Muro del grupo: un único documento groupFeed/{groupId} con una entrada por miembro (la última
// que ha escrito o lo último que le ha pasado). Abrirlo cuesta 1 lectura, tenga el grupo los
// miembros que tenga, y cada persona solo puede escribir su propia entrada.
@Injectable({
  providedIn: 'root',
})
export class GroupFeedService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  feed$(group: Group): Observable<FeedEntry[]> {
    return (
      runInInjectionContext(this.injector, () => docData(this.ref(group.id!))) as Observable<GroupFeed | undefined>
    ).pipe(map((feed) => resolve(group, feed)));
  }

  async post(groupId: string, uid: string, kind: FeedKind, msg: string | null = null): Promise<void> {
    await setDoc(this.ref(groupId), { items: { [uid]: { from: uid, kind, msg, at: serverTimestamp() } } }, { merge: true });
  }

  // Retirar una entrada: la propia, o cualquiera si eres el dueño o un administrador.
  async remove(groupId: string, uid: string): Promise<void> {
    await setDoc(this.ref(groupId), { items: { [uid]: deleteField() } }, { merge: true });
  }

  private ref(groupId: string) {
    return doc(this.firestore, 'groupFeed', groupId);
  }
}

// Resuelve nombres y textos con los miembros del grupo, de más reciente a más antiguo. Las
// entradas de quien ya no está en el grupo no se muestran.
function resolve(group: Group, feed: GroupFeed | undefined): FeedEntry[] {
  return Object.entries(feed?.items ?? {})
    .filter(([uid, item]) => item.from === uid && group.memberUids.includes(uid))
    .map(([uid, item]): FeedEntry => {
      const member = group.members?.[uid];
      const name = member?.displayName?.trim() || 'Alguien';
      return { ...(item as FeedItem), uid, name, photoURL: member?.photoURL ?? null, ...feedText(name, item) };
    })
    .sort((a, b) => (b.at?.toMillis() ?? 0) - (a.at?.toMillis() ?? 0));
}
