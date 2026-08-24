/* =========================================================
   game.js — 主流程狀態機（對應 Unity 的 GameFlowManager）
   標題 → 探索 → 戰鬥/烹飪/商店/事件 → 頭目 → 下一層 → 結算
   ========================================================= */

const Game = {
  selectedHeat: 0,

  /* ================= 標題畫面 ================= */
  showTitle() {
    State.mode = 'title';
    UI.hideAllOverlays();
    UI.show('overlay-title');
    this.selectedHeat = Meta.maxHeatAvailable();
    this.renderTitle();
  },

  renderTitle() {
    const m = Meta.data;
    // 爐火選擇
    const row = Util.el('heat-row');
    row.innerHTML = '';
    const maxH = Meta.maxHeatAvailable();
    HEAT_LEVELS.forEach((h, i) => {
      const locked = i > maxH;
      const d = document.createElement('div');
      d.className = 'heat-chip' + (i === this.selectedHeat ? ' sel' : '') + (locked ? ' locked' : '');
      d.innerHTML = `<span class="hc-flame">${'🔥'.repeat(Math.max(1, i))}</span><span>${h.name}</span>`;
      UI.bindTip(d, locked ? '通關後解鎖下一級爐火' : `<b>${h.name}</b><br>${h.desc}`);
      if (!locked) d.onclick = () => { Sfx.click(); this.selectedHeat = i; this.renderTitle(); };
      row.appendChild(d);
    });
    Util.el('heat-desc').textContent = HEAT_LEVELS[this.selectedHeat].desc;

    // 續玩
    Util.el('btn-continue').classList.toggle('hidden', !Meta.hasRun());
    Util.el('btn-replay-opening').classList.toggle('hidden', !Opening.hasSeen());

    // 統計摘要
    const mins = Math.round(m.totalPlayMs / 60000);
    Util.el('title-stats').innerHTML = m.runs
      ? `已闖 <b>${m.runs}</b> 輪　通關 <b>${m.clears}</b> 次　最佳分數 <b>${m.bestScore}</b><br>
         精準切割累計 <b>${m.preciseCuts}</b>　過熟 <b>${m.overkills}</b>　食譜已解 <b>${m.recipes.length}/${Object.keys(RECIPES).length}</b>　累計 <b>${mins}</b> 分鐘`
      : '第一次下地窖？先看看操作說明。';
  },

  /* ================= 開始 / 續玩 ================= */
  start(heat) {
    const selectedHeat = heat == null ? this.selectedHeat : heat;
    if (Opening.shouldAutoPlay()) {
      Opening.play(() => this.beginRun(selectedHeat), { markSeen: true });
      return;
    }
    this.beginRun(selectedHeat);
  },

  beginRun(heat) {
    Sfx.resume();
    Meta.clearRun();
    State.newRun(heat);
    State.seenEvents = [];
    UI.hideAllOverlays();
    State.mode = 'explore';
    UI.setPalette(State.floor());
    UI.setMood('idle');
    UI.refreshSidebar();
    Sfx.playTrack('explore');
    Explore.render();
    if (!Meta.data.runs) this.showTutorial();
    UI.toast(`起始遺物：<b>${RELICS[State.relics[0]].name}</b> — ${RELICS[State.relics[0]].desc}`, 4200);
    Meta.saveRun();
  },

  continueRun() {
    Sfx.resume();
    if (!Meta.loadRun()) { this.start(); return; }
    UI.hideAllOverlays();
    State.mode = 'explore';
    UI.setPalette(State.floor());
    UI.setMood('idle');
    UI.refreshSidebar();
    Sfx.playTrack('explore');
    Explore.render();
    UI.toast(`回到 <b>${State.floor().zone}</b>，第 ${State.nodeIndex} 格。`);
    // 若存檔剛好停在強制事件節點上，重新觸發
    const node = State.currentNode();
    if (node && !node.done && ['fight', 'elite', 'boss', 'branch', 'event'].includes(node.type)) {
      setTimeout(() => Explore.arrive(), 400);
    }
  },

  startBattle(node) {
    State.mode = 'battle';
    Battle.maybeEat(node);
  },

  /* ================= 樓層推進 ================= */
  bossCleared() {
    if (State.floorIndex + 1 >= FLOORS.length) { this.win(); return; }
    // 頭目獎勵：遺物 + 選牌 + 補血
    const rid = Relics.grantRandom('boss') || Relics.grantRandom();
    if (rid) {
      Sfx.relic();
      UI.toast(`👑 頭目遺物 <b>${RELICS[rid].name}</b>：${RELICS[rid].desc}`, 4200);
    }
    const heal = Math.round(State.maxHp * 0.25);
    State.heal(heal);
    UI.refreshSidebar();
    Rewards.openCardReward(true);
    Util.el('prompt-hint').innerHTML = '';
    UI.toast(`頭目倒下！回復 <b>${heal}</b> HP，往前走就能下一層。`, 4000);
  },

  nextFloor() {
    if (State.mode !== 'explore') return;
    if (State.floorIndex + 1 >= FLOORS.length) { this.win(); return; }
    const next = State.floorIndex + 1;
    State.loadFloor(next);
    if (Relics.has('mysteryTin')) {
      const pIds = Object.keys(PARTS).slice(0, 10), lIds = Object.keys(PLANTS);
      State.addPart(Util.pick(pIds)); State.addPart(Util.pick(pIds));
      State.addPlant(Util.pick(lIds)); State.addPlant(Util.pick(lIds));
      UI.toast('🥫 神祕罐頭補給：2 份部位、2 份植物。');
    }
    UI.setPalette(State.floor());
    UI.refreshSidebar();
    Explore.render();
    Sfx.playTrack('explore');
    UI.float(50, 34, `⬇️ 第 ${next + 1} 層：${State.floor().zone}`, 'ft-gold');
    UI.effect('unlock', 50, 38, 'vfx-unlock');
    UI.toast(`進入 <b>${State.floor().zone}</b>。`, 3200);
    Meta.data.deepestFloor = Math.max(Meta.data.deepestFloor, next + 1);
    Meta.refreshUnlocks();
    Meta.save();
    Meta.saveRun();
  },

  /* ================= 結算 ================= */
  score(result) {
    const s = State.stats;
    const base =
      (State.floorIndex + 1) * 220 +
      s.preciseCuts * 22 -
      s.overkills * 9 +
      s.perfectMeals * 26 +
      s.mealsCooked * 8 +
      s.kills * 5 +
      s.elites * 45 +
      s.bosses * 130 +
      Math.floor(State.gold / 2) +
      s.maxCombo * 18 +
      (result === 'win' ? 500 : 0);
    return Math.max(0, Math.round(base * (1 + State.heat * 0.15)));
  },

  rank(score) {
    if (score >= 2600) return { g: 'S', t: '傳說主廚' };
    if (score >= 1900) return { g: 'A', t: '一星主廚' };
    if (score >= 1300) return { g: 'B', t: '熟練刀工' };
    if (score >= 800) return { g: 'C', t: '學徒出師' };
    return { g: 'D', t: '洗碗工' };
  },

  finish(result) {
    State.mode = 'end';
    Meta.clearRun();
    const { score, newly } = Meta.commitRun(result);
    const r = this.rank(score);
    const s = State.stats;
    const total = s.preciseCuts + s.overkills;
    const acc = total ? Math.round(s.preciseCuts / total * 100) : 0;
    const mins = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));

    Util.el('end-title').innerHTML = result === 'win'
      ? '🏆<br>地窖征服！'
      : '🍳<br>大廚倒下了…';
    Util.el('end-rank').innerHTML =
      `<div class="rank-g rank-${r.g}">${r.g}</div><div class="rank-t">${r.t}</div>
       <div class="rank-score">${score} 分</div>`;
    Util.el('end-stats').innerHTML = `
      <div class="es-grid">
        <div><b>${s.preciseCuts}</b><span>精準切割</span></div>
        <div><b>${s.overkills}</b><span>過熟毀肉</span></div>
        <div class="hl"><b>${acc}%</b><span>精準率</span></div>
        <div><b>×${s.maxCombo}</b><span>最高連段</span></div>
        <div><b>${s.mealsCooked}</b><span>烹飪道數</span></div>
        <div><b>${s.perfectMeals}</b><span>完美料理</span></div>
        <div><b>${s.kills}</b><span>擊殺</span></div>
        <div><b>${s.elites}/${s.bosses}</b><span>精英/頭目</span></div>
        <div><b>${State.floorIndex + 1}/${FLOORS.length}</b><span>抵達樓層</span></div>
        <div><b>${State.relics.length}</b><span>遺物</span></div>
        <div><b>${State.deck.length}</b><span>牌組張數</span></div>
        <div><b>${mins} 分</b><span>本輪時間</span></div>
      </div>
      <div class="es-heat">爐火：${HEAT_LEVELS[State.heat].name}${result === 'win' && State.heat + 1 < HEAT_LEVELS.length ? `　🔥 已解鎖「${HEAT_LEVELS[State.heat + 1].name}」` : ''}</div>`;

    Util.el('end-unlocks').innerHTML = newly.length
      ? `<div class="unlock-box">🎉 新解鎖卡牌：<b>${newly.join('、')}</b></div>` : '';

    UI.hide('battle-ui');
    UI.show('overlay-end');
    Sfx.stopMusic();
    Sfx.currentTrack = null;
    if (newly.length) setTimeout(() => Sfx.unlock(), 700);
  },

  win() { Sfx.win(); this.finish('win'); },
  lose() { UI.setMood('hurt'); Sfx.lose(); this.finish('lose'); },

  /* ================= 圖鑑 ================= */
  openCodex() {
    const m = Meta.data;
    const box = Util.el('codex-body');
    const recipeRows = Object.keys(RECIPES).map(key => {
      const r = RECIPES[key];
      const known = m.recipes.indexOf(key) >= 0;
      const [p, l] = key.split('+');
      return `<div class="cdx-row ${known ? '' : 'unknown'}">
        <span class="cdx-ico">${known ? r.icon : '❔'}</span>
        <span class="cdx-name">${known ? r.name : '？？？'}</span>
        <span class="cdx-recipe">${known ? `${PARTS[p].icon}${PARTS[p].name} ＋ ${PLANTS[l].icon}${PLANTS[l].name}` : '尚未做出'}</span>
        <span class="cdx-eff">${known ? r.fmt(r.tiers[2]) : ''}</span>
      </div>`;
    }).join('');

    const unlockRows = Object.keys(UNLOCK_RULES).map(key => {
      const done = Meta.isUnlocked(key);
      const cards = Object.keys(UNLOCKABLE_CARDS)
        .filter(cid => UNLOCKABLE_CARDS[cid] === key)
        .map(cid => CARDS[cid].name);
      return `<div class="cdx-row ${done ? '' : 'unknown'}">
        <span class="cdx-ico">${done ? '✅' : '🔒'}</span>
        <span class="cdx-name">${UNLOCK_RULES[key].label}</span>
        <span class="cdx-recipe">解鎖：${cards.join('、') || '—'}</span>
      </div>`;
    }).join('');

    const relicRows = Object.keys(RELICS).map(id => {
      const seen = m.relicsSeen.indexOf(id) >= 0;
      const r = RELICS[id];
      const relicArt = seen && Art.relic(id);
      const relicIcon = relicArt ? `<img src="${relicArt}" alt="" draggable="false">` : (seen ? r.icon : '❔');
      return `<div class="cdx-row ${seen ? '' : 'unknown'}">
        <span class="cdx-ico">${relicIcon}</span>
        <span class="cdx-name">${seen ? r.name : '？？？'}</span>
        <span class="cdx-recipe">${seen ? r.desc : '尚未見過'}</span>
      </div>`;
    }).join('');

    box.innerHTML = `
      <div class="cdx-sec">食譜圖鑑 <span>${m.recipes.length}/${Object.keys(RECIPES).length}</span></div>${recipeRows}
      <div class="cdx-sec">解鎖進度 <span>${m.unlocked.length}/${Object.keys(UNLOCK_RULES).length}</span></div>${unlockRows}
      <div class="cdx-sec">遺物收藏 <span>${m.relicsSeen.length}/${Object.keys(RELICS).length}</span></div>${relicRows}`;
    UI.show('overlay-codex');
  },

  /* ================= 教學與暫停 ================= */
  showTutorial() { UI.show('overlay-help'); },

  togglePause() {
    if (State.mode === 'title' || State.mode === 'end') return;
    const ov = Util.el('overlay-pause');
    if (ov.classList.contains('hidden')) {
      Util.el('pause-info').innerHTML =
        `${State.floor().zone}　第 ${State.floorIndex + 1}/${FLOORS.length} 層　爐火：${HEAT_LEVELS[State.heat].name}`;
      UI.show('overlay-pause');
    } else UI.hide('overlay-pause');
  },

  abandonRun() {
    Meta.clearRun();
    UI.hideAllOverlays();
    Sfx.stopMusic(); Sfx.currentTrack = null;
    this.showTitle();
  },
};
