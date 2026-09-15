import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  add,
  addCircle,
  checkmarkCircle,
  chevronBack,
  chevronForward,
  personAddOutline,
  trash,
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
  add,
  'checkmark-circle': checkmarkCircle,
  'person-add-outline': personAddOutline,
  trash,
  'chevron-back': chevronBack,
  'chevron-forward': chevronForward,
});

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
