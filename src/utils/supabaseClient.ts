import { createClient } from '@supabase/supabase-js';

// 1. Tenta obter do LocalStorage (configuração manual via interface)
const localUrl = localStorage.getItem('nexos_supabase_url') || '';
const localKey = localStorage.getItem('nexos_supabase_key') || '';

// 2. Fallback para variáveis de ambiente do build (Netlify/Vite)
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const rawUrl = localUrl || envUrl;
let cleanUrl = rawUrl.replace(/^['"]|['"]$/g, '').trim();

// Remove o sufixo /rest/v1/ ou /rest/v1 caso o usuário tenha colado a URL da API REST por engano
if (cleanUrl.endsWith('/rest/v1/')) {
  cleanUrl = cleanUrl.slice(0, -9);
} else if (cleanUrl.endsWith('/rest/v1')) {
  cleanUrl = cleanUrl.slice(0, -8);
}

const rawKey = localKey || envKey;
const cleanKey = rawKey.replace(/^['"]|['"]$/g, '').trim();

let client = null;

try {
  if (cleanUrl && cleanKey && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
    client = createClient(cleanUrl, cleanKey);
  }
} catch (error) {
  console.error('Erro na inicialização do cliente Supabase:', error);
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// Salva ou remove as chaves do LocalStorage e reinicia a página
export const setDynamicSupabaseConfig = (url: string, key: string) => {
  if (url.trim()) {
    localStorage.setItem('nexos_supabase_url', url.trim());
  } else {
    localStorage.removeItem('nexos_supabase_url');
  }

  if (key.trim()) {
    localStorage.setItem('nexos_supabase_key', key.trim());
  } else {
    localStorage.removeItem('nexos_supabase_key');
  }

  window.location.reload();
};
