/* ══════════════════════════════════════
   js/modals.js
   Bulk entry modal + Timesheet modal
   ══════════════════════════════════════ */

/* ── SHARED ── */
function overlayTap(e, id) {
  if (e.target === document.getElementById(id)) closeById(id);
}
function closeById(id) { document.getElementById(id).classList.remove('show'); }
function openById(id)  { document.getElementById(id).classList.add('show'); }

/* ── TOAST ── */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ═══════════════════════════════════════════
   BULK MANUAL ENTRY MODAL
   ═══════════════════════════════════════════ */

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function openManual() {
  // Default range: last 2 weeks up to today
  const today = new Date();
  const from  = new Date(today);
  from.setDate(from.getDate() - 13);

  document.getElementById('bulkFrom').value = toDateInput(from);
  document.getElementById('bulkTo').value   = toDateInput(today);
  document.getElementById('bulkTableWrap').style.display = 'none';
  document.getElementById('bulkBody').innerHTML = '';
  openById('manualOverlay');
}

function closeManual() { closeById('manualOverlay'); }

function toDateInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function generateBulkRows() {
  const fromVal = document.getElementById('bulkFrom').value;
  const toVal   = document.getElementById('bulkTo').value;

  if (!fromVal || !toVal)  { toast('Piliin ang From at To date!'); return; }
  if (fromVal > toVal)     { toast('From dapat mas maaga sa To!'); return; }

  const diffDays = (new Date(toVal) - new Date(fromVal)) / 86400000;
  if (diffDays > 60) { toast('Max 60 days lang per batch!'); return; }

  const tbody  = document.getElementById('bulkBody');
  tbody.innerHTML = '';

  let current  = new Date(fromVal + 'T00:00:00');
  const toDate = new Date(toVal   + 'T00:00:00');
  let rowCount = 0;

  while (current <= toDate) {
    const dow   = current.getDay();
    const dk    = toDateInput(current);
    const label = `${DAY_LABELS[dow]} ${MON_LABELS[current.getMonth()]} ${current.getDate()}`;
    const isSun = dow === 0;

    // Pre-fill if already has existing logs
    const existIn  = logs.find(l => l.dk === dk && l.t === 'IN');
    const existOut = logs.find(l => l.dk === dk && l.t === 'OUT');
    const preIn    = existIn  ? new Date(existIn.ts).toTimeString().slice(0,5)  : '';
    const preOut   = existOut ? new Date(existOut.ts).toTimeString().slice(0,5) : '';
    const hasLog   = !!(existIn || existOut);

    const tr = document.createElement('tr');
    if (isSun) tr.classList.add('skipped');
    tr.dataset.dk      = dk;
    tr.dataset.skipped = isSun ? 'true' : 'false';

    tr.innerHTML = `
      <td class="bulk-date-cell${isSun ? ' weekend' : ''}">
        ${label}${hasLog ? ' <span style="color:var(--purple);font-size:8px">✓</span>' : ''}
      </td>
      <td><input type="time" class="bulk-input" data-type="in"  value="${preIn}"  ${isSun ? 'disabled' : ''}/></td>
      <td><input type="time" class="bulk-input" data-type="out" value="${preOut}" ${isSun ? 'disabled' : ''}/></td>
      <td>
        <button class="bulk-skip-btn" onclick="toggleSkipRow(this)" title="${isSun ? 'Sunday' : 'Skip row'}">
          ${isSun ? '—' : '✕'}
        </button>
      </td>
    `;

    tbody.appendChild(tr);
    rowCount++;
    current.setDate(current.getDate() + 1);
  }

  document.getElementById('bulkTableWrap').style.display = 'block';
  toast(`${rowCount} rows generated!`);
}

function toggleSkipRow(btn) {
  const tr        = btn.closest('tr');
  const isSkipped = tr.dataset.skipped === 'true';

  if (isSkipped) {
    tr.dataset.skipped = 'false';
    tr.classList.remove('skipped');
    tr.querySelectorAll('.bulk-input').forEach(i => i.disabled = false);
    btn.textContent = '✕';
  } else {
    tr.dataset.skipped = 'true';
    tr.classList.add('skipped');
    tr.querySelectorAll('.bulk-input').forEach(i => { i.disabled = true; i.value = ''; });
    btn.textContent = '—';
  }
}

function saveBulk() {
  const rows = document.querySelectorAll('#bulkBody tr');
  let saved = 0, skipped = 0;

  rows.forEach(tr => {
    if (tr.dataset.skipped === 'true') { skipped++; return; }

    const dk     = tr.dataset.dk;
    const inVal  = tr.querySelector('[data-type="in"]').value;
    const outVal = tr.querySelector('[data-type="out"]').value;

    if (!inVal && !outVal) { skipped++; return; }

    const [y, mo, d] = dk.split('-').map(Number);

    // Remove existing logs for this day to avoid duplicates
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].dk === dk) logs.splice(i, 1);
    }

    if (inVal) {
      const [ih, im] = inVal.split(':').map(Number);
      logs.push({ t: 'IN',  ts: new Date(y, mo-1, d, ih, im).getTime(), dk, manual: true });
    }
    if (outVal) {
      const [oh, om] = outVal.split(':').map(Number);
      logs.push({ t: 'OUT', ts: new Date(y, mo-1, d, oh, om).getTime(), dk, manual: true });
    }
    saved++;
  });

  logs.sort((a, b) => a.ts - b.ts);
  saveLogs();
  refreshAll();
  closeManual();
  toast(`✨ ${saved} day${saved !== 1 ? 's' : ''} saved! (${skipped} skipped)`);
}

/* ═══════════════════════════════════════════
   TIMESHEET MODAL
   ═══════════════════════════════════════════ */
function openTs() {
  const rows  = getDailyRows();
  const total = computeTotal();

  document.getElementById('tsSub').textContent =
    `${rows.length} day${rows.length !== 1 ? 's' : ''} · ${total.toFixed(1)}h total`;
  document.getElementById('tsTotal').textContent = total.toFixed(1) + 'h';

  const tbody = document.getElementById('tsBody');
  tbody.innerHTML = rows.length
    ? rows.map(r => `
        <tr>
          <td class="ts-date">${fmtDateShort(r.dk)}</td>
          <td>${r.inLog  ? fmt12(r.inLog.ts)  : '—'}</td>
          <td>${r.outLog ? fmt12(r.outLog.ts) : '—'}</td>
          <td class="ts-hours">${r.hours !== null ? r.hours.toFixed(1) + 'h' : '—'}</td>
        </tr>
      `).join('')
    : `<tr>
         <td colspan="4" style="text-align:center;color:var(--muted);padding:20px;font-size:11px">
           No logs pa po baby🌸
         </td>
       </tr>`;

  openById('tsOverlay');
}

function closeTs() { closeById('tsOverlay'); }
