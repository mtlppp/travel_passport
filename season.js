/* 旅貼：依旅程日期推算季節。
 * 規則（使用者 2026-10-23 修訂）：只用春夏秋冬四季，不分乾雨季。
 *   北半球：3–5 月春、6–8 月夏、9–11 月秋、12–2 月冬。
 *   南半球（AU、NZ、ID）：反轉 6 個月。印尼主要旅遊地（峇里島、雅加達）在赤道以南。
 *   跨季旅程：取天數最多的季節；同樣多時取較早的。
 * 日期格式與 App 相同：'YYYY-MM-DD'。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LvtieSeason = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SOUTH = new Set(['AU', 'NZ', 'ID']);
  const BY_MONTH = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const LABEL = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  const valid = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T00:00:00Z'));

  function seasonOfMonth(cc, month) {          // month: 1–12
    const m = SOUTH.has(String(cc || '').toUpperCase()) ? ((month + 5) % 12) + 1 : month;
    return BY_MONTH[m - 1];
  }
  function seasonOfDate(cc, iso) { return valid(iso) ? seasonOfMonth(cc, +iso.slice(5, 7)) : null; }

  // 回傳 { season, label, days: {season: 天數}, mixed }；開始日期無效時回傳 null。
  function tripSeason(cc, startDate, endDate) {
    if (!valid(startDate)) return null;
    if (!valid(endDate) || endDate < startDate) endDate = startDate;
    const t0 = Date.parse(startDate + 'T00:00:00Z'), t1 = Date.parse(endDate + 'T00:00:00Z');
    const n = Math.min(366, Math.round((t1 - t0) / 864e5) + 1);
    const days = {}, order = [];
    for (let i = 0; i < n; i++) {
      const s = seasonOfMonth(cc, new Date(t0 + i * 864e5).getUTCMonth() + 1);
      if (!(s in days)) { days[s] = 0; order.push(s); }
      days[s]++;
    }
    const season = order.reduce((a, b) => (days[b] > days[a] ? b : a));
    return { season, label: LABEL[season], days, mixed: order.length > 1 };
  }
  return { seasonOfMonth, seasonOfDate, tripSeason, LABEL, SOUTH };
});
