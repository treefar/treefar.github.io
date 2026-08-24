/* =========================================================
   state.js — 全域遊戲狀態（對應 Unity 的 GameManager 單例）
   只放「資料」與最小操作；畫面更新一律交給 ui.js
   ========================================================= */

const State = {
  // 玩家
  maxHp: 72,
  hp: 72,
  gold: 0,
  deck: [],          // 卡牌 key 陣列（`id` 或 `id+`）
  lunchbox: [],      // [{name,icon,effect,tier,tierName,value,desc}]
  parts: [],         // 怪物部位 id
  plants: [],        // 植物 id
  relics: [],        // 遺物 id

  // 進度
  heat: 0,           // 爐火等級
  floorIndex: 0,     // 0..2
  nodes: [],         // 本層節點（branch 選擇後就地展開）
  nodeIndex: 0,
  mode: 'title',     // title/explore/battle/cook/pachinko/reward/shop/event/branch/end
  seenTutorial: false,

  // 統計
  stats: null,

  /* ---------- 難度修正 ---------- */
  heatMod() {
    const h = this.heat;
    return {
      enemyHp: h >= 1 ? 1.10 : 1,
      bossHp: h >= 5 ? 1.20 : 1,
      startHpPenalty: h >= 2 ? 8 : 0,
      enemyAtkBonus: h >= 3 ? 2 : 0,
      perfectShrink: h >= 4 ? 0.65 : 1,
      extraElite: h >= 5,
    };
  },

  /* ---------- 開新的一輪 ---------- */
  newRun(heat) {
    this.heat = heat || 0;
    const mod = this.heatMod();
    this.maxHp = BALANCE.baseMaxHp - mod.startHpPenalty;
    this.hp = this.maxHp;
    this.gold = BALANCE.startGold;
    this.deck = STARTING_DECK.slice();
    this.lunchbox = []; this.parts = []; this.plants = []; this.relics = [];
    this.floorIndex = 0;
    this.stats = {
      preciseCuts: 0, overkills: 0, mealsCooked: 0, perfectMeals: 0,
      kills: 0, elites: 0, bosses: 0, cardsAdded: 0, goldEarned: 0,
      maxCombo: 0, damageTaken: 0, turns: 0, startedAt: Date.now(),
    };
    this.loadFloor(0);
    Relics.grant(Util.pick(STARTER_RELICS));
  },

  /* 載入指定樓層的節點串 */
  loadFloor(i) {
    this.floorIndex = i;
    const floor = FLOORS[i];
    this.nodes = JSON.parse(JSON.stringify(floor.nodes));
    // 地獄爐：每層多塞一場精英
    if (this.heatMod().extraElite) {
      const elite = this.nodes.find(n => n.type === 'elite');
      if (elite) this.nodes.splice(Math.floor(this.nodes.length / 2), 0, JSON.parse(JSON.stringify(elite)));
    }
    this.nodes.unshift({ type: 'start' });
    this.nodeIndex = 0;
  },

  floor() { return FLOORS[this.floorIndex]; },
  currentNode() { return this.nodes[this.nodeIndex]; },
  nextNode() { return this.nodes[this.nodeIndex + 1]; },
  atFloorEnd() { return !this.nextNode(); },

  lunchCap() { return 3 + (Relics.has('bentoBox') ? 1 : 0); },

  heal(n) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + n);
    return this.hp - before;
  },
  damage(n) {
    this.hp = Math.max(0, this.hp - n);
    this.stats.damageTaken += n;
    return this.hp <= 0;
  },
  addGold(n) { this.gold += n; this.stats.goldEarned += n; },

  addPart(id) { if (id && PARTS[id]) this.parts.push(id); },
  addPlant(id) { if (id && PLANTS[id]) this.plants.push(id); },
  removePart(id) { const i = this.parts.indexOf(id); if (i >= 0) this.parts.splice(i, 1); },
  removePlant(id) { const i = this.plants.indexOf(id); if (i >= 0) this.plants.splice(i, 1); },

  /* 序列化（存檔用；不含 stats.startedAt 之外的衍生資料） */
  serialize() {
    return {
      v: 3, maxHp: this.maxHp, hp: this.hp, gold: this.gold,
      deck: this.deck, lunchbox: this.lunchbox, parts: this.parts,
      plants: this.plants, relics: this.relics, heat: this.heat,
      floorIndex: this.floorIndex, nodes: this.nodes, nodeIndex: this.nodeIndex,
      stats: this.stats, seenTutorial: this.seenTutorial,
      seenEvents: this.seenEvents || [],
    };
  },
  restore(d) {
    Object.assign(this, {
      maxHp: d.maxHp, hp: d.hp, gold: d.gold, deck: d.deck,
      lunchbox: d.lunchbox, parts: d.parts, plants: d.plants,
      relics: d.relics, heat: d.heat, floorIndex: d.floorIndex,
      nodes: d.nodes, nodeIndex: d.nodeIndex, stats: d.stats,
      seenTutorial: !!d.seenTutorial, seenEvents: d.seenEvents || [],
    });
  },
};

/* 常用小工具 */
const Util = {
  rand(n) { return Math.floor(Math.random() * n); },
  pick(arr) { return arr[this.rand(arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.rand(i + 1); [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  /* 權重挑選：items 內每個元素有 .w */
  weighted(items) {
    const total = items.reduce((s, it) => s + (it.w || 1), 0);
    let r = Math.random() * total;
    for (const it of items) { r -= (it.w || 1); if (r <= 0) return it; }
    return items[items.length - 1];
  },
  el(id) { return document.getElementById(id); },
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
};
