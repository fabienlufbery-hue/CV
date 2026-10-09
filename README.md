# ASYt · Interactive Voice CV

Bilingual React/Vite CV with a Node/Bun Gemini voice gateway.

## Architecture

- **Frontend**: React + Vite, hosted on GitHub Pages at https://fabienlufbery-hue.github.io/CV/.
- **API**: `server.ts`, a separate Bun/Node-compatible service that calls Gemini using a **server-side** `GEMINI_API_KEY`. It provides `/api/health`, `/api/chat`, `/api/tts` and WebSocket `/live`.
- **Static mode**: The public CV and professional dossier stay accessible when no API is configured. Voice and chat clearly show as offline instead of failing silently.

> GitHub Pages cannot run `server.ts`. Publishing the static site does **not** mean the AI voice or chat is enabled.

## Local development

Requires Bun and a valid Gemini API key with access to the configured Gemini models.

```bash
bun install --frozen-lockfile
cp .env.example .env
# Add GEMINI_API_KEY to .env (never commit it)
bun run dev
```

Visit http://localhost:3000. To test only the UI, run `bun run build` and `bun run preview`.

## Render Blueprint (recommended)

The repository includes a [`render.yaml`](render.yaml) Blueprint for a **separate** Bun-powered voice server.

1. In [Render Dashboard](https://dashboard.render.com/), choose **New → Blueprint**, connect `fabienlufbery-hue/CV` and select `render.yaml`.
2. Review the **Free** instance plan and any billing terms before accepting; the Gemini API can incur separate usage costs.
3. Enter `GEMINI_API_KEY` **in the Render secret field** when prompted. Do not paste secrets into GitHub or chat messages. The service's `/api/health` returns 503 until this key exists.
4. When Render reports the web service healthy, note its public HTTPS URL ending in `.onrender.com`. You must then set the GitHub Actions repository **variable** `VITE_API_BASE_URL` to that origin (no trailing slash), and rerun **Deploy ASYt CV to GitHub Pages**.
5. Verify text chat and voice in a browser, plus backend logs and rate limits. Free instances can sleep and take time to wake; a 15-second WebSocket connection timeout may need adjusting for cold starts.

**Production warning:** the API is publicly callable without user authentication. An origin allowlist and process-local rate limits do not prevent abuse by custom clients. Configure upstream abuse protection and Gemini quota/billing limits **before** enabling public voice access.

## Deploying the backend

1. Deploy a continuously running container/VM service with HTTPS and **WebSocket upgrade** support. Run `bun install --frozen-lockfile`, `bun run build`, then `NODE_ENV=production bun run start`.
2. Set `GEMINI_API_KEY` **only in the backend's server-side secret manager**. Never expose it as a `VITE_*` variable, in source, or in GitHub Pages. Restrict Gemini API key permissions and set usage limits/quota alerts at the provider.
3. Set `ALLOWED_ORIGINS=https://fabienlufbery-hue.github.io` (you may append comma-separated trusted origins); optionally set `TRUST_PROXY=1` only if exactly one trusted reverse proxy is in front of Express.
4. In GitHub repository **Settings → Secrets and variables → Actions → Variables**, add `VITE_API_BASE_URL` with the backend **HTTPS origin** (e.g. `https://voice.example.com`, without a trailing slash), then redeploy the frontend.
5. Verify `GET /api/health` returns 200, requests from the GitHub Pages origin pass CORS, and `wss://your-backend/live` works end-to-end with browser microphone permissions.
6. Choose supported Gemini models for your account using `GEMINI_CHAT_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_LIVE_MODEL`. Do not assume the default model names are available in every region/account.

This repository intentionally does **not** contain a production API key or hosted backend URL.

## Security limitations

- Input validation, JSON size caps, fixed-window request limits, WebSocket origin checks, active connection caps, bounded WS payloads and generic client errors are implemented.
- Browser `Origin` headers **are not authentication**; non-browser clients may omit them. In-memory rate limiting resets on restart and is not shared across replicas.
- For public production use, add an external rate-limit/WAF layer, enforce Gemini spending quotas and monitor abuse. Keep backend credentials private and rotate compromised keys.
- Avoid entering personal or confidential information into an AI chat unless you accept processing by the Gemini API provider.
- `/api/health` reports configuration/readiness only, not a live end-to-end Gemini model test.

## Quality checks

```bash
bun run check
```

GitHub Actions runs type checks, input security tests and the static build on each feature branch and pull request. Proposed changes should be reviewed and merged before reaching the public CV.

## Deployment status

GitHub Pages publishes **main**. Work in feature branches and merge the pull request only after CI passes and the site is reviewed.
