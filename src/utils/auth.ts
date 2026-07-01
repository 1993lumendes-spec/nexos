/**
 * Utilitário de autenticação segura para o frontend.
 * Usa a Web Crypto API nativa do browser (SHA-256) para nunca armazenar
 * senhas em texto puro no LocalStorage, Supabase ou sessionStorage.
 */

/** SHA-256 da senha do administrador — nunca altere este arquivo com a senha em texto puro */
export const ADMIN_PASSWORD_HASH = '48dcfa2ce11afb859ca0d7493c9f7d00e3db79023a17224433525b6cef91bfa7';

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
