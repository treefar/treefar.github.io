/* =========================================================
   relics.js — 遺物系統（對應 Unity 的 RelicSystem + IRelicHook）
   遺物只負責「持有 / 授予 / 顯示」，實際效果由各系統呼叫 Relics.has() 查詢。
   這樣移植 Unity 時可一對一換成 ScriptableObject + event 訂閱。
   ========================================================= */

const Relics = {
  has(id) { return State.relics.indexOf(id) >= 0; },
  count() { return State.relics.length; },

  /* 授予遺物並套用「立即生效」的部分 */
  grant(id) {
    if (!id || !RELICS[id] || this.has(id)) return false;
    State.relics.push(id);
    if (id === 'chefApron') { State.maxHp += 12; State.heal(12); }
    if (id === 'chefsMedal') { State.maxHp = Math.max(20, State.maxHp - 8); State.hp = Math.min(State.hp, State.maxHp); }
    Meta.unlockRelic(id);
    if (typeof UI !== 'undefined') { UI.refreshRelics(); UI.refreshSidebar(); }
    return true;
  },

  /* 依 tier 抽一個還沒拿到的遺物 */
  pool(tier) {
    return Object.keys(RELICS).filter(id => !this.has(id) && (!tier || RELICS[id].tier === tier));
  },
  grantRandom(tier) {
    let p = this.pool(tier);
    if (!p.length) p = this.pool();          // 該階級抽完就退回全池
    if (!p.length) return null;
    const id = Util.pick(p);
    this.grant(id);
    return id;
  },

  /* 每回合能量加成 */
  energyBonus() { return this.has('chefsMedal') ? 1 : 0; },

  /* 精準切割金幣 */
  preciseGold() { return this.has('goldenLadle') ? 8 : BALANCE.preciseGold; },

  /* 嫩化加成 */
  tenderBonus() { return this.has('saltCellar') ? 1 : 0; },

  /* 烹飪：完美區間倍率與指針速度倍率 */
  cookPerfectMul() { return this.has('ovenMitt') ? 1.8 : 1; },
  cookSpeedMul() { return this.has('sandGlass') ? 0.7 : 1; },
};
