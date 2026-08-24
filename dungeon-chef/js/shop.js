/* =========================================================
   shop.js — 廚具商販（對應 Unity 的 ShopSystem）
   賣卡牌、遺物、食材，另外提供「去牌」與「升級」兩種服務
   ========================================================= */

const Shop = {
  node: null,

  priceOf(kind, extra) {
    const f = State.floorIndex;
    const scale = 1 + f * 0.18;
    const base = {
      common: 48, uncommon: 72, rare: 112,
      relic: 145, part: 26, plant: 18,
      remove: 62, upgrade: 78,
    }[kind] || 50;
    return Math.round(base * scale + (extra || 0));
  },

  /* 商品清單只在第一次進店時決定，離開再回來不會刷新 */
  buildStock(node) {
    if (node.stock) return;
    const pool = Util.shuffle(Meta.rewardPool());
    const cards = [];
    const seen = {};
    for (const id of pool) {
      if (seen[id]) continue;
      seen[id] = 1; cards.push(id);
      if (cards.length >= 3) break;
    }
    const relicIds = Util.shuffle(Relics.pool()).slice(0, 2);
    const partIds = Util.shuffle(Object.keys(PARTS).slice(0, 10)).slice(0, 2);
    const plantIds = Util.shuffle(Object.keys(PLANTS)).slice(0, 2);
    node.stock = {
      cards: cards.map(id => ({ id, price: this.priceOf(CARDS[id].rarity), sold: false })),
      relics: relicIds.map(id => ({ id, price: this.priceOf('relic'), sold: false })),
      parts: partIds.map(id => ({ id, price: this.priceOf('part'), sold: false })),
      plants: plantIds.map(id => ({ id, price: this.priceOf('plant'), sold: false })),
      removeUsed: false, upgradeUsed: false,
    };
  },

  open(node) {
    this.node = node;
    this.buildStock(node);
    State.mode = 'shop';
    Sfx.playTrack('calm');
    this.render();
    UI.show('overlay-shop');
    Util.el('btn-shop-leave').onclick = () => this.leave();
  },

  afford(p) { return State.gold >= p; },

  buy(price, onOk) {
    if (!this.afford(price)) {
      Sfx.tone(160, 0.12, { type: 'square', vol: 0.12 });
      UI.toast('金幣不夠。');
      return false;
    }
    State.gold -= price;
    Sfx.gold();
    onOk();
    UI.refreshSidebar();
    this.render();
    Meta.saveRun();
    return true;
  },

  render() {
    const s = this.node.stock;
    Util.el('shop-gold').innerHTML = `🪙 <b>${State.gold}</b>`;

    // 卡牌
    const cardRow = Util.el('shop-cards');
    cardRow.innerHTML = '';
    s.cards.forEach(item => {
      const wrap = document.createElement('div');
      wrap.className = 'shop-item' + (item.sold ? ' sold' : '');
      const el = UI.buildCardEl(item.id);
      wrap.appendChild(el);
      const tag = document.createElement('div');
      tag.className = 'price' + (this.afford(item.price) ? '' : ' poor');
      tag.textContent = item.sold ? '已售出' : `🪙 ${item.price}`;
      wrap.appendChild(tag);
      if (!item.sold) {
        wrap.onclick = () => this.buy(item.price, () => {
          State.deck.push(item.id);
          State.stats.cardsAdded++;
          item.sold = true;
          UI.toast(`買下 <b>${CARDS[item.id].name}</b>，加入牌組。`);
        });
      }
      cardRow.appendChild(wrap);
    });

    // 遺物
    const relicRow = Util.el('shop-relics');
    relicRow.innerHTML = '';
    s.relics.forEach(item => {
      const r = RELICS[item.id];
      const relicArt = Art.relic(item.id);
      const relicIcon = relicArt ? `<img src="${relicArt}" alt="" draggable="false">` : r.icon;
      const d = document.createElement('div');
      const owned = Relics.has(item.id);
      d.className = 'shop-relic' + (item.sold || owned ? ' sold' : '');
      d.innerHTML = `<div class="sr-icon">${relicIcon}</div>
        <div class="sr-body"><div class="sr-name">${r.name}</div><div class="sr-desc">${r.desc}</div></div>
        <div class="price ${this.afford(item.price) ? '' : 'poor'}">${item.sold || owned ? '已售出' : '🪙 ' + item.price}</div>`;
      if (!item.sold && !owned) {
        d.onclick = () => this.buy(item.price, () => {
          Relics.grant(item.id);
          item.sold = true;
          Sfx.relic();
          UI.toast(`獲得遺物 <b>${r.name}</b>：${r.desc}`);
        });
      }
      relicRow.appendChild(d);
    });

    // 食材
    const foodRow = Util.el('shop-food');
    foodRow.innerHTML = '';
    const addFood = (item, defs, isPart) => {
      const def = defs[item.id];
      const d = document.createElement('div');
      d.className = 'shop-food' + (item.sold ? ' sold' : '');
      d.innerHTML = `${Art.inline(item.id, def.icon)}<span class="sf-name">${def.name}</span>
        <span class="price ${this.afford(item.price) ? '' : 'poor'}">${item.sold ? '售出' : '🪙 ' + item.price}</span>`;
      if (!item.sold) {
        d.onclick = () => this.buy(item.price, () => {
          if (isPart) State.addPart(item.id); else State.addPlant(item.id);
          item.sold = true;
        });
      }
      foodRow.appendChild(d);
    };
    s.parts.forEach(i => addFood(i, PARTS, true));
    s.plants.forEach(i => addFood(i, PLANTS, false));

    // 服務
    const svcRow = Util.el('shop-services');
    svcRow.innerHTML = '';
    const removePrice = this.priceOf('remove');
    const upgradePrice = this.priceOf('upgrade');
    const services = [
      { icon: '🗑️', name: '移除一張牌', desc: '把不想要的牌從牌組永久拿掉。',
        price: removePrice, used: s.removeUsed,
        act: () => UI.pickCard({
          title: '移除哪一張？', cancelText: '不移除了',
          onPick: (key, idx) => {
            if (!this.afford(removePrice)) { UI.toast('金幣不夠。'); return; }
            State.gold -= removePrice;
            const name = Cardlib.get(key).name;
            State.deck.splice(idx, 1);
            s.removeUsed = true;
            Sfx.gold();
            UI.toast(`<b>${name}</b> 已從牌組移除。`);
            this.render(); UI.refreshSidebar(); Meta.saveRun();
          },
        }) },
      { icon: '⚒️', name: '升級一張牌', desc: '把一張牌磨利成強化版。',
        price: upgradePrice, used: s.upgradeUsed || !State.deck.some(k => Cardlib.canUpgrade(k)),
        act: () => UI.pickCard({
          title: '升級哪一張？', cancelText: '算了',
          filter: k => Cardlib.canUpgrade(k),
          onPick: (key, idx) => {
            if (!this.afford(upgradePrice)) { UI.toast('金幣不夠。'); return; }
            State.gold -= upgradePrice;
            const before = Cardlib.get(key).name;
            State.deck[idx] = Cardlib.upgrade(key);
            s.upgradeUsed = true;
            Sfx.unlock();
            UI.toast(`<b>${before}</b> → <b>${Cardlib.get(State.deck[idx]).name}</b>`);
            this.render(); UI.refreshSidebar(); Meta.saveRun();
          },
        }) },
    ];
    services.forEach(svc => {
      const d = document.createElement('div');
      d.className = 'shop-svc' + (svc.used ? ' sold' : '');
      d.innerHTML = `<div class="sr-icon">${svc.icon}</div>
        <div class="sr-body"><div class="sr-name">${svc.name}</div><div class="sr-desc">${svc.desc}</div></div>
        <div class="price ${this.afford(svc.price) ? '' : 'poor'}">${svc.used ? '已使用' : '🪙 ' + svc.price}</div>`;
      if (!svc.used) d.onclick = () => { Sfx.click(); svc.act(); };
      svcRow.appendChild(d);
    });
  },

  leave() {
    if (State.mode !== 'shop') return;
    this.node.done = true;
    UI.hide('overlay-shop');
    State.mode = 'explore';
    Sfx.playTrack('explore');
    Explore.render();
    Meta.saveRun();
  },
};
