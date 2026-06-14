const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('content_blocks')
    .select('key, value')
    .order('key');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
