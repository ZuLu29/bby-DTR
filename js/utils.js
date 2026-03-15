/* ══════════════════════════════════════
   js/utils.js
   Pure helper functions (no DOM)
   ══════════════════════════════════════ */

const DAYS_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_LONG   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function fmt12(ts) {
  const d  = new Date(ts);
  let h    = d.getHours();
  const m  = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)} ${ap}`;
}

function fmtDate(ts) {
  const d = new Date(ts);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

function fmtDateShort(dateKey) {
  // dateKey = 'YYYY-MM-DD'
  const d = new Date(dateKey + 'T00:00:00');
  return `${DAYS_SHORT[d.getDay()]} ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTodayLogs() {
  return logs.filter(l => l.dk === todayKey());
}

/** Group logs by day key, return sorted array of { dk, inLog, outLog, hours } */
function getDailyRows() {
  const byDay = {};
  logs.forEach(l => {
    (byDay[l.dk] = byDay[l.dk] || []).push(l);
  });

  return Object.keys(byDay).sort().map(dk => {
    const arr  = byDay[dk];
    const ins  = arr.filter(x => x.t === 'IN' ).sort((a, b) => a.ts - b.ts);
    const outs = arr.filter(x => x.t === 'OUT').sort((a, b) => a.ts - b.ts);
    const inLog  = ins[0]  || null;
    const outLog = outs[0] || null;
    const hours  = (inLog && outLog) ? (outLog.ts - inLog.ts) / 3600000 : null;
    return { dk, inLog, outLog, hours };
  });
}

/** Sum all completed IN/OUT pairs across all days */
function computeTotal() {
  const byDay = {};
  logs.forEach(l => {
    (byDay[l.dk] = byDay[l.dk] || []).push(l);
  });

  let total = 0;
  Object.values(byDay).forEach(arr => {
    const ins  = arr.filter(x => x.t === 'IN' ).sort((a, b) => a.ts - b.ts);
    const outs = arr.filter(x => x.t === 'OUT').sort((a, b) => a.ts - b.ts);
    const n = Math.min(ins.length, outs.length);
    for (let i = 0; i < n; i++) {
      total += (outs[i].ts - ins[i].ts) / 3600000;
    }
  });
  return total;
}

/** Estimate finish date counting only CONFIG.WORK_DAYS */
function estimateDone(totalHours) {
  const remaining = CONFIG.TARGET_HOURS - totalHours;
  if (remaining <= 0) return 'Done! 🎉';

  let daysLeft = Math.ceil(remaining / CONFIG.HOURS_PER_DAY);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // start from tomorrow

  while (daysLeft > 0) {
    if (CONFIG.WORK_DAYS.includes(d.getDay())) daysLeft--;
    if (daysLeft > 0) d.setDate(d.getDate() + 1);
  }
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}
