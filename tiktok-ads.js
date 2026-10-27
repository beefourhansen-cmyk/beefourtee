#!/usr/bin/env node
/**
 * Bee Four Tee — TikTok Marketing API v1.3 & Events API Automation
 * Usage:
 *   node tiktok-ads.js status
 *   node tiktok-ads.js track-test
 *   node tiktok-ads.js launch --budget 25
 */

const fs = require('fs');
const path = require('path');

// Load .env
const ENV_PATH = path.join(__dirname, '.env');
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://beefourtees.shop';

function getCreds() {
  return {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
    advertiserId: process.env.TIKTOK_ADVERTISER_ID || '',
    pixelId: process.env.TIKTOK_PIXEL_ID || ''
  };
}

async function tiktokRequest(endpoint, method = 'POST', body = null) {
  const { accessToken } = getCreds();
  if (!accessToken) {
    throw new Error('Missing TIKTOK_ACCESS_TOKEN in .env');
  }

  let url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  };

  if (method === 'GET' && body) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      params.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    url += `?${params.toString()}`;
  } else if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const json = await res.json();
  if (json.code && json.code !== 0) {
    throw new Error(`TikTok API Error (${json.code}): ${json.message}`);
  }
  return json.data;
}

async function checkStatus() {
  const { accessToken, advertiserId, pixelId } = getCreds();
  console.log('=== Bee Four Tee · TikTok Ads API Status ===');
  console.log(`Target Storefront : ${SITE_URL}`);
  console.log(`Access Token      : ${accessToken ? accessToken.slice(0, 8) + '••••••••' : 'NOT SET (add TIKTOK_ACCESS_TOKEN to .env)'}`);
  console.log(`Advertiser ID     : ${advertiserId || 'NOT SET (add TIKTOK_ADVERTISER_ID to .env)'}`);
  console.log(`TikTok Pixel ID   : ${pixelId || 'NOT SET (add TIKTOK_PIXEL_ID to .env)'}`);

  if (accessToken && advertiserId) {
    const info = await tiktokRequest('/advertiser/info/', 'GET', {
      advertiser_ids: [advertiserId]
    });
    console.log('\nConnected Advertiser Account:', JSON.stringify(info, null, 2));
  }
}

async function sendTestPixelEvent() {
  const { pixelId } = getCreds();
  if (!pixelId) {
    throw new Error('Add TIKTOK_PIXEL_ID=... and TIKTOK_ACCESS_TOKEN=... to .env first.');
  }

  const data = await tiktokRequest('/pixel/track/', 'POST', {
    pixel_code: pixelId,
    event: 'CompletePayment',
    timestamp: new Date().toISOString(),
    context: {
      page: { url: SITE_URL },
      user_agent: 'BeeFourTee-Server/1.0'
    },
    properties: {
      currency: 'USD',
      value: 28.0,
      content_type: 'product',
      content_id: 'b4t_54',
      content_name: 'bee four tee #54: doodle xray (neon pink)'
    }
  });
  console.log('✓ Sent CompletePayment ($28.00) event to TikTok Pixel:', pixelId, data || 'OK');
}

async function launchCampaign(dailyBudget = 25) {
  const { advertiserId, pixelId } = getCreds();
  if (!advertiserId) {
    throw new Error('Add TIKTOK_ADVERTISER_ID=... and TIKTOK_ACCESS_TOKEN=... to .env first.');
  }

  console.log(`Creating TikTok Website Conversions Campaign ($${dailyBudget}/day) for ${SITE_URL}...`);

  // 1. Create Campaign
  const campaign = await tiktokRequest('/campaign/create/', 'POST', {
    advertiser_id: advertiserId,
    campaign_name: `Bee Four Tee — Squint Test (CA + US) — ${new Date().toISOString().slice(0, 10)}`,
    objective_type: 'WEB_CONVERSIONS',
    budget_mode: 'BUDGET_MODE_DAY',
    budget: Number(dailyBudget)
  });

  console.log('✓ Created Campaign ID:', campaign.campaign_id);

  // 2. Create Ad Group targeting Canada & US (Location IDs: 6251999 = Canada, 6252001 = United States)
  const adgroupPayload = {
    advertiser_id: advertiserId,
    campaign_id: campaign.campaign_id,
    adgroup_name: 'CA + US · 18-44 · Streetwear & Deadpan Humor',
    placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
    promotion_type: 'WEBSITE',
    location_ids: ['6251999', '6252001'],
    age_groups: ['AGE_18_24', 'AGE_25_34', 'AGE_35_44'],
    budget_mode: 'BUDGET_MODE_DAY',
    budget: Number(dailyBudget),
    schedule_type: 'SCHEDULE_FROM_NOW',
    schedule_start_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    billing_event: 'OCPM',
    optimization_goal: 'CONVERT'
  };

  if (pixelId) {
    adgroupPayload.pixel_id = pixelId;
    adgroupPayload.optimization_event = 'ON_WEB_ORDER';
  }

  const adgroup = await tiktokRequest('/adgroup/create/', 'POST', adgroupPayload);
  console.log('✓ Created Ad Group ID:', adgroup.adgroup_id);
  console.log(`\nNext: Upload your generated 9:16 TikTok video from ${SITE_URL} into Ad Group ${adgroup.adgroup_id}!`);
}

(async () => {
  const cmd = process.argv[2] || 'status';
  const budgetIdx = process.argv.indexOf('--budget');
  const budget = budgetIdx !== -1 ? Number(process.argv[budgetIdx + 1] || 25) : 25;

  try {
    if (cmd === 'status') await checkStatus();
    else if (cmd === 'track-test') await sendTestPixelEvent();
    else if (cmd === 'launch') await launchCampaign(budget);
    else console.log('Commands: status | track-test | launch --budget 25');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
