/* ══════════════════════════════════════
   js/logs.js
   Log history list renderer + delete UI
   ══════════════════════════════════════ */

let _pendingDeleteTs = null;

function renderLogs() {
  const el = document.getElementById('logList');

  if (!logs.length) {
    el.innerHTML = '<div class="empty-state">No logs pa po baby🌸<br>Tap Time In to start!</div>';
    return;
  }

  el.innerHTML = [...logs]
    .reverse()
    .slice(0, CONFIG.LOG_LIMIT)
    .map(l => `
      <div class="log-entry">
        <div class="log-badge ${l.t === 'IN' ? 'in' : 'out'}${l.manual ? ' manual' : ''}">${l.t}</div>
        <div class="log-content">
          <div class="log-time">
            ${fmt12(l.ts)}
            ${l.manual ? '<span class="log-manual-tag">manual</span>' : ''}
          </div>
          <div class="log-meta">${fmtDate(l.ts)}</div>
        </div>
        <button class="log-delete-btn" data-ts="${l.ts}" aria-label="Delete log">&times;</button>
      </div>
    `)
    .join('');
}

// one-time bind delete handler with event delegation
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('logList');
  if (!el || el._hasDeleteHandler) return;
  el._hasDeleteHandler = true;

  el.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.log-delete-btn');
    if (!btn) return;

    const ts = Number(btn.getAttribute('data-ts'));
    if (!ts) return;

    openDeleteConfirm(ts);
  });
});

function openDeleteConfirm(ts) {
  _pendingDeleteTs = Number(ts);
  const timeEl = document.getElementById('deleteTime');
  const dateEl = document.getElementById('deleteDate');
  if (timeEl) timeEl.textContent = fmt12(_pendingDeleteTs);
  if (dateEl) dateEl.textContent = fmtDate(_pendingDeleteTs);
  if (typeof openById === 'function') {
    openById('deleteOverlay');
  }
}

function cancelDeleteLog() {
  _pendingDeleteTs = null;
  if (typeof closeById === 'function') {
    closeById('deleteOverlay');
  }
}

function confirmDeleteLog() {
  if (_pendingDeleteTs == null) {
    if (typeof closeById === 'function') closeById('deleteOverlay');
    return;
  }
  deleteLog(_pendingDeleteTs);
  _pendingDeleteTs = null;
  if (typeof closeById === 'function') {
    closeById('deleteOverlay');
  }
  refreshAll();
  if (typeof toast === 'function') {
    toast('Log deleted.');
  }
}
