import { isValidUsername, normalizeName, normalizeUsername, suggestUsername, usernameProblem } from './username';

describe('@usuario', () => {
  it('se normaliza quitando la arroba, los espacios y las mayúsculas', () => {
    expect(normalizeUsername('  @Marcos_89 ')).toBe('marcos_89');
    expect(normalizeUsername('@@lucia')).toBe('lucia');
  });

  it('solo admite minúsculas sin tilde, números y _, de 3 a 20', () => {
    expect(isValidUsername('marcos_89')).toBeTrue();
    expect(isValidUsername('ab')).toBeFalse();
    expect(isValidUsername('lucía')).toBeFalse();
    expect(isValidUsername('marcos.89')).toBeFalse();
    expect(isValidUsername('a'.repeat(21))).toBeFalse();
    expect(usernameProblem('ab')).toBe('Al menos 3 caracteres');
    expect(usernameProblem('lucía')).toBe('Solo letras sin tilde, números y _');
    expect(usernameProblem('lucia')).toBeNull();
  });

  it('el nombre se busca sin tildes ni mayúsculas', () => {
    expect(normalizeName('  Ángel   David ')).toBe('angel david');
    expect(normalizeName('   ')).toBeNull();
    expect(normalizeName(null)).toBeNull();
  });

  it('propone uno válido a partir del nombre', () => {
    expect(suggestUsername('Ángel David', () => 0.4)).toBe('angeldavid46');
    expect(suggestUsername(null, () => 0)).toBe('usuario10');
    expect(isValidUsername(suggestUsername('José María Pérez-Llorente de la Fuente'))).toBeTrue();
  });
});
