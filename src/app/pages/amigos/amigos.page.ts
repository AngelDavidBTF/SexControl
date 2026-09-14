import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Amigos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Próximamente: solicitudes de amistad, lista de amigos y grupos.</p>
    </ion-content>
  `,
})
export class AmigosPage {}
