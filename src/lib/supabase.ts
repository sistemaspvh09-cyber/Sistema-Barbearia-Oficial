import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  '';

const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder-url.supabase.co';
const supabaseAnonKey = rawKey && rawKey !== 'YOUR_SUPABASE_ANON_KEY_HERE' ? rawKey : 'placeholder-anon-key';

if (supabaseUrl.includes('placeholder')) {
  console.warn('==> Variáveis de ambiente do Supabase não encontradas ou inválidas.');
  console.warn('==> O aplicativo está rodando em modo fallback. Verifique seu arquivo .env.local ou as variáveis do Vercel.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
