import { Component, OnInit } from '@angular/core';
import { Admob, AdmobOptions } from '@awesome-cordova-plugins/admob';


@Component({
  selector: 'app-anuncios',
  templateUrl: './anuncios.component.html',
  styleUrls: ['./anuncios.component.css']
})
export class AnunciosComponent implements OnInit {
  ngOnInit() {}
/*
  constructor(private admob: Admob) {}

  ngOnInit() {
    const admobOptions: AdmobOptions = {
      bannerAdId: 'ca-app-pub-4968034942079769/9434260988',
      isTesting: true, // Solo para pruebas
      autoShowBanner: true, // Mostrar el banner automáticamente
    };

    this.admob.setOptions(admobOptions)
      .then(() => {
        console.log('Configuración de AdMob exitosa');
        this.admob.createBannerView() // Crea el banner ad
          .then(() => console.log('Banner ad cargado'))
          .catch(error => console.error('Error al cargar el banner ad:', error));
      })
      .catch(error => console.error('Error al configurar AdMob:', error));
  }
*/
}
