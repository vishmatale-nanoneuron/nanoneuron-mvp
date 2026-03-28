# Nanoneuron CRM — Deploy Guide
**nanoneuron.ai** | Backend: Railway | Frontend: Cloudflare Pages | Repo: nanoneuron-ai-new/nanoneuron.ai

---

## Architecture

```
nanoneuron.ai          → Cloudflare Pages (Next.js static export)
api.nanoneuron.ai      → Railway (FastAPI + PostgreSQL)
```

---

## 1. Backend → Railway

### Setup
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `nanoneuron-ai-new/nanoneuron.ai`
3. Set **Root Directory** = `backend`
4. Railway auto-detects Nixpacks + `railway.toml`

### Add PostgreSQL
1. In Railway project → Add Plugin → PostgreSQL
2. Railway auto-sets `DATABASE_URL` — **copy the `asyncpg` version**:
   ```
   postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DB
   ```

### Environment Variables (Railway → Variables)
```
DATABASE_URL          postgresql+asyncpg://...  (from Postgres plugin)
JWT_SECRET            <generate 64-char random>
ANTHROPIC_API_KEY     sk-ant-...  (optional, for AI email)
CORS_ORIGINS          ["https://nanoneuron.ai","https://www.nanoneuron.ai"]
BANK_ACCOUNT_NUMBER   <your Axis Bank account>
BANK_ACCOUNT_HOLDER   Nanoneuron Services
BANK_IFSC             UTIB0005124
SWIFT_USD_ACCOUNT     <your account>
SWIFT_USD_NOSTRO      11407376
SWIFT_USD_IBAN        FED ABA 0210-0002-1
SWIFT_GBP_NOSTRO      11131588
SWIFT_GBP_IBAN        GB48CHAS60924211131588
SWIFT_EUR_NOSTRO      6231605392
SWIFT_EUR_IBAN        DE81501108006231605392
```

### Custom Domain
1. Railway → Settings → Custom Domain → `api.nanoneuron.ai`
2. In Cloudflare DNS → Add CNAME:
   - Name: `api`
   - Target: `<railway-provided-domain>.railway.app`
   - Proxy: **DNS only** (grey cloud, not orange)

---

## 2. Frontend → Cloudflare Pages

### Setup
1. Cloudflare Dashboard → Pages → Create a Project → Connect to Git
2. Select `nanoneuron-ai-new/nanoneuron.ai`
3. Set **Root directory** = `frontend`
4. **Build settings**:
   - Framework preset: `Next.js (Static HTML Export)`
   - Build command: `npm run build`
   - Build output directory: `out`
5. **Environment variables** (Production):
   ```
   NEXT_PUBLIC_API_URL    https://api.nanoneuron.ai
   ```

### Custom Domain
1. Cloudflare Pages → Custom domains → Add `nanoneuron.ai` and `www.nanoneuron.ai`
2. Cloudflare handles DNS automatically since domain is already on Cloudflare

---

## 3. Push to GitHub

```bash
cd ~/Desktop/nanoneuron-mvp
git init
git add .
git commit -m "feat: Nanoneuron CRM v1.0 — Railway + Cloudflare Pages"
git branch -M main
git remote add origin https://github.com/nanoneuron-ai-new/nanoneuron.ai.git
git push -u origin main --force
```

---

## 4. After First Deploy

Test the backend:
```
https://api.nanoneuron.ai/api/health
https://api.nanoneuron.ai/docs
```

Test the frontend:
```
https://nanoneuron.ai
https://nanoneuron.ai/login
```

---

## Founder Admin Operations

**Activate a paying user** (after bank payment confirmed):
```bash
curl -X POST https://api.nanoneuron.ai/api/payment/activate \
  -H "Content-Type: application/json" \
  -d '{"user_email":"client@example.com","plan":"pro","credits":500,"founder_key":"YOUR_JWT_SECRET"}'
```

**Add credits**:
```bash
curl -X POST https://api.nanoneuron.ai/api/payment/add-credits \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","credits":100,"founder_key":"YOUR_JWT_SECRET"}'
```
