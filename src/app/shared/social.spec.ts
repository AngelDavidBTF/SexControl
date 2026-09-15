import { FapStats } from './fap.model';
import { Friend } from './friend.model';
import { comparison, lastActivityLabel, league, myEntry, periodValue } from './social';

// Lunes 14 de septiembre de 2026, para que las claves de semana sean estables.
const TODAY = new Date(2026, 8, 14);
const WEEK_KEY = '2026-09-14';
const PREV_WEEK_KEY = '2026-09-07';
const MONTH_KEY = '2026-09';

function stats(days: Record<string, { s?: number; c?: number }>, solitario = 0, compania = 0): FapStats {
  return { solitario, compania, days, hours: {}, tags: {}, ratings: {}, goals: {}, v: 3 };
}

function friend(uid: string, entry: Partial<Friend>): Friend {
  return { uid, displayName: uid, email: null, photoURL: null, ...entry };
}

describe('social', () => {
  describe('periodValue', () => {
    it('cuenta el periodo actual', () => {
      const entry = friend('a', { week: { key: WEEK_KEY, s: 2, c: 1 } });
      expect(periodValue(entry, 'semana', TODAY)).toBe(3);
    });

    it('trata como 0 un recuento de otra semana', () => {
      const entry = friend('a', { week: { key: '2026-09-07', s: 9, c: 9 } });
      expect(periodValue(entry, 'semana', TODAY)).toBe(0);
    });

    it('deja fuera a quien no comparte el periodo (privacidad "solo el total")', () => {
      const entry = friend('a', { total: 10, week: null, month: null });
      expect(periodValue(entry, 'semana', TODAY)).toBeNull();
      expect(periodValue(entry, 'total', TODAY)).toBe(10);
    });

    it('deja fuera a quien no comparte nada', () => {
      const entry = friend('a', { hidden: true, total: null });
      expect(periodValue(entry, 'total', TODAY)).toBeNull();
    });
  });

  describe('league', () => {
    const me = myEntry('yo', { displayName: 'Yo', photoURL: null }, stats({ [WEEK_KEY]: { s: 2 } }, 2, 0), TODAY);

    it('ordena de más a menos e incluye mi fila', () => {
      const rows = league(
        me,
        [
          friend('a', { week: { key: WEEK_KEY, s: 5, c: 0 } }),
          friend('b', { week: { key: WEEK_KEY, s: 1, c: 0 } }),
        ],
        'semana',
        TODAY
      );
      expect(rows.map((row) => row.uid)).toEqual(['a', 'yo', 'b']);
      expect(rows.map((row) => row.position)).toEqual([1, 2, 3]);
      expect(rows.find((row) => row.isMe)?.value).toBe(2);
    });

    it('comparte posición en los empates', () => {
      const rows = league(me, [friend('a', { week: { key: WEEK_KEY, s: 2, c: 0 } })], 'semana', TODAY);
      expect(rows.map((row) => row.position)).toEqual([1, 1]);
    });

    it('calcula la subida respecto a la semana anterior', () => {
      const rows = league(
        me,
        [
          friend('a', { week: { key: WEEK_KEY, s: 1, c: 0 }, prevWeek: { key: PREV_WEEK_KEY, s: 10, c: 0 } }),
          friend('b', { week: { key: WEEK_KEY, s: 0, c: 0 }, prevWeek: { key: PREV_WEEK_KEY, s: 5, c: 0 } }),
        ],
        'semana',
        TODAY
      );
      // Yo era tercero la semana pasada (0) y ahora soy primero: subo 2 puestos.
      expect(rows.find((row) => row.isMe)).toEqual(jasmine.objectContaining({ position: 1, delta: 2 }));
      expect(rows.find((row) => row.uid === 'a')).toEqual(jasmine.objectContaining({ position: 2, delta: -1 }));
    });

    it('no inventa flechas cuando nadie publica la semana anterior', () => {
      const rows = league(me, [friend('a', { week: { key: WEEK_KEY, s: 1, c: 0 } })], 'semana', TODAY);
      expect(rows.every((row) => row.delta === null)).toBeTrue();
    });

    it('excluye de la liga semanal a quien solo comparte el total', () => {
      const rows = league(me, [friend('a', { total: 99, week: null })], 'semana', TODAY);
      expect(rows.map((row) => row.uid)).toEqual(['yo']);
    });
  });

  describe('comparison', () => {
    const me = myEntry(
      'yo',
      { displayName: 'Yo', photoURL: null },
      stats({ [WEEK_KEY]: { s: 3 } }, 3, 0),
      TODAY
    );

    it('devuelve las tres filas cuando el amigo comparte todo', () => {
      const rows = comparison(
        me,
        friend('a', {
          solitario: 4,
          compania: 1,
          total: 5,
          week: { key: WEEK_KEY, s: 1, c: 0 },
          month: { key: MONTH_KEY, s: 4, c: 1 },
        }),
        TODAY
      );
      expect(rows.map((row) => row.label)).toEqual(['Esta semana', 'Este mes', 'Total']);
      expect(rows[0]).toEqual({ label: 'Esta semana', mine: 3, theirs: 1 });
      expect(rows[2]).toEqual({ label: 'Total', mine: 3, theirs: 5 });
    });

    it('solo compara el total si es lo único que comparte', () => {
      const rows = comparison(me, friend('a', { total: 7, week: null, month: null }), TODAY);
      expect(rows.map((row) => row.label)).toEqual(['Total']);
    });

    it('no compara nada con quien no comparte', () => {
      expect(comparison(me, friend('a', { hidden: true }), TODAY)).toEqual([]);
    });
  });

  describe('lastActivityLabel', () => {
    it('traduce el último día a lenguaje natural', () => {
      expect(lastActivityLabel('2026-09-14', TODAY)).toBe('hoy');
      expect(lastActivityLabel('2026-09-13', TODAY)).toBe('ayer');
      expect(lastActivityLabel('2026-09-11', TODAY)).toBe('hace 3 días');
      expect(lastActivityLabel(null, TODAY)).toBeNull();
    });
  });
});
