# 🚀 Deployment Guide

This guide covers deploying the Ad Longevity Tracker to various platforms.

## Quick Deploy Options

### Option 1: Railway (Recommended)

Railway is perfect for Node.js apps and includes free tier.

1. **Fork/Clone the repo**
2. **Visit [railway.app](https://railway.app)**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select this repo**
5. **Configure environment variables:**
   - `PORT=3000` (Railway auto-sets this)
   - `OPENAI_API_KEY` (optional, for AI analysis)
6. **Deploy!**

Railway will auto-detect Node.js and run `npm start`.

**Cost**: Free tier includes 500 hours/month ($5/mo after)

---

### Option 2: Render

1. **Visit [render.com](https://render.com)**
2. **New Web Service → Connect repository**
3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm run dev`
   - Environment: Node
4. **Add environment variables** (same as Railway)
5. **Deploy**

**Cost**: Free tier available (sleeps after 15 min inactivity)

---

### Option 3: Cloudflare Pages + Workers

For static dashboard only (no scraper):

1. **Build static files:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages:**
   ```bash
   npm install -g wrangler
   wrangler pages deploy public
   ```

3. **For API routes, use Cloudflare Workers:**
   - Convert `src/server.js` to Workers format
   - Use Cloudflare D1 for database
   - Deploy separately

**Cost**: Free tier is generous

---

### Option 4: DigitalOcean App Platform

1. **Visit [DigitalOcean](https://cloud.digitalocean.com/apps)**
2. **Create App → From Source Code**
3. **Select repo and configure:**
   - Detected as Node.js
   - Build: `npm install`
   - Run: `npm run dev`
4. **Add environment variables**
5. **Deploy**

**Cost**: $5/mo for basic droplet

---

### Option 5: Heroku

1. **Install Heroku CLI**
2. **Login and create app:**
   ```bash
   heroku login
   heroku create ad-longevity-tracker
   ```

3. **Add Playwright buildpack** (for scraping):
   ```bash
   heroku buildpacks:add https://github.com/mxschmitt/heroku-playwright-buildpack
   heroku buildpacks:add heroku/nodejs
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=your_key_here
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

**Cost**: $7/mo for basic dyno

---

## Scheduling Scrapes

For production, you'll want to scrape ads daily.

### Option A: Cron Jobs (Railway/Render/Heroku)

Add `node-cron` to run scraper:

```javascript
// Add to src/server.js
import cron from 'node-cron';
import { scrapeAllCompetitors } from './scraper.js';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily scrape...');
  await scrapeAllCompetitors();
});
```

### Option B: GitHub Actions

Create `.github/workflows/scrape.yml`:

```yaml
name: Daily Ad Scrape

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - run: npm run scrape
      - name: Commit data
        run: |
          git config --global user.name 'Bot'
          git config --global user.email 'bot@example.com'
          git add data/*.json
          git commit -m "Daily scrape $(date)" || exit 0
          git push
```

### Option C: External Cron Service

Use [cron-job.org](https://cron-job.org) to hit a webhook endpoint:

```javascript
// Add to src/server.js
app.post('/api/scrape-webhook', async (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  
  scrapeAllCompetitors().catch(console.error);
  res.send('Scrape started');
});
```

---

## Database Migration (Production)

For production, consider upgrading from JSON files to a real database:

### PostgreSQL (Recommended)

1. **Add dependency:**
   ```bash
   npm install pg
   ```

2. **Update `src/db.js`** to use PostgreSQL instead of JSON
3. **Use managed database:**
   - Railway provides free PostgreSQL
   - Render has free tier
   - Supabase (generous free tier)

### Cloudflare D1 (Serverless)

If using Cloudflare Workers:
- Use D1 (SQLite-compatible)
- Perfect for serverless architecture
- Free tier: 100k reads/day

---

## Environment Variables

**Required:**
- `PORT` - Server port (auto-set by most platforms)

**Optional:**
- `OPENAI_API_KEY` - For AI ad categorization
- `WEBHOOK_SECRET` - For cron webhook security
- `DATABASE_URL` - If using PostgreSQL

---

## Monitoring

### Add Health Check Endpoint

```javascript
// Add to src/server.js
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ads: getAllAds().length
  });
});
```

### Uptime Monitoring

Use free services:
- [UptimeRobot](https://uptimerobot.com)
- [Checkly](https://www.checklyhq.com)
- [Better Uptime](https://betteruptime.com)

---

## SSL Certificate

Most platforms (Railway, Render, Heroku) provide free SSL automatically.

For custom domain:
1. Add custom domain in platform settings
2. Point DNS A/CNAME record to platform
3. SSL auto-provisions

---

## Cost Summary

| Platform | Free Tier | Paid Tier | Notes |
|----------|-----------|-----------|-------|
| Railway | 500 hrs/mo | $5/mo | Best for Node.js |
| Render | Yes (sleeps) | $7/mo | Good free tier |
| Cloudflare | Generous | $5/mo | Best for static |
| Heroku | No | $7/mo | Classic choice |
| DigitalOcean | No | $5/mo | Full VPS control |

---

## Next Steps

1. Deploy to your chosen platform
2. Set up daily scraping schedule
3. Add custom domain (optional)
4. Set up monitoring
5. Consider database upgrade for production

---

## Support

Questions? Email ezra@anchovylabs.ai
