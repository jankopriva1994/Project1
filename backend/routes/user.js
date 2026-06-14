const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

function createMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

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

  // Zkontrolujeme jestli už není v týmu
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', req.user.id)
    .eq('member_email', email)
    .maybeSingle();
  if (existing) return res.status(400).json({ error: 'Tento člen je již v týmu.' });

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      owner_id: req.user.id,
      member_email: email,
      status: 'pending',
      invite_token: token,
      invited_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const inviteUrl = `${process.env.FRONTEND_URL || 'https://chaties.cz'}/registrace.html?invite=${token}`;

  // Pošli pozvánku přes SMTP (nodemailer)
  const mailer = createMailer();
  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"Chaties AI" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Pozvánka do týmu na Chaties.cz',
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
  <h2 style="color:#111">Byli jste pozváni do týmu na <span style="color:#5a8a00">Chaties AI</span></h2>
  <p>Kliknutím na tlačítko níže přijmete pozvánku a zaregistrujete se:</p>
  <a href="${inviteUrl}" style="display:inline-block;background:#d0ee52;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:12px 0">Přijmout pozvánku</a>
  <p style="color:#888;font-size:13px;margin-top:16px">Nebo zkopírujte tento odkaz do prohlížeče:<br>${inviteUrl}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#aaa;font-size:12px">Tým Chaties AI &nbsp;·&nbsp; chaties.cz</p>
</div>`
      });
    } catch (emailErr) {
      console.error('SMTP send error:', emailErr.message);
    }
  } else {
    console.log('SMTP není nakonfigurováno – pozvánka vytvořena bez emailu:', inviteUrl);
  }

  res.json({ success: true, member: data });
});

// POST /api/user/team/accept-invite
router.post('/team/accept-invite', requireAuth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Chybí token' });

  const { data, error } = await supabase
    .from('team_members')
    .update({ status: 'active', member_id: req.user.id })
    .eq('invite_token', token)
    .eq('member_email', req.user.email)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Pozvánka nenalezena nebo již použita.' });
  res.json({ success: true, member: data });
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
