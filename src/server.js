import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getVeteranAds, getNewAds, getAllAds, getCompetitors } from './db.js';
import { generateWeeklyReport } from './report-generator.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(join(__dirname, '../public')));
app.use(express.json());

// API endpoints
app.get('/api/stats', (req, res) => {
  const allAds = getAllAds();
  const veteranAds = getVeteranAds(30);
  const newAds = getNewAds(7);
  
  const categoryBreakdown = {};
  const hookBreakdown = {};
  
  allAds.forEach(ad => {
    const cat = ad.ai_category || 'unknown';
    const hook = ad.ai_hook || 'unknown';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    hookBreakdown[hook] = (hookBreakdown[hook] || 0) + 1;
  });
  
  res.json({
    totalAds: allAds.length,
    veteranAds: veteranAds.length,
    newAds: newAds.length,
    avgDaysRunning: allAds.reduce((sum, ad) => sum + ad.days_running, 0) / allAds.length || 0,
    categoryBreakdown,
    hookBreakdown
  });
});

app.get('/api/ads/veterans', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const minDays = parseInt(req.query.minDays) || 30;
  res.json(getVeteranAds(minDays, limit));
});

app.get('/api/ads/new', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  res.json(getNewAds(days));
});

app.get('/api/ads/all', (req, res) => {
  res.json(getAllAds());
});

app.get('/api/competitors', (req, res) => {
  res.json(getCompetitors());
});

app.post('/api/generate-report', (req, res) => {
  try {
    const reportPath = generateWeeklyReport();
    res.json({ success: true, path: reportPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/download-report', (req, res) => {
  const reportPath = join(__dirname, '../data/winners-report.pdf');
  if (fs.existsSync(reportPath)) {
    res.download(reportPath);
  } else {
    res.status(404).json({ error: 'Report not found. Generate one first.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Ad Longevity Tracker running on http://localhost:${PORT}`);
});

export default app;
