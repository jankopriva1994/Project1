const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, tokens_balance, plan, is_admin, created_at')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/user/profile
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

// GET /api/user/history
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

// GET /api/user/subscription – aktivní nebo trial
router.get('/subscription', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .in('status', ['active', 'trialing'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || null);
});

// GET /api/user/billing
router.get('/billing', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('billing_info')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data?.billing_info || {});
});

// PATCH /api/user/billing
router.patch('/billing', requireAuth, async (req, res) => {
  const { company_name, ic, dic, address, city, zip } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ billing_info: { company_name, ic, dic, address, city, zip } })
    .eq('id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/user/team
router.get('/team', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', req.user.id)
    .order('invited_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/user/team/invite
router.post('/team/invite', requireAuth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Chybí email' });
  const token = crypto.randomBytes(20).toString('hex');
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      owner_id: req.user.id,
      email,
      status: 'pending',
      invite_token: token,
      invited_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  const inviteUrl = `${process.env.FRONTEND_URL}/registrace.html?invite=${token}`;
  res.json({ invite_url: inviteUrl, member: data });
});

// DELETE /api/user/team/:id
router.delete('/team/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
