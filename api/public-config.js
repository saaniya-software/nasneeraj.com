/**
 * Public client config (no secrets).
 * Env: TURNSTILE_SITE_KEY — Cloudflare Turnstile site key for forms.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const turnstileSiteKey =
    process.env.TURNSTILE_SITE_KEY?.trim() ||
    "0x4AAAAAAFXtuOWL1qhs0Ak7";

  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).json({
    turnstileSiteKey,
    turnstileConfigured: Boolean(process.env.TURNSTILE_SECRET_KEY?.trim()),
  });
};