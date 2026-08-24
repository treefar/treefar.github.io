/* ==========================================================================
   Retro Audio — 遊戲時光屋 8-bit 音效與 Chiptune 引擎
   --------------------------------------------------------------------------
   全部音色以 Web Audio API 即時合成，不依賴任何外部音檔：
   1. 打擊音效採「噪音層 + 音高下滑層」雙層疊加，這是打擊感的聽覺основа——
      噪音給衝擊質感，掃頻給重量感。
   2. 內建方波（可調 duty）、三角波、雜訊三個頻道，對應 FC 音源架構。
   3. Chiptune 序列器支援主旋律 / 貝斯 / 鼓組三軌，各年代有專屬曲風預設。
   4. 具備 ducking：音效播放時 BGM 短暫壓低，避免糊在一起。
   ========================================================================== */
(function (global) {
    'use strict';

    // 音名轉頻率：C4 = 261.63Hz。記法如 'A4'、'C#5'、'Eb3'
    var NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    function noteFreq(name) {
        if (typeof name === 'number') return name;
        if (!name || name === '-') return 0;
        var m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
        if (!m) return 0;
        var semi = NOTE_BASE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
        var octave = parseInt(m[3], 10);
        return 440 * Math.pow(2, (semi - 9 + (octave - 4) * 12) / 12);
    }

    function RetroAudio() {
        this.ctx = null;
        this.master = null;
        this.sfxBus = null;
        this.bgmBus = null;
        this.muted = false;
        this.sfxVolume = 0.55;
        this.bgmVolume = 0.28;
        this._noiseBuffer = null;
        this._pulseWaves = {};
        this._bgm = null;
        this._bgmTimer = null;
        this._nextNoteTime = 0;
        this._step = 0;
        this._unlocked = false;
    }

    RetroAudio.prototype.init = function () {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return this.ctx;
        }
        var AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();

        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = this.sfxVolume;
        this.sfxBus.connect(this.master);

        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.value = this.bgmVolume;
        this.bgmBus.connect(this.master);

        this._buildNoise();
        this._unlocked = true;
        return this.ctx;
    };

    /** 產生 1 秒白雜訊緩衝，供爆炸、鼓、腳步等音色重複取用 */
    RetroAudio.prototype._buildNoise = function () {
        var len = this.ctx.sampleRate;
        var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        var d = buf.getChannelData(0);
        // 音訊只需要穩定的白噪聲，不得消耗遊戲共用的 Math.random()。
        // 否則玩家何時解鎖 AudioContext 會改變後續關卡、敵人與掉落的亂數序列。
        var seed = 0x6d2b79f5;
        for (var i = 0; i < len; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            d[i] = (seed / 4294967296) * 2 - 1;
        }
        this._noiseBuffer = buf;
    };

    /**
     * 建立指定佔空比的脈衝波。FC 的方波頻道有 12.5% / 25% / 50% 三種 duty，
     * 12.5% 聽起來尖細（適合主旋律），50% 是標準方波（適合貝斯）。
     */
    RetroAudio.prototype._pulseWave = function (duty) {
        var key = String(duty);
        if (this._pulseWaves[key]) return this._pulseWaves[key];
        var n = 32, real = new Float32Array(n), imag = new Float32Array(n);
        for (var i = 1; i < n; i++) {
            var t = i * Math.PI * duty;
            real[i] = 4 / (i * Math.PI) * Math.sin(t);
        }
        var w = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
        this._pulseWaves[key] = w;
        return w;
    };

    // ----------------------------------------------------------------------
    // 低階發聲函式
    // ----------------------------------------------------------------------

    /** 單一振盪器音符，支援音高滑移與 ADSR 包絡 */
    RetroAudio.prototype.tone = function (o) {
        if (this.muted || !this.init()) return;
        var ctx = this.ctx;
        var t0 = ctx.currentTime + (o.delay || 0);
        var dur = o.dur || 0.12;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        if (o.duty !== undefined) osc.setPeriodicWave(this._pulseWave(o.duty));
        else osc.type = o.type || 'square';

        var f0 = noteFreq(o.freq || 440);
        osc.frequency.setValueAtTime(Math.max(1, f0), t0);
        if (o.freqTo) {
            var f1 = Math.max(1, noteFreq(o.freqTo));
            if (o.slide === 'linear') osc.frequency.linearRampToValueAtTime(f1, t0 + dur);
            else osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        }
        // 顫音：讓長音不死板
        if (o.vibrato) {
            var lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
            lfo.frequency.value = o.vibrato.rate || 6;
            lfoGain.gain.value = o.vibrato.depth || 6;
            lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
            lfo.start(t0); lfo.stop(t0 + dur);
        }

        var vol = (o.vol === undefined ? 0.3 : o.vol);
        var atk = o.attack === undefined ? 0.005 : o.attack;
        var dec = o.decay === undefined ? dur : o.decay;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + atk);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(atk + 0.01, dec));

        var out = o.bus || this.sfxBus;
        if (o.filter) {
            var flt = ctx.createBiquadFilter();
            flt.type = o.filter.type || 'lowpass';
            flt.frequency.value = o.filter.freq || 2000;
            flt.Q.value = o.filter.q || 1;
            osc.connect(gain); gain.connect(flt); flt.connect(out);
        } else {
            osc.connect(gain); gain.connect(out);
        }
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    };

    /** 雜訊爆發，可濾波成不同質感（爆炸低沉、腳步中頻、鈸高頻） */
    RetroAudio.prototype.noise = function (o) {
        if (this.muted || !this.init()) return;
        var ctx = this.ctx;
        var t0 = ctx.currentTime + (o.delay || 0);
        var dur = o.dur || 0.15;
        var src = ctx.createBufferSource();
        src.buffer = this._noiseBuffer;
        src.loop = true;

        var flt = ctx.createBiquadFilter();
        flt.type = o.type || 'lowpass';
        flt.frequency.setValueAtTime(o.freq || 1200, t0);
        if (o.freqTo) flt.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqTo), t0 + dur);
        flt.Q.value = o.q || 1;

        var gain = ctx.createGain();
        var vol = o.vol === undefined ? 0.25 : o.vol;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + (o.attack || 0.004));
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        src.connect(flt); flt.connect(gain); gain.connect(o.bus || this.sfxBus);
        src.start(t0);
        src.stop(t0 + dur + 0.02);
    };

    /** BGM 短暫壓低，讓音效浮出來 */
    RetroAudio.prototype._duck = function (amount, time) {
        if (!this.bgmBus) return;
        var g = this.bgmBus.gain, now = this.ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(this.bgmVolume * (1 - (amount || 0.5)), now + 0.02);
        g.linearRampToValueAtTime(this.bgmVolume, now + (time || 0.25));
    };

    // ----------------------------------------------------------------------
    // 音效庫
    // ----------------------------------------------------------------------
    var SFX = {
        // --- 基本互動 ---
        blip:      function (a) { a.tone({ duty: 0.25, freq: 'E5', dur: 0.05, vol: 0.18 }); },
        select:    function (a) { a.tone({ duty: 0.5, freq: 'C5', freqTo: 'G5', dur: 0.08, vol: 0.22 }); },
        confirm:   function (a) {
            a.tone({ duty: 0.5, freq: 'C5', dur: 0.07, vol: 0.25 });
            a.tone({ duty: 0.5, freq: 'G5', dur: 0.12, vol: 0.25, delay: 0.07 });
        },
        cancel:    function (a) { a.tone({ duty: 0.5, freq: 'G4', freqTo: 'C4', dur: 0.12, vol: 0.22 }); },
        pause:     function (a) { a.tone({ duty: 0.125, freq: 'A5', freqTo: 'A4', dur: 0.15, vol: 0.2 }); },

        // --- 移動 ---
        jump:      function (a) { a.tone({ duty: 0.5, freq: 'C4', freqTo: 'C6', dur: 0.16, vol: 0.26, attack: 0.002 }); },
        doubleJump:function (a) { a.tone({ duty: 0.25, freq: 'E4', freqTo: 'E6', dur: 0.14, vol: 0.24 });
                                 a.noise({ freq: 3000, freqTo: 800, dur: 0.1, vol: 0.08, type: 'bandpass' }); },
        land:      function (a) { a.noise({ freq: 500, freqTo: 120, dur: 0.09, vol: 0.16 });
                                 a.tone({ type: 'sine', freq: 90, freqTo: 50, dur: 0.09, vol: 0.2 }); },
        dash:      function (a) { a.noise({ freq: 2400, freqTo: 500, dur: 0.18, vol: 0.16, type: 'bandpass', q: 2 }); },
        step:      function (a) { a.noise({ freq: 900, freqTo: 300, dur: 0.04, vol: 0.07 }); },

        // --- 戰鬥：打擊感核心 ---
        // 輕擊：短促、偏高頻，強調「脆」
        hit:       function (a) {
            a.noise({ freq: 3500, freqTo: 700, dur: 0.07, vol: 0.24, type: 'bandpass', q: 1.2 });
            a.tone({ duty: 0.5, freq: 320, freqTo: 90, dur: 0.09, vol: 0.28, slide: 'linear' });
        },
        // 重擊：加一層低頻衝擊與極短延遲，聽起來「有肉」
        heavyHit:  function (a) {
            a.noise({ freq: 2000, freqTo: 200, dur: 0.16, vol: 0.3, q: 0.8 });
            a.tone({ type: 'sine', freq: 180, freqTo: 40, dur: 0.2, vol: 0.35, slide: 'linear' });
            a.tone({ duty: 0.25, freq: 520, freqTo: 120, dur: 0.1, vol: 0.2, delay: 0.015 });
            a._duck(0.45, 0.3);
        },
        // 格擋：金屬感高 Q 帶通
        block:     function (a) {
            a.noise({ freq: 4200, freqTo: 2400, dur: 0.12, vol: 0.22, type: 'bandpass', q: 8 });
            a.tone({ type: 'triangle', freq: 1800, freqTo: 900, dur: 0.1, vol: 0.16 });
        },
        slash:     function (a) { a.noise({ freq: 5000, freqTo: 900, dur: 0.11, vol: 0.2, type: 'bandpass', q: 2.5 }); },
        shoot:     function (a) { a.tone({ duty: 0.125, freq: 900, freqTo: 140, dur: 0.11, vol: 0.2 }); },
        laser:     function (a) { a.tone({ type: 'sawtooth', freq: 1400, freqTo: 200, dur: 0.16, vol: 0.18,
                                           filter: { type: 'lowpass', freq: 3000 } }); },
        explosion: function (a) {
            a.noise({ freq: 1600, freqTo: 60, dur: 0.45, vol: 0.34, q: 0.7 });
            a.tone({ type: 'sine', freq: 140, freqTo: 28, dur: 0.5, vol: 0.3, slide: 'linear' });
            a._duck(0.6, 0.5);
        },
        bigExplosion: function (a) {
            a.noise({ freq: 2400, freqTo: 40, dur: 0.9, vol: 0.4, q: 0.5 });
            a.tone({ type: 'sine', freq: 110, freqTo: 22, dur: 0.9, vol: 0.35, slide: 'linear' });
            a.noise({ freq: 400, freqTo: 60, dur: 0.6, vol: 0.2, delay: 0.12 });
            a._duck(0.75, 0.9);
        },
        hurt:      function (a) {
            a.tone({ duty: 0.5, freq: 'A4', freqTo: 'D3', dur: 0.28, vol: 0.3, slide: 'linear' });
            a.noise({ freq: 1200, freqTo: 200, dur: 0.2, vol: 0.16 });
        },

        // --- 收集與獎勵 ---
        coin:      function (a) {
            a.tone({ duty: 0.25, freq: 'B5', dur: 0.06, vol: 0.24 });
            a.tone({ duty: 0.25, freq: 'E6', dur: 0.18, vol: 0.24, delay: 0.055 });
        },
        pickup:    function (a) { a.tone({ duty: 0.25, freq: 'G5', freqTo: 'C6', dur: 0.12, vol: 0.22 }); },
        powerup:   function (a) {
            ['C5', 'E5', 'G5', 'C6', 'E6'].forEach(function (n, i) {
                a.tone({ duty: 0.25, freq: n, dur: 0.11, vol: 0.22, delay: i * 0.055 });
            });
        },
        oneup:     function (a) {
            ['E5', 'G5', 'E6', 'C6', 'D6', 'G6'].forEach(function (n, i) {
                a.tone({ duty: 0.5, freq: n, dur: 0.12, vol: 0.24, delay: i * 0.09 });
            });
        },
        // Combo 音會隨連段數升高音階，給玩家「越打越爽」的正回饋
        combo:     function (a, n) {
            var step = Math.min(n || 1, 12);
            var f = 523.25 * Math.pow(2, (step - 1) / 12);
            a.tone({ duty: 0.125, freq: f, dur: 0.09, vol: 0.2 });
            a.tone({ duty: 0.125, freq: f * 1.5, dur: 0.12, vol: 0.14, delay: 0.04 });
        },

        // --- 系統 ---
        levelUp:   function (a) {
            ['C5', 'D5', 'E5', 'G5', 'C6'].forEach(function (n, i) {
                a.tone({ duty: 0.25, freq: n, dur: 0.14, vol: 0.24, delay: i * 0.08 });
                a.tone({ type: 'triangle', freq: n, dur: 0.2, vol: 0.12, delay: i * 0.08 });
            });
        },
        win:       function (a) {
            var seq = [['C5', 0], ['E5', 0.1], ['G5', 0.2], ['C6', 0.3], ['G5', 0.45], ['C6', 0.55]];
            seq.forEach(function (s) {
                a.tone({ duty: 0.5, freq: s[0], dur: 0.3, vol: 0.26, delay: s[1] });
                a.tone({ type: 'triangle', freq: noteFreq(s[0]) / 2, dur: 0.3, vol: 0.16, delay: s[1] });
            });
        },
        gameover:  function (a) {
            var seq = [['C5', 0], ['G4', 0.16], ['E4', 0.32], ['C4', 0.48]];
            seq.forEach(function (s) {
                a.tone({ duty: 0.5, freq: s[0], dur: 0.4, vol: 0.26, delay: s[1] });
            });
            a.tone({ type: 'triangle', freq: 'C3', dur: 1.2, vol: 0.2, delay: 0.48 });
        },
        newRecord: function (a) {
            ['C6', 'E6', 'G6', 'C7', 'G6', 'C7'].forEach(function (n, i) {
                a.tone({ duty: 0.125, freq: n, dur: 0.14, vol: 0.22, delay: i * 0.1 });
            });
        },
        error:     function (a) { a.tone({ duty: 0.5, freq: 'F#3', dur: 0.2, vol: 0.22 });
                                 a.tone({ duty: 0.5, freq: 'F3', dur: 0.25, vol: 0.22, delay: 0.06 }); },

        // --- 特定玩法 ---
        rotate:    function (a) { a.tone({ duty: 0.125, freq: 'D5', dur: 0.05, vol: 0.16 }); },
        lineClear: function (a) {
            a.noise({ freq: 6000, freqTo: 1000, dur: 0.25, vol: 0.2, type: 'bandpass', q: 1.5 });
            ['C6', 'E6', 'G6'].forEach(function (n, i) {
                a.tone({ duty: 0.25, freq: n, dur: 0.15, vol: 0.2, delay: i * 0.05 });
            });
        },
        tetrisClear: function (a) {
            a.noise({ freq: 8000, freqTo: 600, dur: 0.5, vol: 0.26, type: 'bandpass' });
            ['C6', 'E6', 'G6', 'C7'].forEach(function (n, i) {
                a.tone({ duty: 0.125, freq: n, dur: 0.25, vol: 0.24, delay: i * 0.07 });
            });
            a._duck(0.5, 0.6);
        },
        drop:      function (a) { a.noise({ freq: 700, freqTo: 100, dur: 0.1, vol: 0.2 });
                                 a.tone({ type: 'sine', freq: 120, freqTo: 45, dur: 0.12, vol: 0.24 }); },
        bounce:    function (a) { a.tone({ duty: 0.5, freq: 'A4', freqTo: 'E5', dur: 0.07, vol: 0.22 }); },
        splash:    function (a) { a.noise({ freq: 3000, freqTo: 400, dur: 0.3, vol: 0.18, type: 'bandpass', q: 1 }); },
        engine:    function (a) { a.tone({ type: 'sawtooth', freq: 70, dur: 0.2, vol: 0.1,
                                          filter: { type: 'lowpass', freq: 400 } }); }
    };

    /** 播放音效。名稱見 SFX；第二參數供 combo 等需要階數的音效使用 */
    RetroAudio.prototype.play = function (name, arg) {
        if (this.muted) return;
        if (!this.init()) return;
        var fn = SFX[name];
        if (!fn) { SFX.blip(this); return; }
        try { fn(this, arg); } catch (e) { /* 音效不該讓遊戲崩潰 */ }
    };

    // ----------------------------------------------------------------------
    // Chiptune 序列器
    // ----------------------------------------------------------------------
    // 每首曲子由 lead（主旋律）/ bass（貝斯）/ drum（鼓組）三軌組成，
    // 以 16 分音符為單位的字串陣列描述。'-' 為休止。
    // ----------------------------------------------------------------------
    var TRACKS = {
        // 1970s：單聲道嗶嗶聲時代，旋律極簡、以節奏推進
        '70s': {
            bpm: 132, duty: 0.5,
            lead: ['C4','-','E4','-','G4','-','E4','-','A4','-','G4','-','E4','-','C4','-'],
            bass: ['C2','-','-','-','G2','-','-','-','A2','-','-','-','G2','-','-','-'],
            drum: ['K','-','-','-','S','-','-','-','K','-','K','-','S','-','-','-']
        },
        // 1980s：FC 音源黃金期，跳躍的三連感主旋律 + 走動貝斯
        '80s': {
            bpm: 150, duty: 0.25,
            lead: ['E5','G5','E5','C5','D5','-','G4','-','C5','E5','G5','A5','G5','E5','C5','-',
                   'D5','F5','D5','B4','C5','-','G4','-','A4','C5','E5','G5','E5','C5','A4','-'],
            bass: ['C3','-','C3','-','G2','-','G2','-','A2','-','A2','-','F2','-','G2','-',
                   'C3','-','C3','-','G2','-','G2','-','F2','-','F2','-','G2','-','G2','-'],
            drum: ['K','-','H','-','S','-','H','-','K','-','H','K','S','-','H','-',
                   'K','-','H','-','S','-','H','-','K','K','H','-','S','-','H','H']
        },
        // 1990s：16-bit 時代，和聲更豐富，加入切分音
        '90s': {
            bpm: 138, duty: 0.125,
            lead: ['A4','-','C5','E5','-','D5','C5','-','B4','-','D5','F5','-','E5','D5','-',
                   'C5','-','E5','G5','-','F5','E5','-','D5','E5','F5','E5','D5','-','C5','-'],
            bass: ['A2','-','E2','-','A2','-','E2','-','G2','-','D2','-','G2','-','D2','-',
                   'F2','-','C3','-','F2','-','C3','-','G2','-','D3','-','G2','G2','A2','B2'],
            drum: ['K','-','H','H','S','-','H','-','K','-','H','H','S','-','H','K',
                   'K','-','H','H','S','-','H','-','K','K','H','-','S','H','S','H']
        },
        // 2000s：Flash 網頁遊戲的明亮電子曲風
        '00s': {
            bpm: 160, duty: 0.5,
            lead: ['G5','-','G5','A5','B5','-','A5','G5','E5','-','E5','G5','A5','-','G5','E5',
                   'D5','-','D5','E5','G5','-','E5','D5','C5','-','E5','G5','B5','-','A5','G5'],
            bass: ['C3','C3','-','C3','G2','-','G2','-','A2','A2','-','A2','E2','-','E2','-',
                   'F2','F2','-','F2','C3','-','C3','-','G2','G2','-','G2','G2','-','G2','G2'],
            drum: ['K','H','H','H','S','H','H','H','K','H','H','K','S','H','H','H',
                   'K','H','H','H','S','H','H','H','K','H','S','H','S','H','S','H']
        },
        // 2010s：獨立遊戲的溫暖小調，速度放慢
        '10s': {
            bpm: 118, duty: 0.25,
            lead: ['E5','-','-','G5','-','A5','-','-','G5','-','E5','-','D5','-','-','-',
                   'C5','-','-','E5','-','G5','-','-','A5','-','G5','-','E5','-','-','-'],
            bass: ['A2','-','-','-','E3','-','-','-','F2','-','-','-','C3','-','-','-',
                   'G2','-','-','-','D3','-','-','-','A2','-','-','-','E3','-','-','-'],
            drum: ['K','-','-','-','S','-','-','H','K','-','-','K','S','-','H','-',
                   'K','-','-','-','S','-','-','H','K','-','H','-','S','-','H','H']
        },
        // 2020s：Lo-fi 復古復興，寬鬆的切分節奏
        '20s': {
            bpm: 96, duty: 0.5,
            lead: ['D5','-','F5','-','A5','-','G5','-','F5','-','-','E5','-','D5','-','-',
                   'C5','-','E5','-','G5','-','F5','-','E5','-','-','D5','-','C5','-','-'],
            bass: ['D2','-','-','A2','-','-','D2','-','F2','-','-','C3','-','-','F2','-',
                   'C2','-','-','G2','-','-','C2','-','G2','-','-','D3','-','-','G2','-'],
            drum: ['K','-','-','H','S','-','H','-','-','K','-','-','S','-','H','H',
                   'K','-','-','H','S','-','H','-','K','-','H','-','S','-','-','H']
        },
        // 緊張場面通用（Boss 戰、時間快到）
        'tense': {
            bpm: 176, duty: 0.125,
            lead: ['C5','B4','C5','D5','C5','B4','A4','B4','C5','D5','E5','F5','E5','D5','C5','B4'],
            bass: ['C2','C2','C2','C2','C2','C2','C2','C2','Ab2','Ab2','Ab2','Ab2','G2','G2','G2','G2'],
            drum: ['K','H','K','H','S','H','K','H','K','H','K','H','S','H','S','H']
        }
    };

    /** 播放鼓組單擊：K=大鼓 S=小鼓 H=腳踏鈸 */
    RetroAudio.prototype._drum = function (kind, time) {
        var ctx = this.ctx, bus = this.bgmBus;
        if (kind === 'K') {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(150, time);
            o.frequency.exponentialRampToValueAtTime(45, time + 0.11);
            g.gain.setValueAtTime(0.5, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
            o.connect(g); g.connect(bus); o.start(time); o.stop(time + 0.16);
        } else if (kind === 'S') {
            var s = ctx.createBufferSource(); s.buffer = this._noiseBuffer; s.loop = true;
            var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.9;
            var sg = ctx.createGain();
            sg.gain.setValueAtTime(0.3, time);
            sg.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            s.connect(f); f.connect(sg); sg.connect(bus); s.start(time); s.stop(time + 0.14);
        } else if (kind === 'H') {
            var h = ctx.createBufferSource(); h.buffer = this._noiseBuffer; h.loop = true;
            var hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 7000;
            var hg = ctx.createGain();
            hg.gain.setValueAtTime(0.12, time);
            hg.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
            h.connect(hf); hf.connect(hg); hg.connect(bus); h.start(time); h.stop(time + 0.06);
        }
    };

    /** 排程一個 16 分音符格 */
    RetroAudio.prototype._scheduleStep = function (step, time) {
        var t = this._bgm;
        if (!t) return;
        var ctx = this.ctx;

        var leadNote = t.lead[step % t.lead.length];
        if (leadNote && leadNote !== '-') {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.setPeriodicWave(this._pulseWave(t.duty || 0.25));
            o.frequency.setValueAtTime(noteFreq(leadNote), time);
            g.gain.setValueAtTime(0.0001, time);
            g.gain.linearRampToValueAtTime(0.22, time + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, time + this._noteDur * 0.9);
            o.connect(g); g.connect(this.bgmBus);
            o.start(time); o.stop(time + this._noteDur);
        }

        var bassNote = t.bass[step % t.bass.length];
        if (bassNote && bassNote !== '-') {
            var bo = ctx.createOscillator(), bg = ctx.createGain();
            bo.type = 'triangle';
            bo.frequency.setValueAtTime(noteFreq(bassNote), time);
            bg.gain.setValueAtTime(0.0001, time);
            bg.gain.linearRampToValueAtTime(0.3, time + 0.01);
            bg.gain.exponentialRampToValueAtTime(0.0001, time + this._noteDur * 1.6);
            bo.connect(bg); bg.connect(this.bgmBus);
            bo.start(time); bo.stop(time + this._noteDur * 1.8);
        }

        var d = t.drum[step % t.drum.length];
        if (d && d !== '-') this._drum(d, time);
    };

    /**
     * 啟動 BGM。name 可為 TRACKS 的鍵（'80s'、'tense' …）。
     * 使用先行排程（lookahead）避免 setInterval 抖動造成節奏不穩。
     */
    RetroAudio.prototype.startBGM = function (name) {
        if (!this.init()) return;
        this.stopBGM();
        var t = TRACKS[name] || TRACKS['80s'];
        this._bgm = t;
        this._noteDur = 60 / t.bpm / 4;
        this._step = 0;
        this._nextNoteTime = this.ctx.currentTime + 0.1;
        this._bgmName = name;

        var self = this;
        this._bgmTimer = setInterval(function () {
            if (!self._bgm || self.muted) return;
            // 先行排程 0.2 秒內的音符
            while (self._nextNoteTime < self.ctx.currentTime + 0.2) {
                self._scheduleStep(self._step, self._nextNoteTime);
                self._nextNoteTime += self._noteDur;
                self._step++;
            }
        }, 40);
        this.bgmPlaying = true;
    };

    RetroAudio.prototype.stopBGM = function () {
        if (this._bgmTimer) { clearInterval(this._bgmTimer); this._bgmTimer = null; }
        this._bgm = null;
        this.bgmPlaying = false;
    };

    RetroAudio.prototype.toggleBGM = function (name) {
        if (this.bgmPlaying) this.stopBGM();
        else this.startBGM(name || this._bgmName || '80s');
        return this.bgmPlaying;
    };

    RetroAudio.prototype.setMuted = function (m) {
        var wasMuted = this.muted;
        this.muted = m;
        if (this.master) this.master.gain.value = m ? 0 : 0.9;
        // 靜音期間不排音符；解除時從「現在」續播，不能把整段過期節拍一次補排。
        if (wasMuted && !m && this.ctx && this._bgm) {
            this._nextNoteTime = this.ctx.currentTime + 0.05;
        }
        return this.muted;
    };

    RetroAudio.prototype.toggleMute = function () { return this.setMuted(!this.muted); };

    RetroAudio.prototype.setSfxVolume = function (v) {
        this.sfxVolume = v;
        if (this.sfxBus) this.sfxBus.gain.value = v;
    };

    RetroAudio.prototype.setBgmVolume = function (v) {
        this.bgmVolume = v;
        if (this.bgmBus) this.bgmBus.gain.value = v;
    };

    var instance = new RetroAudio();
    global.RetroAudio = instance;
    global.SFXNames = Object.keys(SFX);
    global.BGMTracks = Object.keys(TRACKS);

    // 瀏覽器要求使用者互動後才能啟動 AudioContext
    ['click', 'keydown', 'touchstart'].forEach(function (ev) {
        global.addEventListener(ev, function () { instance.init(); }, { once: true });
    });

})(window);
