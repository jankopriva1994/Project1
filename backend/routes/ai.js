const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Kontrola a odečet tokenů
async function deductTokens(userId, amount, description) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tokens_balance')
    .eq('id', userId)
    .single();

  if (!profile || profile.tokens_balance < amount) {
    return { ok: false, error: 'Nedostatek tokenů' };
  }

  await supabase
    .from('profiles')
    .update({ tokens_balance: profile.tokens_balance - amount })
    .eq('id', userId);

  await supabase.from('token_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: 'usage',
    description
  });

  return { ok: true };
}

// Uložení do historie
async function saveHistory(userId, type, title, content, tokensUsed, metadata = {}) {
  await supabase.from('history').insert({
    user_id: userId,
    type,
    title,
    content,
    tokens_used: tokensUsed,
    metadata
  });
}

// ── POST /api/ai/chat ──────────────────────────────────────────
router.post('/chat', requireAuth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Chybí zpráva' });

  const check = await deductTokens(req.user.id, 10, `Chat: ${message.slice(0, 50)}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  try {
    const messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Jsi AI asistent Chaties. Odpovídáš v češtině, pokud uživatel nepíše jinak. Jsi stručný, přesný a přátelský.',
      messages
    });

    const reply = response.content[0].text;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    await saveHistory(req.user.id, 'chat', message.slice(0, 80), reply, tokensUsed);

    res.json({ reply, tokens_used: tokensUsed });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chyba při generování odpovědi' });
  }
});

// ── POST /api/ai/generate ──────────────────────────────────────
router.post('/generate', requireAuth, async (req, res) => {
  const { templateSlug, fields, language = 'cs' } = req.body;
  if (!templateSlug || !fields) return res.status(400).json({ error: 'Chybí parametry' });

  const check = await deductTokens(req.user.id, 50, `Šablona: ${templateSlug}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  try {
    const { data: template } = await supabase
      .from('templates')
      .select('name, fields')
      .eq('slug', templateSlug)
      .single();

    const fieldText = Object.entries(fields)
      .map(([label, value]) => `${label}:\n${value}`)
      .join('\n\n');

    const prompt = `Vygeneruj ${template.name} na základě těchto informací:\n\n${fieldText}\n\nJazyk výstupu: ${language === 'cs' ? 'čeština' : language}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Jsi expert na tvorbu marketingových a obchodních materiálů. Vytváříš profesionální, strukturované a přesvědčivé texty. Výstup formátuj v HTML (používej <h2>, <h3>, <p>, <ul>, <li>).',
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    await saveHistory(req.user.id, 'template', template.name, content, tokensUsed, { templateSlug });

    res.json({ content, tokens_used: tokensUsed });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Chyba při generování obsahu' });
  }
});

// ── POST /api/ai/translate ─────────────────────────────────────
router.post('/translate', requireAuth, async (req, res) => {
  const { text, from = 'cs', to = 'en' } = req.body;
  if (!text) return res.status(400).json({ error: 'Chybí text k překladu' });

  const charCount = text.length;
  const tokenCost = Math.max(5, Math.ceil(charCount / 100));

  const check = await deductTokens(req.user.id, tokenCost, `Překlad ${from}→${to}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Jsi profesionální překladatel. Překládáš přesně, přirozeně a zachováváš formátování původního textu. Vrať pouze přeložený text bez komentářů.',
      messages: [{
        role: 'user',
        content: `Přelož z ${from} do ${to}:\n\n${text}`
      }]
    });

    const translated = response.content[0].text;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    await saveHistory(req.user.id, 'translate', `Překlad ${from}→${to}`, translated, tokensUsed);

    res.json({ translated, tokens_used: tokensUsed });
  } catch (err) {
    console.error('Translate error:', err);
    res.status(500).json({ error: 'Chyba při překladu' });
  }
});

// ── POST /api/ai/image ─────────────────────────────────────────
router.post('/image', requireAuth, async (req, res) => {
  const { prompt, size = '1024x1024' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Chybí popis obrázku' });

  const check = await deductTokens(req.user.id, 100, `Obrázek: ${prompt.slice(0, 50)}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'standard'
    });

    const imageUrl = response.data[0].url;

    await saveHistory(req.user.id, 'image', prompt.slice(0, 80), imageUrl, 100);

    res.json({ image_url: imageUrl });
  } catch (err) {
    console.error('Image error:', err);
    res.status(500).json({ error: 'Chyba při generování obrázku' });
  }
});

// ── GET /api/ai/templates ──────────────────────────────────────
router.get('/templates', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
