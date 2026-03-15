/* ══════════════════════════════════════
   js/storage.js
   localStorage (offline) + Google Sheets
   sync (online). localStorage = cache.
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

/* ── GOOGLE SHEETS ── */
async function fetchFromSheet() {
  try {
    const res  = await fetch(CONFIG.SHEET_URL);
    const json = await res.json();
    if (json.ok && json.logs) {
      logs = json.logs;
      saveLocal(); // update local cache
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
    const res = await fetch(CONFIG.SHEET_URL, {
      method:  'POST',
      body:    JSON.stringify({ action: 'save', logs }),
    });
    const json = await res.json();
    if (json.ok) {
      setSyncStatus('ok');
    } else {
      setSyncStatus('error');
    }
  } catch(e) {
    console.warn('DTR: push to sheet failed', e);
    setSyncStatus('error');
  } finally {
    isSyncing = false;
  }
}

/* ── PUBLIC API ── */
function saveLogs() {
  saveLocal();    // instant local save
  pushToSheet();  // async sync to sheet
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

/* ── SYNC STATUS INDICATOR ── */
function setSyncStatus(state) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const map = {
    syncing: { text: '⟳ syncing…',  color: 'var(--lavender)' },
    ok:      { text: '✓ synced',     color: 'var(--in-color)' },
    error:   { text: '✕ sync failed',color: 'var(--out-color)' },
    offline: { text: '◌ offline',    color: 'var(--muted)' },
  };
  const s = map[state] || map.offline;
  el.textContent  = s.text;
  el.style.color  = s.color;
}

/* ── INIT: load from sheet on startup ── */
async function initStorage() {
  loadLogs();           // load local cache immediately (fast)
  refreshAll();         // show cached data right away

  if (!navigator.onLine) {
    setSyncStatus('offline');
    return;
  }

  setSyncStatus('syncing');
  const ok = await fetchFromSheet();
  if (ok) {
    setSyncStatus('ok');
    refreshAll();       // re-render with fresh sheet data
  } else {
    setSyncStatus('error');
  }
}

window.addEventListener('online',  () => initStorage());
window.addEventListener('offline', () => setSyncStatus('offline'));
