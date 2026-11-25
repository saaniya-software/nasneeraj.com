# Resend marketing signup (saaniya-software.com)

> Implemented 2026-11-17. Canon brief: `agrawal-llc-docs/docs/ops/resend-signup-form-spec.md`.

## Placement

| Surface | Role |
|---------|------|
| **`/email-updates`** (`email-updates.html`) | Canonical opt-in form |
| `/newsletter` | Alias → same page |
| Homepage | CTA + footer link only |
| `/signup` | Unchanged — product account signup |

## Accounts

- **Marketing Resend** (new LLC account, 2026-11-17): this form + Broadcasts.
- **`nasneeraj.com` Resend** (existing): transactional for product repos — leave alone.

## Env (Vercel project `nasneeraj-com`)

| Var | Purpose |
|-----|---------|
| `RESEND_API_KEY` | Marketing account key “Website signup form” |
| `RESEND_AUDIENCE_ZEN` | `cc52f445-98aa-46a0-8803-c95a14e64375` |
| `RESEND_AUDIENCE_BOOK_COPLANNER` | `d1890e44-0dba-4939-a17e-e1280c4a5455` |
| `CONSENT_MIRROR_WEBHOOK_URL` | Optional Google Sheet / Apps Script append |

Never commit `docs/resendkey.txt` (gitignored).

## Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscribe` | POST | Opt-in — honeypot + ~5/IP/hour; Resend audiences; optional consent mirror |
| `/api/unsubscribe` | POST | Opt-out — Resend `unsubscribed: true`; Turnstile unless one-click token |
| `/unsubscribe` | GET | Public form (alias via `vercel.json`) |

### List-Unsubscribe (RFC 8058)

In each marketing email header:

```text
List-Unsubscribe: <https://saaniya-software.com/unsubscribe?email=ENCODED&token=SIGNED>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

One-click POST target (same query string):

`POST https://saaniya-software.com/api/unsubscribe?email=...&token=...`  
Body: `List-Unsubscribe=One-Click`

Sign `token` with HMAC (`api/lib/unsubscribe-token.js`). Env: **`UNSUBSCRIBE_SIGNING_SECRET`** (32+ random bytes).

Generate a link locally:

```bash
UNSUBSCRIBE_SIGNING_SECRET=your-secret node -e "
  process.env.UNSUBSCRIBE_SIGNING_SECRET='your-secret';
  const { signUnsubscribeToken } = require('./api/lib/unsubscribe-token');
  console.log(signUnsubscribeToken('user@example.com', []));
"
```

## Unsubscribe env (additional)

| Var | Purpose |
|-----|---------|
| `UNSUBSCRIBE_SIGNING_SECRET` | HMAC for email / one-click links |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Bot protection on manual unsubscribe form |

## Send gate

Form may collect contacts now. **No marketing Broadcast** until Privacy §13 / Terms marketing line cleared and Neeraj says go.
