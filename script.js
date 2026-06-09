/* ═══════════════════════════════════════════════════════════
   CopymaticAI — script.js
   Shared JS for index.html + dashboard.html
═══════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────
   DARK MODE (shared)
──────────────────────────────────────── */
const isDarkStored = () => localStorage.getItem('theme') !== 'light';

function applyTheme(dark) {
  const body = document.body;
  if (dark) {
    body.classList.remove('light-mode');
    document.documentElement.classList.add('dark');
  } else {
    body.classList.add('light-mode');
    document.documentElement.classList.remove('dark');
  }
  const sunIcons  = document.querySelectorAll('#sun-icon, [id="sun-icon"]');
  const moonIcons = document.querySelectorAll('#moon-icon, [id="moon-icon"]');
  sunIcons.forEach(el  => el.classList.toggle('hidden', !dark));
  moonIcons.forEach(el => el.classList.toggle('hidden', dark));
  const knob = document.getElementById('toggle-knob');
  if (knob) knob.style.transform = dark ? 'translateX(0)' : 'translateX(100%)';
}

function toggleDark() {
  const current = isDarkStored();
  localStorage.setItem('theme', current ? 'light' : 'dark');
  applyTheme(!current);
}

function toggleDarkMode() {
  const current = isDarkStored();
  localStorage.setItem('theme', current ? 'light' : 'dark');
  applyTheme(!current);
}

/* ────────────────────────────────────────
   LANDING PAGE — MOBILE MENU
──────────────────────────────────────── */
function toggleMobileMenu() {
  const menu  = document.getElementById('mobile-menu');
  const open  = document.getElementById('ham-open');
  const close = document.getElementById('ham-close');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  if (open)  open.classList.toggle('hidden', !isOpen);
  if (close) close.classList.toggle('hidden', isOpen);
}

/* ────────────────────────────────────────
   LANDING PAGE — SCROLL REVEAL & NAVBAR
──────────────────────────────────────── */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LOGIC
═══════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────
   STATE (Termasuk Saldo Kuota)
──────────────────────────────────────── */
const state = {
  currentPage: 'generator',
  isGenerating: false,
  selectedContentType: 'caption',
  history: JSON.parse(localStorage.getItem('cmai_history') || '[]'),
  credits: parseInt(localStorage.getItem('cmai_credits') || '30000'), // Saldo awal 30.000 Kata
  dateFilter: 'all'
};

/* ────────────────────────────────────────
   UPDATE 4 QUICK STATS & SALDO UI
──────────────────────────────────────── */
/* ────────────────────────────────────────
   UPDATE 4 QUICK STATS & SALDO UI
──────────────────────────────────────── */
function updateCreditUI() {
  // 1. Update Topbar
  const display = document.getElementById('credit-display');
  if (display) {
    display.textContent = `Saldo: ${state.credits.toLocaleString('id-ID')} Kata`;
  }

  // --- FILTER TANGGAL ---
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const filteredHistory = state.history.filter(item => {
    if (state.dateFilter === 'all') return true;
    
    // item.id adalah timestamp saat konten digenerate
    const itemTime = item.id; 
    
    if (state.dateFilter === 'today') {
      // Cek apakah tanggalnya sama persis dengan hari ini
      return new Date(itemTime).toDateString() === new Date().toDateString();
    }
    if (state.dateFilter === '7days') {
      return (now - itemTime) <= (7 * DAY_MS);
    }
    if (state.dateFilter === '30days') {
      return (now - itemTime) <= (30 * DAY_MS);
    }
    return true;
  });

  // --- MENGHITUNG DATA DARI HISTORY YANG SUDAH DIFILTER ---
  let totalWords = 0;
  let totalContent = filteredHistory.length; // Gunakan array yang sudah difilter

  filteredHistory.forEach(item => {
    const wordsInItem = item.result.split(/\s+/).filter(word => word.length > 0).length;
    totalWords += wordsInItem;
  });

  // --- UPDATE 4 KOTAK METRIK ---
  const statUsed = document.getElementById('stat-used');
  if (statUsed) {
    // Karena saldo dipakai nggak peduli filter tanggal, kita hitung global aja
    const used = 30000 - state.credits; 
    statUsed.textContent = used.toLocaleString('id-ID');
  }

  const statTime = document.getElementById('stat-time');
  if (statTime) {
    if (totalContent === 0) {
      statTime.textContent = '0s';
    } else {
      const avgWordsPerContent = totalWords / totalContent;
      const avgSeconds = 1.2 + (avgWordsPerContent / 50);
      statTime.textContent = avgSeconds.toFixed(1) + 's';
    }
  }

  const statWords = document.getElementById('stat-words');
  if (statWords) {
    statWords.textContent = totalWords.toLocaleString('id-ID');
  }

  const statAvgCost = document.getElementById('stat-avg-cost');
  if (statAvgCost) {
    if (totalContent === 0) {
      statAvgCost.textContent = 'Rp 0';
    } else {
      const avgRupiah = (totalWords * 1.5) / totalContent;
      statAvgCost.textContent = `Rp ${Math.round(avgRupiah)}`;
    }
  }
}

function changeDateRange(range) {
  state.dateFilter = range;
  updateCreditUI(); // Hitung ulang statistik berdasarkan filter baru
}

// Jangan lupa diekspos ke global scope di bagian paling bawah script.js:
// window.changeDateRange = changeDateRange;

/* ────────────────────────────────────────
   CUSTOM AI PROVIDER & MODEL SELECTOR
──────────────────────────────────────── */
const aiModelsData = {
  gemini: [
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Termurah)', cost: 10 },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Cepat)', cost: 50 },
    { value: 'gemini-3-pro', label: 'Gemini 3 Pro (Pintar)', cost: 120 }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cepat)', cost: 30 },
    { value: 'gpt-4o', label: 'GPT-4o (Standar)', cost: 150 },
    { value: 'gpt-5.4', label: 'GPT-5.4 (Paling Pintar)', cost: 250 }
  ],
  grok: [
    { value: 'grok-4.1-fast', label: 'Grok 4.1 Fast (Cepat)', cost: 20 },
    { value: 'grok-code', label: 'Grok Code (Khusus Coding)', cost: 80 },
    { value: 'grok-4', label: 'Grok 4 (Premium)', cost: 200 }
  ]
};

const providerLogos = {
  gemini: `<svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z"/></svg><span>Google Gemini</span>`,
  openai: `<svg class="w-4 h-4" style="color: var(--text-main)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9 9 9 0 0 1-9-9V11a9 9 0 0 1 9-9z"/><path d="M8.5 8.5 12 12l3.5-3.5"/><path d="M12 12v6.5"/><path d="M12 12 8.5 15.5"/><path d="M12 12l3.5 3.5"/></svg><span>OpenAI (ChatGPT)</span>`,
  grok: `<svg class="w-4 h-4" style="color: var(--text-main)" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span>xAI (Grok)</span>`
};

function toggleProviderMenu() {
  const menu = document.getElementById('provider-menu');
  if (menu) menu.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('custom-provider-dropdown');
  const menu = document.getElementById('provider-menu');
  if (dropdown && menu && !dropdown.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

function selectProvider(providerKey) {
  document.getElementById('ai-provider-value').value = providerKey;
  document.getElementById('provider-selected-content').innerHTML = providerLogos[providerKey];
  document.getElementById('provider-menu').classList.add('hidden');
  updateAiModels();
}

function updateAiModels() {
  const providerInput = document.getElementById('ai-provider-value');
  const modelSelect = document.getElementById('ai-model-select');
  
  if (!providerInput || !modelSelect) return;

  const selectedProvider = providerInput.value;
  const models = aiModelsData[selectedProvider] || [];

  modelSelect.innerHTML = '';
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.value;
    option.dataset.cost = model.cost;
    option.textContent = `${model.label} - Est. ${model.cost} kata`;
    modelSelect.appendChild(option);
  });
}

/* ────────────────────────────────────────
   DUMMY AI RESPONSES
──────────────────────────────────────── */
const dummyResponses = {
  caption: [
    `✨ Hari-hari makin manis kalau ada {PRODUCT} di tangan! ☕\n\nSerius deh, sejak kenal produk ini, mood pagi langsung berubah 180°. Dari males-malesan jadi semangat banget ngejalani hari. Siapa yang relate? 🙋‍♀️\n\nYang belum coba, kamu serius nggak tahu ruginya. Rasanya? Next level. Harganya? Friendly banget.\n\nYuk order sekarang sebelum kehabisan! Link di bio ya bestie 🛒✨\n\n#ProductLover #LifestyleIndonesia #Rekomendasi #MustHave #GayaHidupSehat`,
    `🔥 {PRODUCT} — karena kamu layak dapat yang terbaik!\n\nUdah berapa lama kamu settle sama yang biasa-biasa? Saatnya upgrade, bestie! 💅\n\nKenapa harus {PRODUCT}?\n→ Kualitas premium, harga bersahabat ✅\n→ Sudah dipercaya ribuan pelanggan ✅  \n→ Hasil nyata, bukan janji kosong ✅\n\nDM kami atau langsung order via link di bio. Stok terbatas! 🚀\n\n#Premium #Indonesia #Lifestyle #Rekomendasi #BestProduct`,
  ],
  email: [
    `Subject: [PROMO SPESIAL] Hemat 40% untuk {PRODUCT} — Hari Ini Saja! ⚡\n\nHalo [Nama Pelanggan],\n\nKami punya kabar gembira khusus untuk kamu!\n\nMulai hari ini sampai tengah malam nanti, kamu bisa dapatkan {PRODUCT} dengan diskon 40% — promo terbesar yang pernah kami adakan tahun ini.\n\n💡 Kenapa harus sekarang?\nStok promo sangat terbatas. Tahun lalu habis dalam 3 jam. Jangan sampai menyesal!\n\n[KLAIM DISKON 40% SEKARANG →]\n\nSalam hangat,\nTim CopymaticAI`,
  ],
  blog: [
    `# 7 Cara Efektif Meningkatkan Penjualan dengan {PRODUCT}\n\n## Pendahuluan\nDi era digital yang semakin kompetitif, setiap pelaku bisnis perlu menemukan cara cerdas untuk meningkatkan penjualan. {PRODUCT} hadir sebagai solusi yang tidak hanya efektif, tetapi juga efisien secara biaya.\n\n## 1. Kenali Target Audience dengan Tepat\nSebelum mulai menjual, pastikan kamu benar-benar memahami siapa yang akan membeli produkmu.\n\n**Siap untuk memulai? Coba CopymaticAI gratis sekarang →**`,
  ],
  ads: [
    `🎯 HEADLINE: Capai Target Marketing 10× Lebih Cepat\n\nSUBHEADLINE: AI Content Generator #1 untuk Digital Marketer\n\nBODY:\nLelah habiskan waktu berjam-jam nulis konten? Sekarang AI kami bisa generate copy dalam 3 detik.\n\n✅ Lebih dari 2.400 marketer membuktikan\n✅ Generate unlimited konten berkualitas\n\nCTA PRIMARY: Coba Gratis Sekarang →`,
  ],
  thread: [
    `🧵 THREAD: Kenapa konten marketing kamu nggak converting? (A thread)\n\n1/ Setelah analisis 500+ campaign digital marketing Indonesia, ada 5 pola yang paling sering bikin konten nggak perform. Let me break it down 👇\n\n2/ MASALAH #1: Terlalu fokus pada fitur, bukan manfaat. Orang beli manfaat, bukan spesifikasi teknis.\n\n3/ Solusi: Pake AI CopymaticAI untuk bantu memikirkan angle manfaat yang tepat. Kalau thread ini bermanfaat, RT/share ya! Follow untuk tips marketing lainnya 🙌`,
  ],
};

function selectContentType(btn, type) {
  state.selectedContentType = type;
  const all = document.querySelectorAll('#content-type-group .tab-btn');
  all.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function handlePromptInput(el) {
  const counter = document.getElementById('char-counter');
  if (!counter) return;
  const len = el.value.length;
  const max = parseInt(el.getAttribute('maxlength') || 500);
  counter.textContent = `${len} / ${max}`;
  counter.classList.remove('warning', 'danger');
  if (len > max * 0.9) counter.classList.add('danger');
  else if (len > max * 0.75) counter.classList.add('warning');

  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 280) + 'px';

  if (len > 0) {
    const err = document.getElementById('prompt-error');
    if (err) err.classList.add('hidden');
    el.classList.remove('error');
  }
}

function extractProductHint(prompt) {
  const words = prompt.split(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if ((w === 'untuk' || w === 'produk' || w === 'tentang') && words[i+1]) {
      return words[i+1].replace(/[,.]/g,'');
    }
  }
  return words.slice(0,2).join(' ') || 'produk kami';
}

function setGeneratingState(loading) {
  const btn     = document.getElementById('generate-btn');
  const empty   = document.getElementById('output-empty');
  const loadEl  = document.getElementById('output-loading');
  const result  = document.getElementById('output-result');
  const actions = document.getElementById('output-actions');
  const feedback = document.getElementById('output-feedback');

  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div><span>Generating...</span>`;
    empty?.classList.add('hidden');
    loadEl?.classList.remove('hidden');
    result?.classList.remove('visible');
    result?.classList.add('hidden');
    if (result) result.style.display = 'none';
    if (actions) actions.classList.add('hidden');
    if (feedback) feedback.classList.add('hidden');
  } else {
    btn.disabled = false;
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Generate Konten`;
    loadEl?.classList.add('hidden');
  }
}

/* ────────────────────────────────────────
   MAIN GENERATE FUNCTION (DENGAN CEK SALDO)
──────────────────────────────────────── */
function generateContent() {
  if (state.isGenerating) return;

  const promptEl = document.getElementById('prompt-input');
  const toneEl   = document.getElementById('tone-select');
  const errEl    = document.getElementById('prompt-error');

  if (!promptEl) return;
  const prompt = promptEl.value.trim();

  // Validasi Prompt Kosong
  if (!prompt) {
    promptEl.classList.add('error');
    errEl?.classList.remove('hidden');
    promptEl.focus();
    promptEl.style.animation = 'none';
    promptEl.offsetHeight; 
    promptEl.style.animation = 'shakeX 0.4s ease';
    setTimeout(() => { promptEl.style.animation = ''; }, 400);
    return;
  }

  // --- CEK SALDO KUOTA KATA ---
  const modelEl = document.getElementById('ai-model-select');
  const cost = modelEl && modelEl.options[modelEl.selectedIndex] ? parseInt(modelEl.options[modelEl.selectedIndex].dataset.cost) : 50;

  if (state.credits < cost) {
    showToast('❌ Saldo kuota kata tidak cukup! Silakan Top Up.');
    setGeneratingState(false);
    return;
  }

  state.isGenerating = true;
  const startTime = Date.now();
  setGeneratingState(true);

  const type = state.selectedContentType;
  const responses = dummyResponses[type] || dummyResponses['caption'];
  const raw = responses[Math.floor(Math.random() * responses.length)];
  const productName = extractProductHint(prompt);
  const result = raw.replaceAll('{PRODUCT}', productName);

  const loadingMsgs = [
    'AI sedang memahami prompt...',
    'Menganalisis tone dan konteks...',
    'Menulis konten terbaik...',
    'Hampir selesai...',
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    const el = document.getElementById('loading-text');
    if (el && msgIdx < loadingMsgs.length) el.textContent = loadingMsgs[msgIdx++];
  }, 450);

  const delay = 1500 + Math.random() * 700;

  setTimeout(() => {
    clearInterval(msgInterval);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    showOutput(result, elapsed, type);
    saveToHistory(prompt, result, type, toneEl?.value || 'casual');
    
    // POTONG SALDO & UPDATE STATS
    state.isGenerating = false;
    state.credits -= cost;
    localStorage.setItem('cmai_credits', state.credits);
    updateCreditUI();
    
    setGeneratingState(false);
  }, delay);
}

const typeLabelMap = { caption: '📱 Caption', email: '📧 Email', blog: '📝 Blog', ads: '📣 Ad Copy', thread: '🧵 Thread' };

function showOutput(text, elapsed, type) {
  const resultEl  = document.getElementById('output-result');
  const textEl    = document.getElementById('output-text');
  const metaEl    = document.getElementById('output-meta');
  const wordsEl   = document.getElementById('output-words');
  const timeEl    = document.getElementById('output-time');
  const typeLabel = document.getElementById('output-type-label');
  const actions   = document.getElementById('output-actions');
  const feedback  = document.getElementById('output-feedback');

  if (!resultEl || !textEl) return;

  const words = text.split(/\s+/).length;
  if (wordsEl)   wordsEl.textContent = `~${words} kata`;
  if (timeEl)    timeEl.textContent  = `⚡ ${elapsed}s`;
  if (typeLabel) typeLabel.textContent = typeLabelMap[type] || '—';

  resultEl.style.display = 'block';
  resultEl.classList.add('visible');
  textEl.textContent = '';
  
  const chars = text.split('');
  let i = 0;
  const speed = Math.max(4, Math.min(12, 1200 / chars.length));

  function typeNext() {
    if (i < chars.length) {
      textEl.textContent += chars[i++];
      resultEl.scrollTop = resultEl.scrollHeight;
      setTimeout(typeNext, speed);
    } else {
      if (actions)  actions.classList.remove('hidden');
      if (feedback) feedback.classList.remove('hidden');
    }
  }
  typeNext();
  window._currentOutput = text;
}

function copyOutput() {
  const text = window._currentOutput;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Disalin ke clipboard! ✅');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Disalin ke clipboard! ✅');
  });
}

function regenerate() { generateContent(); }

function clearAll() {
  const promptEl = document.getElementById('prompt-input');
  const toneEl   = document.getElementById('tone-select');
  const audienceEl = document.getElementById('audience-input');
  const resultEl = document.getElementById('output-result');
  const emptyEl  = document.getElementById('output-empty');
  const actions  = document.getElementById('output-actions');
  const feedback = document.getElementById('output-feedback');

  if (promptEl)   { promptEl.value = ''; promptEl.style.height = ''; }
  if (toneEl)     toneEl.selectedIndex = 0;
  if (audienceEl) audienceEl.value = '';
  if (resultEl)   { resultEl.style.display = 'none'; resultEl.classList.remove('visible'); }
  if (emptyEl)    emptyEl.classList.remove('hidden');
  if (actions)    actions.classList.add('hidden');
  if (feedback)   feedback.classList.add('hidden');

  const counter = document.getElementById('char-counter');
  if (counter) counter.textContent = '0 / 500';
  window._currentOutput = '';
}

function showToast(msg) {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast) return;
  if (toastMsg) toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function rateFeedback(type) {
  const msg = type === 'up'
    ? 'Terima kasih! Feedback kamu membantu AI berkembang 🚀'
    : 'Maaf kurang memuaskan. Coba regenerate atau ubah prompt ya! 💪';
  showToast(msg);
  const feedback = document.getElementById('output-feedback');
  if (feedback) feedback.classList.add('hidden');
}

/* ────────────────────────────────────────
   HISTORY
──────────────────────────────────────── */
function saveToHistory(prompt, result, type, tone) {
  const item = {
    id: Date.now(),
    prompt: prompt.slice(0, 80) + (prompt.length > 80 ? '...' : ''),
    result,
    type,
    tone,
    date: new Date().toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }),
  };
  state.history.unshift(item);
  if (state.history.length > 50) state.history = state.history.slice(0, 50);
  localStorage.setItem('cmai_history', JSON.stringify(state.history));
}

function renderHistory() {
  const list  = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!list) return;

  if (state.history.length === 0) {
    list.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');
  const typeEmojiMap = { caption:'📱', email:'📧', blog:'📝', ads:'📣', thread:'🧵' };
  
  list.innerHTML = state.history.map(item => `
    <div class="history-item" onclick="loadFromHistory(${item.id})">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style="background: rgba(99,102,241,0.1)">
        ${typeEmojiMap[item.type] || '📄'}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-500 truncate" style="color: var(--text-main)">${escHtml(item.prompt)}</div>
        <div class="text-xs mt-0.5" style="color: var(--text-muted)">${item.date} · ${item.tone} · ${typeLabelMap[item.type] || item.type}</div>
      </div>
      <button onclick="event.stopPropagation(); copyHistoryItem(${item.id})" class="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-muted)">Copy</button>
    </div>
  `).join('');
}

function loadFromHistory(id) {
  const item = state.history.find(h => h.id === id);
  if (!item) return;
  switchPage('generator');
  setTimeout(() => {
    const promptEl = document.getElementById('prompt-input');
    if (promptEl) {
      promptEl.value = item.prompt;
      handlePromptInput(promptEl);
    }
    window._currentOutput = item.result;
    showOutput(item.result, '—', item.type);
  }, 100);
}

function copyHistoryItem(id) {
  const item = state.history.find(h => h.id === id);
  if (!item) return;
  navigator.clipboard.writeText(item.result).catch(() => {});
  showToast('Disalin! ✅');
}

function escHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ────────────────────────────────────────
   TEMPLATES & PAGE SWITCHER
──────────────────────────────────────── */
const templateData = [
  { id: 'instagram-product', emoji:'📸', title:'Caption Produk Instagram', desc:'Caption dengan emoji, hashtag, dan CTA yang menarik.', prompt:'Buat caption Instagram untuk produk [NAMA PRODUK]...' },
  { id: 'email-promo', emoji:'💌', title:'Email Promosi Flash Sale', desc:'Email marketing dengan urgency dan CTA kuat.', prompt:'Buat email marketing untuk flash sale...' },
];

function renderTemplates() {
  const container = document.querySelector('#page-templates .grid');
  if (!container) return;
  container.innerHTML = templateData.map(t => `
    <button onclick="useTemplate('${t.id}')" class="card p-5 text-left hover:border-brand-500/30 transition-all group">
      <div class="text-3xl mb-3">${t.emoji}</div>
      <div class="font-display text-sm font-600 mb-1.5" style="color: var(--text-main)">${t.title}</div>
      <div class="text-xs leading-relaxed" style="color: var(--text-muted)">${t.desc}</div>
      <div class="mt-4 text-xs font-500" style="color: #818cf8">Gunakan template →</div>
    </button>
  `).join('');
}

function useTemplate(id) {
  const tpl = templateData.find(t => t.id === id);
  if (!tpl) return;
  switchPage('generator');
  setTimeout(() => {
    const promptEl = document.getElementById('prompt-input');
    if (promptEl) { promptEl.value = tpl.prompt; handlePromptInput(promptEl); promptEl.focus(); promptEl.select(); }
  }, 150);
}

const pageIds = ['generator', 'analytics', 'history', 'templates', 'settings', 'swipe'];
const pageTitles = { generator: 'Content Generator', analytics: 'Analytics', history: 'History', templates: 'Templates', settings: 'Settings', swipe: 'Koleksi Hook (Free)' };

function switchPage(id) {
  if (!pageIds.includes(id)) return;
  pageIds.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.add('hidden');
    const nav = document.getElementById(`nav-${p}`);
    if (nav) nav.classList.remove('active');
  });

  const target = document.getElementById(`page-${id}`);
  if (target) {
    target.classList.remove('hidden');
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = 'fadeIn 0.3s ease';
  }

  const nav = document.getElementById(`nav-${id}`);
  if (nav) nav.classList.add('active');

  const bc = document.getElementById('breadcrumb-label');
  if (bc) bc.textContent = pageTitles[id] || id;

  state.currentPage = id;
  if (id === 'history') renderHistory();
  if (id === 'templates') renderTemplates();
  closeMobileSidebar();
}

function openMobileSidebar() {
  document.getElementById('sidebar')?.classList.add('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
  document.body.style.overflow = '';
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (state.currentPage === 'generator') generateContent(); }
    if (e.key === 'Escape') closeMobileSidebar();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); showToast('Shortcut: Ctrl+Enter untuk Generate ⚡'); }
  });
}

function injectShakeKeyframe() {
  const style = document.createElement('style');
  style.textContent = `@keyframes shakeX { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }`;
  document.head.appendChild(style);
}

/* ────────────────────────────────────────
   MAXIMIZE / MINIMIZE OUTPUT PANEL (MORPHING MODE)
──────────────────────────────────────── */
function toggleMaximize() {
  const panel = document.getElementById('output-panel');
  const overlay = document.getElementById('modal-overlay');
  const iconMax = document.getElementById('icon-maximize');
  const iconMin = document.getElementById('icon-minimize');

  if (!panel) return;

  const isMaximized = panel.classList.contains('output-morph');

  if (isMaximized) {
    // === PROSES MENCIUT (MINIMIZE) ===
    panel.classList.remove('is-open');
    
    // Kembalikan ke posisi & ukuran asal yang kita simpan di dataset
    panel.style.top = `${panel.dataset.origTop}px`;
    panel.style.left = `${panel.dataset.origLeft}px`;
    panel.style.width = `${panel.dataset.origWidth}px`;
    panel.style.height = `${panel.dataset.origHeight}px`;

    if(overlay) overlay.classList.remove('show');

    // Langsung ubah ikon agar responsif
    if(iconMax) iconMax.classList.remove('hidden');
    if(iconMin) iconMin.classList.add('hidden');

    // Hapus class morph & style setelah transisi selesai
    setTimeout(() => {
      panel.classList.remove('output-morph');
      panel.removeAttribute('style');
      
      // Hapus placeholder bayangan
      const placeholder = document.getElementById('panel-placeholder');
      if(placeholder) placeholder.remove();
      
      document.body.style.overflow = '';
    }, 400); // 400ms sesuai durasi transisi CSS

  } else {
    // === PROSES DITARIK (MAXIMIZE) ===
    const rect = panel.getBoundingClientRect();

    // Simpan posisi awal di dataset agar tidak hilang
    panel.dataset.origTop = rect.top;
    panel.dataset.origLeft = rect.left;
    panel.dataset.origWidth = rect.width;
    panel.dataset.origHeight = rect.height;

    // Buat elemen placeholder agar layout di belakang tidak "runtuh/geser"
    const placeholder = document.createElement('div');
    placeholder.id = 'panel-placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    panel.parentElement.insertBefore(placeholder, panel);

    // Set posisi start inline
    panel.style.top = `${rect.top}px`;
    panel.style.left = `${rect.left}px`;
    panel.style.width = `${rect.width}px`;
    panel.style.height = `${rect.height}px`;
    
    panel.classList.add('output-morph');
    if(overlay) overlay.classList.add('show');

    // Ubah ikon
    if(iconMax) iconMax.classList.add('hidden');
    if(iconMin) iconMin.classList.remove('hidden');

    // Gunakan requestAnimationFrame ganda untuk trigger animasi paling mulus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add('is-open');
      });
    });

    document.body.style.overflow = 'hidden';
  }
}

/* ────────────────────────────────────────
   INIT
──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(isDarkStored());
  injectShakeKeyframe();

  const isDashboard = document.getElementById('sidebar') !== null;
  const isLanding   = document.getElementById('hero') !== null;

  if (isLanding) { initScrollReveal(); initNavbarScroll(); }

  if (isDashboard) {
    initKeyboardShortcuts();
    renderHistory();
    renderTemplates();
    updateCreditUI();
    updateAiModels(); // Inisiasi dropdown custom AI pertama kali
    
    setTimeout(() => { if (document.hasFocus()) showToast('💡 Tip: Tekan Ctrl+Enter untuk generate cepat!'); }, 3000);
  }
});

/* Expose for HTML inline calls */
window.toggleDark         = toggleDark;
window.toggleMobileMenu   = toggleMobileMenu;
window.toggleDarkMode     = toggleDarkMode;
window.selectContentType  = selectContentType;
window.handlePromptInput  = handlePromptInput;
window.generateContent    = generateContent;
window.copyOutput         = copyOutput;
window.regenerate         = regenerate;
window.clearAll           = clearAll;
window.rateFeedback       = rateFeedback;
window.switchPage         = switchPage;
window.openMobileSidebar  = openMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.useTemplate        = useTemplate;
window.loadFromHistory    = loadFromHistory;
window.copyHistoryItem    = copyHistoryItem;
window.toggleProviderMenu = toggleProviderMenu;
window.selectProvider     = selectProvider;
window.updateAiModels     = updateAiModels;