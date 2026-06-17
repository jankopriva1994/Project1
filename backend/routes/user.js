const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const https = require('https');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// Posle email přes PHP mailer na Wedos serveru (Railway blokuje SMTP)
function sendMailViaPhp(to, subject, html) {
  const mailerUrl = process.env.MAILER_URL || 'https://chaties.cz/mailer.php';
  const secret    = process.env.MAILER_SECRET || 'chaties-mailer-2026';
  const payload   = JSON.stringify({ to, subject, html, secret, from: 'noreply@chaties.cz' });

  return new Promise((resolve, reject) => {
    const url = new URL(mailerUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { const j = JSON.parse(data); j.success ? resolve(j) : reject(new Error(j.error || 'mailer error')); }
        catch (e) { reject(new Error('Invalid mailer response')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Mailer request timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
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

  // Pokud je uživatel členem týmu, zobraz tokeny vlastníka
  const { data: membership } = await supabase
    .from('team_members')
    .select('owner_id')
    .eq('member_id', req.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membership?.owner_id) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('tokens_balance')
      .eq('id', membership.owner_id)
      .single();
    if (ownerProfile) data.tokens_balance = ownerProfile.tokens_balance;
  }

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
  // Auto-delete image history older than 14 days
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from('history')
    .delete()
    .eq('user_id', req.user.id)
    .eq('type', 'image')
    .lt('created_at', cutoff);

  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100);
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
  // Zjistí, jestli je uživatel vlastník nebo pozvaný člen
  const { data: membership } = await supabase
    .from('team_members')
    .select('owner_id')
    .eq('member_id', req.user.id)
    .eq('status', 'active')
    .maybeSingle();

  // Pokud je pozvaný člen → zobraz celý tým svého vlastníka
  const ownerId = membership?.owner_id || req.user.id;

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', ownerId)
    .order('invited_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  // Přidej info o vlastníkovi týmu
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', ownerId)
    .single();

  res.json({ members: data, owner: ownerProfile, is_member: !!membership });
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

  // Odpovíme hned – email pošleme na pozadí
  res.json({ success: true, member: data });

  // Pošli pozvánku přes PHP mailer na Wedos (neblokuje response)
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
  <h2 style="color:#111">Byli jste pozváni do týmu na <span style="color:#5a8a00">Chaties AI</span></h2>
  <p>Kliknutím na tlačítko níže přijmete pozvánku a zaregistrujete se:</p>
  <a href="${inviteUrl}" style="display:inline-block;background:#d0ee52;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:12px 0">Přijmout pozvánku</a>
  <p style="color:#888;font-size:13px;margin-top:16px">Nebo zkopírujte tento odkaz do prohlížeče:<br>${inviteUrl}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#aaa;font-size:12px">Tým Chaties AI &nbsp;·&nbsp; chaties.cz</p>
</div>`;

  sendMailViaPhp(email, 'Pozvánka do týmu na Chaties.cz', html)
    .then(() => console.log('Pozvánka odeslána na:', email))
    .catch(err => console.error('Mailer error:', err.message));
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

  // Nastav pozvanému uživateli plan 'team' – přeskočí výběr tarifu
  await supabase.from('profiles').update({ plan: 'team' }).eq('id', req.user.id);

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

// ── POST /api/user/review-request ─────────────────────────────
router.post('/review-request', requireAuth, async (req, res) => {
  const { reviewer_name } = req.body;
  if (!reviewer_name || !reviewer_name.trim()) {
    return res.status(400).json({ error: 'Zadej jméno z Google recenze.' });
  }
  const name = reviewer_name.trim();

  // Check if this user already submitted
  const { data: byUser } = await supabase
    .from('review_requests')
    .select('id, status')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (byUser) {
    const msg = byUser.status === 'approved'
      ? 'Tokeny již byly přidány, děkujeme za recenzi!'
      : 'Vaše žádost již čeká na schválení.';
    return res.status(400).json({ error: msg });
  }

  // Check if this reviewer name was already approved (catches multi-account abuse)
  const { data: byName } = await supabase
    .from('review_requests')
    .select('id')
    .ilike('reviewer_name', name)
    .eq('status', 'approved')
    .maybeSingle();

  if (byName) {
    return res.status(400).json({ error: 'Toto jméno bylo již dříve odměněno.' });
  }

  const { error } = await supabase
    .from('review_requests')
    .insert({ user_id: req.user.id, reviewer_name: name, status: 'pending' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
