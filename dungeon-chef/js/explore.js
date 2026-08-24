/* =========================================================
   explore.js — 第一人稱走廊探索（對應 Unity 的 ExploreSystem）
   格子前進/後退、節點互動、採集、寶箱、事件、岔路、樓層盡頭
   ========================================================= */

const Explore = {
  stepping: false,

  nodeVisual(node) {
    if (!node || node.done) return null;
    switch (node.type) {
      case 'forage': return { src: Art.icon(node.plant), fallback: PLANTS[node.plant].icon };
      case 'fight': return { src: Art.enemy(node.enemies[0]), fallback: ENEMIES[node.enemies[0]].icon };
      case 'elite': return { src: Art.enemy(node.enemies[0]), fallback: ENEMIES[node.enemies[0]].icon };
      case 'campfire': return { src: Art.vfx('embers'), fallback: '🔥' };
      case 'chest': return { src: Art.relic('bentoBox'), fallback: '📦' };
      case 'pachinko': return { src: Art.relic('gamblerDice'), fallback: '🎰' };
      case 'shop': return { src: Art.relic('brassScale'), fallback: '🛒' };
      case 'event': return { src: Art.relic('mysteryTin'), fallback: '❓' };
      case 'branch': return { src: Art.map(`floor${State.floorIndex + 1}`), fallback: '🚪' };
      case 'boss': return { src: Art.enemy(node.enemies[0]), fallback: ENEMIES[node.enemies[0]].icon };
      default: return null;
    }
  },

  render() {
    const box = Util.el('corridor-objects');
    box.innerHTML = '';
    for (let d = 0; d <= 3; d++) {
      const node = State.nodes[State.nodeIndex + d];
      if (!node) continue;
      const visual = this.nodeVisual(node);
      if (!visual) continue;
      const div = document.createElement('div');
      div.className = `cor-obj d${d}`;
      div.innerHTML = visual.src
        ? `<img class="obj-art" src="${visual.src}" alt="" draggable="false">`
        : `<span class="obj-emoji">${visual.fallback}</span>`;
      box.appendChild(div);
    }
    this.updateHint();
  },

  updateHint() {
    if (State.mode !== 'explore') return;
    const node = State.currentNode();
    const lines = [];
    if (node && !node.done) {
      if (node.type === 'forage') {
        const p = PLANTS[node.plant];
        lines.push(`<kbd>SPACE</kbd>採集 ${p.icon}${p.name}`);
        const heal = p.rawHeal * (Relics.has('silverFork') ? 2 : 1);
        lines.push(`<kbd>E</kbd>直接生吃（回復 ${heal} HP）`);
      } else if (node.type === 'campfire') {
        lines.push(`<kbd>SPACE</kbd>使用營火`);
      } else if (node.type === 'pachinko') {
        lines.push(`<kbd>SPACE</kbd>玩一場部落青哥`);
      } else if (node.type === 'shop') {
        lines.push(`<kbd>SPACE</kbd>找廚具商販做生意`);
      }
    }
    if (State.atFloorEnd() && (!node || node.done)) {
      lines.push(State.floorIndex + 1 < FLOORS.length
        ? `<kbd>W</kbd>下樓，前往「${FLOORS[State.floorIndex + 1].zone}」`
        : '🏆 已經是最深處了');
    } else if (!lines.length && State.nextNode()) {
      lines.push(`<kbd>W</kbd>前進`);
    }
    UI.setHint(lines);
  },

  /* ---------------- 移動 ---------------- */
  forward() {
    if (this.stepping || State.mode !== 'explore') return;
    if (!State.nextNode()) {
      // 樓層盡頭：往下一層
      const cur = State.currentNode();
      if (!cur || cur.done) Game.nextFloor();
      return;
    }
    this.stepAnim(false, () => {
      State.nodeIndex++;
      if (Relics.has('stockPot')) {
        const h = State.heal(2);
        if (h) UI.float(24, 50, `🍲+${h}`, 'ft-heal');
      }
      UI.refreshSidebar();
      this.render();
      Meta.saveRun();
      this.arrive();
    });
  },

  backward() {
    if (this.stepping || State.mode !== 'explore') return;
    if (State.nodeIndex <= 0) return;
    this.stepAnim(true, () => {
      State.nodeIndex--;
      UI.refreshSidebar();
      this.render();
      this.updateHint();
    });
  },

  stepAnim(back, onDone) {
    this.stepping = true;
    Sfx.step();
    const cor = Util.el('corridor');
    const hands = Util.el('hands');
    cor.classList.add(back ? 'stepping-back' : 'stepping');
    hands.classList.add('bobbing');
    setTimeout(() => {
      cor.classList.remove('stepping', 'stepping-back');
      hands.classList.remove('bobbing');
      this.stepping = false;
      if (onDone) onDone();
    }, 320);
  },

  /* ---------------- 抵達節點 ---------------- */
  arrive() {
    const node = State.currentNode();
    if (!node || node.done) { this.updateHint(); return; }
    switch (node.type) {
      case 'fight': case 'elite': case 'boss':
        Game.startBattle(node); break;
      case 'chest':
        this.lootChest(node); break;
      case 'branch':
        this.openBranch(node); break;
      case 'event':
        this.openEvent(node); break;
      default:
        this.updateHint();
    }
  },

  /* ---------------- SPACE 互動 ---------------- */
  interact() {
    if (State.mode !== 'explore' || this.stepping) return;
    const node = State.currentNode();
    if (!node || node.done) {
      if (State.atFloorEnd()) Game.nextFloor();
      return;
    }
    if (node.type === 'forage') {
      const p = PLANTS[node.plant];
      State.addPlant(node.plant);
      node.done = true;
      Sfx.pickup();
      UI.float(50, 52, `＋${p.icon}${p.name}`, 'ft-heal');
      UI.setMood('happy', 900);
      UI.refreshSidebar();
      this.render();
      Meta.saveRun();
    } else if (node.type === 'campfire') {
      Campfire.open(node);
    } else if (node.type === 'pachinko') {
      Pachinko.open(node);
    } else if (node.type === 'shop') {
      Shop.open(node);
    }
  },

  /* ---------------- E 生吃 ---------------- */
  eatRaw() {
    if (State.mode !== 'explore' || this.stepping) return;
    const node = State.currentNode();
    if (!node || node.done || node.type !== 'forage') return;
    const p = PLANTS[node.plant];
    const amount = p.rawHeal * (Relics.has('silverFork') ? 2 : 1);
    const healed = State.heal(amount);
    if (Relics.has('silverFork')) State.addGold(3);
    node.done = true;
    Sfx.pickup();
    UI.float(50, 52, `🍴 +${healed} HP`, 'ft-heal');
    UI.setMood('munch', 1100);
    UI.refreshSidebar();
    this.render();
    Meta.saveRun();
  },

  /* ---------------- 寶箱 ---------------- */
  lootChest(node) {
    node.done = true;
    const gold = 25 + Util.rand(20) + State.floorIndex * 10;
    State.addGold(gold);
    Sfx.gold();
    UI.float(46, 46, `＋${gold} 🪙`, 'ft-gold');
    // 深層寶箱有機會直接開出遺物
    if (Math.random() < 0.35 + State.floorIndex * 0.1) {
      const rid = Relics.grantRandom();
      if (rid) {
        Sfx.relic();
        setTimeout(() => UI.float(56, 38, `${RELICS[rid].icon} ${RELICS[rid].name}`, 'ft-gold'), 350);
        UI.toast(`獲得遺物 <b>${RELICS[rid].name}</b>：${RELICS[rid].desc}`);
      }
    } else {
      const part = Util.pick(Object.keys(PARTS).slice(0, 8));
      State.addPart(part);
      setTimeout(() => UI.float(56, 52, `＋${PARTS[part].icon}${PARTS[part].name}`, 'ft-heal'), 350);
    }
    UI.setMood('happy', 1200);
    UI.refreshSidebar();
    this.render();
    Meta.saveRun();
  },

  /* ---------------- 岔路 ---------------- */
  openBranch(node) {
    State.mode = 'branch';
    const doors = Util.el('overlay-branch').querySelectorAll('.branch-door');
    doors[0].querySelector('.door-desc').innerText = node.left.desc;
    doors[1].querySelector('.door-desc').innerText = node.right.desc;
    doors.forEach(d => {
      d.onclick = () => {
        Sfx.click();
        const side = d.dataset.dir === '0' ? node.left : node.right;
        node.done = true;
        State.nodes.splice(State.nodeIndex + 1, 0, ...JSON.parse(JSON.stringify(side.nodes)));
        UI.hide('overlay-branch');
        State.mode = 'explore';
        UI.refreshSidebar();
        this.render();
        Meta.saveRun();
      };
    });
    UI.show('overlay-branch');
  },

  /* ---------------- 隨機事件 ---------------- */
  openEvent(node) {
    State.mode = 'event';
    if (!node.eventId) {
      const pool = EVENTS.filter(e => !(State.seenEvents || []).includes(e.id));
      const ev = pool.length ? Util.pick(pool) : Util.pick(EVENTS);
      node.eventId = ev.id;
      State.seenEvents = (State.seenEvents || []).concat([ev.id]);
    }
    const ev = EVENTS.find(e => e.id === node.eventId) || EVENTS[0];
    const eventArt = Art.event(ev.id);
    Util.el('event-icon').innerHTML = eventArt
      ? `<img src="${eventArt}" alt="" draggable="false">`
      : ev.icon;
    Util.el('event-title').textContent = ev.title;
    Util.el('event-text').textContent = ev.text;
    Util.el('event-result').innerHTML = '';
    const row = Util.el('event-choices');
    row.innerHTML = '';
    ev.choices.forEach(ch => {
      const b = document.createElement('div');
      b.className = 'event-choice';
      b.innerHTML = `<div class="ec-label">${ch.label}</div><div class="ec-hint">${ch.hint}</div>`;
      b.onclick = () => {
        Sfx.click();
        const msg = ch.run();
        node.done = true;
        row.innerHTML = '';
        Util.el('event-result').innerHTML = `<div class="ev-msg">${msg}</div>`;
        const done = document.createElement('button');
        done.className = 'ov-skip';
        done.textContent = '繼續前進';
        done.onclick = () => {
          UI.hide('overlay-event');
          State.mode = 'explore';
          UI.refreshSidebar();
          this.render();
          Meta.saveRun();
        };
        Util.el('event-result').appendChild(done);
        UI.refreshSidebar();
      };
      row.appendChild(b);
    });
    UI.show('overlay-event');
  },
};
