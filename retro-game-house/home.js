/* ==========================================================================
   首頁渲染器：年代時間軸 + 可玩遊戲總覽（含年代篩選）
   內容全部來自 data/gamedb.js
   ========================================================================== */
(function () {
    'use strict';

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var st = GameDB.stats;

    // ---------- 統計數字 ----------
    document.getElementById('statDecades').textContent = st.decades;
    document.getElementById('statGames').textContent = st.games;
    document.getElementById('statPlayable').textContent = st.built;
    document.getElementById('statSpan').textContent = st.span;

    // ---------- 導覽列 ----------
    var navUl = document.getElementById('navList');
    GameDB.decades.forEach(function (d) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="decades/' + d.id + '.html">' + d.icon + ' ' + d.short.toUpperCase() + '</a>';
        navUl.appendChild(li);
    });

    // ---------- Hero 年代作品帶 ----------
    // 同一批年代橫幅在首頁提供可滑動入口。這是資訊架構上的重用，
    // 不列入「正式美術單元倍增」的數量，避免用重複曝光灌水。
    var eraStrip = document.getElementById('eraStrip');
    GameDB.decades.forEach(function (d) {
        var builtN = d.games.filter(function (g) { return g.built; }).length;
        var era = document.createElement('a');
        era.className = 'era-tile';
        era.href = 'decades/' + d.id + '.html';
        era.style.setProperty('--acc', d.color);
        era.innerHTML =
            '<img src="assets/banners/' + d.id + '.png" alt="" loading="eager" decoding="async">' +
            '<span class="era-tile-shade"></span>' +
            '<span class="era-tile-copy"><b>' + d.short.toUpperCase() + '</b>' +
            '<small>' + esc(d.title) + ' · ' + builtN + ' 款可玩</small></span>';
        eraStrip.appendChild(era);
    });

    // ---------- 年代卡片 ----------
    var dec = document.getElementById('decadeGrid');
    GameDB.decades.forEach(function (d) {
        var builtN = d.games.filter(function (g) { return g.built; }).length;
        var a = document.createElement('a');
        a.className = 'dcard';
        a.href = 'decades/' + d.id + '.html';
        a.style.setProperty('--acc', d.color);
        a.innerHTML =
            '<img class="dcard-banner" src="assets/banners/' + d.id + '.png" alt="" loading="lazy" decoding="async">' +
            '<div class="ghost">' + d.short.toUpperCase() + '</div>' +
            '<div class="icon">' + d.icon + '</div>' +
            '<div class="yrs">' + esc(d.years) + '</div>' +
            '<h3>' + esc(d.title) + '</h3>' +
            '<div class="head">' + esc(d.headline) + '</div>' +
            '<p class="body">' + esc(d.intro.slice(0, 96)) + '…</p>' +
            '<div class="meta">' +
                '<span><b>' + d.games.length + '</b> 代表作</span>' +
                '<span><b>' + builtN + '</b> 可玩復刻</span>' +
                '<span><b>' + d.timeline.length + '</b> 關鍵事件</span>' +
            '</div>' +
            '<div class="go">閱讀這個十年 →</div>';
        dec.appendChild(a);
    });

    // ---------- 跨年代設計演化線 ----------
    var pathwayGrid = document.getElementById('pathwayGrid');
    PathwayDB.all.forEach(function (pathway, index) {
        var card = document.createElement('a');
        card.className = 'pathway-card';
        card.href = '?path=' + encodeURIComponent(pathway.id) + '#games';
        card.style.setProperty('--path', pathway.color);
        card.innerHTML =
            '<span class="pathway-no">0' + (index + 1) + '</span>' +
            '<span class="pathway-icon">' + esc(pathway.icon) + '</span>' +
            '<h3>' + esc(pathway.title) + '</h3>' +
            '<p>' + esc(pathway.headline) + '</p>' +
            '<div class="pathway-foot"><b>' + pathway.slugs.length + ' 款</b><span>沿這條線遊玩 →</span></div>';
        pathwayGrid.appendChild(card);
    });

    // ---------- 遊戲總覽 ----------
    var grid = document.getElementById('gameGrid');
    var filterRow = document.getElementById('filterRow');
    var searchInput = document.getElementById('gameSearch');
    var clearFilter = document.getElementById('clearFilter');
    var params = new URLSearchParams(globalThis.location.search);
    var requestedEra = params.get('era') || 'all';
    var validEras = ['all'].concat(GameDB.decades.map(function (d) { return d.short; }));
    var current = validEras.indexOf(requestedEra) !== -1 ? requestedEra : 'all';
    var requestedPath = params.get('path') || 'all';
    var currentPath = requestedPath === 'all' || PathwayDB.get(requestedPath) ? requestedPath : 'all';
    var query = (params.get('q') || '').trim();
    searchInput.value = query;

    var filters = [{ key: 'all', label: '全部' }].concat(
        GameDB.decades.map(function (d) { return { key: d.short, label: d.icon + ' ' + d.years.split(' ')[0] + 's', color: d.color }; })
    );

    filters.forEach(function (f) {
        var b = document.createElement('button');
        b.className = 'chip' + (f.key === current ? ' on' : '');
        b.type = 'button';
        b.setAttribute('aria-pressed', f.key === current ? 'true' : 'false');
        b.textContent = f.label;
        b.onclick = function () {
            current = f.key;
            [].forEach.call(filterRow.children, function (c) {
                c.classList.remove('on');
                c.setAttribute('aria-pressed', 'false');
            });
            b.classList.add('on');
            b.setAttribute('aria-pressed', 'true');
            renderGames();
        };
        filterRow.appendChild(b);
    });

    function renderGames() {
        var needle = query.toLocaleLowerCase('zh-TW');
        var selectedPath = currentPath === 'all' ? null : PathwayDB.get(currentPath);
        var list = GameDB.allGames.filter(function (g) {
            if (!g.playable) return false;
            if (current !== 'all' && g.decade !== current) return false;
            if (selectedPath && selectedPath.slugs.indexOf(g.slug) === -1) return false;
            if (!needle) return true;
            var lesson = LessonDB.get(g.slug) || {};
            return [g.name, g.zh, g.remake, g.why, lesson.verb, lesson.mission].some(function (value) {
                return String(value || '').toLocaleLowerCase('zh-TW').indexOf(needle) !== -1;
            });
        });
        // 已建置的排在前面，讓玩家先看到能玩的
        list.sort(function (a, b) {
            if (a.built !== b.built) return a.built ? -1 : 1;
            return a.year - b.year;
        });

        grid.innerHTML = '';
        if (!list.length) {
            var empty = document.createElement('div');
            empty.className = 'empty-result';
            empty.innerHTML = '<b>找不到符合條件的遊戲</b><span>換一個關鍵字，或清除年代篩選再試一次。</span>';
            grid.appendChild(empty);
        }
        list.forEach(function (g) {
            var d = GameDB.byShort(g.decade);
            var lesson = LessonDB.get(g.slug) || {};
            var el;
            if (g.built) {
                el = document.createElement('a');
                el.className = 'gcard';
                el.href = 'games/' + g.decade + '/' + g.slug + '.html';
            } else {
                el = document.createElement('div');
                el.className = 'gcard locked';
            }
            el.innerHTML =
                /* 封面只有已建置的款有。製作中的款維持純文字卡，
                   不要放佔位圖——那會讓「還沒做」看起來像「做壞了」。
                   loading="lazy" 是必要的：首頁一次列 128 張卡，
                   全部立即載入會在手機上吃掉好幾秒。 */
                /* onerror 會把載不到的封面整個移除，卡片退回純文字樣式。
                   沒有這一行的話，新做好但還沒配封面的款會顯示成破圖——
                   而破圖看起來像「這一款壞了」，比沒有圖還糟。 */
                (g.built ? '<img class="cover" loading="lazy" decoding="async" alt="" ' +
                           'onerror="this.remove()" ' +
                           'src="assets/covers/' + g.slug + '.png">' : '') +
                '<div class="top">' +
                    '<span class="yr" style="color:' + d.color + '">' + g.year + '</span>' +
                    (g.built ? '<span class="badge play">▶ 可玩</span>'
                             : '<span class="badge soon">🛠 製作中</span>') +
                '</div>' +
                '<h3>' + esc(g.name) + '</h3>' +
                '<div class="zh" style="color:' + d.color + '">' + esc(g.zh) + '</div>' +
                (lesson.verb ? '<div class="core-verb" style="--verb:' + d.color + '">' +
                    '<span>核心動詞</span><p>' + esc(lesson.verb) + '</p></div>' : '') +
                '<p class="why">' + esc(g.why) + '</p>' +
                '<div class="foot">' +
                    '<span style="color:var(--h-muted)">' + esc(g.remake || g.zh) + '</span>' +
                    (g.built ? '<span style="color:' + d.color + ';font-weight:900">開始遊玩 →</span>' : '') +
                '</div>';
            grid.appendChild(el);
        });

        document.getElementById('gameCount').textContent =
            list.filter(function (g) { return g.built; }).length + ' 款可玩 · ' +
            list.filter(function (g) { return !g.built; }).length + ' 款製作中' +
            (selectedPath ? ' · 路徑：' + selectedPath.title : '');

        var pathContext = document.getElementById('pathContext');
        pathContext.hidden = !selectedPath;
        if (selectedPath) {
            pathContext.style.setProperty('--path', selectedPath.color);
            pathContext.innerHTML = '<span>' + esc(selectedPath.icon) + ' 本次學習線</span>' +
                '<b>' + esc(selectedPath.title) + '</b><p>' + esc(selectedPath.question) + '</p>';
        } else {
            pathContext.innerHTML = '';
        }

        var next = new URLSearchParams();
        if (current !== 'all') next.set('era', current);
        if (currentPath !== 'all') next.set('path', currentPath);
        if (query) next.set('q', query);
        /* replaceState 若在首次載入時硬加 #games，瀏覽器會把首頁直接捲到清單，
           使用者看不到主視覺。只有本來就在遊戲區時才保留錨點。 */
        var hash = globalThis.location.hash === '#games' ? '#games' : '';
        var nextUrl = globalThis.location.pathname + (next.toString() ? '?' + next.toString() : '') + hash;
        globalThis.history.replaceState(null, '', nextUrl);
        clearFilter.hidden = current === 'all' && currentPath === 'all' && !query;
    }

    searchInput.addEventListener('input', function () {
        query = searchInput.value.trim();
        renderGames();
    });

    clearFilter.addEventListener('click', function () {
        current = 'all';
        currentPath = 'all';
        query = '';
        searchInput.value = '';
        [].forEach.call(filterRow.children, function (c, index) {
            var on = index === 0;
            c.classList.toggle('on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderGames();
        searchInput.focus();
    });

    renderGames();

    // ---------- Hero 背景像素方塊 ----------
    var hero = document.querySelector('.hero');
    var colors = GameDB.decades.map(function (d) { return d.color; });
    var seed = 24197;
    function seeded() {
        seed = (seed * 48271) % 2147483647;
        return seed / 2147483647;
    }
    for (var i = 0; i < 26; i++) {
        var px = document.createElement('div');
        px.className = 'px';
        var size = 6 + Math.floor(seeded() * 16);
        px.style.width = size + 'px';
        px.style.height = size + 'px';
        px.style.left = (seeded() * 100) + '%';
        px.style.top = (seeded() * 100) + '%';
        px.style.background = colors[i % colors.length];
        px.style.transform = 'rotate(' + (seeded() * 40 - 20) + 'deg)';
        hero.appendChild(px);
    }
})();
