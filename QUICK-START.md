# ⚡ Quick Start Guide

Get the Ad Longevity Tracker running in 60 seconds.

## 1. Install Dependencies

```bash
cd /Users/al/.openclaw/workspace/projects/ad-longevity-tracker
npm install
```

## 2. Seed Demo Data

```bash
node src/seed-demo.js
```

This creates 71 demo ads across 8 competitors with realistic age distribution.

## 3. Start the Server

```bash
npm run dev
```

## 4. Open in Browser

- **Landing Page:** http://localhost:3000/landing.html
- **Dashboard:** http://localhost:3000/index.html

## 5. Generate PDF Report

```bash
npm run report
```

Report saved to: `data/winners-report.pdf`

---

## Run Real Scraper

To scrape actual Facebook Ad Library data:

```bash
npm run scrape
```

This will:
- Track the default 5 competitors
- Extract ads from Facebook Ad Library
- Save to `data/ads.json`
- Take ~2-3 minutes

---

## Optional: AI Analysis

If you have an OpenAI API key:

1. Create `.env` file:
   ```
   OPENAI_API_KEY=your_key_here
   ```

2. Run analyzer:
   ```bash
   npm run analyze
   ```

Or use mock mode (no API key needed - demo already has AI metadata).

---

## File Locations

- **Dashboard:** `public/index.html`
- **Landing Page:** `public/landing.html`
- **Ad Data:** `data/ads.json`
- **PDF Reports:** `data/winners-report.pdf`
- **Screenshots:** `screenshots/`

---

## Available Commands

```bash
npm run scrape    # Scrape Facebook Ad Library
npm run analyze   # AI categorization (needs API key)
npm run report    # Generate Winners Report PDF
npm run dev       # Start dashboard server
```

---

## GitHub Repository

https://github.com/ezra-anchovy/ad-longevity-tracker

---

**That's it!** You now have a working ad longevity tracker.

For deployment, see `DEPLOYMENT.md`.
For full docs, see `README.md`.
