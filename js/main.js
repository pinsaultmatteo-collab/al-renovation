/* =====================================================================
   AL Rénov — interactions & motion
   GSAP + ScrollTrigger + Lenis (loaded from CDN, deferred)
   ===================================================================== */
(() => {
  'use strict';

  const html = document.documentElement;
  // Safety net: whatever happens, never leave the loader on screen.
  setTimeout(() => { const l = document.getElementById('loader'); if (l && !l.classList.contains('is-done')) l.classList.add('is-done'); }, 4500);
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const navH = () => parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 76;

  // If GSAP failed to load, show everything and bail out of motion.
  if (!hasGsap) { html.classList.remove('js'); }

  /* ------------------------------------------------------------------
     Year
  ------------------------------------------------------------------ */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis)
  ------------------------------------------------------------------ */
  let lenis = null;
  if (hasGsap && !reduce && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  const scrollToTarget = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const offset = -navH() + 1;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id); if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
      history.replaceState(null, '', id);
    });
  });

  /* ------------------------------------------------------------------
     Nav: scrolled state, hide on scroll down, active link
  ------------------------------------------------------------------ */
  const nav = $('#nav');
  let lastY = 0;
  const onScroll = (yPos) => {
    nav.classList.toggle('is-scrolled', yPos > 24);
    const goingDown = yPos > lastY + 4;
    const goingUp = yPos < lastY - 4;
    if (yPos > 320 && goingDown && !menuOpen) nav.classList.add('is-hidden');
    else if (goingUp || yPos < 320) nav.classList.remove('is-hidden');
    lastY = yPos;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  if (hasGsap) {
    const links = $$('[data-nav]');
    $$('main section[id]').forEach((sec) => {
      const link = links.find((l) => l.getAttribute('href') === `#${sec.id}`);
      if (!link) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) { links.forEach((l) => l.classList.remove('is-active')); link.classList.add('is-active'); }
          else link.classList.remove('is-active');
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;
  const openMenu = () => {
    menuOpen = true;
    menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
  };
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
    if (lenis) lenis.start(); else document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------------------------------------------
     Custom cursor + magnetic buttons (desktop only)
  ------------------------------------------------------------------ */
  if (hasGsap && finePointer && !reduce) {
    const cursor = $('#cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    const hoverables = 'a, button, [data-tilt], .ba__range, summary, input, textarea, select';
    document.addEventListener('pointerover', (e) => { if (e.target.closest(hoverables)) cursor.classList.add('is-active'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest(hoverables)) cursor.classList.remove('is-active'); });

    $$('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ------------------------------------------------------------------
     Split helpers
  ------------------------------------------------------------------ */
  const splitWords = (el) => {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';
    const frag = document.createDocumentFragment();
    text.split(' ').forEach((w, i, arr) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s);
      if (i < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return $$('.w', el);
  };
  $$('.hero__display .line').forEach((line) => {
    const inner = document.createElement('span'); inner.className = 'line__in';
    while (line.firstChild) inner.appendChild(line.firstChild);
    line.appendChild(inner);
  });
  // Make every "draw" shape normalised to a path length of 1.
  $$('.draw, .draw-icon path, .draw-icon rect, .draw-icon circle').forEach((s) => s.setAttribute('pathLength', '1'));

  /* ------------------------------------------------------------------
     Hero — 3D room built from planks + scroll-scrubbed timeline
  ------------------------------------------------------------------ */
  const planksWrap = $('#planks');
  const palette = [['#c39a70', '#b48a5f'], ['#b58b62', '#a87f57'], ['#c9a077', '#bb9068'], ['#ad855c', '#a07852']];
  // 10 rows of parquet: even rows = 3 full planks, odd rows = half + 2 full + half (staggered joints)
  let plankIndex = 0;
  for (let row = 0; row < 10; row++) {
    const pattern = row % 2 === 0 ? [2, 2, 2] : [1, 2, 2, 1];
    pattern.forEach((span) => {
      const p = document.createElement('span'); p.className = 'plank' + (span === 1 ? ' plank--half' : '');
      const [c1, c2] = palette[(plankIndex * 7) % palette.length];
      p.style.setProperty('--c1', c1); p.style.setProperty('--c2', c2);
      planksWrap.appendChild(p); plankIndex++;
    });
  }

  const heroSteps = $$('.hero__steps li');
  const setStep = (i) => heroSteps.forEach((li, k) => li.classList.toggle('is-active', k === i));

  if (hasGsap && !reduce) {
    const planks = $$('.plank');
    const lampInner = $('#lampInner');
    const room = $('#room');
    gsap.set(planks, { yPercent: -35, opacity: 0 });
    gsap.set(lampInner, { yPercent: -140, opacity: 0 });
    gsap.set('.lamp__bulb', { boxShadow: '0 0 14px 4px rgba(255,210,150,0), 0 0 60px 20px rgba(255,190,120,0)' });

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    tl.to(planks, { yPercent: 0, opacity: 1, duration: 1.2, stagger: { each: 0.035, from: 'start' } }, 0)
      .to('.paint--back', { scaleX: 1, duration: 1.1, ease: 'power1.inOut' }, 0.85)
      .to('.paint--left', { scaleX: 1, duration: 0.95, ease: 'power1.inOut' }, 1.3)
      .to('.plinth', { scaleX: 1, duration: 0.5, stagger: 0.15 }, 1.9)
      .to('.window .draw', { strokeDashoffset: 0, duration: 0.8, stagger: 0.12, ease: 'power1.inOut' }, 2.1)
      .to('.window__sky', { opacity: 1, duration: 0.5 }, 2.75)
      .to('.door .draw', { strokeDashoffset: 0, duration: 0.8, stagger: 0.12, ease: 'power1.inOut' }, 2.35)
      .to('.door__leaf', { opacity: 1, duration: 0.45 }, 3.0)
      .to('.door__knob', { opacity: 1, duration: 0.3 }, 3.15)
      .to(lampInner, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 3.3)
      .to('.lamp__bulb', { backgroundColor: '#ffe1b5', boxShadow: '0 0 14px 4px rgba(255,210,150,0.85), 0 0 60px 20px rgba(255,190,120,0.35)', duration: 0.35 }, 4.1)
      .to('.glow', { opacity: 1, duration: 0.6 }, 4.1)
      .to(room, { '--ry': -26, '--rx': -20, duration: tl.duration() || 4.7, ease: 'none' }, 0);

    const pinEl = $('.hero__pin');
    const cue = $('.hero__cue');
    const canPin = () => pinEl.offsetHeight <= window.innerHeight + 8;
    let heroST = null; let pinned = null;
    const createHeroTrigger = () => {
      const doPin = canPin();
      if (heroST && pinned === doPin) return;
      if (heroST) heroST.kill();
      pinned = doPin;
      heroST = ScrollTrigger.create({
        trigger: '.hero',
        start: doPin ? 'top top' : 'top 15%',
        end: doPin ? '+=150%' : 'bottom 70%',
        pin: doPin ? pinEl : false,
        pinSpacing: true,
        scrub: 0.7,
        animation: tl,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          setStep(p < 0.22 ? 0 : p < 0.5 ? 1 : p < 0.76 ? 2 : 3);
          if (cue) cue.style.opacity = String(Math.max(0, 1 - p * 4));
        }
      });
    };
    createHeroTrigger();
    let hrz; window.addEventListener('resize', () => { clearTimeout(hrz); hrz = setTimeout(createHeroTrigger, 250); });
    setStep(0);

    // Pointer parallax on the room
    if (finePointer) {
      const mx = gsap.quickTo(room, '--mx', { duration: 0.8, ease: 'power3' });
      const my = gsap.quickTo(room, '--my', { duration: 0.8, ease: 'power3' });
      $('.hero').addEventListener('pointermove', (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        my(nx * 7); mx(-ny * 4);
      });
      $('.hero').addEventListener('pointerleave', () => { mx(0); my(0); });
    }
  } else if (!hasGsap || reduce) {
    setStep(3);
    $$('.plank').forEach((p) => { p.style.opacity = 1; });
    $('#lamp').classList.add('is-on');
  }

  /* ------------------------------------------------------------------
     Loader → hero intro
  ------------------------------------------------------------------ */
  const loader = $('#loader');
  const heroIntro = () => {
    if (!hasGsap || reduce) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('.hero__display .line__in', { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.14 }, 0)
      .to('.hero__display .line', { opacity: 1, duration: 0.1 }, 0)
      .to('.hero__kicker', { opacity: 1, duration: 0.8 }, 0.15)
      .fromTo('.hero__lead, .hero__cta, .hero__steps', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.45)
      .fromTo('#scene', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, 0.2);
  };
  const finishLoader = () => {
    if (!loader) return;
    if (!hasGsap || reduce) { loader.classList.add('is-done'); return; }
    gsap.to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', onComplete: () => loader.classList.add('is-done') });
    heroIntro();
  };
  const visited = (() => { try { return sessionStorage.getItem('al-visited'); } catch (e) { return null; } })();
  try { sessionStorage.setItem('al-visited', '1'); } catch (e) { /* private mode */ }
  const minWait = visited ? 250 : 1350;
  const start = performance.now();
  const ready = () => { const wait = Math.max(0, minWait - (performance.now() - start)); setTimeout(finishLoader, wait); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();

  /* ------------------------------------------------------------------
     Generic reveals, word reveals, counters, icon draws
  ------------------------------------------------------------------ */
  if (hasGsap && !reduce) {
    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-reveal-stagger]').forEach((wrap) => {
      gsap.to(wrap.children, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    });
    $$('[data-words]').forEach((el) => {
      const words = splitWords(el);
      gsap.to(words, { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true } });
    });
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v); }, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    $$('.draw-icon').forEach((svg) => {
      const shapes = $$('path, rect, circle', svg);
      gsap.to(shapes, { strokeDashoffset: 0, duration: 1.3, stagger: 0.12, ease: 'power2.inOut', scrollTrigger: { trigger: svg, start: 'top 88%', once: true } });
    });
    gsap.to('.footer__big', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.from('.radar .dot', { scale: 0, opacity: 0, duration: 0.7, ease: 'back.out(2)', stagger: 0.06, transformOrigin: '50% 50%', scrollTrigger: { trigger: '.radar', start: 'top 75%', once: true } });
  } else {
    $$('[data-words]').forEach((el) => splitWords(el).forEach((w) => (w.style.opacity = 1)));
    $$('[data-count]').forEach((el) => (el.textContent = el.dataset.count));
  }

  /* ------------------------------------------------------------------
     Tilt cards (desktop)
  ------------------------------------------------------------------ */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach((card) => {
      let raf = null;
      card.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ty', `${(px - 0.5) * 8}deg`);
          card.style.setProperty('--tx', `${(0.5 - py) * 8}deg`);
          card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
          raf = null;
        });
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--tx', '0deg'); card.style.setProperty('--ty', '0deg'); });
    });
  }

  /* ------------------------------------------------------------------
     Before / after slider
  ------------------------------------------------------------------ */
  const ba = $('#ba');
  if (ba) {
    const range = $('#baRange'); const before = $('#baBefore'); const handle = $('#baHandle');
    let touched = false;
    const setPos = (v) => { before.style.clipPath = `inset(0 ${100 - v}% 0 0)`; handle.style.left = `${v}%`; };
    range.addEventListener('input', () => { touched = true; setPos(parseFloat(range.value)); });
    setPos(50);
    if (hasGsap && !reduce) {
      const proxy = { v: 50 };
      ScrollTrigger.create({
        trigger: ba, start: 'top 70%', once: true,
        onEnter: () => {
          gsap.to(proxy, { v: 28, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { if (!touched) { setPos(proxy.v); range.value = proxy.v; } } })
            .then(() => gsap.to(proxy, { v: 62, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { if (!touched) { setPos(proxy.v); range.value = proxy.v; } } }));
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     Stacked project cards
  ------------------------------------------------------------------ */
  if (hasGsap && !reduce) {
    const cards = $$('.stack__card');
    cards.forEach((card, i) => {
      const next = cards[i + 1]; if (!next) return;
      gsap.fromTo(card, { '--sc': 1, '--dim': 0 }, {
        '--sc': 0.93, '--dim': 0.55, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${navH() + 12 + (i + 1) * 10}px`, scrub: true }
      });
    });
  }

  /* ------------------------------------------------------------------
     Process timeline — SVG path drawn through the step badges
  ------------------------------------------------------------------ */
  const timeline = $('#timeline');
  if (timeline) {
    const svg = $('.timeline__svg', timeline);
    const track = $('.timeline__track', timeline);
    const path = $('#timelinePath');
    const marker = $('#timelineMarker');
    const nums = $$('.step__num', timeline);
    const steps = $$('.step', timeline);
    let length = 0; let st = null;

    const build = () => {
      const box = timeline.getBoundingClientRect();
      const pts = nums.map((n) => { const r = n.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }; });
      let d = `M${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]; const b = pts[i]; const my = (a.y + b.y) / 2;
        d += ` C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
      }
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      track.setAttribute('d', d); path.setAttribute('d', d);
      length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      const p0 = path.getPointAtLength(0); marker.style.left = `${p0.x}px`; marker.style.top = `${p0.y}px`;
    };
    const render = (p) => {
      path.style.strokeDashoffset = `${length * (1 - p)}`;
      const pt = path.getPointAtLength(length * p);
      marker.style.left = `${pt.x}px`; marker.style.top = `${pt.y}px`;
      steps.forEach((s, i) => s.classList.toggle('is-active', p >= (i / (steps.length - 1)) - 0.02));
    };
    build();
    if (hasGsap && !reduce) {
      st = ScrollTrigger.create({ trigger: timeline, start: 'top 65%', end: 'bottom 60%', scrub: 0.4, onUpdate: (self) => render(self.progress), onRefresh: () => { build(); } });
    } else { render(1); }
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (st) render(st.progress); }, 150); });
  }

  /* ------------------------------------------------------------------
     Contact form
  ------------------------------------------------------------------ */
  const form = $('#form');
  if (form) {
    const status = $('#formStatus');
    const fields = ['f-name', 'f-phone', 'f-email', 'f-msg', 'f-consent'].map((id) => $(`#${id}`));
    const msg = {
      'f-name': 'Indiquez votre nom pour qu\'Antoine sache à qui il parle.',
      'f-phone': 'Un numéro de téléphone valide (ex. 06 12 34 56 78).',
      'f-email': 'Cette adresse e-mail ne semble pas valide.',
      'f-msg': 'Décrivez votre projet en quelques mots.',
      'f-consent': 'Merci de cocher cette case pour être recontacté.'
    };
    const validate = (input) => {
      const wrap = input.closest('.field'); const err = $('.field__error', wrap);
      let ok = true;
      const v = input.value.trim();
      if (input.type === 'checkbox') ok = input.checked;
      else if (input.required && !v) ok = false;
      else if (input.type === 'tel' && v && !/^(\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/.test(v)) ok = false;
      else if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ok = false;
      wrap.classList.toggle('is-invalid', !ok);
      err.textContent = ok ? '' : msg[input.id];
      return ok;
    };
    fields.forEach((f) => { f.addEventListener('blur', () => validate(f)); f.addEventListener('input', () => { if (f.closest('.field').classList.contains('is-invalid')) validate(f); }); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const results = fields.map(validate);
      if (results.includes(false)) { fields[results.indexOf(false)].focus(); return; }
      const btn = $('.form__submit', form); const label = $('.form__submit-label', form);
      const data = new FormData(form);
      const endpoint = form.getAttribute('action');
      label.textContent = 'Envoi en cours…'; btn.disabled = true;
      // Placeholder endpoint → mailto fallback so the demo still works.
      if (!endpoint || endpoint.includes('VOTRE_ID')) {
        const subject = encodeURIComponent(`Demande de devis – ${data.get('type') || 'rénovation'} – ${data.get('name')}`);
        const body = encodeURIComponent(`Nom : ${data.get('name')}\nTéléphone : ${data.get('phone')}\nE-mail : ${data.get('email') || '—'}\nType de travaux : ${data.get('type') || '—'}\n\nProjet :\n${data.get('message')}`);
        window.location.href = `mailto:contact@al-renov.fr?subject=${subject}&body=${body}`;
        status.textContent = 'Votre messagerie s\'ouvre avec la demande pré-remplie. Si ce n\'est pas le cas, écrivez-nous directement à contact@al-renov.fr.';
        label.textContent = 'Demande préparée'; form.classList.add('is-sent');
        return;
      }
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('bad status');
        status.textContent = 'Merci ! Votre demande est bien envoyée. Antoine vous rappelle sous 48 h.';
        label.textContent = 'Demande envoyée'; form.classList.add('is-sent'); form.reset();
      } catch (err) {
        status.textContent = 'L\'envoi a échoué. Réessayez dans un instant ou appelez directement le 06 00 00 00 00.';
        label.textContent = 'Envoyer ma demande'; btn.disabled = false;
      }
    });
  }

  /* ------------------------------------------------------------------
     Refresh triggers once everything (images, fonts) is in
  ------------------------------------------------------------------ */
  if (hasGsap) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => ScrollTrigger.refresh(), 200); });
  }
})();
