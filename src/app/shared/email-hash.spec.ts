import { emailHash, looksLikeEmail } from './email-hash';

describe('emailHash', () => {
  // firestore.rules calcula hashing.sha256(email.lower()).toHexString().lower(): tienen que coincidir.
  it('es el SHA-256 en hexadecimal del email en minúsculas y sin espacios', async () => {
    expect(await emailHash('  Foo@Bar.COM ')).toBe('0c7e6a405862e402eb76a70f8a26fc732d07c32931e9fae9ab1582911d2e8a3b');
  });

  it('solo busca con algo que parece un email completo', () => {
    expect(looksLikeEmail('marta@gmail.com')).toBeTrue();
    expect(looksLikeEmail(' marta@gmail.com ')).toBeTrue();
    expect(looksLikeEmail('marta')).toBeFalse();
    expect(looksLikeEmail('marta@gmail')).toBeFalse();
    expect(looksLikeEmail('marta@gmail.c')).toBeFalse();
  });
});
