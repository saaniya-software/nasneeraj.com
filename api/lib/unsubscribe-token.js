/**
 * Signed unsubscribe links for email (List-Unsubscribe URLs).
 * Env: UNSUBSCRIBE_SIGNING_SECRET — required to verify ?token= on one-click / prefill.
 */
const crypto = require("crypto");

const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function secret() {
  return process.env.UNSUBSCRIBE_SIGNING_SECRET?.trim() || "";
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function signUnsubscribeToken(email, interests, issuedAt = Date.now()) {
  const sec = secret();
  if (!sec) return null;
  const normalized = normalizeEmail(email);
  const interestPart = Array.isArray(interests) ? interests.sort().join(",") : "";
  const payload = `${normalized}|${interestPart}|${issuedAt}`;
  const sig = crypto.createHmac("sha256", sec).update(payload).digest("base64url");
  return `${issuedAt}.${sig}`;
}

function verifyUnsubscribeToken(email, interests, token) {
  const sec = secret();
  if (!sec) return { ok: false, error: "Token verification not configured" };
  if (!token || typeof token !== "string") return { ok: false, error: "Invalid token" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Invalid token" };
  const issuedAt = Number(parts[0]);
  if (!Number.isFinite(issuedAt)) return { ok: false, error: "Invalid token" };
  if (Date.now() - issuedAt > MAX_AGE_MS) return { ok: false, error: "Token expired" };

  const expected = signUnsubscribeToken(email, interests, issuedAt);
  if (!expected) return { ok: false, error: "Invalid token" };
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: "Invalid token" };
  }
  return { ok: true };
}

module.exports = {
  normalizeEmail,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
};