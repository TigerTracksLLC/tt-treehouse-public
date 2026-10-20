// /reel: approved videos first, then photos. Tap to open full screen.
const $ = (id) => document.getElementById(id);
const main = $('reel'), countEl = $('count');
const lb = $('lb'), stage = $('lbStage');
let items = [];
let at = 0;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PLAY = '<span class="play"><span><svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg></span></span>';

function tile(it, i) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tile';
  b.setAttribute('aria-label', it.kind === 'video' ? 'Play video' : 'Open photo');
  b.innerHTML = it.kind === 'video'
    ? `<video src="${esc(it.url)}#t=0.1" muted playsinline preload="metadata"></video>${PLAY}`
    : `<img src="${esc(it.url)}" alt="" loading="lazy" decoding="async">`;
  if (it.kind !== 'video') b.classList.add('is-loading');
  // if this browser can't draw the file (e.g. iPhone HEIC photos), keep a visible tile instead of a blank gap
  const m = b.querySelector('img,video');
  const fallback = () => { b.innerHTML = `<span class="tile-fb">${it.kind === 'video' ? 'Video' : 'Photo'}<small>tap to open</small></span>`; b.onclick = () => window.open(it.url, '_blank', 'noopener'); };
  if (m) m.addEventListener('error', () => { b.classList.remove('is-loading'); fallback(); });
  if (m && m.tagName === 'IMG') m.addEventListener('load', () => b.classList.remove('is-loading'));
  b.onclick = () => open(i);
  return b;
}

function section(label, list, offset) {
  if (!list.length) return;
  const h = document.createElement('p');
  h.className = 'sec-label';
  h.textContent = label;
  const g = document.createElement('div');
  g.className = 'grid';
  list.forEach((it, i) => g.appendChild(tile(it, offset + i)));
  main.append(h, g);
}

async function load() {
  try {
    const r = await fetch('/api/drop?action=reel', { cache: 'no-store' });
    items = (await r.json()).items || [];
  } catch { items = []; }
  const videos = items.filter((i) => i.kind === 'video');
  const photos = items.filter((i) => i.kind !== 'video');
  items = [...videos, ...photos];
  if (!items.length) {
    countEl.textContent = 'The reel is filling up.';
    main.innerHTML = '<div class="empty"><h2 class="display">coming soon.</h2><p>We\'re going through everything now. Check back soon, or <a href="/drop">add yours</a>.</p></div>';
    return;
  }
  const parts = [];
  if (videos.length) parts.push(`${videos.length} ${videos.length === 1 ? 'video' : 'videos'}`);
  if (photos.length) parts.push(`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`);
  countEl.textContent = parts.join(' and ') + ' from the night.';
  section('Videos', videos, 0);
  section('Photos', photos, videos.length);
}

function open(i) {
  at = (i + items.length) % items.length;
  const it = items[at];
  stage.innerHTML = it.kind === 'video'
    ? `<video src="${esc(it.url)}" controls autoplay playsinline></video>`
    : `<img src="${esc(it.url)}" alt="">`;
  $('lbSave').href = it.url + (it.url.includes('?') ? '&' : '?') + 'download=1';
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function close() { lb.classList.remove('open'); stage.innerHTML = ''; document.body.style.overflow = ''; }
$('lbClose').onclick = close;
$('lbPrev').onclick = () => open(at - 1);
$('lbNext').onclick = () => open(at + 1);
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowRight') open(at + 1);
  if (e.key === 'ArrowLeft') open(at - 1);
});

load();
