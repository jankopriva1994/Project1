const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/notes/notebooks
router.get('/notebooks', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('note_notebooks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /api/notes/notebooks
router.post('/notebooks', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Chybí název záložky' });
  const { data, error } = await supabase
    .from('note_notebooks')
    .insert({ name, created_by: req.user.id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/notes/notebooks/:id
router.patch('/notebooks/:id', requireAuth, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase
    .from('note_notebooks')
    .update({ name })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/notes/notebooks/:id
router.delete('/notebooks/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('note_notebooks')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/notes?notebook_id=xxx
router.get('/', requireAuth, async (req, res) => {
  const { notebook_id } = req.query;
  let query = supabase
    .from('notes')
    .select('id, notebook_id, title, updated_at, updated_by_name')
    .order('updated_at', { ascending: false });
  if (notebook_id) query = query.eq('notebook_id', notebook_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /api/notes
router.post('/', requireAuth, async (req, res) => {
  const { notebook_id, title } = req.body;
  if (!notebook_id) return res.status(400).json({ error: 'Chybí notebook_id' });
  const userName = req.user.user_metadata?.full_name || req.user.email || 'Neznámý';
  const { data, error } = await supabase
    .from('notes')
    .insert({ notebook_id, title: title || 'Nová poznámka', content: '', updated_by_name: userName, updated_by: req.user.id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/notes/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Poznámka nenalezena' });
  res.json(data);
});

// PATCH /api/notes/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  const userName = req.user.user_metadata?.full_name || req.user.email || 'Neznámý';
  const updates = { updated_at: new Date().toISOString(), updated_by_name: userName, updated_by: req.user.id };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/notes/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
