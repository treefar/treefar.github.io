/* ==========================================================================
   遊戲時光屋 · 遊戲史資料庫
   --------------------------------------------------------------------------
   以「每十年為一階段」組織電子遊戲發展史，供年代介紹頁與首頁動態產生內容。
   每個年代包含：
     pillars   — 該階段四大發展重點（硬體 / 商業 / 設計 / 文化）
     tech      — 代表性硬體規格，讓學生具體感受技術限制
     timeline  — 關鍵年表事件
     lesson    — 設計理論解讀（對應遊戲設計課程）
     games     — 代表作清單，playable:true 者有本站自製的致敬式復刻可玩

   註：復刻遊戲一律為原創角色與美術，僅參考原作核心機制，供教學討論使用。
   ========================================================================== */
(function (global) {
    'use strict';

    var DECADES = [

    // ======================================================================
    // 1970s
    // ======================================================================
    {
        id: '1970s', short: '70s', years: '1971 – 1979',
        title: '街機誕生與家用主機第一世代',
        subtitle: 'The Birth of an Industry',
        color: '#7dd3fc',
        colorDark: '#0c4a6e',
        icon: '🕹️',
        headline: '遊戲從實驗室走進酒吧，成為一門生意。',
        intro:
            '1970 年代之前，電子遊戲只存在於大學與研究機構的示波器和大型主機上。' +
            '這十年最關鍵的事件，是有人把它裝進投幣機殼、推進酒吧和保齡球館——遊戲第一次成為「商品」。' +
            '硬體極度貧乏：早期街機甚至沒有 CPU，遊戲規則直接焊死在電路板上；' +
            '螢幕上只有幾個白色方塊，聲音只有嗶嗶聲。' +
            '正因為什麼都沒有，這十年逼出了電子遊戲最純粹的設計思考——' +
            '如何只用「一顆球、兩片板子」就讓人願意投下硬幣。',

        pillars: [
            {
                icon: '🔌', title: '從離散電路到微處理器',
                text: '1972 年的《Pong》完全由 TTL 邏輯閘組成，沒有程式碼、沒有 CPU，' +
                      '規則就是電路本身。1975 年 Taito 的《Gun Fight》首度採用 Intel 8080 微處理器，' +
                      '遊戲邏輯終於變成「可以改寫的軟體」。這個轉折決定了往後所有事：' +
                      '遊戲從此是被寫出來的，不是被焊出來的。'
            },
            {
                icon: '🪙', title: '投幣制定義了關卡與難度',
                text: '街機的商業模式是「每局最多三分鐘」，因為機台要靠翻桌率賺錢。' +
                      '這直接催生了兩個延續至今的設計慣例：難度會無限遞增直到玩家死亡，' +
                      '以及用高分榜（《Space Invaders》在 1978 年讓分數追逐大規模普及）取代「通關」作為目標。' +
                      '現代手遊的無盡模式與排行榜，血緣就在這裡。'
            },
            {
                icon: '📺', title: '家用主機的第一次嘗試',
                text: '1972 年 Ralph Baer 的 Magnavox Odyssey 常被認定為第一台商用家用主機，' +
                      '甚至需要貼塑膠片在電視上當背景。1976 年 Fairchild Channel F 率先把 ROM 可更換卡匣帶進商用家機，' +
                      '1977 年 Atari VCS（2600）把這個模式推向普及——' +
                      '主機賣硬體、軟體另外賣的商業結構就此成形。'
            },
            {
                icon: '⚡', title: '向量顯示與彩色光柵的分岔',
                text: '《Asteroids》(1979) 用向量顯示畫出銳利的白色線條，是一條後來消失的技術路線；' +
                      '同年 Namco 的《Galaxian》改用 RGB 彩色光柵與硬體精靈（sprite），' +
                      '成為往後二十年 2D 遊戲的技術主流。' +
                      '一條路死了，另一條路成為八〇年代所有經典的基礎。'
            }
        ],

        tech: {
            title: 'Atari VCS (2600) · 1977',
            specs: [
                ['CPU', 'MOS 6507 @ 1.19 MHz'],
                ['RAM', '128 位元組（不是 KB，是 Bytes）'],
                ['卡匣容量', '2 – 4 KB'],
                ['解析度', '160 × 192'],
                ['同屏顏色', '最多 4 色'],
                ['音源', '2 聲道 TIA，音準不準'],
            ],
            note: '128 位元組的記憶體，連一則簡訊都存不下。當時程式設計師必須「隨著電子束一起跑」，' +
                  '一行一行即時算出畫面內容——這種技巧叫 racing the beam，是遊戲史上最極端的最佳化。'
        },

        timeline: [
            { year: 1971, title: '《Computer Space》問世', text: 'Nolan Bushnell 與 Ted Dabney 打造被廣泛認定為第一款商用投幣式電子遊戲的作品。因操作太複雜而商業表現有限，卻證明了市場存在。', tag: '里程碑' },
            { year: 1972, title: 'Magnavox Odyssey 與 Atari 成立', text: 'Ralph Baer 的家用主機上市；同年 Bushnell 創立 Atari，推出《Pong》。街機版《Pong》大獲成功，正式開啟產業。', tag: '里程碑' },
            { year: 1975, title: '《Gun Fight》改用微處理器', text: 'Taito／Midway 首度以 Intel 8080 驅動街機，遊戲邏輯從硬體轉為軟體。', tag: '技術' },
            { year: 1976, title: '《Death Race》引發早期暴力爭議', text: '媒體抨擊遊戲鼓勵撞人，成為早期廣受報導的電子遊戲暴力爭議，也預告了日後的分級討論。', tag: '文化' },
            { year: 1977, title: 'Atari VCS 上市', text: '卡匣式家用主機普及化，「主機 + 軟體」的商業模式確立。', tag: '商業' },
            { year: 1978, title: '《Space Invaders》席捲日本', text: '西角友宏設計。分數追逐與「敵人越少跑越快」的加速壓迫感，讓無盡得分型街機設計大規模普及。', tag: '設計' },
            { year: 1979, title: '《Asteroids》與《Galaxian》', text: '向量顯示的巔峰，與彩色光柵精靈技術的起點，同年登場。', tag: '技術' },
            { year: 1979, title: 'Activision 成立', text: '四名 Atari 程式設計師因不被署名而出走，建立早期獨立家機軟體商的代表模式，也讓開發者署名成為產業議題。', tag: '產業' }
        ],

        lesson: {
            title: '設計課視角：極簡規則如何產生深度',
            text: '《Pong》只有一條規則：把球擋回去。但球的反彈角度取決於擊中板子的哪個位置——' +
                  '這一個設計決策，把「反射動作」變成了「有意圖的瞄準」，讓兩人對戰產生策略。' +
                  '這是 MDA 框架最乾淨的示範：極簡的機制（Mechanics）產生豐富的動態（Dynamics），' +
                  '再產生競爭的美感（Aesthetics）。當你設計遊戲卡關時，回頭想想 Pong：' +
                  '你的核心動詞，有沒有一個可以讓玩家「操作得更好」的細節？'
        },

        games: [
            { slug: 'pong', name: 'Pong', zh: '乒乓', year: 1972, dev: 'Atari', platform: '大型街機', genre: '運動／對戰',
              playable: true, remake: '像素乒乓對決',
              why: '電子遊戲產業的起點。擊球點決定反彈角度的設計，讓最單純的規則長出策略深度。' },
            { slug: 'space_invaders', name: 'Space Invaders', zh: '太空侵略者', year: 1978, dev: 'Taito', platform: '大型街機', genre: '固定射擊',
              playable: true, remake: '星塵防衛軍',
              why: '把高分追逐與遞增難度推向大眾。敵人變少時的加速源自運算負載變化，卻成為經典的壓迫感設計。' },
            { slug: 'breakout', name: 'Breakout', zh: '打磚塊', year: 1976, dev: 'Atari', platform: '大型街機', genre: '動作／反射',
              playable: true, remake: '魔法碎磚塔',
              why: '把 Pong 改成單人對牆，證明「同一套機制換個框架就是新遊戲」。Steve Wozniak 參與原型設計。' },
            { slug: 'asteroids', name: 'Asteroids', zh: '小行星', year: 1979, dev: 'Atari', platform: '大型街機', genre: '多向射擊',
              playable: true, remake: '隕石迴旋',
              why: '慣性物理讓操作有重量，畫面環繞（wrap-around）創造無邊界空間，向量顯示的美學巔峰。' },
            { slug: 'galaxian', name: 'Galaxian', zh: '小蜜蜂', year: 1979, dev: 'Namco', platform: '大型街機', genre: '固定射擊',
              playable: true, remake: '蜂群突擊',
              why: '以 RGB 多色光柵與硬體精靈呈現鮮明編隊。敵機會脫離隊形俯衝，把靜態靶場變成動態威脅。' },
            { slug: 'lunar_lander', name: 'Lunar Lander', zh: '登月小艇', year: 1979, dev: 'Atari', platform: '大型街機', genre: '模擬／技巧',
              playable: true, remake: '月面著陸計畫',
              why: '把推力、燃料、重力與著陸角度直接做成核心樂趣，是早期物理模擬設計的重要里程碑。' },
            { slug: 'blockade', name: 'Blockade', zh: '光影機車', year: 1976, dev: 'Gremlin', platform: '大型街機', genre: '策略／對戰',
              playable: true, remake: '光跡封鎖戰',
              why: '貪食蛇與《創：光速戰記》光輪機車的共同祖先。「你走過的路變成牆」是極優雅的機制。' },
            { slug: 'tank_combat', name: 'Combat', zh: '坦克大戰', year: 1977, dev: 'Atari', platform: 'Atari 2600', genre: '對戰射擊',
              playable: true, remake: '鋼鐵對峙',
              why: 'Atari 2600 的隨機同捆遊戲，是無數人的第一款家用遊戲。牆面跳彈把射擊變成幾何謎題。' },

            { slug: 'computer_space', name: 'Computer Space', zh: '電腦空間', year: 1971, dev: 'Nutting Associates', platform: '大型街機', genre: '射擊',
              playable: false, why: '常被認定為第一款商用投幣式電子遊戲。複雜操作與有限表現，反而凸顯「易上手」的重要性。' },
            { slug: 'odyssey', name: 'Magnavox Odyssey', zh: '奧德賽主機', year: 1972, dev: 'Magnavox', platform: '家用主機', genre: '主機',
              playable: false, why: '常被認定為第一台商用家用主機。無法顯示分數與顏色，需貼塑膠片在電視上模擬背景。' },
            { slug: 'gun_fight', name: 'Gun Fight', zh: '西部槍戰', year: 1975, dev: 'Taito / Midway', platform: '大型街機', genre: '對戰射擊',
              playable: false, why: '首款使用微處理器的街機遊戲，讓遊戲邏輯正式成為「可改寫的軟體」。' },
            { slug: 'night_driver', name: 'Night Driver', zh: '夜間駕駛', year: 1976, dev: 'Atari', platform: '大型街機', genre: '競速',
              playable: false, why: '最早的第一人稱視角遊戲之一。用夜晚黑幕巧妙掩蓋硬體畫不出背景的限制。' },
            { slug: 'adventure_2600', name: 'Adventure', zh: '冒險', year: 1980, dev: 'Atari', platform: 'Atari 2600', genre: '動作冒險',
              playable: false, why: '早期動作冒險的重要範本，也以 Warren Robinett 隱藏署名成為遊戲彩蛋史的代表案例。' },
            { slug: 'football', name: 'Atari Football', zh: '美式足球', year: 1978, dev: 'Atari', platform: '大型街機', genre: '運動',
              playable: false, why: '首款使用軌跡球的街機，也是最早的多人團隊運動遊戲之一。' }
        ]
    },

    // ======================================================================
    // 1980s
    // ======================================================================
    {
        id: '1980s', short: '80s', years: '1980 – 1989',
        title: '街機黃金期、產業崩盤與任天堂復興',
        subtitle: 'Golden Age, Crash & Revival',
        color: '#ffd166',
        colorDark: '#78350f',
        icon: '👾',
        headline: '角色誕生了，遊戲從「玩機制」變成「玩世界」。',
        intro:
            '八〇年代前半是街機的黃金期：《Pac-Man》讓遊戲第一次有了可以印在鉛筆盒上的「角色」，' +
            '《Donkey Kong》則第一次在遊戲開頭放了劇情。' +
            '但 1983 年北美市場因劣質軟體氾濫而崩盤，遊戲差點被視為過氣玩具。' +
            '救回這個產業的是 1985 年任天堂帶著《Super Mario Bros.》進軍北美——' +
            '它用嚴格的品質管制重建信任，也用一款遊戲定義了往後三十年的平台跳躍規則。' +
            '這十年也誕生了 JRPG（《Dragon Quest》）、格鬥（《Street Fighter》）、' +
            '掌機（Game Boy）與《Tetris》這種跨越所有文化的抽象傑作。',

        pillars: [
            {
                icon: '🎭', title: '角色成為遊戲的門面',
                text: '岩谷徹設計《Pac-Man》時刻意避開當時清一色的太空射擊，' +
                      '做出一款「女生也會想玩」的可愛遊戲。結果 Pac-Man 成為第一個電子遊戲文化符號——' +
                      '上了電視卡通、變成周邊商品。從此遊戲公司賣的不只是玩法，還有 IP。'
            },
            {
                icon: '💥', title: '1983 年北美遊戲業大崩盤',
                text: 'Atari 時代任何人都能出卡匣，市場被劣質品淹沒；' +
                      '《E.T.》倉促開發三十七天、大量滯銷被埋進新墨西哥州掩埋場，成為崩盤的象徵。' +
                      '北美家用遊戲營收兩年內萎縮約 97%。這場崩盤的教訓——' +
                      '**平台方必須為品質負責**——直接催生了任天堂的權利金與認證制度。'
            },
            {
                icon: '🍄', title: '關卡設計成為一門學問',
                text: '《Super Mario Bros.》的 1-1 是遊戲史上最著名的教學設計：' +
                      '沒有一行文字，卻用場景配置教會玩家跳躍、踩敵人、頂問號磚、吃蘑菇。' +
                      '玩家往右走遇到第一隻栗寶寶時，必然學會跳躍——因為關卡不給你別的選擇。' +
                      '這種「用空間說話」的引導手法，至今仍是關卡設計課的第一堂課。'
            },
            {
                icon: '💾', title: '存檔、掌機與規模的解放',
                text: '1986 年《The Legend of Zelda》卡匣內建電池備份記憶體，' +
                      '玩家第一次可以「明天再繼續」——遊戲從此能長達數十小時，' +
                      '開放探索與 RPG 才有可能存在。1989 年 Game Boy 搭配《Tetris》，' +
                      '把遊戲從客廳帶到通勤路上，開啟了「零碎時間」這個全新市場。'
            }
        ],

        tech: {
            title: 'Nintendo Famicom / NES · 1983',
            specs: [
                ['CPU', 'Ricoh 2A03（6502 核心）@ 1.79 MHz'],
                ['RAM', '2 KB 主記憶體 + 2 KB 顯示記憶體'],
                ['卡匣容量', '典型 32 KB – 512 KB'],
                ['解析度', '256 × 240'],
                ['同屏顏色', '25 色（調色盤 54 色）'],
                ['精靈上限', '同一掃描線最多 8 個']
            ],
            note: '「同一水平線最多 8 個精靈」這條限制，正是為什麼 FC 遊戲的敵人常常閃爍——' +
                  '超過的精靈只能輪流顯示。許多經典的敵人配置，其實是在跟硬體限制談判的結果。'
        },

        timeline: [
            { year: 1980, title: '《Pac-Man》上市', text: '岩谷徹設計。四隻鬼各有不同追擊 AI 個性（追擊、埋伏、隨機、迴避），是最早的角色化敵人行為設計。', tag: '設計' },
            { year: 1981, title: '《Donkey Kong》與宮本茂', text: '首款有開場劇情的街機遊戲，Mario 的原型「Jumpman」登場。跳躍第一次成為核心動詞。', tag: '里程碑' },
            { year: 1982, title: '《Pitfall!》與家用遊戲的成熟', text: 'Activision 用 4KB 卡匣做出 255 個畫面的叢林冒險，展示程序生成的早期威力。', tag: '技術' },
            { year: 1983, title: '北美遊戲業大崩盤', text: '劣質卡匣氾濫與零售信心崩潰，北美家用遊戲市場兩年內萎縮約 97%。', tag: '產業' },
            { year: 1983, title: '任天堂 Famicom 在日本上市', text: '主打高性能與嚴選軟體，兩年內成為日本主流。', tag: '里程碑' },
            { year: 1984, title: '《Tetris》誕生於莫斯科', text: 'Alexey Pajitnov 在蘇聯科學院用 Electronika 60 寫出。無主題、無角色、無結局，純粹規則的完美體。', tag: '設計' },
            { year: 1985, title: '《Super Mario Bros.》拯救北美市場', text: '橫向捲軸關卡設計的典範，NES 隨機同捆，重建了零售商與家長對遊戲的信心。', tag: '里程碑' },
            { year: 1986, title: '《薩爾達傳說》與《勇者鬥惡龍》', text: '前者以電池存檔實現開放探索，後者確立 JRPG 的指令戰鬥與成長曲線範式。', tag: '設計' },
            { year: 1987, title: '《Final Fantasy》與《快打旋風》初代', text: 'JRPG 雙雄成形；格鬥遊戲的指令輸入概念首度出現。', tag: '類型' },
            { year: 1989, title: 'Game Boy 上市，同捆《Tetris》', text: '單色小螢幕、續航十數小時。用一款抽象益智遊戲，把電子遊戲賣給了完全不玩遊戲的成年人。', tag: '商業' }
        ],

        lesson: {
            title: '設計課視角：《超級瑪利歐兄弟》1-1 的無字教學',
            text: '關卡開始時，玩家在畫面左側，右邊是大片空地——空間本身在說「往右走」。' +
                  '第一個敵人栗寶寶緩慢逼近，玩家唯一的解法是跳；跳的落點正下方是問號磚，' +
                  '於是玩家「不小心」學會頂磚；蘑菇彈出來後會朝玩家方向滾回來，' +
                  '確保你即使想閃也閃不掉，被迫學會「吃蘑菇會變大」。' +
                  '整段沒有任何文字提示，卻完成了四項教學。' +
                  '這就是關卡設計的核心工作：**不要教玩家，讓關卡逼玩家自己發現。**'
        },

        games: [
            { slug: 'pacman', name: 'Pac-Man', zh: '小精靈', year: 1980, dev: 'Namco', platform: '大型街機', genre: '迷宮追逐',
              playable: true, remake: '幽靈迷宮',
              why: '四隻鬼各有獨立追逐規則，讓追逐產生節奏變化；Pac-Man 也成為早期跨媒體遊戲文化偶像。' },
            { slug: 'donkey_kong', name: 'Donkey Kong', zh: '大金剛', year: 1981, dev: 'Nintendo', platform: '大型街機', genre: '平台跳躍',
              playable: true, remake: '鋼骨塔攀登',
              why: '宮本茂首作。開場動畫、四種關卡變化、跳躍成為核心動詞，平台遊戲從這裡開始。' },
            { slug: 'frogger', name: 'Frogger', zh: '青蛙過河', year: 1981, dev: 'Konami', platform: '大型街機', genre: '動作／時機',
              playable: true, remake: '溪流跳躍者',
              why: '把「等待正確時機」變成核心樂趣。多層節奏不同的移動車道，是節奏設計的教科書。' },
            { slug: 'centipede', name: 'Centipede', zh: '蜈蚣大戰', year: 1981, dev: 'Atari', platform: '大型街機', genre: '固定射擊',
              playable: true, remake: '菌森毒蜈蚣',
              why: 'Dona Bailey 是當時業界極少數女性程式設計師之一。蘑菇場地會被玩家自己改變，創造動態戰場。' },
            { slug: 'dig_dug', name: 'Dig Dug', zh: '打氣人', year: 1982, dev: 'Namco', platform: '大型街機', genre: '挖掘動作',
              playable: true, remake: '地底鑽掘隊',
              why: '玩家挖出的通道就是關卡本身。打氣爆敵與落石壓殺兩套解法，鼓勵風格化玩法。' },
            { slug: 'tetris', name: 'Tetris', zh: '俄羅斯方塊', year: 1984, dev: 'Alexey Pajitnov', platform: 'Electronika 60 / 多平台', genre: '落下式益智',
              playable: true, remake: '方塊迴旋',
              why: '沒有主題、角色或結局，純粹規則就足以永恆。心理學上的「蔡氏效應」讓人停不下來。' },
            { slug: 'super_mario', name: 'Super Mario Bros.', zh: '超級瑪利歐兄弟', year: 1985, dev: 'Nintendo', platform: 'FC / NES', genre: '橫向捲軸平台',
              playable: true, remake: '像素水管工大冒險',
              why: '定義了跳躍手感（可變高度、慣性、土狼時間）與無字教學。現代平台遊戲的共同原點。' },
            { slug: 'bomberman', name: 'Bomberman', zh: '轟炸超人', year: 1985, dev: 'Hudson Soft', platform: 'FC / MSX', genre: '策略動作',
              playable: true, remake: '爆彈迷城',
              why: '炸彈同時是武器也是威脅，讓玩家必須規劃自己的逃生路線。空間推理的完美縮影。' },
            { slug: 'bubble_bobble', name: 'Bubble Bobble', zh: '泡泡龍', year: 1986, dev: 'Taito', platform: '大型街機', genre: '單畫面平台',
              playable: true, remake: '泡泡小龍',
              why: '雙人合作、隱藏要素、真結局需兩人同時通關——最早刻意設計「一起玩才完整」的作品之一。' },
            { slug: 'battle_city', name: 'Battle City', zh: '坦克大戰', year: 1985, dev: 'Namco', platform: 'FC', genre: '射擊策略',
              playable: true, remake: '要塞守衛戰',
              why: '可破壞地形加上「保護基地」目標，讓射擊遊戲同時具備攻守兩種節奏。' },

            { slug: 'galaga', name: 'Galaga', zh: '小蜜蜂 2', year: 1981, dev: 'Namco', platform: '大型街機', genre: '固定射擊',
              playable: false, why: '被抓走的戰機可以救回並雙機合體，把「損失」轉化為冒險機會的經典設計。' },
            { slug: 'defender', name: 'Defender', zh: '防衛者', year: 1981, dev: 'Williams', platform: '大型街機', genre: '橫向捲軸射擊',
              playable: false, why: '首度引入雷達小地圖與雙向捲軸，操作複雜到成為當時最硬派的街機。' },
            { slug: 'qbert', name: "Q*bert", zh: '嘰寶', year: 1982, dev: 'Gottlieb', platform: '大型街機', genre: '益智動作',
              playable: true, remake: '方塊金字塔',
              why: '等角投影（isometric）視角的先驅，讓 2D 畫面產生立體空間感。' },
            { slug: 'pitfall', name: 'Pitfall!', zh: '陷阱', year: 1982, dev: 'Activision', platform: 'Atari 2600', genre: '動作冒險',
              playable: false, why: '4KB 卡匣裝進 255 個場景，靠的是程序生成——早期最漂亮的技術取巧。' },
            { slug: 'lode_runner', name: 'Lode Runner', zh: '淘金者', year: 1983, dev: 'Brøderbund', platform: 'Apple II 等', genre: '益智平台',
              playable: false, why: '內建關卡編輯器，是最早把「創作工具」交給玩家的商業遊戲之一。' },
            { slug: 'zelda', name: 'The Legend of Zelda', zh: '薩爾達傳說', year: 1986, dev: 'Nintendo', platform: 'FC 磁碟機', genre: '動作冒險',
              playable: false, why: '電池存檔實現開放探索。沒有指路箭頭，靠玩家自己畫地圖與交換情報。' },
            { slug: 'dragon_quest', name: 'Dragon Quest', zh: '勇者鬥惡龍', year: 1986, dev: 'Chunsoft / Enix', platform: 'FC', genre: 'JRPG',
              playable: false, why: '堀井雄二把歐美 RPG 簡化成日本大眾能懂的形式，確立 JRPG 的成長曲線範式。' },
            { slug: 'metroid', name: 'Metroid', zh: '銀河戰士', year: 1986, dev: 'Nintendo', platform: 'FC 磁碟機', genre: '探索動作',
              playable: false, why: '以能力解鎖控制探索範圍，「Metroidvania」這個類型名稱的一半來自它。' },
            { slug: 'castlevania', name: 'Castlevania', zh: '惡魔城', year: 1986, dev: 'Konami', platform: 'FC 磁碟機', genre: '動作平台',
              playable: false, why: '刻意笨重的跳躍與攻擊硬直，把「操作限制」本身變成難度設計。' },
            { slug: 'mega_man', name: 'Mega Man', zh: '洛克人', year: 1987, dev: 'Capcom', platform: 'FC', genre: '動作平台',
              playable: false, why: '打敗 Boss 取得其能力，並形成剋制鏈——玩家可自選關卡順序的非線性結構。' },
            { slug: 'final_fantasy', name: 'Final Fantasy', zh: '太空戰士 / 最終幻想', year: 1987, dev: 'Square', platform: 'FC', genre: 'JRPG',
              playable: false, why: '職業轉職系統與側視戰鬥畫面，成為往後 JRPG 的視覺語言標準。' },
            { slug: 'street_fighter_1', name: 'Street Fighter', zh: '快打旋風', year: 1987, dev: 'Capcom', platform: '大型街機', genre: '格鬥',
              playable: false, why: '首度出現指令輸入必殺技。原始機台用壓力感應按鈕，力道決定攻擊強度。' },
            { slug: 'contra', name: 'Contra', zh: '魂斗羅', year: 1987, dev: 'Konami', platform: '大型街機 / FC', genre: '橫向捲軸射擊',
              playable: false, why: '雙人合作與八方向射擊，把街機的高難度與家用機的重複挑戰結合。' },
            { slug: 'sim_city_pre', name: 'SimCity', zh: '模擬城市', year: 1989, dev: 'Maxis', platform: 'PC / Mac', genre: '模擬經營',
              playable: false, why: '沒有輸贏條件的「玩具型遊戲」，Will Wright 證明系統本身就能提供樂趣。' },
            { slug: 'prince_persia_pre', name: 'Prince of Persia', zh: '波斯王子', year: 1989, dev: 'Brøderbund', platform: 'Apple II', genre: '動作平台',
              playable: false, why: 'Jordan Mechner 以真人影片轉描（rotoscope）製作動畫，寫實移動感震撼當代。本站的可玩版收在 1990 年代。' }
        ]
    },

    // ======================================================================
    // 1990s
    // ======================================================================
    {
        id: '1990s', short: '90s', years: '1990 – 1999',
        title: '3D 革命、主機大戰與 PC 網路化',
        subtitle: 'The Third Dimension',
        color: '#ff9ebb',
        colorDark: '#831843',
        icon: '🎮',
        headline: '遊戲學會了第三個維度，也學會了連線。',
        intro:
            '九〇年代是電子遊戲變化最劇烈的十年。前半段是 2D 的最後巔峰——' +
            '《快打旋風 II》創造了格鬥電競的雛形，《音速小子》讓速度本身變成一種玩法。' +
            '中段 CD-ROM 與 3D 加速卡登場，《Doom》讓 PC 成為主流遊戲平台並大幅推進 MOD 文化，' +
            '《Super Mario 64》則解決了 3D 遊戲最難的問題：攝影機該放哪裡。' +
            '後半段網路連線成熟，《Ultima Online》與《EverQuest》讓玩家發現，' +
            '遊戲裡最有趣的內容其實是其他玩家。' +
            '這十年也是分級制度誕生的十年——遊戲第一次被嚴肅當成需要規範的媒體。',

        pillars: [
            {
                icon: '🧊', title: '從精靈到多邊形',
                text: '3D 化不只是畫面變好看，而是整套設計語言重寫。' +
                      '2D 遊戲的碰撞是矩形重疊，3D 要處理空間深度；' +
                      '2D 的視角固定，3D 必須發明攝影機規則。' +
                      '《Super Mario 64》為此設計了會自動跟隨、也能手動繞行的攝影機，' +
                      '並把類比搖桿的力道對應成走／跑，這兩項至今仍是 3D 動作遊戲的標準。'
            },
            {
                icon: '💿', title: 'CD-ROM 改寫了成本結構',
                text: '卡匣製造成本高、容量小、由主機商壟斷；CD-ROM 便宜、容量大 100 倍、任何壓片廠都能做。' +
                      'Sony 用 PlayStation 把這個成本優勢轉成第三方廠商的集體倒戈。' +
                      '容量解放帶來 CG 過場與配音，《Final Fantasy VII》因此成為全球現象——' +
                      '但也讓開發成本開始飆升，遊戲產業正式進入「大製作」時代。'
            },
            {
                icon: '🌐', title: '共享軟體、MOD 與網路對戰',
                text: 'id Software 把《Doom》第一章免費放上 BBS，靠口碑帶動後續章節販售，' +
                      '這是數位發行的雛形。更關鍵的是他們公開了資料格式，' +
                      '玩家自製關卡與 MOD 大量湧現——《Counter-Strike》就是《Half-Life》的 MOD。' +
                      '把工具交給玩家，能長出開發者想不到的東西，這個信念貫穿至今。'
            },
            {
                icon: '⚖️', title: '分級制度與媒體地位',
                text: '1993 年《真人快打》的血腥表現與《午夜陷阱》引發美國參議院聽證會，' +
                      '產業為避免政府立法而自組 ESRB（1994 年成立）。' +
                      '這件事的意義遠超過分級本身：遊戲從此被當成需要規範的大眾媒體，' +
                      '與電影、電視平起平坐——爭議反而確立了它的文化地位。'
            }
        ],

        tech: {
            title: 'Sony PlayStation · 1994',
            specs: [
                ['CPU', 'MIPS R3000A @ 33.87 MHz'],
                ['RAM', '2 MB 主記憶體 + 1 MB 顯示記憶體'],
                ['媒體容量', 'CD-ROM 約 660 MB'],
                ['多邊形效能', '約 36 萬個貼圖多邊形／秒'],
                ['音源', '24 聲道 ADPCM，可播放 CD 音軌'],
                ['特色限制', '無浮點運算單元、無透視修正貼圖']
            ],
            note: 'PS1 沒有浮點運算，座標必須用整數近似，這就是為什麼 PS1 遊戲的多邊形會「抖動」；' +
                  '貼圖也沒有透視修正，才會產生那種歪斜的地板紋理。' +
                  '這些當年的技術缺陷，如今變成了獨立遊戲刻意模仿的懷舊美學。'
        },

        timeline: [
            { year: 1990, title: '《模擬城市》登上主機，Windows 3.0 內建《接龍》', text: '《接龍》真正目的是教使用者練習滑鼠拖放，成為史上最多人玩過的遊戲之一。', tag: '文化' },
            { year: 1991, title: '《音速小子》與主機大戰', text: 'Sega 用速度感與態度對抗任天堂，行銷戰把「你選哪一台」變成青少年身分認同。', tag: '商業' },
            { year: 1991, title: '《快打旋風 II》', text: '角色差異化、取消硬直形成的連段與街機對戰擂台，共同奠定現代格鬥競技文化。', tag: '設計' },
            { year: 1992, title: '《德軍總部 3D》', text: 'id Software 用光線投射（raycasting）在 386 電腦上跑出流暢偽 3D，讓第一人稱射擊語彙走向大眾。', tag: '技術' },
            { year: 1993, title: '《毀滅戰士》與 MOD 文化', text: '共享軟體發行、網路對戰、公開檔案格式。玩家自製內容從此成為 PC 遊戲的核心生態。', tag: '里程碑' },
            { year: 1994, title: 'PlayStation 在日本上市；ESRB 成立', text: 'CD-ROM 主機翻轉產業成本結構；分級制度確立遊戲的媒體地位。', tag: '產業' },
            { year: 1996, title: '《超級瑪利歐 64》與《雷神之錘》', text: '前者解決 3D 攝影機與類比操作，後者實現真 3D 幾何與網路連線，兩條路線同年成熟。', tag: '里程碑' },
            { year: 1997, title: '《Final Fantasy VII》', text: 'CG 過場與電影化敘事，讓 JRPG 從日本市場走向全球主流。', tag: '文化' },
            { year: 1998, title: '《薩爾達傳說：時之笛》與《戰慄時空》', text: '前者以 Z 鎖定把 3D 戰鬥瞄準系統化，後者用不中斷的第一人稱敘事取代傳統過場動畫。', tag: '設計' },
            { year: 1999, title: '《無盡的任務》與《絕對武力》', text: 'MMO 的社群經濟成形；一款 MOD 成為往後二十年最重要的戰術射擊。', tag: '文化' }
        ],

        lesson: {
            title: '設計課視角：3D 化真正困難的是「攝影機」',
            text: '2D 遊戲的攝影機幾乎不需要設計——跟著玩家捲動就好。' +
                  '進入 3D 後，攝影機成為第三個必須被操作的角色：太近看不到威脅，' +
                  '太遠失去臨場感，跟太緊會暈，跟太鬆會迷失。' +
                  '《瑪利歐 64》的解法是把攝影機交給一個虛構角色「Lakitu」拿著攝影機跟拍，' +
                  '既解釋了為什麼視角會自己動，也讓玩家能手動繞行。' +
                  '這是敘事包裝技術限制的漂亮示範——當你的系統有不得已的行為，' +
                  '**與其隱藏，不如用世界觀合理化它。**'
        },

        games: [
            { slug: 'street_fighter', name: 'Street Fighter II', zh: '快打旋風 II', year: 1991, dev: 'Capcom', platform: '大型街機', genre: '對戰格鬥',
              playable: true, remake: '街頭拳影',
              why: '八名角色各有獨立數值與距離戰略，連段原是程式 bug 卻被玩家開發成技術核心。' },
            { slug: 'sonic', name: 'Sonic the Hedgehog', zh: '音速小子', year: 1991, dev: 'Sega', platform: 'Mega Drive', genre: '高速平台',
              playable: true, remake: '疾風刺蝟',
              why: '把「速度」本身設計成獎勵：走得越順越快，讓關卡熟練度直接轉化為爽快感。' },
            { slug: 'minesweeper', name: 'Minesweeper', zh: '踩地雷', year: 1990, dev: 'Microsoft', platform: 'Windows', genre: '邏輯推理',
              playable: true, remake: '地雷推理場',
              why: '純邏輯推演、零運氣（除了第一步）。內建於 Windows，訓練了整個世代的滑鼠左右鍵操作。' },
            { slug: 'lemmings', name: 'Lemmings', zh: '旅鼠', year: 1991, dev: 'DMA Design', platform: 'Amiga 等', genre: '即時益智',
              playable: true, remake: '小旅鼠遷徙',
              why: '你不能直接控制角色，只能改變環境與分配職業。間接控制是極高明的謎題設計手法。' },
            { slug: 'doom2d', name: 'Doom', zh: '毀滅戰士', year: 1993, dev: 'id Software', platform: 'MS-DOS', genre: '第一人稱射擊',
              playable: true, remake: '深淵迷宮',
              why: '光線投射偽 3D、共享軟體發行、可 MOD 的開放格式。PC 遊戲文化的三大支柱同時成形。' },
            { slug: 'worms', name: 'Worms', zh: '百戰天蟲', year: 1995, dev: 'Team17', platform: 'Amiga / PC', genre: '回合制砲擊',
              playable: true, remake: '爆破小蟲團',
              why: '風向、拋物線、可破壞地形三者交互，讓每一發都是重新計算的數學題與喜劇。' },
            { slug: 'metal_slug', name: 'Metal Slug', zh: '越南大戰', year: 1996, dev: 'Nazca / SNK', platform: 'Neo Geo', genre: '橫向捲軸射擊',
              playable: true, remake: '鋼鐵突擊隊',
              why: '手繪動畫的巔峰。每個爆炸、每個受擊反應都獨立繪製，是 2D 打擊感的最高標準。' },
            { slug: 'pipe_mania', name: 'Pipe Mania', zh: '水管接接樂', year: 1989, dev: 'The Assembly Line', platform: 'Amiga 等', genre: '即時益智',
              playable: true, remake: '魔法導管',
              why: '在流體逼近的壓力下即時鋪設路徑。「時間壓力 + 空間規劃」的組合被無數遊戲沿用為小遊戲。' },
            { slug: 'solitaire', name: 'Solitaire', zh: '接龍', year: 1990, dev: 'Microsoft', platform: 'Windows', genre: '紙牌',
              playable: true, remake: '幻夢接龍',
              why: '微軟內建它的真正目的是教使用者練習滑鼠拖放。可能是史上最多人玩過的電子遊戲。' },
            { slug: 'prince', name: 'Prince of Persia', zh: '波斯王子', year: 1989, dev: 'Brøderbund', platform: 'Apple II / PC', genre: '動作平台',
              playable: true, remake: '沙漠王子',
              why: '真人轉描動畫帶來的重量感，讓每個跳躍都有風險——動畫本身就是難度設計。' },

            { slug: 'wolfenstein', name: 'Wolfenstein 3D', zh: '德軍總部 3D', year: 1992, dev: 'id Software', platform: 'MS-DOS', genre: '第一人稱射擊',
              playable: false, why: '讓 FPS 類型走向大眾的重要里程碑。光線投射技術使 386 電腦也能跑出流暢偽 3D 空間。' },
            { slug: 'myst', name: 'Myst', zh: '迷霧之島', year: 1993, dev: 'Cyan', platform: 'Mac / PC', genre: '解謎冒險',
              playable: false, why: '長年蟬聯 PC 銷售冠軍，證明非暴力、慢節奏的遊戲同樣有龐大市場。' },
            { slug: 'mortal_kombat', name: 'Mortal Kombat', zh: '真人快打', year: 1992, dev: 'Midway', platform: '大型街機', genre: '格鬥',
              playable: false, why: '數位化真人素材與血腥終結技，直接促成美國參議院聽證會與 ESRB 分級制度。' },
            { slug: 'super_mario_64', name: 'Super Mario 64', zh: '超級瑪利歐 64', year: 1996, dev: 'Nintendo', platform: 'N64', genre: '3D 平台',
              playable: false, why: '解決 3D 攝影機與類比移動兩大難題，制定了往後所有 3D 動作遊戲的操作語彙。' },
            { slug: 'quake', name: 'Quake', zh: '雷神之錘', year: 1996, dev: 'id Software', platform: 'PC', genre: '第一人稱射擊',
              playable: false, why: '以完整 3D 多邊形世界、即時光照與網路對戰推進 FPS 技術，也成為早期 PC 競技的重要平台。' },
            { slug: 'tomb_raider', name: 'Tomb Raider', zh: '古墓奇兵', year: 1996, dev: 'Core Design', platform: 'PS1 / PC', genre: '動作冒險',
              playable: false, why: '蘿拉成為第一位全球級的女性遊戲主角，也確立第三人稱 3D 探索的鏡頭語言。' },
            { slug: 'ff7', name: 'Final Fantasy VII', zh: '太空戰士 VII', year: 1997, dev: 'Square', platform: 'PS1', genre: 'JRPG',
              playable: false, why: 'CD 容量帶來 CG 過場與電影化敘事，是 JRPG 全球化的引爆點。' },
            { slug: 'ultima_online', name: 'Ultima Online', zh: '網路創世紀', year: 1997, dev: 'Origin', platform: 'PC', genre: 'MMORPG',
              playable: false, why: '最早的大型多人線上世界之一。玩家經濟、盜賊與治安問題全是設計者沒預料到的。' },
            { slug: 'ocarina', name: "The Legend of Zelda: Ocarina of Time", zh: '薩爾達傳說：時之笛', year: 1998, dev: 'Nintendo', platform: 'N64', genre: '3D 動作冒險',
              playable: false, why: 'Z 鎖定解決了 3D 空間的瞄準難題，成為所有 3D 近戰遊戲的標準解法。' },
            { slug: 'half_life', name: 'Half-Life', zh: '戰慄時空', year: 1998, dev: 'Valve', platform: 'PC', genre: '第一人稱射擊',
              playable: false, why: '取消過場動畫，全程保持第一人稱，讓敘事與遊玩不再割裂。' },
            { slug: 'mgs', name: 'Metal Gear Solid', zh: '潛龍諜影', year: 1998, dev: 'Konami', platform: 'PS1', genre: '潛行動作',
              playable: false, why: '小島秀夫把電影語言帶進遊戲，並用打破第四面牆的謎題玩弄玩家的媒介認知。' },
            { slug: 'starcraft', name: 'StarCraft', zh: '星海爭霸', year: 1998, dev: 'Blizzard', platform: 'PC', genre: '即時戰略',
              playable: false, why: '三個種族完全不對稱卻能平衡，成為韓國電競產業的基石與 RTS 平衡設計的聖經。' },
            { slug: 'pokemon', name: 'Pokémon Red / Green', zh: '寶可夢 紅／綠', year: 1996, dev: 'Game Freak', platform: 'Game Boy', genre: 'RPG',
              playable: false, why: '用連接線交換強迫玩家實體社交，把掌機的限制轉成社群設計的核心。' },
            { slug: 'diablo', name: 'Diablo', zh: '暗黑破壞神', year: 1996, dev: 'Blizzard North', platform: 'PC', genre: '動作 RPG',
              playable: false, why: '隨機地城與掉寶迴圈，把「再刷一次」定型成持續至今的驅動力設計。' },
            { slug: 'gran_turismo', name: 'Gran Turismo', zh: '跑車浪漫旅', year: 1997, dev: 'Polyphony Digital', platform: 'PS1', genre: '擬真競速',
              playable: false, why: '把汽車模擬做到執照考試的程度，證明主機也能承載硬派模擬類型。' }
        ]
    },

    // ======================================================================
    // 2000s
    // ======================================================================
    {
        id: '2000s', short: '00s', years: '2000 – 2009',
        title: '網路服務、Flash 網頁遊戲與體感革命',
        subtitle: 'Online, Flash & Motion',
        color: '#70e4b5',
        colorDark: '#065f46',
        icon: '💻',
        headline: '遊戲離開了包裝盒，變成一種持續連線的服務。',
        intro:
            '兩千年代最大的變化不在畫面，而在「遊戲怎麼到你手上」。' +
            'Xbox Live 讓主機常態連線，Steam 讓 PC 玩家接受了「不擁有光碟」，' +
            '《魔獸世界》證明訂閱制能養活一個持續運營十幾年的世界。' +
            '同時，瀏覽器裡的 Flash 開啟了另一條完全不同的路：' +
            '沒有發行商、沒有預算、一個人就能做一款遊戲丟到網站上，' +
            '《Line Rider》《Fancy Pants》《憤怒鳥》都從這裡長出來——' +
            '這是獨立遊戲運動真正的溫床。' +
            '2006 年 Wii 用體感把不玩遊戲的人拉進客廳，' +
            '2007 年 iPhone 則悄悄埋下了下一個十年的引信。',

        pillars: [
            {
                icon: '📡', title: '線上服務取代一次性販售',
                text: '2002 年 Xbox Live 建立統一帳號、好友清單與成就系統；' +
                      '2003 年 Steam 起初只是《絕對武力》的更新工具，卻演化成 PC 數位發行的壟斷平台；' +
                      '2004 年《魔獸世界》以月費模式運營。' +
                      '遊戲從「賣一次的商品」變成「持續收費的服務」，' +
                      'DLC、季票、賽季制的商業邏輯都在這裡奠基。'
            },
            {
                icon: '🌐', title: 'Flash 與網頁遊戲的野生創作期',
                text: 'Newgrounds、Kongregate 等平台讓任何人都能免費發表作品，' +
                      '靠廣告分潤維生。沒有品管、沒有發行商，也因此什麼實驗都有人做。' +
                      '這個生態訓練出後來一整代獨立開發者——' +
                      '《Super Meat Boy》《憤怒鳥》《Cut the Rope》都能追溯到 Flash 時期的原型。' +
                      '2020 年 Flash 正式終止，這批作品的保存成為數位文化遺產的重要課題。'
            },
            {
                icon: '🤸', title: '體感與「非玩家」市場',
                text: '2006 年 Wii 選擇不比拚畫面，改用動作感應遙控器。' +
                      '《Wii Sports》讓完全沒碰過搖桿的長輩也能立刻上手，' +
                      '主機銷量超越畫面更強的 PS3 與 Xbox 360。' +
                      '這是遊戲設計史上最重要的可用性（usability）勝利案例：' +
                      '**降低操作門檻帶來的市場擴張，遠大於提升畫質。**'
            },
            {
                icon: '🧩', title: '物理引擎成為玩法本身',
                text: '硬體算力終於能負擔即時物理模擬，' +
                      '《Half-Life 2》的重力槍、《憤怒鳥》的彈道破壞、' +
                      '《Line Rider》的純物理沙盒，都把「物理」從裝飾提升為核心機制。' +
                      '這也帶來一種新的樂趣類型：玩家享受的是系統的湧現行為（emergence），' +
                      '而不是設計師預先安排的內容。'
            }
        ],

        tech: {
            title: 'Adobe Flash Player · 網頁遊戲的執行環境',
            specs: [
                ['語言', 'ActionScript 2.0 / 3.0'],
                ['繪圖', '向量為主，可縮放不失真'],
                ['典型檔案大小', '數十 KB – 數 MB'],
                ['發行方式', '上傳到入口網站，廣告分潤'],
                ['開發團隊規模', '常見為 1 – 3 人'],
                ['致命傷', '安全漏洞與行動裝置不支援']
            ],
            note: '一款 Flash 遊戲從構想到上線可能只要一個週末。' +
                  '這種極短的迭代循環，讓創作者能大量嘗試怪點子——' +
                  '今天的 itch.io 與 Game Jam 文化，本質上是 Flash 精神的延續。'
        },

        timeline: [
            { year: 2000, title: 'PlayStation 2 上市', text: '內建 DVD 播放器讓它成為許多家庭的第一台 DVD 機，最終成為史上銷量最高的主機。', tag: '商業' },
            { year: 2000, title: '《模擬市民》', text: 'Will Wright 以日常生活為題材，吸引大量女性與非傳統玩家，成為 PC 史上最暢銷系列之一。', tag: '文化' },
            { year: 2001, title: 'Xbox 與《最後一戰》', text: '微軟以雙搖桿 FPS 操作方案打進主機市場，確立「左手移動、右手視角」的標準。', tag: '設計' },
            { year: 2002, title: 'Xbox Live 上線', text: '統一帳號、好友、語音與成就系統，主機遊戲正式進入常態連線時代。', tag: '商業' },
            { year: 2003, title: 'Steam 推出', text: '原為《絕對武力》的更新工具，日後成為 PC 數位發行的主導平台。', tag: '商業' },
            { year: 2004, title: '《魔獸世界》與《戰慄時空 2》', text: '訂閱制 MMO 的巔峰；重力槍展示物理引擎作為核心玩法的可能。', tag: '里程碑' },
            { year: 2005, title: 'Xbox 360 與高畫質世代', text: 'HD 解析度與成就系統普及，開發成本大幅上升，中型工作室開始被擠壓。', tag: '產業' },
            { year: 2006, title: 'Wii 上市', text: '以體感操作打開非玩家市場，證明可用性比畫質更能擴張使用者。', tag: '里程碑' },
            { year: 2007, title: 'iPhone 發表；《傳送門》問世', text: '前者為手遊時代埋下引信；後者以極簡機制與黑色幽默成為敘事設計典範。', tag: '里程碑' },
            { year: 2008, title: 'App Store 開張', text: '低價、低門檻的行動遊戲市場成形，開發者第一次能直接觸及全球數億使用者。', tag: '商業' },
            { year: 2009, title: '《憤怒鳥》《植物大戰殭屍》《Minecraft》開發版', text: '手遊爆款、休閒塔防與沙盒建造，三種將主宰下個十年的形態同年出現。', tag: '設計' }
        ],

        lesson: {
            title: '設計課視角：《憤怒鳥》為什麼適合手機',
            text: '它的核心操作只有一個：拉、放。沒有虛擬搖桿、沒有連續操作、' +
                  '單次互動不超過三秒，隨時可以中斷——完全貼合通勤與排隊的碎片情境。' +
                  '三星評分讓「過關」與「精通」分離，給予不同投入程度的玩家各自的目標。' +
                  '而失敗的成本極低（重來只要一秒），這讓玩家願意反覆嘗試。' +
                  '這是**平台特性決定設計形式**的經典案例：' +
                  '設計一款遊戲之前，先問玩家會在什麼姿勢、什麼環境、有多少時間下玩它。'
        },

        games: [
            { slug: 'angry_birds', name: 'Angry Birds', zh: '憤怒鳥', year: 2009, dev: 'Rovio', platform: 'iOS / 多平台', genre: '物理彈射',
              playable: true, remake: '暴怒鳥彈射隊',
              why: '一個手勢完成所有操作，三星評分分離「過關」與「精通」，手遊設計的教科書案例。' },
            { slug: 'bejeweled', name: 'Bejeweled', zh: '寶石方塊', year: 2001, dev: 'PopCap', platform: '瀏覽器 / 多平台', genre: '三消',
              playable: true, remake: '寶石迴響',
              why: '把三消類型推向大眾。連鎖反應帶來的意外獎勵，是「小額頻繁正回饋」的清楚示範。' },
            { slug: 'line_rider', name: 'Line Rider', zh: '線條騎士', year: 2006, dev: 'Boštjan Čadež', platform: 'Flash', genre: '物理沙盒',
              playable: true, remake: '雪橇畫線師',
              why: '沒有目標、沒有分數，只有一支筆和物理引擎。玩家自己發明了玩法與競賽。' },
            { slug: 'fancy_pants', name: 'Fancy Pants Adventure', zh: '火柴人冒險', year: 2006, dev: 'Brad Borne', platform: 'Flash', genre: '平台跳躍',
              playable: true, remake: '塗鴉冒險家',
              why: '一人開發卻做出當時最流暢的跑跳手感，證明「手感」不需要大團隊，只需要反覆打磨。' },
            { slug: 'doodle_jump', name: 'Doodle Jump', zh: '塗鴉跳躍', year: 2009, dev: 'Lima Sky', platform: 'iOS', genre: '無盡跳躍',
              playable: true, remake: '筆記本跳跳',
              why: '完全用重力感應操作，沒有任何按鈕。垂直無盡結構讓「再高一點」成為天然驅動力。' },
            { slug: 'helicopter', name: 'Helicopter Game', zh: '直升機', year: 2004, dev: 'seethru / 網路流傳', platform: 'Flash', genre: '單鍵動作',
              playable: true, remake: '洞穴飛行器',
              why: '只有一個按鍵：按住上升、放開下降。史上操作最簡單卻最難精通的遊戲之一。' },
            { slug: 'meat_boy', name: 'Meat Boy', zh: '肉塊男孩', year: 2008, dev: 'Team Meat', platform: 'Flash', genre: '精準平台',
              playable: true, remake: '果凍勇者',
              why: '死亡懲罰趨近於零（瞬間重生），讓超高難度變得可以接受。這個設計直接影響《Celeste》。' },
            { slug: 'age_of_war', name: 'Age of War', zh: '時代戰爭', year: 2007, dev: 'Louissi', platform: 'Flash', genre: '推塔策略',
              playable: true, remake: '文明推進戰',
              why: '把「文明演進」壓縮進單一畫面的兵線推進，是資源管理與剋制關係的極簡教材。' },
            { slug: 'pvz', name: 'Plants vs. Zombies', zh: '植物大戰殭屍', year: 2009, dev: 'PopCap', platform: 'PC / 多平台', genre: '路線塔防',
              playable: true, remake: '花園守衛戰',
              why: '把 RTS 的資源與配置壓縮成五條橫線，每種植物只有一個功能，複雜度全來自組合。' },
            { slug: 'canabalt', name: 'Canabalt', zh: '狂奔', year: 2009, dev: 'Adam Saltsman', platform: 'Flash', genre: '無盡跑酷',
              playable: true, remake: '天際奔逃',
              why: '單鍵跑酷的原型，直接催生了往後手機上整個「無盡跑酷」類型。' },

            { slug: 'sims', name: 'The Sims', zh: '模擬市民', year: 2000, dev: 'Maxis', platform: 'PC', genre: '生活模擬',
              playable: false, why: '以日常生活為題材，成功吸引大量女性與非傳統玩家，改變了產業對客群的想像。' },
            { slug: 'halo', name: 'Halo: Combat Evolved', zh: '最後一戰', year: 2001, dev: 'Bungie', platform: 'Xbox', genre: '第一人稱射擊',
              playable: false, why: '雙搖桿操作、可再生護盾、兩把武器限制，重寫了主機 FPS 的設計規則。' },
            { slug: 'gta3', name: 'Grand Theft Auto III', zh: '俠盜獵車手 III', year: 2001, dev: 'DMA Design', platform: 'PS2', genre: '開放世界',
              playable: false, why: '3D 開放世界商業化的重要里程碑，把「城市本身」變成可探索與即興互動的內容。' },
            { slug: 'wow', name: 'World of Warcraft', zh: '魔獸世界', year: 2004, dev: 'Blizzard', platform: 'PC', genre: 'MMORPG',
              playable: false, why: '把 MMO 從硬派小眾變成大眾娛樂，訂閱制運營維持了二十年以上。' },
            { slug: 'hl2', name: 'Half-Life 2', zh: '戰慄時空 2', year: 2004, dev: 'Valve', platform: 'PC', genre: '第一人稱射擊',
              playable: false, why: '重力槍讓物理引擎成為武器與謎題，同時 Steam 隨之強制推廣。' },
            { slug: 'nintendogs', name: 'Nintendogs', zh: '任天狗', year: 2005, dev: 'Nintendo', platform: 'NDS', genre: '寵物養成',
              playable: false, why: '觸控與麥克風輸入，把「沒有目標的陪伴」做成商業成功的產品。' },
            { slug: 'wii_sports', name: 'Wii Sports', zh: 'Wii 運動', year: 2006, dev: 'Nintendo', platform: 'Wii', genre: '體感運動',
              playable: false, why: '史上最成功的可用性設計之一，讓完全沒玩過遊戲的人在三十秒內上手。' },
            { slug: 'portal', name: 'Portal', zh: '傳送門', year: 2007, dev: 'Valve', platform: 'PC / 主機', genre: '第一人稱解謎',
              playable: false, why: '單一機制（兩個傳送門）貫穿全程，難度曲線與黑色幽默敘事完美同步。' },
            { slug: 'bioshock', name: 'BioShock', zh: '生化奇兵', year: 2007, dev: '2K Boston', platform: 'PC / 主機', genre: 'FPS / 敘事',
              playable: false, why: '「Would you kindly」的敘事轉折，把玩家的服從性本身變成劇情主題。' },
            { slug: 'braid', name: 'Braid', zh: '時空幻境', year: 2008, dev: 'Jonathan Blow', platform: 'Xbox Live Arcade', genre: '解謎平台',
              playable: false, why: '獨立遊戲商業化的引爆點，證明個人作品能在主機平台獲得可觀收入。' },
            { slug: 'left4dead', name: 'Left 4 Dead', zh: '惡靈勢力', year: 2008, dev: 'Valve', platform: 'PC / 主機', genre: '合作射擊',
              playable: false, why: 'AI Director 動態調整壓力節奏，是程序化敘事節奏控制的先驅。' },
            { slug: 'demon_souls', name: "Demon's Souls", zh: '惡魔靈魂', year: 2009, dev: 'FromSoftware', platform: 'PS3', genre: '動作 RPG',
              playable: false, why: '高懲罰、低指引、非同步玩家訊息，推動了往後十年極具影響力的 Souls-like 設計流派。' },
            { slug: 'minecraft_alpha', name: 'Minecraft（開發版）', zh: '當個創世神', year: 2009, dev: 'Markus Persson', platform: 'PC', genre: '沙盒建造',
              playable: false, why: '搶先體驗（Early Access）模式的最重要案例，邊開發邊販售、邊聽玩家意見。' },
            { slug: 'farmville', name: 'FarmVille', zh: '開心農場', year: 2009, dev: 'Zynga', platform: 'Facebook', genre: '社群模擬',
              playable: false, why: '把社交關係與等待時間商品化，建立了往後爭議不斷的免費增值機制。' }
        ]
    },

    // ======================================================================
    // 2010s
    // ======================================================================
    {
        id: '2010s', short: '10s', years: '2010 – 2019',
        title: '手機、獨立遊戲與服務型遊戲',
        subtitle: 'Mobile, Indie & Games-as-a-Service',
        color: '#c084fc',
        colorDark: '#581c87',
        icon: '📱',
        headline: '製作工具免費了，發行門檻消失了，商業模式全部重寫。',
        intro:
            '二〇一〇年代的關鍵詞是「門檻消失」。Unity 與 Unreal 開放免費使用，' +
            'Steam、App Store、itch.io 讓任何人都能自己發行，' +
            'Kickstarter 讓小團隊在開發前就拿到資金。' +
            '結果是獨立遊戲全面開花——《Undertale》《Celeste》《Papers, Please》' +
            '這些一到數人的作品，在文化影響力上與 3A 大作平起平坐。' +
            '另一邊，商業模式從「賣斷」轉向「服務」：' +
            '免費遊玩加內購、賽季通行證、持續更新的營運型遊戲成為主流，' +
            '《要塞英雄》一款遊戲的年營收超過許多國家的整體遊戲市場。' +
            '同時 Twitch 與 YouTube 讓「看別人玩」成為比自己玩更大的產業。',

        pillars: [
            {
                icon: '🛠️', title: '引擎民主化與獨立遊戲爆發',
                text: 'Unity（2009 年起免費個人版）與 Unreal（2015 年起免版稅門檻）' +
                      '讓不會寫渲染器的人也能做 3D 遊戲。' +
                      '過去需要一個引擎團隊才能起步，現在一個人加一台筆電就夠。' +
                      '《Stardew Valley》（一人開發四年）與《Undertale》（一人主導）' +
                      '證明了個人創作能達到的高度——這對遊戲教育的意義極大：' +
                      '**學生現在真的做得完一款能上架的遊戲。**'
            },
            {
                icon: '💰', title: 'F2P、內購與戰鬥通行證',
                text: '免費遊玩降低獲取門檻，收入來自少數高消費玩家。' +
                      '2018 年《要塞英雄》把「戰鬥通行證」推向主流：' +
                      '玩家付固定金額換取一整季的解鎖進度，比隨機抽獎溫和，' +
                      '也把每日登入變成一種義務。' +
                      '這套機制同時引發了對開箱（loot box）是否等同賭博的全球監管討論，' +
                      '比利時與荷蘭一度禁止部分機制。'
            },
            {
                icon: '📺', title: '觀看文化與社群共創',
                text: '2014 年 Amazon 以近十億美元收購 Twitch。' +
                      '遊戲的價值不再只有「好玩」，還包括「好看」——' +
                      '《Among Us》與《要塞英雄》的爆紅幾乎完全由實況主推動。' +
                      '這催生了一種新的設計考量：**遊戲要為觀眾設計，不只為玩家設計。**' +
                      '容易理解的規則、戲劇性的失敗、可分享的瞬間，成為新的設計指標。'
            },
            {
                icon: '♿', title: '無障礙與玩家多樣性',
                text: '《Celeste》（2018）內建輔助模式，讓玩家自由調整遊戲速度、無限衝刺、無敵，' +
                      '並在設定畫面明白寫著「這款遊戲是關於克服困難，但每個人的困難不同」。' +
                      '微軟同年推出 Xbox 自適應控制器。' +
                      '無障礙設計從「額外功能」變成專業標準——' +
                      '這也提醒設計者：難度是體驗的手段，不是目的。'
            }
        ],

        tech: {
            title: 'Unity 引擎 · 獨立開發的標準配備',
            specs: [
                ['授權', '個人版免費，營收超過門檻才收費'],
                ['支援平台', '單一專案輸出 20 種以上平台'],
                ['腳本語言', 'C#'],
                ['資產商店', '數十萬件現成美術、音效與工具'],
                ['典型團隊規模', '1 – 20 人'],
                ['2023 爭議', 'Runtime Fee 政策引發大規模抗議後撤回']
            ],
            note: '引擎免費化真正改變的不是技術，而是「誰可以做遊戲」。' +
                  '當工具、發行、資金三道門檻同時降低，遊戲創作從產業行為變成個人表達——' +
                  '這也是遊戲設計進入大學課程的關鍵背景。'
        },

        timeline: [
            { year: 2010, title: 'Kinect 與《Cut the Rope》', text: '體感走向無控制器；手遊物理解謎確立三星評分與關卡包的營運模式。', tag: '技術' },
            { year: 2011, title: '《Minecraft》正式版與《Skyrim》', text: '沙盒建造成為文化現象，並意外成為全球最普及的程式與空間教育工具。', tag: '文化' },
            { year: 2012, title: '《Journey》與 Kickstarter 眾籌熱潮', text: '無文字的線上邂逅證明情感體驗的可能；群眾募資讓小團隊繞過發行商。', tag: '里程碑' },
            { year: 2013, title: '《Papers, Please》與 PS4／Xbox One', text: '前者以官僚勞動為玩法探討道德壓迫，開啟遊戲作為社會評論的路徑。', tag: '設計' },
            { year: 2014, title: 'Twitch 被 Amazon 收購；《Flappy Bird》現象', text: '觀看文化正式產業化；一款極簡手遊在爆紅後被開發者自行下架。', tag: '文化' },
            { year: 2015, title: '《Undertale》', text: '一人主導的 RPG，用「可以不殺任何人」的設計反思玩家對遊戲暴力的預設。', tag: '設計' },
            { year: 2016, title: '《Overwatch》《Pokémon GO》與 VR 元年', text: '英雄射擊、擴增實境與消費級 VR 同年登場，三種形態各自開路。', tag: '里程碑' },
            { year: 2017, title: 'Switch 與《曠野之息》', text: '化學引擎式的系統互動取代腳本化任務，重新定義開放世界的設計哲學。', tag: '設計' },
            { year: 2018, title: '《要塞英雄》戰鬥通行證與《Celeste》輔助模式', text: '前者重寫營運型遊戲的收費結構，後者確立無障礙設計的專業標準。', tag: '商業' },
            { year: 2019, title: '《極樂迪斯科》與雲端串流嘗試', text: '純文字互動的 RPG 拿下多項大獎；Google Stadia 開啟雲端遊戲的第一輪失敗實驗。', tag: '產業' }
        ],

        lesson: {
            title: '設計課視角：《Celeste》如何讓「很難」變成「值得」',
            text: '《Celeste》的關卡以單一畫面為單位，死亡後在同一畫面立即重生——' +
                  '重試成本壓到約一秒。玩家因此不會累積挫折，' +
                  '每次失敗都被理解為「我剛剛學到了一點東西」。' +
                  '衝刺（dash）只有一次、落地才回復，把每個房間變成一道有唯一解的謎題。' +
                  '而輔助模式讓卡關的玩家仍能看完故事，不必在「放棄」與「硬撐」之間二選一。' +
                  '這帶出一個重要觀念：**難度應該是可調的體驗參數，而不是進入門票。**'
        },

        games: [
            { slug: 'flappy_bird', name: 'Flappy Bird', zh: '飛翔的小鳥', year: 2013, dev: 'Dong Nguyen', platform: 'iOS / Android', genre: '單鍵挑戰',
              playable: true, remake: '撲翅小雀',
              why: '一個按鍵、一種障礙、沒有進度。極端的簡潔加上極端的挫折，意外成為社群現象。' },
            { slug: 'game_2048', name: '2048', zh: '2048', year: 2014, dev: 'Gabriele Cirulli', platform: '瀏覽器', genre: '數字益智',
              playable: true, remake: '2048 魔方',
              why: '一個週末做出的開源作品，用最簡單的合併規則產生極深的策略空間。' },
            { slug: 'super_hexagon', name: 'Super Hexagon', zh: '超級六邊形', year: 2012, dev: 'Terry Cavanagh', platform: '多平台', genre: '反射挑戰',
              playable: true, remake: '六角漩渦',
              why: '把難度推到極限，卻用音樂節奏與即時重生讓玩家願意重試上百次。' },
            { slug: 'vvvvvv', name: 'VVVVVV', zh: 'VVVVVV', year: 2010, dev: 'Terry Cavanagh', platform: 'PC', genre: '重力平台',
              playable: true, remake: '重力翻轉者',
              why: '主角不能跳，只能翻轉重力。移除一個標準動詞，反而長出全新的關卡語言。' },
            { slug: 'crossy_road', name: 'Crossy Road', zh: '天天過馬路', year: 2014, dev: 'Hipster Whale', platform: '行動裝置', genre: '無盡動作',
              playable: true, remake: '路口衝刺者',
              why: '《Frogger》的現代化重製，並用「非強迫廣告 + 角色收集」示範友善的免費營運。' },
            { slug: 'slither', name: 'Slither.io', zh: '貪吃蛇大作戰', year: 2016, dev: 'Steve Howse', platform: '瀏覽器', genre: '.io 多人',
              playable: true, remake: '光蛇競技場',
              why: '零安裝、零註冊、三秒進場。.io 類型證明了瀏覽器多人遊戲的市場仍然存在。' },
            { slug: 'downwell', name: 'Downwell', zh: '深井', year: 2015, dev: 'Ojiro Fumoto', platform: '行動裝置 / PC', genre: 'Roguelite 射擊',
              playable: true, remake: '深井墜落',
              why: '直向畫面、三色配色、槍就是雙腳——為手機直握姿勢重新設計的動作遊戲。' },
            { slug: 'tiny_wings', name: 'Tiny Wings', zh: '小翼', year: 2011, dev: 'Andreas Illiger', platform: 'iOS', genre: '節奏動作',
              playable: true, remake: '暖丘滑翔',
              why: '一根手指控制俯衝時機，把「順著地形節奏」的手感做成核心樂趣。' },
            { slug: 'into_breach', name: 'Into the Breach', zh: '陷陣之志', year: 2018, dev: 'Subset Games', platform: 'PC / Switch', genre: '戰棋策略',
              playable: true, remake: '機甲防線',
              why: '完全公開敵人下一步，把運氣從策略中移除，變成純粹的資訊完全謎題。' },
            { slug: 'celeste_like', name: 'Celeste', zh: '蔚藍', year: 2018, dev: 'Maddy Makes Games', platform: '多平台', genre: '精準平台',
              playable: true, remake: '登峰之路',
              why: '單畫面即時重生把高難度變得可承受，輔助模式則重新定義了難度的意義。' },

            { slug: 'minecraft', name: 'Minecraft', zh: '當個創世神', year: 2011, dev: 'Mojang', platform: '多平台', genre: '沙盒建造',
              playable: false, why: '史上銷量最高的遊戲。開放的建造系統讓它同時是玩具、社交空間與教學工具。' },
            { slug: 'journey', name: 'Journey', zh: '風之旅人', year: 2012, dev: 'thatgamecompany', platform: 'PS3', genre: '藝術冒險',
              playable: false, why: '無文字、無語音的線上邂逅，證明情感連結不需要語言也能建立。' },
            { slug: 'papers_please', name: 'Papers, Please', zh: '請出示文件', year: 2013, dev: 'Lucas Pope', platform: 'PC', genre: '模擬 / 敘事',
              playable: false, why: '把重複的官僚勞動變成玩法，讓玩家親身體會制度性的道德壓迫。' },
            { slug: 'gtav', name: 'Grand Theft Auto V', zh: '俠盜獵車手 V', year: 2013, dev: 'Rockstar North', platform: '多平台', genre: '開放世界',
              playable: false, why: '史上最賺錢的娛樂產品之一，線上模式的長期營運改寫了 3A 的收益模型。' },
            { slug: 'undertale', name: 'Undertale', zh: '傳說之下', year: 2015, dev: 'Toby Fox', platform: 'PC / 多平台', genre: 'RPG',
              playable: false, why: '一人主導。用「可以不殺任何人」的設計反問玩家對遊戲暴力的預設。' },
            { slug: 'stardew', name: 'Stardew Valley', zh: '星露谷物語', year: 2016, dev: 'ConcernedApe', platform: '多平台', genre: '農場模擬',
              playable: false, why: '一人開發四年，美術、程式、音樂全包。個人創作能達到的商業高度代表作。' },
            { slug: 'overwatch', name: 'Overwatch', zh: '鬥陣特攻', year: 2016, dev: 'Blizzard', platform: '多平台', genre: '英雄射擊',
              playable: false, why: '角色技能組差異極大卻能團隊平衡，是現代多人平衡設計的重要參考。' },
            { slug: 'pokemon_go', name: 'Pokémon GO', zh: '寶可夢 GO', year: 2016, dev: 'Niantic', platform: '行動裝置', genre: 'AR 蒐集',
              playable: false, why: '把 GPS 與現實地標變成遊戲場地，是擴增實境第一個真正的大眾成功案例。' },
            { slug: 'botw', name: 'The Legend of Zelda: Breath of the Wild', zh: '薩爾達傳說：曠野之息', year: 2017, dev: 'Nintendo', platform: 'Switch', genre: '開放世界',
              playable: false, why: '以物理與化學規則的一致性取代腳本化任務，讓玩家的每個猜想都能成立。' },
            { slug: 'pubg', name: "PUBG: Battlegrounds", zh: '絕地求生', year: 2017, dev: 'PUBG Studios', platform: 'PC / 多平台', genre: '大逃殺',
              playable: false, why: '把 MOD 玩法變成獨立類型，縮圈機制解決了大地圖多人遊戲的節奏問題。' },
            { slug: 'fortnite', name: 'Fortnite', zh: '要塞英雄', year: 2017, dev: 'Epic Games', platform: '多平台', genre: '大逃殺 / 建造',
              playable: false, why: '戰鬥通行證重寫營運型遊戲的收費結構，並把遊戲變成演唱會與社交場所。' },
            { slug: 'hollow_knight', name: 'Hollow Knight', zh: '空洞騎士', year: 2017, dev: 'Team Cherry', platform: '多平台', genre: '類銀河惡魔城',
              playable: false, why: '三人團隊做出媲美大作的內容量，是類銀河惡魔城類型的現代標竿。' },
            { slug: 'disco', name: 'Disco Elysium', zh: '極樂迪斯科', year: 2019, dev: 'ZA/UM', platform: 'PC', genre: 'RPG / 敘事',
              playable: false, why: '沒有戰鬥，全靠對話與技能檢定。把 RPG 的「角色扮演」還原成真正的內心衝突。' },
            { slug: 'apex', name: 'Apex Legends', zh: '頂尖傳奇', year: 2019, dev: 'Respawn', platform: '多平台', genre: '大逃殺',
              playable: false, why: 'Ping 溝通系統讓不開語音也能團隊合作，是無障礙社交設計的重要突破。' }
        ]
    },

    // ======================================================================
    // 2020s
    // ======================================================================
    {
        id: '2020s', short: '20s', years: '2020 – 進行中',
        title: '訂閱制、極簡爆款與生成式 AI 的衝擊',
        subtitle: 'Subscription, Minimalism & AI',
        color: '#7dd3fc',
        colorDark: '#0c4a6e',
        icon: '🌐',
        headline: '產業最大最賺錢的時候，也是最不穩定的時候。',
        intro:
            '這個十年開場於疫情——全球封城讓《Among Us》與《集合啦！動物森友會》成為社交替代品，' +
            '遊戲第一次被大規模當作「見面的地方」而非娛樂。' +
            '技術上，SSD 串流、光線追蹤與 UE5 讓畫面逼近電影；' +
            '但市場上最亮眼的卻是《Vampire Survivors》《Balatro》這類' +
            '一兩人開發、畫面樸素、機制極簡的作品——' +
            '證明玩家要的從來不是畫質。' +
            '同時產業結構劇烈震盪：訂閱制改變價值認知、' +
            '2023 年起大規模裁員、生成式 AI 進入生產管線引發創作倫理爭議。' +
            '這是遊戲史上最富裕、卻也最沒有安全感的一段時期。',

        pillars: [
            {
                icon: '🦠', title: '疫情把遊戲變成社交基礎設施',
                text: '2020 年全球封城期間，《集合啦！動物森友會》被用來辦婚禮與畢業典禮，' +
                      '《Among Us》成為線上聚會的預設活動。' +
                      '遊戲的功能定位在這一年被永久改寫：它不只是娛樂內容，' +
                      '而是一種公共空間。這也讓「非競技的社交玩法」' +
                      '（cozy game、派對推理）成為一個穩定且獲利的類別。'
            },
            {
                icon: '🎰', title: '極簡爆款與「湧現式爽感」',
                text: '《Vampire Survivors》（2022）沒有攻擊鍵——角色自動攻擊，' +
                      '玩家只負責走位與升級選擇。開發者一人、美術用現成素材、售價極低，' +
                      '卻拿下年度大獎。《Balatro》（2024）同樣是一人開發的撲克 Roguelike。' +
                      '這股潮流的共同點是：**把玩家的決策壓縮到最少，把回饋放到最大。**' +
                      '對教學而言，這是極好的證據——好玩與預算無關，與機制設計有關。'
            },
            {
                icon: '📦', title: '訂閱制與平台整合',
                text: 'Xbox Game Pass 把遊戲變成像 Netflix 一樣的月費內容庫，' +
                      '微軟並以近 690 億美元收購 Activision Blizzard（2023 年完成）。' +
                      '訂閱制對小型開發者是雙面刃：能拿到保底收入與大量曝光，' +
                      '但也讓玩家逐漸不再認為單一遊戲值得單獨付費，' +
                      '整體「遊戲的價格感」正在被重新定義。'
            },
            {
                icon: '🤖', title: '生成式 AI 與創作倫理',
                text: '2023 年起，生成式 AI 進入美術、配音與程式的生產管線。' +
                      '爭議集中在三點：訓練資料的著作權來源、' +
                      '配音員與美術人員的工作被取代、' +
                      '以及大量低品質 AI 生成內容淹沒商店頁面。' +
                      'Steam 自 2024 年起要求開發者揭露 AI 使用情形。' +
                      '對正在學遊戲設計的學生而言，這是一個必須自己想清楚立場的問題：' +
                      '**AI 該用在哪個環節，你的不可取代性又在哪裡。**'
            }
        ],

        tech: {
            title: 'Unreal Engine 5 · 2022',
            specs: [
                ['Nanite', '虛擬幾何體，可直接使用電影級模型'],
                ['Lumen', '即時全域光照，不需烘焙光照貼圖'],
                ['資產串流', '依賴 NVMe SSD 高速讀取'],
                ['授權', '營收超過門檻才收 5% 權利金'],
                ['代表作', '《黑神話：悟空》等'],
                ['隱憂', '開發成本與硬體需求同步飆升']
            ],
            note: '諷刺的是，這個十年技術最先進的引擎與最暢銷的獨立遊戲，' +
                  '走的是完全相反的路線。《Vampire Survivors》用的是網頁技術 Phaser，' +
                  '畫面像二十年前的作品——這提醒我們：' +
                  '技術決定你能做什麼，但不決定玩家會不會喜歡。'
        },

        timeline: [
            { year: 2020, title: '疫情下的《動物森友會》與《Among Us》', text: '遊戲成為封城期間的社交場所，非競技社交玩法確立為穩定類別。', tag: '文化' },
            { year: 2020, title: 'PS5 與 Xbox Series X／S 上市', text: 'SSD 串流大幅縮短載入時間，並讓無縫大世界成為可能。', tag: '技術' },
            { year: 2020, title: '《Hades》以搶先體驗模式獲獎', text: '三年開放開發、持續依玩家回饋調整，成為搶先體驗的正面典範。', tag: '產業' },
            { year: 2021, title: 'Steam Deck 發表', text: '把 PC 遊戲庫塞進掌機，重新打開「掌上 PC」這個一度失敗的品類。', tag: '硬體' },
            { year: 2022, title: '《艾爾登法環》與《Vampire Survivors》', text: '同年拿下大獎的一款是頂級 3A 開放世界，一款是一人開發的極簡割草。', tag: '里程碑' },
            { year: 2023, title: '《柏德之門 3》與 Unity 收費爭議', text: '前者證明深度 CRPG 仍有大眾市場；後者引發開發者對引擎信任的全面動搖。', tag: '產業' },
            { year: 2023, title: '產業大規模裁員開始', text: '疫情期間過度擴編後的修正，兩年內全球數萬名從業人員受影響。', tag: '產業' },
            { year: 2024, title: '《Balatro》《幻獸帕魯》《黑神話：悟空》', text: '一人開發的卡牌 Roguelike、爆紅的生存縫合作、中國首款國際級 3A 同年出現。', tag: '文化' },
            { year: 2024, title: 'Steam 要求揭露 AI 使用', text: '生成式 AI 的著作權與勞動爭議進入平台規範層級。', tag: '倫理' },
            { year: 2025, title: 'Nintendo Switch 2 上市', text: '在掌機 PC 與雲端串流競爭下，任天堂選擇延續混合形態的既有路線。', tag: '硬體' }
        ],

        lesson: {
            title: '設計課視角：《Vampire Survivors》拿掉了什麼',
            text: '它拿掉了攻擊鍵。角色自動攻擊，玩家只需要走位。' +
                  '這個決定釋放了玩家的全部注意力去做真正有趣的事：' +
                  '觀察敵人潮流、規劃升級組合、追求武器進化的組合技。' +
                  '也就是說，設計者辨識出「操作」不是這款遊戲的樂趣來源，' +
                  '於是果斷把它自動化。' +
                  '這是設計上最困難、也最有價值的判斷：' +
                  '**你的遊戲裡哪一部分只是慣例，而不是樂趣？** ' +
                  '敢拿掉那一部分，往往就是新類型誕生的時刻。'
        },

        games: [
            { slug: 'vampire_survivors', name: 'Vampire Survivors', zh: '吸血鬼倖存者', year: 2022, dev: 'poncle', platform: 'PC / 多平台', genre: '自動戰鬥 Roguelite',
              playable: true, remake: '月夜倖存者',
              why: '拿掉攻擊鍵，讓玩家專注在走位與組合。一人開發、低售價，卻拿下年度大獎。' },
            { slug: 'among_us', name: 'Among Us', zh: '我們之中', year: 2018, dev: 'InnerSloth', platform: '多平台', genre: '社交推理',
              playable: true, remake: '船艙裡的偽裝者',
              why: '2018 年上市、2020 年才爆紅，完全由實況主推動。證明「好看」有時比「好玩」更關鍵。' },
            { slug: 'fall_guys', name: 'Fall Guys', zh: '糖豆人', year: 2020, dev: 'Mediatonic', platform: '多平台', genre: '派對淘汰賽',
              playable: true, remake: '軟糖大亂鬥',
              why: '把大逃殺的淘汰結構套進無傷害的綜藝關卡，讓輸掉也很好笑，大幅降低情緒門檻。' },
            { slug: 'wordle', name: 'Wordle', zh: 'Wordle', year: 2021, dev: 'Josh Wardle', platform: '瀏覽器', genre: '文字推理',
              playable: true, remake: '字謎每日一題',
              why: '一天只能玩一次，且結果能用表情符號分享而不劇透。稀缺性與可分享性的完美設計。' },
            { slug: 'balatro', name: 'Balatro', zh: '小丑牌', year: 2024, dev: 'LocalThunk', platform: '多平台', genre: 'Roguelike 卡牌',
              playable: true, remake: '鬼牌賭局',
              why: '用人人都懂的撲克牌型當基礎，再疊上小丑牌的規則破壞，學習成本近乎為零。' },
            { slug: 'suika', name: 'Suika Game', zh: '西瓜遊戲', year: 2021, dev: 'Aladdin X', platform: 'Switch 等', genre: '物理合成',
              playable: true, remake: '果實合成塔',
              why: '2048 的合併規則加上物理堆疊，讓每次落點都同時是策略與運氣。' },
            { slug: 'hades_like', name: 'Hades', zh: '黑帝斯', year: 2020, dev: 'Supergiant Games', platform: '多平台', genre: 'Roguelike 動作',
              playable: true, remake: '冥河逃脫',
              why: '把「反覆死亡」寫進劇情本身——每次失敗都推進故事，解決了 Roguelike 的敘事難題。' },
            { slug: 'cozy_farm', name: 'Cozy Game 潮流', zh: '療癒系遊戲', year: 2020, dev: '多家獨立團隊', platform: '多平台', genre: '休閒模擬',
              playable: true, remake: '小島慢生活',
              why: '沒有失敗、沒有時間壓力。疫情後成為穩定類別，證明「放鬆」本身就是可販售的體驗。' },

            { slug: 'animal_crossing', name: 'Animal Crossing: New Horizons', zh: '集合啦！動物森友會', year: 2020, dev: 'Nintendo', platform: 'Switch', genre: '生活模擬',
              playable: false, why: '疫情期間被用來辦婚禮與畢典，遊戲第一次被大規模當作公共社交空間。' },
            { slug: 'elden_ring', name: 'Elden Ring', zh: '艾爾登法環', year: 2022, dev: 'FromSoftware', platform: '多平台', genre: '開放世界動作 RPG',
              playable: false, why: '把魂系的高難度放進開放世界，用「繞路」取代「調降難度」作為解方。' },
            { slug: 'bg3', name: "Baldur's Gate 3", zh: '柏德之門 3', year: 2023, dev: 'Larian Studios', platform: '多平台', genre: 'CRPG',
              playable: false, why: '極高自由度的敘事分歧，證明深度 CRPG 在 2020 年代仍有大眾市場。' },
            { slug: 'totk', name: 'The Legend of Zelda: Tears of the Kingdom', zh: '薩爾達傳說：王國之淚', year: 2023, dev: 'Nintendo', platform: 'Switch', genre: '開放世界',
              playable: false, why: '究極手組合系統讓玩家自由拼裝載具與武器，把設計權交給玩家。' },
            { slug: 'black_myth', name: 'Black Myth: Wukong', zh: '黑神話：悟空', year: 2024, dev: 'Game Science', platform: '多平台', genre: '動作 RPG',
              playable: false, why: '中國首款國際級 3A，證明非歐美日團隊也能撐起頂規製作與文化輸出。' },
            { slug: 'palworld', name: 'Palworld', zh: '幻獸帕魯', year: 2024, dev: 'Pocketpair', platform: 'PC / Xbox', genre: '生存開放世界',
              playable: false, why: '把蒐集寵物、生存建造與射擊縫合在一起，展現「類型混搭」的市場爆發力。' },
            { slug: 'stray', name: 'Stray', zh: '迷失', year: 2022, dev: 'BlueTwelve Studio', platform: '多平台', genre: '冒險解謎',
              playable: false, why: '扮演一隻貓的視角限制，反而創造出獨特的空間解讀與情感連結。' },
            { slug: 'astro_bot', name: 'Astro Bot', zh: '太空機器人', year: 2024, dev: 'Team Asobi', platform: 'PS5', genre: '3D 平台',
              playable: false, why: '把手把觸覺回饋做成核心體驗，是「硬體特性即設計」的當代最佳示範。' }
        ]
    }

    ];

    /* ----------------------------------------------------------------------
       已完成建置的可玩復刻清單。
       playable:true 代表「規劃為可玩」，BUILT 代表「檔案已經做好且通過測試」。
       兩者分開，網站才能誠實標示哪些還在製作中，而不會連到不存在的頁面。
       每完成一款就把 slug 加進這個清單。
       ---------------------------------------------------------------------- */
    var BUILT = [
        // 1970s
        'pong', 'space_invaders', 'breakout', 'asteroids',
        'galaxian', 'lunar_lander', 'blockade', 'tank_combat',
        // 1980s
        'pacman', 'tetris', 'super_mario', 'donkey_kong', 'frogger',
        'centipede', 'bomberman', 'bubble_bobble', 'dig_dug', 'battle_city', 'qbert',
        // 1990s
        'minesweeper', 'doom2d', 'street_fighter', 'sonic', 'lemmings', 'worms', 'prince', 'metal_slug', 'pipe_mania', 'solitaire',
        // 2000s
        'bejeweled', 'angry_birds', 'line_rider', 'pvz', 'meat_boy', 'helicopter', 'canabalt', 'doodle_jump', 'fancy_pants', 'age_of_war',
        // 2010s
        'flappy_bird', 'game_2048', 'celeste_like', 'into_breach', 'vvvvvv', 'super_hexagon', 'downwell', 'tiny_wings', 'crossy_road', 'slither',
        // 2020s
        'vampire_survivors', 'among_us', 'wordle', 'balatro', 'suika', 'hades_like', 'fall_guys', 'cozy_farm'
    ];

    // 建立索引，供頁面快速查表
    var BY_ID = {}, BY_SHORT = {}, ALL_GAMES = [];
    DECADES.forEach(function (d) {
        BY_ID[d.id] = d;
        BY_SHORT[d.short] = d;
        d.games.forEach(function (g) {
            g.decade = d.short;
            g.decadeId = d.id;
            g.built = g.playable && BUILT.indexOf(g.slug) !== -1;
            ALL_GAMES.push(g);
        });
    });

    global.GameDB = {
        decades: DECADES,
        byId: function (id) { return BY_ID[id]; },
        byShort: function (s) { return BY_SHORT[s]; },
        allGames: ALL_GAMES,
        playable: ALL_GAMES.filter(function (g) { return g.playable; }),
        built: ALL_GAMES.filter(function (g) { return g.built; }),
        stats: {
            decades: DECADES.length,
            games: ALL_GAMES.length,
            playable: ALL_GAMES.filter(function (g) { return g.playable; }).length,
            built: ALL_GAMES.filter(function (g) { return g.built; }).length,
            span: '1971 – 2025'
        },
        /** 取得該遊戲的可玩檔案路徑（相對於網站根目錄） */
        path: function (g) { return 'games/' + g.decade + '/' + g.slug + '.html'; }
    };

})(window);
