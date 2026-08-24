/* ==========================================================================
   年代介紹頁渲染器
   由 <body data-decade="1980s"> 決定要渲染哪一個十年，
   內容全數來自 data/gamedb.js，六個頁面共用同一份邏輯。
   ========================================================================== */
(function () {
    'use strict';

    var id = document.body.getAttribute('data-decade');
    var D = GameDB.byId(id);
    if (!D) { document.body.innerHTML = '<p style="padding:40px">找不到年代資料：' + id + '</p>'; return; }

    var idx = GameDB.decades.indexOf(D);
    var prev = GameDB.decades[idx - 1];
    var next = GameDB.decades[idx + 1];

    document.title = '遊戲時光屋 ✦ ' + D.years + '　' + D.title;
    document.documentElement.style.setProperty('--d-accent', D.color);
    document.documentElement.style.setProperty('--d-accent-dk', D.colorDark);

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /** 把資料裡的 **粗體** 轉成 <strong>，讓內容可以帶重點標記 */
    function md(s) {
        return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    var H = [];

    // ---------- 無障礙跳轉與閱讀進度 ----------
    H.push('<a class="d-skip" href="#pillars">跳到年代重點</a>');
    H.push('<div class="d-progress" aria-hidden="true"><span id="readingProgress"></span></div>');

    // ---------- 導覽列 ----------
    H.push('<div class="d-nav"><div class="wrap">');
    H.push('<a class="home" href="../index.html">✦ 遊戲時光屋</a>');
    H.push('<ul>');
    GameDB.decades.forEach(function (d) {
        H.push('<li><a href="' + d.id + '.html" class="' + (d.id === D.id ? 'on' : '') + '">' +
               d.icon + ' ' + d.short.toUpperCase() + '</a></li>');
    });
    H.push('</ul></div></div>');

    // ---------- Hero ----------
    var playableCount = D.games.filter(function (g) { return g.built; }).length;
    H.push('<header class="d-hero">');
    /* 年代橫幅。美術交付的六張是「左邊三分之一有畫、右邊留白」的構圖，
       所以貼成背景、靠左對齊，右側的空白正好讓標題文字壓上去而不打架。
       用 <img> 而不是 CSS background 有兩個理由：
         1. loading="lazy" 與 decoding="async" 只有 <img> 吃得到；
         2. 圖檔萬一缺了，<img> 會靜靜留白，而 background 會露出半截漸層。 */
    H.push('<img class="d-banner" src="../assets/banners/' + D.id + '.png" ' +
           'alt="" loading="lazy" decoding="async" ' +
           'onerror="this.remove()">');
    H.push('<div class="ghost-year">' + D.short.toUpperCase() + '</div>');
    H.push('<div class="wrap">');
    H.push('<div class="eyebrow">' + esc(D.subtitle) + '</div>');
    H.push('<h1>' + D.icon + ' ' + esc(D.title) + '</h1>');
    H.push('<div class="years">' + esc(D.years) + '</div>');
    H.push('<p class="headline">' + esc(D.headline) + '</p>');
    H.push('<p class="intro">' + md(D.intro) + '</p>');
    H.push('<div class="quickstats">');
    H.push('<div><b>' + D.games.length + '</b><span>代表作收錄</span></div>');
    H.push('<div><b>' + playableCount + '</b><span>可玩復刻</span></div>');
    H.push('<div><b>' + D.timeline.length + '</b><span>關鍵事件</span></div>');
    H.push('<div><b>' + D.pillars.length + '</b><span>發展重點</span></div>');
    H.push('</div>');
    H.push('</div></header>');

    // ---------- 章節導覽 ----------
    // 桌機維持右側 sticky 目錄；窄螢幕退成橫向滑動列，不遮住正文。
    H.push('<nav class="d-toc" aria-label="本年代章節">');
    [
        ['pillars', '01 發展重點'],
        ['tech', '02 技術條件'],
        ['timeline', '03 關鍵事件'],
        ['lesson', '04 設計課視角'],
        ['play', '05 可玩復刻'],
        ['archive', '06 圖鑑']
    ].forEach(function (item) {
        H.push('<a href="#' + item[0] + '" data-target="' + item[0] + '">' + item[1] + '</a>');
    });
    H.push('</nav>');

    // ---------- 發展重點 ----------
    H.push('<section id="pillars"><div class="wrap">');
    H.push('<div class="sec-head"><span class="num">01 / 發展重點</span>' +
           '<h2>這十年，遊戲產生了什麼變化</h2>' +
           '<p>從硬體條件、商業模式、設計方法到文化位置，四個面向理解這個階段。</p></div>');
    H.push('<div class="pillars">');
    D.pillars.forEach(function (p) {
        H.push('<article class="pillar"><span class="ico">' + p.icon + '</span>' +
               '<h3>' + esc(p.title) + '</h3><p>' + md(p.text) + '</p></article>');
    });
    H.push('</div></div></section>');

    // ---------- 硬體規格 ----------
    H.push('<section id="tech"><div class="wrap">');
    H.push('<div class="sec-head"><span class="num">02 / 技術條件</span>' +
           '<h2>當時的機器能做到什麼</h2>' +
           '<p>設計永遠是在限制中進行的。先看清楚限制，才看得懂那些設計為什麼長成那樣。</p></div>');
    H.push('<div class="spec-box">');
    H.push('<div class="spec-table"><h3>' + esc(D.tech.title) + '</h3><dl>');
    D.tech.specs.forEach(function (s) {
        H.push('<dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd>');
    });
    H.push('</dl></div>');
    H.push('<div class="spec-note"><b>為什麼這很重要</b>' + md(D.tech.note) + '</div>');
    H.push('</div></div></section>');

    // ---------- 年表 ----------
    H.push('<section id="timeline"><div class="wrap">');
    H.push('<div class="sec-head"><span class="num">03 / 年表</span>' +
           '<h2>關鍵事件</h2></div>');
    H.push('<div class="timeline">');
    D.timeline.forEach(function (t) {
        H.push('<div class="tl-item"><div class="tl-head">' +
               '<span class="tl-year">' + t.year + '</span>' +
               '<span class="tl-title">' + esc(t.title) + '</span>' +
               '<span class="tl-tag">' + esc(t.tag) + '</span></div>' +
               '<p>' + md(t.text) + '</p></div>');
    });
    H.push('</div></div></section>');

    // ---------- 設計課視角 ----------
    H.push('<section id="lesson"><div class="wrap">');
    H.push('<div class="sec-head"><span class="num">04 / 設計課視角</span>' +
           '<h2>從這個年代學到的設計原則</h2></div>');
    H.push('<div class="lesson"><span class="tag">課堂重點</span>' +
           '<h3>' + esc(D.lesson.title) + '</h3><p>' + md(D.lesson.text) + '</p></div>');
    H.push('</div></section>');

    // ---------- 可玩復刻 ----------
    var built = D.games.filter(function (g) { return g.built; });
    var pending = D.games.filter(function (g) { return g.playable && !g.built; });
    var archives = D.games.filter(function (g) { return !g.playable; });

    H.push('<section id="play"><div class="wrap">');
    H.push('<div class="sec-head"><span class="num">05 / 可玩復刻</span>' +
           '<h2>🎮 動手玩玩看（' + built.length + ' 款）</h2>' +
           '<p>先讀卡片上的核心動詞，再進遊戲完成指定任務；' +
           '支援鍵盤、觸控與遊戲手把。</p></div>');
    H.push('<div class="game-grid">');
    built.forEach(function (g) {
        var lesson = LessonDB.get(g.slug) || {};
        H.push('<a class="gcard" href="../games/' + g.decade + '/' + g.slug + '.html">' +
               /* 封面載不到就整個移掉，卡片退回純文字。破圖看起來像「這款壞了」。 */
               '<img class="cover" loading="lazy" decoding="async" alt="" ' +
               'onerror="this.remove()" ' +
               'src="../assets/covers/' + g.slug + '.png">' +
               '<div class="top"><span class="yr">' + g.year + '</span>' +
               '<span class="badge play">▶ 可玩</span></div>' +
               '<h3>' + esc(g.name) + '</h3>' +
               '<div class="zh">' + esc(g.zh) + '</div>' +
               (lesson.verb ? '<div class="core-verb"><span>核心動詞</span><p>' +
               esc(lesson.verb) + '</p></div>' : '') +
               '<p class="why">' + md(g.why) + '</p>' +
               '<div class="foot">' +
               '<span class="remake-name">本站復刻：<b>' + esc(g.remake || g.zh) + '</b></span>' +
               '<span class="play-cta">開始遊玩 →</span>' +
               '</div></a>');
    });
    if (!built.length) {
        H.push('<p style="color:var(--d-muted)">這個年代的可玩復刻仍在製作中。</p>');
    }
    H.push('</div>');

    // 已規劃但尚未完成的復刻：明確標示，不做成會 404 的連結
    if (pending.length) {
        H.push('<div class="sec-head" style="margin-top:38px">' +
               '<h2 style="font-size:1.15rem">🛠 製作中（' + pending.length + ' 款）</h2>' +
               '<p>已完成企劃與史料，可玩版本尚未建置完成。目前點擊不會開啟遊戲。</p></div>');
        H.push('<div class="game-grid">');
        pending.forEach(function (g) {
            H.push('<div class="gcard locked">' +
                   '<div class="top"><span class="yr">' + g.year + '</span>' +
                   '<span class="badge info">🛠 製作中</span></div>' +
                   '<h3>' + esc(g.name) + '</h3>' +
                   '<div class="zh">' + esc(g.zh) + '</div>' +
                   '<p class="why">' + md(g.why) + '</p>' +
                   '<div class="foot"><span class="remake-name">預定復刻：<b>' +
                   esc(g.remake || g.zh) + '</b></span></div></div>');
        });
        H.push('</div>');
    }
    H.push('</div></section>');

    // ---------- 圖鑑 ----------
    if (archives.length) {
        H.push('<section id="archive"><div class="wrap">');
        H.push('<div class="sec-head"><span class="num">06 / 圖鑑</span>' +
               '<h2>📚 同時期必須認識的作品（' + archives.length + ' 款）</h2>' +
               '<p>這些作品因為篇幅或技術規模未做成可玩版本，但在遊戲史上的地位無法略過。</p></div>');
        H.push('<div class="game-grid">');
        archives.forEach(function (g) {
            H.push('<div class="gcard locked">' +
                   '<div class="top"><span class="yr">' + g.year + '</span>' +
                   '<span class="badge info">圖鑑</span></div>' +
                   '<h3>' + esc(g.name) + '</h3>' +
                   '<div class="zh">' + esc(g.zh) + '</div>' +
                   '<p class="why">' + md(g.why) + '</p>' +
                   '<div class="foot"><span>' + esc(g.dev) + '</span><span>' + esc(g.platform) + '</span></div>' +
                   '</div>');
        });
        H.push('</div></div></section>');
    }

    // ---------- 前後年代 ----------
    H.push('<div class="wrap"><nav class="d-pager">');
    if (prev) {
        H.push('<a href="' + prev.id + '.html"><span class="dir">◀ 上一個十年</span>' +
               '<span class="nm">' + prev.icon + ' ' + esc(prev.years.split(' ')[0]) + ' 年代・' + esc(prev.title) + '</span></a>');
    } else {
        H.push('<a class="empty"></a>');
    }
    if (next) {
        H.push('<a class="next" href="' + next.id + '.html"><span class="dir">下一個十年 ▶</span>' +
               '<span class="nm">' + next.icon + ' ' + esc(next.years.split(' ')[0]) + ' 年代・' + esc(next.title) + '</span></a>');
    } else {
        H.push('<a class="empty"></a>');
    }
    H.push('</nav></div>');

    // ---------- 頁尾 ----------
    H.push('<footer><div class="wrap">');
    H.push('<p>遊戲時光屋 ✦ 電子遊戲發展史互動教材　|　' +
           '<a href="../index.html">回到首頁</a></p>');
    H.push('<p style="font-size:0.78rem;opacity:0.75;margin-top:8px">' +
           '本站所有可玩遊戲皆為致敬式原創復刻，角色造型、名稱與美術為本站自製，' +
           '僅參考原作的核心玩法機制，供教學與研究討論使用。<br>' +
           '文中提及之遊戲名稱、商標與著作權均歸各自權利人所有。</p>');
    H.push('</div></footer>');

    document.body.insertAdjacentHTML('beforeend', H.join(''));

    // 移除本頁不存在的章節（目前只有部分年代有圖鑑）。
    [].slice.call(document.querySelectorAll('.d-toc a')).forEach(function (link) {
        if (!document.getElementById(link.getAttribute('data-target'))) link.remove();
    });

    // 閱讀進度只使用捲動位置，不依賴內容高度的預估。
    var progress = document.getElementById('readingProgress');
    function updateProgress() {
        var root = document.documentElement;
        var total = Math.max(1, root.scrollHeight - root.clientHeight);
        progress.style.width = Math.min(100, Math.max(0, root.scrollTop / total * 100)) + '%';
    }
    globalThis.addEventListener('scroll', updateProgress, { passive: true });
    globalThis.addEventListener('resize', updateProgress);
    updateProgress();

    // 捲動時高亮當前區塊（輕量版 scrollspy）
    var sections = [].slice.call(document.querySelectorAll('section[id]'));
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.classList.add('in-view');
                [].slice.call(document.querySelectorAll('.d-toc a')).forEach(function (link) {
                    var active = link.getAttribute('data-target') === e.target.id;
                    link.classList.toggle('on', active);
                    if (active) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
        sections.forEach(function (s) { obs.observe(s); });
    }
})();
