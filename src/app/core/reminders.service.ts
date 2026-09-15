import { Injectable, inject } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addDays, parseISO } from 'date-fns';
import { DayBuckets } from '../shared/fap.model';
import { bucketTotal } from '../shared/stats';
import { SettingsService } from './settings.service';

const REMINDER_ID = 1001;

const MESSAGES = [
  '¿Se te ha olvidado apuntar algo? 😏',
  'Hace unos días que no apuntas nada. ¿Todo bien? 👀',
  'Tu racha te echa de menos 🔥',
];

// Recordatorio local (sin servidor ni coste): "llevas N días sin apuntar nada". Se reprograma
// cada vez que cambian los datos o los ajustes. En la app nativa llega aunque esté cerrada; en
// el navegador solo mientras la pestaña siga abierta.
@Injectable({
  providedIn: 'root',
})
export class RemindersService {
  private settings = inject(SettingsService);

  async requestPermission(): Promise<boolean> {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') {
        return true;
      }
      return (await LocalNotifications.requestPermissions()).display === 'granted';
    } catch {
      return false;
    }
  }

  async reschedule(days: DayBuckets): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
      const { enabled, days: gap, hour } = this.settings.reminders();
      if (!enabled || (await LocalNotifications.checkPermissions()).display !== 'granted') {
        return;
      }
      const at = nextReminder(days, gap, hour, new Date());
      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_ID,
            title: this.settings.discreet().enabled ? 'Notas' : 'SexControl',
            body: this.settings.discreet().enabled ? 'Tienes algo pendiente' : MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
            schedule: { at, allowWhileIdle: true },
          },
        ],
      });
    } catch (error) {
      console.warn('No se pudo programar el recordatorio', error);
    }
  }
}

// Día del último registro + `gap` días, a la hora elegida; nunca antes de dentro de un minuto.
export function nextReminder(days: DayBuckets, gap: number, hour: number, now: Date): Date {
  const lastKey = Object.keys(days)
    .filter((key) => bucketTotal(days[key]) > 0)
    .sort()
    .pop();
  const base = lastKey ? parseISO(lastKey) : now;
  const at = addDays(base, gap);
  at.setHours(hour, 0, 0, 0);
  const soonest = new Date(now.getTime() + 60_000);
  if (at > soonest) {
    return at;
  }
  // Ya han pasado los días: se avisa hoy a esa hora, o mañana si ya pasó.
  const today = new Date(now);
  today.setHours(hour, 0, 0, 0);
  return today > soonest ? today : addDays(today, 1);
}
