/**
 * Marketing email unsubscribe — Resend Audiences + optional signed token (email links).
 * Env: RESEND_API_KEY, RESEND_AUDIENCE_*, TURNSTILE_SECRET_KEY, UNSUBSCRIBE_SIGNING_SECRET
 *
 * Supports RFC 8058 one-click: POST with body List-Unsubscribe=One-Click and email/token in query.
 */
const { verifyTurnstile } = require("./lib/turnstile");
const { unsubscribeEmail, configuredAudienceIds } = require("./lib/resend-audiences");
const { normalizeEmail, verifyUnsubscribeToken } = require("./lib/unsubscribe-token");

/** @type {Map<string, { count: number, reset: number }>} */
const rateBuckets = globalThis.__saaniyaUnsubRate || new Map();
globalThis.__saaniyaUnsubRate = rateBuckets;

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const ONE_CLICK_BODY = "List-Unsubscribe=One-Click";

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  const row = rateBuckets.get(ip);
  if (!row || now > row.reset) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > RATE_LIMIT;
}

function parseBody(req) {
  const body = req.body;
  if (body && typeof body === "object" && !Array.isArray(body)) return body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

function parseInterests(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((i) => String(i).trim().toLowerCase()).filter(Boolean))];
  }
  return String(raw)
    .split(",")
    .map((i) => i.trim().toLowerCase())
    .filter(Boolean);
}

function isOneClickPost(req, body) {
  const header = req.headers["list-unsubscribe-post"];
  if (header && String(header).toLowerCase().includes("one-click")) return true;
  if (typeof body === "string" && body.trim() === ONE_CLICK_BODY) return true;
  if (body && body["List-Unsubscribe"] === "One-Click") return true;
  return false;
}

function safeReply(res, status, payload) {
  res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    res.setHeader("Retry-After", "3600");
    res.status(429).json({ error: "Too many requests. Try again later." });
    return;
  }

  const query = req.query || {};
  let body = parseBody(req);
  if (typeof req.body === "string" && req.body.includes("=")) {
    try {
      const params = new URLSearchParams(req.body);
      const fromForm = {};
      for (const [k, v] of params.entries()) fromForm[k] = v;
      body = { ...fromForm, ...body };
    } catch {
      /* ignore */
    }
  }

  const oneClick = isOneClickPost(req, req.body) || isOneClickPost(req, body);

  const email = normalizeEmail(body.email || query.email);
  const token = String(body.token || query.token || "").trim();
  const interests = parseInterests(body.interests || query.interests);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    safeReply(res, 400, { error: "A valid email is required." });
    return;
  }

  if (body.website || body.company_url) {
    safeReply(res, 200, { ok: true, message: "You have been unsubscribed." });
    return;
  }

  const signingSecret = process.env.UNSUBSCRIBE_SIGNING_SECRET?.trim();
  let tokenOk = false;
  if (token && signingSecret) {
    const check = verifyUnsubscribeToken(email, interests, token);
    tokenOk = check.ok;
    if (!tokenOk && oneClick) {
      safeReply(res, 400, { error: "This unsubscribe link is invalid or expired." });
      return;
    }
  }

  if (!oneClick && !tokenOk) {
    const turnstileToken =
      body["cf-turnstile-response"] || body.turnstileToken || "";
    const captcha = await verifyTurnstile(turnstileToken, ip);
    if (!captcha.ok) {
      safeReply(res, 400, { error: captcha.error || "Captcha failed" });
      return;
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[unsubscribe] RESEND_API_KEY missing");
    safeReply(res, 503, { error: "Unsubscribe is temporarily unavailable." });
    return;
  }

  if (!configuredAudienceIds().length) {
    console.error("[unsubscribe] no audiences configured");
    safeReply(res, 503, { error: "Unsubscribe is temporarily unavailable." });
    return;
  }

  const validInterests = new Set(["zen", "book_coplanner"]);
  const filtered = interests.filter((i) => validInterests.has(i));

  const reason = body.reason ? String(body.reason).trim().slice(0, 80) : "";
  if (reason) {
    console.info("[unsubscribe] reason", reason.replace(/[^\w_-]/g, "_"));
  }

  try {
    const result = await unsubscribeEmail(apiKey, email, filtered.length ? filtered : undefined);
    if (!result.ok) {
      safeReply(res, 502, { error: "We could not complete unsubscribe. Try again or email hello@saaniya-software.com" });
      return;
    }

    safeReply(res, 200, {
      ok: true,
      message: "You have been unsubscribed from Saaniya Software marketing email.",
    });
  } catch (err) {
    console.error("[unsubscribe]", String(err?.message || err).slice(0, 200));
    safeReply(res, 502, { error: "We could not complete unsubscribe. Try again later." });
  }
};