const CaesarRender = (() => {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LABELS = { 3: ['صغير', 'وسط', 'كبير'], 2: ['سنجل', 'دبل'] };
  const sizeName = (item, s) => (item.p.length > 1 ? LABELS[item.p.length][s] : '');
  const plus = '<span class="add__icon" aria-hidden="true">+</span>';

  const sizedOf = (cat) => {
    const multi = cat.items.filter((i) => i.p.length > 1);
    if (!cat.items.length || multi.length < cat.items.length / 2) return 0;
    return cat.items.some((i) => i.p.length === 3) ? 3 : 2;
  };
  const minOf = (cat) => (cat.items.length ? Math.min(...cat.items.map((i) => i.p[0])) : 0);
  const count = (k) => `${k} صنف`;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];
  const MAP = 'https://www.google.com/maps/search/?api=1&query=30.320629,31.317338';
  const totals = (data) => {
    let cats = 0, items = 0;
    data.wings.forEach((w) => w.cats.forEach((c) => { cats += 1; items += c.items.length; }));
    return { cats, items };
  };

  const addBtn = (item, s, extra, label) =>
    `<button class="add${extra}" type="button" data-add="${esc(item.id)}" data-size="${s}" aria-label="أضف ${esc(item.n)}${label ? ' ' + label : ''} للسلة">${label && extra.includes('add--inline') ? `<small>${label}</small> ` : ''}<b>${item.p[s]}</b>${extra.includes('add--cell') ? '' : ' <small>ج.م</small>'}${plus}</button>`;

  const priceCell = (item, sized) => {
    const p = item.p;
    if (p.length === 1) return addBtn(item, 0, sized ? ' add--span' : '', '');
    if (sized === p.length) return p.map((_, i) => addBtn(item, i, ' add--cell', LABELS[p.length][i])).join('');
    return `<span class="add-group${sized ? ' add--span' : ''}">${p.map((_, i) => addBtn(item, i, ' add--inline', LABELS[p.length][i])).join('')}</span>`;
  };

  const catHTML = (c, w) => {
    const sized = sizedOf(c);
    return `
      <section class="cat" id="${esc(c.id)}" data-wing="${esc(w.key)}" aria-labelledby="${esc(c.id)}-h">
        <header class="cat__head">
          <h3 id="${esc(c.id)}-h">${esc(c.name)}</h3>
          <p class="cat__meta">${count(c.items.length)}${c.en ? ` <span lang="en" dir="ltr">${esc(c.en)}</span>` : ''}</p>
        </header>
        ${sized ? `<div class="ledger__headrow" aria-hidden="true">${[0, 1].map(() => `<div class="ledger__heads ledger__heads--${sized}"><span></span>${LABELS[sized].map((l) => `<span>${l}</span>`).join('')}</div>`).join('')}</div>` : ''}
        <ul class="ledger${sized ? ` ledger--sized ledger--${sized}` : ''}">
${c.items.map((it) => `          <li class="row"><span class="row__name"><span class="row__title">${esc(it.n)}</span>${it.d ? `<span class="row__desc">${esc(it.d)}</span>` : ''}</span><span class="row__prices">${priceCell(it, sized)}</span></li>`).join('\n')}
        </ul>
      </section>`;
  };

  const faceHTML = (c, i) => `<a class="face" href="#${esc(c.id)}" data-target="${esc(c.id)}" style="--i: ${i}"><span class="face__shine" aria-hidden="true"></span><span class="face__num" lang="en" dir="ltr" aria-hidden="true">${ROMAN[i] || i + 1}</span><span class="face__name">${esc(c.name)}</span><span class="face__count">${count(c.items.length)}</span><span class="face__from">${c.items.length ? `من <b>${minOf(c)}</b> ج.م` : 'لسه مفيهوش أصناف'}</span></a>`;

  const chev = (d) => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

  const wingHTML = (w) => `
    <div class="wing" id="wing-${esc(w.key)}" role="tabpanel" aria-labelledby="tab-${esc(w.key)}" data-wing="${esc(w.key)}">
      <p class="wing__line">${esc(w.line)}</p>
      <div class="drum" data-drum style="--n: ${Math.max(w.cats.length, 3)}">
        <div class="drum__floor" aria-hidden="true"></div>
        <div class="drum__ring" data-ring>
          ${w.cats.map(faceHTML).join('\n          ')}
        </div>
      </div>
      <div class="drum__controls">
        <button class="btn btn--quiet btn--icon" type="button" data-step="-1" aria-label="القسم اللي قبله">${chev('M9 6l6 6-6 6')}</button>
        <p class="drum__now" aria-live="polite" data-now></p>
        <button class="btn btn--quiet btn--icon" type="button" data-step="1" aria-label="القسم اللي بعده">${chev('M15 6l-6 6 6 6')}</button>
      </div>
      <div class="cats">${w.cats.map((c) => catHTML(c, w)).join('\n')}
      </div>
    </div>`;

  const fact = (value, key, blank) => (value ? esc(value) : `<span class="fill" data-fill="${key}">${blank}</span>`);

  const body = (data) => {
    const t = totals(data);
    const s = data.settings || {};
    const logo = esc(data.logo);
    return `<div class="page" dir="rtl" lang="ar">
<a class="skip" href="#main">روح للمحتوى على طول</a>

<header class="nav-wrap">
  <nav class="nav" aria-label="الصفحة">
    <a class="nav__mark" href="#top" aria-label="سيزر، أول الصفحة"><img src="${logo}" width="640" height="640" alt="" class="nav__logo"><span>سيزر</span></a>
    <ul class="nav__links">
      <li><a href="#menu">المنيو</a></li>
      <li class="nav__more"><a href="#kids">الكيدز أريا</a></li>
      <li class="nav__more"><a href="#visit">تعالالنا</a></li>
    </ul>
  </nav>
</header>

<main id="main">
  <section class="hero" id="top" aria-labelledby="hero-h">
    <div class="container hero__grid">
      <div class="hero__text">
        <p class="hero__status" data-open hidden><span class="hero__dot" aria-hidden="true"></span><span data-open-text></span></p>
        <h1 id="hero-h">تعالى سيزر… الباقي عندنا.</h1>
        <p class="lead">قهوة على المزاج، بيتزا طالعة من الفرن، وحلويات تتشرب معاها حاجة سخنة.</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="#menu">افتح المنيو</a>
          <a class="btn btn--quiet" href="#visit">إزاي توصلنا</a>
        </div>
      </div>
      <figure class="hero__mark" data-hero-mark>
        <img src="${logo}" width="640" height="640" alt="شعار سيزر كافيه ومطعم: تمثال قيصر بالدهبي على أرضية سودا" fetchpriority="high">
      </figure>
    </div>
  </section>

  <section class="menu" id="menu" aria-labelledby="menu-h">
    <div class="container">
      <div class="menu__head">
        <h2 id="menu-h">المنيو</h2>
        <p class="lead">${t.items} صنف في ${t.cats} قسم. لفّ العمود، واضغط على السعر عشان تضيفه للسلة.</p>
      </div>
      <div class="menu__bar">
        <div class="seg wings-tabs" role="tablist" aria-label="أجنحة المنيو">${data.wings.map((w, i) => `<button class="seg__tab" type="button" role="tab" id="tab-${esc(w.key)}" aria-controls="wing-${esc(w.key)}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-tab="${esc(w.key)}">${esc(w.name)}</button>`).join('')}</div>
        <div class="search">
          <label for="menu-q">دوّر على صنف</label>
          <input id="menu-q" name="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="مثلاً لوتس، أو موهيتو">
          <p class="search__help" id="menu-q-help" aria-live="polite"></p>
        </div>
      </div>
${data.wings.map(wingHTML).join('\n')}
      <div class="results" data-results hidden>
        <ul class="ledger ledger--results" data-results-list></ul>
      </div>
      <p class="menu__note">الأسعار بالجنيه المصري، ومن غير التوصيل.</p>
    </div>
  </section>

  <section class="kids" id="kids" aria-labelledby="kids-h">
    <div class="container">
      <h2 id="kids-h" class="statement">فيه كيدز أريا يلعبوا فيها، وانت قاعد براحتك.</h2>
    </div>
  </section>

  <section class="band" aria-labelledby="fatar-h">
    <div class="container band__grid">
      <div class="band__text">
        <h2 id="fatar-h">الصبح عندنا بيبدأ بمشلتت.</h2>
        <p class="lead">فطيرة مشلتت بالسمن البلدي والزبدة البلدي.</p>
      </div>
      <p class="band__figure"><b>${esc(data.feature || '200')}</b> <small>ج.م</small></p>
      <a class="btn btn--quiet" href="#cat-breakfast" data-jump>منيو الفطار</a>
    </div>
  </section>

  <section class="visit" id="visit" aria-labelledby="visit-h">
    <div class="container visit__grid">
      <div class="visit__head">
        <h2 id="visit-h">تعالالنا</h2>
        <p class="lead">كافيه ومطعم في مكان واحد.</p>
      </div>
      <dl class="visit__rows">
        <div class="visit__row"><dt>العنوان</dt><dd>${fact(s.address, 'address', 'العنوان هيتكتب هنا')}${s.address ? ` <a class="visit__map" href="${MAP}" target="_blank" rel="noopener">افتح على الخريطة</a>` : ''}</dd></div>
        <div class="visit__row"><dt>المواعيد</dt><dd>${fact(s.hours, 'hours', 'مواعيد الفتح هتتكتب هنا')}</dd></div>
        <div class="visit__row"><dt>الطلبات</dt><dd>${s.wa ? `على واتساب <a class="num" dir="ltr" href="https://wa.me/${esc(s.wa)}" target="_blank" rel="noopener">0${esc(s.wa.slice(2))}</a>، أو من السلة هنا.` : 'من السلة هنا، والطلب بيتبعت على واتساب.'}</dd></div>
        <div class="visit__row"><dt>القعدة</dt><dd>قهوة وأكل، وكيدز أريا للولاد.</dd></div>
      </dl>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="container foot__inner">
    <div class="foot__brand">
      <p class="foot__mark">سيزر</p>
      <p class="foot__en" lang="en" dir="ltr">Caesar Cafe &amp; Restaurant</p>
    </div>
    <nav class="foot__links" aria-label="روابط الصفحة">
      <a href="#menu">المنيو</a>
      <a href="#kids">الكيدز أريا</a>
      <a href="#visit">تعالالنا</a>
    </nav>
    <p class="foot__legal">سيزر كافيه ومطعم، 2026</p>
  </div>
</footer>

<div class="cartbar" data-cartbar hidden>
  <div class="cartbar__inner">
    <p class="cartbar__sum"><span data-cart-count></span><b data-cart-total></b></p>
    <button class="btn btn--primary" type="button" data-open-cart>كمّل الطلب</button>
  </div>
</div>

<dialog class="sheet" id="cart" aria-labelledby="cart-h">
  <div class="sheet__head">
    <h2 id="cart-h">طلبك</h2>
    <button class="btn btn--quiet btn--icon" type="button" data-close aria-label="اقفل">${chev('M6 6l12 12M18 6L6 18')}</button>
  </div>
  <div class="sheet__body">
    <ul class="cart__list" data-cart-list></ul>
    <p class="cart__empty" data-cart-empty hidden>السلة فاضية. اضغط على أي سعر في المنيو عشان تضيفه.</p>
    <div class="cart__total"><span>المجموع</span><b data-cart-sum></b></div>
    <p class="cart__note">السعر غير شامل التوصيل.</p>
    <form class="checkout" data-checkout novalidate>
      <div class="field">
        <label for="co-name">الاسم</label>
        <input id="co-name" name="name" type="text" autocomplete="name" required minlength="2">
        <p class="field__help" id="co-name-help"></p>
      </div>
      <div class="field">
        <label for="co-phone">رقم الموبايل</label>
        <input id="co-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" required placeholder="01xxxxxxxxx">
        <p class="field__help" id="co-phone-help"></p>
      </div>
      <div class="field">
        <label for="co-address">العنوان</label>
        <textarea id="co-address" name="address" rows="3" autocomplete="street-address" required minlength="3" placeholder="اسم المنطقة، ولو تحب: الشارع أو علامة مميزة"></textarea>
        <p class="field__help" id="co-address-help"></p>
      </div>
      <p class="checkout__off" data-wa-missing hidden>استقبال الطلبات أونلاين لسه مش متفعّل. رقم واتساب سيزر لسه متحطش.</p>
      <button class="btn btn--primary btn--block" type="submit">أكد الطلب</button>
    </form>
    <div class="confirm" data-confirm hidden>
      <p class="confirm__lead">طلبك جاهز. الطلب بيوصل سيزر لما تبعت الرسالة على واتساب.</p>
      <a class="btn btn--primary btn--block" data-wa-link href="#" target="_blank" rel="noopener">ابعت الطلب على واتساب</a>
      <div class="confirm__more">
        <button class="btn btn--quiet" type="button" data-edit-order>رجوع للتعديل</button>
        <button class="btn btn--quiet" type="button" data-clear-cart>فضّي السلة</button>
      </div>
    </div>
  </div>
</dialog>
</div>`;
  };

  const RESET = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
  const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600&family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap">';
  const S = 'script';

  const content = (data, css, js, fonts = FONTS) => `<title>سيزر كافيه ومطعم</title>
<meta name="description" content="سيزر كافيه ومطعم: قهوة على المزاج، بيتزا من الفرن، حلويات، وكيدز أريا للولاد. المنيو كامل بالأسعار، واطلب على واتساب.">
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<${S}>document.documentElement.classList.add('js');document.documentElement.lang='ar';document.documentElement.dir='rtl';</${S}>
<style id="app-css">
${css}
</style>
${body(data)}
<${S} type="application/json" id="caesar-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</${S}>
<${S} src="/config.js"></${S}>
<${S} id="app-js">
${js}
</${S}>`;

  const documentHTML = (data, css, js) =>
    `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${content(data, css, js)}</body></html>`;

  return { esc, LABELS, sizeName, sizedOf, totals, body, content, documentHTML, FONTS };
})();

if (typeof document === 'undefined') {
  globalThis.CaesarRender = CaesarRender;
} else {
  (() => {
    const R = CaesarRender;
    const fmt = (n) => `${n} ج.م`;
    const digits = (v) => String(v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '');
    const KEY = 'caesar-cart';
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    let webgl = null;
    const can3d = () => {
      if (webgl !== null) return webgl;
      try {
        const c = document.createElement('canvas');
        webgl = !reduced() && !(navigator.connection && navigator.connection.saveData) && !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch (_) { webgl = false; }
      return webgl;
    };
    const flyToCart = (from) => {
      const bar = document.querySelector('.cartbar__sum b');
      if (!bar || reduced()) return;
      const a = from.getBoundingClientRect(), b = bar.getBoundingClientRect();
      const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
      const coin = document.createElement('span');
      coin.className = 'flyer';
      coin.setAttribute('aria-hidden', 'true');
      document.body.append(coin);
      const lift = Math.min(220, Math.abs(y1 - y0) * 0.45 + 60);
      const anim = coin.animate([
        { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(.6) rotateY(0deg)`, opacity: 0 },
        { transform: `translate(${x0 + (x1 - x0) * 0.35}px, ${Math.min(y0, y1) - lift}px) translate(-50%, -50%) scale(1.25) rotateY(360deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(.35) rotateY(720deg)`, opacity: 0.9 },
      ], { duration: 820, easing: 'cubic-bezier(.45,.05,.3,1)' });
      anim.onfinish = () => {
        coin.remove();
        const inner = document.querySelector('.cartbar__inner');
        if (inner) { inner.classList.remove('is-bump'); void inner.offsetWidth; inner.classList.add('is-bump'); }
      };
    };

    // state shared by the one-time listeners
    let data = null;
    let items = new Map();
    let drums = {};
    let cart = [];
    let ui = null;
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {} };
    try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { cart = []; }
    if (!Array.isArray(cart)) cart = [];

    const boot = (d) => {
      data = d;
      items = new Map();
      data.wings.forEach((w) => w.cats.forEach((c) => c.items.forEach((it) => items.set(it.id, { ...it, cat: c.name }))));
      cart = cart.filter((l) => items.has(l.id) && items.get(l.id).p[l.s] != null && l.q > 0);
      save();
      drums = {};

      // ---------- drum ----------
      const tabs = [...document.querySelectorAll('[data-tab]')];
      const wingEls = [...document.querySelectorAll('.wing')];
      wingEls.forEach((wing) => {
        const drum = wing.querySelector('[data-drum]');
        const ring = wing.querySelector('[data-ring]');
        const faces = [...ring.querySelectorAll('.face')];
        const cats = [...wing.querySelectorAll('.cat')];
        const now = wing.querySelector('[data-now]');
        const n = Math.max(faces.length, 1);
        const step = 360 / Math.max(faces.length, 3);
        const s = { i: 0, angle: 0 };
        const layout = () => {
          if (!faces.length) return;
          const fw = faces[0].offsetWidth;
          const fit = fw / 2 / Math.tan(Math.PI / Math.max(faces.length, 3)) + fw * 0.3;
          drum.style.setProperty('--r', Math.round(Math.max(fit, fw * 1.25)) + 'px');
        };
        const shade = () => faces.forEach((f, k) => {
          const sd = (((s.angle - k * step) % 360) + 540) % 360 - 180;
          const dd = Math.abs(sd);
          const off = dd > 70;
          f.style.opacity = off ? '0' : String(Math.max(0.3, 1 - dd / 90).toFixed(2));
          f.style.visibility = off ? 'hidden' : '';
          f.style.setProperty('--lit', Math.max(0, 1 - dd / 55).toFixed(3));
          f.style.setProperty('--side', (sd / 70).toFixed(3));
        });
        cats.forEach((c) => c.querySelectorAll('.row').forEach((r, j) => r.style.setProperty('--d', Math.min(j, 14))));
        const select = (k, opts = {}) => {
          if (!faces.length) { now.textContent = 'الجناح ده لسه فاضي'; return; }
          k = ((k % n) + n) % n;
          s.i = k;
          let target = k * step;
          target += Math.round((s.angle - target) / 360) * 360;
          s.angle = target;
          ring.style.setProperty('--angle', s.angle + 'deg');
          shade();
          faces.forEach((f, j) => {
            const on = j === k;
            f.classList.toggle('is-active', on);
            if (on) f.setAttribute('aria-current', 'true'); else f.removeAttribute('aria-current');
            f.tabIndex = on ? 0 : -1;
          });
          cats.forEach((c) => {
            const on = c.id === faces[k].dataset.target;
            if (on && c.hidden && !opts.quiet) { c.classList.remove('is-reveal'); void c.offsetWidth; c.classList.add('is-reveal'); }
            c.hidden = !on;
          });
          now.textContent = faces[k].querySelector('.face__name').textContent + '، ' + faces[k].querySelector('.face__count').textContent;
          if (opts.focus) faces[k].focus({ preventScroll: true });
        };
        let suppress = false;
        faces.forEach((f, k) => {
          f.setAttribute('draggable', 'false');
          f.addEventListener('click', (e) => {
            e.preventDefault();
            if (suppress) return;
            if (k === s.i) document.getElementById(f.dataset.target).scrollIntoView({ block: 'start' });
            else select(k);
          });
        });
        ring.addEventListener('keydown', (e) => {
          const map = { ArrowLeft: 1, ArrowRight: -1, Home: 'home', End: 'end' };
          if (!(e.key in map)) return;
          e.preventDefault();
          const v = map[e.key];
          select(v === 'home' ? 0 : v === 'end' ? n - 1 : s.i + v, { focus: true });
        });
        wing.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => select(s.i + Number(b.dataset.step))));
        if (matchMedia('(hover: hover)').matches) {
          faces.forEach((f) => {
            f.addEventListener('pointermove', (e) => {
              if (drag && drag.moved) return;
              const r = f.getBoundingClientRect();
              const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
              f.style.setProperty('--rx', (-py * 14).toFixed(2) + 'deg');
              f.style.setProperty('--ry', (px * 18).toFixed(2) + 'deg');
              f.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
              f.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
            });
            f.addEventListener('pointerleave', () => { f.style.removeProperty('--rx'); f.style.removeProperty('--ry'); f.style.removeProperty('--gx'); f.style.removeProperty('--gy'); });
          });
        }
        let drag = null;
        drum.addEventListener('pointerdown', (e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          drag = { x: e.clientX, y: e.clientY, a: s.angle, moved: false, id: e.pointerId, v: 0, lx: e.clientX, lt: performance.now() };
        });
        drum.addEventListener('pointermove', (e) => {
          if (!drag) return;
          const dx = e.clientX - drag.x;
          if (!drag.moved) {
            if (Math.abs(e.clientY - drag.y) > Math.abs(dx) && Math.abs(e.clientY - drag.y) > 8) { drag = null; return; }
            if (Math.abs(dx) < 6) return;
            drag.moved = true;
            drum.classList.add('is-drag');
            try { drum.setPointerCapture(drag.id); } catch (_) {}
          }
          const k2 = (240 / drum.offsetWidth) * (step / 20);
          const tnow = performance.now();
          const inst = ((e.clientX - drag.lx) * k2) / Math.max(8, tnow - drag.lt);
          drag.v = drag.v * 0.6 + inst * 0.4;
          drag.lx = e.clientX; drag.lt = tnow;
          s.angle = drag.a + dx * k2;
          ring.style.setProperty('--angle', s.angle + 'deg');
          shade();
        });
        const end = () => {
          if (!drag) return;
          const moved = drag.moved;
          const fling = performance.now() - drag.lt < 90 ? Math.max(-3 * step, Math.min(3 * step, drag.v * 260)) : 0;
          drag = null;
          drum.classList.remove('is-drag');
          if (moved) { suppress = true; setTimeout(() => { suppress = false; }, 0); select(Math.round((s.angle + fling) / step)); }
        };
        drum.addEventListener('pointerup', end);
        drum.addEventListener('pointercancel', end);
        drum.addEventListener('lostpointercapture', end);
        drums[wing.dataset.wing] = { layout, select, faces, s };
        layout();
        select(0, { quiet: true });
      });

      const showWing = (key, opts = {}) => {
        tabs.forEach((t) => {
          const on = t.dataset.tab === key;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          if (on && opts.focus) t.focus();
        });
        wingEls.forEach((w) => {
          const on = w.dataset.wing === key;
          if (on && w.hidden && opts.animate !== false) { w.classList.remove('is-entering'); void w.offsetWidth; w.classList.add('is-entering'); }
          w.hidden = !on;
        });
        document.querySelector('.menu')?.setAttribute('data-wing-now', key);
        const dr = drums[key];
        if (dr) { dr.layout(); dr.select(dr.s.i); }
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => showWing(t.dataset.tab));
        t.addEventListener('keydown', (e) => {
          const dir = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
          if (!dir) return;
          e.preventDefault();
          showWing(tabs[(i + dir + tabs.length) % tabs.length].dataset.tab, { focus: true });
        });
      });
      if (tabs.length) showWing(tabs[0].dataset.tab, { animate: false });

      // ---------- search ----------
      const input = document.getElementById('menu-q');
      const help = document.getElementById('menu-q-help');
      const results = document.querySelector('[data-results]');
      const list = document.querySelector('[data-results-list]');
      const bar = document.querySelector('.wings-tabs');
      const norm = (t) => t.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْ]/g, '').replace(/\s+/g, ' ').trim();
      const index = [...document.querySelectorAll('.cat .row')].map((row) => {
        const catName = row.closest('.cat').querySelector('h3').textContent;
        return { row, catName, key: norm(row.querySelector('.row__name').textContent + ' ' + catName) };
      });
      let activeKey = tabs.length ? tabs[0].dataset.tab : '';
      const run = () => {
        const q = norm(input.value);
        if (!q) { results.hidden = true; bar.hidden = false; showWing(activeKey, { animate: false }); help.textContent = ''; return; }
        const sel = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
        if (results.hidden && sel) activeKey = sel.dataset.tab;
        const hits = index.filter((x) => x.key.includes(q));
        list.replaceChildren(...hits.slice(0, 60).map((x) => {
          const li = x.row.cloneNode(true);
          const tag = document.createElement('span');
          tag.className = 'row__cat';
          tag.textContent = x.catName;
          li.querySelector('.row__name').append(tag);
          li.querySelectorAll('.add--cell').forEach((b) => {
            const it = items.get(b.dataset.add);
            const sm = document.createElement('small');
            sm.textContent = R.sizeName(it, Number(b.dataset.size)) + ' ';
            b.prepend(sm);
          });
          return li;
        }));
        wingEls.forEach((w) => { w.hidden = true; });
        bar.hidden = true;
        results.hidden = false;
        help.textContent = hits.length ? (hits.length > 60 ? `لقينا ${hits.length} صنف، بنعرض أول 60.` : `لقينا ${hits.length} صنف.`) : 'مفيش صنف بالاسم ده. جرّب كلمة تانية.';
      };
      const clearSearch = () => { if (input.value) { input.value = ''; run(); } };
      input.addEventListener('input', run);
      input.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSearch(); });
      const openCat = (id) => {
        const cat = document.getElementById(id);
        if (!cat || !cat.classList.contains('cat')) return false;
        clearSearch();
        const key = cat.dataset.wing;
        showWing(key);
        const dr = drums[key];
        dr.select(dr.faces.findIndex((f) => f.dataset.target === id));
        requestAnimationFrame(() => cat.scrollIntoView({ block: 'start' }));
        return true;
      };
      document.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { if (openCat(a.getAttribute('href').slice(1))) e.preventDefault(); }));

      // ---------- cart ----------
      const cartbar = document.querySelector('[data-cartbar]');
      const dlg = document.getElementById('cart');
      const cartList = dlg.querySelector('[data-cart-list]');
      const form = dlg.querySelector('[data-checkout]');
      const confirmBox = dlg.querySelector('[data-confirm]');
      const waLink = dlg.querySelector('[data-wa-link]');
      const waMissing = dlg.querySelector('[data-wa-missing]');
      const lineOf = (l) => { const it = items.get(l.id); const price = it.p[l.s]; return { it, price, total: price * l.q, size: R.sizeName(it, l.s) }; };
      const sum = () => cart.reduce((a, l) => a + lineOf(l).total, 0);
      const qty = () => cart.reduce((a, l) => a + l.q, 0);
      const paintBar = () => {
        const q = qty();
        cartbar.hidden = q === 0;
        document.body.classList.toggle('has-cart', q > 0);
        cartbar.querySelector('[data-cart-count]').textContent = `${q} ${q === 1 ? 'صنف' : 'أصناف'}`;
        cartbar.querySelector('[data-cart-total]').textContent = fmt(sum());
      };
      const paintCart = () => {
        cartList.replaceChildren(...cart.map((l, i) => {
          const { it, price, total, size } = lineOf(l);
          const li = document.createElement('li');
          li.className = 'cline';
          li.innerHTML = `<span class="cline__name"><span class="cline__title"></span><small class="cline__size"></small></span>
            <span class="stepper"><button class="stepper__b" type="button" data-q="1" aria-label="زوّد واحد">+</button><output class="stepper__v" aria-live="polite"></output><button class="stepper__b" type="button" data-q="-1" aria-label="قلّل واحد">−</button></span>
            <b class="cline__total"></b>`;
          li.querySelector('.cline__title').textContent = it.n;
          li.querySelector('.cline__size').textContent = (size ? size + '، ' : '') + fmt(price);
          li.querySelector('.stepper__v').textContent = String(l.q);
          li.querySelector('.cline__total').textContent = fmt(total);
          li.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
            l.q += Number(b.dataset.q);
            if (l.q <= 0) cart.splice(i, 1);
            save(); paintBar(); paintCart();
            const next = cartList.querySelectorAll('.cline')[Math.min(i, cart.length - 1)];
            next?.querySelector(`[data-q="${b.dataset.q}"]`)?.focus();
          }));
          return li;
        }));
        const empty = cart.length === 0;
        dlg.querySelector('[data-cart-empty]').hidden = !empty;
        dlg.querySelector('[data-cart-sum]').textContent = fmt(sum());
        form.hidden = empty || !confirmBox.hidden;
        if (empty) confirmBox.hidden = true;
        waMissing.hidden = !!(data.settings && data.settings.wa);
      };
      const openCart = () => { confirmBox.hidden = true; paintCart(); try { dlg.showModal(); } catch (_) { dlg.setAttribute('open', ''); } };
      cartbar.querySelector('[data-open-cart]').addEventListener('click', openCart);
      dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

      const FIELDS = {
        name: { el: form.elements.name, msg: 'اكتب اسمك.' },
        phone: { el: form.elements.phone, msg: 'اكتب رقم موبايل مصري من 11 رقم، يبدأ بـ 01.' },
        address: { el: form.elements.address, msg: 'اكتب اسم المنطقة.' },
      };
      const checkField = (k) => {
        const f = FIELDS[k];
        const v = f.el.value.trim();
        let ok = v.length >= (k === 'address' ? 3 : 2);
        if (k === 'phone') ok = /^01[0125]\d{8}$/.test(digits(v).replace(/^20(?=1)/, '0'));
        const helpEl = document.getElementById(f.el.id + '-help');
        f.el.toggleAttribute('aria-invalid', !ok);
        if (ok) { f.el.removeAttribute('aria-describedby'); helpEl.textContent = ''; } else { f.el.setAttribute('aria-describedby', helpEl.id); helpEl.textContent = f.msg; }
        return ok;
      };
      Object.keys(FIELDS).forEach((k) => FIELDS[k].el.addEventListener('blur', () => { if (FIELDS[k].el.value) checkField(k); }));
      try {
        const saved = JSON.parse(localStorage.getItem('caesar-customer') || '{}');
        Object.keys(FIELDS).forEach((k) => { if (saved[k]) FIELDS[k].el.value = saved[k]; });
      } catch (_) {}
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const bad = Object.keys(FIELDS).filter((k) => !checkField(k));
        if (bad.length) { FIELDS[bad[0]].el.focus(); return; }
        const wa = data.settings && data.settings.wa;
        if (!wa) { waMissing.hidden = false; return; }
        const v = Object.fromEntries(Object.keys(FIELDS).map((k) => [k, FIELDS[k].el.value.trim()]));
        try { localStorage.setItem('caesar-customer', JSON.stringify(v)); } catch (_) {}
        const lines = cart.map((l) => { const { it, total, size } = lineOf(l); return `- ${l.q} × ${it.n}${size ? ` (${size})` : ''} = ${total} ج.م`; });
        const msg = ['طلب جديد من موقع سيزر', '', `الاسم: ${v.name}`, `الموبايل: ${digits(v.phone)}`, `العنوان: ${v.address}`, '', 'الطلب:', ...lines, '', `المجموع: ${sum()} ج.م (من غير التوصيل)`].join('\n');
        waLink.href = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
        form.hidden = true;
        confirmBox.hidden = false;
        waLink.focus();
      });
      dlg.querySelector('[data-edit-order]').addEventListener('click', () => { confirmBox.hidden = true; form.hidden = false; form.elements.name.focus(); });
      dlg.querySelector('[data-clear-cart]').addEventListener('click', () => { cart = []; save(); paintBar(); paintCart(); dlg.close(); });
      paintBar();

      // ---------- open now (Cairo time) ----------
      const status = document.querySelector('[data-open]');
      if (status) {
        const paintOpen = () => {
          try {
            const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
            const m = Number(parts.hour) * 60 + Number(parts.minute);
            const friday = parts.weekday === 'Fri';
            const opensAt = friday ? 13 * 60 : 8 * 60;
            const open = m < 120 || m >= opensAt;
            status.classList.toggle('is-open', open);
            status.querySelector('[data-open-text]').textContent = open ? 'مفتوحين دلوقتي، لحد 2 بالليل' : `مقفولين دلوقتي، بنفتح الساعة ${friday ? '1 الضهر' : '8 الصبح'}`;
            status.hidden = false;
          } catch (_) { status.hidden = true; }
        };
        paintOpen();
        clearInterval(window.__caesarOpenTimer);
        window.__caesarOpenTimer = setInterval(paintOpen, 60000);
      }

      // ---------- reveal on scroll ----------
      if ('IntersectionObserver' in window && !reduced()) {
        const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -12% 0px' });
        document.querySelectorAll('.menu__head, .menu__bar, .statement, .band__grid, .visit__head, .visit__row, .foot__brand').forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--rd', String(el.classList.contains('visit__row') ? i % 4 : 0)); io.observe(el); });
      }

      // ---------- the 3D hero ----------
      const mark = document.querySelector('[data-hero-mark]');
      if (mark && can3d()) {
        const go = () => { (window.__caesarHero ||= import('/vendor/hero3d.js')).then((m) => m.start(mark)).catch(() => {}); };
        if (window.__caesarHero) go();
        else if (document.readyState === 'complete') (window.requestIdleCallback || setTimeout)(go, { timeout: 900 });
        else window.addEventListener('load', () => (window.requestIdleCallback || setTimeout)(go, { timeout: 900 }), { once: true });
      }

      ui = { paintBar, openCat, dlg };
    };

    // ---------- one-time listeners ----------
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add]');
      if (!b || !items.has(b.dataset.add)) return;
      const id = b.dataset.add, s = Number(b.dataset.size);
      const line = cart.find((l) => l.id === id && l.s === s);
      if (line) line.q += 1; else cart.push({ id, s, q: 1 });
      save(); ui.paintBar();
      b.classList.remove('is-added'); void b.offsetWidth; b.classList.add('is-added');
      flyToCart(b);
    });
    const fromHash = () => { const id = location.hash.slice(1); if (id.startsWith('cat-') && ui) ui.openCat(id); };
    window.addEventListener('hashchange', fromHash);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => Object.values(drums).forEach((dr) => { dr.layout(); dr.select(dr.s.i); }), 120); });

    let baked;
    try { baked = JSON.parse(document.getElementById('caesar-data').textContent); } catch (_) { return; }
    boot(baked);
    fromHash();

    // ---------- live menu from Supabase ----------
    const cfg = window.CAESAR_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
    const api = (path) => fetch(`${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, {
      headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${cfg.supabaseAnonKey}` },
    }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    Promise.all([
      api('wings?select=key,name,line,sort&order=sort.asc,key.asc'),
      api('categories?select=id,wing_key,name,en,sort&order=sort.asc,id.asc'),
      api('items?select=id,category_id,name,description,prices,sort&active=eq.true&order=sort.asc,id.asc'),
      api('settings?select=whatsapp,address,hours&id=eq.1'),
    ]).then(([wings, cats, its, st]) => {
      if (!wings.length) return;
      const live = {
        rev: 0,
        logo: baked.logo,
        feature: baked.feature,
        settings: { wa: (st[0] && st[0].whatsapp) || '', address: (st[0] && st[0].address) || '', hours: (st[0] && st[0].hours) || '' },
        wings: wings.map((w) => ({
          key: w.key, name: w.name, line: w.line,
          cats: cats.filter((c) => c.wing_key === w.key).map((c) => ({
            id: c.id, name: c.name, en: c.en || '',
            items: its.filter((i) => i.category_id === c.id).map((i) => {
              const it = { id: i.id, n: i.name, p: i.prices };
              if (i.description) it.d = i.description;
              return it;
            }),
          })),
        })),
      };
      const same = JSON.stringify({ s: live.settings, w: live.wings }) === JSON.stringify({ s: baked.settings, w: baked.wings });
      if (same) return;
      const swap = () => {
        const y = window.scrollY;
        const old = document.querySelector('.page');
        const holder = document.createElement('div');
        holder.innerHTML = R.body(live);
        old.replaceWith(holder.firstElementChild);
        boot(live);
        window.scrollTo(0, y);
      };
      if (ui && ui.dlg.open) ui.dlg.addEventListener('close', swap, { once: true });
      else swap();
    }).catch(() => { /* keep the menu that shipped with the page */ });
  })();
}
