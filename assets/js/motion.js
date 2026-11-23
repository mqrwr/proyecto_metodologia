// ARGOS · movimiento: pantalla de carga, entrada del hero y animaciones al hacer scroll (GSAP + ScrollTrigger)
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sin GSAP o con movimiento reducido: todo visible y quieto.
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    root.classList.add('no-gsap');
    root.classList.remove('is-loading');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Parte un texto en palabras o letras sin perder el HTML de adentro.
  function split(el, mode) {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return walk(n);
      const frag = document.createDocumentFragment();
      const parts = mode === 'ch' ? [...n.textContent] : n.textContent.split(/(\s+)/);
      parts.forEach((t) => {
        if (mode === 'word' && !t.trim()) return frag.append(t);
        const s = document.createElement('span');
        s.className = mode;
        s.textContent = t;
        frag.append(s);
      });
      n.replaceWith(frag);
    });
    walk(el);
    return $$('.' + mode, el);
  }

  // ---------- pantalla de carga + entrada del hero ----------
  const loader = $('#loader');
  const count = $('#count');
  const win = $('.hero__window');

  const desk = matchMedia('(min-width: 761px)');
  const centrar = () => gsap.set(win, desk.matches ? { xPercent: -50, yPercent: -50, x: 0, y: 0 } : { xPercent: 0, yPercent: 0, x: 0, y: 0 });
  centrar();
  desk.addEventListener('change', centrar);
  gsap.set(win, { clipPath: 'inset(48% 48% 48% 48% round 14px)' });
  gsap.set('.w > span', { yPercent: 115 });
  gsap.set(['.nav', '.hero__lead', '.hero__scroll', '.hero__cta'], { autoAlpha: 0 });

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    .fromTo('.hero__bg', { scale: 1.2 }, { scale: 1, duration: 2.4 }, 0)
    .to(win, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.4, ease: 'expo.inOut' }, 0.15)
    .to('.w > span', { yPercent: 0, duration: 1.3, stagger: 0.14 }, 0.55)
    .to(['.nav', '.hero__lead', '.hero__scroll', '.hero__cta'], { autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: 'power2.out' }, 1.1);

  const n = { v: 0 };
  const paint = () => (count.textContent = Math.round(n.v));
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const fill = gsap.to(n, { v: 86, duration: 1.9, ease: 'power2.inOut', onUpdate: paint });

  function salir() {
    loader.style.animation = 'none';
    gsap.timeline()
      .to(n, { v: 100, duration: 0.45, ease: 'power1.out', onUpdate: paint })
      .to('.loader__scene, .loader__word', { autoAlpha: 0, y: -12, duration: 0.35 }, '+=0.1')
      .to(loader, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '<0.1')
      .add(() => intro.play(), '<0.35')
      .add(() => { loader.remove(); root.classList.remove('is-loading'); ScrollTrigger.refresh(); });
  }
  Promise.all([loaded, fill.then()]).then(salir);
  setTimeout(() => loader.isConnected && salir(), 6000); // por si alguna imagen tarda demasiado

  // ---------- hero: al bajar, las palabras se separan y la ventana crece ----------
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.w1', { xPercent: -25, yPercent: -30, ease: 'none' }, 0)
    .to('.w2', { xPercent: 22, ease: 'none' }, 0)
    .to('.w3', { yPercent: 50, ease: 'none' }, 0)
    .to(win, { scale: () => (desk.matches ? 1.3 : 1.08), ease: 'none' }, 0)
    .to('.hero__bg', { yPercent: 10, ease: 'none' }, 0);

  // ---------- carrusel horizontal de mascotas ----------
  const track = $('#pets');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: '.adopt', pin: '.adopt__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true },
    });
  });

  // Las tarjetas entran deslizándose cada vez que cambia la lista
  document.addEventListener('argos:pets', () => {
    gsap.fromTo('.slide', { x: 80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.07 });
    ScrollTrigger.refresh();
  });

  // Cursor redondo "Conóceme" sobre el carrusel
  if (matchMedia('(hover: hover) and (min-width: 761px)').matches) {
    const cur = $('#cursor');
    const mx = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
    const my = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', (e) => { mx(e.clientX); my(e.clientY); }, { passive: true });
    track.addEventListener('pointerover', (e) => { if (e.target.closest('.slide')) gsap.to(cur, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.6)' }); });
    track.addEventListener('pointerout', (e) => { if (!e.relatedTarget?.closest?.('.slide')) gsap.to(cur, { scale: 0, autoAlpha: 0, duration: 0.3 }); });
  }

  // ---------- cómo adoptar: cada frase se disuelve en la siguiente ----------
  const lines = $$('.steps__line');
  const chars = lines.map((l) => split(l, 'ch'));
  const sub = $('#step-sub');
  const num = $('#step-n');
  gsap.set(lines.slice(1), { visibility: 'visible' });
  gsap.set(chars.slice(1).flat(), { autoAlpha: 0, filter: 'blur(14px)', y: 24 });
  let actual = 0;
  const steps = gsap.timeline({
    scrollTrigger: {
      trigger: '.steps', pin: '.steps__pin', start: 'top top', end: () => '+=' + innerHeight * (lines.length - 1) * 0.9, scrub: 0.6,
      onUpdate(self) {
        const i = Math.min(lines.length - 1, Math.round(self.progress * (lines.length - 1)));
        if (i === actual) return;
        actual = i;
        num.textContent = String(i + 1).padStart(2, '0');
        gsap.fromTo(sub, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, onStart: () => (sub.textContent = lines[i].dataset.sub) });
      },
    },
  });
  chars.forEach((c, i) => {
    if (i === chars.length - 1) return;
    steps
      .to(c, { autoAlpha: 0, filter: 'blur(14px)', y: -24, duration: 0.5, stagger: { each: 0.015, from: 'random' } }, i)
      .to(chars[i + 1], { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 0.5, stagger: { each: 0.015, from: 'random' } }, i + 0.3);
  });
  steps.to({}, { duration: 0.3 });

  // ---------- requisitos: la foto se descubre y las líneas se dibujan ----------
  gsap.fromTo('.reqs__img', { clipPath: 'inset(18% 10% 18% 10% round 20px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 20px)', ease: 'none',
    scrollTrigger: { trigger: '.reqs', start: 'top 85%', end: 'center center', scrub: true },
  });
  gsap.from('.reqs__list li', {
    y: 30, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.reqs__list', start: 'top 80%', once: true },
  });

  // ---------- historia: las palabras se encienden al bajar ----------
  const words = split($('#big'), 'word');
  gsap.to(words, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: '#big', start: 'top 80%', end: 'bottom 40%', scrub: true } });
  $$('.story__strip img').forEach((img, i) => {
    gsap.fromTo(img, { y: 60 + (i % 2) * 50 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.story__strip', start: 'top bottom', end: 'bottom 60%', scrub: true } });
  });

  // ---------- pie: la frase grande sube letra por letra ----------
  const footChars = split($('.foot__big'), 'ch');
  gsap.from(footChars, { yPercent: 100, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: '.foot', start: 'top 75%', once: true } });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
