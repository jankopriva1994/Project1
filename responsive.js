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

    // Drawer heading
    var drawerHead = el('div', { className: 'r-nav-drawer-head',
      innerHTML: '<p class="r-nav-drawer-title"><span class="rim-accent">Nejlepší česká</span><br>AI aplikace zdarma!</p>'
    });
    drawer.appendChild(drawerHead);

    // Nav links
    var navItems = [
      { href: 'index.html',     text: 'Domů',     cls: 'r-nav-active' },
      { href: 'sablony.html',   text: 'Šablony' },
      { href: 'ceny.html',      text: 'Ceny' },
      { href: 'onas.html',      text: 'O nás' },
      { href: 'blog.html',      text: 'Vše o AI' },
      { href: 'kontakt.html',   text: 'Kontakt' },
    ];

    navItems.forEach(function (item) {
      var a = el('a', { href: item.href });
      a.textContent = item.text;
      if (item.cls) a.className = item.cls;
      drawer.appendChild(a);
    });

    // CTA button (green fill)
    var ctaEl = qs('.nav-cta');
    var ctaHref = ctaEl ? ctaEl.getAttribute('href') : 'registrace.html';
    var ctaBtn = el('a', { href: ctaHref, className: 'r-nav-cta-btn' });
    ctaBtn.textContent = 'Vyzkoušej Chaties zdarma';
    drawer.appendChild(ctaBtn);

    // Login button (border style)
    var loginEl = qs('.nav-login');
    if (loginEl) {
      var loginBtn = el('a', { href: 'prihlaseni.html', className: 'r-nav-login-btn' });
      loginBtn.textContent = 'Přihlásit se';
      drawer.appendChild(loginBtn);
    }

    // Podpora section
    var podporaHead = el('span', { className: 'r-nav-support-hdr' });
    podporaHead.textContent = 'Podpora';
    drawer.appendChild(podporaHead);

    var supportLinks = [
      qs('.footer-col-support-link1'),
      qs('.footer-col-support-link2'),
      qs('.footer-col-support-link3')
    ];
    supportLinks.forEach(function (s) {
      if (!s) return;
      var a = el('a', { href: s.getAttribute('href'), className: 'r-nav-support-link' });
      a.textContent = s.textContent.trim();
      drawer.appendChild(a);
    });

    // Social links
    var socials = el('div', { className: 'r-nav-socials' });
    var instaEl2 = qs('.social-link-insta');
    var fbEl2    = qs('.social-link-fb');
    if (instaEl2) {
      var ia = el('a', { href: instaEl2.getAttribute('href') || '#', className: 'r-nav-social-link', innerHTML: instaEl2.innerHTML });
      socials.appendChild(ia);
    }
    if (fbEl2) {
      var fa = el('a', { href: fbEl2.getAttribute('href') || '#', className: 'r-nav-social-link', innerHTML: fbEl2.innerHTML });
      socials.appendChild(fa);
    }
    drawer.appendChild(socials);

    // Toggle logic
    var isOpen = false;
    burger.addEventListener('click', function () {
      isOpen = !isOpen;
      burger.classList.toggle('open', isOpen);
      drawer.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on nav link click
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
        '<div id="rimBlogCards"></div>' +
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

    var BLOG_API = 'https://project1-production-bfde.up.railway.app';
    var BLOG_PH  = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='373' height='226'%3E%3Crect width='373' height='226' fill='%231a1b2e'/%3E%3C/svg%3E";
    fetch(BLOG_API + '/api/blog/posts')
      .then(function(r) { return r.json(); })
      .then(function(posts) {
        var container = document.getElementById('rimBlogCards');
        if (!container || !Array.isArray(posts)) return;
        var out = '';
        posts.slice(0, 2).forEach(function(post) {
          out +=
            '<a class="rim-blog-card" href="blog-detail.html?slug=' + encodeURIComponent(post.slug) + '" style="text-decoration:none;display:block">' +
              '<img class="rim-blog-img" src="' + (post.cover_image || BLOG_PH) + '" alt="" />' +
              '<div class="rim-blog-card-body">' +
                '<span class="rim-blog-cat">' + (post.category || 'Blog') + '</span>' +
                '<div class="rim-blog-title-row">' +
                  '<span class="rim-blog-title">' + post.title + '</span>' +
                  '<svg class="rim-blog-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '</div>' +
              '</div>' +
            '</a>';
        });
        container.innerHTML = out;
      })
      .catch(function() {});
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
     KONTAKT – MOBILE
  -------------------------------------------------------- */
  function buildKontaktMobile() {
    if (!qs('.ktk-heading')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-kontakt-mobile')) return;

    // Clone form and support rows from desktop before hiding
    var formClone    = qs('.ktk-form-box') ? qs('.ktk-form-box').cloneNode(true) : null;
    var emailRow     = qs('.ktk-support-email')  ? qs('.ktk-support-email').cloneNode(true)  : null;
    var phoneRow     = qs('.ktk-support-phone')  ? qs('.ktk-support-phone').cloneNode(true)  : null;
    var hoursRow     = qs('.ktk-support-hours')  ? qs('.ktk-support-hours').cloneNode(true)  : null;
    var waveImgSrc   = (qs('.ktk-wave') || {}).src || '';

    page.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-kontakt-mobile';

    wrapper.innerHTML =
      '<section class="rktk-hero">' +
        '<h1 class="rktk-heading">' +
          '<span class="rim-accent">Máte dotazy</span> nebo<br>' +
          'potřebujete poradit<br>' +
          's AI Chaties?' +
        '</h1>' +
        '<p class="rktk-support-label">Zákaznická podpora</p>' +
      '</section>';

    // Support rows
    var supportWrap = document.createElement('div');
    supportWrap.className = 'rktk-support';
    if (emailRow) { emailRow.className = 'rktk-row'; supportWrap.appendChild(emailRow); }
    if (phoneRow) { phoneRow.className = 'rktk-row'; supportWrap.appendChild(phoneRow); }
    if (hoursRow) { hoursRow.className = 'rktk-row'; supportWrap.appendChild(hoursRow); }
    wrapper.appendChild(supportWrap);

    // Form
    if (formClone) {
      formClone.className = 'rktk-form';

      // Remove checkbox from GDPR row — replace with plain text + side-by-side layout
      var gdprRow = formClone.querySelector('.ktk-gdpr-row');
      var submitBtn = formClone.querySelector('.ktk-submit');
      if (gdprRow && submitBtn) {
        // Remove the checkbox input
        var chk = gdprRow.querySelector('input[type="checkbox"]');
        if (chk) chk.parentNode.removeChild(chk);
        // Change label text to Figma version
        var lbl = gdprRow.querySelector('.ktk-gdpr-label');
        if (lbl) {
          lbl.innerHTML = 'Odesláním této zprávy souhlasím se <a href="obchodni-podminky.html" class="ktk-gdpr-link">zpracováním osobních údajů</a> za účelem odpovědi na můj dotaz.';
        }
        // Wrap GDPR text + button in a row
        var gdprBtnRow = document.createElement('div');
        gdprBtnRow.className = 'rktk-gdpr-btn-row';
        gdprRow.parentNode.removeChild(gdprRow);
        submitBtn.parentNode.removeChild(submitBtn);
        gdprBtnRow.appendChild(gdprRow);
        gdprBtnRow.appendChild(submitBtn);
        formClone.appendChild(gdprBtnRow);
      }

      wrapper.appendChild(formClone);
    }

    // Wave image
    if (waveImgSrc) {
      var waveWrap = document.createElement('div');
      waveWrap.className = 'r-mobile-wave-wrap';
      var waveImg = document.createElement('img');
      waveImg.src = waveImgSrc;
      waveImg.alt = '';
      waveImg.className = 'r-mobile-wave-img';
      waveWrap.appendChild(waveImg);
      wrapper.appendChild(waveWrap);
    }

    // Footer
    var footerDiv = document.createElement('div');
    footerDiv.innerHTML = mobileFooterHtml();
    wrapper.appendChild(footerDiv.firstChild);

    document.body.appendChild(wrapper);
  }

  /* --------------------------------------------------------
     BLOG LISTING – MOBILE
  -------------------------------------------------------- */
  function buildBlogMobile() {
    if (!qs('.blist-heading')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-blog-mobile')) return;

    page.style.display = 'none';

    var html =
      '<section class="rblog-hero">' +
        '<h1 class="rblog-heading">Aktuální informace,<br>blog, features a další</h1>' +
        '<p class="rblog-sub">Zde najdete nejaktuálnější informace<br>ze světa AI a chaties.cz</p>' +
      '</section>' +
      '<div class="rblog-cards" id="rblogCardsList"></div>' +
      mobileFooterHtml();

    var wrapper = document.createElement('div');
    wrapper.className = 'r-blog-mobile';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    var API = 'https://project1-production-bfde.up.railway.app';
    var PH  = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='373' height='226'%3E%3Crect width='373' height='226' fill='%231a1b2e'/%3E%3C/svg%3E";
    fetch(API + '/api/blog/posts')
      .then(function(r) { return r.json(); })
      .then(function(posts) {
        var container = document.getElementById('rblogCardsList');
        if (!container || !Array.isArray(posts)) return;
        var out = '';
        posts.forEach(function(post) {
          out +=
            '<a class="rblog-card" href="blog-detail.html?slug=' + encodeURIComponent(post.slug) + '">' +
              '<img class="rblog-card-img" src="' + (post.cover_image || PH) + '" alt="" />' +
              '<div class="rblog-card-body">' +
                '<span class="rblog-card-cat">' + (post.category || 'Blog') + '</span>' +
                '<div class="rblog-card-title-row">' +
                  '<span class="rblog-card-title">' + post.title + '</span>' +
                  '<svg class="rblog-card-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '</div>' +
              '</div>' +
            '</a>';
        });
        container.innerHTML = out;
      })
      .catch(function() {});
  }

  /* --------------------------------------------------------
     BLOG DETAIL – MOBILE
  -------------------------------------------------------- */
  function buildBlogDetailMobile() {
    if (!qs('.bdetail-title')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-blog-detail-mobile')) return;

    page.style.display = 'none';

    var html =
      '<article class="rbdetail-article">' +
        '<h1 class="rbdetail-title" id="rbdetailTitle"></h1>' +
        '<div id="rbdetailBody"></div>' +
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

    var slug = new URLSearchParams(location.search).get('slug');
    if (!slug) return;
    var API = 'https://project1-production-bfde.up.railway.app';
    fetch(API + '/api/blog/posts/' + encodeURIComponent(slug))
      .then(function(r) { return r.json(); })
      .then(function(post) {
        var titleEl = document.getElementById('rbdetailTitle');
        var bodyEl  = document.getElementById('rbdetailBody');
        if (titleEl) titleEl.textContent = post.title || '';
        if (bodyEl)  bodyEl.innerHTML    = post.content || '';
      })
      .catch(function() {});
  }


  /* --------------------------------------------------------
     SABLONY – MOBILE
  -------------------------------------------------------- */
  function buildSablonyMobile() {
    if (!qs('.sabl-heading')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-sablony-mobile')) return;

    var headingEl  = qs('.sabl-heading');
    var subtitleEl = qs('.sabl-subtitle');
    var waveImgSrc = (qs('.sabl-wave') || {}).src || '';

    page.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-sablony-mobile';

    wrapper.innerHTML =
      '<section class="rsabl-hero">' +
        '<h1 class="rsabl-heading">' + (headingEl ? headingEl.innerHTML : '') + '</h1>' +
        '<p class="rsabl-subtitle">' + (subtitleEl ? subtitleEl.textContent.trim() : '') + '</p>' +
      '</section>' +
      '<div class="rsabl-filters-wrap">' +
        '<select class="rsabl-filter-select" id="rsablFilterSelect"><option value="">Všechny kategorie</option></select>' +
      '</div>' +
      '<div class="rsabl-cards-wrap" id="rsablCards"></div>' +
      (waveImgSrc ? '<img class="rsabl-wave" src="' + waveImgSrc + '" alt="" />' : '');

    // Append footer
    var footerDiv = document.createElement('div');
    footerDiv.innerHTML = mobileFooterHtml();
    wrapper.appendChild(document.createRange().createContextualFragment(wrapper.innerHTML));
    wrapper.innerHTML = '';

    var heroSection = el('section', { className: 'rsabl-hero',
      innerHTML: '<h1 class="rsabl-heading">' + (headingEl ? headingEl.innerHTML : '') + '</h1>' +
                 '<p class="rsabl-subtitle">' + (subtitleEl ? subtitleEl.textContent.trim() : '') + '</p>'
    });
    wrapper.appendChild(heroSection);

    var filtersWrap = el('div', { className: 'rsabl-filters-wrap' });
    var filterSelect = el('select', { className: 'rsabl-filter-select', id: 'rsablFilterSelect' });
    var defaultOpt = el('option', { value: '' });
    defaultOpt.textContent = 'Všechny kategorie';
    filterSelect.appendChild(defaultOpt);
    filtersWrap.appendChild(filterSelect);
    wrapper.appendChild(filtersWrap);

    var mobileCardsWrap = el('div', { className: 'rsabl-cards-wrap', id: 'rsablCards' });
    wrapper.appendChild(mobileCardsWrap);

    if (waveImgSrc) {
      var waveWrap2 = document.createElement('div');
      waveWrap2.className = 'r-mobile-wave-wrap';
      var waveImg2 = document.createElement('img');
      waveImg2.src = waveImgSrc;
      waveImg2.alt = '';
      waveImg2.className = 'r-mobile-wave-img';
      waveWrap2.appendChild(waveImg2);
      wrapper.appendChild(waveWrap2);
    }

    footerDiv.innerHTML = mobileFooterHtml();
    wrapper.appendChild(footerDiv.firstChild);

    document.body.appendChild(wrapper);

    // Sync desktop filter pills → mobile select
    var desktopFiltersEl = document.getElementById('sablFilters');
    var mobileSelect     = document.getElementById('rsablFilterSelect');
    var mobileCards      = document.getElementById('rsablCards');

    function syncFilters() {
      var pills = desktopFiltersEl ? qsa('.sabl-dyn-pill', desktopFiltersEl) : [];
      if (!pills.length) return;
      // Build select options from pills
      var html = '';
      pills.forEach(function (p) {
        html += '<option value="' + p.textContent + '">' + p.textContent + '</option>';
      });
      mobileSelect.innerHTML = html;
      // Auto-select and trigger first category once
      if (!mobileSelect._autoSelected) {
        mobileSelect._autoSelected = true;
        mobileSelect.value = pills[0].textContent;
        pills[0].click();
      }
    }

    function syncCards() {
      var desktopCardsEl = document.getElementById('sablCards');
      if (!desktopCardsEl) return;
      var cards = qsa('.sabl-dyn-card', desktopCardsEl);
      mobileCards.innerHTML = '';
      if (!cards.length) return;
      cards.forEach(function (c) {
        var clone = c.cloneNode(true);
        clone.addEventListener('click', function () { window.location.href = 'prihlaseni.html'; });
        mobileCards.appendChild(clone);
      });
    }

    if (desktopFiltersEl) {
      var fObs = new MutationObserver(syncFilters);
      fObs.observe(desktopFiltersEl, { childList: true, subtree: true });
    }

    var desktopCardsEl = document.getElementById('sablCards');
    if (desktopCardsEl) {
      var cObs = new MutationObserver(syncCards);
      cObs.observe(desktopCardsEl, { childList: true, subtree: true });
    }

    mobileSelect.addEventListener('change', function () {
      var val = this.value;
      if (!desktopFiltersEl) return;
      var pills = qsa('.sabl-dyn-pill', desktopFiltersEl);
      pills.forEach(function (p) {
        if ((!val && p === pills[0]) || p.textContent === val) {
          p.click();
        }
      });
    });
  }

  /* --------------------------------------------------------
     CENY – MOBILE (full page)
  -------------------------------------------------------- */
  function buildCenyMobile() {
    if (!qs('.ceny-title')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-ceny-mobile')) return;

    var waveImgSrc  = (qs('.ceny-wave')  || {}).src || 'assets/img/auth_wave.png';
    var starsImgSrc = (qs('.ceny-stars') || {}).src || '';
    var titleEl     = qs('.ceny-title');
    var subtitleEl  = qs('.ceny-subtitle');
    var bannerEl    = qs('.ceny-banner-text');

    var planData = [1, 2, 3, 4].map(function(n) {
      var priceAmtEl = qs('.ceny-plan-price-p' + n + ' .ceny-price-amount');
      var noteEl     = qs('.ceny-plan-note-p' + n);
      var labelEl    = qs('.ceny-plan-label-p' + n);
      return {
        tokens:       labelEl    ? labelEl.innerHTML : '',
        priceMonthly: priceAmtEl ? (priceAmtEl.getAttribute('data-monthly') || priceAmtEl.textContent) : '',
        priceAnnual:  priceAmtEl ? (priceAmtEl.getAttribute('data-annual')  || '') : '',
        noteMonthly:  noteEl     ? (noteEl.getAttribute('data-monthly') || noteEl.textContent) : '',
        noteAnnual:   noteEl     ? (noteEl.getAttribute('data-annual')  || '') : '',
        popular:      n === 2
      };
    });

    // Features from plan 4 (most complete — matches Figma values)
    var features4 = qsa('.ceny-ftp4');

    page.style.display = 'none';

    // Build plan groups — each plan wrapped in its own div for proper spacing
    var planKeys = ['starter', 'popular', 'pro', 'enterprise'];
    var plansHtml = '';
    planData.forEach(function(p, i) {
      plansHtml +=
        '<div class="rceny-plan-group">' +
          '<p class="rceny-plan-tokens">' + p.tokens + '</p>' +
          '<div class="rceny-plan-card' + (p.popular ? ' rceny-plan-popular' : '') + '">' +
            (p.popular ? '<div class="rceny-popular-banner">★ NEJPOPULÁRNĚJŠÍ ★</div>' : '') +
            '<div class="rceny-plan-price">' +
              '<span class="rceny-price-amount" data-monthly="' + p.priceMonthly + '" data-annual="' + p.priceAnnual + '">' + p.priceMonthly + '</span>' +
              '<span class="rceny-price-sep"> /</span><span class="rceny-price-unit">měsíc</span>' +
            '</div>' +
            '<p class="rceny-plan-note" data-monthly="' + p.noteMonthly + '" data-annual="' + p.noteAnnual + '">' + p.noteMonthly + '</p>' +
            '<button class="rceny-plan-cta" data-plan="' + planKeys[i] + '">Chci to zkusit!</button>' +
          '</div>' +
        '</div>';
    });

    var featHtml = '';
    features4.forEach(function(ft) {
      featHtml +=
        '<li class="rceny-feature-item">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><path d="M5 13l4 4L19 7" stroke="#d0ee52" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          ft.innerHTML +
        '</li>';
    });

    var wrapper = document.createElement('div');
    wrapper.className = 'r-ceny-mobile';
    wrapper.innerHTML =
      '<section class="rceny-hero">' +
        '<h1 class="rceny-heading">' + (titleEl ? titleEl.innerHTML.replace('</span>', '</span><br>') : '') + '</h1>' +
        '<p class="rceny-subtitle">' + (subtitleEl ? subtitleEl.textContent.trim() : '') + '</p>' +
      '</section>' +
      (bannerEl ? '<div class="rceny-banner">' + bannerEl.innerHTML + '</div>' : '') +
      '<div class="rceny-social-proof">' +
        '<div class="rceny-stars-row">' +
          (starsImgSrc ? '<img class="rceny-stars-img" src="' + starsImgSrc + '" alt="★★★★☆" />' : '') +
          '<span class="rceny-score">5.0</span>' +
        '</div>' +
        '<span class="rceny-customers">Od 4,000 zákazníků</span>' +
      '</div>' +
      '<div class="rceny-toggle-wrap">' +
        '<div class="rceny-toggle" id="rcenyToggle">' +
          '<div class="rceny-pill"></div>' +
          '<span class="rceny-toggle-monthly">Měsíčně</span>' +
          '<span class="rceny-toggle-annual">' +
            '<span class="rceny-toggle-annual-label">Roční platba</span>' +
            '<span class="rceny-toggle-annual-save">Ušetři 15%</span>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="rceny-plans">' + plansHtml + '</div>' +
      (featHtml ?
        '<section class="rceny-features">' +
          '<h2 class="rceny-features-heading">Co všechno máte<br><span class="rceny-fh-white">v našich tarifech?</span></h2>' +
          '<ul class="rceny-features-list">' + featHtml + '</ul>' +
        '</section>'
      : '');

    if (waveImgSrc) {
      var waveWrap = document.createElement('div');
      waveWrap.className = 'r-mobile-wave-wrap';
      var waveImg = document.createElement('img');
      waveImg.src = waveImgSrc; waveImg.alt = ''; waveImg.className = 'r-mobile-wave-img';
      waveWrap.appendChild(waveImg);
      wrapper.appendChild(waveWrap);
    }

    var footerDiv = document.createElement('div');
    footerDiv.innerHTML = mobileFooterHtml();
    wrapper.appendChild(footerDiv.firstChild);

    document.body.appendChild(wrapper);

    // Toggle
    var mToggle = document.getElementById('rcenyToggle');
    if (mToggle) {
      mToggle.addEventListener('click', function() {
        var annual = mToggle.classList.toggle('annual-active');
        qsa('.rceny-price-amount', wrapper).forEach(function(a) {
          a.textContent = annual ? (a.getAttribute('data-annual') || a.textContent) : a.getAttribute('data-monthly');
        });
        qsa('.rceny-plan-note', wrapper).forEach(function(n) {
          n.textContent = annual ? (n.getAttribute('data-annual') || n.textContent) : n.getAttribute('data-monthly');
        });
      });
    }

    qsa('.rceny-plan-cta', wrapper).forEach(function(btn) {
      btn.addEventListener('click', function() { window.location.href = 'registrace.html'; });
    });
  }

  /* --------------------------------------------------------
     ONAS – MOBILE (full page)
  -------------------------------------------------------- */
  function buildOnasMobile() {
    if (!qs('.onas-heading')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-onas-mobile')) return;

    var waveImgSrc = (qs('.onas-wave') || {}).src || 'assets/img/auth_wave.png';
    var headingEl  = qs('.onas-heading');
    var textEl     = qs('.onas-text');
    var values     = qsa('.onas-value');

    page.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-onas-mobile';
    wrapper.innerHTML =
      '<section class="ronas-hero">' +
        '<h1 class="ronas-heading">' + (headingEl ? headingEl.innerHTML : '') + '</h1>' +
        '<p class="ronas-text">' + (textEl ? textEl.textContent.trim().replace(/\s+/g, ' ') : '') + '</p>' +
      '</section>';

    var valuesWrap = el('div', { className: 'ronas-values' });
    values.forEach(function(v) {
      var iconEl  = qs('.onas-value-icon', v);
      var titleEl = qs('.onas-value-title', v);
      var descEl  = qs('.onas-value-desc', v);

      var item   = el('div', { className: 'ronas-value-item' });
      var header = el('div', { className: 'ronas-value-header' });
      if (iconEl) header.appendChild(el('div', { className: 'ronas-value-icon-wrap', innerHTML: iconEl.innerHTML }));
      if (titleEl) header.appendChild(el('h3', { className: 'ronas-value-title', innerHTML: titleEl.innerHTML }));
      item.appendChild(header);
      if (descEl) item.appendChild(el('p', { className: 'ronas-value-desc', innerHTML: descEl.innerHTML }));
      valuesWrap.appendChild(item);
    });
    wrapper.appendChild(valuesWrap);

    if (waveImgSrc) {
      var waveWrap = document.createElement('div');
      waveWrap.className = 'r-mobile-wave-wrap';
      var waveImg = document.createElement('img');
      waveImg.src = waveImgSrc; waveImg.alt = ''; waveImg.className = 'r-mobile-wave-img';
      waveWrap.appendChild(waveImg);
      wrapper.appendChild(waveWrap);
    }

    var footerDiv = document.createElement('div');
    footerDiv.innerHTML = mobileFooterHtml();
    wrapper.appendChild(footerDiv.firstChild);

    document.body.appendChild(wrapper);
  }

  /* --------------------------------------------------------
     AUTH SHARED SVG ICONS
  -------------------------------------------------------- */
  var AUTH_GOOGLE_SVG = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 13.676 17.64 11.668 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A9.003 9.003 0 0 0 0 9c0 1.452.348 2.826.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294A5.354 5.354 0 0 1 9 3.58z" fill="#EA4335"/></svg>';
  var AUTH_APPLE_SVG  = '<svg width="16" height="19" viewBox="0 0 16 19" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M13.173 10.035c-.02-2.045 1.675-3.024 1.75-3.074C13.884 5.1 11.8 4.847 11.04 4.826c-1.63-.167-3.197.966-4.025.966-.842 0-2.135-.948-3.51-.92C1.88 4.9.349 5.956-.418 7.55c-1.565 2.72-.402 6.74 1.12 8.942.741 1.072 1.625 2.275 2.783 2.232 1.122-.046 1.543-.725 2.895-.725 1.34 0 1.72.725 2.896.703 1.206-.021 1.969-1.088 2.703-2.163.856-1.236 1.208-2.44 1.227-2.503-.026-.01-2.35-.902-2.374-3.001h-.659zM10.15 3.175C10.74 2.45 11.145 1.44 11.03.43c-.873.04-1.943.585-2.569 1.294-.561.635-1.047 1.661-.913 2.64.97.076 1.963-.5 2.602-1.189z"/></svg>';
  var AUTH_EYE_SVG    = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="opacity:0.4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1.5"/></svg>';

  function rauthSocialRow(dividerText) {
    return (
      '<div class="rauth-divider-wrap">' +
        '<div class="rauth-divider-line"></div>' +
        '<span class="rauth-divider-text">' + dividerText + '</span>' +
        '<div class="rauth-divider-line"></div>' +
      '</div>' +
      '<div class="rauth-social-row">' +
        '<a href="#" class="rauth-social-btn rauth-google">' + AUTH_GOOGLE_SVG + '<span>Google</span></a>' +
        '<a href="#" class="rauth-social-btn rauth-apple">' + AUTH_APPLE_SVG  + '<span>Apple</span></a>' +
      '</div>'
    );
  }

  function rauthSyncDesktop(dErrId, mErrId, dBtnId, mBtnId) {
    var dErr = document.getElementById(dErrId);
    var mErr = document.getElementById(mErrId);
    var dBtn = document.getElementById(dBtnId);
    var mBtn = document.getElementById(mBtnId);
    if (dErr && mErr) {
      new MutationObserver(function () {
        mErr.innerHTML        = dErr.innerHTML;
        mErr.style.display    = dErr.style.display    || '';
        mErr.style.color      = dErr.style.color      || '';
        mErr.style.background = dErr.style.background || '';
        mErr.style.border     = dErr.style.border     || '';
      }).observe(dErr, { childList: true, characterData: true, subtree: true, attributes: true });
    }
    if (dBtn && mBtn) {
      new MutationObserver(function () {
        mBtn.textContent = dBtn.textContent;
        mBtn.disabled    = dBtn.disabled;
      }).observe(dBtn, { childList: true, characterData: true, subtree: true, attributes: true });
    }
  }

  /* --------------------------------------------------------
     REGISTRACE – MOBILE
  -------------------------------------------------------- */
  function buildRegistraceMobile() {
    if (!qs('.registrace-page')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-registrace-mobile')) return;

    var waveImgSrc = 'assets/img/auth_wave.png';
    page.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-registrace-mobile r-auth-mobile';
    wrapper.innerHTML =
      '<section class="rauth-hero">' +
        '<h1 class="rauth-title"><span class="rim-accent">Zaregistrujte se</span><br>ZDARMA!</h1>' +
        '<p class="rauth-sub">Už máte svůj účet? <a href="prihlaseni.html" class="rauth-link">Přihlaste se</a></p>' +
      '</section>' +
      '<div class="rauth-form">' +
        '<input id="m-reg-fname" class="rauth-input" type="text" placeholder="Jméno*" />' +
        '<input id="m-reg-lname" class="rauth-input" type="text" placeholder="Příjmení" />' +
        '<div class="rauth-field-gap"></div>' +
        '<input id="m-reg-email" class="rauth-input" type="email" placeholder="E-mail*" />' +
        '<input id="m-reg-phone" class="rauth-input" type="tel" placeholder="Telefon" />' +
        '<div class="rauth-field-gap"></div>' +
        '<div class="rauth-pass-wrap">' +
          '<input id="m-reg-pass" class="rauth-input" type="password" placeholder="Heslo*" />' +
          '<button type="button" class="rauth-eye" id="m-reg-eye">' + AUTH_EYE_SVG + '</button>' +
        '</div>' +
        '<div class="rauth-pass-wrap">' +
          '<input id="m-reg-pass2" class="rauth-input" type="password" placeholder="Heslo znovu*" />' +
          '<button type="button" class="rauth-eye" id="m-reg-eye2">' + AUTH_EYE_SVG + '</button>' +
        '</div>' +
        '<div class="rauth-checkbox-row">' +
          '<input type="checkbox" id="m-reg-gdpr" class="rauth-checkbox" />' +
          '<label for="m-reg-gdpr" class="rauth-checkbox-label">Odesláním této zprávy souhlasím se <a href="#" class="rauth-link">zpracováním osobních údajů</a> za účelem odpovědi na můj dotaz.</label>' +
        '</div>' +
        '<p id="m-reg-error" class="rauth-error"></p>' +
        '<button id="m-reg-btn" class="rauth-btn">Registrovat se zdarma</button>' +
        rauthSocialRow('Nebo se zaregistruje přes') +
      '</div>' +
      (waveImgSrc ? '<div class="r-mobile-wave-wrap"><img class="r-mobile-wave-img" src="' + waveImgSrc + '" alt="" /></div>' : '') +
      mobileFooterHtml();

    document.body.appendChild(wrapper);

    document.getElementById('m-reg-eye').addEventListener('click', function () {
      var inp = document.getElementById('m-reg-pass');
      var isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      this.querySelector('svg').style.opacity = isText ? '0.4' : '1';
    });
    document.getElementById('m-reg-eye2').addEventListener('click', function () {
      var inp = document.getElementById('m-reg-pass2');
      var isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      this.querySelector('svg').style.opacity = isText ? '0.4' : '1';
    });

    document.getElementById('m-reg-btn').addEventListener('click', function () {
      var v = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
      document.getElementById('reg-fname').value = v('m-reg-fname');
      document.getElementById('reg-lname').value = v('m-reg-lname');
      document.getElementById('reg-email').value = v('m-reg-email');
      document.getElementById('reg-pass').value  = v('m-reg-pass');
      document.getElementById('reg-pass2').value = v('m-reg-pass2');
      var gdprEl = document.getElementById('m-reg-gdpr');
      if (gdprEl) document.getElementById('reg-gdpr').checked = gdprEl.checked;
      document.getElementById('reg-btn').click();
    });

    rauthSyncDesktop('reg-error', 'm-reg-error', 'reg-btn', 'm-reg-btn');
  }

  /* --------------------------------------------------------
     PRIHLASENI – MOBILE
  -------------------------------------------------------- */
  function buildPrihlaseniMobile() {
    if (!qs('.prihlaseni-page')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-prihlaseni-mobile')) return;

    var waveImgSrc = 'assets/img/auth_wave.png';
    page.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-prihlaseni-mobile r-auth-mobile';
    wrapper.innerHTML =
      '<section class="rauth-hero">' +
        '<h1 class="rauth-title"><span class="rim-accent">Přihlaste se</span> a vytvářejte neuvěřitelné kreativy</h1>' +
        '<p class="rauth-sub">Ještě nemáte svůj účet? <a href="registrace.html" class="rauth-link">Zaregistrujte se ZDARMA</a></p>' +
      '</section>' +
      '<div class="rauth-form">' +
        '<input id="m-pri-email" class="rauth-input" type="email" placeholder="E-mail" />' +
        '<div class="rauth-pass-wrap">' +
          '<input id="m-pri-pass" class="rauth-input" type="password" placeholder="Heslo" />' +
          '<button type="button" class="rauth-eye" id="m-pri-eye">' + AUTH_EYE_SVG + '</button>' +
        '</div>' +
        '<a href="zapomenuteheslo.html" class="rauth-forgot">Zapomenuté heslo?</a>' +
        '<p id="m-pri-error" class="rauth-error"></p>' +
        '<button id="m-pri-btn" class="rauth-btn">Přihlásit se a začít vytvářet</button>' +
        rauthSocialRow('Nebo se přihlaste přes') +
      '</div>' +
      (waveImgSrc ? '<div class="r-mobile-wave-wrap"><img class="r-mobile-wave-img" src="' + waveImgSrc + '" alt="" /></div>' : '') +
      mobileFooterHtml();

    document.body.appendChild(wrapper);

    document.getElementById('m-pri-eye').addEventListener('click', function () {
      var inp = document.getElementById('m-pri-pass');
      var isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      this.querySelector('svg').style.opacity = isText ? '0.4' : '1';
    });

    document.getElementById('m-pri-btn').addEventListener('click', function () {
      var v = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
      document.getElementById('pri-email').value = v('m-pri-email');
      document.getElementById('pri-pass').value  = v('m-pri-pass');
      document.getElementById('pri-btn').click();
    });

    document.getElementById('m-pri-pass').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('m-pri-btn').click();
    });

    rauthSyncDesktop('pri-error', 'm-pri-error', 'pri-btn', 'm-pri-btn');
  }

  /* --------------------------------------------------------
     ZAPOMENUTEHESLO – MOBILE
  -------------------------------------------------------- */
  function buildZapomenuteHesloMobile() {
    if (!qs('.zapomenuteheslo-page')) return;
    var page = qs('.page');
    if (!page) return;
    if (qs('.r-zapomenuteheslo-mobile')) return;

    var waveImgSrc = 'assets/img/auth_wave.png';
    page.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'r-zapomenuteheslo-mobile r-auth-mobile';
    wrapper.innerHTML =
      '<section class="rauth-hero">' +
        '<h1 class="rauth-title rauth-title-all-green">Zapomněli jste<br>své heslo?</h1>' +
        '<p class="rauth-sub">Pro obnovení hesla stačí vyplnit e-mail, na který' +
          ' následně <strong>obdržíte odkaz pro vytvoření nového hesla.</strong></p>' +
      '</section>' +
      '<div class="rauth-form">' +
        '<input id="m-zap-email" class="rauth-input" type="email" placeholder="E-mail" />' +
        '<p id="m-zap-msg" class="rauth-error"></p>' +
        '<button id="m-zap-btn" class="rauth-btn">Odeslat odkaz pro obnovu hesla</button>' +
      '</div>' +
      (waveImgSrc ? '<div class="r-mobile-wave-wrap"><img class="r-mobile-wave-img" src="' + waveImgSrc + '" alt="" /></div>' : '') +
      mobileFooterHtml();

    document.body.appendChild(wrapper);

    document.getElementById('m-zap-btn').addEventListener('click', function () {
      var zapInp = qs('.zap-input-email');
      if (zapInp) zapInp.value = document.getElementById('m-zap-email').value;
      document.getElementById('zap-btn').click();
    });

    rauthSyncDesktop('zap-msg', 'm-zap-msg', 'zap-btn', 'm-zap-btn');
  }

  function init() {
    injectSpacer();
    injectNav();
    buildIndexMobile();
    buildKontaktMobile();
    buildSablonyMobile();
    buildBlogMobile();
    buildBlogDetailMobile();
    buildCenyMobile();
    buildOnasMobile();
    buildRegistraceMobile();
    buildPrihlaseniMobile();
    buildZapomenuteHesloMobile();
    injectFooter();
    injectBenefitsGrid();
    injectIndexBlogCards();
    injectTabsWrap();
    injectBlogListGrid();
    if (!qs('.r-ceny-mobile')) injectPlanCards();
    if (!qs('.r-onas-mobile')) injectValuesGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
