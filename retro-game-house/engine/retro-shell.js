/* ==========================================================================
   Retro Shell — 遊戲時光屋統一遊戲外殼
   --------------------------------------------------------------------------
   負責每款遊戲頁面「遊戲以外」的一切：機台外框、HUD、標題／暫停／結束疊層、
   關卡字卡、手機虛擬按鍵、音量控制、史料解說區、返回導覽。

   遊戲本身只需：
       var G = RetroShell.boot({ ...詮釋資料... });
       // 之後使用 G.ctx 繪圖、G.setStat() 更新 HUD、G.gameOver() 結束
    如此 57 款遊戲能共用同一套介面語言與手感回饋，也讓每款遊戲檔案專注在玩法。
   ========================================================================== */
(function (global) {
    'use strict';

    var DECADE_LABEL = {
        '70s': '1970 年代', '80s': '1980 年代', '90s': '1990 年代',
        '00s': '2000 年代', '10s': '2010 年代', '20s': '2020 年代'
    };

    /* 最終收尾批次只列已實際產出 manifest 的 36 款，避免其餘頁面發出無意義的 404。
       這層是教材頁的「美術圖譜」，讓每個正式候選語意格在正常流程中看得到；
       不碰 Canvas、update、碰撞或 Math.random，因此視覺增量與遊戲模擬完全隔離。 */
    var FINAL_SWEEP_GAMES = {
        space_invaders: 1, breakout: 1, galaxian: 1, blockade: 1, tank_combat: 1,
        pacman: 1, donkey_kong: 1, frogger: 1, centipede: 1, dig_dug: 1,
        tetris: 1, super_mario: 1, bomberman: 1, battle_city: 1,
        street_fighter: 1, sonic: 1, doom2d: 1, pipe_mania: 1, solitaire: 1,
        bejeweled: 1, fancy_pants: 1, helicopter: 1, meat_boy: 1, pvz: 1,
        flappy_bird: 1, game_2048: 1, super_hexagon: 1, vvvvvv: 1,
        crossy_road: 1, slither: 1, downwell: 1, among_us: 1, wordle: 1,
        balatro: 1, suika: 1, cozy_farm: 1
    };

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    // 舊教材有少量 Markdown 粗體。內容來源都是專案內的受信任字串，
    // 在共用外殼轉一次，避免學生直接看到 ** 標記。
    function rich(text) {
        return String(text || '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }

    function isTouchDevice() {
        /* Chromium 可能在沒有觸控輸入時仍暴露 ontouchstart；只用屬性存在與否
           會讓桌機誤顯示整組虛擬按鍵。粗略指標與實際觸控點至少成立一項才顯示。 */
        var coarse = global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
        var anyCoarse = global.matchMedia && global.matchMedia('(any-pointer: coarse)').matches;
        return !!coarse || !!anyCoarse;
    }

    function Shell(cfg) {
        this.cfg = cfg;
        this.id = cfg.id;
        /* null 代表沿用作業系統 prefers-reduced-motion；玩家按過特效鍵後，
           才用全站設定覆寫。使用 site 作為共用 id，避免 57 款各存一份。 */
        RE.Motion.setReduced(RE.Save.get('site', 'comfortFx', null));
        this.stats = {};
        this._statEls = {};
        this._state = 'title';   // title | playing | paused | over | stagecard
        this._handlers = {};
        this._build();
    }

    // ======================================================================
    // 建構頁面
    // ======================================================================
    Shell.prototype._build = function () {
        var cfg = this.cfg, self = this;
        document.body.className = 'rs-body rs-era-' + (cfg.decade || '80s') +
            (isTouchDevice() ? ' rs-touch-on' : '') +
            (RE.Motion.reduced ? ' rs-comfort' : '');
        document.body.setAttribute('data-era', cfg.decade || '80s');
        document.title = '遊戲時光屋 ✦ ' + cfg.title;

        // ---- 頂部列 ----
        var top = el('div', 'rs-topbar');
        var backHref = cfg.backHref || ('../../decades/' + this._decadeFile() + '.html');
        var back = el('a', 'rs-back', '◀ 回到 ' + (DECADE_LABEL[cfg.decade] || '遊戲館'));
        back.href = backHref;
        top.appendChild(back);

        var meta = el('div', 'rs-meta');
        if (cfg.year) meta.appendChild(el('span', 'rs-chip era', cfg.year + '　' + (cfg.platform || '')));
        if (cfg.genre) meta.appendChild(el('span', 'rs-chip genre', cfg.genre));
        if (cfg.original) meta.appendChild(el('span', 'rs-chip orig', '致敬：' + cfg.original));
        top.appendChild(meta);
        document.body.appendChild(top);

        // ---- 標題 ----
        var title = el('div', 'rs-title');
        title.appendChild(el('h1', null, cfg.title));
        if (cfg.tagline) title.appendChild(el('p', 'rs-subtitle', cfg.tagline));
        document.body.appendChild(title);

        // ---- 機台 ----
        var cab = el('div', 'rs-cabinet');

        // HUD
        var hud = el('div', 'rs-hud');
        var left = el('div', 'rs-hud-group');
        var statDefs = cfg.hud || [
            { key: 'score', label: 'SCORE' },
            { key: 'best', label: 'BEST' }
        ];
        statDefs.forEach(function (s) {
            var wrap = el('span', 'rs-stat');
            wrap.appendChild(el('span', 'rs-label', s.label));
            var v = el('span', 'rs-value', s.init !== undefined ? s.init : '0');
            wrap.appendChild(v);
            self._statEls[s.key] = v;
            self.stats[s.key] = s.init !== undefined ? s.init : 0;
            left.appendChild(wrap);
        });
        // 生命值以愛心呈現，比純數字更直覺
        if (cfg.lives !== undefined) {
            var lw = el('span', 'rs-stat');
            lw.appendChild(el('span', 'rs-label', 'LIFE'));
            var hearts = el('span', 'rs-hearts', '');
            lw.appendChild(hearts);
            this._heartsEl = hearts;
            this._maxLives = cfg.lives;
            left.appendChild(lw);
            this.setLives(cfg.lives);
        }
        hud.appendChild(left);

        var right = el('div', 'rs-hud-group');
        this._bgmBtn = el('button', 'rs-icon-btn off', '♪');
        this._bgmBtn.title = '背景音樂';
        this._bgmBtn.setAttribute('aria-label', '切換背景音樂');
        this._bgmBtn.onclick = function () {
            var on = RetroAudio.toggleBGM(cfg.bgm || cfg.decade || '80s');
            self._bgmBtn.classList.toggle('off', !on);
        };
        this._muteBtn = el('button', 'rs-icon-btn', '🔊');
        this._muteBtn.title = '靜音';
        this._muteBtn.setAttribute('aria-label', '切換靜音');
        this._muteBtn.onclick = function () {
            var m = RetroAudio.toggleMute();
            self._muteBtn.textContent = m ? '🔇' : '🔊';
            self._muteBtn.classList.toggle('off', m);
        };
        this._fxBtn = el('button', 'rs-icon-btn', '✦');
        this._fxBtn.setAttribute('aria-label', '切換完整特效與舒適特效');
        function syncFxButton() {
            var reduced = RE.Motion.reduced;
            self._fxBtn.textContent = reduced ? '✧' : '✦';
            self._fxBtn.title = reduced ? '舒適特效：減少震動、閃白與粒子' : '完整特效：震動、閃白與粒子全開';
            self._fxBtn.setAttribute('aria-pressed', reduced ? 'true' : 'false');
            self._fxBtn.classList.toggle('off', reduced);
            document.body.classList.toggle('rs-comfort', reduced);
        }
        this._fxBtn.onclick = function () {
            RE.Motion.setReduced(!RE.Motion.reduced);
            RE.Save.set('site', 'comfortFx', RE.Motion.reduced);
            syncFxButton();
        };
        syncFxButton();
        this._pauseBtn = el('button', 'rs-icon-btn', '❚❚');
        this._pauseBtn.title = '暫停 (P)';
        this._pauseBtn.setAttribute('aria-label', '暫停或繼續遊戲');
        this._pauseBtn.onclick = function () { self.togglePause(); };
        /* 全螢幕。
           畫面放大倍率取整數之後，一般版面在 1080p 上多半只到 2 倍——
           因為標題、HUD 與底下的教材文字加起來就吃掉三百多 px 的高度。
           全螢幕把那些都拿掉，同一個螢幕通常能多跳一到兩個整數階。
           這是「畫面要更大」唯一不犧牲銳利度的做法。 */
        this._fsBtn = el('button', 'rs-icon-btn', '⛶');
        this._fsBtn.title = '全螢幕 (F)';
        this._fsBtn.setAttribute('aria-label', '切換全螢幕');
        this._fsBtn.onclick = function () { self.toggleFullscreen(); };
        right.appendChild(this._bgmBtn);
        right.appendChild(this._muteBtn);
        right.appendChild(this._fxBtn);
        right.appendChild(this._fsBtn);
        right.appendChild(this._pauseBtn);
        hud.appendChild(right);
        cab.appendChild(hud);

        // 畫布
        var screen = el('div', 'rs-screen');
        var canvas = el('canvas');
        canvas.width = cfg.width || 480;
        canvas.height = cfg.height || 360;
        canvas.tabIndex = 0;
        canvas.setAttribute('role', 'application');
        canvas.setAttribute('aria-label', cfg.title + '遊戲畫面；操作方式與學習任務請見下方。');
        screen.appendChild(canvas);

        this.overlayEl = el('div', 'rs-overlay');
        screen.appendChild(this.overlayEl);
        cab.appendChild(screen);
        document.body.appendChild(cab);
        this.cabinetEl = cab;                 // 全螢幕要把整個機殼送進去，見 toggleFullscreen

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = false;
        this.screenEl = screen;
        this.width = canvas.width;
        this.height = canvas.height;

        // ---- 手機虛擬按鍵 ----
        if (cfg.touch !== 'none') this._buildTouch(cfg.touch || 'dpad+ab');

        // ---- 說明與史料 ----
        this._buildInfo();

        // ---- 引擎初始化 ----
        RE.Input.init(canvas);
        /* 保留高度改成「每次重算時才問」，因為全螢幕與一般版面差很多：
             一般版面：上方標題列 39 ＋ 大標 74 ＋ HUD 52 ＋ 機殼邊框與留白
                       ≈ 260px（實測機殼上緣在 y=163、HUD 52px）。
                       原本寫死 300 太保守，白白吃掉一個整數階。
             全螢幕：只剩 HUD 與邊框，100px 就夠。
           手機另計：底下還有一整排虛擬按鍵。 */
        this._fitApply = RE.fitCanvas(canvas, {
            maxScale: cfg.maxScale || 3,
            reserve: function () {
                if (self._isFullscreen()) return isTouchDevice() ? 200 : 100;
                return isTouchDevice() ? 380 : 260;
            }
        });

        // 暫停快捷鍵
        global.addEventListener('keydown', function (e) {
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (self._state === 'playing' || self._state === 'paused') self.togglePause();
            }
            /* F 切全螢幕。不要用 Escape——瀏覽器已經把 Escape 綁成離開全螢幕，
               再綁一次會變成「按一下同時離開全螢幕又暫停」。 */
            if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) self.toggleFullscreen();
        });

        /* 進出全螢幕之後要重算倍率。
           fullscreenchange 是唯一可靠的訊號：使用者可能用 Escape 或 F11 離開，
           那時候不會經過 toggleFullscreen()。 */
        ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
            document.addEventListener(ev, function () {
                setTimeout(function () { if (self._fitApply) self._fitApply(); }, 60);
            });
        });
        // 切到其他分頁自動暫停，避免玩家回來時已經死了
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && self._state === 'playing') self.pause();
        });
    };

    Shell.prototype._decadeFile = function () {
        var map = { '70s': '1970s', '80s': '1980s', '90s': '1990s',
                    '00s': '2000s', '10s': '2010s', '20s': '2020s' };
        return map[this.cfg.decade] || '1980s';
    };

    Shell.prototype._buildTouch = function (mode) {
        var wrap = el('div', 'rs-touch');

        if (mode.indexOf('dpad') === 0) {
            var pad = el('div', 'rs-dpad');
            var cells = [
                ['blank', null, ''], ['up', 'up', '▲'], ['blank', null, ''],
                ['left', 'left', '◀'], ['blank', null, ''], ['right', 'right', '▶'],
                ['blank', null, ''], ['down', 'down', '▼'], ['blank', null, '']
            ];
            cells.forEach(function (c) {
                var b = el(c[1] ? 'button' : 'span', 'rs-pad' + (c[0] === 'blank' ? ' blank' : ''), c[2]);
                if (c[1]) {
                    b.type = 'button';
                    b.setAttribute('aria-label', { up: '向上', down: '向下', left: '向左', right: '向右' }[c[1]]);
                    RE.Input.bindTouchButton(b, c[1]);
                }
                pad.appendChild(b);
            });
            wrap.appendChild(pad);
        } else {
            wrap.appendChild(el('div'));
        }

        if (mode.indexOf('ab') !== -1) {
            var acts = el('div', 'rs-actions');
            var bBtn = el('button', 'rs-abtn b', this.cfg.labelB || 'B');
            var aBtn = el('button', 'rs-abtn a', this.cfg.labelA || 'A');
            bBtn.type = 'button';
            aBtn.type = 'button';
            bBtn.setAttribute('aria-label', '次要動作：' + (this.cfg.labelB || 'B'));
            aBtn.setAttribute('aria-label', '主要動作：' + (this.cfg.labelA || 'A'));
            RE.Input.bindTouchButton(bBtn, 'b');
            RE.Input.bindTouchButton(aBtn, 'a');
            acts.appendChild(bBtn);
            acts.appendChild(aBtn);
            wrap.appendChild(acts);
        }

        document.body.appendChild(wrap);
        this.touchEl = wrap;
    };

    Shell.prototype._buildInfo = function () {
        var cfg = this.cfg;
        var info = el('div', 'rs-info');

        // 操作說明
        if (cfg.controls && cfg.controls.length) {
            var p = el('div', 'rs-panel');
            p.appendChild(el('h3', null, '🎮 操作方式'));
            var keys = el('div', 'rs-keys');
            cfg.controls.forEach(function (c) {
                var k = el('span', 'rs-key');
                c.keys.forEach(function (key) { k.appendChild(el('kbd', null, key)); });
                k.appendChild(document.createTextNode(' ' + c.desc));
                keys.appendChild(k);
            });
            p.appendChild(keys);
            if (cfg.howto) p.appendChild(el('p', null, '<br>' + rich(cfg.howto)));
            info.appendChild(p);
        }

        // 教材閉環：把「玩什麼、看什麼、如何連到遊戲史」放在長文之前。
        if (cfg.lesson) {
            var lesson = el('section', 'rs-panel rs-learning');
            lesson.appendChild(el('h3', null, '🎯 本頁學習任務'));
            var lessonRoute = el('ol', 'rs-learning-route');
            lessonRoute.setAttribute('aria-label', '五步學習路徑');
            [
                ['verb', '定位'],
                ['mission', '驗證'],
                ['innovation', '突破'],
                ['evolution', '演化'],
                ['reflection', '反思']
            ].forEach(function (step, index) {
                if (!cfg.lesson[step[0]]) return;
                var routeItem = el('li', null);
                routeItem.appendChild(el('b', null, String(index + 1).padStart(2, '0')));
                routeItem.appendChild(el('span', null, step[1]));
                lessonRoute.appendChild(routeItem);
            });
            lesson.appendChild(lessonRoute);
            var lessonGrid = el('div', 'rs-learning-grid');
            [
                ['verb', '01 定位｜核心動詞'],
                ['mission', '02 驗證｜遊玩任務'],
                ['innovation', '03 突破｜當代創新'],
                ['evolution', '04 演化｜後世連結']
            ].forEach(function (def) {
                if (!cfg.lesson[def[0]]) return;
                var item = el('div', 'rs-learning-item');
                item.appendChild(el('span', 'rs-learning-label', def[1]));
                item.appendChild(el('p', null, rich(cfg.lesson[def[0]])));
                lessonGrid.appendChild(item);
            });
            lesson.appendChild(lessonGrid);
            if (cfg.lesson.reflection) {
                var reflection = el('div', 'rs-reflection');
                reflection.appendChild(el('span', 'rs-learning-label', '05 反思｜課後思考'));
                reflection.appendChild(el('p', null, rich(cfg.lesson.reflection)));
                lesson.appendChild(reflection);
            }
            info.appendChild(lesson);
        }

        // 設計解讀 + 史料：這是「課程教材」定位的核心，讓玩完能學到東西
        if (cfg.design || cfg.history) {
            var d = el('div', 'rs-panel');
            d.appendChild(el('h3', null, '📖 這款遊戲為什麼重要'));
            if (cfg.design) d.appendChild(el('p', null, rich(cfg.design)));
            if (cfg.history) {
                var h = el('div', 'rs-history');
                h.appendChild(el('span', 'rs-history-label', '史料 · ' + (cfg.year || '') +
                    (cfg.developer ? ' · ' + cfg.developer : '')));
                h.appendChild(el('span', null, rich(cfg.history)));
                if (cfg.sources && cfg.sources.length) {
                    var sourceList = el('div', 'rs-sources');
                    sourceList.appendChild(el('span', 'rs-sources-label', '查證來源'));
                    cfg.sources.forEach(function (source, index) {
                        if (!source || !source.url) return;
                        var link = el('a', 'rs-source-link');
                        link.href = source.url;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.textContent = source.label || ('來源 ' + (index + 1));
                        link.setAttribute('aria-label', '開啟史料來源：' + link.textContent + '（新分頁）');
                        sourceList.appendChild(link);
                    });
                    h.appendChild(sourceList);
                }
                d.appendChild(h);
            }
            info.appendChild(d);
        }

        document.body.appendChild(info);
        this._buildArtAtlas(info);

        var notice = el('p', 'rs-notice',
            '本作為<strong>致敬式原創復刻</strong>，角色造型、名稱與美術皆為本站自製，' +
            '玩法設計參考 ' + (cfg.original || '同時代經典作品') + ' 的核心機制，供教學與研究討論使用。' +
            '所有原作商標與著作權歸各自權利人所有。');
        document.body.appendChild(notice);
    };

    /**
     * 載入該款的正式候選圖集，做成可讀的教材圖譜。
     * 圖格使用同一張 atlas 的 CSS 裁切，不複製影像、不把換尺寸算成新單元。
     */
    Shell.prototype._buildArtAtlas = function (info) {
        var self = this;
        if (!FINAL_SWEEP_GAMES[this.id]) return;
        var base = '../../assets/games/' + this.id + '/';
        fetch(base + 'final-sweep-manifest.json')
            .then(function (response) {
                if (!response.ok) throw new Error('美術圖譜 manifest ' + response.status);
                return response.json();
            })
            .then(function (manifest) {
                var entries = Object.keys(manifest.assets || {}).map(function (name) {
                    return { name: name, asset: manifest.assets[name] };
                });
                if (!entries.length) return;

                var image = new Image();
                image.onload = function () {
                    var panel = el('section', 'rs-panel rs-art-atlas');
                    panel.setAttribute('data-art-candidate-count', String(entries.length));
                    panel.appendChild(el('h3', null, '🎨 美術候選圖譜（待人工 Gate）'));
                    panel.appendChild(el('p', 'rs-art-intro',
                        '依本作年代與媒材重製的候選語意件；保留核心動詞的判讀，' +
                        '並把角色、材質、場景與演出拆成可追溯的獨立模組。' +
                        '目前僅供逐張審看，未通過人工 Gate 前不列入正式美術帳。'));
                    var grid = el('div', 'rs-art-grid');
                    grid.setAttribute('role', 'list');
                    entries.forEach(function (entry, index) {
                        var a = entry.asset;
                        var item = el('figure', 'rs-art-item');
                        item.setAttribute('role', 'listitem');
                        var thumb = el('span', 'rs-art-thumb');
                        var col = Math.round((a.x || 0) / (manifest.cellWidth || 128));
                        var row = Math.round((a.y || 0) / (manifest.cellHeight || 128));
                        thumb.style.backgroundImage = 'url("' + base + manifest.atlas + '")';
                        thumb.style.backgroundSize = '400% 400%';
                        thumb.style.backgroundPosition = (col * 100 / 3) + '% ' + (row * 100 / 3) + '%';
                        thumb.setAttribute('aria-hidden', 'true');
                        item.appendChild(thumb);
                        item.appendChild(el('figcaption', null,
                            String(index + 1).padStart(2, '0') + '｜' + (a.label || '補充演出')));
                        grid.appendChild(item);
                    });
                    panel.appendChild(grid);
                    info.appendChild(panel);
                    self.artAtlasManifest = manifest;
                };
                image.src = base + manifest.atlas;
            })
            .catch(function () {
                /* 圖譜是漸進增強；資產缺失時不阻斷遊戲與教材本文。驗收工具會另行報錯。 */
            });
    };

    // ======================================================================
    // HUD 操作
    // ======================================================================

    /** 更新一項 HUD 數值，數值上升時會彈跳強調 */
    Shell.prototype.setStat = function (key, value) {
        var e = this._statEls[key];
        this.stats[key] = value;
        if (!e) return;
        var prev = parseFloat(e.textContent.replace(/,/g, '')) || 0;
        e.textContent = typeof value === 'number' ? value.toLocaleString('en-US') : value;
        if (typeof value === 'number' && value > prev) {
            e.classList.remove('rs-bump');
            void e.offsetWidth;               // 強制重排以重播動畫
            e.classList.add('rs-bump');
            setTimeout(function () { e.classList.remove('rs-bump'); }, 130);
        }
    };

    Shell.prototype.addScore = function (n) {
        this.setStat('score', (this.stats.score || 0) + n);
        return this.stats.score;
    };

    Shell.prototype.setLives = function (n) {
        this.lives = n;
        if (!this._heartsEl) return;
        var s = '';
        for (var i = 0; i < this._maxLives; i++) s += (i < n ? '❤' : '🖤');
        this._heartsEl.textContent = s;
    };

    // ======================================================================
    // 疊層與狀態
    // ======================================================================

    /**
     * 顯示疊層。
     * opt: { title, titleClass, body, score, best, record, buttons:[{label,cls,onClick}], press }
     */
    Shell.prototype.showOverlay = function (opt) {
        var self = this;
        var o = this.overlayEl;
        var scrollBody = null;
        o.innerHTML = '';
        if (opt.title) {
            var h = el('h2', opt.titleClass || null, opt.title);
            o.appendChild(h);
        }
        if (opt.score !== undefined) {
            o.appendChild(el('div', 'rs-big-score', Number(opt.score).toLocaleString('en-US')));
        }
        if (opt.record) o.appendChild(el('div', 'rs-record', '★ 新紀錄！★'));
        /* 長篇教學不能再和開始按鈕搶同一個垂直空間。
           以前直接把 p 塞進 overlay，手機窄畫面遇到 VVVVVV、Super Hexagon
           這類教材文字時，標題或開始按鈕會被上下裁掉；把正文獨立成可捲動區，
           讓「先讀懂，再開始」與按鈕永遠同時可達。 */
        if (opt.body) {
            var bodyBox = el('div', 'rs-overlay-body');
            scrollBody = bodyBox;
            bodyBox.appendChild(el('p', null, rich(opt.body)));
            /* 正文真的超過可視區時才顯示提示；短篇教學不加多餘 UI，
               長篇教材則明確告訴玩家「還有內容可以滑」，避免把捲動區誤認成裁切。 */
            bodyBox.appendChild(el('div', 'rs-overlay-scrollcue', '↕ 上下滑動閱讀'));
            o.appendChild(bodyBox);
        }
        if (opt.buttons && opt.buttons.length) {
            var row = el('div', 'rs-btn-row');
            opt.buttons.forEach(function (b) {
                var btn = el('button', 'rs-btn' + (b.cls ? ' ' + b.cls : ''), b.label);
                btn.onclick = function () { RetroAudio.play('confirm'); b.onClick(self); };
                row.appendChild(btn);
            });
            o.appendChild(row);
        }
        if (opt.press) o.appendChild(el('div', 'rs-press', opt.press));
        o.classList.add('show');
        if (scrollBody) {
            requestAnimationFrame(function () {
                scrollBody.classList.toggle('is-scrollable', scrollBody.scrollHeight > scrollBody.clientHeight + 1);
            });
        }
    };

    Shell.prototype.hideOverlay = function () {
        this.overlayEl.classList.remove('show');
        this.overlayEl.innerHTML = '';
    };

    /** 標題畫面。callback 為玩家按下開始後執行 */
    Shell.prototype.showTitle = function (opt) {
        var self = this;
        opt = opt || {};
        this._state = 'title';
        this.showOverlay({
            title: opt.title || this.cfg.title,
            body: opt.body || this.cfg.howto,
            buttons: [{
                label: opt.startLabel || '▶ 開始遊戲',
                onClick: function () { self.hideOverlay(); self._state = 'playing'; if (opt.onStart) opt.onStart(); }
            }],
            press: '按 空白鍵 或 Enter 開始'
        });
        // 鍵盤開始
        var onKey = function (e) {
            if (self._state !== 'title') return;
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                global.removeEventListener('keydown', onKey);
                RetroAudio.play('confirm');
                self.hideOverlay();
                self._state = 'playing';
                if (opt.onStart) opt.onStart();
            }
        };
        global.addEventListener('keydown', onKey);
    };

    /**
     * 關卡開場字卡。給玩家 1.4 秒認識這關的主題與提示，
     * 這是節奏設計上的「呼吸點」，也降低直接開打的認知負擔。
     */
    Shell.prototype.stageCard = function (no, name, hint, onDone) {
        var self = this;
        var card = el('div', 'rs-stage-card');
        card.appendChild(el('div', 'rs-stage-no', 'STAGE ' + no));
        card.appendChild(el('div', 'rs-stage-name', name));
        if (hint) card.appendChild(el('div', 'rs-stage-hint', hint));
        this.screenEl.appendChild(card);
        RetroAudio.play('select');
        this._state = 'stagecard';
        setTimeout(function () {
            if (card.parentNode) card.parentNode.removeChild(card);
            self._state = 'playing';
            if (onDone) onDone();
        }, 1500);
    };

    Shell.prototype.pause = function () {
        if (this._state !== 'playing') return;
        this._state = 'paused';
        RetroAudio.play('pause');
        var self = this;
        this.showOverlay({
            title: '暫停中',
            body: '深呼吸一下，準備好再繼續。',
            buttons: [
                { label: '▶ 繼續', onClick: function () { self.resume(); } },
                { label: '↻ 重新開始', cls: 'ghost', onClick: function () { self.restart(); } }
            ],
            press: '按 P 或 ESC 繼續'
        });
    };

    Shell.prototype.resume = function () {
        if (this._state !== 'paused') return;
        this.hideOverlay();
        this._state = 'playing';
        RE.Input.reset();
    };

    Shell.prototype.togglePause = function () {
        if (this._state === 'paused') this.resume();
        else if (this._state === 'playing') this.pause();
    };

    Shell.prototype.isPlaying = function () { return this._state === 'playing'; };
    Shell.prototype.state = function () { return this._state; };

    /* ----------------------------------------------------------------------
       全螢幕
       ----------------------------------------------------------------------
       進全螢幕的是**機殼**而不是畫布本身。
       只讓 <canvas> 全螢幕的話，瀏覽器會把它拉伸到填滿整個螢幕、
       比例整個跑掉，而且 HUD、暫停按鈕、虛擬按鍵全部消失——
       手機上等於沒有操作介面。整個機殼一起進去，版面規則完全不用改。 */
    Shell.prototype._isFullscreen = function () {
        var fe = document.fullscreenElement || document.webkitFullscreenElement;
        return !!(fe && this.cabinetEl && fe === this.cabinetEl);
    };

    Shell.prototype.toggleFullscreen = function () {
        var self = this, cab = this.cabinetEl;
        if (!cab) return;
        if (this._isFullscreen()) {
            (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
            return;
        }
        var req = cab.requestFullscreen || cab.webkitRequestFullscreen;
        if (!req) return;                                   // 舊瀏覽器：靜靜不做事，不要拋錯
        var p = req.call(cab);
        /* Safari 的 webkitRequestFullscreen 不回 Promise，要防呆。
           失敗（例如 iOS Safari 不支援元素全螢幕）就當作沒發生，
           不要跳錯誤訊息打斷遊戲。 */
        if (p && p.catch) p.catch(function () {});
        setTimeout(function () { if (self._fitApply) self._fitApply(); }, 60);
    };

    /**
     * 遊戲結束。自動處理最高分比對、破紀錄音效與重玩按鈕。
     * opt: { score, win, body, onRestart, nextHref }
     */
    Shell.prototype.gameOver = function (opt) {
        var self = this;
        opt = opt || {};
        this._state = 'over';
        var score = opt.score !== undefined ? opt.score : (this.stats.score || 0);
        var record = RE.Save.submitScore(this.id, score);
        if (this._statEls.best) this.setStat('best', RE.Save.bestScore(this.id));

        RetroAudio.play(opt.win ? 'win' : 'gameover');
        if (record && score > 0) setTimeout(function () { RetroAudio.play('newRecord'); }, 700);

        var buttons = [{
            label: '↻ 再玩一次',
            onClick: function () { self.restart(); }
        }];
        if (opt.nextHref) {
            buttons.push({ label: '下一款 ▶', cls: 'ghost',
                onClick: function () { location.href = opt.nextHref; } });
        }
        buttons.push({ label: '回遊戲館', cls: 'ghost',
            onClick: function () { location.href = '../../decades/' + self._decadeFile() + '.html'; } });

        this.showOverlay({
            title: opt.win ? '★ 通關 ★' : 'GAME OVER',
            titleClass: opt.win ? 'win' : 'danger',
            score: score,
            record: record && score > 0,
            body: opt.body || (opt.win ? '你完整走完了這款遊戲的設計曲線。' : '再試一次，這次會更好。'),
            buttons: buttons,
            press: '按 R 重新開始'
        });

        var onKey = function (e) {
            if (self._state !== 'over') return;
            if (e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                global.removeEventListener('keydown', onKey);
                self.restart();
            }
        };
        global.addEventListener('keydown', onKey);
    };

    // ======================================================================
    // 事件
    // ======================================================================
    Shell.prototype.on = function (name, fn) {
        (this._handlers[name] = this._handlers[name] || []).push(fn);
        return this;
    };

    Shell.prototype._emit = function (name, data) {
        var list = this._handlers[name];
        if (!list) return;
        for (var i = 0; i < list.length; i++) list[i](data);
    };

    /**
     * 重新開始的唯一入口。
     *
     * 疊層上的「再玩一次」「重新開始」按鈕與 R 鍵都必須走這裡，
     * 不能只做 hideOverlay() + _emit('restart')。
     * 因為 Shell.run 的 update 包裝層是 `if (_state === 'playing') update(dt)`，
     * 少了這裡的 _state 還原，畫面會繼續 render 但世界永遠不再更新——
     * 玩家按下重玩之後遊戲直接定格。
     */
    Shell.prototype.restart = function () {
        RE.juice.reset();
        RE.Input.reset();
        this.hideOverlay();
        this._state = 'playing';
        this._emit('restart');
    };

    // ======================================================================
    // 常用繪圖捷徑（把 shell 尺寸帶入，遊戲少寫幾個參數）
    // ======================================================================
    Shell.prototype.clear = function (color) {
        this.ctx.fillStyle = color || '#0a1410';
        this.ctx.fillRect(0, 0, this.width, this.height);
    };

    Shell.prototype.beginWorld = function () { RE.juice.applyCamera(this.ctx, this.width, this.height); };
    Shell.prototype.endWorld = function () { RE.juice.restoreCamera(this.ctx, this.width, this.height); };

    Shell.prototype.postFX = function (opt) {
        opt = opt || {};
        if (opt.scanlines !== false) RE.Draw.scanlines(this.ctx, this.width, this.height, opt.scanAlpha);
        if (opt.vignette !== false) RE.Draw.vignette(this.ctx, this.width, this.height, opt.vignetteStrength);
    };

    /** 建立主迴圈：自動處理暫停、疊層時不更新世界 */
    Shell.prototype.run = function (update, render) {
        var self = this;
        this.loop = new RE.Loop({
            update: function (dt) { if (self._state === 'playing') update(dt); },
            render: function (alpha) { render(alpha); }
        });
        this.loop.start();
        return this.loop;
    };

    // ======================================================================
    // 對外
    // ======================================================================
    global.RetroShell = {
        boot: function (cfg) {
            var s = new Shell(cfg);
            global.G = s;
            if (cfg.id && !cfg.hideBest && s._statEls.best) {
                s.setStat('best', RE.Save.bestScore(cfg.id));
            }
            return s;
        }
    };

})(window);
