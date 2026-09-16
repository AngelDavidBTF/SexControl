import { ActivitySnapshot, activityEvents, takeSnapshot } from './activity';
import { FapStats } from './fap.model';
import { Friend } from './friend.model';
import { myEntry } from './social';

const TODAY = new Date(2026, 8, 14);
const WEEK = '2026-09-14';

function stats(week: number): FapStats {
  return { solitario: week, compania: 0, days: { [WEEK]: { s: week } }, hours: {}, tags: {}, ratings: {}, goals: {}, v: 3 };
}

const me = (week: number) => myEntry('yo', { displayName: 'Yo', photoURL: null }, stats(week), TODAY);

function friend(week: number, extra: Partial<Friend> = {}): Friend {
  return {
    uid: 'amigo',
    displayName: 'Ana',
    email: null,
    photoURL: null,
    total: week,
    week: { key: WEEK, s: week, c: 0 },
    badges: 0,
    streak: 0,
    ...extra,
  };
}

const snapshot = (week: number, badges = 0, streak = 0): ActivitySnapshot => ({ amigo: { week, badges, streak } });

describe('activity', () => {
  it('la primera vez en un dispositivo no inventa novedades', () => {
    expect(activityEvents(null, me(0), [friend(5)], TODAY)).toEqual([]);
  });

  it('avisa de que un amigo ha sumado', () => {
    const events = activityEvents(snapshot(1), me(9), [friend(3)], TODAY);
    expect(events.length).toBe(1);
    expect(events[0].text).toBe('Ana ha sumado 2');
  });

  it('avisa cuando un amigo me adelanta', () => {
    // Antes iba por detrás de mí (1 contra mis 2) y ahora me pasa.
    const events = activityEvents(snapshot(1), me(2), [friend(4)], TODAY);
    expect(events[0].text).toBe('Ana te ha adelantado esta semana');
  });

  it('no repite el adelantamiento si ya iba por delante', () => {
    const events = activityEvents(snapshot(5), me(2), [friend(6)], TODAY);
    expect(events[0].text).toBe('Ana ha sumado una');
  });

  it('avisa de logros nuevos y de rachas a partir de 3 días', () => {
    const events = activityEvents(snapshot(0, 2, 1), me(0), [friend(0, { badges: 4, streak: 3 })], TODAY);
    expect(events.map((event) => event.emoji)).toEqual(['🏅', '🔥']);
    expect(events[0].text).toBe('Ana ha desbloqueado 2 logros');
    expect(events[1].text).toBe('Ana lleva 3 días de racha');
  });

  it('no dice nada de un amigo que no ha cambiado', () => {
    expect(activityEvents(snapshot(3, 1, 2), me(0), [friend(3, { badges: 1, streak: 2 })], TODAY)).toEqual([]);
  });

  it('ignora a los amigos que aún no estaban en la foto anterior', () => {
    expect(activityEvents({}, me(0), [friend(7)], TODAY)).toEqual([]);
  });

  it('takeSnapshot guarda lo justo para comparar', () => {
    expect(takeSnapshot([friend(3, { badges: 2, streak: 5 })], TODAY)).toEqual({ amigo: { week: 3, badges: 2, streak: 5 } });
  });

  it('quien no comparte su semana cuenta como 0, sin avisos raros', () => {
    expect(takeSnapshot([friend(0, { week: null, total: 20 })], TODAY)).toEqual({ amigo: { week: 0, badges: 0, streak: 0 } });
  });
});
