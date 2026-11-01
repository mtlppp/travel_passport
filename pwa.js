(() => {
  const Lx=(typeof self!=='undefined'&&typeof self.Lx==='function')?self.Lx:(z=>z);
  let ready = false, status = Lx('正在準備離線使用…','Preparing offline use…'), installPrompt = null, registration = null;
  let storageOK = true, refreshing = false;
  try { const key = 'lvtie.storage-test'; localStorage.setItem(key, '1'); localStorage.removeItem(key); }
  catch (_) { storageOK = false; }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let shortStatus = Lx('正在準備離線使用…','Preparing offline use…');
  const doUpdate = () => {
    if (!confirm(Lx('更新會重新開啟頁面，尚未按「記一筆」或「儲存修改」的輸入會清空；已儲存帳目會保留。現在更新？','Updating reloads the page. Anything you haven’t saved with “Add” or “Save changes” will be cleared; saved records are kept. Update now?'))) return;
    refreshing = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
  const doInstall = async () => { const prompt = installPrompt; installPrompt = null; await prompt.prompt(); await prompt.userChoice; window.updatePwaUI(); };
  const mkButton = (el, text, action) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', action); el.append(b); };
  const renderFull = el => {
    el.textContent = '';
    const message = document.createElement('p');
    message.textContent = ready ? (navigator.onLine ? Lx('已可離線使用 · 帳目保存在本機','Ready offline · records saved on this device') : Lx('離線模式 · 帳目保存在本機','Offline mode · records saved on this device')) : status;
    el.append(message);
    if (!storageOK || window.lvtieStorageError) {
      const warning = document.createElement('p'); warning.className = 'warn';
      warning.textContent = Lx('本機儲存失敗，記錄可能在關閉後遺失。請檢查瀏覽器儲存權限及可用空間。','Saving on this device failed; records may be lost when you close the page. Check browser storage permission and free space.'); el.append(warning);
    }
    if (installPrompt && !standalone()) mkButton(el, Lx('安裝旅貼','Install Lvtie'), doInstall);
    if (registration && registration.waiting) mkButton(el, Lx('更新至新版本','Update to new version'), doUpdate);
    if (ios && !standalone() && ready) { const tip = document.createElement('small'); tip.textContent = Lx('iPhone／iPad：用 Safari 開啟，按分享，再選「加入主畫面」。','iPhone / iPad: open in Safari, tap Share, then “Add to Home Screen”.'); el.append(tip); }
    const note = document.createElement('small'); note.textContent = Lx('清除網站資料或瀏覽器移除本機資料會令帳目及離線快取遺失；未有雲端備份。','Clearing site data, or the browser removing local data, will lose your records and offline cache. There is no cloud backup.'); el.append(note);
  };
  /* Always-visible one-line status at the bottom of every page. */
  const renderLine = el => {
    el.textContent = '';
    const off = !navigator.onLine;
    const state = ready ? (off ? 'off' : 'ok') : 'wait';
    el.dataset.state = state;
    const dot = document.createElement('i'); dot.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = ready ? (off ? Lx('離線模式 · 帳目照常保存在本機','Offline mode · records still saved on this device') : Lx('已可離線使用 · 帳目保存在本機','Ready offline · records saved on this device')) : shortStatus;
    el.append(dot, text);
    if (installPrompt && !standalone()) mkButton(el, Lx('安裝旅貼','Install Lvtie'), doInstall);
    else if (ios && !standalone() && ready) { const tip = document.createElement('small'); tip.textContent = Lx('iPhone：Safari 分享 →「加入主畫面」','iPhone: Safari Share → “Add to Home Screen”'); el.append(tip); }
    if (registration && registration.waiting) mkButton(el, Lx('更新至新版本','Update to new version'), doUpdate);
  };
  /* Small pill at the top, only when offline or an update is waiting. */
  const renderChip = el => {
    el.textContent = '';
    const off = !navigator.onLine, upd = Boolean(registration && registration.waiting);
    el.hidden = !(off || upd);
    if (off) { const t = document.createElement('span'); t.textContent = ready ? Lx('離線中 · 照常記帳','Offline · keep recording as usual') : Lx('離線中 · 離線檔案未備妥','Offline · offline files not ready'); el.append(t); }
    if (upd) mkButton(el, Lx('有新版本 · 更新','New version · update'), doUpdate);
  };
  window.updatePwaUI = () => {
    const full = document.getElementById('pwa-info'); if (full) renderFull(full);
    const line = document.getElementById('net-line'); if (line) renderLine(line);
    const chip = document.getElementById('net-chip'); if (chip) renderChip(chip);
  };
  const checkReady = async () => {
    const worker = registration && registration.active;
    if (!worker) return;
    const result = await new Promise(resolve => {
      const channel = new MessageChannel(), timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 5000);
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data && event.data.ready); };
      worker.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
    });
    ready = Boolean(result); if (!ready) { status = Lx('離線檔案未齊備，請保持連線後重新開啟。','Offline files are incomplete. Stay online and reopen the app.'); shortStatus = Lx('離線檔案未齊備 · 請連線後重開','Offline files incomplete · reopen while online'); }
    window.updatePwaUI();
  };
  window.addEventListener('online', () => { window.updatePwaUI(); if (registration) registration.update().catch(() => {}); });
  window.addEventListener('offline', window.updatePwaUI);
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; window.updatePwaUI(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; window.updatePwaUI(); });
  if (!('serviceWorker' in navigator) || !window.isSecureContext || location.protocol === 'file:') {
    status = Lx('離線安裝需使用 HTTPS 網址（例如 GitHub Pages）或 localhost；直接開啟 HTML 檔不會安裝 PWA。','Offline install needs an HTTPS address (e.g. GitHub Pages) or localhost; opening the HTML file directly won’t install the PWA.'); shortStatus = Lx('未啟用離線 · 需 HTTPS 網址開啟','Offline off · open via an HTTPS address'); window.updatePwaUI(); return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) location.reload(); else checkReady(); });
  navigator.serviceWorker.register(new URL('./sw.js', location.href), { scope: new URL('./', location.href).pathname, updateViaCache: 'none' }).then(async reg => {
    registration = reg;
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (worker) worker.addEventListener('statechange', () => { window.updatePwaUI(); if (worker.state === 'activated') checkReady(); });
    });
    await navigator.serviceWorker.ready; await checkReady();
    reg.update().catch(() => {});
  }).catch(() => { status = Lx('離線準備失敗，請確認已上載全部檔案，並在連線時重新開啟。','Offline setup failed. Make sure all files are uploaded, then reopen while online.'); shortStatus = Lx('離線準備失敗 · 請連線後重開','Offline setup failed · reopen while online'); window.updatePwaUI(); });
  window.updatePwaUI();
})();
