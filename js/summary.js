/* ══════════════════════════════════════
   js/summary.js
   Today's summary card + status pill
   ══════════════════════════════════════ */

function updateStatus() {
  const tl   = getTodayLogs();
  const last = tl.length ? tl[tl.length - 1] : null;

  const pill = document.getElementById('statusPill');
  const dot  = document.getElementById('statusDot');

  if (!last || last.t === 'OUT') {
    pill.className = 'status-pill idle';
    dot.className  = 'dot';
    document.getElementById('statusText').textContent = 'Not logged in';
    document.getElementById('btnIn').disabled  = false;
    document.getElementById('btnOut').disabled = true;
  } else {
    pill.className = 'status-pill in';
    dot.className  = 'dot pulse';
    document.getElementById('statusText').textContent = `In since ${fmt12(last.ts)}`;
    document.getElementById('btnIn').disabled  = true;
    document.getElementById('btnOut').disabled = false;
  }
}

function updateSummary() {
  const tl     = getTodayLogs();
  const inLog  = tl.find(l => l.t === 'IN');
  const outLog = [...tl].reverse().find(l => l.t === 'OUT');

  document.getElementById('summaryIn').textContent  = inLog  ? fmt12(inLog.ts)  : '—';
  document.getElementById('summaryOut').textContent = outLog ? fmt12(outLog.ts) : '—';

  if (inLog && outLog) {
    const ms = computeWorkMs(inLog.ts, outLog.ts);
    const h  = Math.floor(ms / 3600000);
    document.getElementById('summaryHours').textContent = h + 'h';
  } else if (inLog) {
    const ms = computeWorkMs(inLog.ts, Date.now());
    const h  = Math.floor(ms / 3600000);
    document.getElementById('summaryHours').textContent = h + 'h ↑';
  } else {
    document.getElementById('summaryHours').textContent = '—';
  }

  const uniqueDays = [...new Set(logs.filter(l => l.t === 'IN').map(l => l.dk))];
  document.getElementById('summaryDays').textContent = uniqueDays.length;
}
