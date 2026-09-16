// @usuario: debe coincidir con la expresión de usernames/{handle} en firestore.rules.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// Lo que escribe la persona ("@Marcos_89 ") tal como se guarda ("marcos_89").
export function normalizeUsername(text: string): string {
  return text.trim().replace(/^@+/, '').toLowerCase();
}

export function isValidUsername(handle: string): boolean {
  return USERNAME_PATTERN.test(handle);
}

// Explica qué falla, o null si vale.
export function usernameProblem(handle: string): string | null {
  if (handle.length < 3) {
    return 'Al menos 3 caracteres';
  }
  if (handle.length > 20) {
    return 'Como mucho 20 caracteres';
  }
  if (!isValidUsername(handle)) {
    return 'Solo letras sin tilde, números y _';
  }
  return null;
}

// Propuesta a partir del nombre: "Ángel David" → "angeldavid42". Sin tildes ni espacios, con dos
// cifras para que casi nunca esté cogido.
export function suggestUsername(displayName: string | null, random = Math.random): string {
  const base = (displayName ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  const digits = String(10 + Math.floor(random() * 90));
  return (base.length >= 1 ? base : 'usuario') + digits;
}

// Nombre tal como se busca: sin tildes, en minúsculas y con los espacios justos ("Ángel  David" →
// "angel david"). null si no queda nada.
export function normalizeName(name: string | null | undefined): string | null {
  const text = (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return text || null;
}
