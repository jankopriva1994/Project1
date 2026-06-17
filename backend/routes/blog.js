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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.get('/render/:slug', async (req, res) => {
  const slug = req.params.slug;
  const { data: post, error } = await supabase.rpc('get_post_by_slug', { p_slug: slug });

  if (error || !post) {
    return res.status(404).send(
      '<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><title>Článek nenalezen – Chaties AI</title></head>' +
      '<body style="font-family:system-ui;background:#0d0e11;color:#e0e0e0;max-width:860px;margin:0 auto;padding:40px 24px;">' +
      '<h1>Článek nenalezen</h1><a href="https://chaties.cz/blog.html" style="color:#d0ee52;">← Zpátky na blog</a>' +
      '</body></html>'
    );
  }

  const canonicalUrl = 'https://chaties.cz/blog-detail.html?slug=' + encodeURIComponent(slug);
  const rawText = (post.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const excerpt = post.excerpt || (rawText.length > 155 ? rawText.substring(0, 152) + '…' : rawText);

  const ldArticle = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': excerpt,
    'url': canonicalUrl,
    'datePublished': post.created_at || '',
    'dateModified': post.updated_at || post.created_at || '',
    'author': { '@type': 'Organization', 'name': 'Chaties AI', '@id': 'https://chaties.cz/#organization' },
    'publisher': {
      '@type': 'Organization', 'name': 'Chaties AI', '@id': 'https://chaties.cz/#organization',
      'logo': { '@type': 'ImageObject', 'url': 'https://chaties.cz/assets/img/logo.svg' }
    },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': canonicalUrl }
  });

  const ldBreadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Domů', 'item': 'https://chaties.cz/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://chaties.cz/blog.html' },
      { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': canonicalUrl }
    ]
  });

  const safeTitle   = escapeHtml(post.title);
  const safeExcerpt = escapeHtml(excerpt);

  const html =
    '<!DOCTYPE html>\n' +
    '<html lang="cs">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + safeTitle + ' – Chaties AI</title>\n' +
    '  <meta name="description" content="' + safeExcerpt + '">\n' +
    '  <link rel="canonical" href="' + canonicalUrl + '">\n' +
    '  <meta property="og:type" content="article">\n' +
    '  <meta property="og:url" content="' + canonicalUrl + '">\n' +
    '  <meta property="og:title" content="' + safeTitle + '">\n' +
    '  <meta property="og:description" content="' + safeExcerpt + '">\n' +
    '  <meta property="og:site_name" content="Chaties.cz">\n' +
    '  <meta property="og:image" content="https://chaties.cz/assets/img/og-image.jpg">\n' +
    '  <meta name="twitter:card" content="summary_large_image">\n' +
    '  <meta name="twitter:title" content="' + safeTitle + '">\n' +
    '  <meta name="twitter:description" content="' + safeExcerpt + '">\n' +
    '  <meta name="twitter:image" content="https://chaties.cz/assets/img/og-image.jpg">\n' +
    '  <meta name="robots" content="index, follow">\n' +
    '  <script type="application/ld+json">' + ldArticle + '<\/script>\n' +
    '  <script type="application/ld+json">' + ldBreadcrumb + '<\/script>\n' +
    '  <style>\n' +
    '    *, *::before, *::after { box-sizing: border-box; }\n' +
    '    body { font-family: system-ui, -apple-system, sans-serif; background: #0d0e11; color: #e0e0e0; max-width: 860px; margin: 0 auto; padding: 40px 24px 80px; line-height: 1.7; }\n' +
    '    a { color: #d0ee52; }\n' +
    '    h1 { font-size: 2rem; color: #fff; margin-bottom: 1.5rem; line-height: 1.3; }\n' +
    '    h2, h3 { color: #fff; }\n' +
    '    .back { display: inline-block; margin-bottom: 2rem; color: #d0ee52; text-decoration: none; font-size: 0.9rem; }\n' +
    '    .note { margin-top: 3rem; padding: 12px 16px; background: rgba(208,238,82,0.07); border: 1px solid rgba(208,238,82,0.2); border-radius: 8px; font-size: 0.85rem; color: #999; }\n' +
    '    img { max-width: 100%; height: auto; border-radius: 8px; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <a class="back" href="https://chaties.cz/blog.html">← Zpátky na blog Chaties.cz</a>\n' +
    '  <h1>' + safeTitle + '</h1>\n' +
    '  <div>' + (post.content || '') + '</div>\n' +
    '  <p class="note">Tato stránka je určena pro vyhledávače. <a href="' + canonicalUrl + '">Plná verze blogu je na chaties.cz</a></p>\n' +
    '</body>\n' +
    '</html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
