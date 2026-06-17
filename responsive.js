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

    // Nav background bar
    var navBg = el('div', { className: 'r-nav-bg' });
    document.body.appendChild(navBg);

    // Logo (visible on mobile alongside hamburger)
    var logoLink = el('a', { href: 'index.html', className: 'r-nav-logo-link' });
    var logoImg  = el('img', { src: 'assets/img/logo.svg', alt: 'Chaties', className: 'r-nav-logo-img' });
    logoLink.appendChild(logoImg);
    document.body.appendChild(logoLink);

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

    // Hide original absolutely-positioned elements (now replaced by the grid)
    var hideSelectors = [
      '.benefit-c1-r1-title','.benefit-c1-r1-text',
      '.benefit-c2-r1-title','.benefit-c2-r1-text',
      '.benefit-c1-r2-title','.benefit-c1-r2-text',
      '.benefit-c2-r2-title','.benefit-c2-r2-text',
      '.benefit-c1-r3-title','.benefit-c1-r3-text',
      '.benefit-c2-r3-title','.benefit-c2-r3-text',
      '.benefits-div-c1-r1','.benefits-div-c1-r2','.benefits-div-c1-r3',
      '.benefits-div-c2-r1','.benefits-div-c2-r2','.benefits-div-c2-r3',
      '.benefits-divider-left','.benefits-divider-right'
    ];
    hideSelectors.forEach(function (sel) {
      var el = qs(sel);
      if (el) el.style.display = 'none';
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
     MOBILE INDEX PAGE (buildIndexMobile)
  -------------------------------------------------------- */
  function buildIndexMobile() {
    if (!qs('.hero-headline')) return;

    var featImgSrc       = (qs('.features-img-small')     || {}).src || '';
    var waveImgSrc       = (qs('.hero-wave')               || {}).src || '';
    var logoE15Src       = (qs('.logo-e15')               || {}).src || '';
    var logoAktualneSrc  = (qs('.logo-aktualne')          || {}).src || '';
    var logoPodnikatelSrc= (qs('.logo-podnikatel-left')   || {}).src || '';
    var blogImg1Src      = (qs('.blog-img-1')             || {}).src || '';
    var blogImg2Src      = (qs('.blog-img-2')             || {}).src || '';

    qs('.page').style.display = 'none';

    var html =
      '<section class="rim-hero">' +
        '<h1 class="rim-hero-heading">' +
          'Tvořte obsah <span class="rim-accent">s nejrychlejší umělou inteligencí</span> na pár kliknutí' +
        '</h1>' +
        '<p class="rim-hero-sub">' +
          '<strong><span class="rim-accent">Chaties.cz</span></strong> je nejrychlejší kompletní platforma s umělou inteligencí, generujte obsah na své sociální sítě, marketingové kampaně, pracovní e-maily nebo školní práce.' +
        '</p>' +
        '<a href="registrace.html" class="rim-cta-btn">' +
          'Vyzkoušej <span class="rim-accent">Chaties</span> zdarma' +
        '</a>' +
      '</section>' +

      '<div class="rim-wave-wrap">' +
        '<img class="rim-hero-wave" src="' + waveImgSrc + '" alt="" />' +
      '</div>' +

      '<section class="rim-features">' +
        '<h2 class="rim-features-heading">' +
          '<span class="rim-accent">Unikátní nástroj,</span> pro správu vaší kampaní, psaní článků a chytlavých popisků' +
        '</h2>' +
        '<p class="rim-features-sub">' +
          '<strong><span class="rim-accent">Chaties.cz</span></strong> je nejrychlejší kompletní platforma' +
        '</p>' +
        '<img class="rim-features-img" src="' + featImgSrc + '" alt="Feature screenshot" />' +
      '</section>' +

      '<div class="rim-logos">' +
        '<img class="rim-logo-item" src="' + logoE15Src + '" alt="e15" />' +
        '<img class="rim-logo-item" src="' + logoAktualneSrc + '" alt="Aktuálně" />' +
        '<img class="rim-logo-item" src="' + logoPodnikatelSrc + '" alt="Podnikatel" />' +
      '</div>' +

      '<section class="rim-benefits">' +
        '<h2 class="rim-benefits-heading">' +
          'Chci rozjet svůj<br><span class="rim-accent">business naplno!</span>' +
        '</h2>' +
        '<p class="rim-benefits-desc">' +
          'Naše AI služby ti pomohou nejen ušetřit čas, ale především zefektivnit tvé podnikání. Ať už jsi freelancer, firma nebo start-up, AI dokáže přinést výsledky, které by jinak zabraly hodiny práce.' +
        '</p>' +
        '<a href="registrace.html" class="rim-cta-btn">' +
          'Vyzkoušej <span class="rim-accent">Chaties</span> zdarma' +
        '</a>' +
      '</section>' +

      '<div class="rim-benefits-grid">' +
        '<div class="rim-bg-item">' +
          '<span class="rim-bg-title">Obsah, který konvertuje</span>' +
          '<span class="rim-bg-text">Tvořte obsah, který Vám vydělá peníze</span>' +
        '</div>' +
        '<div class="rim-bg-item">' +
          '<span class="rim-bg-title">Ušetřete čas i peníze</span>' +
          '<span class="rim-bg-text">Bez grafika, bez překladatele, prostě hned</span>' +
        '</div>' +
        '<div class="rim-bg-item">' +
          '<span class="rim-bg-title">Vše na jednom místě</span>' +
          '<span class="rim-bg-text">AI chat, obrázky, překlady, dokumenty</span>' +
        '</div>' +
        '<div class="rim-bg-item">' +
          '<span class="rim-bg-title">Stále nové funkce</span>' +
          '<span class="rim-bg-text">Chaties se neustále vyvíjí, abyste měli vždy přístup k nejnovějším AI technologiím</span>' +
        '</div>' +
        '<div class="rim-bg-item">' +
          '<span class="rim-bg-title">AI podnikání</span>' +
          '<span class="rim-bg-text">AI nástroje, které zrychlí, zjednoduší a zefektivní vaše podnikání</span>' +
        '</div>' +
        '<div class="rim-bg-item">' +
          '<span class="rim-bg-title">Pro práci i zábavu</span>' +
          '<span class="rim-bg-text">Univerzální pomocník pro každého</span>' +
        '</div>' +
      '</div>' +

      '<div class="rim-divider"></div>' +

      '<section class="rim-nl-intro">' +
        '<h2 class="rim-nl-intro-heading">' +
          '<span class="rim-accent">Chceš být první</span>, kdo se dozví o chystaných novinkách?' +
        '</h2>' +
        '<p class="rim-nl-intro-sub">' +
          '<span class="rim-accent">Přihlaš svůj odběr</span> a buď mezi prvními, kdo bude vědět o chystaných novinkách.' +
        '</p>' +
      '</section>' +

      '<section class="rim-ai-services">' +
        '<div class="rim-ai-item">' +
          '<span class="rim-ai-pill">AI CHAT</span>' +
          '<h3 class="rim-ai-heading"><span class="rim-accent">Chytrý společník,</span>který nikdy nespí</h3>' +
          '<p class="rim-ai-desc">Objevte kouzlo chytré konverzace! Naše AI Chaties jsou připraveni kdykoli pomoci, pobavit, poradit nebo inspirovat. Osobní asistenti, kreativní společníci i odborní poradci – vše v jednom chatu, 24/7. Přidejte se k revoluci komunikace ještě dnes!</p>' +
        '</div>' +
        '<div class="rim-ai-item">' +
          '<span class="rim-ai-pill">AI PŘEKLADAČ</span>' +
          '<h3 class="rim-ai-heading"><span class="rim-accent">Překládejte bez hranic,</span>rychle a přesně</h3>' +
          '<p class="rim-ai-desc">AI překladač zvládá desítky jazyků v reálném čase. Ať překládáte e-maily, dokumenty nebo celé weby – výsledek je přirozený, přesný a okamžitý. Žádné zpoždění, žádné jazykové bariéry.</p>' +
        '</div>' +
        '<div class="rim-ai-item">' +
          '<span class="rim-ai-pill">AI GENEROVÁNÍ OBRÁZKŮ</span>' +
          '<h3 class="rim-ai-heading"><span class="rim-accent">Z textu na obrázek</span>za pár sekund</h3>' +
          '<p class="rim-ai-desc">Popište, co si představujete, a AI to za vás nakreslí. Unikátní ilustrace, produktové fotografie nebo grafické podklady pro sociální sítě – generujte desítky originálních obrázků na jeden klik.</p>' +
        '</div>' +
        '<div class="rim-ai-item">' +
          '<span class="rim-ai-pill">AI DOKUMENTY</span>' +
          '<h3 class="rim-ai-heading"><span class="rim-accent">Dokumenty hotové</span>za minuty, ne hodiny</h3>' +
          '<p class="rim-ai-desc">Vytvářejte, shrnujte a upravujte dokumenty s pomocí AI. Zprávy, smlouvy, prezentace nebo školní práce – AI Dokumenty vám ušetří hodiny práce každý den a výsledky budou vždy profesionální.</p>' +
        '</div>' +
      '</section>' +

      '<div class="rim-divider"></div>' +

      '<section class="rim-blog">' +
        '<h2 class="rim-blog-heading">' +
          '<span class="rim-accent">Aktuální informace,</span> Blog, features a další.' +
        '</h2>' +
        '<p class="rim-blog-sub">Zde najdete nejaktuálnější informace ze světa AI a chaties.cz</p>' +
        '<div class="rim-blog-card">' +
          '<img class="rim-blog-img" src="' + blogImg1Src + '" alt="Blog 1" />' +
          '<div class="rim-blog-card-body">' +
            '<span class="rim-blog-cat">Blog</span>' +
            '<div class="rim-blog-title-row">' +
              '<span class="rim-blog-title"><span class="rim-accent">Máme nový vzhled</span> webových stránek a administrace</span>' +
              '<svg class="rim-blog-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rim-blog-card">' +
          '<img class="rim-blog-img" src="' + blogImg2Src + '" alt="Blog 2" />' +
          '<div class="rim-blog-card-body">' +
            '<span class="rim-blog-cat">Features</span>' +
            '<div class="rim-blog-title-row">' +
              '<span class="rim-blog-title"><span class="rim-accent">Přidána nová funkce</span> – převádění obrázků do textů</span>' +
              '<svg class="rim-blog-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<a href="blog.html" class="rim-blog-all">Všechny články</a>' +
      '</section>' +

      '<section class="rim-newsletter">' +
        '<h2 class="rim-nl-heading">' +
          '<span class="rim-accent">Chceš být první</span>, kdo se dozví o chystaných novinkách?' +
        '</h2>' +
        '<p class="rim-nl-sub">' +
          '<span class="rim-accent">Přihlaš svůj odběr</span> a buď mezi prvními, kdo bude vědět o chystaných novinkách.' +
        '</p>' +
        '<input class="newsletter-input rim-nl-input" type="email" placeholder="Emailová adresa" />' +
        '<button class="newsletter-btn rim-nl-btn">Odebírat</button>' +
      '</section>' +

      '<footer class="rim-footer">' +
        '<img class="rim-footer-logo" src="assets/img/logo.svg" alt="Chaties" />' +
        '<p class="rim-footer-desc">' +
          '<span class="rim-accent">Chaties.cz</span> patří mezi špičku v AI službách v Česku. <span class="rim-accent">Pomáháme firmám růst díky chytrým technologiím,</span> které šetří čas, zvyšují efektivitu a otevírají nové možnosti.' +
        '</p>' +
        '<div class="rim-footer-cols">' +
          '<div class="rim-footer-col">' +
            '<span class="rim-footer-col-hdr">Služby</span>' +
            '<a href="#">Generování obrázků</a>' +
            '<a href="#">AI Překladač</a>' +
            '<a href="#">Překlady dokumentů</a>' +
            '<a href="#">AI Chat</a>' +
          '</div>' +
          '<div class="rim-footer-col">' +
            '<span class="rim-footer-col-hdr">Důležité informace</span>' +
            '<a href="#">O nás</a>' +
            '<a href="#">Kontakt</a>' +
            '<a href="#">Obchodní podmínky</a>' +
            '<a href="#">Blog</a>' +
          '</div>' +
          '<div class="rim-footer-col">' +
            '<span class="rim-footer-col-hdr">Podpora</span>' +
            '<a href="mailto:marketing@chaties.cz">marketing@chaties.cz</a>' +
            '<a href="mailto:podpora@chaties.cz">podpora@chaties.cz</a>' +
          '</div>' +
        '</div>' +
        '<div class="rim-footer-socials">' +
          '<a href="#" class="rim-social">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="white" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="white"/></svg>' +
            'Instagram' +
          '</a>' +
          '<a href="#" class="rim-social">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" stroke-width="1.5"/><path d="M13 8h2V6h-2a3 3 0 0 0-3 3v1H8v2h2v6h2v-6h2l.5-2H12V9a1 1 0 0 1 1-1z" fill="white"/></svg>' +
            'Facebook' +
          '</a>' +
        '</div>' +
        '<div class="rim-footer-bottom">' +
          '<span>© 2026 Chaties AI software. All rights reserved</span>' +
          '<a href="#">Zásady ochrany osobních údajů</a>' +
        '</div>' +
      '</footer>';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-index-mobile';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }

  /* --------------------------------------------------------
     SHARED MOBILE FOOTER HTML
  -------------------------------------------------------- */
  function mobileFooterHtml() {
    return (
      '<footer class="rim-footer">' +
        '<img class="rim-footer-logo" src="assets/img/logo.svg" alt="Chaties" />' +
        '<p class="rim-footer-desc">' +
          '<span class="rim-accent">Chaties.cz</span> patří mezi špičku v AI službách v Česku. <span class="rim-accent">Pomáháme firmám růst díky chytrým technologiím,</span> které šetří čas, zvyšují efektivitu a otevírají nové možnosti.' +
        '</p>' +
        '<div class="rim-footer-cols">' +
          '<div class="rim-footer-col">' +
            '<span class="rim-footer-col-hdr">Služby</span>' +
            '<a href="#">Generování obrázků</a>' +
            '<a href="#">AI Překladač</a>' +
            '<a href="#">Překlady dokumentů</a>' +
            '<a href="#">AI Chat</a>' +
          '</div>' +
          '<div class="rim-footer-col">' +
            '<span class="rim-footer-col-hdr">Důležité informace</span>' +
            '<a href="onas.html">O nás</a>' +
            '<a href="kontakt.html">Kontakt</a>' +
            '<a href="#">Obchodní podmínky</a>' +
            '<a href="blog.html">Blog</a>' +
          '</div>' +
          '<div class="rim-footer-col">' +
            '<span class="rim-footer-col-hdr">Podpora</span>' +
            '<a href="mailto:marketing@chaties.cz">marketing@chaties.cz</a>' +
            '<a href="mailto:podpora@chaties.cz">podpora@chaties.cz</a>' +
          '</div>' +
        '</div>' +
        '<div class="rim-footer-socials">' +
          '<a href="#" class="rim-social">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="white" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="white"/></svg>' +
            'Instagram' +
          '</a>' +
          '<a href="#" class="rim-social">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" stroke-width="1.5"/><path d="M13 8h2V6h-2a3 3 0 0 0-3 3v1H8v2h2v6h2v-6h2l.5-2H12V9a1 1 0 0 1 1-1z" fill="white"/></svg>' +
            'Facebook' +
          '</a>' +
        '</div>' +
        '<div class="rim-footer-bottom">' +
          '<span>© 2026 Chaties AI software. All rights reserved</span>' +
          '<a href="#">Zásady ochrany osobních údajů</a>' +
        '</div>' +
      '</footer>'
    );
  }

  /* --------------------------------------------------------
     BLOG LISTING – MOBILE
  -------------------------------------------------------- */
  function buildBlogMobile() {
    if (!qs('.blist-heading')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-blog-mobile')) return;

    // Extract cards from desktop before hiding page
    var desktopCards = qsa('.blist-card');
    var cardsHtml = '';
    desktopCards.forEach(function(card) {
      var img   = qs('.blist-card-img', card);
      var cat   = qs('.blist-card-cat', card);
      var title = qs('.blist-card-title', card);
      var href  = card.getAttribute('href') || 'blog-detail.html';
      var imgSrc   = img   ? img.src : '';
      var catText  = cat   ? cat.textContent.trim() : '';
      var titleHtml = title ? title.innerHTML.replace(/<br\s*\/?>/gi, ' ') : '';

      cardsHtml +=
        '<a class="rblog-card" href="' + href + '">' +
          '<img class="rblog-card-img" src="' + imgSrc + '" alt="" />' +
          '<div class="rblog-card-body">' +
            '<span class="rblog-card-cat">' + catText + '</span>' +
            '<div class="rblog-card-title-row">' +
              '<span class="rblog-card-title">' + titleHtml + '</span>' +
              '<svg class="rblog-card-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
          '</div>' +
        '</a>';
    });

    page.style.display = 'none';

    var html =
      '<section class="rblog-hero">' +
        '<h1 class="rblog-heading">Aktuální informace,<br>blog, features a další</h1>' +
        '<p class="rblog-sub">Zde najdete nejaktuálnější informace<br>ze světa AI a chaties.cz</p>' +
      '</section>' +
      '<div class="rblog-cards">' + cardsHtml + '</div>' +
      '<a class="rblog-more" href="#">Další články</a>' +
      mobileFooterHtml();

    var wrapper = document.createElement('div');
    wrapper.className = 'r-blog-mobile';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }

  /* --------------------------------------------------------
     BLOG DETAIL – MOBILE
  -------------------------------------------------------- */
  function buildBlogDetailMobile() {
    if (!qs('.bdetail-title')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-blog-detail-mobile')) return;

    // Extract title & body from desktop
    var titleEl   = qs('.bdetail-title');
    var articleEl = qs('.bdetail-article');
    var titleHtml = titleEl ? titleEl.innerHTML : '';

    // Extract only <p> tags from article (skip the back link)
    var bodyHtml = '';
    if (articleEl) {
      var paras = qsa('p', articleEl);
      paras.forEach(function(p) { bodyHtml += '<p class="rbdetail-para">' + p.innerHTML + '</p>'; });
    }

    page.style.display = 'none';

    var html =
      '<article class="rbdetail-article">' +
        '<h1 class="rbdetail-title">' + titleHtml + '</h1>' +
        bodyHtml +
        '<a class="rbdetail-back" href="blog.html">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#d0ee52" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          'Zpátky na výpis článků' +
        '</a>' +
      '</article>' +
      mobileFooterHtml();

    var wrapper = document.createElement('div');
    wrapper.className = 'r-blog-detail-mobile';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }


  function init() {
    injectSpacer();
    injectNav();
    buildIndexMobile();
    buildBlogMobile();
    buildBlogDetailMobile();
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
