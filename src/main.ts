import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  addCircle,
  arrowBackCircle,
  documentText,
  enter,
  logoGoogle,
  people,
  person,
  statsChart,
} from 'ionicons/icons';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

addIcons({
  enter,
  'logo-google': logoGoogle,
  'document-text': documentText,
  'arrow-back-circle': arrowBackCircle,
  people,
  person,
  'add-circle': addCircle,
  'stats-chart': statsChart,
});

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
