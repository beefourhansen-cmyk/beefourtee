const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load .env if present
const ENV_PATH = path.join(__dirname, '.env');
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  }
}
loadEnv();

function saveEnvVar(updates) {
  let existing = {};
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        existing[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
  existing = { ...existing, ...updates };
  const out = Object.entries(existing)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  fs.writeFileSync(ENV_PATH, out, 'utf8');
  loadEnv();
}

// Strict normalization per brief:
// "font needs to be all lowercase no punctuation, in a neon colour, font small enough for squinting"
function normalizePhrase(raw) {
  return raw
    .toLowerCase()
    .replace(/[-–—]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadPhrasesFromReadme() {
  const readmePath = path.join(__dirname, 'readme.txt');
  const rawLines = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, 'utf8').split(/\r?\n/)
    : [];

  // Phrases start after line 7 ("Confidential, here's the list of product...")
  const phrases = [];
  let started = false;
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase().startsWith('confidential')) {
      started = true;
      continue;
    }
    if (!started) continue;
    const clean = normalizePhrase(trimmed);
    if (clean) {
      phrases.push({
        id: String(phrases.length + 1).padStart(2, '0'),
        raw: trimmed,
        text: clean
      });
    }
  }
  return phrases;
}

const NEON_COLORS = [
  {
    id: 'neon-yellow',
    name: 'neon yellow',
    label: 'Volt Yellow',
    hex: '#EFFF00',
    glow: 'rgba(239, 255, 0, 0.35)',
    pantone: '809 C'
  },
  {
    id: 'neon-pink',
    name: 'neon pink',
    label: 'Acid Pink',
    hex: '#FF1476',
    glow: 'rgba(255, 20, 118, 0.38)',
    pantone: '806 C'
  },
  {
    id: 'neon-orange',
    name: 'neon orange',
    label: 'Signal Orange',
    hex: '#FF5100',
    glow: 'rgba(255, 81, 0, 0.38)',
    pantone: '804 C'
  },
  {
    id: 'neon-green',
    name: 'neon green',
    label: 'Venom Green',
    hex: '#00FF5E',
    glow: 'rgba(0, 255, 94, 0.35)',
    pantone: '802 C'
  },
  {
    id: 'neon-cyan',
    name: 'neon cyan',
    label: 'Electric Cyan',
    hex: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.35)',
    pantone: '801 C'
  },
  {
    id: 'neon-violet',
    name: 'neon ultraviolet',
    label: 'Ultraviolet',
    hex: '#BF3EFF',
    glow: 'rgba(191, 62, 255, 0.40)',
    pantone: '807 C'
  }
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

// Printful Bella+Canvas 3001 Black tee variant IDs for automated dropshipping
const PRINTFUL_BLACK_3001_VARIANTS = {
  XS: 9527,
  S: 4016,
  M: 4017,
  L: 4018,
  XL: 4019,
  '2XL': 4020,
  '3XL': 5295
};

function getStripeInfo() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key || !key.startsWith('sk_')) {
    return { configured: false, mode: 'unconfigured' };
  }
  return {
    configured: true,
    mode: key.startsWith('sk_live_') ? 'live' : 'test',
    maskedKey: key.slice(0, 8) + '••••••••' + key.slice(-4)
  };
}

function getDropshipInfo() {
  const printfulKey = process.env.PRINTFUL_API_KEY || '';
  return {
    provider: 'Printful / DTG Print-Ready SVG',
    autoFulfillConfigured: Boolean(printfulKey),
    maskedKey: printfulKey ? printfulKey.slice(0, 6) + '••••' : null
  };
}

function getPriceCents() {
  const parsed = parseInt(process.env.SHIRT_PRICE_CENTS || '2800', 10);
  return Number.isFinite(parsed) && parsed >= 500 ? parsed : 2800;
}

// Generate 4500x5400 DTG transparent SVG print file for chest placement
// Exact spec: single-line, all lowercase, no punctuation, squint-sized center chest
function buildPrintSvg(phraseText, hexColor) {
  const escaped = phraseText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // On a 4500px wide (15 inch @ 300dpi) print area:
  // A font size of ~86px renders ~0.28 inches tall on the physical shirt chest:
  // small enough to make someone squint across a room, crisp enough to read once they do.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4500 5400" width="4500" height="5400">
  <metadata>Copyright (c) 2026 Bee Four Inc. (Bee Four Tee). All Rights Reserved. Licensed exclusively for authorized Bee Four Tee fulfillment.</metadata>
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&amp;display=swap');
      .squint-line {
        font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 500;
        font-size: 86px;
        letter-spacing: 2.5px;
        fill: ${hexColor};
        text-anchor: middle;
        dominant-baseline: middle;
      }
    </style>
  </defs>
  <!-- Center chest placement: y=1350 (approx 4.5" down from collar on 15"x18" platen) -->
  <text x="2250" y="1350" class="squint-line">${escaped}</text>
</svg>`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function createStripeCheckoutSession({ phrase, color, size, origin }) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || !stripeKey.startsWith('sk_')) {
    const err = new Error('STRIPE_NOT_CONFIGURED');
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }

  const priceCents = getPriceCents();
  const printFileUrl = `${origin}/api/print-file.svg?phrase=${encodeURIComponent(phrase.text)}&color=${encodeURIComponent(color.id)}`;

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/?checkout=success&phrase=${encodeURIComponent(phrase.id)}&color=${encodeURIComponent(color.id)}&size=${encodeURIComponent(size)}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/?checkout=cancelled&phrase=${encodeURIComponent(phrase.id)}&color=${encodeURIComponent(color.id)}&size=${encodeURIComponent(size)}`);

  // Collect shipping address for dropshipping fulfillment
  const allowedCountries = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK'];
  allowedCountries.forEach((country, idx) => {
    params.append(`shipping_address_collection[allowed_countries][${idx}]`, country);
  });

  // Free shipping or flat rate option
  params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '0');
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
  params.append('shipping_options[0][shipping_rate_data][display_name]', 'Standard Dropship Delivery (Included)');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '4');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '8');

  // Line item
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][unit_amount]', String(priceCents));
  params.append('line_items[0][price_data][product_data][name]', `bee four tee #${phrase.id}: "${phrase.text}"`);
  params.append(
    'line_items[0][price_data][product_data][description]',
    `All-black tee · ${color.label} (${color.name}) ink · Size ${size} · Single-line lowercase squint print · Bee Four Inc.`
  );

  // Order metadata for dropship fulfillment & dashboard visibility
  const metadata = {
    brand: 'Bee Four Tee (Bee Four Inc)',
    specimen_id: phrase.id,
    phrase_printed: phrase.text,
    garment_color: 'Jet Black (#050505)',
    neon_color_id: color.id,
    neon_color_name: color.name,
    neon_hex: color.hex,
    neon_pantone: color.pantone,
    garment_size: size,
    printful_variant_id: String(PRINTFUL_BLACK_3001_VARIANTS[size] || 4018),
    print_file_svg: printFileUrl
  };

  for (const [k, v] of Object.entries(metadata)) {
    params.append(`metadata[${k}]`, v);
    params.append(`payment_intent_data[metadata][${k}]`, v);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const result = await response.json();
  if (!response.ok) {
    const err = new Error(result?.error?.message || 'Stripe API error');
    err.code = 'STRIPE_API_ERROR';
    throw err;
  }

  return result;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const origin = `${proto}://${host}`;
    const urlObj = new URL(req.url, origin);
    const pathname = urlObj.pathname;

    // 1. Catalog endpoint
    if (pathname === '/api/catalog' && req.method === 'GET') {
      const phrases = loadPhrasesFromReadme();
      const isLocalAdmin = !req.headers['x-forwarded-for'] && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
      return sendJson(res, 200, {
        brand: 'bee four tee',
        parentCompany: 'Bee Four Inc.',
        priceCents: getPriceCents(),
        currency: 'USD',
        phrases,
        colors: NEON_COLORS,
        sizes: SIZES,
        isLocalAdmin,
        stripe: getStripeInfo(),
        dropship: getDropshipInfo()
      });
    }

    // 2. Print-ready SVG endpoint (for Printful / Printify / local screenprinter)
    if ((pathname === '/api/print-file' || pathname === '/api/print-file.svg') && req.method === 'GET') {
      const phrases = loadPhrasesFromReadme();
      const phraseParam = urlObj.searchParams.get('phrase') || phrases[0]?.text || 'planned ragamuffin';
      const colorParam = urlObj.searchParams.get('color') || 'neon-yellow';
      const cleanPhrase = normalizePhrase(phraseParam);
      const colorObj = NEON_COLORS.find(c => c.id === colorParam || c.hex.toLowerCase() === colorParam.toLowerCase()) || NEON_COLORS[0];
      const svg = buildPrintSvg(cleanPhrase, colorObj.hex);

      const download = urlObj.searchParams.get('download') === '1';
      const headers = {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache'
      };
      if (download) {
        const slug = cleanPhrase.replace(/\s+/g, '-').slice(0, 32);
        headers['Content-Disposition'] = `attachment; filename="beefourtee-${slug}-${colorObj.id}.svg"`;
      }
      res.writeHead(200, headers);
      return res.end(svg);
    }

    // 3. Configure Stripe & Dropship credentials right from the UI (localhost owner only)
    if (pathname === '/api/config' && req.method === 'POST') {
      const isLocalAdmin = !req.headers['x-forwarded-for'] && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
      if (!isLocalAdmin) {
        return sendJson(res, 403, { error: 'Owner settings can only be changed from localhost:3000.' });
      }
      const body = await readJsonBody(req);
      const updates = {};

      if (typeof body.stripeSecretKey === 'string') {
        const key = body.stripeSecretKey.trim();
        if (key && !key.startsWith('sk_')) {
          return sendJson(res, 400, {
            error: 'Stripe Secret Key must start with sk_live_ or sk_test_.'
          });
        }
        updates.STRIPE_SECRET_KEY = key;
      }

      if (typeof body.printfulApiKey === 'string') {
        updates.PRINTFUL_API_KEY = body.printfulApiKey.trim();
      }

      if (body.priceDollars !== undefined) {
        const dollars = Number(body.priceDollars);
        if (Number.isFinite(dollars) && dollars >= 5 && dollars <= 500) {
          updates.SHIRT_PRICE_CENTS = String(Math.round(dollars * 100));
        }
      }

      saveEnvVar(updates);
      return sendJson(res, 200, {
        ok: true,
        priceCents: getPriceCents(),
        stripe: getStripeInfo(),
        dropship: getDropshipInfo()
      });
    }

    // 4. Checkout Session creation
    if (pathname === '/api/checkout' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const phrases = loadPhrasesFromReadme();

      // Enforce the sacred Bee Four Tee rule:
      // Customers CANNOT invent or modify the phrase; it must come from the official archive by ID.
      const phrase = phrases.find(p => p.id === String(body.phraseId).padStart(2, '0'));
      if (!phrase) {
        return sendJson(res, 400, {
          error: 'Nice try. Custom phrases are strictly forbidden. Pick a specimen from the archive.'
        });
      }

      const color = NEON_COLORS.find(c => c.id === body.colorId) || NEON_COLORS[0];
      const size = SIZES.includes(body.size) ? body.size : 'L';

      // Log order intent locally in orders.jsonl
      const orderRecord = {
        timestamp: new Date().toISOString(),
        specimenId: phrase.id,
        phrase: phrase.text,
        colorId: color.id,
        colorName: color.name,
        colorHex: color.hex,
        size,
        priceCents: getPriceCents()
      };

      if (body.simulate === true) {
        const testSessionId = 'test_sim_' + Date.now();
        fs.appendFileSync(
          path.join(__dirname, 'orders.jsonl'),
          JSON.stringify({ ...orderRecord, stripeSessionId: testSessionId, status: 'simulated_test_order' }) + '\n'
        );
        const simUrl = `${origin}/?checkout=success&mode=test&phrase=${encodeURIComponent(phrase.id)}&color=${encodeURIComponent(color.id)}&size=${encodeURIComponent(size)}&session_id=${testSessionId}`;
        return sendJson(res, 200, { url: simUrl, sessionId: testSessionId, simulated: true });
      }

      try {
        const session = await createStripeCheckoutSession({ phrase, color, size, origin });
        fs.appendFileSync(
          path.join(__dirname, 'orders.jsonl'),
          JSON.stringify({ ...orderRecord, stripeSessionId: session.id, status: 'redirected_to_stripe' }) + '\n'
        );
        return sendJson(res, 200, { url: session.url, sessionId: session.id });
      } catch (err) {
        if (err.code === 'STRIPE_NOT_CONFIGURED') {
          return sendJson(res, 428, {
            code: 'STRIPE_NOT_CONFIGURED',
            error: 'Connect your Stripe Secret Key to accept live payments tonight.',
            previewOrder: {
              ...orderRecord,
              printFileUrl: `${origin}/api/print-file.svg?phrase=${encodeURIComponent(phrase.text)}&color=${encodeURIComponent(color.id)}&download=1`
            }
          });
        }
        return sendJson(res, 400, { error: err.message || 'Checkout failed' });
      }
    }

    // 5. Stripe -> Printful automated dropship webhook
    if (pathname === '/api/webhooks/stripe' && req.method === 'POST') {
      const event = await readJsonBody(req);
      if (event && event.type === 'checkout.session.completed') {
        const session = event.data?.object || {};
        const meta = session.metadata || {};
        const shipping = session.shipping_details || session.customer_details || {};
        const addr = shipping.address || {};

        let printfulResult = 'skipped_no_printful_key';
        if (process.env.PRINTFUL_API_KEY && addr.line1) {
          try {
            const pfRes = await fetch('https://api.printful.com/orders', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                recipient: {
                  name: shipping.name || 'Bee Four Tee Customer',
                  address1: addr.line1,
                  address2: addr.line2 || '',
                  city: addr.city,
                  state_code: addr.state,
                  country_code: addr.country,
                  zip: addr.postal_code,
                  email: session.customer_details?.email || ''
                },
                items: [
                  {
                    variant_id: Number(meta.printful_variant_id || 4018),
                    quantity: 1,
                    name: `bee four tee #${meta.specimen_id}: ${meta.phrase_printed}`,
                    files: [
                      {
                        type: 'default',
                        url: meta.print_file_svg
                      }
                    ]
                  }
                ]
              })
            });
            printfulResult = pfRes.ok ? 'draft_order_created' : `error_${pfRes.status}`;
          } catch (pfErr) {
            printfulResult = `error_${pfErr.message}`;
          }
        }

        fs.appendFileSync(
          path.join(__dirname, 'orders.jsonl'),
          JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'checkout.session.completed',
            stripeSessionId: session.id,
            metadata: meta,
            shipping,
            printfulResult
          }) + '\n'
        );
      }
      return sendJson(res, 200, { received: true });
    }

    // 6. Serve static files from /public
    const publicDir = path.join(__dirname, 'public');
    let safePath = pathname === '/' ? '/index.html' : pathname;
    const resolvedPath = path.normalize(path.join(publicDir, safePath));
    if (!resolvedPath.startsWith(publicDir)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      const ext = path.extname(resolvedPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      return fs.createReadStream(resolvedPath).pipe(res);
    }

    // Fallback to index.html
    const indexHtml = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexHtml).pipe(res);
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Bee Four Tee (a division of Bee Four Inc.) listening on http://localhost:${PORT}`);
});
