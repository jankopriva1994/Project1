// Chaties – sdílený Supabase klient + auth helpers
const SUPABASE_URL = 'https://gbsicyhlsnufbuyqekul.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdic2ljeWhsc251ZmJ1eXFla3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTE4NDYsImV4cCI6MjA5Njk4Nzg0Nn0.ECbASzT_OY2nSSFul02dASZDvMfCLv2bZw_bmgwViEU';
const BACKEND   = 'https://project1-production-bfde.up.railway.app';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Vrátí aktuálního přihlášeného uživatele nebo null
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Vrátí JWT token pro volání backendu
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Volání backendu s autorizací
async function apiFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(BACKEND + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Chyba serveru' }));
    throw new Error(err.error || 'Chyba serveru');
  }
  return res.json();
}

// Odhlášení
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'prihlaseni.html';
}
