(() => {
document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';

const ROOMS = [
  { img: 'office', dim: .06, fx: .70, fy: .42, name: 'המשרד' },
  { img: 'conference', dim: .16, fx: .53, fy: .44, name: 'חדר הישיבות' },
  { img: 'meeting', dim: .24, fx: .78, fy: .40, name: 'חדר הצוות' },
  { img: 'desk', dim: .26, fx: .45, fy: .55, name: 'שולחן התיקים' },
  { img: 'reception', dim: .16, fx: .58, fy: .44, name: 'הקבלה' }
];
const IW = 2752, IH = 1536;
const world = document.getElementById('world');
const scenes = ROOMS.map((r, i) => {
  const el = document.createElement('div');
  el.className = 'scene';
  el.innerHTML = `<img src="assets/img/${r.img}.jpg" srcset="assets/img/${r.img}-sm.jpg 1280w, assets/img/${r.img}.jpg 2400w" sizes="100vw" alt="" decoding="async" ${i < 2 ? 'fetchpriority="high"' : ''} style="object-position:${r.fx * 100}% ${r.fy * 100}%">`;
  world.appendChild(el);
  return el;
});
const frame = document.getElementById('door');
let focal = [], dims;
function measure() {
  const W = world.clientWidth, H = world.clientHeight, s = Math.max(W / IW, H / IH), dw = IW * s, dh = IH * s;
  focal = ROOMS.map(r => [(W - dw) * r.fx + r.fx * dw, (H - dh) * r.fy + r.fy * dh]);
  dims = { W, H };
}
measure();
addEventListener('resize', measure);

const rooms = [...document.querySelectorAll('.room')];
const panels = rooms.map(r => r.querySelector('.panel'));
const railLinks = [...document.querySelectorAll('.rail [data-i]')];
const navLinks = [...document.querySelectorAll('.nav [data-a]')];
const anchors = navLinks.map(a => document.getElementById(a.dataset.a));
const where = document.getElementById('where');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const CREEP = .07, DRIFT = .06;

const tA = document.getElementById('ticksA'), tB = document.getElementById('ticksB');
for (let i = 0; i < 24; i++) { tA.appendChild(document.createElement('i')); tB.appendChild(document.createElement('i')); }
const ticks = [...tA.children, ...tB.children];

function targetCam() {
  const y = scrollY, vh = innerHeight;
  for (let i = 0; i < rooms.length; i++) {
    const top = rooms[i].offsetTop, h = rooms[i].offsetHeight;
    if (i === rooms.length - 1) return i;
    if (y < top + h) {
      const dwell = Math.max(1, h - vh), local = y - top;
      if (local <= dwell) return i + CREEP * Math.max(0, local) / dwell;
      return i + CREEP + (1 - CREEP) * Math.min(1, (local - dwell) / vh);
    }
  }
  return rooms.length - 1;
}

let cam = targetCam(), shown = -1, shownA = '';
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function render() {
  const i = Math.min(Math.floor(cam), scenes.length - 1), t = cam - i;
  const lean = Math.min(t, CREEP) / CREEP;
  const tt = ease(Math.max(0, (t - CREEP) / (1 - CREEP)));
  const { W, H } = dims;
  const [fx, fy] = focal[i] || [W / 2, H / 2];
  const bw = Math.max(110, W * .14), bh = H * .38;
  const need = Math.max(Math.max(fx, W - fx) / (bw / 2), Math.max(fy, H - fy) / (bh / 2)) * 1.02;
  const S = Math.pow(need, tt);
  const L = Math.max(0, fx - bw / 2 * S), R = Math.max(0, W - (fx + bw / 2 * S)), T = Math.max(0, fy - bh / 2 * S), B = Math.max(0, H - (fy + bh / 2 * S));
  const rad = Math.max(0, 18 * (1 - tt * 1.4));
  scenes.forEach((el, j) => {
    let vis = false;
    if (j === i) {
      vis = true;
      const s = reduce.matches ? 1 : (1 + DRIFT * lean) * Math.pow(S, .32);
      el.style.zIndex = 1; el.style.transformOrigin = `${fx}px ${fy}px`;
      el.style.transform = `scale(${s.toFixed(4)})`; el.style.clipPath = 'none'; el.style.opacity = 1;
      el.style.setProperty('--dim', Math.min(.8, ROOMS[j].dim + tt * .55).toFixed(3));
    } else if (j === i + 1 && tt > 0) {
      vis = true;
      el.style.zIndex = 2; el.style.transform = 'none'; el.style.setProperty('--dim', ROOMS[j].dim);
      if (reduce.matches) { el.style.clipPath = 'none'; el.style.opacity = tt.toFixed(3); }
      else { el.style.clipPath = `inset(${T.toFixed(1)}px ${R.toFixed(1)}px ${B.toFixed(1)}px ${L.toFixed(1)}px round ${rad.toFixed(1)}px)`; el.style.opacity = Math.min(1, tt * 8).toFixed(3); }
    }
    el.style.visibility = vis ? 'visible' : 'hidden';
  });
  if (!reduce.matches && tt > 0 && tt < 1) {
    frame.style.opacity = (Math.min(1, tt * 8) * (1 - tt)).toFixed(3);
    frame.style.left = L + 'px'; frame.style.top = T + 'px';
    frame.style.width = (W - L - R) + 'px'; frame.style.height = (H - T - B) + 'px';
    frame.style.borderRadius = rad + 'px';
  } else frame.style.opacity = 0;

  panels.forEach((p, j) => {
    const d = cam - j;
    // full clarity holds a little longer on each side of the room's peak moment, then fades as before
    const o = d >= 0 ? 1 - Math.max(0, (d - CREEP) / (1 - CREEP) - .14) * 1.9 : 1 + Math.min(0, d + .12) * 1.9;
    p.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3);
  });
  const near = Math.min(rooms.length - 1, Math.round(cam - CREEP / 2));
  if (near !== shown) {
    shown = near;
    railLinks.forEach(a => a.classList.toggle('on', +a.dataset.i === near));
    where.textContent = ROOMS[near].name;
  }
  const probe = scrollY + innerHeight * .4;
  let act = anchors[0].id;
  anchors.forEach(el => { if (el && el.getBoundingClientRect().top + scrollY <= probe) act = el.id; });
  if (act !== shownA) { shownA = act; navLinks.forEach(a => a.classList.toggle('on', a.dataset.a === act)); }
  const lit = Math.round(cam / (rooms.length - 1) * ticks.length);
  ticks.forEach((tk, k) => tk.classList.toggle('lit', k < lit));
}

/* text that scrolls up toward the header fades out before it reaches it, so the two never overlap */
const fadeEls = [...document.querySelectorAll('.about > div:first-child, .figures > div, .timeline li, .sec-head, .practice > li, .team-lead > .person, .team > li, .clients > li, .cases > li, .note, .contact > div:first-child > *, form.glass, footer')];
function fadeNearTop() {
  const edge = topbar.offsetHeight + 8;
  for (const el of fadeEls) {
    const t = el.getBoundingClientRect().top;
    const o = Math.max(0, Math.min(1, (t - edge + 70) / 90));
    el.style.opacity = o < 1 ? o.toFixed(3) : '';
  }
}
const topbar = document.querySelector('.top');
function loop() {
  topbar.classList.toggle('scrolled', scrollY > 40);
  fadeNearTop();
  const target = targetCam();
  cam += (target - cam) * (reduce.matches ? 1 : .09);
  if (Math.abs(target - cam) < .0005) cam = target;
  render();
  requestAnimationFrame(loop);
}
render();
requestAnimationFrame(loop);

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
