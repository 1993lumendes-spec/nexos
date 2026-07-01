/**
 * Utilitário de autenticação segura para o frontend.
 * Usa a Web Crypto API nativa do browser (SHA-256) para nunca armazenar
 * senhas em texto puro no LocalStorage, Supabase ou sessionStorage.
 */

/** SHA-256 da senha padrão do administrador (NexosAdmin2026!) */
export const ADMIN_PASSWORD_HASH = 'cf48d524ecc5fabb84cacb95ab9ef0c723036339bce83096eec53a2a5bd9aa11';

/**
 * Gera o hash SHA-256 de uma senha usando a Web Crypto API nativa.
 * Nunca armazene senhas em texto puro — sempre aplique esta função antes.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se uma senha (texto puro) corresponde a um hash SHA-256 armazenado.
 */
export async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(plainText);
  return inputHash === storedHash;
}
