const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Vrátí ID vlastníka týmu pokud je uživatel pozvaným členem, jinak vlastní ID
async function getEffectiveUserId(userId) {
  const { data } = await supabase
    .from('team_members')
    .select('owner_id')
    .eq('member_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return data?.owner_id || userId;
}

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

// Odstraní markdown code fences, <style> bloky, inline styly, class a emoji z AI výstupu
function stripMarkdownCode(text) {
  return text
    .replace(/^```(?:html|markdown|xml|)?\s*\n?/i, '')
    .replace(/\n?```\s*$/,'')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s+style\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+style\s*=\s*'[^']*'/gi, '')
    .replace(/\s+class\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+class\s*=\s*'[^']*'/gi, '')
    .replace(/\s+bgcolor\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+color\s*=\s*"[^"]*"/gi, '')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .trim();
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

  const effectiveId = await getEffectiveUserId(req.user.id);
  const check = await deductTokens(effectiveId, 10, `Chat: ${message.slice(0, 50)}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  try {
    const messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Jsi AI asistent Chaties. Odpovídáš v češtině, pokud uživatel nepíše jinak. Jsi stručný, přesný a přátelský. Pokud tě uživatel požádá o vytvoření, generování nebo úpravu obrázku, neříkej, že to neumíš. Místo toho ho zdvořile přesměruj: "Pro generování obrázků použij náš nástroj Generování obrázků – najdeš ho v levém menu. Stačí popsat, co chceš vidět, a obrázek se vytvoří automaticky." Žádné další vysvětlování ani doporučení externích nástrojů.',
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

// Definice šablon s prompty
const HTML_RULE = ' Výstup piš přímo jako čisté HTML bez jakéhokoliv formátování. Povolené tagy: <h3>, <h4>, <p>, <ul>, <li>, <ol>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>, <br>. ZAKÁZÁNO: markdown, ``` code bloky, <style> tagy, inline style="" atributy, class="" atributy, bgcolor, color atributy, emoji, ikony. Žádné atributy na tagách vůbec – jen čisté HTML tagy bez atributů.';

const TEMPLATE_DEFS = {
  'marketing': {
    name: 'Marketingový plán',
    system: 'Jsi expert na tvorbu marketingových strategií. Vytváříš profesionální, strukturované a konkrétní marketingové plány. Piš v češtině, pokud není řečeno jinak.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř detailní marketingový plán na základě těchto informací:\n\n${fields}\n\nJazyk výstupu: ${lang}. Zahrň: shrnutí situace, cíle, doporučené kanály, rozpočtové priority a měření úspěchu.`
  },
  'google-ads': {
    name: 'Google vyhledávací reklama',
    system: 'Jsi expert na Google Ads a PPC reklamu. Vytváříš přesné, přesvědčivé texty reklam dodržující limity znaků. Piš v češtině, pokud není řečeno jinak.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř 3 varianty Google vyhledávací reklamy (každá: 3 nadpisy max. 30 znaků + 2 popisky max. 90 znaků) na základě:\n\n${fields}\n\nJazyk výstupu: ${lang}. U každého nadpisu uveď počet znaků.`
  },
  'facebook-ads': {
    name: 'Reklama na Facebooku',
    system: 'Jsi expert na Facebook a Instagram reklamu. Vytváříš poutavé texty, které zaujmou v newsfeedu. Piš v češtině, pokud není řečeno jinak.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř 2 varianty Facebook reklamy (hlavní text, nadpis, popis) na základě:\n\n${fields}\n\nJazyk výstupu: ${lang}. Přidej doporučení pro cílení a formát.`
  },
  'sklik-ads': {
    name: 'Sklik vyhledávací reklama',
    system: 'Jsi expert na Sklik (Seznam.cz) PPC reklamu. Piš v češtině.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř 3 varianty Sklik vyhledávací reklamy (každá: 3 nadpisy max. 33 znaků + 1 popis max. 76 znaků) na základě:\n\n${fields}\n\nJazyk: ${lang}. U každého nadpisu uveď počet znaků.`
  },
  'youtube-ads': {
    name: 'Populární Youtube reklama',
    system: 'Jsi expert na video marketing a YouTube reklamy. Vytváříš scénáře, které zaujmou v prvních 5 sekundách. Piš v češtině, pokud není řečeno jinak.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř scénář YouTube reklamy na základě:\n\n${fields}\n\nJazyk výstupu: ${lang}. Rozděl scénář po sekundách (0-5s hook, 5-15s problém/řešení, 15-25s benefity, závěr CTA). Přidej pokyny pro vizuál.`
  },
  'webinar': {
    name: 'Témata pro prodejní webinář',
    system: 'Jsi expert na prodejní webináře a online marketing. Piš v češtině, pokud není řečeno jinak.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř 10 konkrétních témat pro prodejní webinář na základě:\n\n${fields}\n\nJazyk výstupu: ${lang}. Pro každé téma uveď název, proč přitáhne publikum a klíčový příslib pro účastníky. Přidej tipy na strukturu webináře.`
  },
  'seo-keywords': {
    name: 'Seznam klíčových slov (SEO)',
    system: 'Jsi SEO expert. Vytváříš relevantní seznamy klíčových slov pro organické vyhledávání. Piš v češtině, pokud není řečeno jinak.' + HTML_RULE,
    buildPrompt: (fields, lang) => `Vytvoř seznam 10 relevantních SEO klíčových slov na základě:\n\n${fields}\n\nJazyk výstupu: ${lang}. Rozděl na: hlavní klíčová slova a long-tail fráze. U každého uveď obtížnost (nízká/střední/vysoká) a záměr (informační/komerční/transakční).`
  }
};

// ── POST /api/ai/generate ──────────────────────────────────────
router.post('/generate', requireAuth, async (req, res) => {
  const { templateId, templateSlug, fields, language = 'cs' } = req.body;
  const tmplKey = templateId || templateSlug;
  if (!tmplKey || !fields) return res.status(400).json({ error: 'Chybí parametry' });

  const fieldText = Object.entries(fields)
    .filter(([, v]) => v && v.trim())
    .map(([label, value]) => `${label}:\n${value}`)
    .join('\n\n');

  const langLabel = language === 'cs' ? 'čeština' : language;

  // Load template from DB first, fall back to hardcoded TEMPLATE_DEFS
  let systemPrompt, userPrompt, tmplName;

  const { data: dbTmpl } = await supabase
    .from('templates')
    .select('name, system_prompt, user_prompt')
    .eq('slug', tmplKey)
    .eq('is_active', true)
    .single();

  if (dbTmpl && dbTmpl.system_prompt && dbTmpl.user_prompt) {
    tmplName     = dbTmpl.name;
    systemPrompt = dbTmpl.system_prompt;
    userPrompt   = dbTmpl.user_prompt
      .replace(/\{fields\}/g, fieldText)
      .replace(/\{language\}/g, langLabel);
  } else {
    const tmpl = TEMPLATE_DEFS[tmplKey];
    if (!tmpl) return res.status(404).json({ error: 'Šablona nenalezena' });
    tmplName     = tmpl.name;
    systemPrompt = tmpl.system;
    userPrompt   = tmpl.buildPrompt(fieldText, langLabel);
  }

  const effectiveId = await getEffectiveUserId(req.user.id);
  const check = await deductTokens(effectiveId, 50, `Šablona: ${tmplName}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const raw = response.content[0].text;
    const content = stripMarkdownCode(raw);
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    await saveHistory(req.user.id, 'template', tmplName, content, tokensUsed, { templateId: tmplKey });

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('tokens_balance')
      .eq('id', effectiveId)
      .single();

    res.json({ content, tokens_used: tokensUsed, tokens_remaining: updatedProfile?.tokens_balance ?? 0 });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Chyba při generování obsahu' });
  }
});

// ── POST /api/ai/translate ─────────────────────────────────────
router.post('/translate', requireAuth, async (req, res) => {
  const { text, from = 'cs', to = 'en', instruction = '' } = req.body;
  if (!text) return res.status(400).json({ error: 'Chybí text k překladu' });

  const charCount = text.length;
  const tokenCost = Math.max(5, Math.ceil(charCount / 100));

  const effectiveId = await getEffectiveUserId(req.user.id);
  const check = await deductTokens(effectiveId, tokenCost, `Překlad ${from}→${to}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  const systemPrompt = 'Jsi profesionální překladatel. Překládáš přesně, přirozeně a zachováváš formátování původního textu. Vrať pouze přeložený text bez komentářů a bez jakéhokoliv uvozování.'
    + (instruction ? `\n\nDodatečná instrukce od uživatele: ${instruction}` : '');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
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

// ── POST /api/ai/translate-image ───────────────────────────────
// Přeloží obrázek dokumentu přímo přes Claude vision (OCR + překlad + zachování formátování)
router.post('/translate-image', requireAuth, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', from = 'cs', to = 'en', instruction = '' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Chybí obrázek' });

  const effectiveId = await getEffectiveUserId(req.user.id);
  const check = await deductTokens(effectiveId, 50, `Překlad dokumentu (vision) ${from}→${to}`);
  if (!check.ok) return res.status(402).json({ error: check.error });

  const systemPrompt = `Jsi odborný překladatel dokumentů. Dostaneš obrázek dokumentu.
Tvým úkolem je:
1. Přečíst celý text z obrázku
2. Přeložit ho z jazyka "${from}" do jazyka "${to}"
3. Zachovat původní formátování dokumentu: podtržení, tučný text, nadpisy, oddělující čáry, strukturu odstavců, odrážky
4. Vrátit výsledek jako validní HTML s inline styly pro formátování

Pravidla pro HTML výstup:
- Podtržený text: <span style="text-decoration:underline">text</span>
- Tučný text: <strong>text</strong>
- Nadpisy sekcí: <h3 style="margin:14pt 0 4pt">text</h3>
- Odstavce: <p style="margin:0 0 6pt">text</p>
- Horizontální oddělovač: <hr style="border:none;border-top:1px solid #333;margin:12pt 0">
- Tabulky: použij <table> se stávající strukturou
- Vrať POUZE HTML kód, bez jakéhokoliv komentáře, bez markdown backticks${instruction ? '\n\nDodatečná instrukce: ' + instruction : ''}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 }
        }, {
          type: 'text',
          text: `Přelož tento dokument z ${from} do ${to} a zachovej formátování jako HTML.`
        }]
      }]
    });

    const html = response.content[0].text.replace(/^```html\n?/i, '').replace(/\n?```$/,'');
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    await saveHistory(req.user.id, 'translate', `Překlad dokumentu (vision) ${from}→${to}`, html.slice(0, 200), tokensUsed);

    res.json({ html, tokens_used: tokensUsed });
  } catch (err) {
    console.error('Translate-image error:', err);
    res.status(500).json({ error: 'Chyba při překladu dokumentu: ' + err.message });
  }
});
router.post('/image', requireAuth, async (req, res) => {
  const { prompt, size = '1024x1024' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Chybí popis obrázku' });

  const effectiveId = await getEffectiveUserId(req.user.id);

  // Check balance first, deduct only after successful generation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tokens_balance')
    .eq('id', effectiveId)
    .single();

  if (!profile || profile.tokens_balance < 100) {
    return res.status(402).json({ error: 'Nedostatek tokenů' });
  }

  try {
    // gpt-image-1 supports: 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait)
    const sizeMap = {
      '1024x1024': '1024x1024',
      '1024x1792': '1024x1536',
      '1792x1024': '1536x1024'
    };
    const imgSize = sizeMap[size] || '1024x1024';

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: imgSize
    });

    const b64 = response.data[0].b64_json;
    const imageDataUrl = `data:image/png;base64,${b64}`;

    // Deduct tokens only after success
    await supabase
      .from('profiles')
      .update({ tokens_balance: profile.tokens_balance - 100 })
      .eq('id', effectiveId);

    await supabase.from('token_transactions').insert({
      user_id: effectiveId,
      amount: -100,
      type: 'usage',
      description: `Obrázek: ${prompt.slice(0, 50)}`
    });

    await saveHistory(req.user.id, 'image', prompt.slice(0, 80), imageDataUrl, 100, { size: imgSize });

    res.json({ image_url: imageDataUrl, tokens_remaining: profile.tokens_balance - 100 });
  } catch (err) {
    console.error('Image error:', err);
    const msg = err?.error?.message || err?.message || 'Chyba při generování obrázku';
    res.status(500).json({ error: msg });
  }
});

// ── GET /api/ai/public/templates (no auth – public sablony page) ──
router.get('/public/templates', async (req, res) => {
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, name, description, category, sort_order')
    .eq('is_active', true)
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/ai/public/categories (no auth – public sablony page) ──
router.get('/public/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('template_categories')
    .select('id, name, sort_order')
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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

// ── GET /api/ai/categories ─────────────────────────────────────
router.get('/categories', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('template_categories')
    .select('id, name, sort_order')
    .order('sort_order');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
