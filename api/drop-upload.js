// api/drop-upload.js · issues short-lived upload tokens so guests' phones
// upload videos and photos straight to Vercel Blob (no size limit from the
// serverless function, multipart + retries for big videos).
// Requires BLOB_READ_WRITE_TOKEN (added automatically when a Blob store is
// connected to this project in Vercel).

const { handleUpload } = require('@vercel/blob/client');
const { EVENT, PENDING_PREFIX, MAX_FILE_BYTES } = require('./_drop-config');

const ALLOWED_TYPES = [
  'video/*', 'image/*',
  // iPhone and Android variants that sometimes arrive without a generic match
  'video/quicktime', 'video/mp4', 'video/3gpp', 'video/webm', 'video/x-m4v',
  'image/heic', 'image/heif', 'image/jpeg', 'image/png', 'image/webp',
];

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = await readJson(req); } catch { return res.status(400).json({ error: 'Bad request' }); }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Only allow writes into this event's pending folder
        if (!pathname.startsWith(PENDING_PREFIX) || pathname.includes('..')) {
          throw new Error('Invalid upload path');
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 6 * 60 * 60 * 1000, // big videos on slow signal
          tokenPayload: JSON.stringify({ event: EVENT }),
        };
      },
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('drop-upload error', err && err.message);
    return res.status(400).json({ error: (err && err.message) || 'Upload not allowed' });
  }
};
