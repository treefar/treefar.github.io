/* =========================================================
   ui.js — 共用介面：側欄、遺物列、表情頭像、浮動文字、覆蓋層
   （對應 Unity 的 UIManager + 各 HUD Prefab）
   頭像表情切換點 = 之後掛 NPC 情緒系統的位置
   ========================================================= */

const UI = {
  /* ---------------- 覆蓋層 ---------------- */
  show(id) { const e = Util.el(id); if (e) e.classList.remove('hidden'); },
  hide(id) { const e = Util.el(id); if (e) e.classList.add('hidden'); },
  hideAllOverlays() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
  },

  /* ---------------- 側欄 ---------------- */
  refreshSidebar() {
    Util.el('hp-fill').style.width = (State.hp / State.maxHp * 100) + '%';
    Util.el('hp-text').textContent = `${State.hp}/${State.maxHp}`;
    Util.el('hp-fill').classList.toggle('danger', State.hp / State.maxHp <= 0.3);
    Util.el('gold-num').textContent = State.gold;
    Util.el('parts-num').textContent = State.parts.length + State.plants.length;

    // 便當盒（格數受遺物影響）
    const box = Util.el('lunchbox');
    const cap = State.lunchCap();
    box.innerHTML = '';
    for (let i = 0; i < cap; i++) {
      const meal = State.lunchbox[i];
      const slot = document.createElement('div');
      slot.className = 'lunch-slot';
      if (meal) {
        slot.classList.add('filled', 'tier-' + meal.tier);
        slot.innerHTML = `${meal.icon}<span class="meal-tier">${meal.tierName}</span>`;
        this.bindTip(slot, `<b>${meal.name}</b>（${meal.tierName}）<br>${meal.desc}`);
      } else {
        this.bindTip(slot, '空的便當格<br><i>在營火用「部位＋植物」做料理</i>');
      }
      box.appendChild(slot);
    }
    this.refreshMap();
    this.refreshRelics();
  },

  /* ---------------- 垂直地圖 ---------------- */
  refreshMap() {
    Util.el('zone-name').textContent = State.floor() ? State.floor().zone : '';
    Util.el('floor-tag').textContent = `第 ${State.floorIndex + 1} / ${FLOORS.length} 層`;
    const track = Util.el('map-track');
    const panel = Util.el('map-panel');
    const mapSrc = Art.map(`floor${State.floorIndex + 1}`);
    panel.style.setProperty('--map-art', mapSrc ? `url("${mapSrc}")` : 'none');
    track.innerHTML = '';
    State.nodes.forEach((node, i) => {
      const d = document.createElement('div');
      d.className = 'map-node';
      if (node.type === 'boss') d.classList.add('boss-node');
      if (node.type === 'elite') d.classList.add('elite-node');
      if (i < State.nodeIndex) d.classList.add('visited');
      if (i === State.nodeIndex) { d.classList.add('current'); d.textContent = '🔦'; }
      else d.textContent = NODE_ICONS[node.type] || '❓';
      this.bindTip(d, this.nodeLabel(node));
      track.appendChild(d);
    });
    const offset = Math.max(0, State.nodeIndex * 27 - 80);
    track.style.bottom = (-offset) + 'px';
  },

  nodeLabel(node) {
    switch (node.type) {
      case 'start': return '入口';
      case 'forage': return `採集點：${PLANTS[node.plant].name}`;
      case 'fight': return '戰鬥：' + node.enemies.map(e => ENEMIES[e].name).join('、');
      case 'elite': return '💪 精英戰：' + node.enemies.map(e => ENEMIES[e].name).join('、') + '<br><i>勝利必得遺物</i>';
      case 'boss': return '👑 頭目：' + ENEMIES[node.enemies[0]].name;
      case 'campfire': return '營火：烹飪／休息／磨刀';
      case 'chest': return '寶箱';
      case 'pachinko': return '部落青哥';
      case 'shop': return '廚具商販';
      case 'event': return '未知事件';
      case 'branch': return '岔路';
      default: return '';
    }
  },

  /* ---------------- 遺物列 ---------------- */
  refreshRelics() {
    const bar = Util.el('relic-bar');
    bar.innerHTML = '';
    State.relics.forEach(id => {
      const r = RELICS[id];
      if (!r) return;
      const d = document.createElement('div');
      d.className = 'relic tier-' + r.tier;
      const src = Art.relic(id);
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.draggable = false;
        d.appendChild(img);
      } else {
        d.textContent = r.icon;
      }
      this.bindTip(d, `<b>${r.name}</b><br>${r.desc}`);
      bar.appendChild(d);
    });
  },

  /* ---------------- 頭像表情 ---------------- */
  moodTimer: null,
  setMood(mood, ms) {
    const img = Util.el('portrait-img');
    const src = Art.face(mood) || Art.face('idle');
    if (img && src && img.getAttribute('src') !== src) img.setAttribute('src', src);
    const box = Util.el('portrait-box');
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
    box.dataset.mood = mood;
    if (this.moodTimer) clearTimeout(this.moodTimer);
    if (ms) this.moodTimer = setTimeout(() => this.setMood('idle'), ms);
  },

  /* ---------------- 浮動文字與特效 ---------------- */
  float(x, y, text, cls) {
    const layer = Util.el('fx-layer');
    const d = document.createElement('div');
    d.className = 'float-txt ' + (cls || 'ft-info');
    d.style.left = x + '%';
    d.style.top = y + '%';
    d.innerHTML = text;
    layer.appendChild(d);
    setTimeout(() => d.remove(), 1050);
  },

  /* 取得敵人在主視圖裡的百分比座標 */
  enemyPos(enemy) {
    const el = document.querySelector(`[data-uid="${enemy.uid}"]`);
    const v = Util.el('view').getBoundingClientRect();
    if (!el) return { x: 50, y: 34 };
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2 - v.left) / v.width * 100,
      y: (r.top - v.top) / v.height * 100,
    };
  },
  floatOnEnemy(enemy, text, cls, dy) {
    const p = this.enemyPos(enemy);
    this.float(p.x, Math.max(4, p.y + (dy == null ? 6 : dy)), text, cls);
  },
  slashOnEnemy(enemy) {
    const p = this.enemyPos(enemy);
    this.slashAt(p.x, p.y + 18);
  },
  hitFlash(enemy) {
    const el = document.querySelector(`[data-uid="${enemy.uid}"]`);
    if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
  },
  killEnemyEl(enemy) {
    const el = document.querySelector(`[data-uid="${enemy.uid}"]`);
    if (el) { el.classList.add('dying'); setTimeout(() => el.remove(), 560); }
    this.refreshSidebar();
  },

  slashAt(x, y) {
    const layer = Util.el('fx-layer');
    const src = Art.vfx('precise-slash');
    if (src) {
      const img = document.createElement('img');
      img.className = 'vfx-sprite vfx-slash';
      img.src = src; img.alt = ''; img.draggable = false;
      img.style.left = x + '%'; img.style.top = y + '%';
      layer.appendChild(img);
      setTimeout(() => img.remove(), 420);
      return;
    }
    const d = document.createElement('div');
    d.className = 'slash-fx';
    d.style.left = x + '%'; d.style.top = y + '%';
    layer.appendChild(d);
    setTimeout(() => d.remove(), 340);
  },

  effect(id, x, y, cls) {
    const src = Art.vfx(id);
    if (!src) return;
    const img = document.createElement('img');
    img.className = `vfx-sprite ${cls || ''}`;
    img.src = src; img.alt = ''; img.draggable = false;
    img.style.left = x + '%'; img.style.top = y + '%';
    Util.el('fx-layer').appendChild(img);
    setTimeout(() => img.remove(), 720);
  },
  effectOnEnemy(enemy, id, cls) {
    const p = this.enemyPos(enemy);
    this.effect(id, p.x, p.y + 18, cls);
  },
  heroAction(action) {
    const hero = Util.el('player-sprite');
    if (!hero) return;
    hero.classList.remove('attack');
    if (action === 'attack') {
      void hero.offsetWidth;
      hero.classList.add('attack');
      setTimeout(() => hero.classList.remove('attack'), 520);
    }
  },

  comboFlash(n) {
    if (n < 2) return;
    const layer = Util.el('fx-layer');
    const d = document.createElement('div');
    d.className = 'combo-flash';
    d.innerHTML = `<b>${n}</b> 連段精準！`;
    layer.appendChild(d);
    setTimeout(() => d.remove(), 900);
  },

  shakeView() {
    const v = Util.el('view');
    v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake');
  },

  /* 螢幕上方的通知條（解鎖、遺物、提示） */
  toast(text, ms) {
    const box = Util.el('toast-box');
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = text;
    box.appendChild(d);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, ms || 2800);
  },

  /* ---------------- 探索提示列 ---------------- */
  setHint(lines) {
    const box = Util.el('prompt-hint');
    box.innerHTML = '';
    (lines || []).forEach(l => {
      const d = document.createElement('div');
      d.className = 'hint-line';
      d.innerHTML = l;
      box.appendChild(d);
    });
  },

  /* ---------------- 卡牌 ---------------- */
  buildCardEl(key, hotkey) {
    const c = Cardlib.get(key);
    const d = document.createElement('div');
    d.className = `card t-${c.type}` + (c.upgraded ? ' upgraded' : '') + ` r-${c.rarity}`;
    d.dataset.cardKey = key;
    const typeName = { cut: '切割', prep: '備料', season: '調味' }[c.type];
    const art = Art.card(c.id);
    const artHtml = art
      ? `<div class="cart"><img src="${art}" alt="" draggable="false"></div>`
      : `<div class="cart cart-emoji">${c.icon}</div>`;
    d.innerHTML = `
      <div class="cost">${c.cost}</div>
      ${hotkey ? `<div class="hotkey">${hotkey}</div>` : ''}
      <div class="ctype">${typeName}</div>
      <div class="cname">${c.name}</div>
      ${artHtml}
      <div class="cdesc">${c.desc}</div>`;
    return d;
  },

  /* ---------------- 牌組檢視 ---------------- */
  openDeck() {
    const list = Util.el('deck-list');
    list.innerHTML = '';
    const sorted = State.deck.slice().sort((a, b) => {
      const ca = Cardlib.get(a), cb = Cardlib.get(b);
      const order = { cut: 0, prep: 1, season: 2 };
      return (order[ca.type] - order[cb.type]) || ca.cost - cb.cost || ca.name.localeCompare(cb.name);
    });
    Util.el('deck-count').textContent = `共 ${State.deck.length} 張`;
    sorted.forEach(key => list.appendChild(this.buildCardEl(key)));
    this.show('overlay-deck');
  },

  /* ---------------- 從牌組挑一張牌（磨刀／商店去牌共用） ----------------
     opts: { title, filter(key), onPick(key, deckIndex), cancelText } */
  pickCard(opts) {
    const list = Util.el('pick-list');
    list.innerHTML = '';
    Util.el('pick-title').textContent = opts.title || '選一張牌';
    const prevMode = State.mode;
    State.mode = 'pick';
    let any = false;
    State.deck.forEach((key, idx) => {
      if (opts.filter && !opts.filter(key, idx)) return;
      any = true;
      const el = this.buildCardEl(key);
      el.onclick = () => {
        Sfx.click();
        this.hide('overlay-pick');
        State.mode = prevMode;
        opts.onPick(key, idx);
        this.refreshSidebar();
      };
      list.appendChild(el);
    });
    if (!any) list.innerHTML = '<div class="pick-empty">沒有符合條件的牌。</div>';
    Util.el('btn-pick-cancel').textContent = opts.cancelText || '取消';
    Util.el('btn-pick-cancel').onclick = () => {
      Sfx.click();
      this.hide('overlay-pick');
      State.mode = prevMode;
      if (opts.onCancel) opts.onCancel();
    };
    this.show('overlay-pick');
  },

  /* ---------------- 樓層配色 ---------------- */
  setPalette(floor) {
    const app = Util.el('app');
    app.className = 'pal-' + (floor.palette || 'f1');
    const cor = Util.el('corridor');
    const bg = floor.bg ? Art.env(floor.bg) : null;
    cor.style.setProperty('--bg-art', bg ? `url("${bg}")` : 'none');
    cor.classList.toggle('has-bg', !!bg);
  },

  /* ---------------- 通用 tooltip ---------------- */
  tipEl: null,
  bindTip(el, html) {
    el.classList.add('has-tip');
    el.addEventListener('mouseenter', () => this.showTip(el, html));
    el.addEventListener('mouseleave', () => this.hideTip());
  },
  showTip(anchor, html) {
    if (!this.tipEl) {
      this.tipEl = document.createElement('div');
      this.tipEl.id = 'tooltip';
      document.body.appendChild(this.tipEl);
    }
    this.tipEl.innerHTML = html;
    this.tipEl.style.display = 'block';
    const r = anchor.getBoundingClientRect();
    const t = this.tipEl.getBoundingClientRect();
    let left = r.left + r.width / 2 - t.width / 2;
    let top = r.bottom + 8;
    if (top + t.height > window.innerHeight - 8) top = r.top - t.height - 8;
    this.tipEl.style.left = Util.clamp(left, 8, window.innerWidth - t.width - 8) + 'px';
    this.tipEl.style.top = Math.max(8, top) + 'px';
  },
  hideTip() { if (this.tipEl) this.tipEl.style.display = 'none'; },
};
