import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addCompetitor, addAd, updateAdDaysRunning, getCompetitors } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEMO_COMPETITORS = [
  'Nike',
  'Adidas',
  'Gymshark',
  'Lululemon',
  'Allbirds',
  'Casper',
  'Purple',
  'Warby Parker'
];

const HEADLINES = [
  'Get 30% Off Your First Order',
  'The Most Comfortable Shoes You\'ll Ever Wear',
  'Transform Your Workout in 30 Days',
  'Limited Time: Free Shipping on All Orders',
  'Join 1 Million Happy Customers',
  'As Seen on Shark Tank',
  'Why Athletes Choose Us',
  'Your New Favorite [Product]',
  'Made for People Who Care About Quality',
  'Try Risk-Free for 100 Days'
];

const BODY_TEXTS = [
  'Discover why thousands of customers are making the switch. Premium quality, unbeatable comfort, and a 100-day money-back guarantee.',
  'Limited time offer: Get 30% off your first purchase. Plus free shipping on orders over $50. Don\'t miss out!',
  'Engineered for performance. Designed for style. Built to last. Experience the difference today.',
  'Real results from real customers. Join our community of over 1 million satisfied buyers.',
  'What makes us different? We obsess over every detail so you don\'t have to. Premium materials, ethical manufacturing, and a commitment to sustainability.',
];

const AD_TYPES = ['video', 'static', 'carousel'];
const CATEGORIES = ['video', 'static_image', 'carousel', 'ugc_style', 'professional'];
const HOOKS = ['emotional', 'urgency', 'social_proof', 'curiosity', 'fear_of_missing_out', 'logical'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

async function seedDemoData() {
  console.log('🌱 Seeding demo data...\n');
  
  // Add competitors
  for (const name of DEMO_COMPETITORS) {
    addCompetitor(name);
  }
  
  const competitors = getCompetitors();
  console.log(`✅ Added ${competitors.length} competitors`);
  
  // Generate ads with varying ages
  let adsCreated = 0;
  
  for (const competitor of competitors) {
    // Each competitor gets 5-10 ads
    const numAds = 5 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numAds; i++) {
      // Random age: some veterans (30-90 days), some new (0-7 days), some mid (8-29 days)
      let daysAgo;
      const rand = Math.random();
      if (rand < 0.3) {
        // 30% veterans (30-90 days)
        daysAgo = 30 + Math.floor(Math.random() * 61);
      } else if (rand < 0.5) {
        // 20% new (0-7 days)
        daysAgo = Math.floor(Math.random() * 8);
      } else {
        // 50% mid-range (8-29 days)
        daysAgo = 8 + Math.floor(Math.random() * 22);
      }
      
      const ad = {
        ad_id: `demo_${competitor.id}_${i}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        competitor_id: competitor.id,
        ad_type: randomItem(AD_TYPES),
        headline: randomItem(HEADLINES),
        body_text: randomItem(BODY_TEXTS),
        image_url: `https://via.placeholder.com/1200x628?text=${encodeURIComponent(competitor.page_name)}`,
        video_url: randomItem(AD_TYPES) === 'video' ? 'https://example.com/video.mp4' : '',
        ai_category: randomItem(CATEGORIES),
        ai_hook: randomItem(HOOKS)
      };
      
      addAd(ad);
      adsCreated++;
      
      // Manually set the first_seen date for demo purposes
      const adsPath = join(__dirname, '../data/ads.json');
      const adsData = JSON.parse(fs.readFileSync(adsPath, 'utf-8'));
      const lastAd = adsData[adsData.length - 1];
      lastAd.first_seen = randomDate(daysAgo);
      lastAd.last_seen = new Date().toISOString();
      fs.writeFileSync(adsPath, JSON.stringify(adsData, null, 2));
    }
  }
  
  console.log(`✅ Created ${adsCreated} demo ads`);
  
  // Update days running
  updateAdDaysRunning();
  console.log('✅ Calculated ad longevity metrics');
  
  console.log('\n🎉 Demo data seeded successfully!');
  console.log('\nRun these commands:');
  console.log('  npm run dev    - Start the dashboard');
  console.log('  npm run report - Generate Winners Report PDF');
}

seedDemoData().catch(console.error);
