export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST supported' });
    return;
  }

  try {
    // Vercel (and many serverless platforms) auto-parses JSON bodies for you.
    const payload = req.body ?? {};

    // This endpoint is a template. Replace the echo logic with real processing or proxying.
    res.status(200).json({
      ok: true,
      echoed: payload,
      note: 'This endpoint is a template for server-side tools. Replace with processing logic.',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
