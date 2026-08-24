/* =========================================================
   main.js — 開機與輸入綁定（對應 Unity 的 InputManager）
   W/S 移動　SPACE 互動／結束回合　E 生吃　1-9 出牌
   D 牌組　ESC 暫停　M 靜音　N 音樂
   ========================================================= */

/* ---------------- 鍵盤 ---------------- */
window.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const key = ev.key;
  const low = key.toLowerCase();
  Sfx.resume();

  if (State.mode === 'opening') {
    if (!ev.repeat && (key === ' ' || key === 'Enter')) Opening.next();
    ev.preventDefault();
    return;
  }

  // 數字鍵出牌
  if (State.mode === 'battle' && /^[1-9]$/.test(key)) {
    ev.preventDefault();
    Battle.clickCard(parseInt(key, 10) - 1);
    return;
  }

  if ([' ', 'ArrowUp', 'ArrowDown', 'w', 's', 'e', 'Enter', 'd'].includes(key === ' ' ? ' ' : low)) {
    ev.preventDefault();
  }

  switch (low) {
    case 'w': case 'arrowup':
      Explore.forward(); break;
    case 's': case 'arrowdown':
      Explore.backward(); break;
    case ' ':
      if (State.mode === 'explore') Explore.interact();
      else if (State.mode === 'cook' && Cooking.cooking) Cooking.stopNeedle();
      else if (State.mode === 'battle') Battle.endTurn();
      break;
    case 'e':
      Explore.eatRaw(); break;
    case 'enter':
      if (State.mode === 'battle') Battle.endTurn();
      else if (State.mode === 'title') Game.start();
      break;
    case 'd':
      if (['explore', 'battle', 'shop', 'campfire'].includes(State.mode)) UI.openDeck();
      break;
    case 'escape':
      if (!Util.el('overlay-help').classList.contains('hidden')) { UI.hide('overlay-help'); break; }
      if (!Util.el('overlay-codex').classList.contains('hidden')) { UI.hide('overlay-codex'); break; }
      if (!Util.el('overlay-deck').classList.contains('hidden')) { UI.hide('overlay-deck'); break; }
      if (State.mode === 'battle' && Battle.targeting != null) { Battle.cancelTarget(); break; }
      Game.togglePause();
      break;
    case 'm':
      UI.toast(Sfx.toggleMute() ? '🔇 已靜音' : '🔊 音效開啟', 1400); break;
    case 'n':
      UI.toast(Sfx.toggleMusic() ? '🎵 音樂開啟' : '🎵 音樂關閉', 1400); break;
  }
});

/* 右鍵取消選目標 */
Util.el('view').addEventListener('contextmenu', (ev) => {
  if (State.mode === 'battle' && Battle.targeting != null) {
    ev.preventDefault();
    Battle.cancelTarget();
  }
});

/* ---------------- 按鈕 ---------------- */
const bind = (id, fn) => { const e = Util.el(id); if (e) e.onclick = () => { Sfx.resume(); fn(); }; };

bind('btn-endturn', () => Battle.endTurn());
bind('btn-start', () => Game.start());
bind('btn-continue', () => Game.continueRun());
bind('btn-codex', () => Game.openCodex());
bind('btn-replay-opening', () => Opening.replay());
bind('btn-codex-close', () => UI.hide('overlay-codex'));
bind('btn-help', () => UI.show('overlay-help'));
bind('btn-help-close', () => UI.hide('overlay-help'));
bind('btn-restart', () => Game.start());
bind('btn-to-title', () => Game.abandonRun());
bind('btn-deck', () => UI.openDeck());
bind('btn-deck-close', () => UI.hide('overlay-deck'));
bind('btn-campfire-leave', () => Campfire.leave());
bind('btn-pause-resume', () => Game.togglePause());
bind('btn-pause-help', () => { UI.hide('overlay-pause'); UI.show('overlay-help'); });
bind('btn-pause-abandon', () => {
  if (confirm('放棄這一輪回到標題？進度會消失。')) Game.abandonRun();
});
bind('btn-pause-mute', () => {
  const m = Sfx.toggleMute();
  Util.el('btn-pause-mute').textContent = m ? '🔇 音效：關' : '🔊 音效：開';
});
bind('btn-pause-music', () => {
  const on = Sfx.toggleMusic();
  Util.el('btn-pause-music').textContent = on ? '🎵 音樂：開' : '🎵 音樂：關';
});
bind('btn-menu', () => Game.togglePause());

/* 第一次點擊/按鍵時啟動音訊（瀏覽器自動播放限制） */
['pointerdown', 'keydown'].forEach(ev =>
  window.addEventListener(ev, () => Sfx.resume(), { once: true }));

/* ---------------- 觸控偵測 ----------------
   偵測到真的用手指操作才切換成兩段式出牌，不用 UA 判斷 ——
   二合一筆電同時有觸控與滑鼠，寫死會讓其中一種輸入變難用。
   一旦用手指碰過就切過去；之後再用滑鼠 hover 預覽仍然照常運作。 */
window.addEventListener('pointerdown', (ev) => {
  if (ev.pointerType === 'touch' && !Battle.touchMode) {
    Battle.touchMode = true;
    document.body.classList.add('touch-mode');
    UI.toast('觸控模式：點一下牌看傷害預覽，再點一次才出牌。', 4200);
  }
}, { passive: true });

/* 觸控時點空白處取消已選的牌 */
Util.el('view').addEventListener('pointerdown', (ev) => {
  if (State.mode !== 'battle' || !Battle.touchMode || Battle.armedIdx == null) return;
  if (ev.target.closest('.card, .enemy, #btn-endturn')) return;
  Battle.armedIdx = null;
  Battle.setHover(null);
  Battle.renderHand();
  UI.setHint([]);
}, { passive: true });

/* ---------------- 開機 ---------------- */
Meta.load();
Art.preload();
Opening.init();
UI.refreshSidebar();
Game.showTitle();
