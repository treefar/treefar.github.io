/* =========================================================
   opening.js — 20 張開場 CG 播放器
   圖像只使用 assets/cg 正式輸出；字幕與控制均由 HTML 渲染。
   ========================================================= */

const Opening = {
  seenKey: 'dungeonChef_opening_seen_v1',
  index: 0,
  timer: null,
  holdTimer: null,
  didHold: false,
  onComplete: null,
  markSeen: false,
  slides: [
    ['CG01_避難城最後一盞燈.png', '地底的火，已經快熄了。', 3800],
    ['CG02_空蕩市場.png', '糧倉見底，鍋裡只剩水。', 3800],
    ['CG03_最後一鍋湯.png', '但大廚不肯讓任何人餓著。', 3800],
    ['CG04_熄火的灶台.png', '要救活廚房，得找回真正的爐心。', 3800],
    ['CG05_案板下的鐵片.png', '線索，就藏在祖傳的案板下。', 3800],
    ['CG06_三層舊地圖.png', '地下三層，通往被封印的主廚房。', 3800],
    ['CG07_擦亮菜刀.png', '刀要準，火候更要準。', 3800],
    ['CG08_繫緊頭巾.png', '今晚，他要下地窖開灶。', 4500],
    ['CG09_裝滿空便當.png', '帶回來的每一份食材，都會變成力量。', 3800],
    ['CG10_居民讓路.png', '沒有人替他歡呼，只把路讓開。', 3800],
    ['CG11_封印鐵門.png', '門後，是幾十年沒人回來的地方。', 3800],
    ['CG12_第一把鎖落下.png', '喀。', 3800],
    ['CG13_升降梯下降.png', '越往下，空氣越像一口沒洗的鍋。', 3800],
    ['CG14_井底回望.png', '回頭，已經太遠。', 3800],
    ['CG15_儲糧地窖開門.png', '第一層：儲糧地窖。', 4500],
    ['CG16_會呼吸的糧袋.png', '這裡的食材，早就學會了呼吸。', 3800],
    ['CG17_香草與腳印.png', '能吃的，和想吃他的，都在前面。', 3800],
    ['CG18_黑暗裡的眼睛.png', '先看清血量，再下刀。', 3800],
    ['CG19_舉刀迎戰.png', '切得剛好，才是一流大廚。', 3800],
    ['CG20_地窖大廚標題底圖.png', '', 4500],
  ],

  hasSeen() {
    try { return localStorage.getItem(this.seenKey) === '1'; }
    catch (e) { return false; }
  },

  shouldAutoPlay() { return !this.hasSeen(); },

  setSeen() {
    try { localStorage.setItem(this.seenKey, '1'); } catch (e) { /* 私密模式忽略 */ }
  },

  init() {
    const overlay = Util.el('overlay-opening');
    const skip = Util.el('btn-opening-skip');
    overlay.addEventListener('click', (ev) => {
      if (ev.target.closest('#btn-opening-skip')) return;
      this.next();
    });
    const cancelHold = () => {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
      skip.classList.remove('holding');
    };
    skip.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.didHold = false;
      skip.classList.add('holding');
      this.holdTimer = setTimeout(() => {
        this.didHold = true;
        cancelHold();
        this.finish();
      }, 900);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
      skip.addEventListener(type, (ev) => { ev.stopPropagation(); cancelHold(); }));
    skip.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); });

    this.slides.forEach((slide) => {
      const preload = new Image();
      preload.src = `assets/cg/${slide[0]}`;
    });
  },

  play(onComplete, options = {}) {
    clearTimeout(this.timer);
    clearTimeout(this.holdTimer);
    this.index = 0;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;
    this.markSeen = options.markSeen === true;
    State.mode = 'opening';
    UI.hideAllOverlays();
    UI.show('overlay-opening');
    this.render();
  },

  replay() {
    this.play(() => Game.showTitle(), { markSeen: true });
  },

  render() {
    const slide = this.slides[this.index];
    const image = Util.el('opening-image');
    image.classList.remove('swap');
    image.src = `assets/cg/${slide[0]}`;
    image.alt = `開場序章 ${String(this.index + 1).padStart(2, '0')}`;
    void image.offsetWidth;
    image.classList.add('swap');
    Util.el('opening-caption').textContent = slide[1];
    Util.el('opening-caption').classList.toggle('empty', !slide[1]);
    Util.el('opening-counter').textContent = `${String(this.index + 1).padStart(2, '0')} / ${this.slides.length}`;
    Util.el('opening-progress').innerHTML = this.slides
      .map((_, i) => `<i class="${i === this.index ? 'current' : i < this.index ? 'seen' : ''}"></i>`)
      .join('');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.next(), slide[2]);
  },

  next() {
    if (State.mode !== 'opening') return;
    if (this.index + 1 >= this.slides.length) { this.finish(); return; }
    this.index += 1;
    this.render();
  },

  finish() {
    if (State.mode !== 'opening') return;
    clearTimeout(this.timer);
    clearTimeout(this.holdTimer);
    if (this.markSeen) this.setSeen();
    UI.hide('overlay-opening');
    const complete = this.onComplete;
    this.onComplete = null;
    if (complete) complete();
    else Game.showTitle();
  },
};
