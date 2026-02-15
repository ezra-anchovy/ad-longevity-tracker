import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../data');
const COMPETITORS_FILE = join(DATA_DIR, 'competitors.json');
const ADS_FILE = join(DATA_DIR, 'ads.json');
const SCRAPE_HISTORY_FILE = join(DATA_DIR, 'scrape-history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
function initFile(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

initFile(COMPETITORS_FILE, []);
initFile(ADS_FILE, []);
initFile(SCRAPE_HISTORY_FILE, []);

// Read/Write helpers
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Competitors
export const addCompetitor = (pageName, pageId = null) => {
  const competitors = readJSON(COMPETITORS_FILE);
  const exists = competitors.find(c => c.page_name === pageName);
  
  if (!exists) {
    const newCompetitor = {
      id: competitors.length + 1,
      page_name: pageName,
      page_id: pageId,
      added_at: new Date().toISOString()
    };
    competitors.push(newCompetitor);
    writeJSON(COMPETITORS_FILE, competitors);
    return { changes: 1, lastInsertRowid: newCompetitor.id };
  }
  
  return { changes: 0 };
};

export const getCompetitors = () => {
  return readJSON(COMPETITORS_FILE);
};

// Ads
export const addAd = (ad) => {
  const ads = readJSON(ADS_FILE);
  const existingIndex = ads.findIndex(a => a.ad_id === ad.ad_id);
  
  if (existingIndex >= 0) {
    // Update existing ad
    ads[existingIndex].last_seen = new Date().toISOString();
    ads[existingIndex].is_active = true;
    writeJSON(ADS_FILE, ads);
    return { changes: 0 };
  } else {
    // Add new ad
    const newAd = {
      ...ad,
      id: ads.length + 1,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_active: true,
      days_running: 0
    };
    ads.push(newAd);
    writeJSON(ADS_FILE, ads);
    return { changes: 1 };
  }
};

export const updateAdDaysRunning = () => {
  const ads = readJSON(ADS_FILE);
  const now = new Date();
  
  ads.forEach(ad => {
    if (ad.is_active) {
      const firstSeen = new Date(ad.first_seen);
      const diffTime = Math.abs(now - firstSeen);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      ad.days_running = diffDays;
    }
  });
  
  writeJSON(ADS_FILE, ads);
  return { changes: ads.length };
};

export const getVeteranAds = (minDays = 30, limit = 10) => {
  const ads = readJSON(ADS_FILE);
  const competitors = readJSON(COMPETITORS_FILE);
  
  return ads
    .filter(ad => ad.is_active && ad.days_running >= minDays)
    .map(ad => {
      const competitor = competitors.find(c => c.id === ad.competitor_id);
      return { ...ad, page_name: competitor?.page_name || 'Unknown' };
    })
    .sort((a, b) => b.days_running - a.days_running)
    .slice(0, limit);
};

export const getNewAds = (daysAgo = 7) => {
  const ads = readJSON(ADS_FILE);
  const competitors = readJSON(COMPETITORS_FILE);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
  
  return ads
    .filter(ad => {
      if (!ad.is_active) return false;
      const firstSeen = new Date(ad.first_seen);
      return firstSeen >= cutoffDate;
    })
    .map(ad => {
      const competitor = competitors.find(c => c.id === ad.competitor_id);
      return { ...ad, page_name: competitor?.page_name || 'Unknown' };
    })
    .sort((a, b) => new Date(b.first_seen) - new Date(a.first_seen));
};

export const getAllAds = () => {
  const ads = readJSON(ADS_FILE);
  const competitors = readJSON(COMPETITORS_FILE);
  
  return ads
    .filter(ad => ad.is_active)
    .map(ad => {
      const competitor = competitors.find(c => c.id === ad.competitor_id);
      return { ...ad, page_name: competitor?.page_name || 'Unknown' };
    })
    .sort((a, b) => b.days_running - a.days_running);
};

export const updateAiMetadata = (adId, category, hook) => {
  const ads = readJSON(ADS_FILE);
  const adIndex = ads.findIndex(a => a.ad_id === adId);
  
  if (adIndex >= 0) {
    ads[adIndex].ai_category = category;
    ads[adIndex].ai_hook = hook;
    writeJSON(ADS_FILE, ads);
    return { changes: 1 };
  }
  
  return { changes: 0 };
};

export const logScrape = (competitorId, adsFound, newAds) => {
  const history = readJSON(SCRAPE_HISTORY_FILE);
  history.push({
    id: history.length + 1,
    competitor_id: competitorId,
    scrape_time: new Date().toISOString(),
    ads_found: adsFound,
    new_ads: newAds
  });
  writeJSON(SCRAPE_HISTORY_FILE, history);
  return { changes: 1 };
};

export default {
  addCompetitor,
  getCompetitors,
  addAd,
  updateAdDaysRunning,
  getVeteranAds,
  getNewAds,
  getAllAds,
  updateAiMetadata,
  logScrape
};
