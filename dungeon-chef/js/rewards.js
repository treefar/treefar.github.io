/* =========================================================
   rewards.js — 戰後三選一卡牌（對應 Unity 的 RewardSystem）
   稀有度加權；精英戰提高稀有卡機率；跳過換金幣
   ========================================================= */

const Rewards = {
  RARITY_W: { common: 62, uncommon: 30, rare: 8 },
  RARITY_W_ELITE: { common: 38, uncommon: 40, rare: 22 },

  rollPicks(elite) {
    const pool = Meta.rewardPool();
    const weights = elite ? this.RARITY_W_ELITE : this.RARITY_W;
    const items = pool.map(id => ({ id, w: weights[CARDS[id].rarity] || 10 }));
    const picks = [];
    const used = {};
    let guard = 0;
    while (picks.length < 3 && guard++ < 200) {
      const it = Util.weighted(items.filter(x => !used[x.id]));
      if (!it) break;
      used[it.id] = 1;
      picks.push(it.id);
    }
    return picks;
  },

  openCardReward(elite) {
    State.mode = 'reward';
    const row = Util.el('reward-cards');
    row.innerHTML = '';
    Util.el('reward-title').textContent = elite ? '精英獎勵——三選一' : '三選一';
    this.rollPicks(elite).forEach(cardId => {
      const el = UI.buildCardEl(cardId);
      el.onclick = () => {
        State.deck.push(cardId);
        State.stats.cardsAdded++;
        Sfx.unlock();
        UI.float(50, 36, `🃏 ${CARDS[cardId].name} 加入牌組！`, 'ft-gold');
        this.close();
      };
      row.appendChild(el);
    });
    const skipGold = 12 + State.floorIndex * 6;
    const skip = Util.el('btn-reward-skip');
    skip.textContent = `跳過（改拿 ${skipGold} 🪙）`;
    skip.onclick = () => {
      State.addGold(skipGold);
      Sfx.gold();
      UI.float(50, 40, `＋${skipGold} 🪙`, 'ft-gold');
      this.close();
    };
    UI.show('overlay-reward');
  },

  close() {
    if (State.mode !== 'reward') return;
    UI.hide('overlay-reward');
    State.mode = 'explore';
    UI.refreshSidebar();
    Explore.render();
    Meta.saveRun();
  },
};
