/* ══════════════════════════════════════
   js/storage.js
   localStorage cache + Google Sheets sync
   Uses JSONP to bypass CORS restriction
   ══════════════════════════════════════ */

let logs = [];
let isSyncing = false;

/* ── LOCAL ── */
function loadLogs() {
  try {
    logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  } catch(e) {
    logs = [];
  }
}

function saveLocal() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(logs));
}

/* ── JSONP FETCH (bypasses CORS) ── */
function jsonpFetch(url) {
  return new Promise((resolve, reject) => {
    const cbName = '_dtr_cb_' + Date.now();
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, 8000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = function(data) {
      cleanup();
      resolve(data);
    };

    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName;
    script.onerror = () => { cleanup(); reject(new Error('JSONP error')); };
    document.head.appendChild(script);
  });
}

/* ── GOOGLE SHEETS ── */
async function fetchFromSheet() {
  try {
    const data = await jsonpFetch(CONFIG.SHEET_URL);
    if (data.ok && data.logs) {
      logs = data.logs;
      saveLocal();
      return true;
    }
  } catch(e) {
    console.warn('DTR: fetch from sheet failed, using local cache', e);
  }
  return false;
}

async function pushToSheet() {
  if (isSyncing) return;
  isSyncing = true;
  setSyncStatus('syncing');
  try {
    // Use fetch with no-cors for POST (fire-and-forget)
    // Then verify via GET
    await fetch(CONFIG.SHEET_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify({ action: 'save', logs }),
    });
    // Wait a moment then verify by loading back
    await new Promise(r => setTimeout(r, 1500));
    const ok = await fetchFromSheet();
    setSyncStatus(ok ? 'ok' : 'error');
  } catch(e) {
    console.warn('DTR: push to sheet failed', e);
    setSyncStatus('error');
  } finally {
    isSyncing = false;
  }
}

/* ── PUBLIC API ── */
function saveLogs() {
  saveLocal();
  pushToSheet();
}

function addLog(entry) {
  logs.push(entry);
  logs.sort((a, b) => a.ts - b.ts);
  saveLogs();
}

function clearAllLogs() {
  logs = [];
  saveLogs();
}

/* ── SYNC STATUS ── */
function setSyncStatus(state) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const map = {
    syncing: { text: '⟳ syncing…',   color: 'var(--lavender)' },
    ok:      { text: '✓ synced',      color: 'var(--in-color)' },
    error:   { text: '✕ sync failed', color: 'var(--out-color)' },
    offline: { text: '◌ offline',     color: 'var(--muted)' },
  };
  const s = map[state] || map.offline;
  el.textContent = s.text;
  el.style.color = s.color;
}

/* ── INIT ── */
async function initStorage() {
  loadLogs();
  refreshAll();

  if (!navigator.onLine) {
    setSyncStatus('offline');
    return;
  }

  setSyncStatus('syncing');
  const ok = await fetchFromSheet();
  setSyncStatus(ok ? 'ok' : 'error');
  if (ok) refreshAll();
}

window.addEventListener('online',  () => initStorage());
window.addEventListener('offline', () => setSyncStatus('offline'));
