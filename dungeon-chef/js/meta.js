/* =========================================================
   meta.js — 跨輪進度、解鎖、圖鑑與存檔（對應 Unity 的 SaveSystem + PlayerPrefs）
   localStorage：
     dc_meta  解鎖、累計統計、最佳成績、爐火上限
     dc_run   進行中的一輪（可續玩）
   ========================================================= */

const META_KEY = 'dungeonChef_meta_v3';
const RUN_KEY = 'dungeonChef_run_v3';

/* 解鎖條件說明（顯示在解鎖清單） */
const UNLOCK_RULES = {
  firstWin: { label: '擊敗第一位頭目', test: m => m.bossKills >= 1 },
  precise25: { label: '累計 25 次精準切割', test: m => m.preciseCuts >= 25 },
  cook10: { label: '累計烹飪 10 道料理', test: m => m.mealsCooked >= 10 },
  overkillLesson: { label: '累計 10 次過熟毀肉', test: m => m.overkills >= 10 },
  floor2: { label: '抵達發酵迴廊', test: m => m.deepestFloor >= 2 },
  floor3: { label: '抵達熾焰主廚房', test: m => m.deepestFloor >= 3 },
  clearRun: { label: '完整通關一次', test: m => m.clears >= 1 },
};

const Meta = {
  data: null,

  blank() {
    return {
      preciseCuts: 0, overkills: 0, mealsCooked: 0, perfectMeals: 0,
      kills: 0, bossKills: 0, eliteKills: 0, runs: 0, clears: 0,
      deepestFloor: 1, maxHeat: 0, bestScore: 0, bestScoreHeat: 0,
      unlocked: [], recipes: [], relicsSeen: [], totalPlayMs: 0,
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(META_KEY);
      this.data = raw ? Object.assign(this.blank(), JSON.parse(raw)) : this.blank();
    } catch (e) { this.data = this.blank(); }
    return this.data;
  },
  save() {
    try { localStorage.setItem(META_KEY, JSON.stringify(this.data)); } catch (e) { /* 私密模式忽略 */ }
  },

  /* ---------- 解鎖 ---------- */
  isUnlocked(key) { return this.data.unlocked.indexOf(key) >= 0; },
  /* 重新檢查所有條件，回傳這次新解鎖的卡牌名稱 */
  refreshUnlocks() {
    const newly = [];
    Object.keys(UNLOCK_RULES).forEach(key => {
      if (!this.isUnlocked(key) && UNLOCK_RULES[key].test(this.data)) {
        this.data.unlocked.push(key);
        Object.keys(UNLOCKABLE_CARDS).forEach(cid => {
          if (UNLOCKABLE_CARDS[cid] === key) newly.push(CARDS[cid].name);
        });
      }
    });
    if (newly.length) this.save();
    return newly;
  },

  /* 目前可用的獎勵卡池 */
  rewardPool() {
    const pool = BASE_POOL.slice();
    Object.keys(UNLOCKABLE_CARDS).forEach(cid => {
      if (this.isUnlocked(UNLOCKABLE_CARDS[cid])) pool.push(cid);
    });
    return pool;
  },

  unlockRecipe(key) {
    if (this.data.recipes.indexOf(key) < 0) { this.data.recipes.push(key); this.save(); }
  },
  unlockRelic(id) {
    if (this.data.relicsSeen.indexOf(id) < 0) { this.data.relicsSeen.push(id); this.save(); }
  },
  maxHeatAvailable() { return Util.clamp(this.data.maxHeat, 0, HEAT_LEVELS.length - 1); },

  /* ---------- 一輪結束後回寫累計 ---------- */
  commitRun(result) {
    const s = State.stats;
    const d = this.data;
    d.runs++;
    d.preciseCuts += s.preciseCuts;
    d.overkills += s.overkills;
    d.mealsCooked += s.mealsCooked;
    d.perfectMeals += s.perfectMeals;
    d.kills += s.kills;
    d.bossKills += s.bosses;
    d.eliteKills += s.elites;
    d.deepestFloor = Math.max(d.deepestFloor, State.floorIndex + 1);
    d.totalPlayMs += Math.max(0, Date.now() - (s.startedAt || Date.now()));
    if (result === 'win') {
      d.clears++;
      d.maxHeat = Math.max(d.maxHeat, Math.min(State.heat + 1, HEAT_LEVELS.length - 1));
    }
    const score = Game.score(result);
    if (score > d.bestScore) { d.bestScore = score; d.bestScoreHeat = State.heat; }
    this.save();
    return { score, newly: this.refreshUnlocks() };
  },

  /* ---------- 進行中的一輪 ---------- */
  hasRun() {
    try { return !!localStorage.getItem(RUN_KEY); } catch (e) { return false; }
  },
  saveRun() {
    if (State.mode === 'title' || State.mode === 'end') return;
    try { localStorage.setItem(RUN_KEY, JSON.stringify(State.serialize())); } catch (e) { /* ignore */ }
  },
  loadRun() {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (!d || d.v !== 3) return false;
      State.restore(d);
      return true;
    } catch (e) { return false; }
  },
  clearRun() {
    try { localStorage.removeItem(RUN_KEY); } catch (e) { /* ignore */ }
  },
};
