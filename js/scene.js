/* ==========================================================
   Сцена «Готовим завтрак»
   Каждый шаг — продолжение предыдущего. Шаги проигрываются
   только вперёд; при скролле назад блюдо остаётся как есть.
   ========================================================== */
window.Scene = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const R = gsap.utils.random;

  const LABELS = ['Тарелка', 'Бриошь', 'Лосось и авокадо', 'Яйцо пашот', 'Голландез', 'Зелень и икра', 'Капучино', 'Подано'];

  // «орбиты» — где парят ингредиенты на первом экране (смещение от финального места)
  const ORBIT = {
    '#briocheP': { x: -450, y: -150, rotation: -26, scale: .8 },
    '#saladP':   { x: 470,  y: 10, rotation: 22, scale: .78 },
    '#eggP':     { x: 330,  y: -190, rotation: 28, scale: .9 },
  };
  const CUP = { x: 868, y: 168 };
  const BEANS = [[95, 120, 20], [30, 330, -40], [968, 430, 70], [880, 960, 10], [120, 950, -70], [640, -40, 45]];

  // украшения: [x, y, тип, поворот, масштаб]
  const GARNISH = [
    [372, 400, 'sprig', -35, .9], [424, 394, 'sprig', 25, .85], [404, 456, 'sprig', 150, .8], [420, 428, 'caviar', 0, 1],
    [586, 520, 'sprig', -20, .9], [638, 512, 'sprig', 35, .85], [618, 576, 'sprig', 165, .8], [632, 546, 'caviar', 20, 1],
    [650, 318, 'sprig', -50, 1], [674, 300, 'sprig', 10, 1], [694, 332, 'sprig', 60, 1], [664, 348, 'sprig', 120, .9],
    [636, 298, 'sprig', -10, .9], [704, 300, 'sprig', 30, .8], [676, 380, 'caviar', 0, 1.35],
    [300, 560, 'chive', 30, 1], [520, 704, 'chive', -20, 1], [724, 430, 'chive', 70, 1], [472, 330, 'chive', 10, 1],
    [560, 318, 'chive', -40, 1], [330, 350, 'chive', 60, 1], [770, 560, 'chive', -60, 1],
  ];

  let played = -1, target = -1, running = false, current = null;
  const bobs = new Map();
  let onStep = () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- PNG вместо иллюстраций ----------
     Положите файл в assets/anim/<имя>.png и добавьте имя в список ниже —
     иллюстрация автоматически заменится картинкой. Имена — см. README. */
  const ANIM_IMAGES = [];

  function swapImages() {
    $$('[data-img]').forEach(g => {
      if (!ANIM_IMAGES.includes(g.dataset.img)) return;
      const src = `assets/anim/${g.dataset.img}.png`;
      const img = new Image();
      img.onload = () => {
        const [x, y, w, h] = g.dataset.box.split(' ').map(Number);
        el('image', { href: src, x, y, width: w, height: h, preserveAspectRatio: 'xMidYMid meet' }, g);
        const il = g.querySelector(':scope > .illus');
        if (il) il.style.display = 'none';
        g.classList.add('has-img');
      };
      img.src = src;
    });
  }

  /* ---------- построение динамических элементов ---------- */
  function build() {
    const gar = $('#garnish');
    GARNISH.forEach(([x, y, type, r, s]) => {
      const g = el('g', { class: 'gi' }, gar);
      const b = el('g', { class: 'bob' }, g);
      const p = el('g', { transform: `translate(${x} ${y}) rotate(${r}) scale(${s})` }, b);
      el('use', { href: `#art-${type}` }, p);
      g.dataset.fx = x; g.dataset.fy = y;
    });

    const beans = $('#beans');
    BEANS.forEach(([x, y, r]) => {
      const g = el('g', { class: 'bean' }, beans);
      const b = el('g', { class: 'bob' }, g);
      const p = el('g', { transform: `translate(${CUP.x} ${CUP.y}) rotate(${r})` }, b);
      el('use', { href: '#art-bean', filter: 'url(#fShadowS)' }, p);
      g.dataset.dx = x - CUP.x; g.dataset.dy = y - CUP.y;
    });

    // капли травяного масла по дуге
    const oil = $('#oil');
    [10, 7, 12, 6, 9, 5, 8].forEach((r, i) => {
      const a = (198 + i * 9) * Math.PI / 180, rad = 214 + (i % 2) * 10;
      el('circle', { class: 'oil-dot', cx: 500 + Math.cos(a) * rad, cy: 500 + Math.sin(a) * rad, r, fill: 'url(#gOil)' }, oil);
    });

    // чёрный перец
    const pep = $('#pepper');
    const seeds = [[380, 420], [410, 448], [366, 446], [424, 416], [398, 400], [600, 532], [628, 560], [590, 566], [640, 540], [612, 520], [355, 470], [650, 575], [440, 455], [575, 545]];
    seeds.forEach(([x, y]) => el('circle', { class: 'pep', cx: x + R(-6, 6), cy: y + R(-6, 6), r: R(1.3, 2.4), fill: '#2B2420' }, pep));

    // крошки бриоши
    const cr = $('#crumbs');
    for (let i = 0; i < 16; i++) {
      const c = el('circle', { class: 'crumb', cx: i % 2 ? 395 : 612, cy: i % 2 ? 445 : 566, r: R(2, 4.5), fill: i % 3 ? '#C98744' : '#F2C886' }, cr);
      c.style.opacity = 0;
    }

    // блики финала
    const sp = $('#sparkles');
    [[330, 300, 1], [700, 640, .8], [455, 380, .6], [780, 260, .7], [250, 520, .7]].forEach(([x, y, s]) => {
      const g = el('g', { class: 'sparkle' }, sp);
      el('path', { d: 'M0,-22 C2,-4 4,-2 22,0 C4,2 2,4 0,22 C-2,4 -4,2 -22,0 C-4,-2 -2,-4 0,-22Z', fill: '#FFF8E6', transform: `translate(${x} ${y}) scale(${s})` }, g);
    });
  }

  /* ---------- покачивание на «орбите» ---------- */
  function bob(node, amp = 12) {
    gsap.set(node, { transformOrigin: '50% 50%' });
    const t = gsap.to(node, {
      y: `+=${amp}`, rotation: `+=${R(-5, 5)}`,
      duration: R(2, 3.2), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: R(0, .8),
    });
    bobs.set(node, t);
  }
  function land(nodes, dur = .6) {
    [].concat(nodes).forEach(n => {
      const t = bobs.get(n);
      if (t) { t.kill(); bobs.delete(n); }
      gsap.to(n, { y: 0, rotation: 0, duration: dur, ease: 'power2.out' });
    });
  }

  /* ---------- начальное состояние ---------- */
  function setInitial() {
    gsap.set('#plateG', { opacity: 0, transformOrigin: '50% 50%' });
    Object.entries(ORBIT).forEach(([sel]) => gsap.set(sel, { opacity: 0, transformOrigin: '50% 50%' }));
    gsap.set('.poached', { opacity: 0, transformOrigin: '50% 50%' });
    gsap.set('.holl', { opacity: 0, scale: .15, transformOrigin: '50% 40%' });
    const CL = $('#crack').getTotalLength();
    gsap.set('#crack', { strokeDasharray: CL, strokeDashoffset: CL });
    $$('.gi').forEach(g => {
      const a = R(0, Math.PI * 2), rad = R(440, 560);
      gsap.set(g, { x: 500 + Math.cos(a) * rad - g.dataset.fx, y: 500 + Math.sin(a) * rad - g.dataset.fy, rotation: R(-140, 140), opacity: 0, transformOrigin: '50% 50%' });
    });
    $$('.bean').forEach(b => gsap.set(b, { x: +b.dataset.dx, y: +b.dataset.dy, opacity: 0, transformOrigin: '50% 50%' }));
    gsap.set('.oil-dot', { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set('.pep', { opacity: 0 });
    gsap.set('#coffeeP', { x: 520, y: -60, rotation: 60, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set('#steam', { opacity: 0 });
    gsap.set('.steam', { strokeDasharray: '70 60', strokeDashoffset: 0 });
    gsap.set('#napkinP', { x: -460, rotation: -25, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set('#cutleryP', { y: 420, opacity: 0 });
    gsap.set('#sprigP', { scale: .3, rotation: -40, opacity: 0, transformOrigin: '0% 100%' });
    gsap.set('.sparkle', { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set('#all', { transformOrigin: '50% 50%' });
    // точки вращения задаём заранее, без них GSAP сдвигает элемент при смене origin
    gsap.set('.salmon-r, #briocheP .half', { transformOrigin: '50% 50%' });
    gsap.set('.poached .squash', { transformOrigin: '50% 80%' });
    gsap.set('#eggTop', { transformOrigin: '50% 100%' });
    gsap.set('#eggBot', { transformOrigin: '50% 0%' });
    ['#str1', '#str2'].forEach(s => { const p = $(s), L = p.getTotalLength(); p.dataset.len = L; gsap.set(p, { strokeDasharray: `${L} ${L}`, strokeDashoffset: L }); });
    const latte = $('#latte'); const LL = latte.getTotalLength(); latte.dataset.len = LL;
    gsap.set(latte, { strokeDasharray: LL, strokeDashoffset: LL, fillOpacity: 0 });
  }

  /* ---------- ШАГИ ---------- */
  const STEPS = [
    // 0 — тарелка опускается, ингредиенты парят вокруг
    () => {
      const tl = gsap.timeline();
      tl.fromTo('#plateG', { opacity: 0, scale: 1.35, rotation: -35 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.7, ease: 'expo.out' });
      Object.entries(ORBIT).forEach(([sel, o], i) => {
        tl.fromTo(sel, { ...o, x: o.x * 1.9, y: o.y * 1.9, opacity: 0 }, { ...o, opacity: 1, duration: 1.8, ease: 'power3.out' }, .35 + i * .14);
      });
      tl.to('.gi', { opacity: 1, duration: 1.4, stagger: { each: .03, from: 'random' } }, .6);
      tl.fromTo('.bean', { opacity: 0, scale: .2 }, { opacity: 1, scale: 1, duration: 1.2, stagger: .08, ease: 'back.out(1.6)' }, .7);
      $$('#briocheP > .bob, #saladP > .bob, #eggP > .bob').forEach(b => bob(b, 14));
      $$('.gi > .bob').forEach(b => bob(b, 9));
      $$('.bean > .bob').forEach(b => bob(b, 10));
      return tl;
    },

    // 1 — бриошь ложится на тарелку
    () => {
      const tl = gsap.timeline();
      tl.add(() => land($('#briocheP > .bob'), 1), 0);
      tl.to('#briocheP', { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.5, ease: 'power3.inOut' }, 0);
      tl.to('#briocheP .half', { scale: 1.06, duration: .16, yoyo: true, repeat: 1, ease: 'power1.inOut', stagger: .1 }, 1.35);
      $$('.crumb').forEach((c, i) => {
        tl.fromTo(c, { x: 0, y: 0, opacity: 1 }, { x: R(-130, 130), y: R(-110, 110), opacity: 0, duration: R(.6, 1), ease: 'power2.out' }, 1.38 + i * .01);
      });
      return tl;
    },

    // 2 — лосось и авокадо
    () => {
      const tl = gsap.timeline();
      tl.add(() => land($('#saladP > .bob'), 1), 0);
      tl.to('#saladP', { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.5, ease: 'power3.inOut' }, 0);
      tl.fromTo('.salmon-r', { rotation: -70, scale: 1.25 }, { rotation: 0, scale: 1, duration: 1.6, ease: 'power3.out', stagger: .15 }, .1);
      tl.fromTo('.avo-s', { opacity: .2 }, { opacity: 1, duration: .5, stagger: .07 }, .9);
      return tl;
    },

    // 3 — фермерское яйцо разбивается → два пашот
    () => {
      const tl = gsap.timeline();
      tl.add(() => land($('#eggP > .bob'), .8), 0);
      tl.to('#eggP', { x: 0, y: 0, rotation: 0, scale: 1.2, duration: 1.2, ease: 'power3.inOut' }, 0);
      tl.to('#eggP', { rotation: 7, duration: .07, yoyo: true, repeat: 5, ease: 'none' });
      tl.to('#crack', { strokeDashoffset: 0, duration: .25, ease: 'power1.in' });
      tl.addLabel('split');
      tl.to('#eggTop', { x: -70, y: -110, rotation: -40, opacity: 0, duration: .9, ease: 'power2.out' }, 'split');
      tl.to('#eggBot', { x: 80, y: -40, rotation: 50, opacity: 0, duration: .9, ease: 'power2.out' }, 'split');
      tl.to('#crack', { opacity: 0, duration: .2 }, 'split');
      tl.fromTo('.poached',
        { opacity: 0, scale: .4, x: i => [100, -112][i], y: i => [-200, -320][i] },
        { opacity: 1, scale: 1, x: 0, y: 0, duration: .75, ease: 'power2.in', stagger: .2 }, 'split+=.05');
      tl.to('.poached .squash', { scaleY: .86, scaleX: 1.08, duration: .13, yoyo: true, repeat: 1, ease: 'power1.out', stagger: .2 }, 'split+=.78');
      return tl;
    },

    // 4 — соус голландез льётся сверху
    () => {
      const tl = gsap.timeline();
      [['#str1', '#h1'], ['#str2', '#h2']].forEach(([s, h], i) => {
        const L = +$(s).dataset.len;
        const at = i * 1.1;
        tl.to(s, { strokeDashoffset: 0, duration: .55, ease: 'power2.in' }, at);
        tl.to(h, { opacity: 1, duration: .2 }, at + .45);
        tl.to(h, { scale: 1, duration: 1.1, ease: 'elastic.out(1, .55)' }, at + .45);
        tl.to(s, { strokeDashoffset: -L, duration: .55, ease: 'power1.in' }, at + .75);
      });
      return tl;
    },

    // 5 — микрозелень, икра, шнитт-лук, травяное масло, перец
    () => {
      const tl = gsap.timeline();
      tl.add(() => land($$('.gi > .bob'), .8), 0);
      tl.to('.gi', { x: 0, y: 0, rotation: 0, duration: 1.5, ease: 'power3.inOut', stagger: { each: .035, from: 'random' } }, 0);
      tl.to('.oil-dot', { scale: 1, opacity: 1, duration: .55, ease: 'back.out(2.2)', stagger: .07 }, 1.2);
      tl.to('.pep', { opacity: 1, duration: .3, stagger: .03 }, 1.3);
      return tl;
    },

    // 6 — зёрна → капучино с латте-артом
    () => {
      const tl = gsap.timeline();
      tl.add(() => land($$('.bean > .bob'), .3), 0);
      tl.to('.bean', { x: 0, y: 0, scale: .3, rotation: 200, duration: 1.1, ease: 'power3.in', stagger: .06 }, 0);
      tl.to('.bean', { opacity: 0, duration: .25 }, 1.2);
      tl.to('#coffeeP', { x: 0, y: 0, rotation: 0, opacity: 1, duration: 1.4, ease: 'power3.out' }, .9);
      tl.to('#latte', { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut' }, 1.9);
      tl.to('#latte', { fillOpacity: 1, duration: .6 }, 2.7);
      tl.to('#steam', { opacity: .35, duration: 1.2 }, 2.4);
      tl.add(() => {
        gsap.to('.steam', { strokeDashoffset: '-=260', duration: 5, ease: 'none', repeat: -1 });
        gsap.to('#steam', { y: -8, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      }, 2.4);
      return tl;
    },

    // 7 — подача: салфетка, приборы, олива, блики
    () => {
      const tl = gsap.timeline();
      tl.to('#napkinP', { x: 0, rotation: 0, opacity: 1, duration: 1.3, ease: 'power3.out' }, 0);
      tl.to('#cutleryP', { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }, .35);
      tl.to('#sprigP', { scale: 1, rotation: 0, opacity: 1, duration: 1.3, ease: 'back.out(1.5)' }, .6);
      tl.to('#all', { rotation: -4, scale: 1.03, duration: 1.8, ease: 'power2.inOut' }, .2);
      tl.to('.sparkle', { scale: 1, opacity: 1, duration: .35, stagger: .14, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.4);
      return tl;
    },
  ];

  /* ---------- очередь шагов ---------- */
  async function run() {
    if (running) return;
    running = true;
    while (played < target) {
      const next = played + 1;
      current = STEPS[next]();
      onStep(next, 'start');
      if (reduce) current.progress(1);
      else {
        current.timeScale(target - next > 0 ? 2.6 : 1);
        await current.then();
      }
      played = next;
      current = null;
      onStep(next, 'done');
    }
    running = false;
  }

  function goTo(n) {
    if (n <= target) return;
    target = Math.min(n, STEPS.length - 1);
    if (current && target > played + 1) current.timeScale(2.6);
    run();
  }

  function init() {
    build();
    setInitial();
    swapImages();
  }

  return {
    init, goTo, LABELS,
    get played() { return played; },
    set onStep(fn) { onStep = fn; },
  };
})();
