# Nanoneuron — Full Deployment Guide
**Backend → Railway.com** | **Frontend → Cloudflare Pages** | **DB → Railway PostgreSQL**

---

## Overview

```
GitHub ──push──> Railway (FastAPI + PostgreSQL)   https://api.nanoneuron.ai
              └──push──> Cloudflare Pages (Next.js)  https://nanoneuron.ai
```

---

## STEP 1 — Deploy Backend on Railway

### 1.1 Create Railway project

1. Go to **https://railway.app** → New Project
2. Select **"Deploy from GitHub repo"**
3. Choose: `vishmatale-nanoneuron/nanoneuron-mvp`
4. ⚠️ Set **Root Directory** = `backend`
5. Railway auto-detects Python via `nixpacks.toml` → click **Deploy**

### 1.2 Add PostgreSQL database

1. In your Railway project → click **"+ New"** → **"Database"** → **PostgreSQL**
2. Railway auto-injects `DATABASE_URL` into your backend service ✅
3. The app runs `Base.metadata.create_all` on startup — all tables created automatically

### 1.3 Set environment variables

In Railway → your backend service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (from console.anthropic.com) |
| `FOUNDER_EMAIL` | your email |
| `FOUNDER_SECRET` | any random string |
| `EXTRA_CORS_ORIGINS` | add after Step 2 |
| `COMPANY_ADDRESS` | your registered office address |

> `DATABASE_URL` is auto-set by Railway PostgreSQL plugin — do NOT add it manually.

### 1.4 Get your backend URL

After deploy: Railway gives you a URL like `nanoneuron-mvp-production.up.railway.app`

**Custom domain** (optional):
1. Railway → Settings → Domains → Add `api.nanoneuron.ai`
2. In Cloudflare DNS → Add CNAME: `api` → `nanoneuron-mvp-production.up.railway.app` → **DNS only (grey cloud)**

Test it: `curl https://your-railway-url.up.railway.app/api/health`

---

## STEP 2 — Deploy Frontend on Cloudflare Pages

### 2.1 Create Pages project

1. Go to **https://dash.cloudflare.com** → **Pages** → **Create a project**
2. **Connect to Git** → select `vishmatale-nanoneuron/nanoneuron-mvp`
3. Configure the build:

| Setting | Value |
|---|---|
| **Root directory** | `frontend` |
| **Framework preset** | Next.js (Static HTML Export) |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Node.js version** | `18` |

### 2.2 Set environment variables

In Cloudflare Pages → Settings → Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.nanoneuron.ai` (or your Railway URL) |

> ⚠️ Set this for **Production** environment. Without it the frontend calls the same origin (wrong in prod).

### 2.3 Deploy

Click **Save and Deploy**. Cloudflare builds and deploys in ~2 minutes.

Default URL: `nanoneuron-mvp.pages.dev`

**Custom domain** (optional):
1. Pages → Custom domains → Add `nanoneuron.ai` and `www.nanoneuron.ai`
2. Cloudflare auto-configures DNS since your domain is already on Cloudflare

---

## STEP 3 — Connect them (CORS)

After you have both URLs, go back to **Railway → Variables** and set:

```
EXTRA_CORS_ORIGINS=https://nanoneuron-mvp.pages.dev,https://nanoneuron.ai,https://www.nanoneuron.ai
```

Railway auto-redeploys. ✅

---

## STEP 4 — Verify everything works

```bash
# 1. Backend health
curl https://api.nanoneuron.ai/api/health

# 2. Register a user
curl -X POST https://api.nanoneuron.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","name":"Test User"}'

# 3. Login
curl -X POST https://api.nanoneuron.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
# → copy the token

# 4. Discovery
curl https://api.nanoneuron.ai/api/discovery/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Frontend
open https://nanoneuron.ai
```

---

## Environment Variables — Full Reference

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ auto | Set by Railway PostgreSQL plugin |
| `JWT_SECRET` | ✅ | 64-char random hex — keep secret |
| `ANTHROPIC_API_KEY` | recommended | Claude AI features |
| `EXTRA_CORS_ORIGINS` | ✅ after deploy | Your Cloudflare Pages URLs |
| `FOUNDER_EMAIL` | recommended | Locks /api/founder/* to your email |
| `FOUNDER_SECRET` | recommended | Extra header lock for founder routes |
| `COMPANY_ADDRESS` | for invoices | Registered office address |
| `BANK_ACCOUNT_NUMBER` | for invoices | For payment details in invoices |
| `BANK_IFSC` | for invoices | IFSC code |
| `SMTP_HOST/USER/PASS` | for emails | Gmail/SMTP credentials |
| `HUNTER_API_KEY` | optional | hunter.io for email enrichment |

### Frontend (Cloudflare Pages)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | `https://api.nanoneuron.ai` |

---

## Auto-Deploy (CI/CD)

Both platforms watch the `main` branch:
- Push to GitHub → **Railway redeploys backend** in ~60s
- Push to GitHub → **Cloudflare rebuilds frontend** in ~2min

```bash
# Your deploy workflow:
git add .
git commit -m "feat: your change"
git push origin main
# Done — both services update automatically
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `502 Bad Gateway` on Railway | Check logs — likely DB connection failed. Verify `DATABASE_URL` is set |
| CORS error in browser | Add your Pages URL to `EXTRA_CORS_ORIGINS` in Railway |
| Login works locally but not in prod | Ensure `NEXT_PUBLIC_API_URL` is set in Cloudflare Pages env vars |
| Build fails on Cloudflare | Check Node version is set to `18` in Pages settings |
| `asyncpg` SSL error | Railway PostgreSQL requires SSL — `DATABASE_URL` from Railway already includes `?ssl=require` |
| Tables not created | Hit `/api/health` once after deploy — `create_all` runs on first request via lifespan |
| Discovery returns 401 | JWT token expired — re-login to get a fresh token |

---

## Architecture

```
User Browser
    │
    ├─── nanoneuron.ai ──────────────── Cloudflare Pages
    │         Next.js static export     (free, global CDN)
    │         /out directory
    │
    └─── api.nanoneuron.ai ──────────── Railway
              FastAPI + uvicorn          (hobby $5/mo)
              2 workers
                   │
                   └── PostgreSQL ───── Railway DB plugin
                       Tables:           (hobby $5/mo)
                       - users
                       - companies
                       - contacts
                       - deals
                       - invoices
                       - notes
```

**Total cost: ~$10/month** (Railway Hobby plan covers both backend + DB)
