const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/user/profile – profil + zůstatek tokenů
router.get('/profile', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, tokens_balance, plan, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/user/profile – aktualizace jména
router.patch('/profile', requireAuth, async (req, res) => {
  const { full_name } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/user/history – historie generování
router.get('/history', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/user/subscription – aktivní předplatné
router.get('/subscription', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || null);
});

// GET /api/user/team – tým uživatele
router.get('/team', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', req.user.id)
    .order('invited_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
