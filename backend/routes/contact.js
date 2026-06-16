const express = require('express');
const router  = require('express').Router();
const supabase = require('../lib/supabase');
const https = require('https');

function sendMailViaPhp(to, subject, html) {
  const mailerUrl = process.env.MAILER_URL || 'https://chaties.cz/mailer.php';
  const secret    = process.env.MAILER_SECRET || 'chaties-mailer-2026';
  const payload   = JSON.stringify({ to, subject, html, secret, from: 'noreply@chaties.cz' });
  return new Promise((resolve, reject) => {
    const url = new URL(mailerUrl);
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { const j = JSON.parse(data); j.success ? resolve(j) : reject(new Error(j.error)); }
        catch (e) { reject(new Error('Invalid mailer response')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Vyplňte jméno, e-mail a zprávu.' });
  }

  const { error } = await supabase
    .from('contact_messages')
    .insert({ name, email, subject: subject || '', message });

  if (error) {
    console.error('Contact insert error:', error);
    return res.status(500).json({ error: 'Zprávu se nepodařilo uložit.' });
  }

  // Odeslat notifikaci na podpora@chaties.cz
  const html = `
    <h2>Nová zpráva z kontaktního formuláře</h2>
    <p><strong>Jméno:</strong> ${name}</p>
    <p><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p>
    <p><strong>Předmět:</strong> ${subject || '–'}</p>
    <hr>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;
  sendMailViaPhp('podpora@chaties.cz', `Kontakt: ${subject || name}`, html)
    .catch(e => console.error('Contact mail error:', e.message));

  res.json({ success: true });
});

// GET /api/contact – seznam zpráv (pouze admin)
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
