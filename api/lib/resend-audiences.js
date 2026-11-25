/**
 * Resend marketing audiences used for subscribe / unsubscribe.
 */
const INTEREST_TO_ENV = {
  zen: "RESEND_AUDIENCE_ZEN",
  book_coplanner: "RESEND_AUDIENCE_BOOK_COPLANNER",
};

const INTEREST_LABELS = {
  zen: "GuruVidyaZen / Riyaz Studio",
  book_coplanner: "Book + CoPlanner",
};

function configuredAudienceIds() {
  const out = [];
  for (const [interest, envName] of Object.entries(INTEREST_TO_ENV)) {
    const id = process.env[envName]?.trim();
    if (id) out.push({ interest, id, label: INTEREST_LABELS[interest] });
  }
  return out;
}

async function resendFetch(apiKey, path, options = {}) {
  const r = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: r.ok, status: r.status, data };
}

/**
 * Mark contact unsubscribed in one audience (PATCH by email).
 */
async function unsubscribeFromAudience(apiKey, audienceId, email) {
  const encoded = encodeURIComponent(email);
  const { ok, status, data } = await resendFetch(apiKey, `/audiences/${audienceId}/contacts/${encoded}`, {
    method: "PATCH",
    body: JSON.stringify({ unsubscribed: true }),
  });
  if (ok) return { ok: true };
  if (status === 404) return { ok: false, notFound: true };
  const msg = (data && (data.message || data.error)) || `HTTP ${status}`;
  return { ok: false, error: String(msg) };
}

/**
 * Unsubscribe from selected interests or all configured audiences.
 */
async function unsubscribeEmail(apiKey, email, interests) {
  const audiences = configuredAudienceIds();
  if (!audiences.length) {
    return { ok: false, error: "Audiences not configured" };
  }

  let targets = audiences;
  if (Array.isArray(interests) && interests.length) {
    const set = new Set(interests.map((i) => String(i).toLowerCase()));
    targets = audiences.filter((a) => set.has(a.interest));
  }
  if (!targets.length) {
    return { ok: false, error: "No matching audiences" };
  }

  const results = [];
  let anySuccess = false;
  for (const { interest, id } of targets) {
    const r = await unsubscribeFromAudience(apiKey, id, email);
    results.push({ interest, ...r });
    if (r.ok) anySuccess = true;
    if (r.notFound) {
      /* still ok — not on this list */
      anySuccess = true;
    }
  }

  return { ok: anySuccess, results };
}

module.exports = {
  INTEREST_TO_ENV,
  INTEREST_LABELS,
  configuredAudienceIds,
  unsubscribeEmail,
  unsubscribeFromAudience,
};