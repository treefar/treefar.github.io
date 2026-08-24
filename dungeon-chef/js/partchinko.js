/* =========================================================
   partchinko.js — 部落青哥（對應 Unity 的 PachinkoSystem）
   把多餘的部位/植物丟進釘板，落格換獎勵。
   中間的「大獎」格最窄最難進，兩側小金最寬 —— 風險與期望值的權衡。
   ========================================================= */

const Pachinko = {
  node: null,
  canvas: null, ctx: null,
  pegs: [], balls: [],
  selItem: null,
  running: false,
  rafId: null,

  W: 380, H: 440,
  PEG_R: 5, BALL_R: 9,
  SLOT_TOP: 395,
  /* 五格寬度（總和 = 1）：兩端最寬，中間大獎最窄 */
  SLOT_W: [0.26, 0.24, 0.10, 0.24, 0.16],

  open(node) {
    this.node = node;
    State.mode = 'pachinko';
    Sfx.playTrack('calm');
    this.canvas = Util.el('pachinko-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.buildPegs();
    this.balls = [];
    this.selItem = null;
    this.renderChips();
    this.draw();
    UI.show('overlay-pachinko');

    this.canvas.onclick = (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (this.W / rect.width);
      this.drop(x);
    };
    Util.el('btn-pachinko-leave').onclick = () => this.leave();
  },

  buildPegs() {
    this.pegs = [];
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const y = 78 + r * 42;
      const offset = (r % 2) ? 28 : 0;
      for (let x = 34 + offset; x < this.W - 20; x += 56) this.pegs.push({ x, y });
    }
  },

  /* 累積寬度 → 判定落在第幾格 */
  slotEdges() {
    const edges = []; let acc = 0;
    this.SLOT_W.forEach(w => { acc += w; edges.push(acc * this.W); });
    return edges;
  },
  slotAt(x) {
    const edges = this.slotEdges();
    for (let i = 0; i < edges.length; i++) if (x < edges[i]) return i;
    return edges.length - 1;
  },

  renderChips() {
    const box = Util.el('pachinko-parts');
    box.innerHTML = '';
    const addChips = (ids, defs, kind) => {
      const counts = {};
      ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
      Object.keys(counts).forEach(id => {
        const def = defs[id];
        const sel = this.selItem && this.selItem.kind === kind && this.selItem.id === id;
        const chip = document.createElement('div');
        chip.className = 'chip' + (sel ? ' sel' : '');
        chip.innerHTML = `${Art.inline(id, def.icon)}<span>${def.name}</span><b>×${counts[id]}</b>`;
        chip.onclick = () => { Sfx.hover(); this.selItem = sel ? null : { kind, id }; this.renderChips(); };
        box.appendChild(chip);
      });
    };
    addChips(State.parts, PARTS, 'part');
    addChips(State.plants, PLANTS, 'plant');
    if (!box.children.length) {
      box.innerHTML = '<span class="chip-empty">背包空了…<br>去採集或狩獵吧</span>';
    } else {
      const tip = document.createElement('div');
      tip.className = 'pk-tip';
      tip.innerHTML = this.selItem
        ? `點釘板上方投下！${Relics.has('gamblerDice') ? '<br>🎲 賭徒骰：一次投兩顆' : ''}`
        : '先選一份食材';
      box.appendChild(tip);
    }
  },

  drop(x) {
    if (!this.selItem) return;
    const { kind, id } = this.selItem;
    const def = kind === 'part' ? PARTS[id] : PLANTS[id];
    if (kind === 'part') State.removePart(id); else State.removePlant(id);
    const balls = Relics.has('gamblerDice') ? 2 : 1;
    for (let i = 0; i < balls; i++) {
      this.balls.push({
        x: Util.clamp(x + (i ? (Math.random() - 0.5) * 26 : 0), 20, this.W - 20), y: 18,
        vx: (Math.random() - 0.5) * 1.2, vy: 0,
        icon: def.icon, settled: false, alpha: 1,
      });
    }
    Sfx.cardPlay();
    this.selItem = null;
    this.renderChips();
    UI.refreshSidebar();
    if (!this.running) { this.running = true; this.loop(); }
  },

  loop() {
    this.step();
    this.draw();
    if (this.balls.length) { this.rafId = requestAnimationFrame(() => this.loop()); }
    else { this.running = false; Meta.saveRun(); }
  },

  step() {
    const G = 0.22, REST = 0.55;
    this.balls.forEach(b => {
      if (b.settled) { b.alpha -= 0.03; return; }
      b.vy += G;
      b.x += b.vx; b.y += b.vy;
      if (b.x < this.BALL_R + 6) { b.x = this.BALL_R + 6; b.vx = Math.abs(b.vx) * REST; }
      if (b.x > this.W - this.BALL_R - 6) { b.x = this.W - this.BALL_R - 6; b.vx = -Math.abs(b.vx) * REST; }
      this.pegs.forEach(p => {
        const dx = b.x - p.x, dy = b.y - p.y;
        const dist = Math.hypot(dx, dy);
        const minD = this.BALL_R + this.PEG_R;
        if (dist < minD && dist > 0.01) {
          const nx = dx / dist, ny = dy / dist;
          b.x = p.x + nx * minD; b.y = p.y + ny * minD;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * REST + (Math.random() - 0.5) * 0.7;
          b.vy = (b.vy - 2 * dot * ny) * REST;
          if (Math.abs(dot) > 1.2) Sfx.peg();
        }
      });
      if (b.y > this.SLOT_TOP - this.BALL_R) {
        b.y = this.SLOT_TOP - this.BALL_R;
        b.settled = true;
        this.payout(this.slotAt(b.x));
      }
    });
    this.balls = this.balls.filter(b => b.alpha > 0);
  },

  payout(slotIdx) {
    const slot = PACHINKO_SLOTS[slotIdx] || PACHINKO_SLOTS[1];
    const fBonus = State.floorIndex * 8;
    switch (slot.id) {
      case 'card': {
        const cardId = Util.pick(Meta.rewardPool());
        State.deck.push(cardId);
        State.stats.cardsAdded++;
        Sfx.unlock();
        UI.float(50, 32, `🃏 獲得卡牌：${CARDS[cardId].name}！`, 'ft-gold');
        break;
      }
      case 'gold20': case 'gold20b': {
        const g = 20 + fBonus + Util.rand(10);
        State.addGold(g); Sfx.gold();
        UI.float(50, 32, `＋${g} 🪙`, 'ft-gold');
        break;
      }
      case 'meat': {
        const part = Util.pick(Object.keys(PARTS).slice(0, 10));
        State.addPart(part);
        Sfx.pickup();
        UI.float(50, 32, `＋${PARTS[part].icon}${PARTS[part].name}`, 'ft-heal');
        break;
      }
      case 'jackpot': {
        if (Math.random() < 0.5) {
          const rid = Relics.grantRandom();
          if (rid) {
            Sfx.relic();
            UI.float(50, 30, `💎 大獎！遺物「${RELICS[rid].name}」`, 'ft-gold');
            UI.toast(`獲得遺物 <b>${RELICS[rid].name}</b>：${RELICS[rid].desc}`);
            break;
          }
        }
        const g = 90 + fBonus * 2;
        State.addGold(g); State.heal(10); Sfx.gold();
        UI.float(50, 30, `💎 大獎！＋${g} 🪙 ＋10 HP`, 'ft-gold');
        break;
      }
    }
    UI.setMood('happy', 1000);
    UI.refreshSidebar();
    this.renderChips();
  },

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.W, this.H);
    this.pegs.forEach(p => {
      c.beginPath();
      c.arc(p.x, p.y, this.PEG_R, 0, Math.PI * 2);
      c.fillStyle = '#d9c69e';
      c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 3; c.shadowOffsetY = 2;
      c.fill();
      c.shadowColor = 'transparent';
    });
    const edges = this.slotEdges();
    let left = 0;
    for (let i = 0; i < 5; i++) {
      const right = edges[i];
      const w = right - left;
      const isJack = PACHINKO_SLOTS[i].id === 'jackpot';
      c.fillStyle = isJack ? 'rgba(240,180,60,.34)' : (i % 2 ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.42)');
      c.fillRect(left, this.SLOT_TOP, w, this.H - this.SLOT_TOP);
      c.strokeStyle = isJack ? '#f0d98c' : '#1d130c'; c.lineWidth = 3;
      c.strokeRect(left, this.SLOT_TOP, w, this.H - this.SLOT_TOP);
      c.font = '17px serif'; c.textAlign = 'center';
      c.fillStyle = '#f0d98c';
      c.fillText(PACHINKO_SLOTS[i].icon, left + w / 2, this.SLOT_TOP + 20);
      c.font = 'bold 11px sans-serif';
      c.fillStyle = '#efe3c8';
      c.fillText(PACHINKO_SLOTS[i].label, left + w / 2, this.SLOT_TOP + 37);
      left = right;
    }
    this.balls.forEach(b => {
      c.globalAlpha = Math.max(0, b.alpha);
      c.font = '20px serif'; c.textAlign = 'center';
      c.fillText(b.icon, b.x, b.y + 7);
      c.globalAlpha = 1;
    });
  },

  leave() {
    if (State.mode !== 'pachinko') return;
    this.node.done = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.balls = []; this.running = false;
    UI.hide('overlay-pachinko');
    State.mode = 'explore';
    Sfx.playTrack('explore');
    Explore.render();
    Meta.saveRun();
  },
};
