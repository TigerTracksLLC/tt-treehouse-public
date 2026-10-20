// /review: approve or remove uploads, see who sent what.
const $ = (id) => document.getElementById(id);
let key = '';
try { key = sessionStorage.getItem('th_drop_key') || ''; } catch {}
let tab = 'pending';
let data = { pending: [], approved: [], people: [] };
const selected = new Set();

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', 'x-drop-key': key, ...(opts.headers || {}) }, cache: 'no-store' });
  if (r.status === 401) throw new Error('auth');
  if (!r.ok) throw new Error('fail');
  return r.json();
}

async function enter() {
  key = $('key').value.trim() || key;
  try {
    await refresh();
    try { sessionStorage.setItem('th_drop_key', key); } catch {}
    $('gate').hidden = true;
    $('admin').hidden = false;
  } catch (e) {
    $('gateErr').textContent = e.message === 'auth' ? 'That key is not right.' : 'Could not load. Try again.';
    $('gateErr').hidden = false;
  }
}
$('enter').onclick = enter;
$('key').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });

async function refresh() {
  const [p, a, ppl, con] = await Promise.all([
    api('/api/drop?action=pending'), api('/api/drop?action=approved'), api('/api/drop?action=people'), api('/api/drop?action=connections'),
  ]);
  data = { pending: p.items, approved: a.items, people: ppl.people, connections: latestConnections(con.connections || []) };
  $('nConnect').textContent = `(${data.connections.length})`;
  $('nPending').textContent = `(${data.pending.length})`;
  $('nApproved').textContent = `(${data.approved.length})`;
  $('nPeople').textContent = `(${uniquePeople().length})`;
  selected.clear();
  render();
}

// one row per Instagram handle (latest entry wins), with mutual-interest hints
function latestConnections(rows) {
  const by = new Map();
  for (const r of rows) { const k = (r.instagram || '').toLowerCase(); if (k && !by.has(k)) by.set(k, r); }
  const list = [...by.values()];
  const handles = new Set(list.map((r) => r.instagram.toLowerCase()));
  for (const r of list) {
    r.mentions = [...new Set(((r.crush || '').match(/@[A-Za-z0-9._]+/g) || []).map((h) => h.toLowerCase().replace(/\.+$/, '')))].filter((h) => handles.has(h) && h !== r.instagram.toLowerCase());
  }
  const byHandle = new Map(list.map((r) => [r.instagram.toLowerCase(), r]));
  for (const r of list) r.mutual = r.mentions.filter((h) => (byHandle.get(h).mentions || []).includes(r.instagram.toLowerCase()));
  return list;
}

function uniquePeople() {
  const by = new Map();
  for (const p of data.people) {
    const k = (p.slug || p.instagram || '').toLowerCase() || Math.random();
    const cur = by.get(k);
    if (cur) { cur.files += p.files; cur.instagram = cur.instagram || p.instagram; } else by.set(k, { ...p });
  }
  return [...by.values()];
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sz = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e6 ? Math.round(b / 1e6) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');

function render() {
  const view = $('view');
  $('bulk').style.display = (tab === 'people' || tab === 'connect') ? 'none' : '';
  $('bulkYes').style.display = tab === 'pending' ? '' : 'none';
  $('bulkNo').textContent = tab === 'pending' ? 'Delete selected' : 'Take off reel';
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));

  if (tab === 'connect') {
    const rows = data.connections;
    const mutualCount = rows.filter((r) => r.mutual.length).length;
    $('hint').textContent = `Everyone who opted in. Only introduce people when it's mutual, meaning both named each other. Handles aren't verified, so DM both people to confirm before making an intro.${mutualCount ? ` ${mutualCount} ${mutualCount === 1 ? 'person has' : 'people have'} a mutual match.` : ''}`;
    if (!rows.length) { view.innerHTML = '<p class="muted">Nobody has opted in yet.</p>'; return; }
    const ig = (h) => `<a href="https://instagram.com/${esc(h.slice(1))}" target="_blank" rel="noopener">${esc(h)}</a>`;
    view.innerHTML = `<p><button type="button" class="btn btn-ghost btn-small" id="ccsv">Download CSV</button></p>
      <table class="people"><thead><tr><th>Name</th><th>Instagram</th><th>Looking for</th><th>Interested in</th><th>Who caught their eye</th><th>Match</th><th>When</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.first)}</td><td>${ig(r.instagram)}</td><td>${r.mode === 'open' ? 'open to meeting people' : 'someone specific'}</td><td>${esc(r.interest || '')}</td><td>${esc(r.crush || '')}</td><td>${r.mutual.length ? `<strong style="color:var(--lime)">mutual with ${r.mutual.map(ig).join(', ')}</strong>` : r.mentions.length ? `named ${r.mentions.map(ig).join(', ')} (on the list)` : ''}</td><td>${new Date(r.at).toLocaleString()}</td></tr>`).join('')}
      </tbody></table>`;
    $('ccsv').onclick = () => {
      const out = [['first', 'instagram', 'looking_for', 'interested_in', 'who_caught_their_eye', 'mutual_with', 'at'], ...rows.map((r) => [r.first, r.instagram, r.mode || 'specific', r.interest || '', r.crush || '', r.mutual.join(' '), r.at])];
      const safe = (c) => { const v = String(c); return /^[=+\-@]/.test(v) ? "'" + v : v; };
      const blob = new Blob([out.map((x) => x.map((c) => `"${safe(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'treehouse-oct17-missed-connections.csv' }).click();
    };
    return;
  }

  if (tab === 'people') {
    const ppl = uniquePeople();
    $('hint').textContent = 'Everyone who sent something. Copy the handles to DM them the reel and the pro photos.';
    view.innerHTML = `<p><button type="button" class="btn btn-ghost btn-small" id="copy">Copy Instagram handles</button>
      <button type="button" class="btn btn-ghost btn-small" id="csv">Download CSV</button></p>
      <table class="people"><thead><tr><th>Instagram</th><th>Files</th><th>When</th></tr></thead><tbody>
      ${ppl.map((p) => `<tr><td>${p.instagram ? `<a href="https://instagram.com/${esc(p.instagram.slice(1))}" target="_blank" rel="noopener">${esc(p.instagram)}</a>` : '<span class="muted">no handle</span>'}</td><td>${p.files}</td><td>${new Date(p.at).toLocaleString()}</td></tr>`).join('')}
      </tbody></table>`;
    $('copy').onclick = async () => { await navigator.clipboard.writeText(ppl.filter((p) => p.instagram).map((p) => p.instagram).join('\n')); $('copy').textContent = 'Copied'; };
    $('csv').onclick = () => {
      const rows = [['instagram', 'files', 'at'], ...ppl.map((p) => [p.instagram || '', p.files, p.at])];
      const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'treehouse-oct17-uploaders.csv' });
      a.click();
    };
    return;
  }

  const list = data[tab];
  $('hint').textContent = tab === 'pending'
    ? 'Nothing here is public. Add the good ones to the reel, delete the rest.'
    : 'These are live on /reel right now.';
  if (!list.length) { view.innerHTML = `<p class="muted">${tab === 'pending' ? 'All caught up.' : 'Nothing on the reel yet.'}</p>`; return; }
  view.innerHTML = '<div class="agrid"></div>';
  const g = view.firstChild;
  for (const it of list) {
    const c = document.createElement('div');
    c.className = 'acard';
    c.innerHTML = `
      <input type="checkbox" class="pick" aria-label="Select">
      <div class="media">${it.kind === 'video'
        ? `<video src="${esc(it.url)}#t=0.1" controls muted playsinline preload="metadata"></video>`
        : `<a href="${esc(it.url)}" target="_blank" rel="noopener"><img src="${esc(it.url)}" alt="" loading="lazy"></a>`}</div>
      <div class="meta"><b>${esc((it.from || 'guest').replace(/-[a-z0-9]{6}$/, '').replace(/-/g, ' '))}</b>${it.kind} · ${sz(it.size)}</div>
      <div class="acts">${tab === 'pending'
        ? '<button type="button" class="yes">Add to reel</button><button type="button" class="no">Delete</button>'
        : '<a class="yes" style="text-align:center;padding:.6rem;font-size:.8rem;background:var(--green-deep);text-decoration:none" target="_blank" rel="noopener">Open</a><button type="button" class="no">Take off</button>'}</div>`;
    const pick = c.querySelector('.pick');
    pick.onchange = () => { pick.checked ? selected.add(it.url) : selected.delete(it.url); c.classList.toggle('sel', pick.checked); };
    const yes = c.querySelector('.yes');
    if (yes.tagName === 'A') yes.href = it.url; else yes.onclick = () => act('approve', [it.url]);
    c.querySelector('.no').onclick = () => {
      if (tab === 'pending' && !confirmDelete(1)) return;
      act('reject', [it.url]);
    };
    g.appendChild(c);
  }
}

function confirmDelete(n) { return window.confirm(`Delete ${n} ${n === 1 ? 'file' : 'files'} for good?`); }

async function act(action, urls) {
  if (!urls.length) return;
  $('hint').textContent = 'Working...';
  let failed = 0;
  for (let i = 0; i < urls.length; i += 10) {
    $('hint').textContent = `Working... ${Math.min(i + 10, urls.length)} of ${urls.length}`;
    try { const r = await api('/api/drop', { method: 'POST', body: JSON.stringify({ action, urls: urls.slice(i, i + 10) }) }); failed += (r.failed || []).length; }
    catch { failed += Math.min(10, urls.length - i); }
  }
  await refresh();
  if (failed) $('hint').textContent = `${failed} did not go through. Try those again.`;
}

document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => { tab = t.dataset.tab; selected.clear(); render(); }; });
$('selAll').onclick = () => document.querySelectorAll('.acard .pick').forEach((p) => { if (!p.checked) { p.checked = true; p.dispatchEvent(new Event('change')); } });
$('bulkYes').onclick = () => act('approve', [...selected]);
$('bulkNo').onclick = () => {
  if (tab === 'pending' && !confirmDelete(selected.size)) return;
  act('reject', [...selected]);
};

if (key) enter();
