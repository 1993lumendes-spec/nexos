/**
 * Utilitário de autenticação segura para o frontend.
 * Usa a Web Crypto API nativa do browser (SHA-256) para nunca armazenar
 * senhas em texto puro no LocalStorage, Supabase ou sessionStorage.
 */

/** SHA-256 da senha do administrador — nunca altere este arquivo com a senha em texto puro */
export const ADMIN_PASSWORD_HASH = '14fe2fe5d97cc2a0f5e40e1704dd53d12f5bdef48a5b185a82e1829febc4592b';

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
 * Também suporta comparação em texto puro caso o banco de dados armazene a senha dessa forma.
 */
export async function verifyPassword(plainText: string, storedHashOrPlain: string): Promise<boolean> {
  if (plainText === storedHashOrPlain) return true;
  const inputHash = await hashPassword(plainText);
  return inputHash === storedHashOrPlain;
}
