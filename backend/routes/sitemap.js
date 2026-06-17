const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

// Static public pages — vždy přítomné v sitemap
const STATIC_PAGES = [
  {
    loc:        'https://chaties.cz/',
    lastmod:    '2026-06-17',
    changefreq: 'weekly',
    priority:   '1.0',
  },
  {
    loc:        'https://chaties.cz/ceny.html',
    lastmod:    '2026-06-17',
    changefreq: 'monthly',
    priority:   '0.9',
  },
  {
    loc:        'https://chaties.cz/sablony.html',
    lastmod:    '2026-06-17',
    changefreq: 'weekly',
    priority:   '0.8',
  },
  {
    loc:        'https://chaties.cz/blog.html',
    lastmod:    '2026-06-17',
    changefreq: 'weekly',
    priority:   '0.8',
  },
  {
    loc:        'https://chaties.cz/onas.html',
    lastmod:    '2026-06-17',
    changefreq: 'monthly',
    priority:   '0.6',
  },
  {
    loc:        'https://chaties.cz/kontakt.html',
    lastmod:    '2026-06-17',
    changefreq: 'monthly',
    priority:   '0.5',
  },
];

function isoToDate(isoString) {
  if (!isoString) return new Date().toISOString().split('T')[0];
  return String(isoString).split('T')[0];
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function buildUrlElement(entry) {
  return (
    '  <url>\n' +
    '    <loc>'        + escapeXml(entry.loc)  + '</loc>\n' +
    '    <lastmod>'    + entry.lastmod          + '</lastmod>\n' +
    '    <changefreq>' + entry.changefreq       + '</changefreq>\n' +
    '    <priority>'   + entry.priority         + '</priority>\n' +
    '  </url>'
  );
}

// GET /sitemap.xml
router.get('/', async (req, res) => {
  // Načti všechny publikované blog posty z Supabase
  const { data: posts, error } = await supabase.rpc('get_published_posts');

  if (error) {
    console.error('[sitemap] Supabase error:', error.message);
  }

  // Blogové URL — přidáme i pokud fetch selhal (prázdné pole)
  const blogEntries = (Array.isArray(posts) ? posts : [])
    .filter(post => post.slug)
    .map(post => ({
      loc:        'https://chaties.cz/blog-detail.html?slug=' + encodeURIComponent(post.slug),
      lastmod:    isoToDate(post.updated_at || post.created_at),
      changefreq: 'monthly',
      priority:   '0.7',
    }));

  const allEntries = [...STATIC_PAGES, ...blogEntries];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n' +
    allEntries.map(buildUrlElement).join('\n') +
    '\n\n</urlset>\n';

  res.setHeader('Content-Type',  'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

module.exports = router;
