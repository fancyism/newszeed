import { put, head } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return res.status(400).json({ ok: false, error: 'invalid_email' });
    }
    const key = `leads/${Buffer.from(email).toString('base64url')}.json`;
    const existing = await head(key).catch(() => null);
    if (existing) return res.status(200).json({ ok: true, duplicate: true });
    await put(
      key,
      JSON.stringify({ email, at: new Date().toISOString(), source: 'newszeed-landing' }),
      { access: 'private', addRandomSuffix: false }
    );
    return res.status(200).json({ ok: true, duplicate: false });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
