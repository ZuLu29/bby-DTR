/* ══════════════════════════════════════
   js/app.js
   Entry point — init + core actions
   (logTime, clearLogs, refreshAll)
   ══════════════════════════════════════ */

/* ── REFRESH ALL UI ── */
function refreshAll() {
  updateStatus();
  updateSummary();
  renderLogs();
  updateProgress();
}

/* ── REAL-TIME LOG (tap button) ── */
function logTime(type) {
  addLog({ t: type, ts: Date.now(), dk: todayKey() });
  refreshAll();

  toast(type === 'IN' ? '🌸 Time In recorded!' : '🌙 Time Out recorded!');
  if (navigator.vibrate) navigator.vibrate(type === 'IN' ? 40 : [40, 30, 40]);
}

/* ── CLEAR ALL ── */
function clearLogs() {
  if (!confirm('I-clear lahat ng logs? Hindi na ito maibabalik.')) return;
  clearAllLogs();
  refreshAll();
  toast('Logs cleared.');
}

/* ── INIT ── */
(function init() {
  initClock();
  initStorage(); // loads local cache instantly, then syncs from sheet
})();
