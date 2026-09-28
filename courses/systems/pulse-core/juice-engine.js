/**
 * JuiceEngine —《脈衝防禦：星核守護者》打擊感與視覺音訊反饋引擎
 * 純 JavaScript (ES6 Class) 實作，專為 Canvas 遊戲注入 Game Juice。
 * 包含：頓：頓幀、螢幕震動、爆炸粒子、浮動文字、純 Web Audio 程序化音效。
 */

class JuiceEngine {
  /**
   * 建構式 — 綁定 Canvas 並初始化所有子系統
   * @param {HTMLCanvasElement} canvas — 遊戲繪圖用 Canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // ========== 音訊系統 ==========
    this.audioCtx = null;
    this.audioInitialized = false;

    // ========== 震動系統 ==========
    this.trauma = 0;           // 當前創傷值 (0~1)
    this.maxOffset = 12;       // 最大震動偏移像素
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeAngle = 0;
    this.shakeDecay = 0.88;    // 創傷指數衰減係數

    // ========== 頓幀系統 ==========
    this.freezeRemaining = 0;  // 剩餘凍結時間 (ms)
    this.isFrozen = false;

    // ========== 閃白系統 ==========
    this.flashAlpha = 0;
    this.flashColor = 'rgba(255,255,255,0.4)';
    this.flashDuration = 0;

    // ========== 粒子系統 ==========
    this.particles = [];

    // ========== 浮動文字系統 ==========
    this.floatingTexts = [];

    // ========== 預設粒子速度 ==========
    this.defaultParticleSpeed = 200;
    this.defaultParticleCount = 20;
  }

  // ─────────────────────────────────────────────
  //  音訊初始化 — 處理瀏覽器 Autoplay 限制
  // ─────────────────────────────────────────────
  /**
   * 初始化 AudioContext，需在使用者互動後呼叫以符合瀏覽器自動播放策略
   */
  initAudio() {
    if (this.audioInitialized && this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.audioInitialized = true;
      // 若狀態為 suspended（瀏覽器阻止），需等使用者互動後 resume
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (err) {
      console.warn('[JuiceEngine] Web Audio API 無法初始化：', err);
    }
  }

  // ─────────────────────────────────────────────
  //  程序化音效合成 — 完全不需要外部音檔
  // ─────────────────────────────────────────────
  /**
   * 使用 Web Audio API 即時合成音效
   * @param {string} type — 音效類型：'hit' | 'parry' | 'damage' | 'explode'
   */
  playSound(type) {
    if (!this.audioCtx || !this.audioInitialized) return;
    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'hit': {
        // 短促清脆金屬敲擊聲：高頻 Sine/Triangle + 快速衰減
        const osc1 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2000, now);
        osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 0.12);
        break;
      }

      case 'parry': {
        // 明亮清澈水晶完美格擋和弦音：雙振盪器雙音諧波
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1108.73, now); // E6 (完美五度)
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);

        // 加入泛音層
        const osc3 = this.audioCtx.createOscillator();
        const gain3 = this.audioCtx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(1760, now);
        gain3.gain.setValueAtTime(0.08, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc3.connect(gain3);
        gain3.connect(this.audioCtx.destination);
        osc3.start(now);
        osc3.stop(now + 0.4);
        break;
      }

      case 'damage': {
        // 低沈受損警告警報：Sawtooth 快速向下變頻
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        // 加入低通濾波器讓聲音更悶
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'explode': {
        // 震撼爆炸重低音：White Noise 緩衝區 + 極低頻 + 低通濾波器
        const bufferSize = this.audioCtx.sampleRate * 0.4;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.5);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        // 疊加極低頻正弦波衝擊
        const subOsc = this.audioCtx.createOscillator();
        const subGain = this.audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, now); // A1
        subGain.gain.setValueAtTime(0.4, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        subOsc.connect(subGain);
        subGain.connect(this.audioCtx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        noise.start(now);
        noise.stop(now + 0.6);
        break;
      }

      default:
        console.warn(`[JuiceEngine] 未知的音效類型：${type}`);
    }
  }

  // ─────────────────────────────────────────────
  //  頓幀控制 — 擊中凍結
  // ─────────────────────────────────────────────
  /**
   * 觸發擊中頓幀
   * @param {number} ms — 凍結毫秒數
   */
  freeze(ms) {
    this.freezeRemaining = ms;
    this.isFrozen = ms > 0;
  }

  // ─────────────────────────────────────────────
  //  震動控制 — 基於創傷值
  // ─────────────────────────────────────────────
  /**
   * 觸發螢幕震動，基於創傷值計算振幅
   * @param {number} trauma — 創傷值 0~1
   */
  triggerShake(trauma) {
    this.trauma = Math.min(1, Math.max(0, trauma));
  }

  /**
   * 渲染前呼叫 — 應用震動偏移與旋轉到 Canvas 上下文的平移變換
   * @param {CanvasRenderingContext2D} ctx — Canvas 2D 渲染上下文
   */
  applyShake(ctx) {
    if (this.trauma <= 0.001) return;
    const amplitude = this.trauma * this.trauma * this.maxOffset; // 振幅 = trauma^2 * maxOffset
    const angle = (Math.random() - 0.5) * this.trauma * 0.05;
    this.shakeOffsetX = (Math.random() - 0.5) * amplitude * 2;
    this.shakeOffsetY = (Math.random() - 0.5) * amplitude * 2;
    this.shakeAngle = angle;
    ctx.save();
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    ctx.rotate(this.shakeAngle);
  }

  /**
   * 渲染後還原畫布
   * @param {CanvasRenderingContext2D} ctx — Canvas 2D 渲染上下文
   */
  resetShake(ctx) {
    if (this.trauma > 0.001) {
      ctx.restore();
    }
  }

  // ─────────────────────────────────────────────
  //  粒子系統 — 幾何碎片爆炸
  // ─────────────────────────────────────────────
  /**
   * 產生幾何碎片爆炸粒子
   * @param {number} x — 粒子產生中心 X
   * @param {number} y — 粒子產生中心 Y
   * @param {string} color — 粒子顏色
   * @param {number} [count=20] — 粒子數量
   * @param {number} [speed=200] — 粒子初始速度
   * @param {string} [shape='circle'] — 粒子形狀：'circle' | 'square' | 'triangle' | 'diamond'
   */
  spawnParticles(x, y, color, count = 20, speed = 200, shape = 'circle') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = speed * (0.5 + Math.random() * 0.8);
      const sizes = [3, 4, 5, 6, 8];
      const size = sizes[Math.floor(Math.random() * sizes.length)];

      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size,
        maxSize: size,
        color,
        shape,
        life: 1.0,
        decay: 0.8 + Math.random() * 1.2,  // 生命衰減率
        damping: 0.96,                       // 速度阻尼
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  // ─────────────────────────────────────────────
  //  浮動文字系統 — 連擊/傷害文字
  // ─────────────────────────────────────────────
  /**
   * 產生浮動文字，向上飄浮後逐漸淡出
   * @param {string} text — 顯示文字
   * @param {number} x — 文字起始 X
   * @param {number} y — 文字起始 Y
   * @param {string} [color='#00ffff'] — 文字顏色
   * @param {number} [size=20] — 文字大小 (px)
   */
  spawnText(text, x, y, color = '#00ffff', size = 20) {
    this.floatingTexts.push({
      text,
      x, y,
      color,
      size,
      life: 1.0,
      vy: -80 - Math.random() * 40,  // 向上飄浮速度
      scale: 1.0,
      scaleDir: 1  // 先放大後縮小
    });
  }

  // ─────────────────────────────────────────────
  //  全螢幕閃白
  // ─────────────────────────────────────────────
  /**
   * 觸發全螢幕閃白效果
   * @param {number} [durationMs=80] — 閃白持續時間
   * @param {string} [color='rgba(255,255,255,0.4)'] — 閃白顏色
   */
  flash(durationMs = 80, color = 'rgba(255,255,255,0.4)') {
    this.flashAlpha = 1.0;
    this.flashColor = color;
    this.flashDuration = durationMs;
  }

  // ─────────────────────────────────────────────
  //  更新邏輯 — 每幀呼叫
  // ─────────────────────────────────────────────
  /**
   * 更新所有子系統狀態：震動衰減、頓幀計時、粒子物理、文字飄浮
   * @param {number} dt — 這一幀的時間差 (秒)
   */
  update(dt) {
    // ---- 震動指數衰減 ----
    if (this.trauma > 0.001) {
      this.trauma *= this.shakeDecay;
      if (this.trauma < 0.001) this.trauma = 0;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeAngle = 0;
    }

    // ---- 頓幀計時 ----
    if (this.freezeRemaining > 0) {
      this.freezeRemaining -= dt * 1000;
      if (this.freezeRemaining <= 0) {
        this.freezeRemaining = 0;
        this.isFrozen = false;
      }
    }

    // ---- 閃白衰減 ----
    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt / (this.flashDuration / 1000);
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }

    // ---- 粒子物理更新 ----
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(p.damping, dt * 60);   // 根據 dt 標準化阻尼
      p.vy *= Math.pow(p.damping, dt * 60);
      p.vy += 100 * dt;                       // 微重力
      p.life -= p.decay * dt;
      p.rotation += p.rotSpeed * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // ---- 浮動文字更新 ----
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt * 1.2;

      // 縮放動畫：先放大後縮小
      const lifeRatio = ft.life;
      if (lifeRatio > 0.6) {
        ft.scale = 1.0 + (1.0 - lifeRatio) * 0.5;  // 上升段放大
      } else {
        ft.scale = 1.5 * (lifeRatio / 0.6);         // 下降段縮小
      }

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // ─────────────────────────────────────────────
  //  渲染 — 繪製所有視覺效果
  // ─────────────────────────────────────────────
  /**
   * 繪製所有粒子、浮動文字與全螢幕閃白層
   * @param {CanvasRenderingContext2D} ctx — Canvas 2D 渲染上下文
   */
  render(ctx) {
    // ---- 繪製粒子 ----
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;

      const s = Math.max(0.5, p.size * p.life); // 粒子隨生命縮小
      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(-s / 2, -s / 2, s, s);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.866, s * 0.5);
          ctx.lineTo(-s * 0.866, s * 0.5);
          ctx.closePath();
          ctx.fill();
          break;
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.6, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.6, 0);
          ctx.closePath();
          ctx.fill();
          break;
        default:
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
    }

    // ---- 繪製浮動文字 ----
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.round(ft.size * ft.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 12;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // ---- 全螢幕閃白層 ----
    if (this.flashAlpha > 0.001) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }
  }
}

// ─────────────────────────────────────────────
//  使用範例（可直接在瀏覽器 Console 測試）
// ─────────────────────────────────────────────
// const canvas = document.getElementById('gameCanvas');
// const juice = new JuiceEngine(canvas);
//
// // 使用者點擊後初始化音訊
// canvas.addEventListener('click', () => { juice.initAudio(); });
//
// // 擊中事件
// juice.playSound('hit');
// juice.spawnParticles(mouseX, mouseY, '#ff4444', 30, 250, 'circle');
// juice.spawnText('+100', mouseX, mouseY, '#00ffff', 24);
// juice.freeze(100);
// juice.triggerShake(0.5);
// juice.flash(80, 'rgba(255,200,100,0.4)');
//
// // 在遊戲主迴圈中
// function gameLoop(dt) {
//   juice.update(dt);
//   juice.applyShake(ctx);
//   juice.render(ctx);
//   juice.resetShake(ctx);
// }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = JuiceEngine;
}
