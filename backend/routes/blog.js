const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');

// Veřejné – bez autentizace

router.get('/posts', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/posts/:slug', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('is_published', true)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Článek nenalezen' });
  res.json(data);
});

module.exports = router;
