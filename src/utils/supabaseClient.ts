import { createClient } from '@supabase/supabase-js';

// Limpa aspas que possam ter sido inseridas por engano nas variáveis da Netlify/Vercel
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanUrl = rawUrl.replace(/^['"]|['"]$/g, '').trim();

const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const cleanKey = rawKey.replace(/^['"]|['"]$/g, '').trim();

let client = null;

try {
  if (cleanUrl && cleanKey && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
    client = createClient(cleanUrl, cleanKey);
  } else if (cleanUrl || cleanKey) {
    console.warn('Configuração do Supabase incompleta ou com URL inválida.');
  }
} catch (error) {
  console.error('Erro na inicialização do cliente Supabase:', error);
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};
