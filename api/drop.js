// api/drop.js · everything behind /drop, /reel and /review except the upload itself.
//
//   POST  { action: 'checkin', name, contact, instagram?, files }   guest finished uploading
//   GET   ?action=reel                                   approved media for /reel
//   GET   ?action=pending      (admin)                   files waiting for review
//   GET   ?action=people       (admin)                   who uploaded, for the reel text
//   POST  { action: 'approve' | 'reject', urls: [] }  (admin)
//
// Admin calls need header x-drop-key matching the DROP_ADMIN_KEY env var.

const crypto = require('crypto');
const { list, put, copy, del, head } = require('@vercel/blob');
const { PENDING_PREFIX, APPROVED_PREFIX, PEOPLE_PREFIX } = require('./_drop-config');

const VIDEO_EXT = /\.(mov|mp4|m4v|webm|3gp|3gpp|avi|mkv)$/i;

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

function kindOf(pathname) {
  return VIDEO_EXT.test(pathname) ? 'video' : 'photo';
}

// pathname looks like oct17/pending/<uploader-slug>/<file>-<suffix>.<ext>
function shape(b) {
  const parts = b.pathname.split('/');
  return {
    url: b.url,
    pathname: b.pathname,
    size: b.size,
    uploadedAt: b.uploadedAt,
    from: parts.length > 3 ? parts[2] : '',
    kind: kindOf(b.pathname),
  };
}

function isAdmin(req) {
  const key = process.env.DROP_ADMIN_KEY;
  const given = req.headers['x-drop-key'] || '';
  if (!key || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, n);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const action = (req.query && req.query.action) || '';

  try {
    // ---------- public reads ----------
    if (req.method === 'GET' && action === 'reel') {
      const items = (await listAll(APPROVED_PREFIX)).map(shape)
        .sort((x, y) => (x.kind === y.kind ? new Date(x.uploadedAt) - new Date(y.uploadedAt) : x.kind === 'video' ? -1 : 1));
      return res.status(200).json({ items });
    }

    // ---------- admin reads ----------
    if (req.method === 'GET' && (action === 'pending' || action === 'people' || action === 'approved')) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong key' });

      if (action === 'pending' || action === 'approved') {
        const prefix = action === 'pending' ? PENDING_PREFIX : APPROVED_PREFIX;
        const items = (await listAll(prefix)).map(shape)
          .sort((x, y) => new Date(y.uploadedAt) - new Date(x.uploadedAt));
        return res.status(200).json({ items });
      }

      const files = await listAll(PEOPLE_PREFIX);
      const people = await Promise.all(files.map(async (f) => {
        try { const r = await fetch(f.url, { cache: 'no-store' }); return await r.json(); } catch { return null; }
      }));
      return res.status(200).json({ people: people.filter(Boolean).sort((a, b) => new Date(b.at) - new Date(a.at)) });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = await readJson(req);

    // ---------- guest check-in after upload ----------
    if (body.action === 'checkin') {
      const name = clean(body.name, 80);
      const contact = clean(body.contact, 120);
      const ig = clean(body.instagram, 40).replace(/^@+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[^A-Za-z0-9._]/g, '');
      const instagram = ig ? '@' + ig : '';
      const files = Math.max(0, Math.min(500, parseInt(body.files, 10) || 0));
      const slug = clean(body.slug, 60).replace(/[^a-z0-9-]/g, '');
      if (!name || !contact || !files) return res.status(400).json({ error: 'Missing details' });
      const record = { name, contact, instagram, files, slug, at: new Date().toISOString() };
      // random suffix keeps the record URL unguessable
      await put(`${PEOPLE_PREFIX}${slug || 'guest'}.json`, JSON.stringify(record), {
        access: 'public', contentType: 'application/json', addRandomSuffix: true,
      });
      return res.status(200).json({ ok: true });
    }

    // ---------- admin moderation ----------
    if (body.action === 'approve' || body.action === 'reject') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong key' });
      const urls = (Array.isArray(body.urls) ? body.urls : []).slice(0, 10);
      const done = [];
      const failed = [];
      for (const url of urls) {
        try {
          const meta = await head(url);
          const pathname = meta.pathname;
          const inPending = pathname.startsWith(PENDING_PREFIX);
          const inApproved = pathname.startsWith(APPROVED_PREFIX);
          if (!inPending && !inApproved) continue;
          if (body.action === 'approve' && inPending) {
            await copy(url, APPROVED_PREFIX + pathname.slice(PENDING_PREFIX.length), {
              access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: meta.contentType,
            });
          }
          await del(url);
          done.push(url);
        } catch (e) {
          console.error('moderation failed', url, e && e.message);
          failed.push(url);
        }
      }
      return res.status(200).json({ ok: failed.length === 0, done, failed });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('drop api error', err && err.message);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
