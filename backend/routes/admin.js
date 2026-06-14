const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// Admin middleware: accepts either CMS key header OR Supabase JWT + is_admin
function adminAuth(req, res, next) {
  const cmsKey = req.headers['x-cms-key'];
  if (cmsKey && process.env.ADMIN_KEY && cmsKey === process.env.ADMIN_KEY) {
    return next();
  }
  // Fall back to JWT + is_admin
  requireAuth(req, res, function (err) {
    if (err) return;
    requireAdmin(req, res, next);
  });
}

const auth = adminAuth;

// ── TEMPLATES ──────────────────────────────────────────────

router.get('/templates', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/templates', auth, async (req, res) => {
  const { slug, name, description, fields, category, sort_order, is_active, system_prompt, user_prompt } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'Chybí slug nebo name' });
  const { data, error } = await supabase
    .from('templates')
    .insert({ slug, name, description, fields: fields || [], category, sort_order: sort_order || 0, is_active: is_active !== false, system_prompt, user_prompt })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/templates/:id', auth, async (req, res) => {
  const { slug, name, description, fields, category, sort_order, is_active, system_prompt, user_prompt } = req.body;
  const { data, error } = await supabase
    .from('templates')
    .update({ slug, name, description, fields, category, sort_order, is_active, system_prompt, user_prompt, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/templates/:id', auth, async (req, res) => {
  const { error } = await supabase.from('templates').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── POSTS ──────────────────────────────────────────────────

router.get('/posts', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, is_published, published_at, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/posts', auth, async (req, res) => {
  const { title, excerpt, content, is_published } = req.body;
  if (!title) return res.status(400).json({ error: 'Chybí titulek' });
  const slug = title.toLowerCase()
    .replace(/[áäà]/g, 'a').replace(/[éě]/g, 'e').replace(/[íï]/g, 'i')
    .replace(/[óö]/g, 'o').replace(/[úůü]/g, 'u').replace(/[čc]/g, 'c')
    .replace(/[šs]/g, 's').replace(/[žz]/g, 'z').replace(/[ďd]/g, 'd')
    .replace(/[ťt]/g, 't').replace(/[ňn]/g, 'n').replace(/[ř]/g, 'r')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 80);
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title, slug, excerpt, content,
      is_published: !!is_published,
      published_at: is_published ? new Date().toISOString() : null
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/posts/:id', auth, async (req, res) => {
  const { title, slug, excerpt, content, is_published } = req.body;
  const { data: existing } = await supabase.from('posts').select('is_published').eq('id', req.params.id).single();
  const nowPublished = is_published && existing && !existing.is_published;
  const { data, error } = await supabase
    .from('posts')
    .update({
      title, slug, excerpt, content, is_published,
      published_at: nowPublished ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/posts/:id', auth, async (req, res) => {
  const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── CONTENT BLOCKS ─────────────────────────────────────────

router.get('/content', auth, async (req, res) => {
  const { data, error } = await supabase.from('content_blocks').select('*').order('key');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/content/:key', auth, async (req, res) => {
  const { value } = req.body;
  const { data, error } = await supabase
    .from('content_blocks')
    .upsert({ key: req.params.key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── USERS ──────────────────────────────────────────────────

router.get('/users', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, tokens_balance, plan, is_admin, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/users/:id/admin', auth, async (req, res) => {
  const { is_admin } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: !!is_admin })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
