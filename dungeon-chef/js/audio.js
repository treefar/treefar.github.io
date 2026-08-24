/* =========================================================
   audio.js — 全程序合成音效與環境 BGM（WebAudio，零外部素材）
   移植 Unity 時整檔可換成 AudioSource + AudioClip；呼叫點不必改。
   ========================================================= */

const Sfx = {
  ctx: null,
  master: null, sfxBus: null, musicBus: null,
  noiseBuf: null,
  muted: false, musicOn: true,
  music: null,          // { nodes:[], timer }
  currentTrack: null,

  /* ---------- 初始化（必須在使用者第一次互動後） ---------- */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.85;
    this.sfxBus.connect(this.master);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.30;
    this.musicBus.connect(this.master);

    // 2 秒白噪音緩衝，所有噪音類音效共用
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  },
  resume() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        // 拿到手勢後，把先前排隊的曲目真正播起來
        if (this.musicOn && this.currentTrack && !this.music) {
          const t = this.currentTrack;
          this.currentTrack = null;
          this.playTrack(t);
        }
      }).catch(() => { /* 使用者還沒互動，下次再試 */ });
    }
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  /* 只有在 context 真的在跑的時候才合成聲音。
     還沒拿到使用者手勢時 context 是 suspended，currentTime 不會前進，
     這時排程出去的振盪器永遠不會結束，節點會無上限累積。 */
  ok() { return !!this.ctx && this.ctx.state === 'running' && !this.muted; },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  },
  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.playTrack(this.currentTrack || 'explore');
    else this.stopMusic();
    return this.musicOn;
  },

  /* ---------- 基礎音源 ---------- */
  tone(freq, dur, opts) {
    if (!this.ok()) return;
    opts = opts || {};
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
    const vol = opts.vol == null ? 0.25 : opts.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = osc;
    if (opts.filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = opts.filter; f.frequency.value = opts.cutoff || 1200;
      osc.connect(f); last = f;
    }
    last.connect(g);
    g.connect(opts.bus || this.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.02);
  },

  noise(dur, opts) {
    if (!this.ok()) return;
    opts = opts || {};
    const t = this.now();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = opts.rate || 1;
    const f = this.ctx.createBiquadFilter();
    f.type = opts.filter || 'bandpass';
    f.frequency.setValueAtTime(opts.freq || 1400, t);
    if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(60, opts.freqTo), t + dur);
    f.Q.value = opts.q == null ? 1.2 : opts.q;
    const g = this.ctx.createGain();
    const vol = opts.vol == null ? 0.3 : opts.vol;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + dur + 0.02);
  },

  seq(notes) {   // notes: [[freq, delayMs, dur, type, vol], ...]
    notes.forEach(n => setTimeout(() => this.tone(n[0], n[2] || 0.12,
      { type: n[3] || 'triangle', vol: n[4] == null ? 0.22 : n[4] }), n[1]));
  },

  /* ---------- 遊戲音效 ---------- */
  click() { this.tone(660, 0.05, { type: 'square', vol: 0.1 }); },
  hover() { this.tone(880, 0.03, { type: 'sine', vol: 0.05 }); },

  slash() {                                        // 揮刀
    this.noise(0.16, { filter: 'bandpass', freq: 3200, freqTo: 700, q: 0.8, vol: 0.3 });
    this.tone(420, 0.1, { type: 'sawtooth', to: 160, vol: 0.1 });
  },
  hit(heavy) {                                     // 命中
    this.noise(heavy ? 0.2 : 0.1, { filter: 'lowpass', freq: heavy ? 700 : 1100, vol: 0.3 });
    this.tone(heavy ? 90 : 140, heavy ? 0.18 : 0.1, { type: 'square', to: 50, vol: 0.22 });
  },
  precise() {                                      // 精準切割：清脆上升鈴
    this.seq([[1320, 0, 0.1, 'triangle', 0.2], [1760, 70, 0.1, 'triangle', 0.2],
      [2640, 150, 0.28, 'sine', 0.18]]);
    this.noise(0.1, { filter: 'highpass', freq: 5200, vol: 0.14 });
  },
  overkill() {                                     // 過熟：悶掉的濕響
    this.noise(0.32, { filter: 'lowpass', freq: 420, freqTo: 120, vol: 0.34 });
    this.tone(105, 0.3, { type: 'sine', to: 42, vol: 0.24 });
  },
  block() { this.noise(0.13, { filter: 'bandpass', freq: 2100, q: 3.5, vol: 0.28 }); this.tone(520, 0.1, { type: 'square', vol: 0.12 }); },
  cardPlay() { this.noise(0.09, { filter: 'highpass', freq: 2600, vol: 0.16 }); },
  cardDraw() { this.noise(0.06, { filter: 'highpass', freq: 3400, vol: 0.11, rate: 1.4 }); },
  step() { this.noise(0.11, { filter: 'lowpass', freq: 340, vol: 0.2 }); },
  pickup() { this.seq([[880, 0, 0.09], [1174, 60, 0.14]]); },
  gold() { this.seq([[1568, 0, 0.07, 'triangle', 0.16], [2093, 55, 0.12, 'triangle', 0.16]]); },
  hurt() {
    this.noise(0.22, { filter: 'lowpass', freq: 900, freqTo: 200, vol: 0.32 });
    this.tone(220, 0.22, { type: 'sawtooth', to: 90, vol: 0.16 });
  },
  sizzle() { this.noise(0.5, { filter: 'highpass', freq: 2400, vol: 0.14, rate: 0.8 }); },
  cookPerfect() { this.seq([[1046, 0, 0.12], [1318, 90, 0.12], [1568, 180, 0.14], [2093, 280, 0.3, 'sine', 0.2]]); },
  cookOk() { this.seq([[784, 0, 0.11], [1046, 90, 0.16]]); },
  cookBad() { this.tone(150, 0.32, { type: 'sawtooth', to: 70, vol: 0.2 }); this.noise(0.3, { filter: 'lowpass', freq: 500, vol: 0.2 }); },
  peg() { this.tone(1200 + Util.rand(700), 0.045, { type: 'triangle', vol: 0.1 }); },
  unlock() { this.seq([[659, 0, 0.12], [880, 100, 0.12], [1319, 210, 0.34, 'sine', 0.2]]); },
  relic() { this.seq([[523, 0, 0.14], [784, 110, 0.14], [1046, 230, 0.3, 'sine', 0.2]]); },

  boss() {
    if (!this.ok()) return;
    this.tone(58, 1.5, { type: 'sawtooth', to: 40, vol: 0.3, filter: 'lowpass', cutoff: 220 });
    this.noise(1.3, { filter: 'lowpass', freq: 260, vol: 0.22 });
    this.seq([[131, 320, 0.5, 'square', 0.16], [98, 760, 0.9, 'square', 0.16]]);
  },
  win() { this.seq([[523, 0, 0.16], [659, 130, 0.16], [784, 260, 0.16], [1046, 390, 0.55, 'triangle', 0.24]]); },
  lose() { this.seq([[392, 0, 0.28, 'sawtooth', 0.2], [311, 240, 0.3, 'sawtooth', 0.2], [233, 500, 0.8, 'sawtooth', 0.2]]); },

  /* ---------- BGM：程序生成的地城環境 ---------- */
  TRACKS: {
    explore: { root: 55, scale: [0, 3, 5, 7, 10], pluckMs: 2600, drone: true, pulse: 0 },
    battle: { root: 49, scale: [0, 2, 3, 7, 8], pluckMs: 1300, drone: true, pulse: 620 },
    boss: { root: 41, scale: [0, 1, 5, 6, 8], pluckMs: 900, drone: true, pulse: 420 },
    calm: { root: 62, scale: [0, 4, 7, 9, 11], pluckMs: 3200, drone: true, pulse: 0 },
  },

  playTrack(name) {
    this.init();
    if (!this.ctx) return;
    if (this.currentTrack === name && this.music) return;
    this.currentTrack = name;
    if (!this.musicOn) return;
    // context 還沒 running 就先記下曲目，等 resume() 再開；否則節點會空轉堆積
    if (this.ctx.state !== 'running') return;
    this.stopMusic();
    const t = this.TRACKS[name] || this.TRACKS.explore;
    const nodes = [];
    const start = this.now();

    if (t.drone) {
      [0, 0.06, 12].forEach((off, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        osc.type = i === 2 ? 'triangle' : 'sawtooth';
        osc.frequency.value = t.root * Math.pow(2, off / 12);
        f.type = 'lowpass'; f.frequency.value = 320;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(i === 2 ? 0.05 : 0.12, start + 2.2);
        osc.connect(f); f.connect(g); g.connect(this.musicBus);
        osc.start(start);
        nodes.push({ osc, g });
        // 緩慢呼吸的濾波器
        const lfo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lfo.frequency.value = 0.05 + i * 0.02; lg.gain.value = 110;
        lfo.connect(lg); lg.connect(f.frequency);
        lfo.start(start);
        nodes.push({ osc: lfo, g: lg });
      });
    }

    // 稀疏的撥弦動機
    const pluck = () => {
      if (!this.musicOn || !this.ctx) return;
      const deg = Util.pick(t.scale);
      const oct = Util.pick([2, 3, 3, 4]);
      const freq = t.root * Math.pow(2, oct + deg / 12);
      this.tone(freq, 1.1 + Math.random() * 0.8, {
        type: 'triangle', vol: 0.07, bus: this.musicBus, attack: 0.02,
        filter: 'lowpass', cutoff: 2400,
      });
    };
    const pluckTimer = setInterval(pluck, t.pluckMs);
    setTimeout(pluck, 600);

    // 戰鬥／頭目的心跳節拍
    let pulseTimer = null;
    if (t.pulse) {
      pulseTimer = setInterval(() => {
        if (!this.musicOn || !this.ctx) return;
        this.tone(t.root / 2, 0.16, { type: 'sine', vol: 0.16, bus: this.musicBus });
      }, t.pulse);
    }

    this.music = { nodes, pluckTimer, pulseTimer };
  },

  stopMusic() {
    if (!this.music) return;
    const t = this.now();
    this.music.nodes.forEach(n => {
      try {
        if (n.g && n.g.gain) { n.g.gain.cancelScheduledValues(t); n.g.gain.linearRampToValueAtTime(0.0001, t + 0.5); }
        n.osc.stop(t + 0.55);
      } catch (e) { /* 已停止 */ }
    });
    clearInterval(this.music.pluckTimer);
    if (this.music.pulseTimer) clearInterval(this.music.pulseTimer);
    this.music = null;
  },
};
