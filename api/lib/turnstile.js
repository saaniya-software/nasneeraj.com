/**
 * Cloudflare Turnstile server-side verification.
 * Env: TURNSTILE_SECRET_KEY — when unset, verification is skipped (dev/local).
 */
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true, skipped: true };
  if (!token?.trim()) return { ok: false, error: "Captcha required" };
  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await r.json();
    if (!data.success) return { ok: false, error: "Captcha failed" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Captcha verification error" };
  }
}

module.exports = { verifyTurnstile };