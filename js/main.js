/* =====================================================================
   AL Rénov — interactions & motion (v2)
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
  const navH = () => parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 80;
  const pad2 = (n) => String(n).padStart(2, '0');

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
  const scrollToTarget = (el) => {
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
     Magnetic buttons (desktop only, subtle)
  ------------------------------------------------------------------ */
  if (hasGsap && finePointer && !reduce) {
    $$('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.22);
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
  $$('.hero__plan .draw, .draw-icon path, .draw-icon rect, .draw-icon circle').forEach((s) => s.setAttribute('pathLength', '1'));

  /* ------------------------------------------------------------------
     Loader → hero intro (headline lines, blueprint drawing, visual)
  ------------------------------------------------------------------ */
  const loader = $('#loader');
  const heroIntro = () => {
    if (!hasGsap || reduce) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('.hero__display .line__in', { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0)
      .to('.hero__display .line', { opacity: 1, duration: 0.1 }, 0)
      .to('.hero__kicker', { opacity: 1, duration: 0.8 }, 0.1)
      .fromTo('.hero__lead, .hero__cta, .hero__trust', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.4)
      .fromTo('.hero__visual', { opacity: 0, y: 40, rotateY: -14 }, { opacity: 1, y: 0, rotateY: 0, duration: 1.5, ease: 'power3.out', clearProps: 'transform' }, 0.25)
      .to('.hero__plan .draw', { strokeDashoffset: 0, duration: 2.4, stagger: 0.08, ease: 'power2.inOut' }, 0.1);
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
     Generic reveals, word reveals, icon draws
  ------------------------------------------------------------------ */
  if (hasGsap && !reduce) {
    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-reveal-stagger]').forEach((wrap) => {
      gsap.to(wrap.children, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: wrap, start: 'top 90%', once: true } });
    });
    $$('[data-words]').forEach((el) => {
      const words = splitWords(el);
      gsap.to(words, { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true } });
    });
    $$('.draw-icon').forEach((svg) => {
      const shapes = $$('path, rect, circle', svg);
      gsap.to(shapes, { strokeDashoffset: 0, duration: 1.3, stagger: 0.12, ease: 'power2.inOut', scrollTrigger: { trigger: svg, start: 'top 88%', once: true } });
    });
    gsap.to('.footer__big', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.from('.radar .dot', { scale: 0, opacity: 0, duration: 0.7, ease: 'back.out(2)', stagger: 0.06, transformOrigin: '50% 50%', scrollTrigger: { trigger: '.radar', start: 'top 75%', once: true } });
    gsap.to('.hero__bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  } else {
    $$('[data-words]').forEach((el) => splitWords(el).forEach((w) => (w.style.opacity = 1)));
  }

  /* ------------------------------------------------------------------
     Before / after slider (hero)
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
      const upd = () => { if (!touched) { setPos(proxy.v); range.value = proxy.v; } };
      gsap.timeline({ delay: visited ? 1.2 : 2.4 })
        .to(proxy, { v: 24, duration: 1.3, ease: 'power2.inOut', onUpdate: upd })
        .to(proxy, { v: 64, duration: 1.4, ease: 'power2.inOut', onUpdate: upd })
        .to(proxy, { v: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: upd });
    }
  }

  /* ------------------------------------------------------------------
     Works — horizontal scroll (pinned scrub on desktop, native on mobile)
  ------------------------------------------------------------------ */
  const worksTrack = $('#worksTrack');
  if (worksTrack) {
    const items = $$('.work:not(.work--cta)', worksTrack);
    const idx = $('#worksIndex'); const bar = $('#worksBar');
    const setProgress = (p) => {
      if (bar) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;
      if (idx) idx.textContent = pad2(Math.min(items.length, Math.max(1, Math.round(p * (items.length - 1)) + 1)));
    };
    setProgress(0);
    const mm = window.matchMedia('(min-width: 901px)');
    let worksTween = null;
    const buildDesktop = () => {
      if (!hasGsap || reduce) return;
      if (worksTween) { worksTween.scrollTrigger && worksTween.scrollTrigger.kill(); worksTween.kill(); worksTween = null; gsap.set(worksTrack, { clearProps: 'transform' }); }
      const dist = () => Math.max(0, worksTrack.scrollWidth - window.innerWidth);
      worksTween = gsap.to(worksTrack, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.works', pin: '#worksPin', start: 'top top', end: () => `+=${dist()}`,
          scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => setProgress(self.progress)
        }
      });
    };
    const swipe = $('#worksSwipe');
    let nudging = false; let nudged = false; let userScrolled = false;
    const hideSwipe = () => { if (swipe) swipe.classList.add('is-hidden'); };
    // Small "peek" of the rail so the horizontal scroll is obvious on touch screens.
    const nudge = () => {
      if (nudged || userScrolled || reduce) return;
      nudged = true; nudging = true;
      const t0 = performance.now(); const D = 1500; const amp = Math.min(72, worksTrack.clientWidth * 0.18);
      const frame = (t) => {
        const p = Math.min(1, (t - t0) / D);
        worksTrack.scrollLeft = amp * Math.sin(p * Math.PI);
        if (p < 1) requestAnimationFrame(frame); else { worksTrack.scrollLeft = 0; nudging = false; }
      };
      requestAnimationFrame(frame);
    };
    const buildMobile = () => {
      if (worksTween) { worksTween.scrollTrigger && worksTween.scrollTrigger.kill(); worksTween.kill(); worksTween = null; gsap.set(worksTrack, { clearProps: 'transform' }); }
      const onS = () => {
        const max = worksTrack.scrollWidth - worksTrack.clientWidth; setProgress(max > 0 ? worksTrack.scrollLeft / max : 0);
        if (!nudging && worksTrack.scrollLeft > 24) { userScrolled = true; hideSwipe(); }
      };
      worksTrack.addEventListener('scroll', onS, { passive: true });
      worksTrack.addEventListener('touchstart', () => { if (nudging) { nudging = false; worksTrack.scrollLeft = 0; } }, { passive: true });
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { setTimeout(nudge, 450); io.disconnect(); } }, { threshold: 0.35 });
        io.observe(worksTrack);
      }
    };
    if (mm.matches) buildDesktop(); else buildMobile();
    mm.addEventListener('change', (e) => { if (e.matches) buildDesktop(); else buildMobile(); if (hasGsap) ScrollTrigger.refresh(); });
  }

  /* ------------------------------------------------------------------
     Méthode — frise avec barre de remplissage au scroll
  ------------------------------------------------------------------ */
  const frise = $('#frise');
  if (frise) {
    const steps = $$('.frise__step', frise);
    const render = (p) => {
      frise.style.setProperty('--p', p.toFixed(4));
      steps.forEach((s, i) => s.classList.toggle('is-active', p >= (i / steps.length) + 0.02));
    };
    if (hasGsap && !reduce) {
      ScrollTrigger.create({ trigger: frise, start: 'top 75%', end: 'bottom 55%', scrub: 0.4, onUpdate: (self) => render(self.progress) });
    } else { render(1); }
  }

  /* ------------------------------------------------------------------
     Avis clients — carrousel (scroll-snap + flèches)
  ------------------------------------------------------------------ */
  const rv = $('#reviewsViewport');
  if (rv) {
    const track = $('#reviewsTrack'); const slides = $$('.review', track);
    const prev = $('#revPrev'); const next = $('#revNext'); const idx = $('#revIndex');
    let current = 0;
    const slideW = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 18);
    const update = () => {
      current = Math.max(0, Math.min(slides.length - 1, Math.round(rv.scrollLeft / slideW())));
      idx.textContent = pad2(current + 1);
      prev.disabled = current === 0; next.disabled = current === slides.length - 1;
    };
    const go = (i) => { const target = Math.max(0, Math.min(slides.length - 1, i)); rv.scrollTo({ left: target * slideW(), behavior: reduce ? 'auto' : 'smooth' }); };
    prev.addEventListener('click', () => go(current - 1));
    next.addEventListener('click', () => go(current + 1));
    rv.addEventListener('scroll', update, { passive: true });
    rv.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(current + 1); if (e.key === 'ArrowLeft') go(current - 1); });
    rv.setAttribute('tabindex', '0'); rv.setAttribute('aria-roledescription', 'carrousel');
    update();
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
