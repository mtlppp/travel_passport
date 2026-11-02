/* 旅貼介面語言：繁體中文、简体中文或 English。
 * 第一次打開（沒有手動選過）時按手機語言自動選：zh-Hant／zh-HK／zh-TW／zh-MO → 繁體中文；
 * 其他中文（zh-CN、zh-SG、zh-Hans、zh）→ 简体中文；其他語言 → English；瀏覽器沒有提供語言時用繁體中文。
 * 在「備份與設定」手動切換後，選擇存在 localStorage 'lvtie.lang'（zh／zh-Hans／en），之後不再自動判斷。
 * 不寫進帳目資料、不隨 JSON 備份。必須在 season.js、core.js 之前載入。
 * Lx('中文','English') 依目前語言回傳其中一個；简体中文由繁體字串自動轉換（先換詞語，再逐字轉），
 * 只轉換 App 自己的文字，用家輸入的備註和名稱不會經過 Lx，所以不會被改動。 */
(function (g) {
  /* 繁→簡逐字對照（只含 App 用到、而且簡體寫法不同的字；每兩個字一組） */
  var T2S = '並并貨货乾干亞亚佔占併并來来個个倫伦備备傳传價价儲储兌兑內内兩两冊册凱凯別别刪删則则劃划劇剧動动務务匯汇區区協协參参問问啟启單单嗎吗國国圍围圓圆圖图報报場场塊块壇坛壩坝夢梦妝妆宮宫實实寫写寬宽將将專专尋寻對对岡冈島岛峽峡嵐岚帳账帶带幣币幫帮庫库廟庙廣广張张彈弹後后從从復复恆恒態态應应捨舍捲卷換换擇择據据敗败數数於于時时暫暂會会東东條条棄弃業业榮荣樂乐標标樣样橋桥機机檔档檢检欄栏權权歐欧歡欢決决沒没沖冲減减測测湯汤準准滿满濟济濫滥濱滨瀏浏灘滩灣湾為为烏乌無无燒烧爾尔狀状獅狮獲获獸兽現现瑪玛環环畫画當当疊叠發发盧卢確确碼码禮礼稅税種种稱称筆笔節节範范紀纪約约納纳紐纽紙纸級级細细組组結结絡络給给統统經经綠绿網网線线編编縮缩總总繩绳繪绘繼继續续羅罗聖圣與与舊旧萬万蓋盖蓮莲薩萨藍蓝藥药蘭兰處处號号衝冲補补裝装裡里製制複复見见規规視视覽览觸触訂订計计訊讯記记設设許许註注試试話话該该詳详認认語语說说調调請请謝谢證证議议讀读變变讓让貝贝買买費费貼贴資资賓宾購购贊赞車车較较載载輪轮輯辑輸输轉转這这連连進进遊游運运過过達达違违適适選选遺遗邁迈還还邊边鄭郑鈕钮銖铢銷销錄录錢钱錦锦鎊镑鎖锁鎮镇鐘钟鐵铁長长門门閉闭開开間间關关陣阵陰阴階阶際际隨随隱隐雙双離离雲云靈灵韓韩響响頁页項项順顺須须預预頭头題题額额願愿類类顯显風风飲饮餘余饋馈馬马驗验體体鬥斗鬱郁魚鱼魯鲁鵝鹅麼么黃黄點点齊齐龍龙';
  /* 先換的詞語（繁體 → 简体，長的放前面）：大陸慣用說法與地名 */
  var PH = [
    ['持久儲存','持久存储'],
    ['儲存權限','存储权限'],
    ['儲存空間','存储空间'],
    ['本機儲存','本机存储'],
    ['瀏覽器儲存','浏览器存储'],
    ['原始儲存資料','原始存储数据'],
    ['儲存','保存'],
    ['旅程資料','旅程信息'],
    ['行程資料','行程信息'],
    ['資料','数据'],
    ['檔案','文件'],
    ['設定','设置'],
    ['匯出','导出'],
    ['匯入','导入'],
    ['預設','默认'],
    ['支援','支持'],
    ['上載','上传'],
    ['視窗','窗口'],
    ['連結','链接'],
    ['快取','缓存'],
    ['用家','用户'],
    ['毋須','无须'],
    ['手信','伴手礼'],
    ['抵銷','抵消'],
    ['網絡連線','网络连接'],
    ['連線資訊','连接信息'],
    ['連線','联网'],
    ['位址','地址'],
    ['回饋','反馈'],
    ['裝置','设备'],
    ['試算表','电子表格'],
    ['載入','加载'],
    ['點按','点击'],
    ['開啟','打开'],
    ['介面','界面'],
    ['捲動','滚动'],
    ['選單','菜单'],
    ['伺服器','服务器'],
    ['紐西蘭','新西兰'],
    ['艾菲爾鐵塔','埃菲尔铁塔'],
    ['大笨鐘','大本钟'],
    ['尼加拉瀑布','尼亚加拉瀑布'],
    ['韓圜','韩元'],
    ['馬來西亞令吉','马来西亚林吉特'],
    ['菲律賓披索','菲律宾比索'],
    ['泰姬瑪哈陵','泰姬陵'],
    ['布蘭登堡門','勃兰登堡门'],
    ['阿罕布拉宮','阿尔罕布拉宫'],
    ['峇里島','巴厘岛']
  ];
  var map = null, cache = {};
  function hans(s) {
    if (typeof s !== 'string' || !s) return s;
    if (Object.prototype.hasOwnProperty.call(cache, s)) return cache[s];
    if (!map) { map = {}; for (var i = 0; i < T2S.length; i += 2) map[T2S.charAt(i)] = T2S.charAt(i + 1); }
    var t = s;
    for (var j = 0; j < PH.length; j++) if (t.indexOf(PH[j][0]) >= 0) t = t.split(PH[j][0]).join(PH[j][1]);
    var o = '';
    for (var k = 0; k < t.length; k++) { var c = t.charAt(k); o += map[c] || c; }
    return (cache[s] = o);
  }
  /* 手機語言 → 介面語言；只看第一個偏好語言 */
  function detect(list) {
    var l = list && list.length ? String(list[0] || '').toLowerCase().replace(/_/g, '-') : '';
    if (!l) return 'zh';
    if (/^zh\b/.test(l)) return /-hans\b/.test(l) ? 'zh-Hans' : /-hant\b|-(hk|tw|mo)\b/.test(l) ? 'zh' : 'zh-Hans';
    return 'en';
  }
  var lang = '', auto = false;
  try { var v = g.localStorage && g.localStorage.getItem('lvtie.lang'); if (v === 'zh' || v === 'zh-Hans' || v === 'en') lang = v; } catch (e) {}
  if (!lang) {
    auto = true;
    try { var n = g.navigator; lang = detect(n && (n.languages && n.languages.length ? n.languages : [n.language])); } catch (e) { lang = 'zh'; }
  }
  g.LVTIE_LANG = lang;
  g.LVTIE_LANG_AUTO = auto;
  g.LvtieHans = hans;
  g.LvtieDetectLang = detect;
  g.Lx = function (zh, en) { return lang === 'en' && en != null ? en : lang === 'zh-Hans' ? hans(zh) : zh; };
  try { if (g.document && g.document.documentElement) g.document.documentElement.lang = lang === 'en' ? 'en' : lang === 'zh-Hans' ? 'zh-Hans' : 'zh-Hant'; } catch (e) {}
})(typeof self !== 'undefined' ? self : this);
