import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FriendsService } from '../../core/friends.service';
import { GroupsService } from '../../core/groups.service';
import { UiService } from '../../core/ui.service';
import { Friend } from '../../shared/friend.model';
import { Group, MAX_GROUP_MEMBERS } from '../../shared/group.model';
import { FiltroPipe } from '../../shared/filtro.pipe';

@Component({
  selector: 'app-add-members-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FiltroPipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Añadir amigo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding-horizontal">
        <ion-chip *ngFor="let user of selectedUsers" (click)="toggle(user)">
          <ion-avatar>
            <img [src]="user.photoURL || 'assets/icon-user.svg'" alt="" />
          </ion-avatar>
          <ion-label>{{ user.displayName || user.email }}</ion-label>
          <ion-icon name="close"></ion-icon>
        </ion-chip>
      </div>

      <ion-searchbar placeholder="Buscar amigo" (ionInput)="onSearchChange($event)" inputmode="text" animated></ion-searchbar>

      <ng-container *ngIf="candidates$ | async as candidates">
        <ion-item *ngFor="let user of candidates | filtro: textoBuscar" button (click)="toggle(user)" class="candidato">
          <ion-avatar slot="start">
            <img [src]="user.photoURL || 'assets/icon-user.svg'" alt="" />
          </ion-avatar>
          <ion-label>
            <h2>{{ user.displayName || user.email }}</h2>
          </ion-label>
          <ion-icon *ngIf="isSelected(user)" slot="end" name="checkmark-circle" color="secondary"></ion-icon>
        </ion-item>

        <div class="ion-padding ion-text-center" *ngIf="candidates.length === 0">
          No hay amigos/as para añadir al grupo: o ya están todos en el grupo o todavía no sois amigos/as.
          ¿A qué esperas? ¡Mándale una petición!
        </div>
      </ng-container>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" *ngIf="selectedUsers.length > 0 && !guardando">
        <ion-fab-button color="secondary" (click)="addMembers()" class="confirmar-miembros">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class AddMembersModal implements OnInit {
  private modalController = inject(ModalController);
  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private ui = inject(UiService);

  @Input({ required: true }) group!: Group;

  candidates$: Observable<Friend[]> = of([]);
  selectedUsers: Friend[] = [];
  textoBuscar = '';
  guardando = false;

  ngOnInit(): void {
    this.candidates$ = this.authService.user$.pipe(
      switchMap((user) => (user ? this.friendsService.friends$(user.uid) : of([]))),
      map((friends) => friends.filter((friend) => !this.group.memberUids.includes(friend.uid)))
    );
  }

  isSelected(friend: Friend): boolean {
    return this.selectedUsers.some((user) => user.uid === friend.uid);
  }

  toggle(friend: Friend): void {
    if (this.isSelected(friend)) {
      this.selectedUsers = this.selectedUsers.filter((user) => user.uid !== friend.uid);
      return;
    }
    if (this.group.memberUids.length + this.selectedUsers.length >= MAX_GROUP_MEMBERS) {
      this.ui.toast(`Un grupo puede tener como máximo ${MAX_GROUP_MEMBERS} miembros`);
      return;
    }
    this.selectedUsers = [...this.selectedUsers, friend];
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }

  async addMembers(): Promise<void> {
    this.guardando = true;
    try {
      await this.groupsService.addMembers(
        this.group,
        this.selectedUsers.map((user) => user.uid)
      );
      await this.close();
    } catch (error) {
      console.error('Error añadiendo miembros', error);
      await this.ui.toast('No se pudieron añadir los miembros');
    } finally {
      this.guardando = false;
    }
  }

  close(): Promise<boolean> {
    return this.modalController.dismiss();
  }
}
