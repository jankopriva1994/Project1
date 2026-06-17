const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');

// Veřejné – bez autentizace

router.get('/posts', async (req, res) => {
  const { data, error } = await supabase.rpc('get_published_posts');
  if (error) return res.status(500).json({ error: error.message });
  res.json(Array.isArray(data) ? data : (data || []));
});

router.get('/posts/:slug', async (req, res) => {
  const { data, error } = await supabase.rpc('get_post_by_slug', { p_slug: req.params.slug });
  if (error || !data) return res.status(404).json({ error: 'Článek nenalezen' });
  res.json(data);
});

module.exports = router;
