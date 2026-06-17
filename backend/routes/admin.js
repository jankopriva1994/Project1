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

// ── TEMPLATE CATEGORIES ────────────────────────────────────

router.get('/categories', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('template_categories')
    .select('*')
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/categories', auth, async (req, res) => {
  const { name, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Chybí název kategorie' });
  const { data, error } = await supabase
    .from('template_categories')
    .insert({ name, sort_order: sort_order || 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/categories/:id', auth, async (req, res) => {
  const { name, sort_order } = req.body;
  const { data, error } = await supabase
    .from('template_categories')
    .update({ name, sort_order })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/categories/:id', auth, async (req, res) => {
  const { error } = await supabase.from('template_categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

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
    .select('id, title, slug, excerpt, category, cover_image, is_published, published_at, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/posts', auth, async (req, res) => {
  const { title, excerpt, content, category, cover_image, is_published } = req.body;
  if (!title) return res.status(400).json({ error: 'Chybí titulek' });
  const slug = title.toLowerCase()
    .replace(/[áäà]/g, 'a').replace(/[éě]/g, 'e').replace(/[íï]/g, 'i')
    .replace(/[óö]/g, 'o').replace(/[úůü]/g, 'u').replace(/[čc]/g, 'c')
    .replace(/[šs]/g, 's').replace(/[žz]/g, 'z').replace(/[ďd]/g, 'd')
    .replace(/[ťt]/g, 't').replace(/[ňn]/g, 'n').replace(/[ř]/g, 'r')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 80);
  const { data, error } = await supabase.rpc('cms_insert_post', {
    p_title: title, p_slug: slug, p_excerpt: excerpt || null,
    p_content: content || null, p_category: category || null,
    p_cover_image: cover_image || null, p_is_published: !!is_published
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/posts/:id', auth, async (req, res) => {
  const { title, slug, excerpt, content, category, cover_image, is_published } = req.body;
  const { data, error } = await supabase.rpc('cms_update_post', {
    p_id: req.params.id, p_title: title, p_slug: slug,
    p_excerpt: excerpt || null, p_content: content || null,
    p_category: category || null, p_cover_image: cover_image || null,
    p_is_published: !!is_published
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/posts/:id', auth, async (req, res) => {
  const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── IMAGE UPLOAD ────────────────────────────────────────────

router.post('/upload', auth, async (req, res) => {
  const { base64, filename, mimeType } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: 'Chybí data' });
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const mime = mimeType || 'image/jpeg';
  if (!allowed.includes(mime)) return res.status(400).json({ error: 'Nepodporovaný formát obrázku' });
  const buffer = Buffer.from(base64, 'base64');
  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const safeName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
  const { error: upErr } = await supabase.storage
    .from('blog-images')
    .upload(safeName, buffer, { contentType: mime, upsert: false });
  if (upErr) return res.status(500).json({ error: upErr.message });
  const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(safeName);
  res.json({ url: urlData.publicUrl });
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

// ── REVIEW REQUESTS ────────────────────────────────────────────

router.get('/review-requests', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('review_requests')
    .select('id, status, created_at, user_id, profiles(email, full_name, tokens_balance)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/review-requests/:id/approve', auth, async (req, res) => {
  const REWARD = 5000;

  const { data: req_ } = await supabase
    .from('review_requests')
    .select('id, status, user_id')
    .eq('id', req.params.id)
    .single();

  if (!req_) return res.status(404).json({ error: 'Žádost nenalezena' });
  if (req_.status === 'approved') return res.status(400).json({ error: 'Již schváleno' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('tokens_balance')
    .eq('id', req_.user_id)
    .single();

  await supabase.from('profiles')
    .update({ tokens_balance: (profile?.tokens_balance || 0) + REWARD })
    .eq('id', req_.user_id);

  await supabase.from('token_transactions').insert({
    user_id: req_.user_id,
    amount: REWARD,
    type: 'bonus',
    description: 'Bonus za recenzi na Google'
  });

  await supabase.from('review_requests')
    .update({ status: 'approved' })
    .eq('id', req.params.id);

  res.json({ success: true, tokens_added: REWARD });
});

router.put('/review-requests/:id/reject', auth, async (req, res) => {
  const { error } = await supabase
    .from('review_requests')
    .update({ status: 'rejected' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
