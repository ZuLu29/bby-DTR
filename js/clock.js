/* ══════════════════════════════════════
   js/clock.js
   Live clock — updates every second
   ══════════════════════════════════════ */

function updateClock() {
  const now = new Date();
  let h     = now.getHours();
  const m   = now.getMinutes();
  const ap  = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  document.getElementById('clock').innerHTML =
    `${pad(h)}<span class="colon">:</span>${pad(m)}`;
  document.getElementById('clockAmpm').textContent = ap;
  document.getElementById('clockDate').textContent =
    `${DAYS_LONG[now.getDay()]}, ${MONTHS_LONG[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}
