/* =========================================================
   cooking.js — 營火（對應 Unity 的 CampfireSystem + CookingSystem）
   營火提供三件事：烹飪（2 次）、休息回血（1 次）、磨刀升級卡（1 次）
   烹飪 = 選 1 部位 + 1 植物 → 下鍋 → 計時停針決定品質
   ========================================================= */

const Campfire = {
  node: null,

  open(node) {
    this.node = node;
    if (node.cooksLeft == null) node.cooksLeft = 2;
    if (node.restUsed == null) node.restUsed = false;
    State.mode = 'campfire';
    Sfx.playTrack('calm');
    const emberArt = Art.vfx('embers');
    const fire = document.querySelector('.cook-fire');
    if (fire) fire.innerHTML = emberArt
      ? `<img src="${emberArt}" alt="" draggable="false"><span>🍳</span>`
      : '🪵🔥🍳';
    this.render();
    UI.show('overlay-campfire');
  },

  render() {
    const n = this.node;
    const restHeal = Math.round(State.maxHp * 0.3);
    const canUpgrade = State.deck.some(k => Cardlib.canUpgrade(k));
    Util.el('campfire-opts').innerHTML = '';
    const opts = [
      { icon: '🍳', label: '烹飪', sub: `還可下鍋 ${n.cooksLeft} 次`,
        dis: n.cooksLeft <= 0 || State.lunchbox.length >= State.lunchCap(),
        disMsg: n.cooksLeft <= 0 ? '營火燒完了' : '便當盒滿了',
        act: () => Cooking.open(n) },
      { icon: '😴', label: '休息', sub: `回復 ${restHeal} HP`,
        dis: n.restUsed, disMsg: '已經用過了',
        act: () => {
          n.restUsed = true;
          const h = State.heal(restHeal);
          Sfx.cookOk();
          UI.setMood('happy', 1400);
          UI.toast(`睡了一覺，回復 <b>${h}</b> HP。`);
          UI.refreshSidebar(); this.render();
        } },
      { icon: '⚒️', label: '磨刀', sub: '升級一張卡牌',
        dis: n.restUsed || !canUpgrade, disMsg: n.restUsed ? '已經用過了' : '沒有可升級的牌',
        act: () => {
          UI.pickCard({
            title: '磨利哪一張？',
            filter: k => Cardlib.canUpgrade(k),
            onPick: (key, idx) => {
              const before = Cardlib.get(key).name;
              State.deck[idx] = Cardlib.upgrade(key);
              n.restUsed = true;
              Sfx.unlock();
              UI.toast(`<b>${before}</b> 磨利了 → <b>${Cardlib.get(State.deck[idx]).name}</b>`);
              this.render();
            },
          });
        } },
    ];
    opts.forEach(o => {
      const d = document.createElement('div');
      d.className = 'camp-opt' + (o.dis ? ' dis' : '');
      d.innerHTML = `<div class="co-icon">${o.icon}</div><div class="co-label">${o.label}</div>
        <div class="co-sub">${o.dis ? o.disMsg : o.sub}</div>`;
      if (!o.dis) d.onclick = () => { Sfx.click(); o.act(); };
      Util.el('campfire-opts').appendChild(d);
    });
  },

  leave() {
    if (State.mode !== 'campfire') return;
    if (this.node.cooksLeft <= 0 && this.node.restUsed) this.node.done = true;
    UI.hide('overlay-campfire');
    State.mode = 'explore';
    Sfx.playTrack('explore');
    Explore.render();
    Meta.saveRun();
  },
};

const Cooking = {
  node: null,
  selPart: null,
  selPlant: null,
  cooking: false,
  needlePos: 0,
  rafId: null,
  zones: null,

  /* 依遺物與爐火等級算出四個品質區間的寬度（百分比） */
  computeZones() {
    const b = BALANCE.cookZones;
    let perfect = b.perfect * Relics.cookPerfectMul() * State.heatMod().perfectShrink;
    perfect = Util.clamp(perfect, 4, 42);
    const rest = 100 - perfect;
    const sum = b.raw + b.cooked + b.charred;
    const raw = rest * b.raw / sum;
    const cooked = rest * b.cooked / sum;
    const charred = rest * b.charred / sum;
    return { raw, cooked, perfect, charred };
  },

  open(node) {
    this.node = node;
    State.mode = 'cook';
    this.selPart = null; this.selPlant = null; this.cooking = false;
    this.zones = this.computeZones();
    this.renderZones();
    UI.hide('cook-bar-wrap');
    this.renderChips();
    this.renderPreview();
    UI.show('overlay-cook');
    Util.el('btn-cook-leave').onclick = () => this.leave();
    Util.el('btn-cook-fire').onclick = () => this.startFire();
    Util.el('cook-bar').onclick = () => this.stopNeedle();
  },

  renderZones() {
    const z = this.zones;
    Util.el('cook-bar').querySelector('.zone-raw').style.width = z.raw + '%';
    Util.el('cook-bar').querySelector('.zone-cooked').style.width = z.cooked + '%';
    Util.el('cook-bar').querySelector('.zone-perfect').style.width = z.perfect + '%';
    Util.el('cook-bar').querySelector('.zone-charred').style.width = z.charred + '%';
  },

  renderChips() {
    Util.el('cook-count').textContent = `（還可下鍋 ${this.node.cooksLeft} 次）`;
    const partBox = Util.el('cook-parts');
    const plantBox = Util.el('cook-plants');
    partBox.innerHTML = ''; plantBox.innerHTML = '';

    /* 「對味」標示：讓玩家看得出哪兩樣配得起來（食譜效果仍要下鍋才知道） */
    const buildChips = (box, ids, defs, selKey, kind) => {
      const counts = {};
      ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
      const keys = Object.keys(counts);
      if (!keys.length) { box.innerHTML = '<span class="chip-empty">（空空如也）</span>'; return; }
      // 對面已選的食材決定誰要亮起來
      const otherSel = kind === 'part' ? this.selPlant : this.selPart;
      const matchList = otherSel
        ? (kind === 'part' ? PAIRS.byPlant[otherSel] : PAIRS.byPart[otherSel]) || []
        : null;

      keys.forEach(id => {
        const def = defs[id];
        const partners = (kind === 'part' ? PAIRS.byPart[id] : PAIRS.byPlant[id]) || [];
        const isMatch = matchList ? matchList.indexOf(id) >= 0 : false;
        const chip = document.createElement('div');
        chip.className = 'chip' + (this[selKey] === id ? ' sel' : '') + (isMatch ? ' pair' : '');
        chip.innerHTML = `${Art.inline(id, def.icon)}<span>${def.name}</span><b>×${counts[id]}</b>` +
          (partners.length ? `<i class="pair-mark">${isMatch ? '✨' : '📖'}</i>` : '');
        // tooltip 列出對味搭檔的名字（已做過的顯示菜名）
        if (partners.length) {
          const names = partners.map(pid => {
            const key = kind === 'part' ? id + '+' + pid : pid + '+' + id;
            const dishKnown = Meta.data.recipes.indexOf(key) >= 0;
            const pdef = kind === 'part' ? PLANTS[pid] : PARTS[pid];
            return `${pdef.icon}${pdef.name}${dishKnown ? ` → <b>${RECIPES[key].name}</b>` : ''}`;
          });
          UI.bindTip(chip, `<b>${def.name}</b><br>對味搭檔：<br>${names.join('<br>')}`);
        } else {
          UI.bindTip(chip, `<b>${def.name}</b><br><i>沒有專屬食譜，只能做神祕亂燉。</i>`);
        }
        chip.onclick = () => {
          if (this.cooking) return;
          Sfx.hover();
          this[selKey] = (this[selKey] === id) ? null : id;
          this.renderChips(); this.renderPreview();
        };
        box.appendChild(chip);
      });
    };
    buildChips(partBox, State.parts, PARTS, 'selPart', 'part');
    buildChips(plantBox, State.plants, PLANTS, 'selPlant', 'plant');
  },

  recipeKey() {
    if (!this.selPart || !this.selPlant) return null;
    return this.selPart + '+' + this.selPlant;
  },
  currentRecipe() {
    const k = this.recipeKey();
    if (!k) return null;
    return RECIPES[k] || FALLBACK_RECIPE;
  },

  renderPreview() {
    const box = Util.el('recipe-preview');
    const fireBtn = Util.el('btn-cook-fire');
    const r = this.currentRecipe();
    const boxFull = State.lunchbox.length >= State.lunchCap();
    const noCooks = this.node.cooksLeft <= 0;
    if (!r) {
      // 只選了一半：直接把「對味搭檔」列出來，玩家不必靠猜
      let hint = '';
      if (this.selPart) {
        const ps = PAIRS.byPart[this.selPart] || [];
        hint = ps.length
          ? `<b>${PARTS[this.selPart].name}</b> 對味的植物：${ps.map(id => `${PLANTS[id].icon}${PLANTS[id].name}`).join('、')}`
          : `<b>${PARTS[this.selPart].name}</b> 沒有專屬食譜，只能做神祕亂燉。`;
      } else if (this.selPlant) {
        const ps = PAIRS.byPlant[this.selPlant] || [];
        hint = ps.length
          ? `<b>${PLANTS[this.selPlant].name}</b> 對味的部位：${ps.map(id => `${PARTS[id].icon}${PARTS[id].name}`).join('、')}`
          : `<b>${PLANTS[this.selPlant].name}</b> 沒有專屬食譜，只能做神祕亂燉。`;
      }
      box.innerHTML = hint ||
        '選一份 <b>怪物部位</b> ＋ 一份 <b>植物香料</b>。<br><i>標了 📖 的食材有專屬食譜；選定一邊之後，另一邊會亮起 ✨ 告訴你哪些對味。</i>';
      fireBtn.disabled = true;
      return;
    }
    const known = RECIPES[this.recipeKey()] ? '' : '<span class="r-unknown">（無對應食譜）</span>';
    box.innerHTML = `
      <div class="r-name">${r.icon} ${r.name} ${known}</div>
      <span class="tier-raw-txt">半生／焦了：${r.fmt(r.tiers[0])}</span><br>
      <span class="tier-cooked-txt">熟透：${r.fmt(r.tiers[1])}</span><br>
      <span class="tier-perfect-txt">完美：${r.fmt(r.tiers[2])}</span>
      ${boxFull ? '<br><b class="warn">便當盒滿了！</b>' : ''}
      ${noCooks ? '<br><b class="warn">營火燒完了！</b>' : ''}`;
    fireBtn.disabled = boxFull || noCooks;
  },

  /* ---- 下鍋：針開始跑 ---- */
  startFire() {
    if (this.cooking || !this.currentRecipe()) return;
    this.cooking = true;
    this.needlePos = 0;
    Util.el('btn-cook-fire').disabled = true;
    UI.show('cook-bar-wrap');
    Sfx.sizzle();
    const needle = Util.el('cook-needle');
    const duration = BALANCE.cookDuration / Relics.cookSpeedMul();
    const t0 = performance.now();
    const tick = (t) => {
      if (!this.cooking) return;
      this.needlePos = Math.min(100, (t - t0) / duration * 100);
      needle.style.left = `calc(${this.needlePos}% - 2px)`;
      if (this.needlePos >= 100) { this.stopNeedle(); return; }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  /* ---- 起鍋：依針的位置決定品質 ---- */
  stopNeedle() {
    if (!this.cooking) return;
    cancelAnimationFrame(this.rafId);
    this.cooking = false;
    const pos = this.needlePos;
    const z = this.zones;
    const e1 = z.raw, e2 = z.raw + z.cooked, e3 = z.raw + z.cooked + z.perfect;

    let tier, tierName, tierIdx;
    if (pos < e1) { tier = 'raw'; tierName = '半生'; tierIdx = 0; }
    else if (pos < e2) { tier = 'cooked'; tierName = '熟透'; tierIdx = 1; }
    else if (pos < e3) { tier = 'perfect'; tierName = '完美'; tierIdx = 2; }
    else { tier = 'charred'; tierName = '焦了'; tierIdx = 0; }

    // 遺物修正
    if (tier === 'charred' && Relics.has('caramelSpatula')) { tier = 'cooked'; tierName = '熟透（焦糖鏟）'; tierIdx = 1; }
    if (Relics.has('gourmandNotes') && tierIdx < 2) { tierIdx++; tier = tierIdx === 2 ? 'perfect' : 'cooked';
      tierName = (tierIdx === 2 ? '完美' : '熟透') + '（老饕筆記）'; }

    const r = this.currentRecipe();
    const meal = {
      name: r.name, icon: r.icon, effect: r.effect,
      tier: tier === 'charred' ? 'raw' : tier, tierName,
      value: r.tiers[tierIdx], desc: r.fmt(r.tiers[tierIdx]),
    };
    State.lunchbox.push(meal);
    State.removePart(this.selPart);
    State.removePlant(this.selPlant);
    State.stats.mealsCooked++;
    if (tierIdx === 2) State.stats.perfectMeals++;
    this.node.cooksLeft--;
    if (RECIPES[this.recipeKey()]) Meta.unlockRecipe(this.recipeKey());

    if (tierIdx === 2) { Sfx.cookPerfect(); UI.setMood('happy', 1400); }
    else if (tier === 'charred' || tierIdx === 0) { Sfx.cookBad(); UI.setMood('hurt', 1000); }
    else { Sfx.cookOk(); UI.setMood('munch', 1300); }

    UI.float(50, 26, `${meal.icon}${meal.name}【${tierName}】`,
      tierIdx === 2 ? 'ft-gold' : tierIdx === 0 ? 'ft-overkill' : 'ft-info');

    this.selPart = null; this.selPlant = null;
    UI.hide('cook-bar-wrap');
    UI.refreshSidebar();
    this.renderChips();
    this.renderPreview();
    Meta.saveRun();
  },

  leave() {
    if (this.cooking || State.mode !== 'cook') return;
    UI.hide('overlay-cook');
    State.mode = 'campfire';
    Campfire.render();
  },
};
