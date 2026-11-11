/* Locamimi · landing
   1) carosello fish-eye di dischi (drag / rotella orizzontale / frecce / tastiera)
   2) click su un disco → card scrollabili in orizzontale (scroll-snap)
   3) scroll verticale → zoom sul disco in evidenza → sezione Juicy Thursday
   Nessuna dipendenza, nessuna build. */
(() => {
  const SETS = window.LOCAMIMI_SETS || [];
  const LINKS = window.LOCAMIMI_LINKS || {};
  const N = SETS.length;
  if (!N) return;

  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mod = (v, n) => ((v % n) + n) % n;
  const wrap = (v) => mod(v + N / 2, N) - N / 2;

  const hero = $('[data-hero]');
  const stage = $('[data-stage]');
  const zoomer = $('[data-zoomer]');
  const carousel = $('[data-carousel]');
  const copy = $('[data-hero-copy]');
  const controls = $('[data-controls]');
  const hint = $('[data-hint]');
  const wash = $('[data-wash]');
  const now = $('[data-now]');

  /* ——— markup dischi ——— */
  const discHTML = (s, extra = '') =>
    `<div class="disc__label"><img src="${s.fox}" alt="" draggable="false"></div>`;

  const discs = SETS.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `disc disc--${s.label}`;
    b.setAttribute('aria-label', `Apri il set ${s.title}`);
    b.dataset.index = i;
    b.innerHTML = discHTML(s);
    carousel.appendChild(b);
    return b;
  });

  /* ——— fish-eye ——— */
  const spacingFor = () => (window.innerWidth < 760 ? 0.92 : 480 / 420);   // interasse / diametro (Figma desktop 480/420)
  const SX = 0.333, SY = 0.214;  // perdita di scala per posizione (Figma: 0.667 / 0.786 al vicino)
  let pos = 0, target = 0, step = 480, dia = 420;
  let zoomP = 0;

  function measure() {
    dia = discs[0].offsetWidth || 420;
    step = dia * spacingFor();
  }

  function render() {
    const center = mod(Math.round(pos), N);
    const others = 1 - clamp(zoomP * 2.6);
    discs.forEach((el, i) => {
      const d = wrap(i - pos);
      const a = Math.abs(d);
      const edge = clamp((N / 2 - a) / 0.5);        // wrap infinito: scala→0 e dissolvenza ai bordi
      const sx = Math.max(0, (1 - SX * a)) * edge;
      const sy = Math.max(0, (1 - SY * a)) * edge;
      el.style.transform = `translate3d(${(d * step).toFixed(1)}px,0,0) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      el.style.setProperty('--fy', sy > 0.001 ? (sx / sy).toFixed(4) : 1);   // la volpe resta tonda
      el.style.opacity = (i === center ? 1 : others * edge).toFixed(3);
      el.style.zIndex = 100 - Math.round(a * 10);
      el.classList.toggle('is-center', i === center);
      el.tabIndex = zoomP > 0.05 ? -1 : 0;
    });
    const label = SETS[center].title;
    if (now.textContent !== label) now.textContent = label;
  }

  /* ——— animazione ——— */
  let raf = 0;
  function loop() {
    if (!dragging) {
      const dlt = target - pos;
      if (reduce.matches || Math.abs(dlt) < 0.001) { pos = target; render(); raf = 0; return; }
      pos += dlt * 0.14;
    }
    render();
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const goTo = (t) => { target = t; kick(); };

  /* ——— input ——— */
  let dragging = false, startX = 0, startPos = 0, moved = 0, lastX = 0, lastT = 0, vel = 0, suppress = false;
  stage.style.touchAction = 'pan-y';

  stage.addEventListener('pointerdown', (e) => {
    if (zoomP > 0.05 || e.button > 0 || e.target.closest('.hero__controls')) return;
    dragging = true; suppress = false; moved = 0; vel = 0;
    startX = lastX = e.clientX; lastT = e.timeStamp; startPos = pos;
    carousel.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    pos = startPos - dx / step;
    const dt = Math.max(1, e.timeStamp - lastT);
    vel = 0.8 * vel + 0.2 * (-(e.clientX - lastX) / step / dt);
    lastX = e.clientX; lastT = e.timeStamp;
    if (moved > 6) suppress = true;
    kick();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false; carousel.classList.remove('is-dragging');
    target = Math.round(pos + clamp(vel * 220, -1.5, 1.5));
    kick();
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  let wheelT = 0;
  stage.addEventListener('wheel', (e) => {
    if (zoomP > 0.05 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   // lo scroll verticale resta alla pagina
    e.preventDefault();
    pos += e.deltaX / step * 0.9; target = pos;
    kick();
    clearTimeout(wheelT);
    wheelT = setTimeout(() => goTo(Math.round(pos)), 140);
  }, { passive: false });

  $('[data-prev]').addEventListener('click', () => goTo(Math.round(target) - 1));
  $('[data-next]').addEventListener('click', () => goTo(Math.round(target) + 1));
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.round(target) - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.round(target) + 1); }
  });

  discs.forEach((el) => el.addEventListener('click', () => {
    if (suppress) { suppress = false; return; }
    const i = +el.dataset.index;
    const d = wrap(i - Math.round(pos));
    goTo(Math.round(pos) + d);
    openSheet(i);
  }));
  discs.forEach((el) => el.addEventListener('dragstart', (e) => e.preventDefault()));

  /* ——— zoom allo scroll ——— */
  function onScroll() {
    if (reduce.matches) { zoomP = 0; return applyZoom(); }
    const room = hero.offsetHeight - window.innerHeight;
    const y = clamp(-hero.getBoundingClientRect().top, 0, room);
    zoomP = room > 0 ? y / room : 0;
    applyZoom();
  }
  function applyZoom() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const kmax = Math.max(5, Math.hypot(vw, vh) / (0.65 * dia));     // Figma: disco a 2100px su 420 = ×5
    const e = Math.pow(zoomP, 2.2);
    zoomer.style.transformOrigin = '50% 0';
    zoomer.style.transform = zoomP > 0 ? `scale(${(1 + (kmax - 1) * e).toFixed(4)})` : '';
    const fade = 1 - clamp(zoomP * 4);
    copy.style.opacity = fade; controls.style.opacity = fade; hint.style.opacity = fade;
    controls.style.visibility = hint.style.visibility = fade <= 0 ? 'hidden' : '';
    wash.style.opacity = clamp((zoomP - 0.78) / 0.2);
    render();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  reduce.addEventListener?.('change', onScroll);

  /* ——— card (overlay con scroll orizzontale) ——— */
  const sheet = $('[data-sheet]');
  const panel = $('[data-panel]');
  const track = $('[data-track]');
  let lastFocus = null;

  track.innerHTML = SETS.map((s) => `
    <article class="scheda" aria-label="${s.title}">
      <div class="scheda__img scheda__img--${s.label}">
        <div class="disc disc--static disc--${s.label}" aria-hidden="true">${discHTML(s)}</div>
      </div>
      <div class="scheda__body">
        <p class="tag">${s.tag}</p>
        <h3 class="scheda__title">${s.title}</h3>
        <p class="scheda__text">${s.text}</p>
        <a class="btn btn--dark" href="${s.soundcloud || LINKS.soundcloudDefault}" target="_blank" rel="noopener">Scopri il set su SoundCloud<span class="sr-only"> (si apre in una nuova scheda)</span></a>
      </div>
    </article>`).join('');
  const cards = [...track.children];

  function centerCard(i, smooth) {
    const c = cards[i];
    track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  }
  function openSheet(i) {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    centerCard(i, false);
    $('.sheet__close').focus({ preventScroll: true });
  }
  function closeSheet() {
    sheet.hidden = true;
    document.documentElement.style.overflow = '';
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  document.addEventListener('keydown', (e) => {
    if (sheet.hidden) return;
    if (e.key === 'Escape') return closeSheet();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const cur = cards.findIndex((c) => Math.abs(c.offsetLeft + c.offsetWidth / 2 - (track.scrollLeft + track.clientWidth / 2)) < c.offsetWidth / 2);
      const next = clamp((cur < 0 ? 0 : cur) + (e.key === 'ArrowRight' ? 1 : -1), 0, N - 1);
      centerCard(next, true);
    }
    if (e.key === 'Tab') {                                   // focus trap
      const f = [...panel.querySelectorAll('button, a[href], [tabindex="0"]')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // rotella verticale sulle card → scroll orizzontale
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { track.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });

  /* ——— link, reveal, anno ——— */
  const juicy = SETS.find((s) => s.id === 'juicy');
  const scLink = $('[data-sc="juicy"]');
  if (scLink) scLink.href = (juicy && juicy.soundcloud) || LINKS.soundcloudDefault || '#';
  const ig = $('[data-ig]');
  if (ig) ig.href = LINKS.instagram || '#';
  $('[data-year]').textContent = new Date().getFullYear();

  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.18 });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  /* ——— avvio ——— */
  measure(); onScroll(); render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(); });
})();
