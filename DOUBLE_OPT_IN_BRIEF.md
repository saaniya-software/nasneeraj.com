# Double opt-in — build brief (Cursor)

**From:** Muse (for Neeraj) — 25 Nov 2026
**Why:** Canada (~Dec 15) needs express consent BEFORE the first commercial message (CASL), and double opt-in is the recommended proof standard. The EU ramp (early Jan) also lists "double opt-in built" as an entry criterion. The US (Dec 1), India (~Dec 8), and UK (~Dec 22) phases do NOT depend on it.
**Decision:** GO — decided by Neeraj 25 Nov at the 09:30 email review, scoped to Canada/EU audiences only.
**Deadline:** before the Canada phase (~Dec 15). The build is decoupled from the Dec 1 US send — a DOI build cannot delay Dec 1.
**Repo:** nasneeraj.com (same repo as the signup form + unsubscribe page).

## Scope

Add double opt-in to the existing signup flow. Do NOT change the form fields, the consent checkbox, or the live single-opt-in path for the US.

## Build

### 1. Pending state
On signup, hold the contact pending — do NOT add to any Resend audience yet. Store email + first name (optional) + interests + consent date + source page + consent text version, with a confirmation token and expiry (recommend 48 hours; confirm in build).

### 2. Confirmation email
Send via Resend's transactional API using a SEPARATE sending key (new key, never the marketing "Muze marketing" key, never the website signup-form marketing key). The key lives in Vercel env only, never in the page or repo. Neeraj will create the new transactional key in Resend and add it to Vercel env — ask him for the env var name if it is not already set. Confirm-click link goes to a confirm endpoint.

### 3. Confirm endpoint
On valid, unexpired token, add the contact to the chosen audience(s) (Zen / book+CoPlanner), then write the consent-evidence mirror row including the **confirmation timestamp** (in addition to the existing signup timestamp), and show a success page. Expired/invalid token shows a re-send option.

### 4. Per-audience switch
DOI is ON for Canada/EU signups only (or per-audience flag — decide in build, default off). US/India/UK signups keep the current single-opt-in path unchanged, so the Dec 1 US launch is unaffected.

### 5. Suppression-safe
A contact who unsubscribed (suppression list) must not be re-added by confirming; check the suppression list in the confirm endpoint.

### 6. No test submissions to the live mirror
Use a test audience / local check; the Apps Script mirror endpoint writes real rows.

## Do NOT change

- `privacy.html` / `terms.html`, the signup form fields or consent checkbox, `api/subscribe.js` single-opt-in path for US/India/UK, any email copy, or Vercel env vars beyond the one new key.
- The unsubscribe page build is in flight on this same repo (due Mon 30 Nov) — coordinate, do not collide with it.

## Acceptance

A test signup stays pending (not in any audience), receives the confirmation email, lands in the right audience only after the click, and the mirror row carries both timestamps; a US signup still completes immediately with no confirmation email.

## Verify + report back

- Run the acceptance checks above and confirm each one.
- Commit to `master` as usual and reply here with what was built + the test results.
