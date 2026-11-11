// /connections: the missed connections card and the "we met at treehouse." story form.
const $ = (id) => document.getElementById(id);
// Vercel Web Analytics custom events
const track = (name, data) => { try { window.va && window.va('event', { name, data }); } catch {} };
const cleanHandle = (v) => v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/[/?#].*$/, '');
const okHandle = (h) => /^[A-Za-z0-9._]{1,30}$/.test(h);
const flag = (el, bad) => { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', bad ? 'true' : 'false'); };
const post = (body) => fetch('/api/drop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

$('heroCard')?.addEventListener('click', () => track('Connections tap', { door: 'card' }));
$('heroCouples')?.addEventListener('click', () => track('Connections tap', { door: 'couples' }));

// ---------- missed connections card ----------
const cForm = $('connectForm'), cFirst = $('cFirst'), cIg = $('cIg'), cCrush = $('cCrush'), cConsent = $('cConsent');
const cErr = $('cErr'), cSubmit = $('cSubmit'), cDone = $('cDone');
// carry the handle over from /drop if they added it there
try { if (!cIg.value) cIg.value = localStorage.getItem('th_drop_ig') || ''; } catch {}
[cFirst, cIg, cCrush].forEach((el) => el.addEventListener('input', () => { el.classList.remove('bad'); el.removeAttribute('aria-invalid'); }));
const interestChips = cForm.querySelector('input[name="cInterest"]').closest('.pchips');
cForm.querySelectorAll('input[name="cInterest"]').forEach((r) => r.addEventListener('change', () => interestChips.classList.remove('bad')));
cConsent.addEventListener('change', () => cConsent.closest('.pconsent').classList.remove('bad'));
const cMode = () => (cForm.querySelector('input[name="cMode"]:checked') || {}).value || 'specific';
function syncMode() {
  const specific = cMode() === 'specific';
  $('cCrushWrap').hidden = !specific;
  const io = $('intOpt'); if (io) io.hidden = !specific;
  cSubmit.textContent = specific ? 'send' : 'keep me in mind';
}
cForm.querySelectorAll('input[name="cMode"]').forEach((r) => r.addEventListener('change', syncMode));
syncMode();

cForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const igHandle = cleanHandle(cIg.value);
  const okFirst = cFirst.value.trim().split(/\s+/).filter(Boolean).length >= 2;
  const okIg = okHandle(igHandle);
  const specific = cMode() === 'specific';
  const okCrush = !specific || cCrush.value.trim().length >= 3;
  const okInterest = specific || !!cForm.querySelector('input[name="cInterest"]:checked');
  flag(cFirst, !okFirst); flag(cIg, !okIg); flag(cCrush, !okCrush);
  interestChips.classList.toggle('bad', !okInterest);
  cConsent.closest('.pconsent').classList.toggle('bad', !cConsent.checked);
  if (!okFirst || !okIg || !okCrush || !okInterest || !cConsent.checked) {
    cErr.textContent = !okFirst ? 'Add your full name, first and last.'
      : !okIg ? 'Add your Instagram handle so we can make the intro.'
      : !okCrush ? 'Tell us a little about who caught your eye.'
      : !okInterest ? 'Pick who you\'re interested in.'
      : 'Check the box to send.';
    cErr.hidden = false;
    const first = !okFirst ? cFirst : !okIg ? cIg : !okCrush ? cCrush : !okInterest ? cForm.querySelector('input[name="cInterest"]') : cConsent;
    try { first.focus({ preventScroll: false }); } catch {}
    return;
  }
  cErr.hidden = true;
  cSubmit.disabled = true;
  cSubmit.textContent = 'sending...';
  try {
    const interest = (cForm.querySelector('input[name="cInterest"]:checked') || {}).value || '';
    const party = (cForm.querySelector('input[name="cParty"]:checked') || {}).value || '';
    const r = await post({ action: 'connect', mode: cMode(), first: cFirst.value.trim(), instagram: igHandle, interest, party, crush: specific ? cCrush.value.trim() : '', consent: true });
    if (!r.ok) throw new Error('bad');
    [...cForm.querySelectorAll('.seg, .fields, .pconsent, #cSubmit')].forEach((el) => { el.hidden = true; });
    cDone.hidden = false;
    track('Singles card', { mode: cMode() });
  } catch {
    cErr.textContent = 'That did not go through. Try again in a moment.';
    cErr.hidden = false;
    cSubmit.disabled = false;
    syncMode();
  }
});

// ---------- "we met at treehouse." story ----------
const sForm = $('storyForm'), sNames = $('sNames'), sIg = $('sIg'), sParty = $('sParty'), sStory = $('sStory');
const sErr = $('sErr'), sSubmit = $('sSubmit'), sDone = $('sDone');
const sStatusWrap = $('sStatusWrap'), sShareWrap = $('sShareWrap');
[sNames, sIg].forEach((el) => el.addEventListener('input', () => { el.classList.remove('bad'); el.removeAttribute('aria-invalid'); }));
[sStatusWrap, sShareWrap].forEach((w) => w.addEventListener('change', () => w.classList.remove('bad')));
const picked = (name) => (sForm.querySelector(`input[name="${name}"]:checked`) || {}).value || '';

sForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const igHandle = cleanHandle(sIg.value);
  const okNames = sNames.value.trim().length >= 3;
  const okIg = okHandle(igHandle);
  const status = picked('sStatus'), share = picked('sShare');
  flag(sNames, !okNames); flag(sIg, !okIg);
  sStatusWrap.classList.toggle('bad', !status);
  sShareWrap.classList.toggle('bad', !share);
  if (!okNames || !okIg || !status || !share) {
    sErr.textContent = !okNames ? 'Add both your names.'
      : !okIg ? 'Add an Instagram handle so we can reach you.'
      : !status ? 'Tell us where you two are now.'
      : 'Tell us whether we can share it.';
    sErr.hidden = false;
    const first = !okNames ? sNames : !okIg ? sIg : sForm.querySelector(`input[name="${!status ? 'sStatus' : 'sShare'}"]`);
    try { first.focus({ preventScroll: false }); } catch {}
    return;
  }
  sErr.hidden = true;
  sSubmit.disabled = true;
  sSubmit.textContent = 'sending...';
  try {
    const r = await post({ action: 'story', names: sNames.value.trim(), instagram: igHandle, party: sParty.value.trim(), status, story: sStory.value.trim(), share });
    if (!r.ok) throw new Error('bad');
    [...sForm.children].forEach((el) => { if (el !== sDone) el.hidden = true; });
    sDone.hidden = false;
    track('Couple story', { status });
  } catch {
    sErr.textContent = 'That did not go through. Try again in a moment.';
    sErr.hidden = false;
    sSubmit.disabled = false;
    sSubmit.textContent = 'send our story';
  }
});

// ---------- reveal on scroll ----------
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12 }) : null;
document.querySelectorAll('.rv').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
