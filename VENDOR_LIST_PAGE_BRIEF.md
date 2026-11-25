# Vendor & Subprocessor List — Page Brief for Cursor (saaniya-software.com)

**Purpose:** Publish Saaniya Software LLC's vendor / subprocessor list as a public page on
saaniya-software.com. The Privacy Policy (§8, red statement in the Dec 1, 2026 draft) points
to this page: "A current list of the vendors and service providers that process personal
information on our behalf ... is published at [vendor list URL]". This brief is the content
and the build instruction. Do not add, remove, or change vendors without Neeraj's say-so.

**Page URL:** `/subprocessors` — https://www.saaniya-software.com/subprocessors
(If the site's routing needs a different path, use `/legal/subprocessors` and tell Neeraj
immediately — the Privacy Policy statement's URL placeholder must match the live page.)

**Source of truth:** the table below, compiled from `saaniya-subprocessors.md`
(last updated 2026-11-19). 20 vendors: 17 live, 3 planned / coming soon.

## How to present it

- Plain HTML page, no JavaScript required. One main table for live vendors; a separate,
  clearly marked "Planned — not yet in use" section for the 3 planned / coming-soon vendors,
  so the page never implies a planned vendor processes data today.
- Columns: **Vendor | Purpose | Categories of data processed | Status**.
- Header on the page: a short intro — "These are the third-party vendors and service
  providers that process personal information on behalf of Saaniya Software LLC." — plus
  **"Last updated: [date]"** at the top.
- Keep a dated change log on the page (or in this repo file) and update "Last updated"
  whenever a vendor is added, removed, or changes purpose/status.
- The Privacy Policy (§8) links to this page. If the site pattern allows, also link it from
  the Privacy Policy page footer. No other page changes are in scope.
- **Meta entry:** the subprocessor is **Meta Platforms, Inc.** — "Muse" is the product name,
  not a legal entity. Do NOT list the user's own Muse (their personal agent, CoPlanner
  path 3) as a Saaniya subprocessor — it is the user's agent, acting at the user's direction
  under Muse's own terms, not a Saaniya subprocessor.

## The list — live vendors

| Vendor | Purpose | Categories of data processed | Status |
|---|---|---|---|
| Anthropic | AI inference for CoPlanner (model picker fallback; briefings) | User content the user asks the agent to process (mail, calendar, tasks, files), per the stated agent purpose | Live |
| Apple Inc. | Sign in with Apple (CoPlanner sign-in); App Store payment processing for iOS in-app purchases | Account identifiers; purchase records (Apple processes card details) | Live |
| Cloudflare (Turnstile) | Bot protection on login and signup | Browser and device signals from the Turnstile challenge | Live |
| Clerk | Authentication for Fleet Manager | Account identifiers and sign-in data | Live |
| Fly.io | Hosting for the CoPlanner sync worker (background mail/calendar sync) | Synced mailbox and calendar metadata processed for the user's account | Live |
| Google LLC | (a) Vertex AI / Gemini API: AI inference for CoPlanner (default model provider); (b) Google Calendar and Drive: user-connected integrations, data flows at the user's direction; (c) Google Maps Platform: maps and location services (Fleet Manager); (d) Google Classroom: education integration (GuruVidyaZen) | Account identifiers; calendar and Drive content the user connects; content sent for AI inference per the stated agent purpose; location data where the product uses maps. Google Calendar/Drive data is never sent to non-Google AI providers | Live |
| Google Play | Payment processing for Android in-app purchases | Purchase records (Google processes card details) | Live |
| Microsoft Corporation | Entra ID (sign-in) and Microsoft Graph (Outlook mail and calendar) for CoPlanner, user-connected | Account identifiers; mail and calendar content the user connects | Live |
| Neon (Neon, Inc.) | Serverless Postgres database hosting for CoPlanner (user accounts, synced mail/calendar metadata, tasks, files metadata, chat history) | All CoPlanner application data | Live |
| Notion Labs, Inc. | User-connected Notion workspaces for CoPlanner (the agent reads and writes the user's Notion pages and tasks at the user's direction) | Notion content the user connects | Live |
| OpenAI | AI inference for CoPlanner (model picker fallback) | User content the user asks the agent to process, per the stated agent purpose | Live |
| Resend | Transactional and marketing email delivery (account emails; Resend Broadcasts to opted-in audiences) | Recipient email addresses and message content | Live |
| Stripe, Inc. | Payment processing for paid plans across products | Billing and purchase records (Stripe processes card details; Saaniya does not store complete card numbers) | Live |
| Supabase | Authentication and database for GuruVidyaZen | Account identifiers and academy/school records | Live |
| Upstash | Redis queues and cache for the CoPlanner sync worker | Sync job payloads (mail/calendar/task references) | Live |
| Vercel Inc. | Hosting and deployment for the CoPlanner web application (and Vercel Blob file storage) | Account, usage, and content data served by the application | Live |
| Zoom Video Communications, Inc. | Video meetings for SISLMS sessions | Meeting participants' audio/video and meeting metadata | Live |

## The list — planned / coming soon (not yet in use)

| Vendor | Purpose | Categories of data processed | Status |
|---|---|---|---|
| Duffel | Travel bookings (flights, then stays) for CoPlanner v2, phase 2 | Passenger and trip details needed to search and book | Planned — not yet in use |
| Meta Platforms, Inc. | (a) Model API (Muse models): AI inference for CoPlanner v2, path 1; (b) advertising platform (advertiser-side only); (c) WhatsApp Business Cloud API | For (a): user content the user asks the agent to process, per the stated agent purpose | Coming soon — path 1 not yet live; WhatsApp planned |
| Razorpay | Payment processing | — | Planned — not yet in use |

## To confirm (do not change these without Neeraj / counsel)

- Resend: confirm it also sends CoPlanner account emails (verification, password reset),
  or name the provider that does.
- Vercel Blob: confirm which products store files there.
- Supabase vs Clerk: confirm the product split (GuruVidyaZen / Fleet Manager) is as listed.
- Meta advertising: confirm the advertiser-side-only description is still accurate.

## Maintenance

When a vendor is added or removed, a vendor's purpose changes, or a planned vendor goes
live: update this page (and the `saaniya-subprocessors.md` source), move it between sections
if its status changed, record the change with the date in the change log, and update
"Last updated". Tell Neeraj when a change goes live.

## Change log

- 2026-11-19: Initial list compiled from draft Privacy §6, the 17 Nov TOU/Privacy gap
  assessment, and the CoPlanner repo. Meta (Model API / Muse models) added as coming soon
  for CoPlanner v2. Duffel and Razorpay listed as planned, not yet in use.
- 2026-11-19: Vonage removed (Neeraj). Google Maps Platform confirmed for Fleet Manager;
  Google Classroom confirmed for GuruVidyaZen.
- 2026-11-19: Meta entry clarified — the user's own Muse (path 3) is not a Saaniya
  subprocessor; only Meta's Model API (path 1) is.
- 2026-11-25: Page brief created for Cursor from the 19 Nov list (20 vendors: 17 live,
  3 planned / coming soon). Page URL proposed: /subprocessors.

Questions about this list: support@saaniya-software.com.
