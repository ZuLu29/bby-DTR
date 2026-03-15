/* ══════════════════════════════════════
   js/config.js
   App-wide constants — edit here lang
   kung mag-babago ng settings
   ══════════════════════════════════════ */

const CONFIG = {
  STORAGE_KEY:   'dtr_caine_v2',
  TARGET_HOURS:  600,
  HOURS_PER_DAY: 9,          // 8AM–5PM = 9h
  WORK_DAYS:     [1,2,3,4,5,6],  // 1=Mon … 6=Sat (0=Sun excluded)
  LOG_LIMIT:     40,         // max entries shown in log history
  SHEET_URL:     'https://script.google.com/macros/s/AKfycbwT8xitnDeXrIK3J_2Y3D3X6m94YY9VnEzgICGAvjIiqo8scK1habOx8yPVMRGtZY8C/exec',
};
