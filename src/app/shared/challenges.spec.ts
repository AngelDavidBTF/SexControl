import { Challenge, Friend, Poke } from './friend.model';
import { activeChallenge, challengeLabel, challengeScore, newChallenge, pokeLabels } from './challenges';
import { FapStats } from './fap.model';
import { myEntry } from './social';

// Lunes 14 de septiembre de 2026.
const TODAY = new Date(2026, 8, 14);
const NEXT_WEEK = new Date(2026, 8, 21);
const WEEK = '2026-09-14';

function stats(week: number): FapStats {
  return { solitario: week, compania: 0, days: { [WEEK]: { s: week } }, hours: {}, tags: {}, ratings: {}, goals: {}, v: 3 };
}

const me = (week: number) => myEntry('yo', { displayName: 'Yo', photoURL: null }, stats(week), TODAY);

function friend(week: number, extra: Partial<Friend> = {}): Friend {
  return {
    uid: 'amigo',
    displayName: 'Amigo',
    email: null,
    photoURL: null,
    solitario: week,
    compania: 0,
    total: week,
    week: { key: WEEK, s: week, c: 0 },
    ...extra,
  };
}

function challenge(partial: Partial<Challenge> = {}): Challenge {
  return { from: 'yo', kind: 'semana', week: WEEK, target: null, status: 'aceptado', at: null, ...partial };
}

describe('challenges', () => {
  it('newChallenge fija la semana en curso y la meta solo en las carreras', () => {
    expect(newChallenge('yo', 'semana', 5, TODAY)).toEqual(
      jasmine.objectContaining({ from: 'yo', kind: 'semana', week: WEEK, target: null, status: 'pendiente' })
    );
    expect(newChallenge('yo', 'carrera', 5, TODAY).target).toBe(5);
  });

  it('challengeLabel describe el duelo', () => {
    expect(challengeLabel(challenge())).toBe('Quién suma más esta semana');
    expect(challengeLabel(challenge({ kind: 'carrera', target: 3 }))).toBe('El primero en llegar a 3');
  });

  describe('duelo de la semana', () => {
    it('no termina mientras siga la misma semana', () => {
      const score = challengeScore(challenge(), me(3), friend(1), TODAY)!;
      expect(score).toEqual({ mine: 3, theirs: 1, finished: false, winnerUid: null });
    });

    it('al pasar la semana gana quien más sumó', () => {
      // En la semana nueva, los recuentos de la anterior ya no cuentan: 0 a 0, empate.
      expect(challengeScore(challenge(), me(3), friend(1), NEXT_WEEK)).toEqual({
        mine: 0,
        theirs: 0,
        finished: true,
        winnerUid: null,
      });
    });
  });

  describe('carrera a una meta', () => {
    const carrera = challenge({ kind: 'carrera', target: 3 });

    it('sigue abierta hasta que alguien llega', () => {
      expect(challengeScore(carrera, me(2), friend(1), TODAY)!.finished).toBeFalse();
    });

    it('la gana quien llega a la meta', () => {
      const score = challengeScore(carrera, me(3), friend(1), TODAY)!;
      expect(score.finished).toBeTrue();
      expect(score.winnerUid).toBe('yo');
    });

    it('si los dos llegan a la vez, gana quien más lleva', () => {
      expect(challengeScore(carrera, me(3), friend(4), TODAY)!.winnerUid).toBe('amigo');
    });

    it('empate si llegan con el mismo número', () => {
      expect(challengeScore(carrera, me(3), friend(3), TODAY)!.winnerUid).toBeNull();
    });
  });

  it('no se puede medir si el amigo deja de compartir su semana', () => {
    expect(challengeScore(challenge(), me(2), friend(0, { hidden: true }), TODAY)).toBeNull();
    expect(challengeScore(challenge(), me(2), friend(0, { week: null, total: 9 }), TODAY)).toBeNull();
  });

  it('activeChallenge solo devuelve los duelos vivos', () => {
    expect(activeChallenge({ amigo: challenge({ status: 'pendiente' }) }, 'amigo')).not.toBeNull();
    expect(activeChallenge({ amigo: challenge({ status: 'aceptado' }) }, 'amigo')).not.toBeNull();
    expect(activeChallenge({ amigo: challenge({ status: 'terminado' }) }, 'amigo')).toBeNull();
    expect(activeChallenge({ amigo: challenge({ status: 'rechazado' }) }, 'amigo')).toBeNull();
    expect(activeChallenge(undefined, 'amigo')).toBeNull();
  });

  describe('pokeLabels', () => {
    const poke = (partial: Partial<Poke>): Poke => ({ from: 'amigo', at: null, ...partial });

    it('resuelve el texto de un mensaje predefinido', () => {
      expect(pokeLabels(poke({ msg: 'jubilado' })).label).toContain('jubilado');
    });

    it('usa el emoji cuando es una reacción suelta', () => {
      expect(pokeLabels(poke({ emoji: '🔥' })).label).toBe('🔥');
    });

    it('no deja huecos con un mensaje desconocido', () => {
      expect(pokeLabels(poke({ msg: 'de-otra-version' })).label).toContain('toque');
    });
  });
});
