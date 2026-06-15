const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/documents – list user's documents (newest first)
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, doc_type, created_at, updated_at')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/documents/:id – get single document with content
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Dokument nenalezen' });
  res.json(data);
});

// POST /api/documents – create / auto-save document
router.post('/', requireAuth, async (req, res) => {
  const { title, content, doc_type = 'translated' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Chybí název nebo obsah' });

  const { data, error } = await supabase
    .from('documents')
    .insert({ user_id: req.user.id, title, content, doc_type })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/documents/:id – update content/title
router.patch('/:id', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error || !data) return res.status(404).json({ error: 'Dokument nenalezen' });
  res.json(data);
});

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
