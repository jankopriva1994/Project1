const { createClient } = require('@supabase/supabase-js');

// Ověří JWT token z hlavičky Authorization a přidá user do req
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chybí autorizační token' });
  }

  const token = header.replace('Bearer ', '');

  // Vytvoříme klientský supabase s uživatelovým tokenem
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await supabaseUser.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Neplatný nebo expirovaný token' });
  }

  req.user = user;
  req.supabaseUser = supabaseUser;
  next();
}

module.exports = { requireAuth };
