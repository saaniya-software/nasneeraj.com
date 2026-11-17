/**
 * Marketing email signup → Resend Audiences (NEW LLC marketing account only).
 * Env: RESEND_API_KEY, RESEND_AUDIENCE_ZEN, RESEND_AUDIENCE_BOOK_COPLANNER
 * Optional: CONSENT_MIRROR_WEBHOOK_URL (Google Apps Script / Sheet append)
 * Do not use the older nasneeraj.com transactional Resend key here.
 */
const crypto = require("crypto");

/** @type {Map<string, { count: number, reset: number }>} */
const rateBuckets = globalThis.__saaniyaSubscribeRate || new Map();
globalThis.__saaniyaSubscribeRate = rateBuckets;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const CONSENT_TEXT_VERSION =
  "Yes, send me email updates from Saaniya Software LLC about the products I checked above. I can unsubscribe at any time. (v1-2026-11-17)";

const INTEREST_TO_ENV = {
  zen: "RESEND_AUDIENCE_ZEN",
  book_coplanner: "RESEND_AUDIENCE_BOOK_COPLANNER",
};

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

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  // Practical server-side check (not full RFC)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function parseBody(req) {
  const body = req.body || {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function hashIp(ip) {
  if (!ip || ip === "unknown") return "";
  const salt = process.env.CONSENT_IP_HASH_SALT || "saaniya-subscribe-v1";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

async function addToAudience(apiKey, audienceId, { email, firstName }) {
  const payload = {
    email,
    unsubscribed: false,
  };
  if (firstName) payload.first_name = firstName;

  const r = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  // Resend may return 409/exists or update — treat 2xx as success
  if (!r.ok) {
    const msg = (data && (data.message || data.error)) || text || `HTTP ${r.status}`;
    const err = new Error(String(msg));
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function writeConsentMirror(row) {
  const url = process.env.CONSENT_MIRROR_WEBHOOK_URL?.trim();
  if (!url) return { skipped: true };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const text = await r.text();
    console.error("[subscribe] consent mirror failed", r.status, text.slice(0, 200));
    return { ok: false };
  }
  return { ok: true };
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

  const body = parseBody(req);

  // Honeypot — bots fill hidden website/company fields
  if (body.website || body.company_url) {
    res.status(200).json({
      ok: true,
      message: "Thanks — you're on the list. Watch for a welcome email soon.",
    });
    return;
  }

  const email = normalizeEmail(body.email);
  const firstName = body.first_name ? String(body.first_name).trim().slice(0, 80) : "";
  const consent = body.consent === true || body.consent === "true" || body.consent === "on";
  const sourcePage = body.source_page
    ? String(body.source_page).trim().slice(0, 200)
    : "saaniya-software.com/email-updates";

  let interests = body.interests;
  if (typeof interests === "string") interests = [interests];
  if (!Array.isArray(interests)) interests = [];
  interests = [
    ...new Set(
      interests
        .map((i) => String(i).trim().toLowerCase())
        .filter((i) => i === "zen" || i === "book_coplanner")
    ),
  ];

  if (!consent || interests.length === 0) {
    res.status(400).json({
      error: "Please choose at least one interest and confirm consent.",
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[subscribe] RESEND_API_KEY missing");
    res.status(503).json({ error: "Signup is temporarily unavailable." });
    return;
  }

  const audienceIds = [];
  for (const interest of interests) {
    const envName = INTEREST_TO_ENV[interest];
    const id = process.env[envName]?.trim();
    if (!id) {
      console.error(`[subscribe] missing env ${envName}`);
      res.status(503).json({ error: "Signup is temporarily unavailable." });
      return;
    }
    audienceIds.push({ interest, id });
  }

  try {
    for (const { id } of audienceIds) {
      await addToAudience(apiKey, id, { email, firstName });
    }

    await writeConsentMirror({
      email,
      first_name: firstName || "",
      audiences: interests.join(","),
      consent_date: new Date().toISOString(),
      source_page: sourcePage,
      consent_text_version: CONSENT_TEXT_VERSION,
      ip_hash: hashIp(ip),
    });

    res.status(200).json({
      ok: true,
      message: "Thanks — you're on the list. Watch for a welcome email soon.",
    });
  } catch (err) {
    console.error("[subscribe] Resend error", err?.status || "", String(err?.message || err).slice(0, 200));
    // Do not reveal whether email already exists
    res.status(200).json({
      ok: true,
      message: "Thanks — you're on the list. Watch for a welcome email soon.",
    });
  }
};
