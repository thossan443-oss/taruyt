/*****YTPRO & YTRU DOWN INTEGRATED*******
Author: Prateek Chaubey & Tarek Hossain
Version: 4.0.0 (Integrated Edition)
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

  // Get Video ID from Current Tab/URL Context natively inside YouTube
  let currentVideoId = "";
  if (window.location.pathname.indexOf("shorts") > -1) {
    currentVideoId = window.location.pathname.substr(8, window.location.pathname.length);
  } else {
    currentVideoId = new URLSearchParams(window.location.search).get("v");
  }

  // ─── INJECT YTRU DOWN FULL SCREEN UI ───
  // Remove any existing instances to avoid duplicates
  const existingUI = document.getElementById('ytru-down-root');
  if (existingUI) existingUI.remove();

  const uiContainer = document.createElement('div');
  uiContainer.id = 'ytru-down-root';
  Object.assign(uiContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '999999',
    backgroundColor: '#030712',
    color: '#f3f4f6',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  });

  // Inject Tailwind, FontAwesome and Fonts dynamically into YouTube document head
  if (!document.getElementById('ytru-tailwind')) {
    const tw = document.createElement('script'); tw.id = 'ytru-tailwind'; tw.src = 'https://cdn.tailwindcss.com'; document.head.appendChild(tw);
    const fa = document.createElement('link'); fa.id = 'ytru-fa'; fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'; document.head.appendChild(fa);
    const font = document.createElement('link'); font.id = 'ytru-font'; font.rel = 'stylesheet'; font.href = 'https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css'; document.head.appendChild(font);
  }

  // Inject Custom Styles
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes shimmerAnim { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .shimmer-box { background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%); background-size: 200% 100%; animation: shimmerAnim 1.5s infinite; border-radius: 0.5rem; }
    .progress-transition { transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .dropdown-menu { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: top right; }
    .dropdown-menu.hidden { transform: scale(0.95); opacity: 0; pointer-events: none; visibility: hidden; }
    .dropdown-menu.visible { transform: scale(1); opacity: 1; pointer-events: auto; visibility: visible; }
    .sheet { transition: transform 0.3s ease-out, opacity 0.3s ease-out; }
    .sheet.closed { transform: translateY(100%); opacity: 0; pointer-events: none; }
    .sheet.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .glass-panel { background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(12px); }
    .fade-scroll-mask {
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
    }
  `;
  uiContainer.appendChild(styleTag);

  // Layout Setup inside core architecture
  uiContainer.innerHTML += `
    <div id="toastContainer" class="fixed bottom-16 left-1/2 -translate-x-1/2 z-[100000] flex flex-col gap-2 pointer-events-none w-11/12 max-w-sm"></div>

    <header class="absolute top-0 left-0 right-0 h-14 glass-panel border-b border-gray-800 flex items-center justify-between px-4 z-50">
      <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
        <i class="fa-solid fa-cloud-arrow-down text-blue-500"></i> YTRU DOWN
      </h1>
      <div class="flex items-center gap-1">
        <button id="closeYtruUiBtn" class="p-2 rounded-full hover:bg-gray-800 text-gray-400 mr-1"><i class="fa-solid fa-arrow-left"></i></button>
        <button id="settingsBtn" class="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <i class="fa-solid fa-gear text-gray-400 text-sm"></i>
        </button>
      </div>
    </header>

    <section id="inputSection" class="absolute top-14 left-0 right-0 glass-panel border-b border-gray-800 p-3 z-40">
      <div class="max-w-3xl mx-auto space-y-2">
        <div class="flex gap-2">
          <input id="urlInput" type="text" placeholder="Paste video link or ID..." class="flex-1 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all">
          <button id="pasteBtn" class="bg-gray-700/80 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors border border-gray-600">
            <i class="fa-solid fa-clipboard"></i>
          </button>
        </div>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <button id="formatTrigger" class="w-full flex items-center justify-between bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:border-gray-600 transition-colors">
              <span id="selectedFormatLabel">MP4 (720p)</span>
              <i class="fa-solid fa-chevron-down text-xs ml-2 opacity-60"></i>
            </button>
            <div id="formatDropdown" class="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden dropdown-menu hidden z-50 max-h-60 overflow-y-auto"></div>
          </div>
          <button id="processBtn" disabled class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20">
            <i class="fa-solid fa-bolt-lightning"></i> PROCESS
          </button>
        </div>
      </div>
    </section>

    <main id="queueList" class="h-full overflow-y-auto hide-scrollbar pt-[195px] pb-20 px-4 space-y-3 fade-scroll-mask scroll-smooth">
      <div id="emptyState" class="flex flex-col items-center justify-center h-64 text-gray-500 text-sm select-none">
        <i class="fa-solid fa-layer-group text-5xl mb-3 opacity-20"></i>
        <p>No downloads in queue</p>
        <p class="text-xs text-gray-600 mt-1">Paste a YouTube link to start</p>
      </div>
    </main>

    <footer class="absolute bottom-0 left-0 right-0 h-12 glass-panel border-t border-gray-800 flex items-center justify-center z-50">
      <p class="text-xs text-gray-500">© 2026 YTRU DOWN. Made With <i class="fa-solid fa-heart text-red-500 mx-0.5"></i> By <a href="https://iamtarek.is-a.dev" target="_blank" class="text-blue-400 hover:text-blue-300 underline font-semibold tracking-wider">TAREK HOSSAIN</a></p>
    </footer>

    <div id="settingsOverlay" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] hidden transition-opacity opacity-0"></div>
    <div id="settingsSheet" class="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:bottom-6 sm:w-full sm:max-w-md bg-gray-900 border-t sm:border sm:border-gray-700/50 rounded-t-2xl sm:rounded-2xl p-5 z-[70] sheet closed shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">Configuration</h2>
        <button id="closeSettings" class="p-2 rounded-full hover:bg-gray-800 transition-colors"><i class="fa-solid fa-xmark text-gray-400"></i></button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">API Key Endpoint</label>
          <div class="flex gap-2">
            <input id="apiKeyInput" type="text" class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500">
            <button id="resetApiBtn" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs text-gray-300 border border-gray-600">Reset</button>
          </div>
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">CORS Proxy URL</label>
          <input id="proxyInput" type="text" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500" placeholder="https://api.codetabs.com/v1/proxy?quest=">
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">Default Format Type Priority</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-2.5 cursor-pointer hover:border-gray-600 select-none">
              <input type="radio" name="formatPriority" value="video" id="priorityVideo" class="accent-blue-500 h-4 w-4">
              <span class="text-xs text-gray-300 font-medium">Video Priority</span>
            </label>
            <label class="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-2.5 cursor-pointer hover:border-gray-600 select-none">
              <input type="radio" name="formatPriority" value="audio" id="priorityAudio" class="accent-blue-500 h-4 w-4">
              <span class="text-xs text-gray-300 font-medium">Audio Priority</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Default Video Quality</label>
            <select id="defaultVideoSelect" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500"></select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Default Audio Format</label>
            <select id="defaultAudioSelect" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500"></select>
          </div>
        </div>
        <button id="saveSettings" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 mt-1">Save & Apply</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(uiContainer);

  // References
  const urlInput = document.getElementById('urlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const formatTrigger = document.getElementById('formatTrigger');
  const formatDropdown = document.getElementById('formatDropdown');
  const selectedFormatLabel = document.getElementById('selectedFormatLabel');
  const processBtn = document.getElementById('processBtn');
  const queueList = document.getElementById('queueList');
  const emptyState = document.getElementById('emptyState');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsSheet = document.getElementById('settingsSheet');
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
  const closeYtruUiBtn = document.getElementById('closeYtruUiBtn');

  // Pre-fill active text input with URL context inside YouTube dynamically if available
  if (currentVideoId) {
    urlInput.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
  }

  // Toast Functionality
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

  function triggerDirectDownload(downloadUrl) {
    if (downloadUrl && downloadUrl !== '#') {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
      showToast("Download started!", false);
    } else {
      showToast("Download link unavailable", true);
    }
  }

  function populateDropdowns() {
    let mainHTML = '';
    Object.entries(VIDEO_FORMATS).forEach(([k, v]) => {
      mainHTML += `<div class="px-4 py-2.5 hover:bg-gray-700/80 cursor-pointer text-sm flex justify-between items-center format-opt" data-type="video" data-val="${k}"><span>${v}</span><i class="fa-solid fa-video text-gray-500 text-xs"></i></div>`;
    });
    mainHTML += '<div class="border-t border-gray-700/50 my-1"></div>';
    AUDIO_FORMATS.forEach(k => {
      mainHTML += `<div class="px-4 py-2.5 hover:bg-gray-700/80 cursor-pointer text-sm flex justify-between items-center format-opt" data-type="audio" data-val="${k}"><span>Audio (${k.toUpperCase()})</span><i class="fa-solid fa-music text-gray-500 text-xs"></i></div>`;
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

  function validate(showToastAlert = false) {
    const inputVal = urlInput.value.trim();
    if (inputVal === "") {
      processBtn.disabled = true;
      processBtn.style.opacity = '0.5';
      return;
    }
    const valid = YT_REGEX.test(inputVal);
    processBtn.disabled = !valid;
    processBtn.style.opacity = valid ? '1' : '0.5';
    if (!valid && showToastAlert) {
      showToast("Invalid Input! Only YouTube URL or 11-char Video ID allowed.");
    }
  }

  // Setup Interaction Hooks
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      urlInput.value = text;
      validate(true);
    } catch {
      showToast("Clipboard access denied. Please paste manually.");
    }
  });

  urlInput.addEventListener('input', () => validate(false));
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
    }
  });

  document.addEventListener('click', (e) => {
    if (!formatTrigger.contains(e.target) && !formatDropdown.contains(e.target)) {
      formatDropdown.classList.add('hidden');
      formatDropdown.classList.remove('visible');
    }
  });

  closeYtruUiBtn.addEventListener('click', () => uiContainer.remove());
  settingsBtn.addEventListener('click', openSheet);
  closeSettings.addEventListener('click', closeSheet);
  settingsOverlay.addEventListener('click', closeSheet);

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
    closeSheet();
    showToast("Settings saved successfully!", false);
  });

  function openSheet() {
    settingsOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      settingsOverlay.classList.remove('opacity-0');
      settingsSheet.classList.remove('closed');
      settingsSheet.classList.add('open');
    });
  }

  function closeSheet() {
    settingsOverlay.classList.add('opacity-0');
    settingsSheet.classList.remove('open');
    settingsSheet.classList.add('closed');
    setTimeout(() => settingsOverlay.classList.add('hidden'), 300);
  }

  // ─── AJAX PROGRESS DATA FETCH LOOP ENGINE ───
  async function handleProcess() {
    const match = urlInput.value.match(YT_REGEX);
    if (!match) {
      showToast("Failed to parse YouTube target ID.");
      return;
    }
    const vidId = match[1];
    const fmt = CONFIG.selectedVal;
    
    processBtn.disabled = true;
    const orig = processBtn.innerHTML;
    processBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> QUEUING';

    try {
      const targetUrl = `https://youtu.be/${vidId}?si=mn7eT9qCTNHW149_`;
      const reqUrl = `https://p.savenow.to/ajax/download.php?copyright=0&format=${fmt}&url=${encodeURIComponent(targetUrl)}&api=${encodeURIComponent(CONFIG.apiKey)}`;
      const finalApiUrl = CONFIG.proxyUrl + encodeURIComponent(reqUrl);
      
      const res = await fetch(finalApiUrl, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();

      if (data.success) {
        const itemId = createItem(data.id, data.title, data.info?.image, fmt, CONFIG.activeType);
        startPoll(data.id, data.progress_url, fmt, itemId);
        urlInput.value = '';
        validate(false);
      } else {
        showToast("API verification rejected. Please verify configuration keys.");
      }
    } catch (err) {
      console.error(err);
      showToast("Proxy Gateway connection dropped or timed out.");
    } finally {
      processBtn.disabled = false;
      processBtn.innerHTML = orig;
      processBtn.style.opacity = '1';
    }
  }

  function createItem(taskId, title, thumbUrl, fmt, type) {
    emptyState.style.display = 'none';
    const itemId = `q-${itemCounter++}`;
    
    const rawLabel = type === 'video' ? VIDEO_FORMATS[fmt].split(' ')[1].replace('(','').replace(')','') : fmt.toUpperCase();
    const formatLabel = type === 'video' ? `VIDEO - ${rawLabel}` : `AUDIO - ${rawLabel}`;
    
    const el = document.createElement('div');
    el.id = itemId;
    el.className = 'bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex gap-3 items-center backdrop-blur-sm relative transition-all duration-300 hover:border-gray-700/60';
    el.innerHTML = `
      <div class="w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-800 shimmer-box relative shadow-inner" id="${itemId}-thumb">
        <img src="${thumbUrl}" class="w-full h-full object-cover hidden relative z-10" alt="thumb" id="${itemId}-img" onload="this.classList.remove('hidden'); document.getElementById('${itemId}-thumb').classList.remove('shimmer-box');">
      </div>
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <div class="h-4 w-11/12 rounded shimmer-box mb-2" id="${itemId}-ttl-sh"></div>
        <div class="flex items-center gap-2 mb-1" id="${itemId}-combo-row">
          <span class="bg-blue-600/20 border border-blue-500/20 text-blue-400 font-bold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">${formatLabel}</span>
          <button onclick="document.getElementById('${itemId}').remove();" class="text-gray-500 hover:text-red-400 transition-colors p-1">
            <i class="fa-solid fa-trash-can text-[10px]"></i>
          </button>
        </div>
        <div class="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden" id="${itemId}-bar-frame">
          <div class="bg-blue-500 h-1.5 rounded-full progress-transition w-0" id="${itemId}-bar"></div>
        </div>
        <div class="flex justify-between items-center mt-1" id="${itemId}-stat-frame">
          <span class="text-[10px] text-gray-400 font-medium tracking-wide uppercase" id="${itemId}-stat">INITIALIZING...</span>
          <span class="text-[10px] font-mono text-blue-400 font-semibold" id="${itemId}-pct">0%</span>
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
    if(tSh) { tSh.outerHTML = `<p class="text-xs font-semibold text-gray-100 truncate mb-1 pr-1" title="${metadata.title}">${metadata.title}</p>`; }

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
    dBtn.className = 'w-full bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all shadow-lg shadow-green-500/20 mt-1 flex items-center justify-center gap-2';
    dBtn.innerHTML = '<i class="fa-solid fa-download"></i> DOWNLOAD READY';
    dBtn.onclick = (e) => {
      e.preventDefault();
      triggerDirectDownload(exactUrl);
    };
    
    const targetTextContainer = item.querySelector('.flex-1');
    if(targetTextContainer) targetTextContainer.appendChild(dBtn);
  }

  processBtn.addEventListener('click', handleProcess);

  // Initialize UI setups
  populateDropdowns();
  updateFormatDisplay();
  applyUIState();
  validate(false);
};
