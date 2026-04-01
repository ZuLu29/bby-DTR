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

/**
 * Compute effective work milliseconds between two timestamps on same day,
 * applying company rules:
 * - Work starts at 8:00 AM minimum
 * - If time-in is between 7:40–7:59 → count from 8:00
 * - If time-in is 8:10 or later (before 9:00) → count from 9:00 (late)
 * - Minutes are not counted (hours only, truncate)
 * - Lunch 12:00–1:00 PM is not counted
 */
function computeWorkMs(startTs, endTs) {
  if (!startTs || !endTs || endTs <= startTs) return 0;

  const start = new Date(startTs);
  const end   = new Date(endTs);

  // assume same calendar day (per current app design)
  const y = start.getFullYear();
  const m = start.getMonth();
  const d = start.getDate();

  function toTs(h, min) {
    return new Date(y, m, d, h, min, 0, 0).getTime();
  }

  // adjust start according to rules
  let sH = start.getHours();
  let sM = start.getMinutes();
  let s;

  const sevenForty = toTs(7, 40);
  const eight      = toTs(8, 0);
  const eightTen   = toTs(8, 10);

  const startMs = start.getTime();

  if (startMs >= sevenForty && startMs < eight) {
    // 7:40–7:59 → 8:00
    s = eight;
  } else if (startMs >= eightTen && startMs < toTs(9, 0)) {
    // 8:10–8:59 → 9:00 (late)
    s = toTs(9, 0);
  } else {
    // generic: truncate minutes (hours only)
    s = toTs(sH, 0);
  }

  // never before official start 8:00
  if (s < eight) s = eight;

  // adjust end: truncate minutes (hours only)
  let eH = end.getHours();
  const e = toTs(eH, 0);

  if (e <= s) return 0;

  let worked = e - s;

  // subtract lunch overlap 12:00–13:00
  const lunchStart = toTs(12, 0);
  const lunchEnd   = toTs(13, 0);

  const overlapStart = Math.max(s, lunchStart);
  const overlapEnd   = Math.min(e, lunchEnd);

  if (overlapEnd > overlapStart) {
    worked -= (overlapEnd - overlapStart);
  }

  if (worked <= 0) return 0;
  return worked;
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
    const hours  = (inLog && outLog)
      ? Math.floor(computeWorkMs(inLog.ts, outLog.ts) / 3600000)
      : null;
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
      const ms = computeWorkMs(ins[i].ts, outs[i].ts);
      total += Math.floor(ms / 3600000);
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
