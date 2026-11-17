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

## Endpoint

`POST /api/subscribe` — honeypot + ~5/IP/hour; writes Resend audiences; optional consent mirror.

## Send gate

Form may collect contacts now. **No marketing Broadcast** until Privacy §13 / Terms marketing line cleared and Neeraj says go.
