const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');

// POST /api/contact – uložení kontaktní zprávy (bez autentizace)
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
