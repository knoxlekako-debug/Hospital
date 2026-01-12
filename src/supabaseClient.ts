import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificación básica: las claves de Supabase (JWT) siempre empiezan con 'eyJ'
if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
  console.warn("ADVERTENCIA: La API_KEY configurada no parece ser una clave válida de Supabase (debería empezar con 'eyJ').");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
