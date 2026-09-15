import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  addCircle,
  arrowBack,
  arrowBackCircle,
  checkmarkOutline,
  close,
  documentText,
  enter,
  logoGoogle,
  people,
  person,
  personAdd,
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
  'person-add': personAdd,
  'checkmark-outline': checkmarkOutline,
  close,
  'arrow-back': arrowBack,
});

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
