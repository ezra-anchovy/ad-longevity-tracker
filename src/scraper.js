import { chromium } from 'playwright';
import { addCompetitor, addAd, updateAdDaysRunning, logScrape, getCompetitors } from './db.js';

// Sample competitor pages (can be configured via env or database)
const DEFAULT_COMPETITORS = [
  'Nike',
  'Adidas',
  'Gymshark',
  'Lululemon',
  'Allbirds'
];

async function scrapeCompetitorAds(page, competitorName, competitorId) {
  console.log(`📊 Scraping ads for: ${competitorName}`);
  
  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(competitorName)}&search_type=page&media_type=all`;
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for ad cards to load
    await page.waitForSelector('[data-testid="search-result-card"]', { timeout: 10000 }).catch(() => {
      console.log(`⚠️  No ads found for ${competitorName}`);
      return [];
    });
    
    // Scroll to load more ads
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }
    
    // Extract ad data
    const ads = await page.evaluate(() => {
      const adCards = Array.from(document.querySelectorAll('[data-testid="search-result-card"]'));
      
      return adCards.slice(0, 20).map((card, idx) => {
        // Extract headline
        const headlineEl = card.querySelector('div[style*="font-weight"]');
        const headline = headlineEl?.innerText || '';
        
        // Extract body text
        const bodyEl = card.querySelector('div[dir="auto"]');
        const bodyText = bodyEl?.innerText || '';
        
        // Extract image
        const imgEl = card.querySelector('img[src*="scontent"]');
        const imageUrl = imgEl?.src || '';
        
        // Extract video
        const videoEl = card.querySelector('video');
        const videoUrl = videoEl?.src || videoEl?.querySelector('source')?.src || '';
        
        // Determine ad type
        let adType = 'static';
        if (videoUrl) adType = 'video';
        else if (card.querySelector('[aria-label*="carousel"]')) adType = 'carousel';
        
        // Generate a pseudo-unique ID (in production, use actual FB ad ID if available)
        const adId = `ad_${Date.now()}_${idx}_${headline.substring(0, 20).replace(/\s/g, '_')}`;
        
        return {
          ad_id: adId,
          ad_type: adType,
          headline: headline.substring(0, 500),
          body_text: bodyText.substring(0, 1000),
          image_url: imageUrl,
          video_url: videoUrl
        };
      });
    });
    
    // Save ads to database
    let newAdsCount = 0;
    for (const ad of ads) {
      if (ad.headline || ad.body_text || ad.image_url) {
        const result = addAd({
          ...ad,
          competitor_id: competitorId
        });
        if (result.changes > 0) newAdsCount++;
      }
    }
    
    console.log(`✅ Found ${ads.length} ads, ${newAdsCount} new`);
    logScrape(competitorId, ads.length, newAdsCount);
    
    return ads;
  } catch (error) {
    console.error(`❌ Error scraping ${competitorName}:`, error.message);
    return [];
  }
}

async function scrapeAllCompetitors() {
  console.log('🚀 Starting Facebook Ad Library scraper...\n');
  
  // Initialize competitors
  for (const name of DEFAULT_COMPETITORS) {
    addCompetitor(name);
  }
  
  const competitors = getCompetitors();
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  for (const competitor of competitors) {
    await scrapeCompetitorAds(page, competitor.page_name, competitor.id);
    await page.waitForTimeout(2000); // Be nice to Facebook
  }
  
  // Update days running for all ads
  updateAdDaysRunning();
  console.log('\n✅ Updated ad longevity metrics');
  
  await browser.close();
  console.log('\n🎉 Scraping complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAllCompetitors().catch(console.error);
}

export { scrapeAllCompetitors, scrapeCompetitorAds };
