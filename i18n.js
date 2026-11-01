/* 旅貼介面語言：中文（預設）或 English。只在「備份與設定」手動切換，選擇存在 localStorage 'lvtie.lang'，
 * 不寫進帳目資料、不隨 JSON 備份。必須在 season.js、core.js 之前載入。
 * Lx('中文','English') 依目前語言回傳其中一個；切換語言後重新載入頁面。 */
(function (g) {
  var lang = 'zh';
  try { if (g.localStorage && g.localStorage.getItem('lvtie.lang') === 'en') lang = 'en'; } catch (e) {}
  g.LVTIE_LANG = lang;
  g.Lx = function (zh, en) { return lang === 'en' && en != null ? en : zh; };
  try { if (g.document && g.document.documentElement) g.document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant'; } catch (e) {}
})(typeof self !== 'undefined' ? self : this);
