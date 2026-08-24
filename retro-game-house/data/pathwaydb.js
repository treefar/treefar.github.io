/* 七條跨年代設計演化線。每款只歸入一條「主學習線」，避免概念地圖重複灌水。 */
(function (global) {
    'use strict';

    var PATHWAYS = [
        {
            id: 'trajectory', icon: '◒', color: '#7dd3fc',
            title: '軌跡、動能與物理',
            headline: '輸入不是結果，而是讓物體進入一段可預測的運動。',
            question: '玩家能否從失敗軌跡，說出下一次要改角度、力道、時機還是支撐點？',
            slugs: ['pong', 'breakout', 'lunar_lander', 'worms', 'angry_birds', 'line_rider', 'helicopter', 'tiny_wings']
        },
        {
            id: 'movement', icon: '↗', color: '#ffd166',
            title: '移動、平台與節奏',
            headline: '同一個位移，因慣性、重力、落點與節拍變成不同技術。',
            question: '拿掉速度保存、落點預判或節奏窗口後，關卡是否只剩背景在移動？',
            slugs: ['donkey_kong', 'frogger', 'super_mario', 'sonic', 'prince', 'fancy_pants', 'doodle_jump', 'meat_boy', 'canabalt', 'flappy_bird', 'vvvvvv', 'downwell', 'celeste_like', 'crossy_road', 'fall_guys', 'super_hexagon']
        },
        {
            id: 'combat', icon: '✦', color: '#ff9ebb',
            title: '射擊、距離與戰鬥空間',
            headline: '命中只是表面，真正的決策是站在哪裡、先處理誰、何時暴露自己。',
            question: '如果玩家可以原地連射到底，場景的牆、距離、敵群形狀還有戰術意義嗎？',
            slugs: ['space_invaders', 'asteroids', 'galaxian', 'tank_combat', 'centipede', 'battle_city', 'street_fighter', 'doom2d', 'metal_slug', 'hades_like']
        },
        {
            id: 'space', icon: '⌗', color: '#70e4b5',
            title: '空間控制、路線與引導',
            headline: '玩家不只走過空間，也用尾巴、炸彈、地形與陷阱改寫別人的路。',
            question: '最好的動作是在直接追目標，還是在先創造一條對自己有利的路線？',
            slugs: ['pacman', 'blockade', 'qbert', 'dig_dug', 'bomberman', 'bubble_bobble', 'lemmings', 'pipe_mania', 'slither']
        },
        {
            id: 'combine', icon: '◇', color: '#c084fc',
            title: '排列、合併與組合成長',
            headline: '眼前得分會消耗未來空間，組合價值來自留下下一步。',
            question: '玩家是在追求單次最大收益，還是在維持能繼續組合的盤面結構？',
            slugs: ['tetris', 'bejeweled', 'game_2048', 'balatro', 'suika']
        },
        {
            id: 'information', icon: '?', color: '#a8d8f0',
            title: '資訊、推理與不確定性',
            headline: '每次行動先取得證據，再把未知縮成可以解釋的選擇。',
            question: '這次選擇是在找答案、排除答案，還是冒著資訊不足的風險下注？',
            slugs: ['minesweeper', 'solitaire', 'among_us', 'wordle', 'into_breach']
        },
        {
            id: 'growth', icon: '♧', color: '#a3e635',
            title: '資源、成長與長期配置',
            headline: '短期活下來只是起點，真正差異來自資源如何變成下一輪的能力。',
            question: '升級是在補現在的缺口，還是在建立之後會互相放大的系統？',
            slugs: ['age_of_war', 'pvz', 'vampire_survivors', 'cozy_farm']
        }
    ];

    var BY_ID = {};
    var BY_SLUG = {};
    PATHWAYS.forEach(function (pathway) {
        BY_ID[pathway.id] = pathway;
        pathway.slugs.forEach(function (slug) { BY_SLUG[slug] = pathway; });
    });

    global.PathwayDB = {
        all: PATHWAYS,
        get: function (id) { return BY_ID[id] || null; },
        forGame: function (slug) { return BY_SLUG[slug] || null; }
    };
})(window);

