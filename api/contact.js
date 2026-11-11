// api/contact.js — Treehouse Events sponsor inquiry form handler
// Powered by Resend (https://resend.com)
// Requires RESEND_API_KEY environment variable set in Vercel project settings

const { Resend } = require('resend');

// Inquiries go to the Treehouse group inbox. The old events@ address stays on
// as a second recipient until a test inquiry confirms the group receives them.
const TO_EMAILS = ['treehouse@tigertracks.ai', 'events@tigertracks.ai'];
const FROM_EMAIL = 'Treehouse Events <events@tigertracks.ai>'; // tigertracks.ai is verified in Resend

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://treehouseevents.cliffeliz.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  let name, brand, email, tier, message;
  try {
    const body = req.body || {};
    name    = String(body.name    || '').trim().slice(0, 200);
    brand   = String(body.brand   || '').trim().slice(0, 200);
    email   = String(body.email   || '').trim().slice(0, 200);
    tier    = String(body.tier    || '').trim().slice(0, 100);
    message = String(body.message || '').trim().slice(0, 2000);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Basic validation
  if (!name || !email || !brand) {
    return res.status(400).json({ error: 'Name, email, and brand are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Format tier label
  const tierLabels = {
    bronze:   'Community, $5,000 / event',
    gold:     'Featured, $7,500 / event',
    platinum: 'Presenting, $15,000 / event',
    custom:   'Custom package',
    unsure:   'Not sure yet',
  };
  const tierLabel = tierLabels[tier] || tier || 'Not specified';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Build email HTML
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f7;border-radius:8px;">
      <h2 style="font-family:Georgia,serif;color:#1a3a1a;margin-bottom:24px;">New Sponsorship Inquiry</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#666;font-size:13px;width:140px;">Name</td>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#1a1a1a;font-size:14px;font-weight:600;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#666;font-size:13px;">Brand / Company</td>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#1a1a1a;font-size:14px;font-weight:600;">${escapeHtml(brand)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#666;font-size:13px;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#1a1a1a;font-size:14px;"><a href="mailto:${escapeHtml(email)}" style="color:#7eb832;">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#666;font-size:13px;">Tier Interest</td>
          <td style="padding:10px 0;border-bottom:1px solid #e0ddd6;color:#1a1a1a;font-size:14px;">${escapeHtml(tierLabel)}</td>
        </tr>
        ${message ? `
        <tr>
          <td style="padding:10px 0;color:#666;font-size:13px;vertical-align:top;">Message</td>
          <td style="padding:10px 0;color:#1a1a1a;font-size:14px;line-height:1.6;">${escapeHtml(message).replace(/\n/g, '<br>')}</td>
        </tr>` : ''}
      </table>
      <p style="margin-top:32px;font-size:12px;color:#999;">Sent via treehouseevents.cliffeliz.ai/sponsor.html</p>
    </div>
  `;

  // Send via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      TO_EMAILS,
      replyTo: email,
      subject: `Sponsorship Inquiry: ${name} — ${brand} (${tierLabel})`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Server error. Please email us directly at treehouse@tigertracks.ai' });
  }
};
