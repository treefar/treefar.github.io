/* ==========================================================================
   Retro Engine Core — 遊戲時光屋共用引擎核心
   --------------------------------------------------------------------------
   提供：固定時步遊戲迴圈、輸入管理（鍵盤／觸控／搖桿）、Game Feel 打擊感系統
        （hitstop 頓幀、螢幕震動、閃白、慢動作）、粒子系統、浮動文字、
        補間動畫、碰撞偵測、像素繪圖工具、最高分儲存。

   設計原則：
   1. 純 ES5+ 全域腳本，可直接以 file:// 開啟，不需 build、不需伺服器。
   2. 固定時步（fixed timestep）更新 + 插值渲染，確保不同螢幕更新率下手感一致。
   3. 所有「打擊感」效果集中在 RE.juice，遊戲只需一行呼叫。
   ========================================================================== */
(function (global) {
    'use strict';

    // ======================================================================
    // 數學與工具函式
    // ======================================================================
    var TAU = Math.PI * 2;

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function sign(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
    function dist(x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }

    /** 讓數值以固定速度趨近目標，比 lerp 更適合做「移動速度上限」 */
    function approach(cur, target, delta) {
        if (cur < target) return Math.min(cur + delta, target);
        return Math.max(cur - delta, target);
    }

    /** 緩動函式集，用於過場、彈跳、Q 彈縮放 */
    var ease = {
        linear: function (t) { return t; },
        inQuad: function (t) { return t * t; },
        outQuad: function (t) { return t * (2 - t); },
        inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
        outCubic: function (t) { return (--t) * t * t + 1; },
        outBack: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
        outElastic: function (t) {
            if (t === 0 || t === 1) return t;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
        },
        outBounce: function (t) {
            var n = 7.5625, d = 2.75;
            if (t < 1 / d) return n * t * t;
            if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
            if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
            return n * (t -= 2.625 / d) * t + 0.984375;
        }
    };

    // ======================================================================
    // 矩形碰撞
    // ======================================================================
    function aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function circleHit(a, b) {
        var r = (a.r || 0) + (b.r || 0);
        var dx = a.x - b.x, dy = a.y - b.y;
        return dx * dx + dy * dy < r * r;
    }

    /** 回傳矩形 a 與 b 重疊時最小的推出向量，用於平台遊戲的貼牆處理 */
    function resolveAABB(a, b) {
        var ox = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
        var oy = Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
        if (ox < oy) {
            return { x: (a.x < b.x ? -ox : ox), y: 0 };
        }
        return { x: 0, y: (a.y < b.y ? -oy : oy) };
    }

    // ======================================================================
    // 輸入管理：鍵盤 + 觸控虛擬按鍵 + 遊戲手把
    // ----------------------------------------------------------------------
    // 提供 down（持續按住）／pressed（本幀剛按下）／released（本幀剛放開），
    // 以及 buffer（輸入緩衝，跳躍手感關鍵）。
    // ======================================================================
    var ACTION_KEYS = {
        left:  ['ArrowLeft', 'KeyA'],
        right: ['ArrowRight', 'KeyD'],
        up:    ['ArrowUp', 'KeyW'],
        down:  ['ArrowDown', 'KeyS'],
        a:     ['Space', 'KeyJ', 'KeyZ'],   // 主要動作：跳躍／確認／攻擊
        b:     ['KeyK', 'KeyX', 'ShiftLeft'], // 次要動作：衝刺／取消／特殊
        start: ['Enter', 'KeyP', 'Escape']    // 開始／暫停
    };

    var Input = {
        _down: {}, _pressed: {}, _released: {},
        _bufferTime: {},          // 每個動作最後一次按下距今多久（秒）
        _bufferWindow: 0.15,      // 輸入緩衝視窗
        _touch: {},               // 虛擬按鍵狀態
        _padIndex: null,
        _padPrev: {},
        pointer: { x: 0, y: 0, down: false, pressed: false, released: false },
        _anyKeyPressed: false,

        init: function (canvas) {
            var self = this;
            this._canvas = canvas || null;

            global.addEventListener('keydown', function (e) {
                var act = self._actionOf(e.code);
                // 方向鍵與空白鍵會捲動頁面，遊戲中一律攔截
                if (act || e.code === 'Space') e.preventDefault();
                if (e.repeat) return;
                if (act) self._press(act);
                self._anyKeyPressed = true;
            });

            global.addEventListener('keyup', function (e) {
                var act = self._actionOf(e.code);
                if (act) self._release(act);
            });

            // 失焦時清空所有按鍵，避免切換分頁後角色一直往前走
            global.addEventListener('blur', function () { self.reset(); });

            global.addEventListener('gamepadconnected', function (e) { self._padIndex = e.gamepad.index; });
            global.addEventListener('gamepaddisconnected', function () { self._padIndex = null; });

            if (canvas) this._bindPointer(canvas);
            return this;
        },

        _bindPointer: function (canvas) {
            var self = this;
            function toLocal(clientX, clientY) {
                var r = canvas.getBoundingClientRect();
                return {
                    x: (clientX - r.left) / r.width * canvas.width,
                    y: (clientY - r.top) / r.height * canvas.height
                };
            }
            canvas.addEventListener('mousemove', function (e) {
                var p = toLocal(e.clientX, e.clientY);
                self.pointer.x = p.x; self.pointer.y = p.y;
            });
            canvas.addEventListener('mousedown', function (e) {
                var p = toLocal(e.clientX, e.clientY);
                self.pointer.x = p.x; self.pointer.y = p.y;
                self.pointer.down = true; self.pointer.pressed = true;
            });
            global.addEventListener('mouseup', function () {
                if (self.pointer.down) self.pointer.released = true;
                self.pointer.down = false;
            });
            canvas.addEventListener('touchstart', function (e) {
                e.preventDefault();
                var t = e.changedTouches[0];
                var p = toLocal(t.clientX, t.clientY);
                self.pointer.x = p.x; self.pointer.y = p.y;
                self.pointer.down = true; self.pointer.pressed = true;
            }, { passive: false });
            canvas.addEventListener('touchmove', function (e) {
                e.preventDefault();
                var t = e.changedTouches[0];
                var p = toLocal(t.clientX, t.clientY);
                self.pointer.x = p.x; self.pointer.y = p.y;
            }, { passive: false });
            canvas.addEventListener('touchend', function (e) {
                e.preventDefault();
                if (self.pointer.down) self.pointer.released = true;
                self.pointer.down = false;
            }, { passive: false });
        },

        _actionOf: function (code) {
            for (var act in ACTION_KEYS) {
                if (ACTION_KEYS[act].indexOf(code) !== -1) return act;
            }
            return null;
        },

        _press: function (act) {
            if (!this._down[act]) this._pressed[act] = true;
            this._down[act] = true;
            this._bufferTime[act] = 0;
        },

        _release: function (act) {
            if (this._down[act]) this._released[act] = true;
            this._down[act] = false;
        },

        /** 綁定畫面上的虛擬按鍵（手機操作） */
        bindTouchButton: function (el, action) {
            var self = this;
            if (!el) return;
            function on(e) { e.preventDefault(); self._touch[action] = true; self._press(action); }
            function off(e) { e.preventDefault(); self._touch[action] = false; self._release(action); }
            el.addEventListener('touchstart', on, { passive: false });
            el.addEventListener('touchend', off, { passive: false });
            el.addEventListener('touchcancel', off, { passive: false });
            el.addEventListener('mousedown', on);
            el.addEventListener('mouseup', off);
            el.addEventListener('mouseleave', off);
        },

        down: function (act) { return !!this._down[act]; },
        pressed: function (act) { return !!this._pressed[act]; },
        released: function (act) { return !!this._released[act]; },

        /** 輸入緩衝：玩家在落地前一瞬按跳躍，落地當下仍會跳。平台遊戲手感關鍵。 */
        buffered: function (act, window_) {
            var w = window_ === undefined ? this._bufferWindow : window_;
            return this._bufferTime[act] !== undefined && this._bufferTime[act] <= w;
        },

        consumeBuffer: function (act) { this._bufferTime[act] = 999; },

        /** 回傳 -1 / 0 / 1 的水平、垂直軸值（含搖桿類比） */
        axisX: function () {
            var v = (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0);
            if (v === 0 && this._padAxis) v = Math.abs(this._padAxis[0]) > 0.3 ? sign(this._padAxis[0]) : 0;
            return v;
        },
        axisY: function () {
            var v = (this.down('down') ? 1 : 0) - (this.down('up') ? 1 : 0);
            if (v === 0 && this._padAxis) v = Math.abs(this._padAxis[1]) > 0.3 ? sign(this._padAxis[1]) : 0;
            return v;
        },

        anyPressed: function () {
            if (this._anyKeyPressed) return true;
            for (var k in this._pressed) if (this._pressed[k]) return true;
            return this.pointer.pressed;
        },

        _pollGamepad: function () {
            if (this._padIndex === null || !global.navigator.getGamepads) return;
            var pad = global.navigator.getGamepads()[this._padIndex];
            if (!pad) return;
            this._padAxis = pad.axes;
            var map = { 0: 'a', 1: 'b', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
            for (var i in map) {
                var btn = pad.buttons[i];
                var isDown = btn && (btn.pressed || btn.value > 0.5);
                var act = map[i];
                if (isDown && !this._padPrev[i]) this._press(act);
                else if (!isDown && this._padPrev[i]) this._release(act);
                this._padPrev[i] = isDown;
            }
        },

        /** 每幀更新結尾呼叫：推進緩衝計時、清除 pressed/released 旗標 */
        endFrame: function (dt) {
            for (var k in this._bufferTime) this._bufferTime[k] += dt;
            this._pressed = {};
            this._released = {};
            this._anyKeyPressed = false;
            this.pointer.pressed = false;
            this.pointer.released = false;
        },

        beginFrame: function () { this._pollGamepad(); },

        reset: function () {
            this._down = {}; this._pressed = {}; this._released = {};
            this._touch = {}; this.pointer.down = false;
        }
    };

    // ======================================================================
    // 動態舒適模式
    // ----------------------------------------------------------------------
    // CSS 的 prefers-reduced-motion 只能停掉 DOM 動畫，Canvas 裡的震動、閃白、
    // 推近與粒子完全不受影響。Motion 把作業系統偏好與玩家手動覆寫合併成
    // 同一個判準，讓 57 款不必各自重做一份可及性設定。
    // ======================================================================
    var Motion = {
        _media: global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null,
        _manual: null,

        get reduced() {
            return this._manual === null ? !!(this._media && this._media.matches) : this._manual;
        },

        setReduced: function (value) {
            this._manual = value === null || value === undefined ? null : !!value;
            if (this.reduced && typeof Juice !== 'undefined') Juice.reset();
        }
    };

    // ======================================================================
    // Juice — 打擊感系統
    // ----------------------------------------------------------------------
    // hitstop（頓幀）：命中瞬間凍結全域 0.03～0.12 秒，讓打擊「有重量」。
    // shake（震動）：以 trauma 平方衰減，避免線性震動的機械感。
    // flash（閃白）：全螢幕疊色一瞬，強調爆炸與受傷。
    // slowmo（慢動作）：時間縮放，用於 Boss 擊破、最後一擊。
    // rgbSplit：震動強烈時附加色差，模擬 CRT 訊號受衝擊。
    // ======================================================================
    var Juice = {
        _trauma: 0,
        _shakeX: 0, _shakeY: 0,
        _hitstop: 0,
        _flash: null,
        _timeScale: 1, _timeScaleTarget: 1, _timeScaleRecover: 0,
        _zoom: 1, _zoomTarget: 1,
        _rgb: 0,

        /** 命中頓幀。duration 建議：小兵 0.04，重擊 0.08，Boss 擊破 0.16 */
        hitstop: function (duration) {
            if (Motion.reduced) return;
            this._hitstop = Math.max(this._hitstop, duration || 0.05);
        },

        /** 螢幕震動。amount 0～1，建議：吃道具 0.12，受傷 0.35，爆炸 0.6 */
        shake: function (amount) {
            if (Motion.reduced) return;
            this._trauma = clamp(this._trauma + (amount || 0.3), 0, 1);
        },

        /** 全螢幕閃色 */
        flash: function (color, duration) {
            if (Motion.reduced) return;
            this._flash = { color: color || '#ffffff', t: 0, dur: duration || 0.08 };
        },

        /** 慢動作。scale 0.2 表示變成兩成速，recover 為回復所需秒數 */
        slowmo: function (scale, recover) {
            if (Motion.reduced) return;
            this._timeScale = scale;
            this._timeScaleTarget = 1;
            this._timeScaleRecover = recover || 0.6;
        },

        /** 鏡頭推近，用於強調瞬間 */
        punchZoom: function (amount) {
            if (Motion.reduced) return;
            this._zoom = 1 + (amount || 0.06);
        },

        /** 手把震動（支援的瀏覽器與裝置才生效） */
        rumble: function (strength, duration) {
            if (Motion.reduced) return;
            if (Input._padIndex === null || !global.navigator.getGamepads) return;
            var pad = global.navigator.getGamepads()[Input._padIndex];
            if (pad && pad.vibrationActuator) {
                pad.vibrationActuator.playEffect('dual-rumble', {
                    duration: (duration || 0.12) * 1000,
                    strongMagnitude: strength || 0.5,
                    weakMagnitude: (strength || 0.5) * 0.6
                });
            }
            if (global.navigator.vibrate) global.navigator.vibrate((duration || 0.12) * 1000);
        },

        /** 一次呼叫涵蓋常見的「命中」組合效果 */
        impact: function (level) {
            level = level || 1;
            this.hitstop(0.03 + 0.035 * level);
            this.shake(0.18 * level);
            this.punchZoom(0.03 * level);
            this.rumble(0.35 * level, 0.1);
            if (level >= 2) this.flash('rgba(255,255,255,0.55)', 0.06);
        },

        update: function (dt) {
            if (Motion.reduced) {
                this.reset();
                this._shakeX = 0; this._shakeY = 0; this._rgb = 0;
                return;
            }
            // hitstop 以真實時間推進，不受 timeScale 影響
            if (this._hitstop > 0) this._hitstop -= dt;

            this._trauma = Math.max(0, this._trauma - dt * 1.8);
            var t = this._trauma * this._trauma;    // 平方衰減，尾巴更自然
            var mag = 14 * t;
            this._shakeX = rand(-mag, mag);
            this._shakeY = rand(-mag, mag);
            this._rgb = t * 3;

            if (this._flash) {
                this._flash.t += dt;
                if (this._flash.t >= this._flash.dur) this._flash = null;
            }

            if (this._timeScale !== this._timeScaleTarget) {
                this._timeScale = approach(this._timeScale, this._timeScaleTarget,
                    dt / Math.max(0.001, this._timeScaleRecover));
            }
            this._zoom = lerp(this._zoom, this._zoomTarget, 1 - Math.pow(0.001, dt));
        },

        get timeScale() { return this._hitstop > 0 ? 0 : this._timeScale; },
        get frozen() { return this._hitstop > 0; },

        /** 在繪製世界前呼叫：套用震動與推近位移 */
        applyCamera: function (ctx, w, h) {
            ctx.save();
            ctx.translate(this._shakeX, this._shakeY);
            if (Math.abs(this._zoom - 1) > 0.001) {
                ctx.translate(w / 2, h / 2);
                ctx.scale(this._zoom, this._zoom);
                ctx.translate(-w / 2, -h / 2);
            }
        },

        /** 在繪製世界後呼叫：還原並疊上閃色 */
        restoreCamera: function (ctx, w, h) {
            ctx.restore();
            if (this._flash) {
                var a = 1 - this._flash.t / this._flash.dur;
                ctx.save();
                ctx.globalAlpha = a;
                ctx.fillStyle = this._flash.color;
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            }
        },

        reset: function () {
            this._trauma = 0; this._hitstop = 0; this._flash = null;
            this._timeScale = 1; this._timeScaleTarget = 1; this._zoom = 1;
        }
    };

    // ======================================================================
    // 粒子系統
    // ======================================================================
    function Particles(max) {
        this.max = max || 400;
        this.list = [];
    }

    Particles.prototype.spawn = function (opt) {
        if (Motion.reduced && this.list.length >= Math.min(this.max, 80)) return;
        if (this.list.length >= this.max) this.list.shift();
        this.list.push({
            x: opt.x, y: opt.y,
            vx: opt.vx || 0, vy: opt.vy || 0,
            gravity: opt.gravity === undefined ? 0 : opt.gravity,
            drag: opt.drag === undefined ? 0.92 : opt.drag,
            size: opt.size || 3,
            sizeEnd: opt.sizeEnd === undefined ? 0 : opt.sizeEnd,
            color: opt.color || '#ffd166',
            colorEnd: opt.colorEnd || null,
            life: 0,
            maxLife: opt.life || 0.5,
            shape: opt.shape || 'rect',     // rect | circle | spark | ring
            rot: opt.rot || 0,
            spin: opt.spin || 0,
            glow: opt.glow || false
        });
    };

    /** 爆裂：往四面八方噴 n 顆粒子 */
    Particles.prototype.burst = function (x, y, n, opt) {
        opt = opt || {};
        if (Motion.reduced) n = Math.max(1, Math.ceil((n || 8) * 0.3));
        for (var i = 0; i < n; i++) {
            var ang = opt.angle !== undefined
                ? opt.angle + rand(-(opt.spread || 0.6), (opt.spread || 0.6))
                : rand(0, TAU);
            var spd = rand(opt.speedMin || 40, opt.speedMax || 160);
            this.spawn({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                gravity: opt.gravity === undefined ? 220 : opt.gravity,
                drag: opt.drag,
                size: rand(opt.sizeMin || 2, opt.sizeMax || 5),
                sizeEnd: opt.sizeEnd,
                color: opt.colors ? pick(opt.colors) : (opt.color || '#ffd166'),
                colorEnd: opt.colorEnd,
                life: rand(opt.lifeMin || 0.3, opt.lifeMax || 0.7),
                shape: opt.shape || 'rect',
                spin: rand(-8, 8),
                glow: opt.glow
            });
        }
    };

    /** 命中火花：朝特定方向噴射的細長光點 */
    Particles.prototype.sparks = function (x, y, angle, n, color) {
        this.burst(x, y, n || 8, {
            angle: angle, spread: 0.9,
            speedMin: 120, speedMax: 320,
            gravity: 120, sizeMin: 1.5, sizeMax: 3.5,
            lifeMin: 0.15, lifeMax: 0.35,
            color: color || '#fff0aa', shape: 'spark', glow: true
        });
    };

    /** 擴散光環：用於爆炸、能量釋放 */
    Particles.prototype.ring = function (x, y, color, size) {
        if (Motion.reduced) return;
        this.spawn({
            x: x, y: y, size: 4, sizeEnd: size || 60,
            color: color || '#fff0aa', life: 0.35,
            shape: 'ring', drag: 1, glow: true
        });
    };

    Particles.prototype.update = function (dt) {
        for (var i = this.list.length - 1; i >= 0; i--) {
            var p = this.list[i];
            p.life += dt;
            if (p.life >= p.maxLife) { this.list.splice(i, 1); continue; }
            p.vy += p.gravity * dt;
            var d = Math.pow(p.drag, dt * 60);
            p.vx *= d; p.vy *= d;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.spin * dt;
        }
    };

    Particles.prototype.draw = function (ctx) {
        ctx.save();
        for (var i = 0; i < this.list.length; i++) {
            var p = this.list[i];
            var t = p.life / p.maxLife;
            var size = lerp(p.size, p.sizeEnd, t);
            if (size <= 0.2) continue;
            ctx.globalAlpha = clamp(1 - t * t, 0, 1);
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;
            if (p.glow) { ctx.shadowBlur = 8; ctx.shadowColor = p.color; }
            else { ctx.shadowBlur = 0; }

            if (p.shape === 'circle') {
                ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, TAU); ctx.fill();
            } else if (p.shape === 'ring') {
                ctx.lineWidth = Math.max(1, 4 * (1 - t));
                ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, TAU); ctx.stroke();
            } else if (p.shape === 'spark') {
                var len = size * 3;
                var a = Math.atan2(p.vy, p.vx);
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - Math.cos(a) * len, p.y - Math.sin(a) * len);
                ctx.stroke();
            } else {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillRect(-size / 2, -size / 2, size, size);
                ctx.restore();
            }
        }
        ctx.restore();
    };

    Particles.prototype.clear = function () { this.list.length = 0; };

    // ======================================================================
    // 浮動文字（傷害數字、得分提示、Combo）
    // ======================================================================
    function FloatText() { this.list = []; }

    FloatText.prototype.add = function (x, y, text, opt) {
        opt = opt || {};
        this.list.push({
            x: x, y: y, text: text,
            vy: opt.vy === undefined ? -60 : opt.vy,
            vx: opt.vx || 0,
            color: opt.color || '#fff0aa',
            stroke: opt.stroke || '#180d07',
            size: opt.size || 16,
            life: 0,
            maxLife: opt.life || 0.9,
            pop: opt.pop === undefined ? true : opt.pop
        });
    };

    FloatText.prototype.update = function (dt) {
        for (var i = this.list.length - 1; i >= 0; i--) {
            var f = this.list[i];
            f.life += dt;
            if (f.life >= f.maxLife) { this.list.splice(i, 1); continue; }
            f.y += f.vy * dt;
            f.x += f.vx * dt;
            f.vy *= Math.pow(0.94, dt * 60);
        }
    };

    FloatText.prototype.draw = function (ctx, font) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (var i = 0; i < this.list.length; i++) {
            var f = this.list[i];
            var t = f.life / f.maxLife;
            // 前 15% 用 outBack 彈出，讓數字「跳」出來
            var scale = f.pop && t < 0.15 ? ease.outBack(t / 0.15) : 1;
            ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.scale(scale, scale);
            ctx.font = 'bold ' + f.size + 'px ' + (font || '"DotGothic16", monospace');
            ctx.lineWidth = 4;
            ctx.strokeStyle = f.stroke;
            ctx.strokeText(f.text, 0, 0);
            ctx.fillStyle = f.color;
            ctx.fillText(f.text, 0, 0);
            ctx.restore();
        }
        ctx.restore();
    };

    FloatText.prototype.clear = function () { this.list.length = 0; };

    // ======================================================================
    // 補間動畫管理（用於 UI 過場、關卡開場）
    // ======================================================================
    function Tweens() { this.list = []; }

    Tweens.prototype.to = function (obj, props, duration, easing, onDone) {
        var from = {};
        for (var k in props) from[k] = obj[k];
        this.list.push({
            obj: obj, from: from, to: props, t: 0,
            dur: duration, ease: easing || ease.outQuad, onDone: onDone
        });
    };

    Tweens.prototype.update = function (dt) {
        for (var i = this.list.length - 1; i >= 0; i--) {
            var tw = this.list[i];
            tw.t += dt;
            var p = clamp(tw.t / tw.dur, 0, 1);
            var e = tw.ease(p);
            for (var k in tw.to) tw.obj[k] = lerp(tw.from[k], tw.to[k], e);
            if (p >= 1) {
                this.list.splice(i, 1);
                if (tw.onDone) tw.onDone();
            }
        }
    };

    Tweens.prototype.clear = function () { this.list.length = 0; };

    // ======================================================================
    // 像素繪圖工具
    // ======================================================================
    var Draw = {
        /** 以字串陣列繪製像素圖，'.' 為透明。palette 為 { 字元: 顏色 } */
        sprite: function (ctx, art, palette, x, y, scale, flipX) {
            scale = scale || 1;
            ctx.save();
            if (flipX) {
                ctx.translate(x + art[0].length * scale, y);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(x, y);
            }
            for (var r = 0; r < art.length; r++) {
                var row = art[r];
                for (var c = 0; c < row.length; c++) {
                    var ch = row[c];
                    if (ch === '.' || ch === ' ') continue;
                    var col = palette[ch];
                    if (!col) continue;
                    ctx.fillStyle = col;
                    ctx.fillRect(c * scale, r * scale, scale, scale);
                }
            }
            ctx.restore();
        },

        /** 將像素圖預先烘焙成離屏 canvas，避免每幀重畫上百個方塊 */
        bake: function (art, palette, scale) {
            scale = scale || 1;
            var cv = document.createElement('canvas');
            cv.width = art[0].length * scale;
            cv.height = art.length * scale;
            var c = cv.getContext('2d');
            Draw.sprite(c, art, palette, 0, 0, scale, false);
            return cv;
        },

        /** 純色剪影版本，用於受傷閃白 */
        bakeSilhouette: function (baked, color) {
            var cv = document.createElement('canvas');
            cv.width = baked.width; cv.height = baked.height;
            var c = cv.getContext('2d');
            c.drawImage(baked, 0, 0);
            c.globalCompositeOperation = 'source-in';
            c.fillStyle = color;
            c.fillRect(0, 0, cv.width, cv.height);
            return cv;
        },

        /** 圓角矩形 */
        roundRect: function (ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        },

        /** 帶描邊的像素風文字 */
        text: function (ctx, str, x, y, opt) {
            opt = opt || {};
            ctx.save();
            ctx.font = (opt.bold === false ? '' : 'bold ') + (opt.size || 16) + 'px ' +
                       (opt.font || '"DotGothic16", monospace');
            ctx.textAlign = opt.align || 'left';
            ctx.textBaseline = opt.baseline || 'top';
            if (opt.stroke !== false) {
                ctx.lineWidth = opt.strokeWidth || 4;
                ctx.lineJoin = 'round';
                ctx.strokeStyle = opt.stroke || '#180d07';
                ctx.strokeText(str, x, y);
            }
            ctx.fillStyle = opt.color || '#fff8e7';
            ctx.fillText(str, x, y);
            ctx.restore();
        },

        /** CRT 掃描線疊層，讓畫面有老映像管味道 */
        scanlines: function (ctx, w, h, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha === undefined ? 0.12 : alpha;
            ctx.fillStyle = '#000';
            for (var y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
            ctx.restore();
        },

        /** 暈影，把玩家視線收束到畫面中央 */
        vignette: function (ctx, w, h, strength) {
            var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35,
                                             w / 2, h / 2, Math.max(w, h) * 0.75);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,' + (strength === undefined ? 0.5 : strength) + ')');
            ctx.save();
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    };

    // ======================================================================
    // 最高分與進度儲存（localStorage，file:// 下同樣可用）
    // ======================================================================
    var Save = {
        _key: function (id, field) { return 'gth.' + id + '.' + field; },

        get: function (id, field, fallback) {
            try {
                var v = global.localStorage.getItem(this._key(id, field));
                return v === null ? fallback : JSON.parse(v);
            } catch (e) { return fallback; }
        },

        set: function (id, field, value) {
            try { global.localStorage.setItem(this._key(id, field), JSON.stringify(value)); }
            catch (e) { /* 隱私模式或檔案協定受限時靜默忽略 */ }
        },

        /** 回傳 true 表示破了紀錄 */
        submitScore: function (id, score) {
            var best = this.get(id, 'best', 0);
            if (score > best) { this.set(id, 'best', score); return true; }
            return false;
        },

        bestScore: function (id) { return this.get(id, 'best', 0); },

        /** 記錄已通關的最高關卡 */
        unlockLevel: function (id, level) {
            var cur = this.get(id, 'level', 1);
            if (level > cur) this.set(id, 'level', level);
        },

        maxLevel: function (id) { return this.get(id, 'level', 1); }
    };

    // ======================================================================
    // 遊戲主迴圈：固定時步 + 插值渲染
    // ----------------------------------------------------------------------
    // 以 1/60 秒為固定更新步長，累積剩餘時間補跑，確保 144Hz 與 60Hz 螢幕下
    // 物理與手感完全一致；渲染則每幀執行一次。
    // ======================================================================
    function Loop(opts) {
        this.step = 1 / (opts.fps || 60);
        this.update = opts.update;
        this.render = opts.render;
        this.maxFrameTime = 0.25;   // 分頁切回來時避免一次補跑上千步
        this._acc = 0;
        this._last = 0;
        this._raf = null;
        this.running = false;
        this.fps = 0;
        this._fpsAcc = 0; this._fpsCount = 0;
    }

    Loop.prototype.start = function () {
        if (this.running) return;
        this.running = true;
        this._last = performance.now();
        var self = this;
        function frame(now) {
            if (!self.running) return;
            self._raf = requestAnimationFrame(frame);
            var dt = (now - self._last) / 1000;
            self._last = now;
            if (dt > self.maxFrameTime) dt = self.maxFrameTime;

            // FPS 統計
            self._fpsAcc += dt; self._fpsCount++;
            if (self._fpsAcc >= 0.5) {
                self.fps = Math.round(self._fpsCount / self._fpsAcc);
                self._fpsAcc = 0; self._fpsCount = 0;
            }

            Input.beginFrame();
            Juice.update(dt);

            // 打擊頓幀期間仍推進 UI 與輸入，但世界靜止
            var scaled = dt * Juice.timeScale;
            self._acc += scaled;
            var steps = 0;
            while (self._acc >= self.step && steps < 5) {
                self.update(self.step);
                self._acc -= self.step;
                steps++;
            }
            if (self._acc > self.step * 5) self._acc = 0;

            Input.endFrame(dt);
            self.render(self._acc / self.step);
        }
        this._raf = requestAnimationFrame(frame);
    };

    Loop.prototype.stop = function () {
        this.running = false;
        if (this._raf) cancelAnimationFrame(this._raf);
    };

    // ======================================================================
    // 畫布自適應：維持像素完美的整數縮放，並在小螢幕上退回等比縮放
    // ======================================================================
    /* ======================================================================
       圖集
       ======================================================================
       整站在此之前一張圖檔都沒用過——所有角色與場景都是程式碼畫的。
       這一層負責把「一張 512×512 的 16×16 格圖集」變成可以按格號取用的素材。

       **最重要的設計是失敗時的行為：圖載不到就當作沒有這回事。**
       這一站的每一款都能靠程式繪製自己畫完整個畫面，圖只是升級。
       所以 ready 為 false 時 draw() 直接回 false，呼叫端據此走原本的畫法——
       圖檔缺了、路徑錯了、離線了，遊戲照樣玩，只是回到方塊人。
       反過來寫（畫不出來就跳過）會得到一片空白，那比沒有圖還糟。
       ====================================================================== */
    function Atlas(src, cell) {
        var self = this;
        this.cell = cell || 32;
        this.ready = false;
        this.img = new Image();
        this.img.onload = function () {
            /* 尺寸不合就當作沒有。格位是照 512×512 訂的，
               換成別的尺寸會整組錯位——錯位的圖比沒有圖更難debug。 */
            self.ready = self.img.width >= self.cell && self.img.height >= self.cell;
        };
        this.img.onerror = function () { self.ready = false; };
        this.img.src = src;
    }

    /**
     * 把 (col,row) 那一格畫到 (x,y)，寬高預設等於格子大小。
     * flip 為真時水平翻轉——圖集只畫右向，左向一律由程式翻。
     * 回傳 false 代表「這次沒畫」，呼叫端要自己退回程式繪製。
     */
    Atlas.prototype.draw = function (ctx, col, row, x, y, w, h, flip) {
        if (!this.ready) return false;
        var c = this.cell;
        w = w || c; h = h || c;
        ctx.save();
        ctx.imageSmoothingEnabled = false;      // 像素圖放大一定要關，不然邊緣會糊
        if (flip) {
            ctx.translate(Math.round(x + w), Math.round(y));
            ctx.scale(-1, 1);
            ctx.drawImage(this.img, col * c, row * c, c, c, 0, 0, w, h);
        } else {
            ctx.drawImage(this.img, col * c, row * c, c, c, Math.round(x), Math.round(y), w, h);
        }
        ctx.restore();
        return true;
    };

    function fitCanvas(canvas, opts) {
        opts = opts || {};
        var maxScale = opts.maxScale || 4;
        var padding = opts.padding === undefined ? 32 : opts.padding;

        var lastW = -1;

        /* opts.reserve 是「每次重算時才問一次」的保留高度。
           全螢幕模式下標題與說明都不在畫面上，固定預留 300px 等於白白浪費一大塊，
           所以要能動態切換，不能在 boot 時就寫死。 */
        function apply() {
            var availW = (opts.container ? opts.container.clientWidth : global.innerWidth) - padding;
            var availH = global.innerHeight - (opts.reserve ? opts.reserve() : (opts.reserveHeight || 220));
            var scale = Math.min(availW / canvas.width, availH / canvas.height, maxScale);
            /* **倍率要讓「一個原始像素」對應到整數個裝置像素。**
               決定銳不銳利的不是 CSS 倍率，是 CSS 倍率 × devicePixelRatio：
                 DPR 1 的一般螢幕：CSS 1.5 倍 → 1.5 個裝置像素，
                   每個原始像素被拆成一邊 1px、一邊 2px，邊緣糊掉而且糊得不均勻。
                   這一站畫面上到處是 11～14px 的教材文字與 1px 細線，最先犧牲的就是可讀性。
                 DPR 2 的筆電／手機：CSS 1.5 倍 → 3 個裝置像素，**完全銳利**。
               所以階距取 1/DPR：一般螢幕自動變成純整數倍，
               高解析螢幕則多出 1.5、2.5 這些同樣銳利的中間階，
               直式遊戲（小精靈 448×528、俄羅斯方塊 460×520）才不會被迫掉回 1 倍。 */
            if (scale >= 1) {
                var step = 1 / Math.max(1, Math.round(global.devicePixelRatio || 1));
                var snapped = Math.max(1, Math.floor(scale / step + 1e-6) * step);
                /* **1 倍是例外：寧可略糊也不要小。**
                   直式的 18 款（小精靈 448×528、俄羅斯方塊 460×520 這一類）
                   在 DPR 1 的 1080p 螢幕上，2 倍需要 1056px 高——塞不進去，
                   於是整數對齊只能給 1 倍，比改版前的 1.5 倍還小。
                   那是物理限制，不是可以調的參數。
                   目標是「一般 1080p 螢幕可玩」，所以只在**這一種情形**破例：
                   對齊之後剛好落在 1 倍、而 1.5 倍放得下時，取 1.5 倍。
                   其餘情況一律維持對齊——2 倍與 2.5 倍之間永遠選 2 倍。 */
                if (snapped === 1 && scale >= 1.5) snapped = 1.5;
                scale = snapped;
            } else scale = Math.max(0.4, scale);
            var w = Math.round(canvas.width * scale);
            /* 冪等：值沒變就不要寫。
               ResizeObserver 盯的是畫布的父層，而父層的尺寸又取決於畫布——
               每次都無條件寫入會變成「改尺寸 → 父層變 → 再觸發 → 再改」的迴圈。
               只在真的改變時寫，觀察器跑一輪就會安靜下來。 */
            if (w === lastW) return;
            lastW = w;
            canvas.style.width = w + 'px';
            canvas.style.height = Math.round(canvas.height * scale) + 'px';
        }

        apply();

        /* 只在 boot 時算一次是不夠的。
           版面尺寸在頁面剛載入時常常還沒穩定——實測把視窗改成 375×812 之後
           立刻導航，畫布會被算成 179px（撞到 0.4 下限），要等到有 resize 事件才修正。
           真實手機上也有同一類情形：瀏覽器工具列收合、虛擬鍵盤收起、
           安裝橫幅出現，都會改變可用高度，而且不一定會發 resize。
           所以除了 resize 之外，再補三道保險：
             1. load 之後重算一次（字型與版面此時才真的定案）
             2. 兩次延遲重算，涵蓋「載入後才穩定」的情形
             3. 有 ResizeObserver 就直接盯著容器，那是最準的訊號 */
        global.addEventListener('resize', apply);
        global.addEventListener('orientationchange', apply);
        global.addEventListener('load', apply);
        setTimeout(apply, 120);
        setTimeout(apply, 600);

        if (typeof ResizeObserver === 'function') {
            var target = opts.container || canvas.parentElement;
            if (target) {
                var ro = new ResizeObserver(function () { apply(); });
                ro.observe(target);
            }
        }
        return apply;
    }

    // ======================================================================
    // 對外命名空間
    // ======================================================================
    global.RE = {
        // 數學
        TAU: TAU, clamp: clamp, lerp: lerp, rand: rand, randInt: randInt,
        pick: pick, sign: sign, dist: dist, approach: approach, ease: ease,
        // 碰撞
        aabb: aabb, circleHit: circleHit, resolveAABB: resolveAABB,
        // 系統
        Input: Input, Motion: Motion, juice: Juice, Draw: Draw, Save: Save,
        Particles: Particles, FloatText: FloatText, Tweens: Tweens,
        Loop: Loop, fitCanvas: fitCanvas, Atlas: Atlas
    };

})(window);
