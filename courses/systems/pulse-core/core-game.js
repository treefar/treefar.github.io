// 脈衝防禦：星核守護者 - 核心邏輯引擎
// 只保留遊戲邏輯，不依賴 DOM 或 Canvas API，方便自動化測試。

class CoreGame {
  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;

    // 事件中心：支援 on('hit'|'parry'|'enemyDestroyed'|'damage'|'combo'|'gameover')
    this._events = {};

    // 視覺半徑採中心坐標系，核心放在 (0, 0)
    this.coreRadius = 24;
    this.baseCoreHp = 100;

    // 盾牌半開角約 60 度 (PI/3)
    this.shieldSpan = Math.PI / 3;

    // 產生與更新節奏
    this.spawnInterval = 1.0; // 秒
    this.enemySpawnTimer = 0;

    // 完美格擋視窗：按下後 60ms
    this.parryWindowDuration = 0.06;
    this.parryWindowRemain = 0;
    this._prevParry = false;

    this.reset();
  }

  /**
   * 註冊事件監聽
   * @param {'hit'|'parry'|'enemyDestroyed'|'damage'|'combo'|'gameover'} eventName
   * @param {(payload:any)=>void} callback
   * @returns {() => void} 取消註冊函式
   */
  on(eventName, callback) {
    if (!this._events[eventName]) this._events[eventName] = [];
    this._events[eventName].push(callback);

    // 回傳取消註冊 API，便於測試清理
    return () => {
      const list = this._events[eventName];
      const idx = list.indexOf(callback);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  /**
   * 重設關卡狀態
   */
  reset() {
    this.core = {
      x: 0,
      y: 0,
      radius: this.coreRadius,
      hp: this.baseCoreHp,
      maxHp: this.baseCoreHp
    };

    this.score = 0;
    this.combo = 0;
    this.enemies = [];
    this.bullets = [];
    this.particleEvents = [];
    this.time = 0;
    this.enemySpawnTimer = 0;
    this.isGameOver = false;
    this.parryWindowRemain = 0;
    this._prevParry = false;
    this.shieldAngle = 0;

    return this.getState();
  }

  /**
   * 幀更新
   * @param {number} dt 毫秒或秒（兩者都可，若大於 1 自動視為毫秒）
   * @param {number} mouseAngle 盾牌中心角（弧度）
   * @param {boolean} isParrying 當前是否按下格擋
   */
  update(dt, mouseAngle, isParrying) {
    if (this.isGameOver) return;

    // 將 dt 統一為秒
    const delta = dt > 1 ? dt / 1000 : dt;
    this.time += delta;
    this._updateParryWindow(delta, isParrying);

    // 更新盾牌角度
    this.shieldAngle = this._normalizeAngle(mouseAngle || 0);

    // 生敵計時與固定間隔生成
    this.enemySpawnTimer += delta;
    while (this.enemySpawnTimer >= this.spawnInterval) {
      this.enemySpawnTimer -= this.spawnInterval;
      this._spawnEnemy();
    }

    // 更新敵人
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      this._updateEnemy(enemy, delta);

      // 判定是否到達核心
      const dist = Math.hypot(enemy.x, enemy.y);
      if (dist <= enemy.radius + this.core.radius) {
        if (this._angleWithinShield(Math.atan2(enemy.y, enemy.x))) {
          if (this.parryWindowRemain > 0) {
            this._handleParry(enemy, i);
          } else {
            this._handleShieldBlock(enemy, i);
          }
        } else {
          this._handleCoreDamage(enemy, i);
        }

        continue;
      }

      // 螺旋敵人會沿圓周短暫掠過矩形畫面邊界，但 orbitRadius 持續縮小，
      // 不能套用直線敵人的離場規則，否則會在到達核心前被誤刪。
      if (enemy.type !== 'spiral' && this._isOutOfBounds(enemy.x, enemy.y, 80)) {
        this.enemies.splice(i, 1);
      }
    }

    // 更新穿透光束（parry 反彈後）
    for (let j = this.bullets.length - 1; j >= 0; j--) {
      const b = this.bullets[j];
      b.x += b.vx * delta;
      b.y += b.vy * delta;
      b.life -= delta;

      if (b.life <= 0 || this._isOutOfBounds(b.x, b.y, b.radius * 2)) {
        this.bullets.splice(j, 1);
      }
    }
  }

  /**
   * 取得可供外部渲染與測試的狀態快照
   */
  getState() {
    const snapshot = {
      width: this.width,
      height: this.height,
      time: this.time,
      isGameOver: this.isGameOver,
      core: {
        x: this.core.x,
        y: this.core.y,
        radius: this.core.radius,
        hp: this.core.hp,
        maxHp: this.core.maxHp
      },
      shield: {
        angle: this.shieldAngle || 0,
        halfSpan: this.shieldSpan / 2,
      },
      score: this.score,
      combo: this.combo,
      enemies: this.enemies.map((enemy) => ({ ...enemy })),
      bullets: this.bullets.map((bullet) => ({ ...bullet })),
      particleEvents: this.particleEvents.slice()
    };

    // 粒子事件為一次性事件流，避免重複消耗
    this.particleEvents.length = 0;
    return snapshot;
  }

  /**
   * 根據 delta 與輸入更新完美格擋視窗
   */
  _updateParryWindow(delta, isParrying) {
    const pressing = Boolean(isParrying);
    if (pressing && !this._prevParry) {
      this.parryWindowRemain = this.parryWindowDuration;
    }
    this._prevParry = pressing;

    if (this.parryWindowRemain > 0) {
      this.parryWindowRemain = Math.max(0, this.parryWindowRemain - delta);
    }
  }

  /**
   * 產生敵人：邊界隨機邊，含三種型態
   */
  _spawnEnemy() {
    const hw = this.width / 2;
    const hh = this.height / 2;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    const margin = 32;

    if (side === 0) {
      x = this._randRange(-hw, hw);
      y = -hh - margin;
    } else if (side === 1) {
      x = this._randRange(-hw, hw);
      y = hh + margin;
    } else if (side === 2) {
      x = -hw - margin;
      y = this._randRange(-hh, hh);
    } else {
      x = hw + margin;
      y = this._randRange(-hh, hh);
    }

    const typeRand = Math.random();
    let type = 'chaser';
    if (typeRand > 0.66) type = 'splitter';
    else if (typeRand > 0.33) type = 'spiral';

    const baseSpeed = this._randRange(110, 190);
    const angleToCore = Math.atan2(-y, -x);

    const enemy = {
      id: this._nextId(),
      type,
      x,
      y,
      radius: this._randRange(9, 14),
      speed: baseSpeed,
      damage: this._randRangeInt(4, 10),
      splitTier: 0,
      maxSplitTier: 1
    };

    if (type === 'spiral') {
      const dist = Math.hypot(x, y);
      enemy.orbitRadius = dist;
      enemy.theta = angleToCore;
      enemy.radialSpeed = this._randRange(45, 75);
      enemy.angularSpeed = this._randRange(1.0, 2.6) * (Math.random() < 0.5 ? 1 : -1);
      enemy.x = enemy.orbitRadius * Math.cos(enemy.theta);
      enemy.y = enemy.orbitRadius * Math.sin(enemy.theta);
    } else {
      enemy.vx = Math.cos(angleToCore) * enemy.speed;
      enemy.vy = Math.sin(angleToCore) * enemy.speed;
    }

    if (type === 'splitter') {
      enemy.radius = 16;
      enemy.speed = baseSpeed * 0.9;
      enemy.vx = Math.cos(angleToCore) * enemy.speed;
      enemy.vy = Math.sin(angleToCore) * enemy.speed;
    }

    this.enemies.push(enemy);
    this._emit('enemySpawned', {
      time: this.time,
      enemy: { ...enemy }
    });
  }

  /**
   * 更新敵人運動行為
   */
  _updateEnemy(enemy, dt) {
    if (enemy.type === 'spiral') {
      enemy.orbitRadius = Math.max(0, enemy.orbitRadius - enemy.radialSpeed * dt);
      enemy.theta += enemy.angularSpeed * dt;
      enemy.x = enemy.orbitRadius * Math.cos(enemy.theta);
      enemy.y = enemy.orbitRadius * Math.sin(enemy.theta);
      return;
    }

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
  }

  /**
   * 非完美盾擊：一般阻擋，移除敵人並加分
   */
  _handleShieldBlock(enemy, index) {
    const enemyInfo = this.enemies.splice(index, 1)[0];
    const inShield = true;

    if (enemyInfo.type === 'splitter' && enemyInfo.splitTier < enemyInfo.maxSplitTier) {
      this._spawnSplitterFragments(enemyInfo);
    }

    this._increaseCombo(1);
    const baseScore = 10;
    this.score += baseScore;
    this._emit('hit', {
      type: 'shieldBlock',
      enemy: this._snapshotEnemy(enemyInfo),
      score: baseScore,
      combo: this.combo
    });
    this._emit('enemyDestroyed', {
      enemy: this._snapshotEnemy(enemyInfo),
      reason: 'block'
    });

    this._pushParticle('block', enemyInfo.x, enemyInfo.y, {
      score: baseScore,
      combo: this.combo
    });
  }

  /**
   * 完美格擋：觸發 parry 並反彈生成高速光束
   */
  _handleParry(enemy, index) {
    const enemyInfo = this.enemies.splice(index, 1)[0];
    const contactAngle = Math.atan2(enemyInfo.y, enemyInfo.x);
    const outDirX = Math.cos(contactAngle);
    const outDirY = Math.sin(contactAngle);

    if (enemyInfo.type === 'splitter' && enemyInfo.splitTier < enemyInfo.maxSplitTier) {
      // splitter 在反彈同時也會分裂為兩個碎片光束
      const spread = 0.32;
      const speed = enemyInfo.speed * 2.5;
      for (const sign of [-1, 1]) {
        const a = contactAngle + sign * spread;
        this.bullets.push({
          id: this._nextId(),
          parentType: enemyInfo.type,
          type: 'pierceBeam',
          x: enemyInfo.x,
          y: enemyInfo.y,
          radius: Math.max(3, enemyInfo.radius * 0.55),
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: 1.8,
          speed
        });
      }
    } else {
      // 一般敵人反彈為單束光束
      const speed = enemyInfo.speed * 2.5;
      this.bullets.push({
        id: this._nextId(),
        parentType: enemyInfo.type,
        type: 'pierceBeam',
        x: enemyInfo.x,
        y: enemyInfo.y,
        radius: Math.max(3, enemyInfo.radius * 0.55),
        vx: outDirX * speed,
        vy: outDirY * speed,
        life: 1.8,
        speed
      });
    }

    const bonus = 60 + this.combo * 12;
    this.combo += 2; // 完美格擋拉高連擊
    this.score += bonus;

    this._emit('parry', {
      enemy: this._snapshotEnemy(enemyInfo),
      bonus,
      combo: this.combo,
      windowRemain: this.parryWindowRemain
    });
    this._emit('combo', {
      combo: this.combo,
      delta: +2,
      reason: 'parry'
    });
    this._emit('enemyDestroyed', {
      enemy: this._snapshotEnemy(enemyInfo),
      reason: 'parry'
    });

    this._pushParticle('parry', enemyInfo.x, enemyInfo.y, {
      score: bonus,
      combo: this.combo
    });
  }

  /**
   * 核心受傷：中斷連擊，扣血
   */
  _handleCoreDamage(enemy, index) {
    const enemyInfo = this.enemies.splice(index, 1)[0];
    const damage = enemyInfo.damage;
    this.core.hp = Math.max(0, this.core.hp - damage);
    this.combo = 0;

    this._emit('damage', {
      damage,
      hp: this.core.hp,
      enemy: this._snapshotEnemy(enemyInfo)
    });
    this._emit('combo', {
      combo: this.combo,
      delta: -1,
      reason: 'damage'
    });
    this._pushParticle('damage', 0, 0, {
      damage,
      hp: this.core.hp
    });

    if (this.core.hp <= 0) {
      this.isGameOver = true;
      this._emit('gameover', {
        time: this.time,
        score: this.score,
        combo: this.combo
      });
    }
  }

  /**
   * splitter 被碰撞後生成兩個小碎片
   */
  _spawnSplitterFragments(enemy) {
    const angle = Math.atan2(enemy.y, enemy.x);
    const baseSpeed = enemy.speed * 1.2;
    const speed1 = baseSpeed * 1.4;
    const speed2 = baseSpeed * 1.4;
    const splitGap = 0.55;

    for (const sign of [-1, 1]) {
      const a = angle + sign * splitGap;
      const speed = a > 0 ? speed1 : speed2;
      this.enemies.push({
        id: this._nextId(),
        type: 'splitter',
        x: enemy.x + Math.cos(a) * enemy.radius,
        y: enemy.y + Math.sin(a) * enemy.radius,
        radius: Math.max(5, enemy.radius * 0.55),
        speed,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        damage: Math.max(1, Math.floor(enemy.damage * 0.7)),
        splitTier: enemy.splitTier + 1,
        maxSplitTier: enemy.maxSplitTier,
        typeLabel: 'fragment'
      });
    }

    this._emit('enemySpawned', {
      time: this.time,
      splitFrom: this._snapshotEnemy(enemy),
      pieces: 2
    });
    this._pushParticle('split', enemy.x, enemy.y, {
      count: 2
    });
  }

  _increaseCombo(delta) {
    this.combo = Math.max(0, this.combo + delta);
    this._emit('combo', {
      combo: this.combo,
      delta,
      reason: 'block'
    });
  }

  _snapshotEnemy(enemy) {
    return {
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius,
      speed: enemy.speed,
      splitTier: enemy.splitTier || 0
    };
  }

  _emit(eventName, payload = {}) {
    const listeners = this._events[eventName];
    if (!listeners || listeners.length === 0) return;
    const data = { time: this.time, ...payload };
    for (const cb of [...listeners]) cb(data);
  }

  _pushParticle(type, x, y, extra = {}) {
    this.particleEvents.push({
      type,
      t: this.time,
      x,
      y,
      ...extra
    });
  }

  _isOutOfBounds(x, y, margin = 0) {
    const hw = this.width / 2;
    const hh = this.height / 2;
    return x < -hw - margin || x > hw + margin || y < -hh - margin || y > hh + margin;
  }

  _angleWithinShield(angle) {
    const halfSpan = this.shieldSpan / 2;
    const diff = Math.abs(this._angleDiff(this.shieldAngle || 0, angle));
    return diff <= halfSpan;
  }

  _angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  _normalizeAngle(rad) {
    let a = rad;
    while (a >= Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  _randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  _randRangeInt(min, max) {
    return Math.floor(this._randRange(min, max + 1));
  }

  _nextId() {
    if (!this._nextIdSeed) this._nextIdSeed = 1;
    return this._nextIdSeed++;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreGame;
}
