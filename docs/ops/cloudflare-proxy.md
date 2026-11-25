# Cloudflare in front of saaniya-software.com / nasneeraj.com

This marketing site is deployed on **Vercel** (`nasneeraj-com`). You can optionally proxy public hostnames through **Cloudflare** for DDoS protection, WAF, and Turnstile alignment.

## DNS (Cloudflare dashboard)

1. Add the site zone (e.g. `saaniya-software.com`) to Cloudflare.
2. For each hostname that should hit Vercel, create a **CNAME** to the Vercel target (or use Vercel’s recommended DNS records from **Project → Domains**).
3. Enable the **orange cloud (Proxied)** for web records you want protected.
4. Keep **SSL/TLS** mode **Full (strict)** once Vercel issues a valid certificate for the hostname.
5. If you use both `nasneeraj.com` and `saaniya-software.com`, either:
   - proxy both and keep Vercel redirects in `vercel.json`, or
   - leave one hostname DNS-only on Vercel only.

## Turnstile

1. Cloudflare Dashboard → **Turnstile** → create a widget for `saaniya-software.com` (and preview domains if needed).
2. Set Vercel env on project `nasneeraj-com`:
   - `TURNSTILE_SITE_KEY` — public site key (used by `/api/public-config` and forms).
   - `TURNSTILE_SECRET_KEY` — secret key (server verify in `/api/contact`, `/api/unsubscribe`).
3. When `TURNSTILE_SECRET_KEY` is **unset**, the API **skips** captcha (local dev). Production should always set both vars.
4. Forms: **Contact** (`contact.html`), **Unsubscribe** (`unsubscribe.html`).

## Repo-side headers

`vercel.json` already sends HSTS, `X-Frame-Options: DENY`, CSP-Report-Only, etc. Cloudflare can add:

- **Bot Fight Mode** / WAF rules (dashboard; not in git).
- Optional **Cache Rules**: bypass cache for `/api/*` and HTML with short TTL if you terminate cache at Cloudflare (default: Vercel edge is enough for this static site).

Vercel sees client IP via `x-forwarded-for`; when proxied through Cloudflare, that chain includes visitor IP (respect rate limits in `api/contact.js`, `api/subscribe.js`, `api/unsubscribe.js`).

## Email unsubscribe + Cloudflare

Marketing links and RFC 8058 one-click should target:

- Page: `https://saaniya-software.com/unsubscribe?email=...&token=...`
- One-click POST: `https://saaniya-software.com/api/unsubscribe?email=...&token=...`

Generate `token` with `UNSUBSCRIBE_SIGNING_SECRET` (see `docs/ops/resend-marketing-signup.md`).

## Verification

After DNS cutover:

1. `curl -I https://saaniya-software.com` — 200, valid cert, security headers present.
2. Submit contact + unsubscribe with Turnstile enabled.
3. Confirm Vercel deployment still builds (`bash build.sh` + serverless `api/*`).