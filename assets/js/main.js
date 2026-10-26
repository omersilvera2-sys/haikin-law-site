(() => {
document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';

// one office photograph stays behind every section; scrolling moves the content, never the room
const SECTIONS = { home: 'ראשי', practice: 'תחומי עיסוק', about: 'אודות', team: 'הצוות', precedents: 'תקדימים', contact: 'צור קשר' };
const world = document.getElementById('world');
const scene = document.createElement('div');
scene.className = 'scene';
scene.innerHTML = '<img src="assets/img/office.jpg" srcset="assets/img/office-sm.jpg 1280w, assets/img/office.jpg 2400w" sizes="100vw" alt="" decoding="async" fetchpriority="high" style="object-position:70% 42%">';
world.appendChild(scene);

const navLinks = [...document.querySelectorAll('.nav [data-a]')];
const anchors = navLinks.map(a => document.getElementById(a.dataset.a));
const where = document.getElementById('where');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const topbar = document.querySelector('.top');

const tA = document.getElementById('ticksA'), tB = document.getElementById('ticksB');
for (let i = 0; i < 24; i++) { tA.appendChild(document.createElement('i')); tB.appendChild(document.createElement('i')); }
const ticks = [...tA.children, ...tB.children];

let shown = '', lit = -1, queued = false;
function update() {
  queued = false;
  topbar.classList.toggle('scrolled', scrollY > 40);
  const probe = scrollY + innerHeight * .4;
  let act = anchors[0].id;
  anchors.forEach(el => { if (el.getBoundingClientRect().top + scrollY <= probe) act = el.id; });
  if (act !== shown) {
    shown = act;
    where.textContent = SECTIONS[act];
    navLinks.forEach(a => a.classList.toggle('on', a.dataset.a === act));
  }
  const max = document.documentElement.scrollHeight - innerHeight;
  const n = Math.round((max > 0 ? scrollY / max : 0) * ticks.length);
  if (n !== lit) { lit = n; ticks.forEach((tk, k) => tk.classList.toggle('lit', k < n)); }
}
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
addEventListener('resize', update);
update();

// the portrait stands centred in the open space between the page's left edge and the headline
const portrait = document.querySelector('.portrait');
const heroInner = document.querySelector('.hero-room .panel-inner');
const heroText = [...document.querySelectorAll('.hero, .hero-room .hint')];
function placePortrait() {
  if (!portrait) return;
  if (getComputedStyle(portrait).position !== 'absolute') { portrait.style.left = ''; return; }
  const edge = heroInner.getBoundingClientRect().left;
  // measure where the words actually start, not the edges of their boxes
  let textLeft = Infinity;
  for (const el of heroText) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) {
      if (!n.textContent.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const box of r.getClientRects()) textLeft = Math.min(textLeft, box.left);
    }
  }
  const w = portrait.getBoundingClientRect().width;
  portrait.style.left = Math.max(edge, (edge + textLeft) / 2 - w / 2) + 'px';
}
placePortrait();
addEventListener('resize', placePortrait);
document.fonts && document.fonts.ready.then(placePortrait);

const fine = matchMedia('(pointer: fine)');
addEventListener('pointermove', e => {
  if (reduce.matches || !fine.matches) return;
  const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
  world.style.transform = `translate3d(${(-mx * 16).toFixed(1)}px, ${(-my * 10).toFixed(1)}px, 0) scale(1.02)`;
});

const cv = document.getElementById('dust'), cx = cv.getContext('2d');
let CW = 0, CH = 0;
const motes = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.4, vx: (Math.random() - .5) * .00012, vy: -.00004 - Math.random() * .00012, p: Math.random() * 6.28 }));
function size() { const dpr = Math.min(2, devicePixelRatio || 1); CW = cv.clientWidth; CH = cv.clientHeight; cv.width = CW * dpr; cv.height = CH * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
size(); addEventListener('resize', size);
function dust(ts) {
  cx.clearRect(0, 0, CW, CH);
  if (!reduce.matches) {
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy; if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); }
      if (m.x < 0) m.x = 1; if (m.x > 1) m.x = 0;
      const beam = Math.max(0, 1 - Math.abs((m.x - .38) + (m.y - .35) * .9) * 2.2);
      const a = (.1 + beam * .4) * (.6 + .4 * Math.sin(ts / 900 + m.p));
      cx.beginPath(); cx.arc(m.x * CW, m.y * CH, m.r, 0, 6.283); cx.fillStyle = `rgba(232,241,246,${a.toFixed(3)})`; cx.fill();
    }
  }
  requestAnimationFrame(dust);
}
requestAnimationFrame(dust);

const form = document.getElementById('consult'), sent = document.getElementById('sent');
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = form.querySelector('#f-name'), phone = form.querySelector('#f-phone');
  sent.hidden = false;
  if (!name.value.trim() || !phone.value.trim()) {
    sent.textContent = 'נא למלא שם וטלפון כדי שנוכל לחזור אליכם.';
    (!name.value.trim() ? name : phone).focus(); return;
  }
  const who = form.querySelector('#f-who').value, area = form.querySelector('#f-area').value, msg = form.querySelector('#f-msg').value.trim();
  const body = `שם: ${name.value.trim()}\nטלפון: ${phone.value.trim()}\nפונה בשם: ${who}\nנושא: ${area}\n\n${msg}`;
  const href = 'mailto:office@hdl-law.co.il?subject=' + encodeURIComponent('פנייה מהאתר: ' + area) + '&body=' + encodeURIComponent(body);
  sent.innerHTML = '';
  sent.append('הפרטים מוכנים. ');
  const a = document.createElement('a'); a.href = href; a.textContent = 'לשליחה בדוא״ל'; a.style.color = 'inherit';
  sent.append(a, ' או התקשרו ל־03-6091101.');
});
})();
