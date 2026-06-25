// supabaseConfig.js
// ----------------------------------------------------------
// Configura o Supabase usando variáveis de ambiente VITE
// ----------------------------------------------------------

// As variáveis já estão definidas em .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
// O Vite injeta essas variáveis em import.meta.env quando o código é compilado.
// Como este arquivo é carregado como <script> simples (via CDN), usamos import.meta.env se disponível,
// caso contrário caímos para as variáveis globais já definidas anteriormente.

const SUPABASE_URL = (typeof import !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) || window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (typeof import !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) || window.SUPABASE_ANON_KEY || '';

// Exponha globalmente para que data-service.js possa reutilizar
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Crie o cliente Supabase (a CDN do SDK já carregou a função createClient)
if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof createClient === 'function') {
  window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
