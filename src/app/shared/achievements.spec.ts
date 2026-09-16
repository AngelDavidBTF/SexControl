import { AchievementContext, achievements, unlockedCount } from './achievements';
import { FapStats } from './fap.model';

const TODAY = new Date(2026, 8, 14);

function context(partial: Partial<AchievementContext> = {}): AchievementContext {
  const stats: FapStats = { solitario: 0, compania: 0, days: {}, hours: {}, tags: {}, ratings: {}, goals: {}, v: 3 };
  return { stats, friends: 0, groups: 0, today: TODAY, ...partial };
}

function byId(ctx: AchievementContext) {
  return Object.fromEntries(achievements(ctx).map((achievement) => [achievement.id, achievement]));
}

describe('achievements sociales', () => {
  it('el duelista se desbloquea con el primer duelo ganado', () => {
    expect(byId(context())['duelista'].unlocked).toBeFalse();
    expect(byId(context({ wins: 1 }))['duelista'].unlocked).toBeTrue();
    expect(byId(context({ wins: 1 }))['invicto'].unlocked).toBeFalse();
    expect(byId(context({ wins: 5 }))['invicto'].unlocked).toBeTrue();
  });

  it('campeón y tricampeón cuentan las temporadas ganadas', () => {
    expect(byId(context({ championships: 1 }))['campeon'].unlocked).toBeTrue();
    expect(byId(context({ championships: 2 }))['tricampeon'].unlocked).toBeFalse();
    expect(byId(context({ championships: 3 }))['tricampeon'].unlocked).toBeTrue();
  });

  it('muestra lo que falta en los bloqueados', () => {
    expect(byId(context({ wins: 2 }))['invicto'].progress).toBeCloseTo(0.4);
  });

  it('una cuenta recién hecha no tiene ningún logro social', () => {
    expect(unlockedCount(context())).toBe(0);
  });
});
