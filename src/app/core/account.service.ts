import { Injectable, inject } from '@angular/core';
import { Firestore, deleteDoc, doc, setDoc, writeBatch } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { FapService } from './fap.service';
import { FriendsService } from './friends.service';
import { GroupsService } from './groups.service';
import { SharingService } from './sharing.service';

const BATCH_SIZE = 450;

// Operaciones sobre la cuenta completa: perfil y borrado.
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private sharing = inject(SharingService);

  // Nombre y foto (data URL pequeña o URL de Google). Se actualiza el perfil de búsqueda y se
  // propaga a las listas de amigos y a los grupos.
  async updateProfile(uid: string, displayName: string, photoURL: string | null): Promise<void> {
    const name = displayName.trim().slice(0, 40);
    await this.auth.updateDisplayName(name);
    await setDoc(
      doc(this.firestore, 'users', uid),
      { displayName: name, displayNameLower: name.toLowerCase(), photoURL },
      { merge: true }
    );
    const stats = await firstValueFrom(this.fapService.stats$(uid));
    await this.sharing.publish(uid, stats, { profile: { displayName: name, photoURL } });
  }

  // Borra todo lo del usuario y después la cuenta de Firebase Auth. Requiere haber llamado antes a
  // AuthService.reauthenticate (si no, deleteUser fallaría con los datos ya borrados).
  async deleteAccount(uid: string): Promise<void> {
    const [social, groups] = await Promise.all([
      firstValueFrom(this.friendsService.social$(uid)),
      firstValueFrom(this.groupsService.groupsForUser$(uid)),
    ]);

    await this.friendsService.detachEverywhere(uid, social);
    await Promise.allSettled(
      groups.map((group) =>
        group.ownerUid === uid ? this.groupsService.deleteGroup(group) : this.groupsService.leaveGroup(group, uid)
      )
    );

    const faps = await this.fapService.allFapRefs(uid);
    for (let i = 0; i < faps.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      faps.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    await Promise.all([
      deleteDoc(doc(this.firestore, 'fapStats', uid)),
      deleteDoc(doc(this.firestore, 'social', uid)),
      deleteDoc(doc(this.firestore, 'users', uid)),
    ]);

    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sexcontrol.') && key.includes(uid))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Sin almacenamiento local no hay nada que limpiar.
    }

    await this.auth.deleteCurrentUser();
  }
}
