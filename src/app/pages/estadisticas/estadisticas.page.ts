import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Estadísticas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Próximamente: estadísticas por día, semana, mes, año y generales.</p>
    </ion-content>
  `,
})
export class EstadisticasPage {}
