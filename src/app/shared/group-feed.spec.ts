import { FeedItem } from './group.model';
import { feedText } from './group-feed';

function item(partial: Partial<FeedItem>): FeedItem {
  return { from: 'a', kind: 'mensaje', at: null, ...partial };
}

describe('group-feed', () => {
  it('resuelve un mensaje predefinido', () => {
    const { text, discreto } = feedText('Ana', item({ msg: 'floja' }));
    expect(text).toContain('Ana');
    expect(text).toContain('Semana floja');
    expect(discreto).not.toContain('😴');
  });

  it('no deja huecos con un mensaje de otra versión', () => {
    expect(feedText('Ana', item({ msg: 'inventado' })).text).toBe('Ana ha dicho algo');
  });

  it('cuenta los adelantamientos', () => {
    expect(feedText('Ana', item({ kind: 'adelanta', msg: 'Beto' })).text).toContain('ha adelantado a Beto');
    expect(feedText('Ana', item({ kind: 'adelanta', msg: null })).text).toContain('a alguien');
  });

  it('cuenta rachas, campeonatos y objetivos con texto neutro para el modo discreto', () => {
    expect(feedText('Ana', item({ kind: 'racha', msg: '5' })).text).toContain('5 días de racha');
    expect(feedText('Ana', item({ kind: 'racha', msg: '5' })).discreto).not.toContain('5');
    expect(feedText('Ana', item({ kind: 'campeon', msg: 'agosto' })).text).toContain('ha ganado agosto');
    expect(feedText('Ana', item({ kind: 'objetivo' })).text).toContain('objetivo');
  });
});
