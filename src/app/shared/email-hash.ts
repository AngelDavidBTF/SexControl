// Id de emailIndex/{hash}: SHA-256 en hexadecimal del email en minúsculas. firestore.rules calcula
// lo mismo con el email del token, así que ambos lados tienen que normalizar igual.
export async function emailHash(email: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeEmail(email)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Suficiente para decidir si merece la pena buscar; no valida el email de verdad.
export function looksLikeEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text.trim());
}
