const FALLBACK_PHRASES = [
  'planned ragamuffin',
  'hot chicken beak',
  'boob bones',
  'flake cereal girl',
  'sharts discreetly',
  'theres always the bathtub',
  'prolapsed prostate',
  'english muffin dough',
  'hot skunt',
  'brain swab',
  'shredded latex',
  'pterodactyl tits',
  'fuzzy balloon knot',
  'juicy deets',
  'schmear gobbler',
  'finger them all then flip them the bird',
  'parallelograms can kiss my rectogon',
  'turtle rehab',
  'the bite slaps',
  'gluten free guilt',
  'houndstooth hallmark',
  'nipple schmear',
  'pelican gizzard',
  'stunned mullet',
  'butthole infection',
  'sex toy storage',
  'thats not grandma thats drugs',
  'cooter cougher',
  'i live under the bus',
  'sand repellent anus',
  'manpons',
  'jew yew',
  'foreskin schmoreskin',
  'baste my turkey',
  'fiveskin',
  'goldilocks cockle',
  'trashy telly',
  'ballet hype boy',
  'i did not start a cult',
  'sous vide panties',
  'party awroka',
  'party tit',
  'mount mammary',
  'of sorts',
  'im a hobo 10',
  'all nilly no willy',
  'vegetarian with loose morals',
  'steamed pants clam',
  'dont be hasty just be tasty',
  'ticklish fancy',
  'vagitarian',
  'free range titties',
  'chickens tits',
  'doodle xray',
  'one persons trash is anothers dildo',
  'black face nuts',
  'esquiffe',
  'brazil nut',
  'blonde python',
  'slutty squirrel',
  'mamma nuts first',
  'fussy bussy',
  'my tits are islands',
  'your own business',
  'ramen rack activated',
  'wet gizzard',
  'sea gull',
  'shop lifted anal beads',
  'dings and diddles',
  'spiritual lesbian'
].map((text, i) => ({
  id: String(i + 1).padStart(2, '0'),
  raw: text,
  text
}));

const FALLBACK_COLORS = [
  { id: 'neon-yellow', name: 'neon yellow', label: 'Volt Yellow', hex: '#EFFF00', glow: 'rgba(239, 255, 0, 0.35)', pantone: '809 C' },
  { id: 'neon-pink', name: 'neon pink', label: 'Acid Pink', hex: '#FF1476', glow: 'rgba(255, 20, 118, 0.38)', pantone: '806 C' },
  { id: 'neon-orange', name: 'neon orange', label: 'Signal Orange', hex: '#FF5100', glow: 'rgba(255, 81, 0, 0.38)', pantone: '804 C' },
  { id: 'neon-green', name: 'neon green', label: 'Venom Green', hex: '#00FF5E', glow: 'rgba(0, 255, 94, 0.35)', pantone: '802 C' },
  { id: 'neon-cyan', name: 'neon cyan', label: 'Electric Cyan', hex: '#00F0FF', glow: 'rgba(0, 240, 255, 0.35)', pantone: '801 C' },
  { id: 'neon-violet', name: 'neon ultraviolet', label: 'Ultraviolet', hex: '#BF3EFF', glow: 'rgba(191, 62, 255, 0.40)', pantone: '807 C' }
];

const FALLBACK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const TAMPER_REPLIES = [
  'you can’t edit the words. every phrase was collected in the wild. deal another or change the neon.',
  'nice try. bee four inc. does not take custom text requests. pick a neon ink instead.',
  'the phrase is non-negotiable. lowercase, no punctuation, zero edits. spin again if you’re scared.',
  'locked by house rule: you choose the neon color and size. we supply the unhinged vocabulary.'
];

const DISTANCE_CAPTIONS = {
  far: 'at 10 feet: a tiny radioactive streak on a pitch-black chest. strangers have to walk closer and squint.',
  squint: 'at 5 feet: small enough to force a squint. bright enough that they know something is written on your chest.',
  close: 'at 1 foot: razor-sharp lowercase plastisol ink on heavyweight combed black cotton. zero punctuation.'
};

const state = {
  phrases: FALLBACK_PHRASES,
  colors: FALLBACK_COLORS,
  sizes: FALLBACK_SIZES,
  priceCents: 2800,
  selectedPhraseIndex: 0,
  selectedColorIndex: 0,
  selectedSize: 'L',
  distance: 'squint',
  stripe: { configured: false, mode: 'unconfigured' },
  stripePaymentLink: '', // Optional Stripe Payment Link (https://buy.stripe.com/...) for static GitHub Pages
  dropship: { autoFulfillConfigured: false },
  isLocalAdmin: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  tamperCount: 0,
  isSpinning: false,
  pendingCheckoutAfterSetup: false
};

// DOM Elements
const els = {
  stageSpecimenCode: document.getElementById('stageSpecimenCode'),
  shirtViewport: document.getElementById('shirtViewport'),
  shirtChestText: document.getElementById('shirtChestText'),
  chestPrintZone: document.getElementById('chestPrintZone'),
  distanceCaption: document.getElementById('distanceCaption'),
  ticketSpecimenId: document.getElementById('ticketSpecimenId'),
  ticketPriceDisplay: document.getElementById('ticketPriceDisplay'),
  phraseDisplayBox: document.getElementById('phraseDisplayBox'),
  ticketPhraseText: document.getElementById('ticketPhraseText'),
  tamperNotice: document.getElementById('tamperNotice'),
  dealShirtBtn: document.getElementById('dealShirtBtn'),
  selectedColorName: document.getElementById('selectedColorName'),
  colorSwatchGrid: document.getElementById('colorSwatchGrid'),
  selectedSizeLabel: document.getElementById('selectedSizeLabel'),
  sizeGrid: document.getElementById('sizeGrid'),
  buyShirtBtn: document.getElementById('buyShirtBtn'),
  buyBtnLabel: document.getElementById('buyBtnLabel'),
  downloadPrintSvgLink: document.getElementById('downloadPrintSvgLink'),
  archiveSearchInput: document.getElementById('archiveSearchInput'),
  archiveGrid: document.getElementById('archiveGrid'),
  stripeStatusDot: document.getElementById('stripeStatusDot'),
  stripeStatusText: document.getElementById('stripeStatusText'),
  openStripeSetupBtn: document.getElementById('openStripeSetupBtn'),
  footerSetupBtn: document.getElementById('footerSetupBtn'),
  setupModal: document.getElementById('setupModal'),
  closeSetupModalBtn: document.getElementById('closeSetupModalBtn'),
  cancelSetupBtn: document.getElementById('cancelSetupBtn'),
  stripeConfigForm: document.getElementById('stripeConfigForm'),
  stripeSecretKeyInput: document.getElementById('stripeSecretKeyInput'),
  shirtPriceInput: document.getElementById('shirtPriceInput'),
  printfulApiKeyInput: document.getElementById('printfulApiKeyInput'),
  currentStripeKeyStatus: document.getElementById('currentStripeKeyStatus'),
  modalPreviewOrderBox: document.getElementById('modalPreviewOrderBox'),
  modalPreviewOrderDetails: document.getElementById('modalPreviewOrderDetails'),
  checkoutBanner: document.getElementById('checkoutBanner'),
  checkoutBannerText: document.getElementById('checkoutBannerText'),
  closeBannerBtn: document.getElementById('closeBannerBtn')
};

function formatPrice(cents) {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

function getCurrentPhrase() {
  return state.phrases[state.selectedPhraseIndex] || state.phrases[0];
}

function getCurrentColor() {
  return state.colors[state.selectedColorIndex] || state.colors[0];
}

function applyNeonTheme(color) {
  document.documentElement.style.setProperty('--active-neon', color.hex);
  document.documentElement.style.setProperty('--active-neon-glow', color.glow);
}

function updateChestFontFit(text) {
  // Keep single-line phrase small enough to squint at, scaling gently for longer phrases
  const len = text.length;
  let sizePx = 10.2;
  if (len > 34) sizePx = 7.4;
  else if (len > 26) sizePx = 8.4;
  else if (len > 18) sizePx = 9.4;
  els.shirtChestText.style.fontSize = `${sizePx}px`;
}

function buildClientPrintSvgDataUrl(phraseText, hexColor) {
  const escaped = phraseText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4500 5400" width="4500" height="5400">
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
  <text x="2250" y="1350" class="squint-line">${escaped}</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function renderShirtAndTicket() {
  const phrase = getCurrentPhrase();
  const color = getCurrentColor();
  const total = state.phrases.length;
  const priceFormatted = formatPrice(state.priceCents);

  applyNeonTheme(color);
  updateChestFontFit(phrase.text);

  els.stageSpecimenCode.textContent = `specimen #${phrase.id} / ${total}`;
  els.shirtChestText.textContent = phrase.text;
  els.ticketSpecimenId.textContent = `specimen #${phrase.id}`;
  els.ticketPhraseText.textContent = phrase.text;
  els.ticketPriceDisplay.textContent = priceFormatted;
  els.buyBtnLabel.textContent = `buy this shirt — ${priceFormatted}`;

  els.selectedColorName.textContent = `${color.name} · ${color.pantone}`;
  els.selectedSizeLabel.textContent = `size ${state.selectedSize} · relaxed unisex fit`;

  // Update print-ready SVG export link (works both via backend API and static client download)
  const slug = phrase.text.replace(/\s+/g, '-').slice(0, 32);
  els.downloadPrintSvgLink.href = buildClientPrintSvgDataUrl(phrase.text, color.hex);
  els.downloadPrintSvgLink.setAttribute('download', `beefourtee-${slug}-${color.id}.svg`);

  // Update swatch aria-checked states
  const swatches = els.colorSwatchGrid.querySelectorAll('.color-swatch');
  swatches.forEach((btn, idx) => {
    btn.setAttribute('aria-checked', idx === state.selectedColorIndex ? 'true' : 'false');
  });

  // Update size aria-checked states
  const sizeBtns = els.sizeGrid.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.setAttribute('aria-checked', btn.dataset.size === state.selectedSize ? 'true' : 'false');
  });

  // Highlight active specimen card in archive
  const cards = els.archiveGrid.querySelectorAll('.specimen-card');
  cards.forEach(card => {
    card.classList.toggle('active', card.dataset.id === phrase.id);
  });
}

function renderColorSwatches() {
  els.colorSwatchGrid.innerHTML = '';
  state.colors.forEach((color, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', `${color.name} (${color.label})`);
    btn.setAttribute('aria-checked', idx === state.selectedColorIndex ? 'true' : 'false');
    btn.title = `${color.name} (${color.pantone})`;
    btn.style.setProperty('--swatch-hex', color.hex);

    const dot = document.createElement('span');
    dot.className = 'color-swatch-dot';
    btn.appendChild(dot);

    btn.addEventListener('click', () => {
      state.selectedColorIndex = idx;
      renderShirtAndTicket();
    });

    els.colorSwatchGrid.appendChild(btn);
  });
}

function renderSizeButtons() {
  els.sizeGrid.innerHTML = '';
  state.sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size-btn';
    btn.dataset.size = size;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', size === state.selectedSize ? 'true' : 'false');
    btn.textContent = size;

    btn.addEventListener('click', () => {
      state.selectedSize = size;
      renderShirtAndTicket();
    });

    els.sizeGrid.appendChild(btn);
  });
}

function renderArchive(filterText = '') {
  const query = filterText.trim().toLowerCase();
  els.archiveGrid.innerHTML = '';

  const currentPhrase = getCurrentPhrase();
  state.phrases.forEach((item, index) => {
    if (query && !item.text.includes(query) && !item.id.includes(query)) {
      return;
    }

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'specimen-card' + (item.id === currentPhrase.id ? ' active' : '');
    card.dataset.id = item.id;

    const num = document.createElement('span');
    num.className = 'specimen-num';
    num.textContent = `#${item.id}`;

    const text = document.createElement('span');
    text.className = 'specimen-phrase';
    text.textContent = item.text;

    card.appendChild(num);
    card.appendChild(text);

    card.addEventListener('click', () => {
      state.selectedPhraseIndex = index;
      els.tamperNotice.hidden = true;
      renderShirtAndTicket();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    els.archiveGrid.appendChild(card);
  });
}

function renderStripeStatus() {
  if (!state.isLocalAdmin) {
    els.openStripeSetupBtn.hidden = true;
    els.footerSetupBtn.hidden = true;
    return;
  }
  els.openStripeSetupBtn.hidden = false;
  els.footerSetupBtn.hidden = false;
  if (state.stripe.configured) {
    els.stripeStatusDot.classList.add('live');
    els.stripeStatusText.textContent = `stripe ${state.stripe.mode} active`;
    els.currentStripeKeyStatus.textContent = `active key: ${state.stripe.maskedKey} (${state.stripe.mode} mode)`;
  } else {
    els.stripeStatusDot.classList.remove('live');
    els.stripeStatusText.textContent = 'connect stripe';
    els.currentStripeKeyStatus.textContent = 'currently unconfigured — paste your sk_live_ or sk_test_ key to activate checkout';
  }
  els.shirtPriceInput.value = Math.round(state.priceCents / 100);
}

// Deal / Spin Random Shirt Generator
function spinRandomShirt() {
  if (state.isSpinning || state.phrases.length <= 1) return;
  state.isSpinning = true;
  els.tamperNotice.hidden = true;

  const total = state.phrases.length;
  let targetIndex = Math.floor(Math.random() * total);
  if (targetIndex === state.selectedPhraseIndex) {
    targetIndex = (targetIndex + 1) % total;
  }

  let ticks = 0;
  const maxTicks = 9;
  const interval = setInterval(() => {
    ticks++;
    if (ticks < maxTicks) {
      const tempIdx = (state.selectedPhraseIndex + ticks * 7) % total;
      const tempPhrase = state.phrases[tempIdx];
      els.shirtChestText.textContent = tempPhrase.text;
      els.ticketPhraseText.textContent = tempPhrase.text;
      els.ticketSpecimenId.textContent = `specimen #${tempPhrase.id}`;
    } else {
      clearInterval(interval);
      state.selectedPhraseIndex = targetIndex;
      state.isSpinning = false;
      renderShirtAndTicket();
    }
  }, 42);
}

function triggerTamperNotice() {
  const msg = TAMPER_REPLIES[state.tamperCount % TAMPER_REPLIES.length];
  state.tamperCount++;
  els.tamperNotice.textContent = msg;
  els.tamperNotice.hidden = false;
}

async function handleBuyShirt(simulate = false) {
  const phrase = getCurrentPhrase();
  const color = getCurrentColor();
  const size = state.selectedSize;

  // If a Stripe Payment Link is configured (for static GitHub Pages hosting), redirect with client_reference_id
  if (!simulate && state.stripePaymentLink && state.stripePaymentLink.startsWith('https://buy.stripe.com/')) {
    const refId = `b4t_${phrase.id}_${color.id}_${size}`;
    const sep = state.stripePaymentLink.includes('?') ? '&' : '?';
    window.location.href = `${state.stripePaymentLink}${sep}client_reference_id=${encodeURIComponent(refId)}`;
    return;
  }

  // If a public visitor clicks Buy before Stripe is configured, run simulated test checkout automatically
  const shouldSimulate = simulate === true || (!state.isLocalAdmin && !state.stripe.configured);

  els.buyShirtBtn.disabled = true;
  els.buyBtnLabel.textContent = shouldSimulate ? 'processing test order...' : 'creating stripe session...';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phraseId: phrase.id,
        colorId: color.id,
        size,
        simulate: shouldSimulate
      })
    });

    if (res.status === 404 || res.status === 405) {
      window.location.href = `?checkout=success&mode=test&phrase=${encodeURIComponent(phrase.id)}&color=${encodeURIComponent(color.id)}&size=${encodeURIComponent(size)}`;
      return;
    }

    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }

    if (res.status === 428 || data.code === 'STRIPE_NOT_CONFIGURED') {
      // Open the 10-second Stripe Setup modal with their exact shirt queued up
      state.pendingCheckoutAfterSetup = true;
      els.modalPreviewOrderBox.hidden = false;
      els.modalPreviewOrderDetails.textContent =
        `specimen #${phrase.id} ("${phrase.text}") · ${color.name} ink · size ${size} · ${formatPrice(state.priceCents)}`;
      openSetupModal();
    } else {
      alert(data.error || 'Could not start Stripe checkout.');
    }
  } catch (err) {
    window.location.href = `?checkout=success&mode=test&phrase=${encodeURIComponent(phrase.id)}&color=${encodeURIComponent(color.id)}&size=${encodeURIComponent(size)}`;
  } finally {
    els.buyShirtBtn.disabled = false;
    els.buyBtnLabel.textContent = `buy this shirt — ${formatPrice(state.priceCents)}`;
  }
}

function openSetupModal() {
  els.setupModal.hidden = false;
  setTimeout(() => els.stripeSecretKeyInput.focus(), 50);
}

function closeSetupModal() {
  els.setupModal.hidden = true;
  els.modalPreviewOrderBox.hidden = true;
  state.pendingCheckoutAfterSetup = false;
}

async function handleSaveStripeConfig(e) {
  e.preventDefault();
  const stripeSecretKey = els.stripeSecretKeyInput.value.trim();
  const priceDollars = Number(els.shirtPriceInput.value);
  const printfulApiKey = els.printfulApiKeyInput.value.trim();

  const payload = { priceDollars };
  if (stripeSecretKey) payload.stripeSecretKey = stripeSecretKey;
  if (printfulApiKey) payload.printfulApiKey = printfulApiKey;

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to save configuration.');
      return;
    }

    state.priceCents = data.priceCents;
    state.stripe = data.stripe;
    state.dropship = data.dropship;
    els.stripeSecretKeyInput.value = '';
    renderStripeStatus();
    renderShirtAndTicket();

    const shouldResumeCheckout = state.pendingCheckoutAfterSetup && state.stripe.configured;
    closeSetupModal();

    if (shouldResumeCheckout) {
      handleBuyShirt();
    }
  } catch (err) {
    alert('Error saving configuration.');
  }
}

function checkUrlReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const phraseParam = params.get('phrase');
  const colorParam = params.get('color');
  const sizeParam = params.get('size');
  const checkoutStatus = params.get('checkout');

  if (phraseParam) {
    const idx = state.phrases.findIndex(p => p.id === phraseParam.padStart(2, '0'));
    if (idx !== -1) state.selectedPhraseIndex = idx;
  }
  if (colorParam) {
    const cIdx = state.colors.findIndex(c => c.id === colorParam);
    if (cIdx !== -1) state.selectedColorIndex = cIdx;
  }
  if (sizeParam && state.sizes.includes(sizeParam)) {
    state.selectedSize = sizeParam;
  }

  if (checkoutStatus === 'success') {
    const p = getCurrentPhrase();
    const c = getCurrentColor();
    els.checkoutBannerText.textContent =
      `order confirmed — bee four tee #${p.id} ("${p.text}") in ${c.name}, size ${state.selectedSize} is queued for printing.`;
    els.checkoutBanner.hidden = false;
  } else if (checkoutStatus === 'cancelled') {
    els.checkoutBannerText.textContent =
      'checkout cancelled — your shirt is still on the press whenever you’re ready.';
    els.checkoutBanner.hidden = false;
  }
}

async function init() {
  // Start on a random phrase each visit unless specified in URL
  state.selectedPhraseIndex = Math.floor(Math.random() * state.phrases.length);

  try {
    const res = await fetch('/api/catalog');
    if (res.ok) {
      const catalog = await res.json();
      if (Array.isArray(catalog.phrases) && catalog.phrases.length > 0) {
        state.phrases = catalog.phrases;
      }
      if (Array.isArray(catalog.colors) && catalog.colors.length > 0) {
        state.colors = catalog.colors;
      }
      if (Array.isArray(catalog.sizes) && catalog.sizes.length > 0) {
        state.sizes = catalog.sizes;
      }
      if (catalog.priceCents) {
        state.priceCents = catalog.priceCents;
      }
      if (catalog.stripe) {
        state.stripe = catalog.stripe;
      }
      if (catalog.dropship) {
        state.dropship = catalog.dropship;
      }
    }
  } catch (_) {
    // Offline/static fallback works automatically
  }

  checkUrlReturnParams();
  renderColorSwatches();
  renderSizeButtons();
  renderArchive();
  renderStripeStatus();
  renderShirtAndTicket();

  // Event Listeners
  els.dealShirtBtn.addEventListener('click', spinRandomShirt);

  els.phraseDisplayBox.addEventListener('click', triggerTamperNotice);
  els.chestPrintZone.addEventListener('click', triggerTamperNotice);

  // Distance buttons
  document.querySelectorAll('.dist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dist-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const dist = btn.dataset.distance;
      state.distance = dist;
      els.shirtViewport.dataset.distance = dist;
      els.distanceCaption.textContent = DISTANCE_CAPTIONS[dist] || DISTANCE_CAPTIONS.squint;
    });
  });

  // Search filter in archive
  els.archiveSearchInput.addEventListener('input', e => {
    renderArchive(e.target.value);
  });

  // Buy button
  els.buyShirtBtn.addEventListener('click', () => handleBuyShirt(false));
  const simBtn = document.getElementById('simulateOrderBtn');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      closeSetupModal();
      handleBuyShirt(true);
    });
  }

  // Modal controls
  els.openStripeSetupBtn.addEventListener('click', openSetupModal);
  els.footerSetupBtn.addEventListener('click', openSetupModal);
  els.closeSetupModalBtn.addEventListener('click', closeSetupModal);
  els.cancelSetupBtn.addEventListener('click', closeSetupModal);
  els.setupModal.addEventListener('click', e => {
    if (e.target === els.setupModal) closeSetupModal();
  });
  els.stripeConfigForm.addEventListener('submit', handleSaveStripeConfig);

  els.closeBannerBtn.addEventListener('click', () => {
    els.checkoutBanner.hidden = true;
  });

  // Spacebar shortcut to deal a random shirt
  window.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'BUTTON' && els.setupModal.hidden) {
      e.preventDefault();
      spinRandomShirt();
    } else if (e.key === 'Escape' && !els.setupModal.hidden) {
      closeSetupModal();
    }
  });
}

init();
