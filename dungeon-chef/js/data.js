/* =========================================================
   data.js — 全遊戲資料表（對應 Unity 的 ScriptableObject）
   卡牌 / 敵人 / 食材 / 食譜 / 遺物 / 事件 / 樓層節點 / 難度階級
   ========================================================= */

/* =========================================================
   卡牌
   type : cut(切割) prep(備料) season(調味)
   rarity: common / uncommon / rare
   ---- 傷害與精準相關 ----
   dmg          基礎傷害
   hits         連擊次數
   execute:N    目標 HP≤N 時直接精準歸零
   nonLethal    傷害最低留 1 HP（絕不誤殺，精準佈局用）
   capToHp      傷害不會超過目標剩餘 HP（保證不過熟）
   halve        傷害 = 目標當前 HP 的一半（向上取整）
   overflowBlock 溢出傷害轉為格擋
   aoe          對所有敵人生效
   ---- 其他 ----
   block spice tenderize rot weak draw smoke exhaust keepBlock scry
   bonusIfBlock  目標有格擋時的額外傷害
   bonusIfLastCut 上一張打出的是切割牌時的額外傷害
   partBonus     每份怪物部位追加格擋（上限 partBonusMax）
   discountNextCut 本回合下一張切割牌費用 -1
   seasonal: { healTurn, blockTurn, spiceTurn, drawTurn, aoeTurn }
   up: 升級版覆寫欄位（牌組中以 `id+` 表示）
   ========================================================= */
const CARDS = {
  /* ---------------- 切割 cut ---------------- */
  quickSlash: {
    name: '快斬', type: 'cut', cost: 1, icon: '🔪', rarity: 'common',
    dmg: 4, draw: 1, desc: '造成 <b>4</b> 傷害。抽 1 張牌。',
    up: { dmg: 6, desc: '造成 <b>6</b> 傷害。抽 1 張牌。' },
  },
  skewerToss: {
    name: '串籤投擲', type: 'cut', cost: 0, icon: '🍢', rarity: 'common',
    dmg: 3, desc: '造成 <b>3</b> 傷害。',
    up: { dmg: 5, desc: '造成 <b>5</b> 傷害。' },
  },
  trimFat: {
    name: '修邊', type: 'cut', cost: 0, icon: '✂️', rarity: 'common',
    dmg: 1, draw: 1, desc: '造成 <b>1</b> 傷害。抽 1 張牌。<i>微調血量的好工具。</i>',
    up: { dmg: 2, desc: '造成 <b>2</b> 傷害。抽 1 張牌。' },
  },
  twinSlash: {
    name: '雙連斬', type: 'cut', cost: 1, icon: '⚔️', rarity: 'common',
    dmg: 4, hits: 2, desc: '造成 <b>4</b> 傷害 2 次。',
    up: { dmg: 5, desc: '造成 <b>5</b> 傷害 2 次。' },
  },
  julienne: {
    name: '細絲切', type: 'cut', cost: 1, icon: '🌾', rarity: 'uncommon',
    dmg: 2, hits: 3, desc: '造成 <b>2</b> 傷害 3 次。',
    up: { hits: 4, desc: '造成 <b>2</b> 傷害 4 次。' },
  },
  bigChop: {
    name: '大剁', type: 'cut', cost: 2, icon: '🪓', rarity: 'common',
    dmg: 12, desc: '造成 <b>12</b> 傷害。',
    up: { dmg: 16, desc: '造成 <b>16</b> 傷害。' },
  },
  heavyCleave: {
    name: '豪邁劈', type: 'cut', cost: 2, icon: '🔨', rarity: 'uncommon',
    dmg: 14, overflowBlock: true, desc: '造成 <b>14</b> 傷害。溢出傷害轉為格擋。',
    up: { dmg: 18, desc: '造成 <b>18</b> 傷害。溢出傷害轉為格擋。' },
  },
  marinateSlash: {
    name: '醃製斬', type: 'cut', cost: 1, icon: '🧂', rarity: 'common',
    dmg: 4, tenderize: 2, desc: '造成 <b>4</b> 傷害。施加 <b>2</b> 層嫩化。',
    up: { tenderize: 3, desc: '造成 <b>4</b> 傷害。施加 <b>3</b> 層嫩化。' },
  },
  chefFinish: {
    name: '主廚收刀', type: 'cut', cost: 1, icon: '✨', rarity: 'uncommon',
    dmg: 3, execute: 6, desc: '目標 HP≤<b>6</b> 時直接<b>精準歸零</b>，否則造成 3 傷害。',
    up: { execute: 10, desc: '目標 HP≤<b>10</b> 時直接<b>精準歸零</b>，否則造成 3 傷害。' },
  },
  boneSaw: {
    name: '骨鋸', type: 'cut', cost: 1, icon: '🦴', rarity: 'uncommon',
    dmg: 9, nonLethal: true, desc: '造成 <b>9</b> 傷害，但<b>絕不致死</b>（最低留 1 HP）。',
    up: { dmg: 13, desc: '造成 <b>13</b> 傷害，但<b>絕不致死</b>（最低留 1 HP）。' },
  },
  measuredCut: {
    name: '量準斬', type: 'cut', cost: 1, icon: '📏', rarity: 'rare',
    dmg: 8, capToHp: true, desc: '造成 <b>8</b> 傷害，但傷害<b>絕不超過</b>目標剩餘生命。<i>永遠不會過熟。</i>',
    up: { dmg: 12, desc: '造成 <b>12</b> 傷害，但傷害<b>絕不超過</b>目標剩餘生命。' },
  },
  halveCut: {
    name: '對半分', type: 'cut', cost: 1, icon: '🪞', rarity: 'rare',
    halve: true, desc: '造成傷害 = 目標<b>當前生命的一半</b>（向上取整）。',
    up: { cost: 0, desc: '造成傷害 = 目標<b>當前生命的一半</b>（向上取整）。' },
  },
  cleaverFlurry: {
    name: '亂刀', type: 'cut', cost: 2, icon: '💫', rarity: 'uncommon',
    dmg: 3, hits: 4, desc: '造成 <b>3</b> 傷害 4 次。',
    up: { hits: 5, desc: '造成 <b>3</b> 傷害 5 次。' },
  },
  tenderStrike: {
    name: '拍鬆', type: 'cut', cost: 1, icon: '🔩', rarity: 'common',
    dmg: 2, tenderize: 3, desc: '造成 <b>2</b> 傷害。施加 <b>3</b> 層嫩化。',
    up: { tenderize: 4, desc: '造成 <b>2</b> 傷害。施加 <b>4</b> 層嫩化。' },
  },
  skimSlice: {
    name: '削片', type: 'cut', cost: 0, icon: '🥄', rarity: 'common',
    dmg: 2, bonusIfBlock: 4, desc: '造成 <b>2</b> 傷害；目標有格擋時改為 <b>6</b>。',
    up: { dmg: 3, bonusIfBlock: 5, desc: '造成 <b>3</b> 傷害；目標有格擋時改為 <b>8</b>。' },
  },
  echoSlash: {
    name: '回音斬', type: 'cut', cost: 1, icon: '🌀', rarity: 'uncommon',
    dmg: 5, bonusIfLastCut: 4, desc: '造成 <b>5</b> 傷害；若上一張是切割牌則 <b>9</b>。',
    up: { dmg: 7, bonusIfLastCut: 5, desc: '造成 <b>7</b> 傷害；若上一張是切割牌則 <b>12</b>。' },
  },
  hackAway: {
    name: '蠻斬', type: 'cut', cost: 1, icon: '🩸', rarity: 'common',
    dmg: 8, smoke: 1, desc: '造成 <b>8</b> 傷害。獲得 <b>1</b> 層油煙。',
    up: { dmg: 11, desc: '造成 <b>11</b> 傷害。獲得 <b>1</b> 層油煙。' },
  },
  spiceSlash: {
    name: '香料斬', type: 'cut', cost: 1, icon: '🌶️', rarity: 'uncommon',
    dmg: 3, spice: 2, desc: '造成 <b>3</b> 傷害。本回合獲得 <b>2</b> 香料。',
    up: { spice: 3, desc: '造成 <b>3</b> 傷害。本回合獲得 <b>3</b> 香料。' },
  },
  boneStrip: {
    name: '見骨', type: 'cut', cost: 0, icon: '🗡️', rarity: 'uncommon',
    dmg: 1, draw: 1, discountNextCut: true,
    desc: '造成 <b>1</b> 傷害。抽 1 張牌。本回合下一張切割牌<b>費用 -1</b>。',
    up: { dmg: 3, desc: '造成 <b>3</b> 傷害。抽 1 張牌。本回合下一張切割牌<b>費用 -1</b>。' },
  },
  queenSlayer: {
    name: '女王剖刀', type: 'cut', cost: 3, icon: '👑', rarity: 'rare',
    dmg: 25, desc: '造成 <b>25</b> 傷害。',
    up: { dmg: 33, desc: '造成 <b>33</b> 傷害。' },
  },
  sweepPlate: {
    name: '掃盤', type: 'cut', cost: 1, icon: '🍽️', rarity: 'common',
    dmg: 4, aoe: true, desc: '對<b>所有</b>敵人造成 <b>4</b> 傷害。<i>一刀掃過整排，剛好歸零的每一隻都算精準。</i>',
    up: { dmg: 6, desc: '對<b>所有</b>敵人造成 <b>6</b> 傷害。' },
  },
  wholeHogSweep: {
    name: '全席橫掃', type: 'cut', cost: 2, icon: '🌊', rarity: 'rare',
    dmg: 8, aoe: true, desc: '對<b>所有</b>敵人造成 <b>8</b> 傷害。',
    up: { dmg: 11, desc: '對<b>所有</b>敵人造成 <b>11</b> 傷害。' },
  },

  /* ---------------- 備料 prep ---------------- */
  cheeseShield: {
    name: '起司盾', type: 'prep', cost: 1, icon: '🧀', rarity: 'common',
    block: 5, desc: '獲得 <b>5</b> 格擋。',
    up: { block: 8, desc: '獲得 <b>8</b> 格擋。' },
  },
  ironPan: {
    name: '鐵鍋架式', type: 'prep', cost: 2, icon: '🍳', rarity: 'common',
    block: 9, desc: '獲得 <b>9</b> 格擋。',
    up: { block: 13, desc: '獲得 <b>13</b> 格擋。' },
  },
  lidGuard: {
    name: '鍋蓋防禦', type: 'prep', cost: 1, icon: '🛡️', rarity: 'uncommon',
    block: 4, draw: 1, desc: '獲得 <b>4</b> 格擋。抽 1 張牌。',
    up: { block: 7, desc: '獲得 <b>7</b> 格擋。抽 1 張牌。' },
  },
  chiliOil: {
    name: '辣油', type: 'prep', cost: 0, icon: '🌶️', rarity: 'common',
    spice: 2, desc: '本回合獲得 <b>2</b> 香料（切割傷害 +2）。',
    up: { spice: 3, desc: '本回合獲得 <b>3</b> 香料（切割傷害 +3）。' },
  },
  saltRub: {
    name: '鹽揉', type: 'prep', cost: 0, icon: '🧴', rarity: 'common',
    tenderize: 2, desc: '施加 <b>2</b> 層嫩化，不造成傷害。<i>先軟化，再算刀。</i>',
    up: { tenderize: 3, desc: '施加 <b>3</b> 層嫩化，不造成傷害。' },
  },
  rotSpore: {
    name: '腐孢粉', type: 'prep', cost: 1, icon: '🦠', rarity: 'uncommon',
    rot: 4, desc: '施加 <b>4</b> 層腐蝕（回合結束扣血，每回合遞減）。<i>腐蝕致死收不到肉。</i>',
    up: { rot: 6, desc: '施加 <b>6</b> 層腐蝕（回合結束扣血，每回合遞減）。' },
  },
  weakenBrine: {
    name: '軟骨滷汁', type: 'prep', cost: 1, icon: '🫗', rarity: 'uncommon',
    weak: 2, desc: '目標 <b>2</b> 回合內攻擊 -3。',
    up: { weak: 3, desc: '目標 <b>3</b> 回合內攻擊 -3。' },
  },
  mise: {
    name: '備料就緒', type: 'prep', cost: 1, icon: '📋', rarity: 'uncommon',
    draw: 3, desc: '抽 <b>3</b> 張牌。',
    up: { cost: 0, desc: '抽 <b>3</b> 張牌。' },
  },
  weighScale: {
    name: '秤重', type: 'prep', cost: 0, icon: '⚖️', rarity: 'uncommon',
    draw: 1, scry: true, desc: '抽 1 張牌。<b>看穿</b>所有敵人接下來兩個行動。',
    up: { draw: 2, desc: '抽 2 張牌。<b>看穿</b>所有敵人接下來兩個行動。' },
  },
  deglaze: {
    name: '洗鍋收汁', type: 'prep', cost: 1, icon: '🥫', rarity: 'uncommon',
    block: 3, partBonus: 1, partBonusMax: 6,
    desc: '獲得 <b>3</b> 格擋，每份背包裡的怪物部位再 +1（最多 +6）。',
    up: { block: 6, desc: '獲得 <b>6</b> 格擋，每份背包裡的怪物部位再 +1（最多 +6）。' },
  },
  blanch: {
    name: '汆燙', type: 'prep', cost: 1, icon: '♨️', rarity: 'uncommon',
    tenderize: 2, aoe: true, desc: '對<b>所有</b>敵人施加 <b>2</b> 層嫩化。',
    up: { tenderize: 3, desc: '對<b>所有</b>敵人施加 <b>3</b> 層嫩化。' },
  },
  coldStorage: {
    name: '冷藏', type: 'prep', cost: 1, icon: '🧊', rarity: 'rare',
    block: 8, keepBlock: true, desc: '獲得 <b>8</b> 格擋。本回合的格擋<b>不會在下回合清空</b>。',
    up: { block: 11, desc: '獲得 <b>11</b> 格擋。本回合的格擋<b>不會在下回合清空</b>。' },
  },
  sharpenKnife: {
    name: '磨刀', type: 'prep', cost: 0, icon: '⚒️', rarity: 'uncommon',
    spice: 4, exhaust: true, desc: '本回合獲得 <b>4</b> 香料。<b>消耗</b>（本場不再出現）。',
    up: { spice: 6, desc: '本回合獲得 <b>6</b> 香料。<b>消耗</b>（本場不再出現）。' },
  },
  panicShield: {
    name: '手忙腳亂', type: 'prep', cost: 0, icon: '💨', rarity: 'common',
    block: 4, draw: 1, smoke: 1, desc: '獲得 <b>4</b> 格擋。抽 1 張牌。獲得 <b>1</b> 層油煙。',
    up: { block: 6, desc: '獲得 <b>6</b> 格擋。抽 1 張牌。獲得 <b>1</b> 層油煙。' },
  },
  ventHood: {
    name: '排煙罩', type: 'prep', cost: 1, icon: '🌬️', rarity: 'uncommon',
    clearSmoke: 99, block: 4, desc: '清除<b>全部油煙</b>。獲得 <b>4</b> 格擋。',
    up: { block: 7, desc: '清除<b>全部油煙</b>。獲得 <b>7</b> 格擋。' },
  },

  /* ---------------- 調味 season（本場持續） ---------------- */
  brothEssence: {
    name: '高湯精華', type: 'season', cost: 1, icon: '🍲', rarity: 'common',
    seasonal: { healTurn: 2 }, desc: '本場戰鬥：每回合開始回復 <b>2</b> HP。',
    up: { seasonal: { healTurn: 4 }, desc: '本場戰鬥：每回合開始回復 <b>4</b> HP。' },
  },
  basteCoat: {
    name: '油淋護膜', type: 'season', cost: 1, icon: '🧈', rarity: 'common',
    seasonal: { blockTurn: 3 }, desc: '本場戰鬥：每回合開始獲得 <b>3</b> 格擋。',
    up: { seasonal: { blockTurn: 5 }, desc: '本場戰鬥：每回合開始獲得 <b>5</b> 格擋。' },
  },
  spiceRack: {
    name: '香料架', type: 'season', cost: 1, icon: '🧂', rarity: 'uncommon',
    seasonal: { spiceTurn: 1 }, desc: '本場戰鬥：每回合開始獲得 <b>1</b> 香料。',
    up: { seasonal: { spiceTurn: 2 }, desc: '本場戰鬥：每回合開始獲得 <b>2</b> 香料。' },
  },
  chefsFocus: {
    name: '主廚專注', type: 'season', cost: 2, icon: '🎯', rarity: 'rare',
    seasonal: { drawTurn: 1 }, desc: '本場戰鬥：每回合開始多抽 <b>1</b> 張牌。',
    up: { cost: 1, desc: '本場戰鬥：每回合開始多抽 <b>1</b> 張牌。' },
  },
  simmerPot: {
    name: '慢燉鍋', type: 'season', cost: 2, icon: '🥘', rarity: 'rare',
    seasonal: { aoeTurn: 2 }, desc: '本場戰鬥：每回合開始對所有敵人造成 <b>2</b> 傷害。<i>小心燉過頭。</i>',
    up: { seasonal: { aoeTurn: 3 }, desc: '本場戰鬥：每回合開始對所有敵人造成 <b>3</b> 傷害。' },
  },
};

/* 起始牌組（10 張，刻意留一張精準工具「修邊」教玩家微調） */
const STARTING_DECK = [
  'quickSlash', 'quickSlash', 'quickSlash', 'quickSlash',
  'skewerToss', 'trimFat',
  'cheeseShield', 'cheeseShield', 'cheeseShield',
  'chiliOil',
];

/* 一開始就在獎勵池的卡（其餘靠 meta 解鎖） */
const BASE_POOL = [
  'twinSlash', 'bigChop', 'heavyCleave', 'marinateSlash', 'chefFinish', 'boneSaw',
  'tenderStrike', 'skimSlice', 'hackAway', 'ironPan', 'lidGuard', 'saltRub',
  'rotSpore', 'mise', 'panicShield', 'brothEssence', 'basteCoat', 'spiceRack',
  'quickSlash', 'skewerToss', 'trimFat', 'chiliOil', 'sweepPlate',
];

/* 需要解鎖的卡：key = 解鎖條件 id（見 meta.js） */
const UNLOCKABLE_CARDS = {
  julienne: 'firstWin',
  measuredCut: 'precise25',
  echoSlash: 'firstWin',
  weighScale: 'precise25',
  deglaze: 'cook10',
  blanch: 'floor2',
  boneStrip: 'precise25',
  spiceSlash: 'floor2',
  weakenBrine: 'floor2',
  ventHood: 'overkillLesson',
  cleaverFlurry: 'floor3',
  halveCut: 'floor3',
  coldStorage: 'floor3',
  sharpenKnife: 'cook10',
  wholeHogSweep: 'firstWin',
  chefsFocus: 'clearRun',
  simmerPot: 'clearRun',
  queenSlayer: 'clearRun',
};

/* =========================================================
   卡牌工具：支援 `id+` 升級版
   ========================================================= */
const Cardlib = {
  isUp(key) { return typeof key === 'string' && key.endsWith('+'); },
  baseId(key) { return this.isUp(key) ? key.slice(0, -1) : key; },
  get(key) {
    const id = this.baseId(key);
    const base = CARDS[id];
    if (!base) return null;
    const card = Object.assign({ id, key }, base);
    if (this.isUp(key) && base.up) {
      Object.assign(card, base.up);
      card.upgraded = true;
      card.name = base.name + '＋';
    }
    delete card.up;
    return card;
  },
  canUpgrade(key) { return !this.isUp(key) && !!(CARDS[key] && CARDS[key].up); },
  upgrade(key) { return this.canUpgrade(key) ? key + '+' : key; },
};

/* =========================================================
   怪物部位（精準切割戰利品）
   ========================================================= */
const PARTS = {
  ratTail: { name: '鼠尾肉', icon: '🥩' },
  shroomCap: { name: '獨眼菇傘', icon: '🍄' },
  batWing: { name: '蝠翼', icon: '🍗' },
  boarBelly: { name: '洞豬五花', icon: '🥓' },
  turtleJelly: { name: '龜甲凍', icon: '🫙' },
  royalJelly: { name: '女王凝漿', icon: '👑' },
  mothDust: { name: '蛾翼粉', icon: '🦋' },
  brineGel: { name: '鹽漬凝膠', icon: '🫧' },
  myceliumSinew: { name: '菌絲筋', icon: '🕸️' },
  goblinLiver: { name: '酒糟肝', icon: '🍺' },
  barrelHoney: { name: '桶蟲蜜', icon: '🍯' },
  agedWort: { name: '陳釀原漿', icon: '🍷' },
  lizardTail: { name: '蜥尾排', icon: '🦎' },
  panGrease: { name: '鍋垢油', icon: '🛢️' },
  scorpionClaw: { name: '蠍鉗肉', icon: '🦂' },
  ghostBroth: { name: '幽魂高湯', icon: '👻' },
  chefHeart: { name: '主廚之心', icon: '❤️‍🔥' },
};

/* 可採集植物 */
const PLANTS = {
  herb: { name: '地窖香草', icon: '🌿', rawHeal: 3 },
  chili: { name: '辣椒藤', icon: '🌶️', rawHeal: 2 },
  garlic: { name: '洞穴蒜', icon: '🧄', rawHeal: 3 },
  glowMoss: { name: '螢光苔', icon: '🟢', rawHeal: 4 },
  saltCrystal: { name: '鹽晶', icon: '🧊', rawHeal: 1 },
  sourLeaf: { name: '酸模葉', icon: '🍃', rawHeal: 4 },
  blackTruffle: { name: '黑松露', icon: '🖤', rawHeal: 5 },
  fireSeed: { name: '火種子', icon: '🔥', rawHeal: 2 },
};

/* =========================================================
   食譜（部位 + 植物 → 料理）
   tiers: [半生/焦了, 熟透, 完美]
   effect:
     block       開戰格擋
     spice       開戰香料
     regen       每回合回血
     tenderFirst 每回合首刀施加嫩化
     killHeal    擊殺回血
     healNow     吃下立即回血
     energyFirst 第一回合額外能量
     drawFirst   開戰額外抽牌
     preciseGold 精準切割獎金 +N
     antiOverkill 前 N 次切割保證不過熟
     smokeGuard  免疫 N 層油煙
   ========================================================= */
const RECIPES = {
  'ratTail+herb': { name: '香草燉鼠尾', icon: '🍜', effect: 'block', tiers: [6, 11, 16],
    fmt: v => `開戰時獲得 ${v} 格擋` },
  'ratTail+chili': { name: '爆辣鼠尾串', icon: '🍢', effect: 'spice', tiers: [2, 3, 5],
    fmt: v => `開戰時獲得 ${v} 香料` },
  'ratTail+saltCrystal': { name: '鹽烤鼠尾', icon: '🧂', effect: 'preciseGold', tiers: [3, 6, 10],
    fmt: v => `每次精準切割額外 +${v} 金幣` },
  'shroomCap+garlic': { name: '蒜香菇排', icon: '🍛', effect: 'tenderFirst', tiers: [1, 2, 3],
    fmt: v => `每回合首刀施加 ${v} 嫩化` },
  'shroomCap+glowMoss': { name: '螢光菇湯', icon: '🥣', effect: 'drawFirst', tiers: [1, 1, 2],
    fmt: v => `開戰時額外抽 ${v} 張牌` },
  'boarBelly+chili': { name: '火辣五花捲', icon: '🥘', effect: 'killHeal', tiers: [2, 4, 6],
    fmt: v => `每擊殺一名敵人回復 ${v} HP` },
  'boarBelly+garlic': { name: '蒜爆五花', icon: '🥓', effect: 'spice', tiers: [2, 4, 6],
    fmt: v => `開戰時獲得 ${v} 香料` },
  'turtleJelly+herb': { name: '翡翠龜凍羹', icon: '🍮', effect: 'regen', tiers: [1, 2, 4],
    fmt: v => `每回合開始回復 ${v} HP` },
  'turtleJelly+saltCrystal': { name: '鹽晶龜凍', icon: '🧊', effect: 'block', tiers: [8, 14, 20],
    fmt: v => `開戰時獲得 ${v} 格擋` },
  'batWing+garlic': { name: '蒜酥脆翅', icon: '🍗', effect: 'spice', tiers: [1, 3, 4],
    fmt: v => `開戰時獲得 ${v} 香料` },
  'batWing+chili': { name: '辣味炸翅', icon: '🍖', effect: 'energyFirst', tiers: [1, 1, 2],
    fmt: v => `第一回合額外 ${v} 能量` },
  'royalJelly+glowMoss': { name: '女王夜光凍', icon: '✨', effect: 'regen', tiers: [2, 4, 6],
    fmt: v => `每回合開始回復 ${v} HP` },
  'mothDust+sourLeaf': { name: '酸粉蛾翼酥', icon: '🥮', effect: 'drawFirst', tiers: [1, 2, 2],
    fmt: v => `開戰時額外抽 ${v} 張牌` },
  'brineGel+saltCrystal': { name: '鹽漬水晶凍', icon: '🍧', effect: 'antiOverkill', tiers: [1, 2, 4],
    fmt: v => `本場前 ${v} 次切割保證不過熟` },
  'myceliumSinew+blackTruffle': { name: '松露菌絲麵', icon: '🍝', effect: 'energyFirst', tiers: [1, 2, 2],
    fmt: v => `第一回合額外 ${v} 能量` },
  'goblinLiver+sourLeaf': { name: '酸模燴肝', icon: '🫕', effect: 'killHeal', tiers: [3, 5, 8],
    fmt: v => `每擊殺一名敵人回復 ${v} HP` },
  'barrelHoney+fireSeed': { name: '焰蜜脆糖', icon: '🍬', effect: 'spice', tiers: [3, 5, 7],
    fmt: v => `開戰時獲得 ${v} 香料` },
  'agedWort+blackTruffle': { name: '陳釀松露醬', icon: '🍷', effect: 'preciseGold', tiers: [5, 9, 15],
    fmt: v => `每次精準切割額外 +${v} 金幣` },
  'lizardTail+fireSeed': { name: '炭烤蜥尾排', icon: '🍖', effect: 'block', tiers: [10, 17, 24],
    fmt: v => `開戰時獲得 ${v} 格擋` },
  'panGrease+sourLeaf': { name: '解膩清油湯', icon: '🫙', effect: 'smokeGuard', tiers: [2, 4, 6],
    fmt: v => `免疫接下來 ${v} 層油煙` },
  'scorpionClaw+garlic': { name: '蒜蓉蠍鉗', icon: '🦞', effect: 'antiOverkill', tiers: [2, 3, 5],
    fmt: v => `本場前 ${v} 次切割保證不過熟` },
  'ghostBroth+glowMoss': { name: '幽光高湯', icon: '🍵', effect: 'regen', tiers: [3, 5, 8],
    fmt: v => `每回合開始回復 ${v} HP` },
  'chefHeart+fireSeed': { name: '主廚之心燒', icon: '❤️‍🔥', effect: 'energyFirst', tiers: [2, 2, 3],
    fmt: v => `第一回合額外 ${v} 能量` },
  'royalJelly+herb': { name: '蜂王香草凍', icon: '🧁', effect: 'block', tiers: [12, 20, 28],
    fmt: v => `開戰時獲得 ${v} 格擋` },
  'turtleJelly+glowMoss': { name: '螢光龜凍', icon: '🟩', effect: 'drawFirst', tiers: [1, 2, 3],
    fmt: v => `開戰時額外抽 ${v} 張牌` },
  'mothDust+glowMoss': { name: '夜光蛾粉糖', icon: '🍡', effect: 'preciseGold', tiers: [4, 7, 11],
    fmt: v => `每次精準切割額外 +${v} 金幣` },
  'brineGel+herb': { name: '鹽漬香草凍', icon: '🍥', effect: 'block', tiers: [9, 15, 21],
    fmt: v => `開戰時獲得 ${v} 格擋` },
  'myceliumSinew+garlic': { name: '蒜炒菌絲', icon: '🍳', effect: 'tenderFirst', tiers: [2, 3, 4],
    fmt: v => `每回合首刀施加 ${v} 嫩化` },
  'goblinLiver+chili': { name: '辣炒酒糟肝', icon: '🌭', effect: 'spice', tiers: [3, 4, 6],
    fmt: v => `開戰時獲得 ${v} 香料` },
  'barrelHoney+sourLeaf': { name: '蜜漬酸葉', icon: '🍯', effect: 'regen', tiers: [2, 4, 6],
    fmt: v => `每回合開始回復 ${v} HP` },
  'lizardTail+chili': { name: '辣烤蜥尾', icon: '🌮', effect: 'killHeal', tiers: [4, 6, 9],
    fmt: v => `每擊殺一名敵人回復 ${v} HP` },
  'panGrease+saltCrystal': { name: '鹽炒鍋垢', icon: '🥫', effect: 'smokeGuard', tiers: [3, 5, 8],
    fmt: v => `免疫接下來 ${v} 層油煙` },
  'scorpionClaw+fireSeed': { name: '焰烤蠍鉗', icon: '🔥', effect: 'energyFirst', tiers: [1, 2, 3],
    fmt: v => `第一回合額外 ${v} 能量` },
  'ghostBroth+blackTruffle': { name: '松露幽湯', icon: '🫖', effect: 'antiOverkill', tiers: [3, 4, 6],
    fmt: v => `本場前 ${v} 次切割保證不過熟` },
  'chefHeart+blackTruffle': { name: '黑松露主廚心', icon: '🖤', effect: 'preciseGold', tiers: [8, 14, 22],
    fmt: v => `每次精準切割額外 +${v} 金幣` },
};

/* 反查表：某個部位／植物有哪些對味的搭檔（烹飪面板用來標示「這兩樣對味」） */
const PAIRS = (() => {
  const byPart = {}, byPlant = {};
  Object.keys(RECIPES).forEach(k => {
    const [p, l] = k.split('+');
    (byPart[p] = byPart[p] || []).push(l);
    (byPlant[l] = byPlant[l] || []).push(p);
  });
  return { byPart, byPlant };
})();
const FALLBACK_RECIPE = { name: '神祕亂燉', icon: '🥣', effect: 'healNow', tiers: [4, 8, 14],
  fmt: v => `吃下時立即回復 ${v} HP` };

/* =========================================================
   遺物
   tier: common / boss / shop
   ========================================================= */
const RELICS = {
  whetstone: { name: '磨刀石', icon: '⚒️', tier: 'common',
    desc: '每場戰鬥第一張切割牌傷害 +3。' },
  brassScale: { name: '銅秤', icon: '⚖️', tier: 'common',
    desc: '精準切割時額外抽 1 張牌。' },
  chefApron: { name: '大廚圍裙', icon: '🥼', tier: 'common',
    desc: '最大生命 +12（立即回滿這 12 點）。' },
  ovenMitt: { name: '隔熱手套', icon: '🧤', tier: 'common',
    desc: '烹飪的「完美」區間寬度 +80%。' },
  sandGlass: { name: '計時沙漏', icon: '⏳', tier: 'common',
    desc: '烹飪指針速度 -30%。' },
  bentoBox: { name: '保溫便當盒', icon: '🍱', tier: 'common',
    desc: '便當盒多一格（可帶 4 道料理）。' },
  boningKnife: { name: '剔骨刀', icon: '🔪', tier: 'common',
    desc: '過熟時有 45% 機率照樣保住肉。' },
  spiceJar: { name: '祖傳香料罐', icon: '🫙', tier: 'common',
    desc: '每場戰鬥開始獲得 2 香料。' },
  stockPot: { name: '常溫高湯鍋', icon: '🍲', tier: 'common',
    desc: '每前進一格回復 2 HP。' },
  saltCellar: { name: '鹽窖', icon: '🧂', tier: 'common',
    desc: '所有嫩化效果 +1 層。' },
  gamblerDice: { name: '賭徒骰', icon: '🎲', tier: 'common',
    desc: '柏青哥每次可多投一顆球。' },
  gourmandNotes: { name: '老饕筆記', icon: '📖', tier: 'shop',
    desc: '烹飪品質提升一階（半生→熟透、熟透→完美）。' },
  chefHat: { name: '高帽', icon: '👨‍🍳', tier: 'common',
    desc: '每場戰鬥開始多抽 1 張牌。' },
  anvilBase: { name: '鐵砧座', icon: '🗜️', tier: 'common',
    desc: '回合開始時保留一半的格擋。' },
  garlicBraid: { name: '蒜辮', icon: '🧄', tier: 'common',
    desc: '每場戰鬥勝利回復 5 HP。' },
  picklingJar: { name: '醃缸', icon: '🏺', tier: 'common',
    desc: '每累積 3 次精準切割，獲得一份隨機部位。' },
  caramelSpatula: { name: '焦糖鏟', icon: '🥄', tier: 'shop',
    desc: '「焦了」的料理視為「熟透」。' },
  silverFork: { name: '銀叉', icon: '🍴', tier: 'common',
    desc: '生吃植物的回血翻倍，並額外獲得 3 金幣。' },
  freshFilter: { name: '活性碳濾網', icon: '🌬️', tier: 'common',
    desc: '每回合開始清除 1 層油煙。' },
  chefsMedal: { name: '主廚勳章', icon: '🎖️', tier: 'boss',
    desc: '每回合能量 +1，但最大生命 -8。' },
  goldenLadle: { name: '黃金湯勺', icon: '🥄', tier: 'boss',
    desc: '精準切割的金幣獎勵改為 8（原本 3）。' },
  ironStomach: { name: '鐵胃', icon: '🫀', tier: 'boss',
    desc: '開戰時，若便當盒是空的，獲得 12 格擋與 3 香料。' },
  mysteryTin: { name: '神祕罐頭', icon: '🥫', tier: 'shop',
    desc: '進入新樓層時獲得 2 份隨機部位與 2 份隨機植物。' },
};

/* 起始遺物池（每輪隨機給一個作為開場） */
const STARTER_RELICS = ['whetstone', 'chefApron', 'spiceJar'];

/* =========================================================
   敵人
   moves: 權重行動表 —— w=權重, atk/times/block/summon/smoke/heal
   phase2: HP 低於 50% 時改用的行動表（Boss 用）
   ========================================================= */
const ENEMIES = {
  /* ---- 樓層 1：儲糧地窖 ---- */
  mossRat: { name: '苔蘚鼠', icon: '🐀', hp: 16, part: 'ratTail',
    moves: [{ w: 3, atk: 3, times: 2 }, { w: 3, atk: 5 }, { w: 2, block: 5 }] },
  eyeShroom: { name: '獨眼菇怪', icon: '🍄', hp: 14, part: 'shroomCap',
    moves: [{ w: 2, block: 6 }, { w: 3, atk: 6 }, { w: 3, atk: 4, smoke: 1 }] },
  caveBat: { name: '洞窟蝠', icon: '🦇', hp: 11, part: 'batWing',
    moves: [{ w: 3, atk: 5 }, { w: 3, atk: 3, times: 2 }] },
  tuskBoar: { name: '尖牙洞豬', icon: '🐗', hp: 26, part: 'boarBelly',
    moves: [{ w: 3, atk: 5, times: 2 }, { w: 2, block: 6 }, { w: 3, atk: 9 }] },
  stoneTurtle: { name: '石殼老龜', icon: '🐢', hp: 34, part: 'turtleJelly',
    elite: true, startBlock: 8,
    moves: [{ w: 2, block: 8 }, { w: 3, atk: 11 }, { w: 3, atk: 6, times: 2 }] },
  maggot: { name: '蛆蟲', icon: '🪱', hp: 8, part: null,
    moves: [{ w: 3, atk: 4 }, { w: 2, atk: 3 }] },
  maggotQueen: { name: '蛆蟲女王', icon: '👸', hp: 78, part: 'royalJelly', boss: true,
    moves: [{ w: 2, summon: 2 }, { w: 3, atk: 8 }, { w: 3, atk: 4, times: 3 }, { w: 2, block: 10 }],
    phase2: [{ w: 3, atk: 6, times: 3 }, { w: 2, summon: 2 }, { w: 3, atk: 13 }] },

  /* ---- 樓層 2：發酵迴廊 ---- */
  sporeMoth: { name: '孢子蛾', icon: '🦋', hp: 22, part: 'mothDust',
    moves: [{ w: 3, atk: 4, times: 2 }, { w: 3, atk: 6, smoke: 1 }, { w: 2, block: 6 }] },
  brineSlime: { name: '醃漬史萊姆', icon: '🫧', hp: 30, part: 'brineGel',
    moves: [{ w: 3, atk: 8 }, { w: 3, block: 9 }, { w: 2, atk: 5, times: 2 }] },
  myceliumCrawler: { name: '菌絲爬行者', icon: '🕷️', hp: 20, part: 'myceliumSinew',
    moves: [{ w: 3, atk: 7 }, { w: 3, atk: 3, times: 3 }] },
  drunkGoblin: { name: '醉酒廚工', icon: '🧝', hp: 32, part: 'goblinLiver',
    moves: [{ w: 3, atk: 10 }, { w: 2, heal: 8 }, { w: 3, atk: 6, times: 2 }] },
  barrelBug: { name: '雙頭酒桶蟲', icon: '🪲', hp: 52, part: 'barrelHoney',
    elite: true, startBlock: 6,
    moves: [{ w: 3, atk: 8, times: 2 }, { w: 2, block: 10 }, { w: 3, atk: 14 }, { w: 2, smoke: 2, atk: 4 }] },
  brewMaster: { name: '腐酒釀造師', icon: '🍺', hp: 118, part: 'agedWort', boss: true,
    moves: [{ w: 3, atk: 11 }, { w: 3, atk: 6, times: 2, smoke: 1 }, { w: 2, block: 14 }, { w: 2, heal: 12 }],
    phase2: [{ w: 3, atk: 9, times: 2 }, { w: 3, atk: 16 }, { w: 2, smoke: 3, atk: 6 }] },

  /* ---- 樓層 3：熾焰主廚房 ---- */
  charLizard: { name: '炭火蜥', icon: '🦎', hp: 30, part: 'lizardTail',
    moves: [{ w: 3, atk: 11 }, { w: 3, atk: 6, times: 2 }, { w: 2, block: 8 }] },
  panGolem: { name: '鐵鍋魔像', icon: '🍳', hp: 48, part: 'panGrease', startBlock: 10,
    moves: [{ w: 3, atk: 13 }, { w: 3, block: 12 }, { w: 2, atk: 7, times: 2 }] },
  smokeWraith: { name: '油煙鬼', icon: '💨', hp: 26, part: null,
    moves: [{ w: 4, smoke: 2, atk: 5 }, { w: 2, atk: 9 }] },
  flameScorpion: { name: '熾焰蠍', icon: '🦂', hp: 38, part: 'scorpionClaw',
    moves: [{ w: 3, atk: 8, times: 2 }, { w: 3, atk: 14 }, { w: 2, block: 9 }] },
  ghostChef: { name: '主廚幽魂', icon: '👻', hp: 66, part: 'ghostBroth',
    elite: true,
    moves: [{ w: 3, atk: 9, times: 2 }, { w: 3, atk: 16 }, { w: 2, heal: 10 }, { w: 2, smoke: 2, block: 8 }] },
  darkChef: { name: '暗黑總主廚', icon: '😈', hp: 165, part: 'chefHeart', boss: true,
    moves: [{ w: 3, atk: 14 }, { w: 3, atk: 8, times: 2 }, { w: 2, block: 16 }, { w: 2, smoke: 2, atk: 8 }],
    phase2: [{ w: 3, atk: 11, times: 2 }, { w: 3, atk: 20 }, { w: 2, smoke: 3, atk: 10 }, { w: 2, summon: 2 }] },
};

/* =========================================================
   隨機事件（節點 type: 'event'）
   choices: [{ label, hint, run(ctx) → 結果字串 }]
   ========================================================= */
const EVENTS = [
  {
    id: 'oldSoup', title: '不知放了多久的湯鍋', icon: '🍲',
    text: '走廊角落擱著一鍋還在冒泡的湯。聞起來……有點太香了。',
    choices: [
      { label: '大口喝下', hint: '回復 16 HP，或中毒失去 10 HP',
        run() {
          if (Math.random() < 0.6) { const h = State.heal(16); return `暖到骨頭裡！回復 ${h} HP。`; }
          State.damage(10); return '喉嚨一陣灼燒……失去 10 HP。';
        } },
      { label: '撈起食材帶走', hint: '獲得 2 份隨機部位',
        run() {
          const ids = Object.keys(PARTS).slice(0, 6);
          const a = Util.pick(ids), b = Util.pick(ids);
          State.addPart(a); State.addPart(b);
          return `撈到 ${PARTS[a].name} 和 ${PARTS[b].name}。`;
        } },
      { label: '踢翻它走人', hint: '什麼也沒發生，但心情舒暢',
        run() { State.gold += 8; return '鍋子滾下階梯，撞出 8 枚金幣。'; } },
    ],
  },
  {
    id: 'whetstoneShrine', title: '磨刀石神龕', icon: '⚒️',
    text: '一塊被磨得凹陷的石頭供在壁龕裡，旁邊刻著：「利刃者，取一物留一物。」',
    choices: [
      { label: '磨利菜刀', hint: '升級一張隨機卡牌',
        run() {
          const idx = State.deck.findIndex(k => Cardlib.canUpgrade(k));
          if (idx < 0) { State.gold += 20; return '沒有可升級的牌，神龕退還 20 金幣。'; }
          const name = Cardlib.get(State.deck[idx]).name;
          State.deck[idx] = Cardlib.upgrade(State.deck[idx]);
          return `${name} 被磨得鋒利無比，升級了！`;
        } },
      { label: '獻上一張牌', hint: '移除一張隨機基礎卡，最大生命 +6',
        run() {
          const idx = State.deck.findIndex(k => k === 'quickSlash' || k === 'cheeseShield');
          if (idx >= 0) State.deck.splice(idx, 1);
          State.maxHp += 6; State.heal(6);
          return '刀刃融進石頭。最大生命 +6。';
        } },
      { label: '不碰為妙', hint: '獲得 25 金幣',
        run() { State.gold += 25; return '你在神龕底下摸到 25 枚金幣。'; } },
    ],
  },
  {
    id: 'drunkTrader', title: '喝醉的行商', icon: '🍻',
    text: '一個地精商人趴在木箱上打呼，貨袋開著口。',
    choices: [
      { label: '搖醒他做生意', hint: '花 40 金幣換一個遺物',
        run() {
          if (State.gold < 40) return '你的錢包太輕，他翻個身又睡了。';
          State.gold -= 40;
          const id = Relics.grantRandom();
          return id ? `他塞給你「${RELICS[id].name}」，又倒頭睡去。` : '他的袋子已經空了，退你 40 金幣。';
        } },
      { label: '悄悄拿一點', hint: '獲得 55 金幣，但失去 8 HP',
        run() { State.gold += 55; State.damage(8); return '他夢中揮了一拳。＋55 金幣，－8 HP。'; } },
      { label: '幫他蓋好貨袋', hint: '獲得 2 份隨機植物與 1 道神祕料理',
        run() {
          const ids = Object.keys(PLANTS);
          const a = Util.pick(ids), b = Util.pick(ids);
          State.addPlant(a); State.addPlant(b);
          if (State.lunchbox.length < State.lunchCap()) {
            State.lunchbox.push({ name: '行商的謝禮', icon: '🎁', effect: 'healNow',
              tier: 'cooked', tierName: '熟透', value: 10, desc: '吃下時立即回復 10 HP' });
          }
          return `他嘟囔一句「好人」。獲得 ${PLANTS[a].name}、${PLANTS[b].name} 與一道謝禮。`;
        } },
    ],
  },
  {
    id: 'smokeVent', title: '堵住的排煙口', icon: '🌬️',
    text: '整條走廊嗆得睜不開眼，油煙從一個堵住的鐵柵縫裡湧出來。',
    choices: [
      { label: '徒手清通', hint: '失去 7 HP，獲得遺物「活性碳濾網」',
        run() {
          State.damage(7);
          if (!Relics.has('freshFilter')) { Relics.grant('freshFilter'); return '－7 HP，但你挖出了一張還能用的濾網。'; }
          State.gold += 30; return '－7 HP，柵欄裡只剩 30 枚金幣。';
        } },
      { label: '拿油煙當調味', hint: '獲得 3 份鍋垢油',
        run() { for (let i = 0; i < 3; i++) State.addPart('panGrease'); return '你刮下三坨鍋垢油。……真的要吃嗎？'; } },
      { label: '掩住鼻子快走', hint: '無事發生',
        run() { return '你憋著氣衝過去，什麼也沒帶走。'; } },
    ],
  },
  {
    id: 'mirrorPan', title: '會照人的平底鍋', icon: '🪞',
    text: '一只擦得雪亮的平底鍋掛在牆上，鏡面裡的你正在切一塊看不見的肉。',
    choices: [
      { label: '照著鏡子練刀', hint: '複製一張隨機卡牌',
        run() {
          if (!State.deck.length) return '鏡子裡的你聳聳肩。';
          const k = Util.pick(State.deck);
          State.deck.push(k);
          return `你複製了一張「${Cardlib.get(k).name}」。`;
        } },
      { label: '把鍋拆下來帶走', hint: '獲得隨機遺物，最大生命 -5',
        run() {
          State.maxHp = Math.max(20, State.maxHp - 5);
          State.hp = Math.min(State.hp, State.maxHp);
          const id = Relics.grantRandom();
          return id ? `鍋子很重。最大生命 -5，但獲得「${RELICS[id].name}」。` : '鍋子碎了，只是最大生命 -5。';
        } },
      { label: '對鏡子扮鬼臉', hint: '回復 12 HP',
        run() { const h = State.heal(12); return `鏡中的你也笑了。回復 ${h} HP。`; } },
    ],
  },
  {
    id: 'coldRoom', title: '沒鎖的冷藏庫', icon: '🧊',
    text: '一扇結霜的鐵門微微敞開，裡面掛滿了不知名的肉。',
    choices: [
      { label: '搬走能拿的', hint: '獲得 3 份隨機部位，但失去 6 HP',
        run() {
          const ids = Object.keys(PARTS).slice(0, 10);
          const got = [];
          for (let i = 0; i < 3; i++) { const p = Util.pick(ids); State.addPart(p); got.push(PARTS[p].name); }
          State.damage(6);
          return `凍得手指發麻（－6 HP），帶走 ${got.join('、')}。`;
        } },
      { label: '在裡面睡一覺', hint: '回復 20 HP，失去所有植物',
        run() {
          const n = State.plants.length; State.plants = [];
          const h = State.heal(20);
          return `冰涼的空氣讓你睡得很沉，回復 ${h} HP。${n ? `但 ${n} 份植物凍壞了。` : ''}`;
        } },
      { label: '關上門走開', hint: '獲得 18 金幣',
        run() { State.gold += 18; return '門把上掛著一串鑰匙圈與 18 枚金幣。'; } },
    ],
  },
];

/* =========================================================
   樓層
   node type: start forage fight elite campfire chest pachinko shop
              event branch boss
   ========================================================= */
const FLOORS = [
  {
    zone: '儲糧地窖', palette: 'f1', bg: 'floor1',
    nodes: [
      { type: 'forage', plant: 'herb' },
      { type: 'fight', enemies: ['mossRat'] },
      { type: 'forage', plant: 'chili' },
      { type: 'fight', enemies: ['eyeShroom'] },
      { type: 'campfire' },
      { type: 'branch',
        left: { desc: '🎰 部落青哥\n🌿 洞穴蒜\n📦 寶箱',
          nodes: [{ type: 'pachinko' }, { type: 'forage', plant: 'garlic' }, { type: 'chest' }] },
        right: { desc: '❓ 事件\n⚔️ 洞窟蝠\n🛒 商販',
          nodes: [{ type: 'event' }, { type: 'fight', enemies: ['caveBat'] }, { type: 'shop' }] } },
      { type: 'fight', enemies: ['mossRat', 'caveBat'] },
      { type: 'forage', plant: 'glowMoss' },
      { type: 'event' },
      { type: 'fight', enemies: ['tuskBoar'] },
      { type: 'campfire' },
      { type: 'elite', enemies: ['stoneTurtle'] },
      { type: 'forage', plant: 'saltCrystal' },
      { type: 'shop' },
      { type: 'campfire' },
      { type: 'boss', enemies: ['maggotQueen', 'maggot', 'maggot'] },
    ],
  },
  {
    zone: '發酵迴廊', palette: 'f2', bg: 'floor2',
    nodes: [
      { type: 'forage', plant: 'sourLeaf' },
      { type: 'fight', enemies: ['sporeMoth'] },
      { type: 'event' },
      { type: 'fight', enemies: ['myceliumCrawler', 'sporeMoth'] },
      { type: 'campfire' },
      { type: 'branch',
        left: { desc: '💪 精英：酒桶蟲\n📦 寶箱\n🌿 黑松露',
          nodes: [{ type: 'elite', enemies: ['barrelBug'] }, { type: 'chest' }, { type: 'forage', plant: 'blackTruffle' }] },
        right: { desc: '⚔️ 醃漬史萊姆\n🎰 部落青哥\n🌿 鹽晶',
          nodes: [{ type: 'fight', enemies: ['brineSlime'] }, { type: 'pachinko' }, { type: 'forage', plant: 'saltCrystal' }] } },
      { type: 'fight', enemies: ['drunkGoblin'] },
      { type: 'shop' },
      { type: 'forage', plant: 'blackTruffle' },
      { type: 'fight', enemies: ['brineSlime', 'myceliumCrawler'] },
      { type: 'event' },
      { type: 'campfire' },
      { type: 'elite', enemies: ['barrelBug'] },
      { type: 'forage', plant: 'sourLeaf' },
      { type: 'campfire' },
      { type: 'boss', enemies: ['brewMaster'] },
    ],
  },
  {
    zone: '熾焰主廚房', palette: 'f3', bg: 'floor3',
    nodes: [
      { type: 'forage', plant: 'fireSeed' },
      { type: 'fight', enemies: ['charLizard'] },
      { type: 'event' },
      { type: 'fight', enemies: ['smokeWraith', 'charLizard'] },
      { type: 'campfire' },
      { type: 'branch',
        left: { desc: '💪 精英：主廚幽魂\n🛒 商販',
          nodes: [{ type: 'elite', enemies: ['ghostChef'] }, { type: 'shop' }] },
        right: { desc: '⚔️ 鐵鍋魔像\n📦 寶箱\n🎰 部落青哥',
          nodes: [{ type: 'fight', enemies: ['panGolem'] }, { type: 'chest' }, { type: 'pachinko' }] } },
      { type: 'fight', enemies: ['flameScorpion'] },
      { type: 'forage', plant: 'fireSeed' },
      { type: 'event' },
      { type: 'fight', enemies: ['panGolem', 'smokeWraith'] },
      { type: 'campfire' },
      { type: 'elite', enemies: ['ghostChef'] },
      { type: 'shop' },
      { type: 'forage', plant: 'blackTruffle' },
      { type: 'campfire' },
      { type: 'boss', enemies: ['darkChef'] },
    ],
  },
];

const NODE_ICONS = {
  forage: '🌿', fight: '⚔️', elite: '💪', campfire: '🔥', chest: '📦',
  pachinko: '🎰', branch: '🚪', boss: '👑', start: '🚩', shop: '🛒', event: '❓',
};

/* 柏青哥獎勵格 */
const PACHINKO_SLOTS = [
  { id: 'card', label: '卡牌', icon: '🃏' },
  { id: 'gold20', label: '小金', icon: '🪙' },
  { id: 'jackpot', label: '大獎', icon: '💎' },
  { id: 'gold20b', label: '小金', icon: '🪙' },
  { id: 'meat', label: '肉塊', icon: '🥩' },
];

/* =========================================================
   爐火等級（難度階梯，類似 Ascension）
   ========================================================= */
const HEAT_LEVELS = [
  { name: '小火', desc: '標準難度。' },
  { name: '中火', desc: '所有敵人生命 +10%。' },
  { name: '大火', desc: '再加：起始生命 -8。' },
  { name: '猛火', desc: '再加：敵人每次攻擊 +2 傷害。' },
  { name: '烈焰', desc: '再加：烹飪「完美」區間縮小 35%。' },
  { name: '地獄爐', desc: '再加：頭目生命 +20%、精英多一場。' },
];

/* 基礎數值（會被爐火等級修正） */
const BALANCE = {
  baseMaxHp: 72,
  startGold: 30,
  maxEnergy: 3,
  handDraw: 5,
  handLimit: 9,
  preciseGold: 3,
  smokeThreshold: 3,
  overkillSmoke: 2,
  cookDuration: 1500,
  cookZones: { raw: 36, cooked: 30, perfect: 12, charred: 22 },
};
