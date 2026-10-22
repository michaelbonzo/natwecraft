/* Natwecraft Investments — shared site script (all five pages) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= PAGE LOADER =================
     The navy screen with the spinning wheel shows while a page loads,
     and again every time a visitor clicks through to another page. */
  const loader = $('#loader');
  const start = performance.now();
  let hidden = false;
  const hideLoader = () => {
    if (hidden || !loader) return; hidden = true;
    const wait = Math.max(0, 650 - (performance.now() - start));   // let the wheel turn at least once
    setTimeout(() => { loader.classList.add('done'); root.classList.add('loaded'); root.classList.remove('leaving'); }, wait);
  };
  if (document.readyState === 'complete') hideLoader(); else addEventListener('load', hideLoader);
  setTimeout(hideLoader, 2600);                                       // never hold the page hostage on slow images
  addEventListener('pageshow', e => { if (e.persisted && loader) { loader.classList.add('done'); root.classList.remove('leaving'); } });

  const isPageLink = a => {
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.dataset.noLoader !== undefined) return false;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(href)) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin && location.protocol !== 'file:') return false;
    if (url.protocol !== location.protocol) return false;
    if (url.pathname === location.pathname && url.hash) return false; // same page, just jumping to a section
    return true;
  };
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isPageLink(a) || !loader) return;
    e.preventDefault();
    root.classList.add('leaving');
    loader.classList.remove('done');
    setTimeout(() => { location.href = a.href; }, reduce ? 60 : 480);
  });

  /* ================= BASICS ================= */
  $$('.year').forEach(y => y.textContent = new Date().getFullYear());

  const burger = $('#burgerBtn'), menu = $('#mobileMenu');
  if (burger && menu) {
    const setMenu = o => { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
    burger.addEventListener('click', () => setMenu(true));
    $('#mobileCloseBtn').addEventListener('click', () => setMenu(false));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ================= LIGHTBOX (single photo or a whole gallery) ================= */
  const lb = $('#lightbox');
  let group = [], gi = 0;
  const lbShow = () => {
    const it = group[gi], img = $('img', lb);
    img.src = it.src; img.alt = it.cap || '';
    $('.lb-cap', lb).textContent = it.cap || '';
    $('.lb-count', lb).textContent = group.length > 1 ? String(gi + 1).padStart(2, '0') + ' / ' + String(group.length).padStart(2, '0') : '';
    lb.classList.toggle('single', group.length < 2);
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  };
  const openLb = (items, k = 0) => { if (!lb) return; group = items; gi = k; lbShow(); if (!lb.open) lb.showModal(); };
  if (lb) {
    $('.lb-close', lb).addEventListener('click', () => lb.close());
    $('.lb-prev', lb).addEventListener('click', () => { gi = (gi - 1 + group.length) % group.length; lbShow(); });
    $('.lb-next', lb).addEventListener('click', () => { gi = (gi + 1) % group.length; lbShow(); });
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') $('.lb-prev', lb).click();
      if (e.key === 'ArrowRight') $('.lb-next', lb).click();
    });
    let tx = null;
    lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 50) $(dx < 0 ? '.lb-next' : '.lb-prev', lb).click(); });
  }

  /* ================= GALLERIES + FILTERS ================= */
  $$('.gal').forEach(gal => {
    const figs = $$('figure', gal);
    figs.forEach(f => {
      f.tabIndex = 0;
      const open = () => {
        const vis = figs.filter(x => !x.classList.contains('off'));
        openLb(vis.map(x => ({ src: x.dataset.full, cap: x.querySelector('figcaption')?.textContent })), vis.indexOf(f));
      };
      f.addEventListener('click', open);
      f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  });
  $$('[data-filter-for]').forEach(bar => {
    const gal = document.getElementById(bar.dataset.filterFor); if (!gal) return;
    const btns = $$('button', bar);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
      const f = b.dataset.filter;
      gal.classList.toggle('filtered', f !== 'all');
      $$('figure', gal).forEach(fig => {
        const show = f === 'all' || fig.dataset.cat.split(' ').includes(f);
        fig.classList.toggle('off', !show);
        if (show && !reduce) fig.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.65,.3,1)' });
      });
    }));
  });

  /* ================= REELS ================= */
  $$('[data-reel]').forEach(reel => {
    const slides = $$('.slide', reel), cap = reel.nextElementSibling;
    let i = 0;
    const n = slides.length, mod = k => (k % n + n) % n;
    const render = () => {
      slides.forEach(s => s.className = 'slide');
      slides[mod(i)].classList.add('c');
      slides[mod(i - 1)].classList.add('l1'); slides[mod(i + 1)].classList.add('r1');
      if (n > 4) { slides[mod(i - 2)].classList.add('l2'); slides[mod(i + 2)].classList.add('r2'); }
      if (cap) cap.textContent = slides[mod(i)].dataset.cap;
    };
    $('.prev', reel).addEventListener('click', () => { i--; render(); });
    $('.next', reel).addEventListener('click', () => { i++; render(); });
    slides.forEach((s, k) => s.addEventListener('click', e => {
      if (s.classList.contains('c')) {
        if (e.target.closest('.expand')) openLb(slides.map(x => ({ src: x.querySelector('img').src, cap: x.dataset.cap })), k);
      } else { i = k; render(); }
    }));
    let sx = null;
    reel.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    reel.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 45) { i += dx < 0 ? 1 : -1; render(); } });
    render();
  });

  /* ================= TABS (project record + office stages) ================= */
  $$('[data-tabs]').forEach(wrap => {
    const tabs = $$('[data-tab]', wrap), panels = $$('[data-panel]', wrap);
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.toggle('active', x === t));
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
    }));
  });

  /* ================= CIRCLE ROWS ================= */
  $$('[data-circles]').forEach(wrap => {
    const row = $('.row', wrap), count = row.children.length;
    let i = 0;
    const per = () => matchMedia('(max-width:900px)').matches ? 1 : 3;
    const slide = () => { i = Math.max(0, Math.min(i, count - per())); row.style.transform = `translateX(-${i * 100 / per()}%)`; };
    $('.prev', wrap).addEventListener('click', () => { i = i <= 0 ? count - per() : i - 1; slide(); });
    $('.next', wrap).addEventListener('click', () => { i = i >= count - per() ? 0 : i + 1; slide(); });
    addEventListener('resize', slide);
  });

  /* ================= SCROLL REVEAL ================= */
  const mark = (sel, cls = '', stagger = 0) => $$(sel).forEach((el, i) => {
    el.classList.add('rv'); if (cls) el.classList.add(cls);
    if (stagger) el.style.setProperty('--d', ((i % 8) * stagger).toFixed(2) + 's');
  });
  mark('.block .num'); mark('.block .title', 'fade'); mark('.kicker');
  mark('.reel', 'zoom'); mark('.caption', 'fade');
  mark('.record .tabs'); mark('.record .panel .table-wrap'); mark('.total', 'fade');
  mark('.syn .facts, .water ul', 'left'); mark('.syn .orb', 'zoom'); mark('.syn .story', 'right');
  mark('.vmo > div', '', .15); mark('.circles', 'fade'); mark('.fcar', 'right');
  mark('.ms', 'left', .1); mark('.subhead', 'fade'); mark('.since', 'zoom'); mark('.points li', '', .15);
  mark('.item', '', .12); mark('.sectors > div', '', .15); mark('.logos .ring', 'zoom', .08);
  mark('.moments figure', 'zoom'); mark('details.fleet');
  mark('.counters .cell', '', .12); mark('.cta-row', 'fade');
  mark('.contact-list > div', 'left', .12); mark('.map-wrap', 'right'); mark('.ground', 'fade');
  mark('.shead', 'fade'); mark('.gtools, .stages', 'fade'); mark('.gal figure', 'zoom', .06);
  mark('.wcard', '', .12); mark('.marquee', 'fade'); mark('.scopy', 'left'); mark('.collage', 'zoom');
  mark('.svc-media', 'zoom'); mark('.svc-copy', 'right'); mark('.enq > *', '', .15); mark('.more', 'fade');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach(el => io.observe(el));
  const sp = $('.spine');
  if (sp) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { sp.classList.add('in'); o.disconnect(); } }).observe(sp);

  /* ================= HERO (home slider / inner-page banner) ================= */
  const heroBg = $('#heroSlides') || $('.phero .bg');
  if (heroBg && !reduce) {
    let tk = false;
    addEventListener('scroll', () => {
      if (tk) return; tk = true;
      requestAnimationFrame(() => { heroBg.style.translate = `0 ${Math.min(scrollY, innerHeight) * 0.3}px`; tk = false; });
    }, { passive: true });
  }

  const slides = $$('#heroSlides .hs');
  if (slides.length) {
    const title = $('#heroTitle'), tag = $('#heroTag'), num = $('#heroNum'), nextNum = $('#heroNextNum'), dotsWrap = $('#heroDots');
    const DUR = 7000; let cur = 0, timer;
    const pad = n => String(n + 1).padStart(2, '0');
    const splitTitle = txt => {
      let k = 0;
      return txt.split('|').map(line => line.split(' ').map(word =>
        '<span class="w">' + [...word.replace(/&amp;/g, '&')].map(c => `<span class="ch" style="--i:${k++}">${c === '&' ? '&amp;' : c}</span>`).join('') + '</span>'
      ).join(' ')).join('<br>');
    };
    dotsWrap.innerHTML = slides.map((_, i) => `<button role="tab" aria-label="Slide ${i + 1}"><i></i></button>`).join('');
    const dots = [...dotsWrap.children];
    dotsWrap.style.setProperty('--dur', DUR + 'ms');
    const go = (n, first) => {
      cur = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('on', i === cur));
      dots.forEach((d, i) => { d.classList.remove('on'); d.setAttribute('aria-selected', i === cur); });
      void dotsWrap.offsetWidth; dots[cur].classList.add('on');
      title.classList.remove('show'); num.classList.add('out'); tag.style.opacity = 0;
      setTimeout(() => {
        title.innerHTML = splitTitle(slides[cur].dataset.title);
        tag.textContent = slides[cur].dataset.tag; tag.style.opacity = 1;
        num.textContent = nextNum.textContent = pad(cur);
        requestAnimationFrame(() => requestAnimationFrame(() => { title.classList.add('show'); num.classList.remove('out'); }));
      }, first ? 0 : 450);
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(() => go(cur + 1), DUR);
    };
    $('#heroNext').addEventListener('click', () => go(cur + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    go(0, true);
    new IntersectionObserver(es => { clearTimeout(timer); if (es[0].isIntersecting && !reduce) timer = setTimeout(() => go(cur + 1), DUR); }).observe($('#hero'));
  }

  /* transparent top bar over the hero / banner, solid once scrolled past */
  const navBar = $('#nav'), heroEl = $('#hero') || $('.phero');
  if (navBar && heroEl) {
    const navState = () => { const r = heroEl.getBoundingClientRect(); navBar.classList.toggle('clear', r.bottom > navBar.offsetHeight + 10); };
    addEventListener('scroll', navState, { passive: true }); addEventListener('resize', navState); navState();
  }

  /* ================= SMALL EFFECTS ================= */
  $$('[data-split]').forEach(el => {
    el.innerHTML = el.textContent.split(' ').map((w, i) => `<span class="wd"><span style="--i:${i}">${w}</span></span>`).join(' ');
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { el.classList.add('in'); o.disconnect(); } }, { threshold: .3 }).observe(el);
  });

  $$('[data-tilt]').forEach(w => {
    const box = w.firstElementChild;
    w.addEventListener('pointermove', e => {
      const r = w.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      box.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)`;
    });
    w.addEventListener('pointerleave', () => box.style.transform = '');
  });

  $$('[data-fcar]').forEach(car => {
    const track = $('.ftrack', car), cards = [...track.children], bar = $('.fbar span', car);
    let i = 0, auto;
    const per = () => innerWidth <= 700 ? 1 : innerWidth <= 1000 ? 2 : 3;
    const max = () => Math.max(0, cards.length - per());
    const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
    const render = () => {
      i = Math.max(0, Math.min(i, max()));
      track.style.transform = `translateX(${-i * step()}px)`;
      const w = per() / cards.length * 100;
      bar.style.width = w + '%'; bar.style.left = (max() ? i / max() * (100 - w) : 0) + '%';
    };
    const play = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => { i = i >= max() ? 0 : i + 1; render(); }, 4000); };
    $('.prev', car).addEventListener('click', () => { i = i <= 0 ? max() : i - 1; render(); play(); });
    $('.next', car).addEventListener('click', () => { i = i >= max() ? 0 : i + 1; render(); play(); });
    car.addEventListener('mouseenter', () => clearInterval(auto));
    car.addEventListener('mouseleave', play);
    let sx = null, base = 0, moved = 0;
    track.addEventListener('pointerdown', e => { sx = e.clientX; moved = 0; base = -i * step(); track.classList.add('drag'); track.setPointerCapture(e.pointerId); clearInterval(auto); });
    track.addEventListener('pointermove', e => { if (sx !== null) { moved = e.clientX - sx; track.style.transform = `translateX(${base + moved}px)`; } });
    const end = () => { if (sx === null) return; sx = null; track.classList.remove('drag'); if (Math.abs(moved) > 50) i += moved < 0 ? 1 : -1; render(); play(); };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('click', e => { if (Math.abs(moved) > 8) { e.preventDefault(); e.stopPropagation(); } }, true);
    addEventListener('resize', render);
    render(); play();
  });

  $$('[data-roll]').forEach(b => {
    const v = b.dataset.roll, suf = b.dataset.suffix || '';
    b.setAttribute('aria-label', v + suf);
    b.innerHTML = [...v].map(d => `<span class="roll" aria-hidden="true"><i data-d="${d}">${'0123456789'.split('').map(n => `<em>${n}</em>`).join('')}</i></span>`).join('') + (suf ? `<span aria-hidden="true">${suf}</span>` : '');
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      $$('i[data-d]', b).forEach((col, k) => { col.style.transitionDelay = k * 120 + 'ms'; col.style.transform = `translateY(-${col.dataset.d}em)`; });
    }, { threshold: .6 }).observe(b);
  });

  /* scroll-linked effects */
  const fill = $('#sprogFill'), strip = $('[data-px]'), giant = $('[data-scale]'), bt = $('[data-bt]'), logos = $$('[data-py]');
  const prog = el => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height))); };
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (fill) fill.style.height = (max > 0 ? scrollY / max * 100 : 0) + '%';
    if (reduce) return;
    if (strip && innerWidth > 700) strip.style.transform = `translateX(${(-prog(strip.parentElement) * 10).toFixed(2)}%)`;
    if (giant) giant.style.transform = `scale(${(1.5 - prog(giant.closest('section')) * .5).toFixed(3)})`;
    if (bt) { const p = prog(bt.parentElement); bt.style.transform = `scale(${(1.15 - p * .35).toFixed(3)}) translateX(${((.5 - p) * 10).toFixed(2)}%)`; }
    logos.forEach(l => { const p = prog(l); l.style.transform = `translateY(${((.5 - p) * 2 * +l.dataset.py).toFixed(1)}px)`; });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  /* custom cursor */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    const dot = $('.cur-dot'), ring = $('.cur-ring');
    if (dot && ring) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`;
        dot.classList.add('on'); ring.classList.add('on');
        ring.classList.toggle('big', !!e.target.closest('a,button,.fcard,summary,.ms,.gal figure,.wcard'));
      });
      document.addEventListener('pointerleave', () => { dot.classList.remove('on'); ring.classList.remove('on'); });
      (function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    }
  }

  /* label table cells so tables read as cards on phones */
  $$('.table-wrap table').forEach(t => {
    const heads = $$('thead th', t).map(th => th.textContent.trim());
    $$('tbody tr', t).forEach(tr => [...tr.children].forEach((td, i) => td.setAttribute('data-label', heads[i] || '')));
  });

  /* ================= PROJECT DETAIL WINDOWS ================= */
  const openPj = id => { const d = document.getElementById(id); if (!d) return; root.classList.add('pj-open'); d.showModal(); d._go && d._go(0, true); };
  $$('.slide[data-project]').forEach(s => s.addEventListener('click', e => {
    if (!s.classList.contains('c')) return;
    e.stopImmediatePropagation(); e.preventDefault(); openPj(s.dataset.project);
  }, true));
  $$('[data-pj]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openPj(b.dataset.pj); }));
  $$('dialog.pj').forEach(d => {
    const view = $('.pj-view', d), track = $('.pj-track', d);
    const sl = [...track.children], n = sl.length, thumbs = $('.pj-thumbs', d);
    const pad = k => String(k + 1).padStart(2, '0');
    sl.forEach(s => { const im = $('img', s); const fit = () => s.classList.toggle('tall', im.naturalHeight > im.naturalWidth); im.complete ? fit() : im.addEventListener('load', fit); });
    $('.pj-tot', d).textContent = pad(n - 1);
    thumbs.innerHTML = sl.map((s, k) => `<button aria-label="Photo ${k + 1}"><img src="${$('img', s).dataset.thumb || $('img', s).getAttribute('src')}" alt="" loading="lazy"></button>`).join('');
    const tb = [...thumbs.children];
    let i = 0;
    const go = (k, instant) => {
      i = (k + n) % n;
      if (instant) { track.style.transition = 'none'; requestAnimationFrame(() => track.style.transition = ''); }
      track.style.transform = `translateX(${-i * 100}%)`;
      $('.pj-cur', d).textContent = pad(i);
      tb.forEach((b, j) => b.classList.toggle('on', j === i));
      if (thumbs.scrollWidth > thumbs.clientWidth) thumbs.scrollTo({ left: tb[i].offsetLeft - (thumbs.clientWidth - tb[i].clientWidth) / 2, behavior: instant ? 'auto' : 'smooth' });
    };
    d._go = go;
    $('.prev', d).addEventListener('click', () => go(i - 1));
    $('.next', d).addEventListener('click', () => go(i + 1));
    tb.forEach((b, j) => b.addEventListener('click', () => go(j)));
    d.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
    let x0 = null, dx = 0, w = 1;
    view.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; x0 = e.clientX; dx = 0; w = view.clientWidth; view.classList.add('drag'); view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', e => { if (x0 === null) return; dx = e.clientX - x0; track.style.transform = `translateX(calc(${-i * 100}% + ${dx}px))`; });
    const end = () => { if (x0 === null) return; view.classList.remove('drag'); x0 = null; if (Math.abs(dx) > w * .15) go(i + (dx < 0 ? 1 : -1)); else go(i); };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
    const close = () => d.close();
    $('.pj-close', d).addEventListener('click', close);
    $$('[data-close]', d).forEach(c => c.addEventListener('click', close));
    d.addEventListener('click', e => { if (e.target === d) close(); });
    d.addEventListener('close', () => { if (!$('dialog.pj[open]')) root.classList.remove('pj-open'); });
    go(0, true);
  });
  $$('dialog.pj [data-open]').forEach(btn => btn.addEventListener('click', () => {
    const from = btn.closest('dialog'), to = document.getElementById(btn.dataset.open); if (!to) return;
    from.close(); root.classList.add('pj-open'); to.showModal(); to._go && to._go(0, true);
  }));
  /* open a project window straight from a link such as projects.html#sast */
  const fromHash = { '#luveve': 'pjLuveve', '#fernhill': 'pjFernhill', '#commissioning': 'pjCommission', '#servicing': 'pjServicing', '#sast': 'pjSast' }[location.hash];
  if (fromHash && document.getElementById(fromHash)) setTimeout(() => openPj(fromHash), 900);

  /* ================= ENQUIRY FORM → email ================= */
  const form = $('#enquiry');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const v = n => (form.elements[n]?.value || '').trim();
    const body = `Name: ${v('name')}\nCompany: ${v('company')}\nPhone: ${v('phone')}\nEmail: ${v('email')}\nService: ${v('service')}\n\n${v('message')}`;
    location.href = `mailto:projects@natwecraft.com?subject=${encodeURIComponent('Enquiry: ' + (v('service') || 'General') + ' — ' + v('name'))}&body=${encodeURIComponent(body)}`;
  });
})();
