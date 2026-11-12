# QR Assessment Portal (secure)

## Structure
- `server.js` — Express API (auth, server-side scoring, rate limits)
- `answer-key.json` — correct answers (never served to candidates)
- `public/index.html` — frontend (answers stripped; uses Bearer login)
- `package.json` — Node >= 18

## Render deploy
1. Connect this repo (or upload the zip).
2. Build: `npm install`
3. Start: `npm start`
4. Set environment variables:
   - `DATABASE_URL` — Neon / Postgres connection string
   - `AUTH_SECRET` — long random string (32+ chars)
   - `ADMIN_PASS` — strong admin password (recommended)
   - `ADMIN_ID` — optional, default `admin`
5. Redeploy after setting env vars.

## First login
If `ADMIN_PASS` was not set, check the Render logs for a generated password on first boot.
Change it immediately from Admin Dashboard → Access Control.

## Local
```bash
cp .env.example .env   # fill DATABASE_URL, AUTH_SECRET, ADMIN_PASS
npm install
npm start
# open http://localhost:3000
```
