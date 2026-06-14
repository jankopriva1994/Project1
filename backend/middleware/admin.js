const supabase = require('../lib/supabase');

// Ověří, zda je přihlášený uživatel admin
// Musí být použit AŽ PO requireAuth (req.user musí existovat)
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Nejste přihlášeni' });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (error || !profile) {
    return res.status(403).json({ error: 'Profil nenalezen' });
  }

  if (!profile.is_admin) {
    return res.status(403).json({ error: 'Přístup odepřen – pouze pro administrátory' });
  }

  next();
}

module.exports = { requireAdmin };
