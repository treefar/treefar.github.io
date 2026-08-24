/* =========================================================
   battle.js — 卡牌戰鬥（對應 Unity 的 BattleSystem + CardResolver）

   核心設計：精準切割
   - 把敵人血量「剛好」砍到 0 → 收部位 + 連段獎勵（金幣／抽牌／能量）
   - 打過頭 → 過熟：肉毀了 + 連段歸零 + 累積油煙 debuff
   - 出牌前的「傷害預覽」讓玩家能真的算牌，這是整個玩法的策略核心

   resolve() 是唯一的傷害計算函式，預覽與實際結算共用同一份數學，
   確保畫面上寫的跟真的打出來的完全一致。
   ========================================================= */

const Battle = {
  enemies: [],
  drawPile: [], hand: [], discardPile: [], exhausted: [],
  energy: 3, maxEnergy: 3,
  playerBlock: 0, spice: 0, smoke: 0,
  seasonals: [],
  meal: null,
  turn: 0,
  targeting: null,
  hoverIdx: null,        // 目前滑鼠停在哪張手牌（傷害預覽用）
  armedIdx: null,        // 觸控：已點選待確認的手牌
  touchMode: false,      // 觸控裝置沒有 hover，改成「點兩下」流程
  node: null,
  busy: false,

  // 本場旗標
  combo: 0,
  firstCutUsed: false,
  firstCutThisTurn: false,
  lastCardType: null,
  discountNextCut: false,
  keepBlockFlag: false,
  antiOverkillLeft: 0,
  smokeGuard: 0,
  mealPreciseGold: 0,
  preciseSinceJar: 0,

  /* ================= 戰前開飯 ================= */
  maybeEat(node) {
    this.node = node;
    if (!State.lunchbox.length) { this.begin(null); return; }
    // 此時尚未建立新戰鬥；若沿用 battle，外部狀態檢查會讀到上一戰的
    // 敵人與手牌。用獨立模式表示「開戰前用餐」，選擇或略過後再由
    // begin() 正式切回 battle 並重建整場資料。
    State.mode = 'eat';
    const row = Util.el('eat-meals');
    row.innerHTML = '';
    State.lunchbox.forEach((meal, i) => {
      const d = document.createElement('div');
      d.className = 'meal-card';
      d.innerHTML = `
        <div class="m-emoji">${meal.icon}</div>
        <div class="m-name">${meal.name}</div>
        <div class="m-tier tier-${meal.tier}-txt">【${meal.tierName}】</div>
        <div class="m-desc">${meal.desc}</div>`;
      d.onclick = () => {
        State.lunchbox.splice(i, 1);
        UI.hide('overlay-eat');
        UI.setMood('munch', 1200);
        UI.refreshSidebar();
        Sfx.pickup();
        this.begin(meal);
      };
      row.appendChild(d);
    });
    Util.el('btn-eat-skip').onclick = () => {
      if (Util.el('overlay-eat').classList.contains('hidden')) return;
      UI.hide('overlay-eat'); this.begin(null);
    };
    UI.show('overlay-eat');
  },

  /* ================= 開戰 ================= */
  begin(meal) {
    State.mode = 'battle';
    this.meal = meal || null;
    this.enemies = this.node.enemies.map((id, i) => this.spawnEnemy(id, i === 0 && ENEMIES[id].boss));
    this.drawPile = Util.shuffle(State.deck);
    this.hand = []; this.discardPile = []; this.exhausted = [];
    this.seasonals = [];
    this.playerBlock = 0; this.spice = 0; this.smoke = 0;
    this.turn = 0; this.targeting = null; this.hoverIdx = null; this.armedIdx = null; this.busy = false;
    this.combo = 0; this.firstCutUsed = false; this.lastCardType = null;
    this.discountNextCut = false; this.keepBlockFlag = false;
    this.antiOverkillLeft = 0; this.smokeGuard = 0; this.mealPreciseGold = 0;
    this.preciseSinceJar = 0;
    this.maxEnergy = BALANCE.maxEnergy + Relics.energyBonus();
    this.extraDrawFirst = 0;
    this.extraEnergyFirst = 0;

    // 便當效果（開戰前先掛好）
    if (this.meal) {
      const m = this.meal;
      if (m.effect === 'healNow') {
        const h = State.heal(m.value);
        UI.float(22, 42, `+${h} HP`, 'ft-heal');
      }
      if (m.effect === 'antiOverkill') this.antiOverkillLeft = m.value;
      if (m.effect === 'smokeGuard') this.smokeGuard = m.value;
      if (m.effect === 'preciseGold') this.mealPreciseGold = m.value;
      if (m.effect === 'drawFirst') this.extraDrawFirst += m.value;
      if (m.effect === 'energyFirst') this.extraEnergyFirst += m.value;
    }
    // 鐵胃：空便當盒開戰有補償
    if (Relics.has('ironStomach') && !this.meal) { this.playerBlock += 12; this.spice += 3; }
    if (Relics.has('spiceJar')) this.spice += 2;
    if (Relics.has('chefHat')) this.extraDrawFirst += 1;

    UI.setHint([]);
    UI.show('battle-ui');
    Util.el('corridor-objects').innerHTML = '';
    this.rollIntents();
    this.renderEnemies();
    UI.setMood('angry', 1300);

    const isBoss = this.enemies.some(e => e.def.boss);
    Sfx.playTrack(isBoss ? 'boss' : 'battle');
    if (isBoss) Sfx.boss();
    const entranceDelay = isBoss ? 1700 : 350;
    setTimeout(() => {
      if (State.mode !== 'battle') return;
      this.enemies.forEach(e => e.silhouette = false);
      document.querySelectorAll('.enemy').forEach(el => el.classList.remove('silhouette'));
      if (this.meal) {
        const m = this.meal;
        if (m.effect === 'block') { this.playerBlock += m.value; UI.float(22, 44, `🛡️+${m.value}`, 'ft-info'); }
        if (m.effect === 'spice') { this.spice += m.value; UI.float(22, 44, `🌶️+${m.value}`, 'ft-info'); }
      }
      this.startTurn();
    }, entranceDelay);
  },

  spawnEnemy(id, silhouette) {
    const def = ENEMIES[id];
    const mod = State.heatMod();
    const mul = def.boss ? mod.enemyHp * mod.bossHp : mod.enemyHp;
    const hp = Math.round(def.hp * mul);
    return {
      uid: id + '_' + Math.random().toString(36).slice(2, 7),
      id, def, hp, maxHp: hp,
      block: def.startBlock || 0,
      tenderize: 0, rot: 0, weak: 0,
      nextMove: null, futureMove: null, lastMoveKey: null, repeats: 0,
      scryed: false, phase2: false,
      dead: false, harvested: false, silhouette: !!silhouette,
    };
  },

  alive() { return this.enemies.filter(e => !e.dead); },
  moveTable(e) { return (e.phase2 && e.def.phase2) ? e.def.phase2 : e.def.moves; },

  /* 預先擲出所有敵人的下一個行動（意圖才會誠實） */
  rollIntents() {
    this.alive().forEach(e => {
      if (!e.nextMove) e.nextMove = this.rollMove(e);
      e.futureMove = this.rollMove(e, e.nextMove);
    });
  },
  rollMove(e, avoid) {
    const table = this.moveTable(e);
    let pool = table;
    // 同一招不連三次
    if (e.repeats >= 2 && e.lastMoveKey != null && table.length > 1) {
      pool = table.filter(m => this.moveKey(m) !== e.lastMoveKey);
    }
    if (avoid && pool.length > 1) {
      const filtered = pool.filter(m => this.moveKey(m) !== this.moveKey(avoid));
      if (filtered.length) pool = filtered;
    }
    return Util.weighted(pool);
  },
  moveKey(m) { return `${m.atk || 0}_${m.times || 1}_${m.block || 0}_${m.summon || 0}_${m.smoke || 0}_${m.heal || 0}`; },

  /* ================= 回合開始 ================= */
  startTurn() {
    if (State.mode !== 'battle') return;
    this.turn++;
    State.stats.turns++;

    // 格擋清理
    if (this.keepBlockFlag) this.keepBlockFlag = false;
    else if (Relics.has('anvilBase')) this.playerBlock = Math.floor(this.playerBlock / 2);
    else this.playerBlock = 0;

    this.energy = this.maxEnergy;
    if (this.turn === 1) this.energy += this.extraEnergyFirst;
    this.spice = this.turn === 1 ? this.spice : 0;
    this.firstCutThisTurn = false;
    this.discountNextCut = false;

    // 調味牌（本場持續）
    this.seasonals.forEach(s => {
      if (s.healTurn) { const h = State.heal(s.healTurn); if (h) UI.float(20, 48, `🍲+${h}`, 'ft-heal'); }
      if (s.blockTurn) this.playerBlock += s.blockTurn;
      if (s.spiceTurn) this.spice += s.spiceTurn;
    });
    // 料理：每回合回血
    if (this.meal && this.meal.effect === 'regen') {
      const h = State.heal(this.meal.value);
      if (h) UI.float(20, 48, `🍮+${h}`, 'ft-heal');
    }
    // 遺物：活性碳濾網
    if (Relics.has('freshFilter') && this.smoke > 0) this.smoke--;

    // 油煙：滿 3 層就少抽一張
    let drawCount = BALANCE.handDraw;
    this.seasonals.forEach(s => { if (s.drawTurn) drawCount += s.drawTurn; });
    if (this.meal && this.meal.effect === 'drawFirst' && this.turn === 1) { /* 已計入 extraDrawFirst */ }
    if (this.turn === 1) drawCount += this.extraDrawFirst;
    let choked = 0;
    while (this.smoke >= BALANCE.smokeThreshold && drawCount > 1) {
      this.smoke -= BALANCE.smokeThreshold; drawCount--; choked++;
    }
    if (choked) UI.float(50, 56, `💨 油煙嗆人！少抽 ${choked} 張`, 'ft-overkill');

    // 慢燉鍋等每回合 AoE
    const aoeTurn = this.seasonals.reduce((s, x) => s + (x.aoeTurn || 0), 0);
    if (aoeTurn > 0) {
      this.alive().forEach(e => this.dealRaw(e, aoeTurn, { source: 'seasonal' }));
      // 回合開始的慢燉／季節性 AoE 也可能擊殺最後一名敵人；
      // 若不在此補做勝利判定，會留下 0 名存活敵人卻永遠停在 battle 的軟鎖。
      if (!this.alive().length) { this.checkVictory(); return; }
    }

    this.draw(drawCount);
    Util.el('btn-endturn').disabled = false;
    this.rollIntents();
    this.renderAll();
    if (!this.checkVictory()) Meta.saveRun();
  },

  draw(n) {
    let drew = 0;
    for (let i = 0; i < n; i++) {
      if (!this.drawPile.length) {
        this.drawPile = Util.shuffle(this.discardPile);
        this.discardPile = [];
      }
      if (!this.drawPile.length) break;
      if (this.hand.length >= BALANCE.handLimit) break;
      this.hand.push(this.drawPile.pop());
      drew++;
    }
    if (drew) Sfx.cardDraw();
    return drew;
  },

  /* =========================================================
     傷害計算：預覽與實際結算共用
     回傳 { hits:[{raw,absorbed,through}], through, overkill, kills,
            precise, remainHp, remainBlock }
     ========================================================= */
  resolve(card, enemy) {
    let hp = enemy.hp, block = enemy.block;
    let tender = enemy.tenderize;
    const hits = [];
    let killed = false, overkill = 0, precise = false;

    const capMode = card.capToHp || (card.type === 'cut' && this.antiOverkillLeft > 0);
    const total = card.hits || 1;

    // 直接精準歸零
    if (card.execute != null && enemy.hp <= card.execute) {
      hits.push({ raw: enemy.hp, absorbed: 0, through: enemy.hp, exec: true });
      return { hits, through: enemy.hp, overkill: 0, killed: true, precise: true,
        remainHp: 0, remainBlock: block, exec: true };
    }

    for (let h = 0; h < total; h++) {
      if (killed) break;
      let raw;
      if (card.halve) raw = Math.max(1, Math.ceil(hp / 2));
      else raw = card.dmg || 0;
      if (raw <= 0 && !card.halve) break;

      if (card.bonusIfBlock && block > 0) raw += card.bonusIfBlock;
      if (card.bonusIfLastCut && this.lastCardType === 'cut') raw += card.bonusIfLastCut;
      if (card.type === 'cut') {
        raw += this.spice;
        if (!this.firstCutUsed && h === 0 && Relics.has('whetstone')) raw += 3;
      }
      raw += tender;

      let absorbed = 0, through = raw;
      if (!card.halve) { absorbed = Math.min(block, raw); block -= absorbed; through = raw - absorbed; }
      if (capMode) through = Math.min(through, hp);
      if (card.nonLethal) through = Math.min(through, Math.max(0, hp - 1));

      const over = Math.max(0, through - hp);
      hp = Math.max(0, hp - through);
      hits.push({ raw, absorbed, through });
      if (hp <= 0) { killed = true; overkill = over; precise = (over === 0); }
    }

    const throughTotal = hits.reduce((s, x) => s + x.through, 0);
    return { hits, through: throughTotal, overkill, killed, precise,
      remainHp: hp, remainBlock: block };
  },

  /* ================= 出牌 ================= */
  needsTarget(card) {
    if (card.aoe) return false;
    return (card.dmg != null || card.halve || card.execute != null ||
      card.tenderize != null || card.rot != null || card.weak != null);
  },
  cardCost(card) {
    let c = card.cost;
    if (this.discountNextCut && card.type === 'cut') c = Math.max(0, c - 1);
    return c;
  },

  clickCard(idx) {
    if (this.busy || State.mode !== 'battle') return;
    const card = Cardlib.get(this.hand[idx]);
    if (!card || this.cardCost(card) > this.energy) { Sfx.tone(180, 0.08, { type: 'square', vol: 0.1 }); return; }

    // 觸控裝置沒有 hover，改成兩段式：第一下先亮出傷害預覽，第二下才真的出牌。
    // 沒有這一段，觸控玩家等於玩不到「算牌」這個核心機制。
    if (this.touchMode && this.armedIdx !== idx) {
      this.armedIdx = idx;
      this.setHover(idx);
      this.renderHand();
      Sfx.hover();
      const multi = this.needsTarget(card) && this.alive().length > 1;
      UI.setHint([multi
        ? `<kbd>點敵人</kbd>選擇「${card.name}」的目標`
        : `<kbd>再點一次</kbd>打出「${card.name}」，或點其他牌換一張`]);
      return;
    }
    this.armedIdx = null;

    if (this.needsTarget(card) && this.alive().length > 1) {
      this.targeting = idx;
      document.querySelectorAll('.enemy').forEach(el => el.classList.add('targetable'));
      UI.setHint([`<kbd>點擊</kbd>選擇「${card.name}」的目標（右鍵取消）`]);
      this.renderEnemies();
      return;
    }
    this.playCard(idx, this.alive()[0] || null);
  },

  cancelTarget() {
    this.targeting = null;
    this.armedIdx = null;
    document.querySelectorAll('.enemy').forEach(el => el.classList.remove('targetable'));
    UI.setHint([]);
    this.renderEnemies();
  },

  clickEnemy(uid) {
    const target = this.enemies.find(e => e.uid === uid && !e.dead);
    if (!target) return;
    // 一般流程：已進入選目標模式
    if (this.targeting != null) {
      const idx = this.targeting;
      this.cancelTarget();
      this.playCard(idx, target);
      return;
    }
    // 觸控流程：手上有已點選的牌，直接點敵人就出牌
    if (this.touchMode && this.armedIdx != null) {
      const idx = this.armedIdx;
      this.armedIdx = null;
      UI.setHint([]);
      this.playCard(idx, target);
    }
  },

  setHover(idx) {
    if (State.mode !== 'battle') return;
    if (this.hoverIdx === idx) return;
    this.hoverIdx = idx;
    this.renderEnemies();
  },

  playCard(idx, target) {
    const key = this.hand[idx];
    const card = Cardlib.get(key);
    if (!card) return;
    const cost = this.cardCost(card);
    if (cost > this.energy) return;

    this.energy -= cost;
    this.hand.splice(idx, 1);
    this.hoverIdx = null;
    if (card.exhaust) this.exhausted.push(key); else this.discardPile.push(key);
    if (this.discountNextCut && card.type === 'cut') this.discountNextCut = false;
    Sfx.cardPlay();

    if (card.type === 'cut') {
      const knife = Util.el('hand-knife');
      knife.classList.remove('swing'); void knife.offsetWidth; knife.classList.add('swing');
      Sfx.slash();
    }

    // ---- 自身效果 ----
    if (card.clearSmoke) { if (this.smoke > 0) UI.float(24, 50, '💨 油煙清空', 'ft-info'); this.smoke = 0; }
    if (card.block) {
      let b = card.block;
      if (card.partBonus) b += Math.min(card.partBonusMax || 99, State.parts.length * card.partBonus);
      this.playerBlock += b;
      Sfx.block();
      UI.float(24, 46, `🛡️+${b}`, 'ft-info');
    }
    if (card.keepBlock) this.keepBlockFlag = true;
    if (card.spice) this.spice += card.spice;
    if (card.smoke) this.gainSmoke(card.smoke);
    if (card.seasonal) {
      this.seasonals.push(card.seasonal);
      UI.float(50, 26, `${card.icon} ${card.name} 生效！`, 'ft-info');
    }
    if (card.scry) {
      this.alive().forEach(e => e.scryed = true);
      UI.float(50, 30, '⚖️ 看穿了敵人的下兩步', 'ft-info');
    }
    if (card.draw) this.draw(card.draw);
    if (card.discountNextCut) this.discountNextCut = true;

    // ---- 對敵效果 ----
    const targets = card.aoe ? this.alive().slice() : (target ? [target] : []);
    const tenderAdd = (card.tenderize || 0) + (card.tenderize ? Relics.tenderBonus() : 0);

    targets.forEach(t => {
      if (t.dead) return;
      if (card.dmg != null || card.halve || card.execute != null) {
        this.applyCut(card, t);
      }
      if (tenderAdd && !t.dead) {
        t.tenderize += tenderAdd;
        UI.floatOnEnemy(t, `🧂嫩+${tenderAdd}`, 'ft-info');
      }
      if (card.rot && !t.dead) {
        t.rot += card.rot;
        UI.floatOnEnemy(t, `🦠腐蝕+${card.rot}`, 'ft-info');
      }
      if (card.weak && !t.dead) {
        t.weak += card.weak;
        UI.floatOnEnemy(t, `🫗虛弱${card.weak}`, 'ft-info');
      }
    });

    if (card.type === 'cut' && targets.length) {
      this.firstCutUsed = true;
      if (this.antiOverkillLeft > 0) {
        this.antiOverkillLeft--;
        if (this.antiOverkillLeft === 0) UI.float(50, 34, '🍧 防過熟效果用完了', 'ft-info');
      }
    }
    this.lastCardType = card.type;

    this.renderAll();
    this.checkVictory();
  },

  /* 切割：走 resolve() 的結果逐段套用，確保與預覽一致 */
  applyCut(card, enemy) {
    // 首刀嫩化（料理效果）
    if (!this.firstCutThisTurn) {
      this.firstCutThisTurn = true;
      if (this.meal && this.meal.effect === 'tenderFirst') {
        enemy.tenderize += this.meal.value;
        UI.floatOnEnemy(enemy, `嫩化+${this.meal.value}`, 'ft-info');
      }
    }
    const r = this.resolve(card, enemy);
    enemy.block = r.remainBlock;
    enemy.hp = r.remainHp;

    UI.hitFlash(enemy);
    UI.heroAction('attack');
    UI.slashOnEnemy(enemy);
    UI.floatOnEnemy(enemy, r.exec ? '✨' + r.through : r.through, 'ft-dmg', -4);
    Sfx.hit(r.through >= 10);

    if (enemy.hp <= 0) {
      if (r.precise) this.onPrecise(enemy, card);
      else this.onOverkill(enemy, r.overkill, card);
      this.killEnemy(enemy);
    }
  },

  /* ---------- 精準切割 ---------- */
  onPrecise(enemy, card) {
    State.stats.preciseCuts++;
    this.combo++;
    State.stats.maxCombo = Math.max(State.stats.maxCombo, this.combo);
    Sfx.precise();
    UI.floatOnEnemy(enemy, this.combo >= 2 ? `精準切割 ×${this.combo}！` : '精準切割！', 'ft-precise', -12);
    UI.setMood('happy', 1300);
    UI.comboFlash(this.combo);

    const gold = Relics.preciseGold() + this.mealPreciseGold;
    State.addGold(gold);
    setTimeout(() => UI.float(50, 30, `＋${gold} 🪙`, 'ft-gold'), 260);
    Sfx.gold();

    this.draw(1);
    if (Relics.has('brassScale')) this.draw(1);
    if (this.combo >= 2) {
      this.energy++;
      setTimeout(() => UI.float(50, 36, `⚡ 連段！＋1 能量`, 'ft-precise'), 380);
    }

    if (enemy.def.part && !enemy.harvested) {
      enemy.harvested = true;
      State.addPart(enemy.def.part);
      const p = PARTS[enemy.def.part];
      setTimeout(() => UI.floatOnEnemy(enemy, `＋${p.icon}${p.name}`, 'ft-heal', -2), 420);
    }
    // 醃缸：每 3 次精準送一份部位
    if (Relics.has('picklingJar')) {
      this.preciseSinceJar++;
      if (this.preciseSinceJar >= 3) {
        this.preciseSinceJar = 0;
        const p = Util.pick(Object.keys(PARTS).slice(0, 8));
        State.addPart(p);
        setTimeout(() => UI.float(50, 44, `🏺 醃缸產出 ${PARTS[p].name}`, 'ft-heal'), 520);
      }
    }
  },

  /* ---------- 過熟 ---------- */
  onOverkill(enemy, overkill, card) {
    State.stats.overkills++;
    this.combo = 0;
    Sfx.overkill();
    UI.floatOnEnemy(enemy, `過熟！溢出 ${overkill}`, 'ft-overkill', -12);
    UI.effectOnEnemy(enemy, 'overcook-smoke', 'vfx-smoke');
    UI.setMood('hurt', 1000);

    const saved = Relics.has('boningKnife') && Math.random() < 0.45;
    if (enemy.def.part) {
      if (saved) {
        enemy.harvested = true;
        State.addPart(enemy.def.part);
        setTimeout(() => UI.floatOnEnemy(enemy, `🔪 剔骨刀救回 ${PARTS[enemy.def.part].name}！`, 'ft-heal', -2), 420);
      } else {
        setTimeout(() => UI.floatOnEnemy(enemy, '肉毀了…🫠', 'ft-overkill', -2), 420);
      }
    }
    this.gainSmoke(BALANCE.overkillSmoke);
    if (card && card.overflowBlock && overkill > 0) {
      this.playerBlock += overkill;
      setTimeout(() => UI.float(24, 46, `🛡️+${overkill}`, 'ft-info'), 320);
    }
  },

  gainSmoke(n) {
    let add = n;
    if (this.smokeGuard > 0) {
      const absorbed = Math.min(this.smokeGuard, add);
      this.smokeGuard -= absorbed; add -= absorbed;
      if (absorbed) UI.float(26, 52, `🫙 濾掉 ${absorbed} 層油煙`, 'ft-info');
    }
    if (add > 0) {
      this.smoke += add;
      UI.float(26, 52, `💨 油煙+${add}`, 'ft-overkill');
    }
  },

  /* 非卡牌來源的直接傷害（腐蝕、慢燉鍋）—— 不判定精準 */
  dealRaw(enemy, dmg, opts) {
    const absorbed = Math.min(enemy.block, dmg);
    enemy.block -= absorbed;
    const through = dmg - absorbed;
    enemy.hp = Math.max(0, enemy.hp - through);
    if (through > 0) UI.floatOnEnemy(enemy, `${opts && opts.icon || '🔥'}${through}`, 'ft-precise');
    if (enemy.hp <= 0) this.killEnemy(enemy);
  },

  killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    State.stats.kills++;
    if (this.meal && this.meal.effect === 'killHeal') {
      const h = State.heal(this.meal.value);
      if (h) UI.float(20, 48, `🥘+${h}`, 'ft-heal');
    }
    UI.killEnemyEl(enemy);
    // 敵人死亡是所有傷害來源共用的唯一出口。最後一名敵人倒下時，
    // 必須在這裡立即完成勝利轉換，避免新增卡牌／遺物／持續傷害時
    // 忘記在呼叫端補 checkVictory()，留下 battle + 0 alive 的軟鎖。
    if (State.mode === 'battle' && this.alive().length === 0) this.checkVictory();
  },

  /* ================= 敵方回合 ================= */
  endTurn() {
    if (this.busy || State.mode !== 'battle') return;
    this.cancelTarget();
    this.busy = true;
    this.hoverIdx = null;
    this.armedIdx = null;
    Util.el('btn-endturn').disabled = true;
    this.discardPile.push(...this.hand);
    this.hand = [];
    this.renderHand();

    const actors = this.alive();
    let delay = 320;
    actors.forEach(enemy => {
      setTimeout(() => { if (!enemy.dead && State.mode === 'battle') this.enemyAct(enemy); }, delay);
      delay += 620;
    });

    setTimeout(() => {
      if (State.mode !== 'battle') return;
      // 腐蝕結算
      this.alive().forEach(e => {
        if (e.rot > 0) {
          this.dealRaw(e, e.rot, { icon: '🦠' });
          e.rot--;
        }
        if (e.weak > 0) e.weak--;
        // 進入第二階段
        if (!e.phase2 && e.def.phase2 && e.hp <= e.maxHp * 0.5) {
          e.phase2 = true;
          e.nextMove = null;
          UI.float(50, 24, `😤 ${e.def.name} 動真格了！`, 'ft-overkill');
          Sfx.boss();
        }
      });
      this.busy = false;
      if (!this.checkVictory()) this.startTurn();
    }, delay + 220);
  },

  enemyAct(enemy) {
    const move = enemy.nextMove || this.rollMove(enemy);
    const key = this.moveKey(move);
    enemy.repeats = (key === enemy.lastMoveKey) ? enemy.repeats + 1 : 0;
    enemy.lastMoveKey = key;
    enemy.nextMove = null;
    enemy.scryed = false;

    if (move.atk != null) {
      const times = move.times || 1;
      const per = this.enemyAtk(enemy, move);
      let total = 0;
      for (let i = 0; i < times; i++) {
        let d = per;
        const absorbed = Math.min(this.playerBlock, d);
        this.playerBlock -= absorbed;
        d -= absorbed;
        if (d > 0) { State.damage(d); total += d; }
      }
      UI.shakeView();
      if (total > 0) { UI.setMood('hurt', 900); UI.effect('hurt', 22, 52, 'vfx-hurt'); Sfx.hurt(); } else { Sfx.block(); }
      UI.float(50, 62, total > 0 ? `-${total}` : '🛡️擋下！', total > 0 ? 'ft-dmg' : 'ft-info');
      UI.hitFlash(enemy);
      UI.refreshSidebar();
      if (State.hp <= 0) { Game.lose(); return; }
    }
    if (move.block != null) {
      enemy.block += move.block;
      UI.floatOnEnemy(enemy, `🛡️+${move.block}`, 'ft-info');
      Sfx.block();
    }
    if (move.heal) {
      const before = enemy.hp;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + move.heal);
      UI.floatOnEnemy(enemy, `💚+${enemy.hp - before}`, 'ft-heal');
      UI.effectOnEnemy(enemy, 'heal', 'vfx-heal');
    }
    if (move.smoke) {
      this.gainSmoke(move.smoke);
      UI.shakeView();
    }
    if (move.summon) {
      let spawned = 0;
      for (let i = 0; i < move.summon; i++) {
        if (this.alive().length >= 4) break;   // 場上總數上限，避免小怪無限堆疊
        const e = this.spawnEnemy('maggot', false);
        e.nextMove = this.rollMove(e);
        this.enemies.push(e);
        spawned++;
      }
      if (spawned) UI.float(50, 28, `🐣 召喚了 ${spawned} 隻小怪！`, 'ft-overkill');
    }
    this.rollIntents();
    this.renderEnemies();
    this.renderHud();
  },

  enemyAtk(enemy, move) {
    let d = move.atk + State.heatMod().enemyAtkBonus;
    if (enemy.weak > 0) d = Math.max(1, d - 3);
    return d;
  },

  /* ================= 勝利檢查 ================= */
  checkVictory() {
    if (State.mode !== 'battle') return true;
    if (this.alive().length > 0) return false;

    const kind = this.node.type;
    const isBoss = kind === 'boss';
    const isElite = kind === 'elite';
    if (isBoss) State.stats.bosses++;
    if (isElite) State.stats.elites++;

    const gold = isBoss ? 70 + Util.rand(30) : isElite ? 40 + Util.rand(20) : 14 + Util.rand(12);
    State.addGold(gold);
    this.node.done = true;
    this.busy = true;
    if (Relics.has('garlicBraid')) State.heal(5);

    // 勝利是必要狀態轉換，不能交給可能被瀏覽器節流的動畫計時器。
    // 動畫與音效可以延後，模式切換與獎勵必須在同一呼叫中確定完成。
    UI.float(50, 40, `勝利！＋${gold} 🪙`, 'ft-gold');
    UI.setMood('happy', 1500);
    Sfx.win();
    UI.hide('battle-ui');
    UI.refreshSidebar();
    Sfx.playTrack('explore');
    this.busy = false;
    if (isBoss) { Game.bossCleared(); }
    else {
      if (isElite) {
        const rid = Relics.grantRandom();
        if (rid) { Sfx.relic(); UI.float(50, 34, `${RELICS[rid].icon} 獲得遺物：${RELICS[rid].name}`, 'ft-gold'); }
      }
      Rewards.openCardReward(isElite);
    }
    return true;
  },

  /* ================= 渲染 ================= */
  renderAll() { this.renderEnemies(); this.renderHand(); this.renderHud(); },

  intentText(move, enemy) {
    if (!move) return '❓';
    if (move.atk != null) {
      const d = this.enemyAtk(enemy, move);
      const t = move.times ? `×${move.times}` : '';
      const extra = move.smoke ? ' 💨' : '';
      return `⚔️ ${d}${t}${extra}`;
    }
    if (move.block != null) return `🛡️ ${move.block}${move.smoke ? ' 💨' : ''}`;
    if (move.summon) return '🐣 召喚';
    if (move.heal) return `💚 ${move.heal}`;
    if (move.smoke) return `💨 油煙 ${move.smoke}`;
    return '❓';
  },

  /* 傷害預覽：滑鼠停在手牌上時，算給玩家看 */
  previewFor(enemy) {
    if (this.hoverIdx == null) return null;
    const key = this.hand[this.hoverIdx];
    if (!key) return null;
    const card = Cardlib.get(key);
    if (!card) return null;
    if (this.cardCost(card) > this.energy) return null;
    const dealsDamage = (card.dmg != null || card.halve || card.execute != null);
    if (!dealsDamage) return null;
    if (!card.aoe && this.targeting != null && this.hand[this.targeting] !== key) return null;
    const r = this.resolve(card, enemy);
    if (r.through <= 0 && !r.killed) return null;
    return r;
  },

  renderEnemies() {
    const stage = Util.el('enemy-stage');
    stage.innerHTML = '';
    this.alive().forEach(enemy => {
      const d = document.createElement('div');
      d.className = 'enemy' + (enemy.def.boss ? ' boss' : '') +
        (enemy.def.elite ? ' elite' : '') + (enemy.silhouette ? ' silhouette' : '');
      d.dataset.uid = enemy.uid;

      const badges = [];
      if (enemy.block > 0) badges.push(`<span class="badge-block">🛡️${enemy.block}</span>`);
      if (enemy.tenderize > 0) badges.push(`<span class="badge-tender">🧂嫩${enemy.tenderize}</span>`);
      if (enemy.rot > 0) badges.push(`<span class="badge-rot">🦠${enemy.rot}</span>`);
      if (enemy.weak > 0) badges.push(`<span class="badge-weak">🫗弱${enemy.weak}</span>`);

      const pv = this.previewFor(enemy);
      let pvHtml = '', ghost = '';
      if (pv) {
        const pct = Math.max(0, pv.remainHp / enemy.maxHp * 100);
        const lostPct = Math.max(0, enemy.hp / enemy.maxHp * 100) - pct;
        ghost = `<div class="enemy-hpghost" style="left:${pct}%;width:${lostPct}%"></div>`;
        if (pv.killed && pv.precise) pvHtml = `<div class="pv pv-precise">✨ 精準切割</div>`;
        else if (pv.killed) pvHtml = `<div class="pv pv-over">⚠ 過熟 +${pv.overkill}</div>`;
        else pvHtml = `<div class="pv pv-left">→ 剩 ${pv.remainHp}</div>`;
      }

      const intent = this.intentText(enemy.nextMove, enemy);
      const future = enemy.scryed
        ? `<span class="intent-next">下一步 ${this.intentText(enemy.futureMove, enemy)}</span>` : '';

      d.innerHTML = `
        <div class="intent">${intent}${future}</div>
        ${Art.sprite('enemies', enemy.id, enemy.def.icon, 'enemy-art')}
        <div class="enemy-name">${enemy.def.elite ? '💪 ' : ''}${enemy.def.name}</div>
        <div class="enemy-hpbar">
          <div class="enemy-hpfill" style="width:${enemy.hp / enemy.maxHp * 100}%"></div>
          ${ghost}
          <div class="enemy-hptext">${enemy.hp}/${enemy.maxHp}</div>
        </div>
        <div class="enemy-badges">${badges.join('')}</div>
        ${pvHtml}`;
      d.onclick = () => this.clickEnemy(enemy.uid);
      stage.appendChild(d);
    });
  },

  renderHand() {
    const box = Util.el('hand-cards');
    box.innerHTML = '';
    const n = this.hand.length;
    this.hand.forEach((key, i) => {
      const card = Cardlib.get(key);
      const el = UI.buildCardEl(key, i + 1);
      const mid = (n - 1) / 2;
      el.style.setProperty('--tilt', ((i - mid) * 4) + 'deg');
      el.style.setProperty('--dip', (Math.abs(i - mid) * 7) + 'px');
      const cost = this.cardCost(card);
      if (cost !== card.cost) {
        const c = el.querySelector('.cost');
        if (c) { c.textContent = cost; c.classList.add('discounted'); }
      }
      if (cost > this.energy) el.classList.add('unplayable');
      else el.classList.add('playable-glow');
      if (this.targeting === i) el.classList.add('selected');
      if (this.armedIdx === i) el.classList.add('armed');
      el.onclick = () => this.clickCard(i);
      // 用 pointer 事件並排除 touch：觸控裝置的 pointerenter 要等手指按下去才觸發，
      // 拿它當預覽等於沒有預覽，所以觸控走 clickCard 裡的兩段式流程。
      el.onpointerenter = (ev) => { if (ev.pointerType !== 'touch') this.setHover(i); };
      el.onpointerleave = (ev) => { if (ev.pointerType !== 'touch') this.setHover(null); };
      box.appendChild(el);
    });
    Util.el('draw-num').textContent = this.drawPile.length;
    Util.el('discard-num').textContent = this.discardPile.length;
  },

  renderHud() {
    Util.el('energy-num').textContent = `${this.energy}/${this.maxEnergy}`;
    const st = Util.el('player-status');
    const rows = [];
    if (this.playerBlock > 0) rows.push(`<span class="st-block">🛡️ 格擋 ${this.playerBlock}</span>`);
    if (this.spice > 0) rows.push(`<span class="st-spice">🌶️ 香料 ${this.spice}</span>`);
    if (this.smoke > 0) rows.push(`<span class="st-smoke">💨 油煙 ${this.smoke}/${BALANCE.smokeThreshold}</span>`);
    if (this.combo > 0) rows.push(`<span class="st-combo">✨ 精準連段 ×${this.combo}</span>`);
    if (this.antiOverkillLeft > 0) rows.push(`<span class="st-safe">🍧 防過熟 ${this.antiOverkillLeft}</span>`);
    if (this.smokeGuard > 0) rows.push(`<span class="st-safe">🫙 濾煙 ${this.smokeGuard}</span>`);
    this.seasonals.forEach(s => {
      if (s.healTurn) rows.push(`<span>🍲 回合回血 ${s.healTurn}</span>`);
      if (s.blockTurn) rows.push(`<span>🧈 回合格擋 ${s.blockTurn}</span>`);
      if (s.spiceTurn) rows.push(`<span>🧂 回合香料 ${s.spiceTurn}</span>`);
      if (s.drawTurn) rows.push(`<span>🎯 回合多抽 ${s.drawTurn}</span>`);
      if (s.aoeTurn) rows.push(`<span>🥘 回合全體 ${s.aoeTurn}</span>`);
    });
    if (this.meal) {
      const tag = { block: '🛡️', spice: '🌶️', regen: '🍮', tenderFirst: '🍛', killHeal: '🥘',
        healNow: '🥣', energyFirst: '⚡', drawFirst: '🃏', preciseGold: '🪙',
        antiOverkill: '🍧', smokeGuard: '🫙' }[this.meal.effect] || '🍱';
      rows.push(`<span class="st-meal">${tag} ${this.meal.name}</span>`);
    }
    st.innerHTML = rows.join('');
    this.renderHand();
  },
};
