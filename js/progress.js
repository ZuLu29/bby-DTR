/* ══════════════════════════════════════
   js/progress.js
   Progress bar + stats dashboard
   ══════════════════════════════════════ */

function updateProgress() {
  const total   = computeTotal();
  const pct     = Math.min(100, (total / CONFIG.TARGET_HOURS) * 100);
  const remain  = Math.max(0, CONFIG.TARGET_HOURS - total);

  document.getElementById('progressFill').style.width = pct.toFixed(1) + '%';
  document.getElementById('progressPct').textContent  = pct.toFixed(1) + '%';
  document.getElementById('statTotal').textContent    = total.toFixed(1) + 'h';
  document.getElementById('statRemain').textContent   = remain.toFixed(1) + 'h';
  document.getElementById('statEst').textContent      = estimateDone(total);
}
