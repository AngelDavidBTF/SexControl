import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, map, of, switchMap } from 'rxjs';
import { AnalyticsService } from '../../core/analytics.service';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { ProfileService } from '../../core/profile.service';
import { FriendsService } from '../../core/friends.service';
import { GroupsService, PartialGroupWriteError } from '../../core/groups.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Friend } from '../../shared/friend.model';
import { MAX_GROUP_MEMBERS } from '../../shared/group.model';
import { FiltroPipe } from '../../shared/filtro.pipe';
import { resizeImageToDataUrl } from '../../shared/image';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderComponent, FiltroPipe],
  templateUrl: './create-group.page.html',
  styleUrl: './create-group.page.scss',
})
export class CreateGroupPage {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private ui = inject(UiService);
  private router = inject(Router);
  private profiles = inject(ProfileService);
  private analytics = inject(AnalyticsService);

  nameGroup = '';
  imageUrl: string | null = null;
  selectedUsers: Friend[] = [];
  textoBuscar = '';
  guardando = false;

  readonly friends$: Observable<Friend[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.social$(user.uid) : of(null))),
    map((social) => social?.friends ?? [])
  );

  get canCreate(): boolean {
    return this.nameGroup.trim() !== '' && this.selectedUsers.length > 0 && !this.guardando;
  }

  isSelected(friend: Friend): boolean {
    return this.selectedUsers.some((user) => user.uid === friend.uid);
  }

  toggle(friend: Friend): void {
    if (this.isSelected(friend)) {
      this.selectedUsers = this.selectedUsers.filter((user) => user.uid !== friend.uid);
      return;
    }
    // El dueño también cuenta como miembro.
    if (this.selectedUsers.length + 1 >= MAX_GROUP_MEMBERS) {
      this.ui.toast(`Un grupo puede tener como máximo ${MAX_GROUP_MEMBERS} miembros`);
      return;
    }
    this.selectedUsers = [...this.selectedUsers, friend];
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    try {
      this.imageUrl = await resizeImageToDataUrl(file);
    } catch (error) {
      console.error('Error procesando la imagen', error);
      await this.ui.toast('No se pudo cargar la imagen');
    }
  }

  async createGroup(): Promise<void> {
    const me = this.authService.currentUser();
    if (!me || !this.canCreate) {
      return;
    }

    this.guardando = true;
    try {
      const [profile, counts] = await Promise.all([this.profiles.current(me.uid), firstValueFrom(this.fapService.fapCounts$(me.uid))]);
      const groupId = await this.groupsService.createGroup(
        { uid: me.uid, displayName: profile.displayName, photoURL: profile.photoURL, counts },
        this.nameGroup,
        this.imageUrl,
        this.selectedUsers
      );
      this.analytics.log('grupo_creado', { miembros_invitados: this.selectedUsers.length });
      // Rellena mi entrada con los recuentos de semana y mes para los rankings por periodo.
      void this.fapService.publish(me.uid);
      await this.router.navigate(['/group', groupId], { replaceUrl: true });
    } catch (error) {
      console.error('Error creando grupo', error);
      if (error instanceof PartialGroupWriteError) {
        await this.router.navigate(['/group', error.groupId], { replaceUrl: true });
        await this.ui.toast('Grupo creado, pero no se pudo añadir a todos los miembros');
        return;
      }
      await this.ui.toast('No se pudo crear el grupo');
    } finally {
      this.guardando = false;
    }
  }
}
