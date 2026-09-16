import { Group, GroupMember } from './group.model';
import { goalProgress, reigningChampion, seasonToClose, weekSummary, weeklyTitles } from './group-awards';

// Martes 15 de septiembre de 2026: semana del lunes 14, mes 09, mes anterior 08.
const TODAY = new Date(2026, 8, 15);
const WEEK = '2026-09-14';
const PREV_WEEK = '2026-09-07';
const MONTH = '2026-09';
const PREV_MONTH = '2026-08';

function member(partial: Partial<GroupMember> = {}): GroupMember {
  return { displayName: null, photoURL: null, solitario: 0, compania: 0, ...partial };
}

function group(members: Record<string, GroupMember>, extra: Partial<Group> = {}): Group {
  return {
    id: 'g1',
    name: 'Los de siempre',
    imageUrl: null,
    ownerUid: Object.keys(members)[0],
    memberUids: Object.keys(members),
    members,
    addedUids: [],
    ...extra,
  };
}

describe('group-awards', () => {
  describe('seasonToClose', () => {
    it('cierra el mes pasado con el que más sumó', () => {
      const g = group({
        a: member({ displayName: 'Ana', prevMonth: { key: PREV_MONTH, s: 5, c: 3 } }),
        b: member({ displayName: 'Beto', prevMonth: { key: PREV_MONTH, s: 2, c: 0 } }),
      });
      expect(seasonToClose(g, TODAY)).toEqual({ key: PREV_MONTH, winnerUid: 'a', winnerName: 'Ana', total: 10 });
    });

    it('usa month cuando el miembro no ha sumado desde que empezó el mes nuevo', () => {
      const g = group({ a: member({ displayName: 'Ana', month: { key: PREV_MONTH, s: 4, c: 0 } }) });
      expect(seasonToClose(g, TODAY)?.winnerUid).toBe('a');
    });

    it('no vuelve a cerrar una temporada ya guardada', () => {
      const g = group(
        { a: member({ displayName: 'Ana', prevMonth: { key: PREV_MONTH, s: 5, c: 0 } }) },
        { seasons: { [PREV_MONTH]: { winnerUid: 'a', winnerName: 'Ana', total: 5 } } }
      );
      expect(seasonToClose(g, TODAY)).toBeNull();
    });

    it('no cierra nada si nadie publicó datos de aquel mes', () => {
      const g = group({ a: member({ displayName: 'Ana', week: { key: WEEK, s: 2, c: 0 } }) });
      expect(seasonToClose(g, TODAY)).toBeNull();
    });

    it('cierra sin campeón si aquel mes nadie sumó', () => {
      const g = group({ a: member({ displayName: 'Ana', prevMonth: { key: PREV_MONTH, s: 0, c: 0 } }) });
      expect(seasonToClose(g, TODAY)).toEqual({ key: PREV_MONTH, winnerUid: null, winnerName: null, total: 0 });
    });

    it('ignora a quien no comparte sus números', () => {
      const g = group({
        a: member({ displayName: 'Ana', hidden: true, prevMonth: { key: PREV_MONTH, s: 99, c: 0 } }),
        b: member({ displayName: 'Beto', prevMonth: { key: PREV_MONTH, s: 1, c: 0 } }),
      });
      expect(seasonToClose(g, TODAY)?.winnerUid).toBe('b');
    });
  });

  it('reigningChampion devuelve el campeón del mes pasado', () => {
    const g = group({ a: member() }, { seasons: { [PREV_MONTH]: { winnerUid: 'a', winnerName: 'Ana', total: 3 } } });
    expect(reigningChampion(g, TODAY)).toBe('a');
    expect(reigningChampion(group({ a: member() }), TODAY)).toBeNull();
  });

  describe('weeklyTitles', () => {
    it('reparte MVP, remontada, constancia, desaparecido y farolillo', () => {
      const g = group({
        a: member({
          displayName: 'Ana',
          week: { key: WEEK, s: 5, c: 0 },
          prevWeek: { key: PREV_WEEK, s: 0, c: 0 },
          streak: 5,
          lastDay: '2026-09-15',
        }),
        b: member({
          displayName: 'Beto',
          week: { key: WEEK, s: 1, c: 0 },
          prevWeek: { key: PREV_WEEK, s: 3, c: 0 },
          streak: 1,
          lastDay: '2026-09-14',
        }),
        c: member({ displayName: 'Cris', week: { key: WEEK, s: 0, c: 0 }, prevWeek: { key: PREV_WEEK, s: 0, c: 0 }, lastDay: '2026-09-01' }),
      });
      const byId = Object.fromEntries(weeklyTitles(g, TODAY).map((title) => [title.id, title]));
      expect(byId['mvp'].uid).toBe('a');
      expect(byId['remontada'].uid).toBe('a');
      expect(byId['constante'].uid).toBe('a');
      expect(byId['desaparecido'].uid).toBe('c');
      expect(byId['farolillo'].uid).toBe('c');
    });

    it('no reparte nada si nadie ha sumado esta semana', () => {
      const g = group({ a: member({ displayName: 'Ana', week: { key: PREV_WEEK, s: 9, c: 0 } }) });
      expect(weeklyTitles(g, TODAY).map((t) => t.id)).not.toContain('mvp');
    });

    it('no da el farolillo cuando solo hay una persona con datos', () => {
      const g = group({ a: member({ displayName: 'Ana', week: { key: WEEK, s: 3, c: 0 } }) });
      expect(weeklyTitles(g, TODAY).map((t) => t.id)).not.toContain('farolillo');
    });

    it('solo señala como desaparecido a partir de 3 días', () => {
      const g = group({
        a: member({ displayName: 'Ana', week: { key: WEEK, s: 1, c: 0 }, lastDay: '2026-09-14' }),
        b: member({ displayName: 'Beto', week: { key: WEEK, s: 2, c: 0 }, lastDay: '2026-09-15' }),
      });
      expect(weeklyTitles(g, TODAY).map((t) => t.id)).not.toContain('desaparecido');
    });
  });

  describe('goalProgress', () => {
    const members = {
      a: member({ displayName: 'Ana', week: { key: WEEK, s: 2, c: 1 }, month: { key: MONTH, s: 6, c: 2 } }),
      b: member({ displayName: 'Beto', week: { key: WEEK, s: 1, c: 0 }, month: { key: MONTH, s: 3, c: 0 } }),
    };

    it('suma lo de todos en el periodo del objetivo', () => {
      expect(goalProgress(group(members, { goal: { period: 'semana', target: 8 } }), TODAY)).toEqual({
        period: 'semana',
        target: 8,
        current: 4,
        percent: 50,
        done: false,
      });
    });

    it('marca el objetivo cumplido y no pasa del 100 %', () => {
      const progress = goalProgress(group(members, { goal: { period: 'mes', target: 5 } }), TODAY)!;
      expect(progress.current).toBe(11);
      expect(progress.done).toBeTrue();
      expect(progress.percent).toBe(100);
    });

    it('sin objetivo no devuelve nada', () => {
      expect(goalProgress(group(members), TODAY)).toBeNull();
    });
  });

  it('weekSummary arma el resumen compartible de la semana', () => {
    const g = group({
      a: member({ displayName: 'Ana', week: { key: WEEK, s: 4, c: 0 } }),
      b: member({ displayName: 'Beto', week: { key: WEEK, s: 1, c: 1 } }),
    });
    const summary = weekSummary(g, TODAY);
    expect(summary.groupName).toBe('Los de siempre');
    expect(summary.total).toBe(6);
    expect(summary.champion).toEqual({ name: 'Ana', value: 4 });
    expect(summary.ranking.map((row) => row.name)).toEqual(['Ana', 'Beto']);
  });
});
