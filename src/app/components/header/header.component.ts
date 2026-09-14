import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/" text="" color="primary"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
      </ion-toolbar>
    </ion-header>
  `,
})
export class HeaderComponent {
  @Input() titulo = '';
}
