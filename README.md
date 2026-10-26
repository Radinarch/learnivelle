# Learnivelle — Understand together

A peer-learning website: ask a question, explain a solution with attachments, reflect on what changed, and share reusable notes with practice prompts.

## Working features

- Shared questions, replies, helper claims, reflections and notes in Cloudflare D1.
- Documents and short videos in R2. Three attachments maximum, 10 MB/document or 25 MB/video. Video posts require a readable explanation.
- One editable rating per authenticated account; no self-voting. Average and count displayed together.
- Personal saved-note collection, practice prompts with revealable explanations and large-text mode. The app requires an internet connection; offline mode was removed on October 26.
- Pomodoro with a remaining-time ring, pause/reset, 15/25/45-minute shortcuts, device-local goals, session history and generated ambient audio. A 36-passage motivational collection supports shuffle, history, author filtering and manual selection; each English paraphrase links to its public-domain source.
- Existing browser-local questions remain under Contributions; they are not silently uploaded.

## Local setup

Node >=22.13 and npm are required. This is a full-stack project, not a double-click HTML file.

```sh
npm ci
node scripts/generate-pages.mjs
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_ambitious_infant_terrible.sql
npm run dev
```

The migration is already included. Only run `npm run db:generate` after schema changes; do not regenerate applied migrations. Sites applies hosted migrations during publication. The included `.openai/hosting.json` declares storage bindings; a new hosted deployment needs its own Site identity. Never commit runtime data or tokens.

## Verification

```sh
node scripts/test-api.mjs
node scripts/test-ui.cjs
node scripts/test-focus.cjs
```

API tests use an isolated local D1/R2 environment, the actual migration and API implementation. They cover two simulated identities, shared replies/files, authorization, CSRF, votes and deletion. UI tests cover rendering, escaped content, ratings, saved notes and timer controls. Tests are not proof of educational outcomes or adoption.

Hosted identity is provided by Sites. Writes require an authenticated visitor and a same-origin request. Local test identity headers are fixtures, not a production login method.

## Limits and submission

The Site remains under its existing owner-private access policy. Other accounts need access before testing together; judges need an accessible build or walkthrough. Peer content is not expert-verified. Reports are recorded for later review; there is no live moderation service. The feed shows the latest 250 entries. Browser data may be cleared.

The UI is English. English submission drafts and a caption-ready demo script are in `submissions/`. ChatGPT substantially assisted implementation, design, documentation and tests.

## NextSpark package

`/demo` enters a populated sandbox across the normal pages. All people, posts and ratings are fictional. Demo actions stay in session storage and never write to the live API. Original-source references for motivational passages are in `public/quotes.js`.
