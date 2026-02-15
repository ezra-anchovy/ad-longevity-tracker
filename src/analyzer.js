import OpenAI from 'openai';
import { getAllAds, updateAiMetadata } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
});

async function analyzeAdWithAI(ad) {
  try {
    // Use GPT-4 Vision if image is available, otherwise text-only analysis
    const hasImage = ad.image_url && ad.image_url.startsWith('http');
    
    const messages = [];
    
    if (hasImage) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this Facebook ad and provide:
1. Category (one of: video, carousel, static_image, text_only, ugc_style, professional)
2. Primary hook/angle (emotional, logical, urgency, social_proof, curiosity, fear_of_missing_out)

Headline: ${ad.headline}
Body: ${ad.body_text}

Respond in JSON format: {"category": "...", "hook": "..."}`
          },
          {
            type: 'image_url',
            image_url: {
              url: ad.image_url
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analyze this Facebook ad and provide:
1. Category (one of: video, carousel, static_image, text_only)
2. Primary hook/angle (emotional, logical, urgency, social_proof, curiosity, fear_of_missing_out)

Headline: ${ad.headline || 'N/A'}
Body: ${ad.body_text || 'N/A'}
Type: ${ad.ad_type}

Respond in JSON format: {"category": "...", "hook": "..."}`
      });
    }
    
    const response = await openai.chat.completions.create({
      model: hasImage ? 'gpt-4-vision-preview' : 'gpt-4-turbo-preview',
      messages,
      max_tokens: 300,
      temperature: 0.3
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error(`Error analyzing ad ${ad.ad_id}:`, error.message);
    // Fallback to basic categorization
    return {
      category: ad.ad_type || 'unknown',
      hook: ad.headline ? 'curiosity' : 'unknown'
    };
  }
}

async function analyzeAllAds() {
  console.log('🤖 Starting AI analysis of ads...\n');
  
  const ads = getAllAds();
  console.log(`Found ${ads.length} ads to analyze`);
  
  for (const ad of ads) {
    // Skip if already analyzed
    if (ad.ai_category && ad.ai_hook) {
      console.log(`⏭️  Skipping ${ad.ad_id} (already analyzed)`);
      continue;
    }
    
    console.log(`🔍 Analyzing: ${ad.headline?.substring(0, 50)}...`);
    
    const analysis = await analyzeAdWithAI(ad);
    updateAiMetadata(ad.ad_id, analysis.category, analysis.hook);
    
    console.log(`   Category: ${analysis.category}, Hook: ${analysis.hook}`);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ AI analysis complete!');
}

// Mock version without API calls for demo
async function analyzeAllAdsMock() {
  console.log('🤖 Starting AI analysis (MOCK MODE)...\n');
  
  const ads = getAllAds();
  const categories = ['video', 'carousel', 'static_image', 'ugc_style', 'professional'];
  const hooks = ['emotional', 'urgency', 'social_proof', 'curiosity', 'fear_of_missing_out'];
  
  for (const ad of ads) {
    if (ad.ai_category && ad.ai_hook) continue;
    
    const category = ad.ad_type === 'video' ? 'video' : categories[Math.floor(Math.random() * categories.length)];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    
    updateAiMetadata(ad.ad_id, category, hook);
    console.log(`✅ ${ad.headline?.substring(0, 40)}... → ${category} / ${hook}`);
  }
  
  console.log('\n✅ Mock analysis complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Use mock mode if no API key
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  No OpenAI API key found, using mock analysis');
    analyzeAllAdsMock().catch(console.error);
  } else {
    analyzeAllAds().catch(console.error);
  }
}

export { analyzeAllAds, analyzeAllAdsMock };
