/*****YTPRO & YTRU DOWN INTEGRATED*******
Author: Prateek Chaubey & Tarek Hossain
Version: 4.2.0 (Auto-Process Sheet Edition)
Last Updated On: 2026
*/

window.ytproSabrDownload = async function() {
  // ─── CONFIGURATION & LOCAL STORAGE ───
  let CONFIG = {
    apiKey: localStorage.getItem('yt_api_key') || 'dfcb6d76f2f6a9894gjkege8a4ab232222',
    proxyUrl: localStorage.getItem('yt_proxy_url') || 'https://api.codetabs.com/v1/proxy?quest=',
    defaultVideo: localStorage.getItem('yt_default_video') || '720',
    defaultAudio: localStorage.getItem('yt_default_audio') || 'mp3',
    activeType: localStorage.getItem('yt_active_type') || 'video',
    selectedVal: '720'
  };
  CONFIG.selectedVal = CONFIG.activeType === 'video' ? CONFIG.defaultVideo : CONFIG.defaultAudio;

  const VIDEO_FORMATS = { '144':'MP4 (144p)', '240':'MP4 (240p)', '360':'MP4 (360p)', '480':'MP4 (480p)', '720':'MP4 (720p)', '1080':'MP4 (1080p)', '1440':'MP4 (1440p)', '4k':'WEBM (4K)', '8k':'WEBM (8K)' };
  const AUDIO_FORMATS = ['mp3','m4a','webm','aac','flac','opus','ogg','wav'];
  const YT_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|channel\/)|youtu\.be\/)?([a-zA-Z0-9_-]{11})/i;
  
  let itemCounter = 0;
  window.DOWNLOAD_METADATA_STORE = {};

  // Get Current Video ID from YouTube Context
  let currentVideoId = "";
  if (window.location.pathname.indexOf("shorts") > -1) {
    currentVideoId = window.location.pathname.substr(8, window.location.pathname.length);
  } else {
    currentVideoId = new URLSearchParams(window.location.search).get("v");
  }

  // Inject Dependencies (Tailwind, FontAwesome, Fonts) into Head if not present
  if (!document.getElementById('ytru-tailwind')) {
    const tw = document.createElement('script'); tw.id = 'ytru-tailwind'; tw.src = 'https://cdn.tailwindcss.com'; document.head.appendChild(tw);
    const fa = document.createElement('link'); fa.id = 'ytru-fa'; fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'; document.head.appendChild(fa);
    const font = document.createElement('link'); font.id = 'ytru-font'; font.rel = 'stylesheet'; font.href = 'https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css'; document.head.appendChild(font);
  }

  // Handle Dynamic Re-opening safely without removing layout states
  let sheetContainer = document.getElementById('ytpro-sabr-sheet-container');
  if (sheetContainer) {
    sheetContainer.style.display = 'flex';
    // Trigger Auto Process on re-open with current context
    setTimeout(() => { triggerAutoProcess(); }, 300);
    return;
  }

  // ─── CREATE INNERTUBE BOTTOM SHEET DIALOG (FULL WIDTH & EXPANDED HEIGHT) ───
  sheetContainer = document.createElement('div');
  sheetContainer.id = 'ytpro-sabr-sheet-container';
  Object.assign(sheetContainer.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '999999',
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  });

  // Custom Styles Injection
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes shimmerAnim { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .shimmer-box { background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%); background-size: 200% 100%; animation: shimmerAnim 1.5s infinite; border-radius: 0.5rem; }
    .progress-transition { transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .dropdown-menu { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: bottom center; }
    .dropdown-menu.hidden { transform: scale(0.95); opacity: 0; pointer-events: none; visibility: hidden; }
    .dropdown-menu.visible { transform: scale(1); opacity: 1; pointer-events: auto; visibility: visible; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .fade-scroll-mask {
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
    }
  `;
  sheetContainer.appendChild(styleTag);

  // Sheet Inner Content HTML Structure (Full Width & Expanded Height Area)
  sheetContainer.innerHTML += `
    <div id="toastContainer" class="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100000] flex flex-col gap-2 pointer-events-none w-11/12 max-w-sm"></div>

    <div class="w-full bg-gray-950 border-t border-gray-800 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto hide-scrollbar relative shadow-2xl flex flex-col justify-between">
      
      <div>
        <div class="flex items-center justify-between border-b border-gray-900 pb-3 mb-2">
          <button id="closeSheetBtn" class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 px-3 py-2 rounded-xl border border-gray-800 transition-colors">
            <i class="fa-solid fa-arrow-down-long"></i> Close
          </button>
          <h3 class="text-sm font-bold tracking-wide text-gray-300 uppercase flex items-center gap-1.5"><i class="fa-solid fa-cloud-arrow-down text-blue-500"></i> YTRU DOWN</h3>
          <button id="settingsBtn" class="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors text-gray-400 hover:text-white">
            <i class="fa-solid fa-gear text-sm"></i>
          </button>
        </div>

        <input id="urlInput" type="hidden">

        <div class="space-y-2">
          <div class="relative w-full">
            <button id="formatTrigger" class="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 hover:border-gray-700 transition-colors">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-compact-disc text-blue-500 animate-spin" style="animation-duration: 4s;"></i>
                <span id="selectedFormatLabel">Select Format / Quality</span>
              </span>
              <i class="fa-solid fa-chevron-down text-xs ml-2 opacity-60"></i>
            </button>
            <div id="formatDropdown" class="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden dropdown-menu hidden z-[1000] max-h-56 overflow-y-auto hide-scrollbar"></div>
          </div>
        </div>

        <div id="queueList" class="space-y-3 max-h-[50vh] overflow-y-auto hide-scrollbar fade-scroll-mask pt-3 pb-2">
          <div id="emptyState" class="flex flex-col items-center justify-center py-16 text-gray-600 text-xs select-none">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-3 text-blue-500"></i>
            <p>Fetching download links automatically...</p>
          </div>
        </div>
      </div>

    </div>

    <div id="settingsOverlay" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] hidden transition-opacity opacity-0 flex items-end justify-center">
      <div id="settingsSheet" class="w-full bg-gray-900 border-t border-gray-800 rounded-t-3xl p-5 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto hide-scrollbar">
        <div class="flex items-center justify-between border-b border-gray-800 pb-2">
          <h2 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-sliders text-blue-500"></i> Configuration</h2>
          <button id="closeSettings" class="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"><i class="fa-solid fa-xmark text-sm"></i></button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 mb-1">API Key Endpoint</label>
            <div class="flex gap-2">
              <input id="apiKeyInput" type="text" class="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:border-blue-500">
              <button id="resetApiBtn" class="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl text-xs text-gray-300 border border-gray-700">Reset</button>
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 mb-1">CORS Proxy URL</label>
            <input id="proxyInput" type="text" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:border-blue-500" placeholder="https://api.codetabs.com/v1/proxy?quest=">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-gray-400 mb-2">Default Format Type Priority</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-xl p-2.5 cursor-pointer hover:border-gray-700 select-none">
                <input type="radio" name="formatPriority" value="video" id="priorityVideo" class="accent-blue-500 h-4 w-4">
                <span class="text-xs text-gray-300 font-medium">Video Priority</span>
              </label>
              <label class="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-xl p-2.5 cursor-pointer hover:border-gray-700 select-none">
                <input type="radio" name="formatPriority" value="audio" id="priorityAudio" class="accent-blue-500 h-4 w-4">
                <span class="text-xs text-gray-300 font-medium">Audio Priority</span>
              </label>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-semibold text-gray-400 mb-1">Default Video Quality</label>
              <select id="defaultVideoSelect" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-blue-500"></select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-gray-400 mb-1">Default Audio Format</label>
              <select id="defaultAudioSelect" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-blue-500"></select>
            </div>
          </div>
          <button id="saveSettings" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 mt-1">Save & Apply</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(sheetContainer);

  // Core References Hooks
  const urlInput = document.getElementById('urlInput');
  const formatTrigger = document.getElementById('formatTrigger');
  const formatDropdown = document.getElementById('formatDropdown');
  const selectedFormatLabel = document.getElementById('selectedFormatLabel');
  const queueList = document.getElementById('queueList');
  const emptyState = document.getElementById('emptyState');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const closeSettings = document.getElementById('closeSettings');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const proxyInput = document.getElementById('proxyInput');
  const resetApiBtn = document.getElementById('resetApiBtn');
  const defaultVideoSelect = document.getElementById('defaultVideoSelect');
  const defaultAudioSelect = document.getElementById('defaultAudioSelect');
  const saveSettings = document.getElementById('saveSettings');
  const toastContainer = document.getElementById('toastContainer');
  const priorityVideo = document.getElementById('priorityVideo');
  const priorityAudio = document.getElementById('priorityAudio');
  const closeSheetBtn = document.getElementById('closeSheetBtn');

  // Silently load current YouTube context URL into hidden element
  if (currentVideoId) {
    urlInput.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
  }

  // Toast Alerts Setup
  function showToast(message, isError = true) {
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border transition-all duration-300 opacity-0 translate-y-2 pointer-events-auto ${
      isError ? 'bg-red-950/80 border-red-800 text-red-200' : 'bg-gray-900/90 border-gray-800 text-green-400'
    }`;
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-triangle-exclamation text-red-500' : 'fa-circle-check'}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('opacity-0', 'translate-y-2'));
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-8px]');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Deep-linked Native Download Trigger Fix (Bypasses Sandbox Blocks)
  function triggerDirectDownload(downloadUrl) {
    if (downloadUrl && downloadUrl !== '#') {
      showToast("Download started!", false);
      
      // Method A: Direct pop window hook
      const win = window.open(downloadUrl, '_blank');
      if (!win || win.closed || typeof win.closed == 'undefined') {
        // Method B: Hidden global download iframe fallback if popup blocker intercepts
        let dlFrame = document.getElementById('ytru-download-frame');
        if (!dlFrame) {
          dlFrame = document.createElement('iframe');
          dlFrame.id = 'ytru-download-frame';
          dlFrame.style.display = 'none';
          document.body.appendChild(dlFrame);
        }
        dlFrame.src = downloadUrl;
      }
    } else {
      showToast("Download link unavailable", true);
    }
  }

  function populateDropdowns() {
    let mainHTML = '';
    Object.entries(VIDEO_FORMATS).forEach(([k, v]) => {
      mainHTML += `<div class="px-4 py-2.5 hover:bg-gray-800 cursor-pointer text-xs flex justify-between items-center format-opt" data-type="video" data-val="${k}"><span>${v}</span><i class="fa-solid fa-video text-gray-600 text-[10px]"></i></div>`;
    });
    mainHTML += '<div class="border-t border-gray-800 my-1"></div>';
    AUDIO_FORMATS.forEach(k => {
      mainHTML += `<div class="px-4 py-2.5 hover:bg-gray-800 cursor-pointer text-xs flex justify-between items-center format-opt" data-type="audio" data-val="${k}"><span>Audio (${k.toUpperCase()})</span><i class="fa-solid fa-music text-gray-600 text-[10px]"></i></div>`;
    });
    formatDropdown.innerHTML = mainHTML;

    let vidOpts = '';
    Object.entries(VIDEO_FORMATS).forEach(([k, v]) => vidOpts += `<option value="${k}">${v}</option>`);
    defaultVideoSelect.innerHTML = vidOpts;
    
    let audOpts = '';
    AUDIO_FORMATS.forEach(k => audOpts += `<option value="${k}">${k.toUpperCase()}</option>`);
    defaultAudioSelect.innerHTML = audOpts;
  }

  function updateFormatDisplay() {
    const label = CONFIG.activeType === 'video' ? VIDEO_FORMATS[CONFIG.selectedVal] : `Audio (${CONFIG.selectedVal.toUpperCase()})`;
    selectedFormatLabel.textContent = label;
  }

  function applyUIState() {
    apiKeyInput.value = CONFIG.apiKey;
    proxyInput.value = CONFIG.proxyUrl;
    defaultVideoSelect.value = CONFIG.defaultVideo;
    defaultAudioSelect.value = CONFIG.defaultAudio;
    if (CONFIG.activeType === 'video') {
      priorityVideo.checked = true;
    } else {
      priorityAudio.checked = true;
    }
  }

  // UI Event Bindings
  formatTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (formatDropdown.classList.contains('hidden')) {
      formatDropdown.classList.remove('hidden');
      formatDropdown.classList.add('visible');
    } else {
      formatDropdown.classList.add('hidden');
      formatDropdown.classList.remove('visible');
    }
  });

  formatDropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('.format-opt');
    if (opt) {
      CONFIG.activeType = opt.dataset.type;
      CONFIG.selectedVal = opt.dataset.val;
      updateFormatDisplay();
      formatDropdown.classList.add('hidden');
      formatDropdown.classList.remove('visible');
      
      // Auto trigger conversion loop on quality switch instantly
      triggerAutoProcess();
    }
  });

  document.addEventListener('click', (e) => {
    if (!formatTrigger.contains(e.target) && !formatDropdown.contains(e.target)) {
      formatDropdown.classList.add('hidden');
      formatDropdown.classList.remove('visible');
    }
  });

  // Soft-close system instead of completely wiping layout instances from DOM
  closeSheetBtn.addEventListener('click', () => {
    sheetContainer.style.display = 'none';
  });
  
  settingsBtn.addEventListener('click', () => {
    settingsOverlay.classList.remove('hidden');
    requestAnimationFrame(() => settingsOverlay.classList.remove('opacity-0'));
  });

  const closeSettingsSheet = () => {
    settingsOverlay.classList.add('opacity-0');
    setTimeout(() => settingsOverlay.classList.add('hidden'), 200);
  };
  closeSettings.addEventListener('click', closeSettingsSheet);

  resetApiBtn.addEventListener('click', () => {
    CONFIG.apiKey = 'dfcb6d76f2f6a9894gjkege8a4ab232222';
    CONFIG.proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
    CONFIG.defaultVideo = '720';
    CONFIG.defaultAudio = 'mp3';
    CONFIG.activeType = 'video';
    localStorage.setItem('yt_api_key', CONFIG.apiKey);
    localStorage.setItem('yt_proxy_url', CONFIG.proxyUrl);
    localStorage.setItem('yt_default_video', CONFIG.defaultVideo);
    localStorage.setItem('yt_default_audio', CONFIG.defaultAudio);
    localStorage.setItem('yt_active_type', CONFIG.activeType);
    applyUIState();
    CONFIG.selectedVal = CONFIG.defaultVideo;
    updateFormatDisplay();
    showToast("Configurations reset to defaults", false);
  });

  saveSettings.addEventListener('click', () => {
    CONFIG.apiKey = apiKeyInput.value.trim() || 'dfcb6d76f2f6a9894gjkege8a4ab232222';
    CONFIG.proxyUrl = proxyInput.value.trim() || 'https://api.codetabs.com/v1/proxy?quest=';
    CONFIG.defaultVideo = defaultVideoSelect.value;
    CONFIG.defaultAudio = defaultAudioSelect.value;
    CONFIG.activeType = priorityVideo.checked ? 'video' : 'audio';
    localStorage.setItem('yt_api_key', CONFIG.apiKey);
    localStorage.setItem('yt_proxy_url', CONFIG.proxyUrl);
    localStorage.setItem('yt_default_video', CONFIG.defaultVideo);
    localStorage.setItem('yt_default_audio', CONFIG.defaultAudio);
    localStorage.setItem('yt_active_type', CONFIG.activeType);
    CONFIG.selectedVal = CONFIG.activeType === 'video' ? CONFIG.defaultVideo : CONFIG.defaultAudio;
    updateFormatDisplay();
    closeSettingsSheet();
    showToast("Settings saved successfully!", false);
    
    // Auto-Restart stream process using new saved configs instantly
    triggerAutoProcess();
  });

  // ─── INSTANT AUTO-PROCESS CONTROLLER ───
  async function triggerAutoProcess() {
    const match = urlInput.value.match(YT_REGEX);
    if (!match) {
      showToast("No video target resolved in background context.");
      return;
    }
    const vidId = match[1];
    const fmt = CONFIG.selectedVal;
    
    // Show Loading inside List State
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-3 text-blue-500"></i>
      <p>Requesting ${CONFIG.activeType.toUpperCase()} - ${fmt.toUpperCase()} conversion pipeline...</p>
    `;

    try {
      const targetUrl = `https://youtu.be/${vidId}?si=mn7eT9qCTNHW149_`;
      const reqUrl = `https://p.savenow.to/ajax/download.php?copyright=0&format=${fmt}&url=${encodeURIComponent(targetUrl)}&api=${encodeURIComponent(CONFIG.apiKey)}`;
      const finalApiUrl = CONFIG.proxyUrl + encodeURIComponent(reqUrl);
      
      const res = await fetch(finalApiUrl, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();

      if (data.success) {
        const itemId = createItem(data.id, data.title, data.info?.image, fmt, CONFIG.activeType);
        startPoll(data.id, data.progress_url, fmt, itemId);
      } else {
        emptyState.innerHTML = `<i class="fa-solid fa-circle-exclamation text-xl text-red-500 mb-1"></i> <p class="text-red-400">API rejected conversion request.</p>`;
        showToast("API token validation rejected.", true);
      }
    } catch (err) {
      console.error(err);
      emptyState.innerHTML = `<i class="fa-solid fa-wifi text-xl text-gray-600 mb-1"></i> <p>Network gateway timeout.</p>`;
      showToast("Proxy Gateway connection dropped.", true);
    }
  }

  function createItem(taskId, title, thumbUrl, fmt, type) {
    emptyState.style.display = 'none';
    const itemId = `q-${itemCounter++}`;
    
    const rawLabel = type === 'video' ? VIDEO_FORMATS[fmt].split(' ')[1].replace('(','').replace(')','') : fmt.toUpperCase();
    const formatLabel = type === 'video' ? `VIDEO - ${rawLabel}` : `AUDIO - ${rawLabel}`;
    
    const el = document.createElement('div');
    el.id = itemId;
    el.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 items-center transition-all duration-300';
    el.innerHTML = `
      <div class="w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-800 shimmer-box relative shadow-inner" id="${itemId}-thumb">
        <img src="${thumbUrl}" class="w-full h-full object-cover hidden relative z-10" alt="thumb" id="${itemId}-img" onload="this.classList.remove('hidden'); document.getElementById('${itemId}-thumb').classList.remove('shimmer-box');">
      </div>
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <div class="h-3.5 w-11/12 rounded shimmer-box mb-1.5" id="${itemId}-ttl-sh"></div>
        <div class="flex items-center gap-2 mb-1" id="${itemId}-combo-row">
          <span class="bg-blue-600/20 border border-blue-500/20 text-blue-400 font-bold text-[8px] px-1.5 py-0.5 rounded tracking-wider uppercase">${formatLabel}</span>
          <button onclick="document.getElementById('${itemId}').remove(); if(document.getElementById('queueList').querySelectorAll('[id^=\\'q-\\']').length === 0) { document.getElementById('emptyState').style.display = 'flex'; document.getElementById('emptyState').innerHTML = '<p>Queue empty</p>'; }" class="text-gray-500 hover:text-red-400 transition-colors p-0.5">
            <i class="fa-solid fa-trash-can text-[9px]"></i>
          </button>
        </div>
        <div class="w-full bg-gray-800 rounded-full h-1 mt-1 overflow-hidden" id="${itemId}-bar-frame">
          <div class="bg-blue-500 h-1 rounded-full progress-transition w-0" id="${itemId}-bar"></div>
        </div>
        <div class="flex justify-between items-center mt-1" id="${itemId}-stat-frame">
          <span class="text-[9px] text-gray-400 font-medium tracking-wide uppercase" id="${itemId}-stat">INITIALIZING...</span>
          <span class="text-[9px] font-mono text-blue-400 font-semibold" id="${itemId}-pct">0%</span>
        </div>
      </div>
    `;
    queueList.prepend(el);
    window.DOWNLOAD_METADATA_STORE[itemId] = { title, thumb: thumbUrl };
    queueList.scrollTop = 0;
    return itemId;
  }

  function startPoll(taskId, progUrl, fmt, itemId) {
    const intv = setInterval(async () => {
      try {
        const proxyProgressUrl = CONFIG.proxyUrl + encodeURIComponent(progUrl);
        const res = await fetch(proxyProgressUrl);
        const d = await res.json();
        
        const pct = Math.min(Math.round((d.progress / 1000) * 100), 100);
        
        const bar = document.getElementById(`${itemId}-bar`);
        const pctEl = document.getElementById(`${itemId}-pct`);
        const statEl = document.getElementById(`${itemId}-stat`);
        
        if (bar) bar.style.width = `${pct}%`;
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (statEl && d.text) statEl.textContent = d.text.toUpperCase();

        if (d.progress >= 1000 || d.success === 1 || d.text === "Finished") {
          clearInterval(intv);
          resolveItem(itemId, d.download_url, d.alternative_download_urls);
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  }

  function resolveItem(itemId, dlUrl, altUrls) {
    const item = document.getElementById(itemId);
    const metadata = window.DOWNLOAD_METADATA_STORE[itemId];
    if (!item || !metadata) return;

    const tSh = document.getElementById(`${itemId}-ttl-sh`);
    if(tSh) { tSh.outerHTML = `<p class="text-xs font-semibold text-gray-200 truncate mb-1 pr-1" title="${metadata.title}">${metadata.title}</p>`; }

    const barFrame = document.getElementById(`${itemId}-bar-frame`);
    const statFrame = document.getElementById(`${itemId}-stat-frame`);
    if(barFrame) barFrame.remove();
    if(statFrame) statFrame.remove();
    
    let exactUrl = (dlUrl && dlUrl !== "null") ? dlUrl : null;
    if(!exactUrl && altUrls && altUrls.length > 0) {
      exactUrl = altUrls[0].url;
    }
    if(!exactUrl) exactUrl = "#";

    const dBtn = document.createElement('button');
    dBtn.className = 'w-full bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold py-2 rounded-xl transition-all shadow-lg shadow-green-500/20 mt-1 flex items-center justify-center gap-1.5';
    dBtn.innerHTML = '<i class="fa-solid fa-download"></i> DOWNLOAD READY';
    dBtn.onclick = (e) => {
      e.preventDefault();
      triggerDirectDownload(exactUrl);
    };
    
    const targetTextContainer = item.querySelector('.flex-1');
    if(targetTextContainer) targetTextContainer.appendChild(dBtn);
  }

  // Initialize and Auto Trigger Instantly on Activation
  populateDropdowns();
  updateFormatDisplay();
  applyUIState();
  
  // Instant Auto Run Loop call
  setTimeout(() => { triggerAutoProcess(); }, 400);
};
