# Unsubscribe page — build brief (Cursor)

**From:** Muse (for Neeraj) — 24 Nov 2026
**Why:** Marketing emails go live Dec 1 (Neeraj's decision 24 Nov). The Dec 1 Master Privacy Policy §15 + Terms require every marketing email to contain an unsubscribe LINK. The cold-outreach footer will carry an unsubscribe button linking to this page. Resend Broadcasts use their own link; this page is for everyone else — including cold-outreach recipients who were never in the Resend audiences.
**Deadline:** before Mon 30 Nov (Dec 1 pre-flight). Small job — one page + one endpoint.

## Build

### 1. `unsubscribe.html` — page at https://saaniya-software.com/unsubscribe
- Same look as `email-updates.html` (Saaniya logo, same styling).
- Form: email input + an "Unsubscribe" button. Prefill the email from the `?email=` query param when present.
- On submit, POST to `/api/unsubscribe` and show the success state (same message either way — do not reveal whether the address was subscribed):
  > "You've been unsubscribed from Saaniya Software marketing emails. Receipts, password resets, and account notices will continue."
- No tracking pixels, no analytics beyond what the site already has. Link the Privacy Policy under the form.

### 2. `api/unsubscribe.js` — Vercel serverless endpoint, same style as `api/subscribe.js`
- POST only (405 otherwise). Rate limit 5/hour per IP (same in-memory bucket pattern). Honeypot fields (`website`, `company_url`) — bots get the same success message, nothing recorded.
- Normalize + validate the email the same way as subscribe.js. Always return 200 with the same success message — never reveal whether the address was in the audiences.
- Steps on a valid submit:
  1. For each audience (`RESEND_AUDIENCE_ZEN`, `RESEND_AUDIENCE_BOOK_COPLANNER`), mark the contact unsubscribed via the Resend API (PATCH the contact with `unsubscribed: true` — verify the exact call against Resend's current API docs). A 404 / not-found is fine — cold-outreach recipients were never in the audiences. Use the existing `RESEND_API_KEY` env var ("Website signup form" key). No new keys.
  2. Write a mirror row via `CONSENT_MIRROR_WEBHOOK_URL` (same webhook as subscribe.js): `{email, unsubscribed_date: <ISO now>, source_page: "saaniya-software.com/unsubscribe", ip_hash}`. This write MUST happen even when the address is not in Resend — the mirror is the suppression list the cold sends check before Dec 1.
- Do not add new env vars. Do not touch the Resend audiences' other settings.

## Do NOT change
- `privacy.html` / `terms.html`, the signup form, `api/subscribe.js`, any email copy, Vercel env vars, or anything in the CoPlanner app.

## Verify + report back
- Submit a test address (use your own), then confirm: (a) the mirror got the row with `unsubscribed_date`, (b) the contact shows unsubscribed in Resend (if it was in an audience).
- Confirm `/unsubscribe` loads on the live site and the button works end to end.
- Commit to `master` as usual and reply here with the live URL + the test result.
