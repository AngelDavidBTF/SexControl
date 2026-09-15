import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppComponent } from './app.component';
import { firebaseConfig } from '../environments/environment';

// AppComponent inyecta servicios que dependen de Firestore y Auth, así que el test necesita la
// app de Firebase inicializada. No se conecta a la red: solo se comprueba que el componente se
// construye (los datos se piden al haber sesión, y aquí no la hay).
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, IonicModule.forRoot()],
      providers: [
        provideRouter([]),
        provideFirebaseApp(() => initializeApp(firebaseConfig, 'tests')),
        provideAuth(() => getAuth(TestBed.inject(FirebaseApp))),
        provideFirestore(() => getFirestore(TestBed.inject(FirebaseApp))),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
