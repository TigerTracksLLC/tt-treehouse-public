// /drop: guests pick videos and photos, they upload straight to Vercel Blob.
import { upload } from '/js/blob-client.js';

const EVENT = 'oct17';
const CONCURRENCY = 2;
const AUTO_RETRIES = 2;

const $ = (id) => document.getElementById(id);
const nameEl = $('name'), contactEl = $('contact'), igEl = $('ig'), errEl = $('detailsErr');
const filesEl = $('files'), picker = $('picker'), queueEl = $('queue');
const statusEl = $('status'), statusText = $('statusText'), statusPct = $('statusPct'), statusBar = $('statusBar'), statusNote = $('statusNote');
const doneEl = $('done'), doneHead = $('doneHead'), doneText = $('doneText');

const items = [];        // { file, li, state: 'wait'|'up'|'ok'|'err', loaded, tries }
let active = 0;
let slug = '';
let sentCount = 0;       // successful uploads already reported in a check-in
let wakeLock = null;

// ---------- details ----------
try {
  nameEl.value = localStorage.getItem('th_drop_name') || '';
  contactEl.value = localStorage.getItem('th_drop_contact') || '';
  igEl.value = localStorage.getItem('th_drop_ig') || '';
} catch {}

function validDetails(showErrors) {
  const name = nameEl.value.trim();
  const contact = contactEl.value.trim();
  const digits = contact.replace(/\D/g, '');
  const okName = name.length >= 2;
  const okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || digits.length >= 10;
  if (showErrors) {
    nameEl.classList.toggle('bad', !okName);
    contactEl.classList.toggle('bad', !okContact);
    if (!okName || !okContact) {
      errEl.textContent = !okName ? 'Add your name so we know who sent these.' : 'Add a phone number or email so we can send you the reel.';
      errEl.hidden = false;
    } else errEl.hidden = true;
  }
  return okName && okContact;
}

[nameEl, contactEl].forEach((el) => el.addEventListener('input', () => {
  el.classList.remove('bad');
  if (!errEl.hidden) validDetails(true);
  try { localStorage.setItem('th_drop_name', nameEl.value); localStorage.setItem('th_drop_contact', contactEl.value); } catch {}
  if (validDetails(false)) pump();
}));
nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); contactEl.focus(); } });
contactEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); igEl.focus(); } });
igEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); igEl.blur(); } });
igEl.addEventListener('input', () => { try { localStorage.setItem('th_drop_ig', igEl.value); } catch {} });

function getSlug() {
  if (!slug) {
    const base = nameEl.value.trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'guest';
    slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return slug;
}

// ---------- picking ----------
filesEl.addEventListener('change', () => { addFiles(filesEl.files); filesEl.value = ''; });
['dragenter', 'dragover'].forEach((t) => picker.addEventListener(t, (e) => { e.preventDefault(); picker.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => picker.addEventListener(t, (e) => { e.preventDefault(); picker.classList.remove('over'); }));
picker.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

$('heroCta').addEventListener('click', (e) => {
  e.preventDefault();
  $('send').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => (nameEl.value ? (contactEl.value ? null : contactEl) : nameEl)?.focus({ preventScroll: true }), 500);
});

$('addMore').addEventListener('click', () => { doneEl.hidden = true; filesEl.click(); });

const isVideo = (f) => (f.type || '').startsWith('video/') || /\.(mov|mp4|m4v|webm|3gp|avi|mkv)$/i.test(f.name);
const isImage = (f) => (f.type || '').startsWith('image/') || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(f.name);

function contentTypeFor(f) {
  if (f.type) return f.type;
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  return ({ mov: 'video/quicktime', mp4: 'video/mp4', m4v: 'video/x-m4v', webm: 'video/webm', '3gp': 'video/3gpp',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif', webp: 'image/webp', gif: 'image/gif', avi: 'video/x-msvideo', mkv: 'video/x-matroska' })[ext] || (isVideo(f) ? 'video/mp4' : 'image/jpeg');
}

function fmtSize(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
  if (b >= 1e6) return Math.round(b / 1e6) + ' MB';
  return Math.max(1, Math.round(b / 1e3)) + ' KB';
}

function addFiles(list) {
  const files = Array.from(list || []).filter((f) => isVideo(f) || isImage(f));
  if (!files.length) return;
  doneEl.hidden = true;
  // videos first, they matter most and take longest
  files.sort((a, b) => (isVideo(b) - isVideo(a)));
  for (const file of files) {
    const li = document.createElement('li');
    li.className = 'qi';
    const vid = isVideo(file);
    const url = URL.createObjectURL(file);
    li.innerHTML = `
      <div class="qi-thumb">${vid ? `<video src="${url}#t=0.1" muted playsinline preload="metadata"></video>` : `<img src="${url}" alt="">`}<span class="tag">${vid ? 'VIDEO' : 'PHOTO'}</span></div>
      <div class="qi-main"><div class="qi-name"></div><div class="qi-meta">${fmtSize(file.size)}</div><div class="qi-bar"><span></span></div></div>
      <div class="qi-side"><span class="qi-state">Waiting</span></div>`;
    li.querySelector('.qi-name').textContent = file.name;
    const thumbImg = li.querySelector('.qi-thumb img');
    if (thumbImg) thumbImg.onerror = () => { thumbImg.remove(); };
    queueEl.appendChild(li);
    items.push({ file, li, state: 'wait', loaded: 0, tries: 0 });
  }
  if (!validDetails(true)) {
    nameEl.value ? contactEl.focus() : nameEl.focus();
    errEl.textContent += ' Your files are ready and will start uploading right after.';
  }
  render();
  pump();
}

// ---------- uploading ----------
function setState(it, state, label) {
  it.state = state;
  it.li.classList.toggle('ok', state === 'ok');
  it.li.classList.toggle('err', state === 'err');
  const side = it.li.querySelector('.qi-side');
  if (state === 'ok') side.innerHTML = '<svg class="check" viewBox="0 0 24 24" aria-label="Uploaded"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  else if (state === 'err') {
    side.innerHTML = '<button type="button" class="qi-retry">Retry</button>';
    side.querySelector('button').onclick = () => { it.tries = 0; it.loaded = 0; setState(it, 'wait', 'Waiting'); pump(); };
  } else side.innerHTML = `<span class="qi-state">${label}</span>`;
}

function pump() {
  if (!validDetails(false)) { render(); return; }
  while (active < CONCURRENCY) {
    const next = items.find((i) => i.state === 'wait');
    if (!next) break;
    send(next);
  }
  render();
}

async function send(it) {
  active++;
  setState(it, 'up', '0%');
  holdWake();
  const safe = it.file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+/, '').slice(-60) || 'clip';
  const pathname = `${EVENT}/pending/${getSlug()}/${safe}`;
  try {
    await upload(pathname, it.file, {
      access: 'public',
      handleUploadUrl: '/api/drop-upload',
      contentType: contentTypeFor(it.file),
      multipart: it.file.size > 25 * 1024 * 1024,
      onUploadProgress: ({ loaded, percentage }) => {
        it.loaded = loaded;
        it.li.querySelector('.qi-bar span').style.width = percentage + '%';
        const st = it.li.querySelector('.qi-state');
        if (st) st.textContent = Math.floor(percentage) + '%';
        render();
      },
    });
    it.loaded = it.file.size;
    it.li.querySelector('.qi-bar span').style.width = '100%';
    setState(it, 'ok');
  } catch (err) {
    console.warn('upload failed', it.file.name, err);
    it.tries++;
    it.loaded = 0;
    it.li.querySelector('.qi-bar span').style.width = '0%';
    if (it.tries <= AUTO_RETRIES) { setState(it, 'retry', 'Retrying'); setTimeout(() => { if (it.state === 'retry') { it.state = 'wait'; pump(); } }, 3000 * it.tries); }
    else setState(it, 'err');
  } finally {
    active--;
    pump();
    maybeFinish();
  }
}

function render() {
  const total = items.length;
  if (!total) { statusEl.hidden = true; return; }
  const ok = items.filter((i) => i.state === 'ok').length;
  const err = items.filter((i) => i.state === 'err').length;
  const bytes = items.reduce((s, i) => s + i.file.size, 0);
  const done = items.reduce((s, i) => s + (i.state === 'ok' ? i.file.size : i.loaded), 0);
  const pct = bytes ? Math.min(100, Math.floor((done / bytes) * 100)) : 0;
  const running = items.some((i) => i.state === 'up' || i.state === 'wait' || i.state === 'retry');
  statusEl.hidden = !running && !err;
  if (!validDetails(false) && running) {
    statusText.textContent = `${total} ready to go`;
    statusPct.textContent = '';
    statusNote.textContent = 'Add your name and phone or email above and they start uploading.';
  } else if (running) {
    statusText.textContent = `Uploading ${Math.min(ok + 1, total)} of ${total}`;
    statusPct.textContent = pct + '%';
    statusNote.textContent = 'Keep this page open until it says done. Big videos can take a minute.';
  } else if (err) {
    statusText.textContent = `${err} didn't go through`;
    statusPct.textContent = '';
    statusNote.textContent = 'Tap retry on those. If you are on cell signal, wifi helps a lot.';
  }
  statusBar.style.width = pct + '%';
}

async function maybeFinish() {
  if (items.some((i) => i.state === 'up' || i.state === 'wait' || i.state === 'retry')) return;
  releaseWake();
  const ok = items.filter((i) => i.state === 'ok').length;
  if (!ok || ok === sentCount) return;
  const newFiles = ok - sentCount;
  sentCount = ok;
  const first = nameEl.value.trim().split(/\s+/)[0];
  const videos = items.filter((i) => i.state === 'ok' && isVideo(i.file)).length;
  doneHead.textContent = `thank you, ${first}.`;
  doneText.textContent = `${ok} ${ok === 1 ? 'file' : 'files'}${videos ? ` (${videos} ${videos === 1 ? 'video' : 'videos'})` : ''} sent. You're on the list for first access to the pro photos and video, and we'll send them your way before anyone else sees them.`;
  doneEl.hidden = false;
  doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try {
    await fetch('/api/drop', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin', name: nameEl.value, contact: contactEl.value, instagram: igEl.value, files: newFiles, slug: getSlug() }),
    });
  } catch {}
}

// ---------- keep the phone awake while uploading ----------
async function holdWake() {
  try { if (!wakeLock && 'wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch {}
}
function releaseWake() { try { wakeLock && wakeLock.release(); } catch {} wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && active) holdWake(); });
window.addEventListener('beforeunload', (e) => { if (active || items.some((i) => i.state === 'wait' || i.state === 'retry')) { e.preventDefault(); e.returnValue = ''; } });
