/* ============================================================
   CHATIES RESPONSIVE.JS
   Injects: hamburger nav, responsive footer, benefits/blog grids,
            ceny plan cards, onas values grid
   ============================================================ */

(function () {
  'use strict';

  if (window.innerWidth >= 1024) return; // desktop: do nothing

  /* --------------------------------------------------------
     HELPERS
  -------------------------------------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'className') node.className = attrs[k];
      else if (k === 'innerHTML') node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (children) children.forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  /* --------------------------------------------------------
     SPACER — push content below fixed nav
  -------------------------------------------------------- */
  function injectSpacer() {
    var page = qs('.page');
    if (!page) return;
    var spacer = el('div', { className: 'r-page-spacer' });
    page.insertBefore(spacer, page.firstChild);
  }

  /* --------------------------------------------------------
     HAMBURGER NAV
  -------------------------------------------------------- */
  function injectNav() {
    var page = qs('.page');
    if (!page) return;

    // Hamburger button
    var burger = el('button', { className: 'r-hamburger', 'aria-label': 'Menu', type: 'button' }, [
      el('span'), el('span'), el('span')
    ]);

    // Nav drawer
    var drawer = el('nav', { className: 'r-nav-drawer' });

    // Collect nav links from the page
    var navItems = [
      { href: 'index.html',     text: 'AI služby',  cls: 'r-nav-active' },
      { href: 'sablony.html',   text: 'Šablony' },
      { href: 'ceny.html',      text: 'Ceny' },
      { href: 'onas.html',      text: 'O nás' },
      { href: 'blog.html',      text: 'Vše o AI' },
      { href: 'kontakt.html',   text: 'Kontakt' },
    ];

    // Detect login link presence
    var loginEl = qs('.nav-login');
    if (loginEl) {
      navItems.push({ href: 'prihlaseni.html', text: 'Přihlásit se' });
    }

    navItems.forEach(function (item) {
      var a = el('a', { href: item.href });
      a.textContent = item.text;
      if (item.cls) a.className = item.cls;
      drawer.appendChild(a);
    });

    // CTA button
    var ctaEl = qs('.nav-cta');
    var ctaHref = ctaEl ? ctaEl.getAttribute('href') : 'registrace.html';
    var ctaInner = ctaEl ? ctaEl.innerHTML : 'Vyzkoušej Chaties zdarma';
    var ctaBtn = el('a', { href: ctaHref, className: 'r-nav-cta-btn' });
    ctaBtn.innerHTML = ctaInner;
    drawer.appendChild(ctaBtn);

    // Toggle logic
    var isOpen = false;
    burger.addEventListener('click', function () {
      isOpen = !isOpen;
      burger.classList.toggle('open', isOpen);
      drawer.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    qsa('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () {
        isOpen = false;
        burger.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    document.body.appendChild(burger);
    document.body.appendChild(drawer);
  }

  /* --------------------------------------------------------
     RESPONSIVE FOOTER
  -------------------------------------------------------- */
  function injectFooter() {
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-footer')) return; // already injected

    // Gather original footer data
    var logoSrc = (qs('.footer-logo') || {}).src || 'assets/img/logo.svg';
    var descEl  = qs('.footer-desc');
    var descHTML = descEl ? descEl.innerHTML : '';

    function links(header, items) {
      var col = el('div', { className: 'r-footer-col' });
      col.appendChild(el('span', { className: 'r-footer-col-header', innerHTML: header }));
      items.forEach(function (it) {
        var a = el('a', { href: it.href || '#', innerHTML: it.text });
        col.appendChild(a);
      });
      return col;
    }

    var servicesLinks = qsa('[class*="footer-col-services-link"]');
    var infoLinks     = qsa('[class*="footer-col-info-link"]');
    var supportLinks  = qsa('[class*="footer-col-support-link"]');

    function extractLinks(els) {
      return els.map(function (e) { return { href: e.getAttribute('href'), text: e.textContent.trim() }; });
    }

    var footer = el('footer', { className: 'r-footer' });

    // Logo + desc
    var logoImg = el('img', { src: logoSrc, alt: 'Chaties', className: 'r-footer-logo' });
    var desc    = el('p',   { className: 'r-footer-desc', innerHTML: descHTML });
    footer.appendChild(logoImg);
    footer.appendChild(desc);

    // Columns
    var cols = el('div', { className: 'r-footer-cols' });
    cols.appendChild(links('Služby',                extractLinks(servicesLinks)));
    cols.appendChild(links('Důležité informace',    extractLinks(infoLinks)));
    cols.appendChild(links('Podpora',               extractLinks(supportLinks)));

    // Socials
    var instaEl = qs('.social-link-insta');
    var fbEl    = qs('.social-link-fb');
    var socials = el('div', { className: 'r-footer-socials' });
    if (instaEl) { var ia = el('a', { href: instaEl.getAttribute('href'), innerHTML: instaEl.innerHTML }); socials.appendChild(ia); }
    if (fbEl)    { var fa = el('a', { href: fbEl.getAttribute('href'),    innerHTML: fbEl.innerHTML    }); socials.appendChild(fa); }

    footer.appendChild(cols);
    footer.appendChild(socials);

    // Bottom row
    var copyrightEl = qs('.footer-copyright');
    var privacyEl   = qs('.footer-privacy');
    var bottom = el('div', { className: 'r-footer-bottom' });
    if (copyrightEl) { bottom.appendChild(el('span', { innerHTML: copyrightEl.innerHTML })); }
    if (privacyEl)   { bottom.appendChild(el('a', { href: privacyEl.getAttribute('href'), innerHTML: privacyEl.innerHTML })); }
    footer.appendChild(bottom);

    page.appendChild(footer);
  }

  /* --------------------------------------------------------
     BENEFITS GRID (index page)
  -------------------------------------------------------- */
  function injectBenefitsGrid() {
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-benefits-grid')) return;

    // Check if this page has benefits
    var benefitData = [
      { title: qs('.benefit-c1-r1-title'), text: qs('.benefit-c1-r1-text') },
      { title: qs('.benefit-c2-r1-title'), text: qs('.benefit-c2-r1-text') },
      { title: qs('.benefit-c1-r2-title'), text: qs('.benefit-c1-r2-text') },
      { title: qs('.benefit-c2-r2-title'), text: qs('.benefit-c2-r2-text') },
      { title: qs('.benefit-c1-r3-title'), text: qs('.benefit-c1-r3-text') },
      { title: qs('.benefit-c2-r3-title'), text: qs('.benefit-c2-r3-text') },
    ];

    if (!benefitData[0].title) return;

    var grid = el('div', { className: 'r-benefits-grid' });
    benefitData.forEach(function (b) {
      if (!b.title) return;
      var item = el('div', { className: 'r-benefit-item' });
      var titleSpan = el('span', { className: 'r-benefit-item-title', innerHTML: b.title.innerHTML });
      var textSpan  = el('span', { className: 'r-benefit-item-text',  innerHTML: b.text ? b.text.innerHTML : '' });
      item.appendChild(titleSpan);
      item.appendChild(textSpan);
      grid.appendChild(item);
    });

    // Insert after benefits-cta
    var cta = qs('.benefits-cta');
    if (cta && cta.parentNode) {
      cta.parentNode.insertBefore(grid, cta.nextSibling);
    }
  }

  /* --------------------------------------------------------
     BLOG CARDS (index page)
  -------------------------------------------------------- */
  function injectIndexBlogCards() {
    if (!qs('.blog-chip')) return;
    if (qs('.r-blog-cards')) return;

    var cards = [
      {
        img:   qs('.blog-img-1'),
        cat:   qs('.blog-cat-1'),
        title: qs('.blog-title-1'),
        arrow: qs('.blog-arrow-1')
      },
      {
        img:   qs('.blog-img-2'),
        cat:   qs('.blog-cat-2'),
        title: qs('.blog-title-2'),
        arrow: qs('.blog-arrow-2')
      },
      {
        img:   qs('.blog-img-3'),
        cat:   qs('.blog-cat-3'),
        title: qs('.blog-title-3'),
        arrow: qs('.blog-arrow-3')
      }
    ];

    if (!cards[0].img) return;

    var wrap = el('div', { className: 'r-blog-cards' });

    cards.forEach(function (c) {
      var card = el('div', { className: 'r-blog-card' });

      if (c.img) {
        var img = el('img', { src: c.img.src, alt: c.img.alt || '' });
        img.style.cssText = 'width:100%;height:180px;object-fit:cover;display:block;';
        card.appendChild(img);
      }

      var inner = el('div', { style: 'padding:10px 14px 14px;' });
      if (c.cat)   inner.appendChild(el('span', { style: 'display:block;font-size:11px;font-weight:700;color:#d0ee52;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;', innerHTML: c.cat.innerHTML }));
      if (c.title) inner.appendChild(el('span', { style: 'display:block;font-size:15px;font-weight:700;color:#fff;line-height:1.4;', innerHTML: c.title.innerHTML }));
      card.appendChild(inner);

      wrap.appendChild(card);
    });

    // Insert after blog-all-link
    var allLink = qs('.blog-all-link');
    if (allLink && allLink.parentNode) {
      allLink.parentNode.insertBefore(wrap, allLink.nextSibling);
    }
  }

  /* --------------------------------------------------------
     BLOG LIST GRID (blog.html)
  -------------------------------------------------------- */
  function injectBlogListGrid() {
    if (!qs('.blist-chip')) return;
    if (qs('.r-blist-grid')) return;

    var originalCards = qsa('.blist-card');
    if (!originalCards.length) return;

    var grid = el('div', { className: 'r-blist-grid' });

    originalCards.forEach(function (orig) {
      var clone = orig.cloneNode(true);
      // Reset positioning on the clone
      clone.style.cssText = '';
      grid.appendChild(clone);
    });

    // Insert after blist-subtext
    var subtext = qs('.blist-subtext');
    if (subtext && subtext.parentNode) {
      subtext.parentNode.insertBefore(grid, subtext.nextSibling);
    }

    // After inserting our grid, also move pagination after it
    var pagination = qs('.blist-pagination');
    if (pagination && pagination.parentNode) {
      grid.parentNode.insertBefore(pagination, grid.nextSibling);
    }
  }

  /* --------------------------------------------------------
     TABS BAR (index page)
  -------------------------------------------------------- */
  function injectTabsWrap() {
    var tab1 = qs('.tab-ai-chat');
    if (!tab1) return;
    if (qs('.r-tabs-wrap')) return;

    var wrap = el('div', { className: 'r-tabs-wrap' });
    ['.tab-ai-chat', '.tab-translator', '.tab-images', '.tab-documents'].forEach(function (sel) {
      var t = qs(sel);
      if (t) wrap.appendChild(t);
    });

    // Insert before ai-chat-heading
    var heading = qs('.ai-chat-heading');
    if (heading && heading.parentNode) {
      heading.parentNode.insertBefore(wrap, heading);
    }
  }

  /* --------------------------------------------------------
     CENY PLAN CARDS
  -------------------------------------------------------- */
  function injectPlanCards() {
    if (!qs('.ceny-title')) return;
    if (qs('.r-plans-grid')) return;

    var planData = [
      {
        label:   qs('.ceny-plan-label-p1'),
        price:   qs('.ceny-plan-price-p1'),
        note:    qs('.ceny-plan-note-p1'),
        cta:     qs('.ceny-plan-cta-p1'),
        features: qsa('.ceny-ftp1'),
        popular: false
      },
      {
        label:   qs('.ceny-plan-label-p2'),
        price:   qs('.ceny-plan-price-p2'),
        note:    qs('.ceny-plan-note-p2'),
        cta:     qs('.ceny-plan-cta-p2'),
        features: qsa('.ceny-ftp2'),
        popular: true
      },
      {
        label:   qs('.ceny-plan-label-p3'),
        price:   qs('.ceny-plan-price-p3'),
        note:    qs('.ceny-plan-note-p3'),
        cta:     qs('.ceny-plan-cta-p3'),
        features: qsa('.ceny-ftp3'),
        popular: false
      },
      {
        label:   qs('.ceny-plan-label-p4'),
        price:   qs('.ceny-plan-price-p4'),
        note:    qs('.ceny-plan-note-p4'),
        cta:     qs('.ceny-plan-cta-p4'),
        features: qsa('.ceny-ftp4'),
        popular: false
      }
    ];

    if (!planData[0].label) return;

    var grid = el('div', { className: 'r-plans-grid' });

    planData.forEach(function (p) {
      var card = el('div', { className: 'r-plan-card' + (p.popular ? ' r-plan-popular' : '') });

      if (p.popular) {
        card.appendChild(el('span', { className: 'r-plan-popular-badge', innerHTML: '★ Nejpopulárnější' }));
      }

      if (p.label) {
        var lbl = el('div', { style: 'font-size:13px;font-weight:700;color:#d0ee52;margin-bottom:6px;', innerHTML: p.label.innerHTML });
        card.appendChild(lbl);
      }

      if (p.price) {
        var pr = el('div', { style: 'font-size:28px;font-weight:700;color:#ffffff;margin-bottom:4px;', innerHTML: p.price.innerHTML });
        card.appendChild(pr);
      }

      if (p.note) {
        var nt = el('p', { style: 'font-size:12px;color:#8b8b8b;margin-bottom:14px;', innerHTML: p.note.innerHTML });
        card.appendChild(nt);
      }

      if (p.features.length) {
        var ul = el('ul', { className: 'r-plan-features' });
        p.features.forEach(function (ft) {
          var li = el('li');
          li.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><path d="M5 13l4 4L19 7" stroke="#d0ee52" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> ' + ft.innerHTML;
          ul.appendChild(li);
        });
        card.appendChild(ul);
      }

      if (p.cta) {
        var btn = p.cta.cloneNode(true);
        btn.style.cssText = '';
        btn.className = p.cta.className;
        card.appendChild(btn);
      }

      grid.appendChild(card);
    });

    // Insert after toggle
    var toggle = qs('.ceny-toggle');
    if (toggle && toggle.parentNode) {
      toggle.parentNode.insertBefore(grid, toggle.nextSibling);
    }
  }

  /* --------------------------------------------------------
     ONAS VALUES GRID
  -------------------------------------------------------- */
  function injectValuesGrid() {
    if (!qs('.onas-heading')) return;
    if (qs('.r-values-grid')) return;

    var values = qsa('.onas-value');
    if (!values.length) return;

    var grid = el('div', { className: 'r-values-grid' });
    values.forEach(function (v) {
      var clone = v.cloneNode(true);
      clone.style.cssText = '';
      grid.appendChild(clone);
    });

    // Insert after avatar label
    var label = qs('.onas-avatar-label');
    if (label && label.parentNode) {
      label.parentNode.insertBefore(grid, label.nextSibling);
    }
  }

  /* --------------------------------------------------------
     INIT
  -------------------------------------------------------- */
  function init() {
    injectSpacer();
    injectNav();
    injectFooter();
    injectBenefitsGrid();
    injectIndexBlogCards();
    injectTabsWrap();
    injectBlogListGrid();
    injectPlanCards();
    injectValuesGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* --------------------------------------------------------
     SOCIAL PROOF WRAPPER for ceny page
  -------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth >= 1024) return;

    var avatars = qsa('.ceny-avatar');
    var stars   = qs('.ceny-stars');
    var score   = qs('.ceny-score');
    var customers = qs('.ceny-customers');

    if (!avatars.length && !stars) return;

    var wrap = el('div', { className: 'ceny-social-proof-wrap' });
    var avatarWrap = el('div', { style: 'display:flex;align-items:center;gap:-8px;' });
    avatars.forEach(function (a) {
      var clone = a.cloneNode(true);
      clone.style.cssText = 'width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #0d0e11;margin-right:-8px;display:inline-block;';
      avatarWrap.appendChild(clone);
    });

    wrap.appendChild(avatarWrap);
    if (stars)   { var s = stars.cloneNode(true);   s.style.cssText = 'display:inline-block;height:18px;'; wrap.appendChild(s); }
    if (score)   { var sc = el('span', { style: 'font-size:14px;font-weight:700;color:#fff;', innerHTML: score.innerHTML }); wrap.appendChild(sc); }
    if (customers) { var cu = el('span', { style: 'font-size:13px;color:#8b8b8b;', innerHTML: customers.innerHTML }); wrap.appendChild(cu); }

    var toggle = qs('.ceny-toggle');
    if (toggle && toggle.parentNode) {
      toggle.parentNode.insertBefore(wrap, toggle);
    }
  });

})();
