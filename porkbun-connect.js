#!/usr/bin/env node
/**
 * Auto-Connect beefourtees.shop on Porkbun to GitHub Pages (beefourhansen-cmyk/beefourtee)
 * Usage:
 *   node porkbun-connect.js <pk1_...> <sk1_...>
 *   (or set PORKBUN_API_KEY and PORKBUN_SECRET_KEY in .env)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

const DOMAIN = 'beefourtees.shop';
const GITHUB_USER_HOST = 'beefourhansen-cmyk.github.io';
const GITHUB_IPS = [
  '185.199.108.153',
  '185.199.109.153',
  '185.199.110.153',
  '185.199.111.153'
];

const apikey = process.argv[2] || process.env.PORKBUN_API_KEY || '';
const secretapikey = process.argv[3] || process.env.PORKBUN_SECRET_KEY || '';

async function porkbunPost(endpoint, extra = {}) {
  const res = await fetch(`https://api.porkbun.com/api/json/v3${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey, secretapikey, ...extra })
  });
  const data = await res.json();
  if (data.status !== 'SUCCESS') {
    throw new Error(`Porkbun API (${endpoint}): ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

(async () => {
  if (!apikey || !secretapikey) {
    console.error('Provide Porkbun API keys: node porkbun-connect.js pk1_... sk1_...');
    process.exit(1);
  }

  console.log(`1. Fetching existing DNS records for ${DOMAIN}...`);
  const existing = await porkbunPost(`/dns/retrieve/${DOMAIN}`);

  for (const rec of existing.records || []) {
    if (
      (rec.type === 'ALIAS' || rec.type === 'A' || rec.type === 'CNAME') &&
      (rec.name === DOMAIN || rec.name === `www.${DOMAIN}` || rec.name === `*.${DOMAIN}`)
    ) {
      console.log(`   Removing parked record: [${rec.type}] ${rec.name} -> ${rec.content}`);
      await porkbunPost(`/dns/delete/${DOMAIN}/${rec.id}`);
    }
  }

  console.log(`2. Adding GitHub Pages A records for ${DOMAIN}...`);
  for (const ip of GITHUB_IPS) {
    await porkbunPost(`/dns/create/${DOMAIN}`, {
      name: '',
      type: 'A',
      content: ip,
      ttl: '600'
    });
    console.log(`   ✓ Added A -> ${ip}`);
  }

  console.log(`3. Adding www.${DOMAIN} CNAME -> ${GITHUB_USER_HOST}...`);
  await porkbunPost(`/dns/create/${DOMAIN}`, {
    name: 'www',
    type: 'CNAME',
    content: GITHUB_USER_HOST,
    ttl: '600'
  });
  console.log(`   ✓ Added CNAME www -> ${GITHUB_USER_HOST}`);

  console.log(`4. Enabling custom domain ${DOMAIN} on GitHub Pages...`);
  fs.writeFileSync(path.join(__dirname, 'public', 'CNAME'), `${DOMAIN}\n`, 'utf8');
  execSync(
    `gh api -X PUT repos/beefourhansen-cmyk/beefourtee/pages -f "cname=${DOMAIN}" -f "source[branch]=gh-pages" -f "source[path]=/"`,
    { stdio: 'inherit' }
  );

  console.log(`\n🎉 ${DOMAIN} is now connected to GitHub Pages!`);
})();
