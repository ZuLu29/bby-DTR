/* ══════════════════════════════════════
   js/logs.js
   Log history list renderer
   ══════════════════════════════════════ */

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
        <div>
          <div class="log-time">
            ${fmt12(l.ts)}
            ${l.manual ? '<span class="log-manual-tag">manual</span>' : ''}
          </div>
          <div class="log-meta">${fmtDate(l.ts)}</div>
        </div>
      </div>
    `)
    .join('');
}
