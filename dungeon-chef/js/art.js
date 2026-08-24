/* =========================================================
   art.js — 美術資產解析（對應 Unity 的 AddressableAssets / Resources）
   id → PNG 路徑；沒有 PNG 的內容自動退回 emoji 佔位。
   新素材只要用 id 命名丟進 assets/ 對應資料夾，再跑一次：
       python tools/import_drop.py --sync-only
   ========================================================= */

const Art = {
  base: 'assets/',

  /* 目前實際存在的 PNG。
     ⚠ 這個區塊由 tools/import_drop.py 自動產生，不要手改 —— 下次同步會被蓋掉。 */
  HAVE: {
    cards: [
      'basteCoat', 'bigChop', 'blanch', 'boneSaw', 'boneStrip', 'brothEssence', 'cheeseShield',
      'chefFinish', 'chefsFocus', 'chiliOil', 'cleaverFlurry', 'coldStorage', 'deglaze',
      'echoSlash', 'hackAway', 'halveCut', 'heavyCleave', 'ironPan', 'julienne', 'lidGuard',
      'marinateSlash', 'measuredCut', 'mise', 'panicShield', 'queenSlayer', 'quickSlash',
      'rotSpore', 'saltRub', 'sharpenKnife', 'simmerPot', 'skewerToss', 'skimSlice',
      'spiceRack', 'spiceSlash', 'sweepPlate', 'tenderStrike', 'trimFat', 'twinSlash',
      'ventHood', 'weakenBrine', 'weighScale', 'wholeHogSweep',
    ],
    enemies: [
      'barrelBug', 'brewMaster', 'brineSlime', 'caveBat', 'charLizard', 'darkChef',
      'drunkGoblin', 'eyeShroom', 'flameScorpion', 'ghostChef', 'maggot', 'maggotQueen',
      'mossRat', 'myceliumCrawler', 'panGolem', 'smokeWraith', 'sporeMoth', 'stoneTurtle',
      'tuskBoar',
    ],
    icons: [
      'agedWort', 'barrelHoney', 'batWing', 'blackTruffle', 'boarBelly', 'brineGel',
      'chefHeart', 'chili', 'fireSeed', 'garlic', 'ghostBroth', 'glowMoss', 'goblinLiver',
      'gold', 'herb', 'lizardTail', 'mothDust', 'myceliumSinew', 'panGrease', 'ratTail',
      'royalJelly', 'saltCrystal', 'scorpionClaw', 'shroomCap', 'sourLeaf', 'turtleJelly',
    ],
    relics: [
      'anvilBase', 'bentoBox', 'boningKnife', 'brassScale', 'caramelSpatula', 'chefApron',
      'chefHat', 'chefsMedal', 'freshFilter', 'gamblerDice', 'garlicBraid', 'goldenLadle',
      'gourmandNotes', 'ironStomach', 'mysteryTin', 'ovenMitt', 'picklingJar', 'saltCellar',
      'sandGlass', 'silverFork', 'spiceJar', 'stockPot', 'whetstone',
    ],
    events: [
      'coldRoom', 'drunkTrader', 'mirrorPan', 'oldSoup', 'smokeVent', 'whetstoneShrine',
    ],
    env: [
      'campfire', 'floor1', 'floor2', 'floor3',
    ],
    maps: [
      'floor1', 'floor2', 'floor3',
    ],
    vfx: [
      'embers', 'heal', 'hurt', 'overcook-smoke', 'precise-slash', 'unlock',
    ],
    face: [
      'angry', 'full', 'happy', 'hurt', 'idle', 'munch',
    ],
  },

  url(kind, id) {
    if (!id) return null;
    const list = this.HAVE[kind];
    if (!list || list.indexOf(id) < 0) return null;
    // 回傳以目前頁面為基準的絕對 URL；CSS 自訂屬性中的相對 url()
    // 會改以 style.css 所在目錄解析，造成 /css/assets/... 404。
    return new URL(`${this.base}${kind}/${id}.png`, document.baseURI).href;
  },

  card(id) { return this.url('cards', id); },
  enemy(id) { return this.url('enemies', id); },
  icon(id) { return this.url('icons', id); },
  relic(id) { return this.url('relics', id); },
  event(id) { return this.url('events', id); },
  face(mood) { return this.url('face', mood); },
  env(key) { return this.url('env', key); },
  map(key) { return this.url('maps', key); },
  vfx(id) { return this.url('vfx', id); },

  /* 圖片或 emoji 的 HTML 片段。cls 會加在外層元素上 */
  sprite(kind, id, emoji, cls) {
    const src = this.url(kind, id);
    if (src) return `<img class="spr ${cls || ''}" src="${src}" alt="" draggable="false">`;
    return `<span class="spr-emoji ${cls || ''}">${emoji || '❓'}</span>`;
  },

  /* 小圖示（食材、部位、植物）：有 PNG 用 PNG，否則 emoji */
  inline(id, emoji) {
    const src = this.icon(id);
    if (src) return `<img class="ico" src="${src}" alt="" draggable="false">`;
    return `<span class="ico-emoji">${emoji || '❓'}</span>`;
  },

  /* 預載常用大圖，避免第一次進戰鬥閃白 */
  preload() {
    const urls = [];
    Object.keys(this.HAVE).forEach(kind => {
      this.HAVE[kind].forEach(id => urls.push(`${this.base}${kind}/${id}.png`));
    });
    urls.forEach(u => { const im = new Image(); im.src = u; });
  },
};
