// 架空校園怪異事件處理簿 — Screens
// All scene components. Exported to window for app.jsx to consume.

const { useState, useEffect, useRef, useMemo } = React;

/* ── Hook：打字機 ────────────────────────────────── */
function useTypewriter(text, speed = 28, deps = []) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setOut(""); setDone(false);
    if (!text) { setDone(true); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, deps); // eslint-disable-line
  return [out, done];
}

/* ── 系統 bar ────────────────────────────────── */
function SysBar({ caseId, time = "2026/05/07 22:14:08" }) {
  const [t, setT] = useState(time);
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setT(`2026/05/07 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="sysbar">
      <div className="left">
        <span className="brand">架空校園怪異事件處理簿 <span className="x">[X]</span></span>
        <span>SESSION {caseId || "—"}</span>
        <span><span className="dot" /> 連線安全</span>
      </div>
      <div className="right">
        <span>OP-LV.04</span>
        <span>處理員 #047</span>
        <span>{t} GMT+8</span>
      </div>
    </div>
  );
}

/* ── 1. 開機 / 標題 ──────────────────────────────── */
function BootScreen({ onEnter }) {
  const lines = [
    "[ OK ] 安全外殼已掛載 /dev/sda1",
    "[ OK ] 載入民俗檔案資料庫 ... 4,217 件",
    "[ .. ] 校驗處理式樣本 ............",
    "[ OK ] 同步架空校園『不可說』條款 v3.7",
    "[ !! ] 偵測到校區訊號異常:設計大樓 6F",
    "[ OK ] 處理員身分驗證：#047",
  ];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= lines.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 220);
    return () => clearTimeout(id);
  }, [shown]);
  const ready = shown >= lines.length;

  return (
    <div className="scene" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div className="hud-corner tl" /><div className="hud-corner tr" />
      <div className="hud-corner bl" /><div className="hud-corner br" />

      <div style={{ marginBottom: 24 }}>
        <div className="t-tag" style={{ marginBottom: 12 }}>EST. 1987 · 架空世界登錄 #027</div>
        <div className="t-display glitch animate" data-text="架空校園怪異事件處理簿"
             style={{ fontSize: "5.4rem", lineHeight: 1, color: "var(--ink-0)" }}>
          架空校園怪異事件處理簿
        </div>
        <div className="t-display" style={{ fontSize: "1.4rem", color: "var(--ink-2)", marginTop: 14, letterSpacing: "0.3em" }}>
          CAMPUS PARANORMAL CASEBOOK
        </div>
      </div>

      <div className="t-mono" style={{
        textAlign: "left", width: 520, fontSize: "0.78rem",
        color: "var(--neon)", lineHeight: 1.9, opacity: 0.85,
      }}>
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} className="fade-in">{l}</div>
        ))}
        {!ready && <div className="caret">&nbsp;</div>}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 36, opacity: ready ? 1 : 0.3, transition: "opacity 0.4s" }}>
        <button className="btn primary" disabled={!ready} onClick={onEnter}>
          ▶ 開始今日勤務
        </button>
        <button className="btn ghost" disabled={!ready} onClick={() => onEnter && window.dispatchEvent(new CustomEvent("nav-archive"))}>檔案室</button>
        <button className="btn ghost" disabled={!ready} onClick={() => onEnter && window.dispatchEvent(new CustomEvent("nav-settings"))}>設定</button>
      </div>

      <div style={{ position: "absolute", bottom: 32, left: 48, right: 48,
                    display: "flex", justifyContent: "space-between",
                    fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--ink-3)", letterSpacing: "0.2em" }}>
        <span>// BUILD 2.7.4-RC // 架空世界檔案局・特約</span>
        <span>// 本系統不對使用者承諾任何結果</span>
      </div>
    </div>
  );
}

/* ── 2. 案件選擇 ──────────────────────────────── */
function CasesScreen({ onPickCase }) {
  const [hover, setHover] = useState(null);
  return (
    <>
      <div className="scene" style={{ paddingTop: 20, gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="t-tag">ASSIGNMENTS · 委 託 列 表</div>
            <div className="t-display" style={{ fontSize: "2.4rem", color: "var(--ink-0)", marginTop: 4 }}>
              今日案件 <span style={{ color: "var(--blood-glow)" }}>04</span>
              <span style={{ color: "var(--ink-3)", fontSize: "1.2rem", marginLeft: 16 }}>/ 待領 02 · 進行中 01 · 凍結 01</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="chip">過濾：全部</span>
            <span className="chip">排序：危險度</span>
            <span className="chip live">連線中</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1, minHeight: 0, overflow: "auto", paddingRight: 4 }}>
          {window.CASE_DATA.cases.map((c, i) => (
            <div key={c.id}
                 onMouseEnter={() => setHover(c.id)}
                 onMouseLeave={() => setHover(null)}
                 onClick={() => c.status !== "已結案" && onPickCase(c)}
                 className="dossier"
                 style={{
                   cursor: c.status !== "已結案" ? "pointer" : "not-allowed",
                   borderColor: hover === c.id ? "var(--neon)" : "var(--line)",
                   boxShadow: hover === c.id ? "0 0 0 1px var(--neon-deep), 0 6px 24px rgba(0,0,0,0.5)" : "none",
                   transition: "all 0.18s",
                   opacity: c.status === "已結案" ? 0.5 : 1,
                 }}>
              <div className="dossier-h">
                <span>檔案 {c.id}</span>
                <span style={{ display: "flex", gap: 8 }}>
                  <span className="chip" style={{ background: "transparent" }}>等級 {c.level}</span>
                  {c.status === "高危・凍結" && <span className="chip danger"><span className="dot danger" /> {c.status}</span>}
                  {c.status === "受理中" && <span className="chip live">{c.status}</span>}
                  {c.status === "待分派" && <span className="chip warn">{c.status}</span>}
                  {c.status === "已結案" && <span className="chip">{c.status}</span>}
                </span>
              </div>
              <div className="dossier-b" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="t-display" style={{ fontSize: "1.7rem", color: "var(--ink-0)" }}>{c.title}</div>
                    <div className="t-tag" style={{ marginTop: 4 }}>{c.district}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="t-tag">報酬</div>
                    <div className="t-mono" style={{ color: "var(--neon)", fontSize: "1.1rem" }}>NT$ {c.reward.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{
                  fontFamily: "var(--display, var(--serif))",
                  fontSize: "1.05rem",
                  color: "var(--ink-1)",
                  lineHeight: 1.65,
                  borderLeft: "2px solid var(--blood-deep)",
                  paddingLeft: 12,
                  fontStyle: "italic",
                }}>
                  「{c.excerpt}」
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--ink-1)", lineHeight: 1.6 }}>
                  {c.summary}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {c.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
                  </div>
                  {c.status !== "已結案" && (
                    <span className="t-mono" style={{ color: c.id === "C-073" ? "var(--neon)" : "var(--ink-2)", fontSize: "0.7rem", letterSpacing: "0.16em" }}>
                      ▶ {c.id === "C-073" ? "完整 demo" : "預覽（雛型）"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── 2.5 Stub case preview（non-C-073 案件雛型預覽） ──── */
function StubCaseScreen({ caseInfo, onBack }) {
  const c = caseInfo;
  // each case gets a flavor preview: planned scenes + first-line teaser
  const previewByCase = {
    "C-074": {
      teaser: "電梯按鈕 8 按下去會亮，但門不會開。倒數 3 秒後它會自己熄滅。",
      planned: [
        "宿舍樓層平面圖（互動點擊）",
        "舍監吳先生的訪談錄音",
        "歷屆 IG 限動 timeline 比對",
        "處理式：『樓層・歸位』",
      ],
      vibe: "建築學 + 都市考古",
    },
    "C-068": {
      teaser: "阿姨記得每個學生的名字，包括 1999 年那批 —— 但她說她當時還沒在這裡賣。",
      planned: [
        "校門口環景（夜 / 日 雙模式）",
        "27 年校友證詞拼貼",
        "紅茶冰成分分析（民俗版）",
        "高危案件・暫不開放執行",
      ],
      vibe: "高危 / 凍結中",
      locked: true,
    },
    "C-061": {
      teaser: "幹部合照 13 + 1。多出來那個人在所有照片裡都站在最後一排第三個位置。",
      planned: [
        "合照逐張比對（拖移放大）",
        "迎新活動行程回顧",
        "已結案・本案僅供存檔閱覽",
      ],
      vibe: "已結案・存檔",
    },
  };
  const meta = previewByCase[c.id] || { teaser: c.excerpt, planned: ["雛型尚未建置"], vibe: "—" };

  return (
    <div className="scene" style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">CASE {c.id} · 案件雛型預覽</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            {c.title}
          </div>
        </div>
        <span className={"chip " + (meta.locked ? "danger" : "warn")}>
          {meta.locked ? "⚠ 高危・尚未開放" : "▍ 雛型・內容開發中"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, minHeight: 0 }}>
        {/* Teaser dossier */}
        <div className="dossier" style={{ display: "flex", flexDirection: "column" }}>
          <div className="dossier-h"><span>案情速覽</span><span>TEASER</span></div>
          <div style={{ padding: 26, flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{
              fontFamily: "var(--display, var(--serif))",
              fontSize: "1.4rem",
              lineHeight: 1.85,
              color: "var(--ink-0)",
              borderLeft: "3px solid var(--blood)",
              paddingLeft: 18,
              fontStyle: "italic",
            }}>
              「{meta.teaser}」
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--ink-1)", lineHeight: 1.75 }}>
              {c.summary}
            </div>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", gap: 24 }}>
              <div>
                <div className="t-tag">委託人</div>
                <div style={{ color: "var(--ink-0)", fontSize: "0.95rem", marginTop: 4 }}>{c.client}</div>
              </div>
              <div>
                <div className="t-tag">地點</div>
                <div style={{ color: "var(--ink-0)", fontSize: "0.95rem", marginTop: 4 }}>{c.district}</div>
              </div>
              <div>
                <div className="t-tag">分類</div>
                <div style={{ color: "var(--neon)", fontSize: "0.95rem", marginTop: 4 }}>{meta.vibe}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Planned content */}
        <div className="dossier" style={{ display: "flex", flexDirection: "column" }}>
          <div className="dossier-h"><span>計畫內容</span><span>SCENES</span></div>
          <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {meta.planned.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px",
                border: "1px solid var(--line)",
                background: "var(--bg-2)",
              }}>
                <span className="t-mono" style={{ color: "var(--ink-2)", fontSize: "0.78rem", letterSpacing: "0.16em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, color: "var(--ink-1)", fontSize: "0.92rem" }}>{p}</span>
                <span className="t-mono" style={{ color: "var(--ink-3)", fontSize: "0.7rem" }}>WIP</span>
              </div>
            ))}
            <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div className="t-tag" style={{ marginBottom: 6 }}>建議：</div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                {meta.locked
                  ? "本案件涉及未結案的中央級異常，需上級書面授權才能開啟調查介面。"
                  : "完整流程目前以 C-073「系主任不是人」為樣板。其他案件以本介面預覽即可。"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="t-mono" style={{ color: "var(--ink-3)", fontSize: "0.74rem", letterSpacing: "0.18em" }}>
          ▍ 本案件為遊戲風格模版的延伸雛型，僅供結構展示
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost" onClick={onBack}>◀ 返回案件列表</button>
          <button className="btn" onClick={() => alert("此功能屬於完整版企劃。\n本雛型僅供視覺與流程展示。")}>申請開發完整流程</button>
        </div>
      </div>
    </div>
  );
}


/* ── 2.7 Prologue（系主任不是人 — 序章橋段） ──────────── */
function PrologueScreen({ onContinue }) {
  const beats = [
    { tag: "夜・22:30", line: "那天晚上十點半，系辦的燈還亮著。" },
    { tag: "設計大樓 6F", line: "整棟設計大樓只剩下影印機偶爾發出「喀、喀、喀」的聲音。" },
    { tag: "工讀生・小庭", line: "值班工讀生小庭本來以為是老師忘了關機，走近一看 ——" },
    { tag: "▍ 影印機", line: "影印機正在自己吐紙。", emphasis: true },
    { tag: "張 1 / 3", line: "第一張，是明天的會議議程。" },
    { tag: "張 2 / 3", line: "第二張，是下週的招生分工表。" },
    { tag: "張 3 / 3", line: "第三張，是一份還沒有人討論過的課程調整案。" },
    { tag: "異常", line: "每一張紙的右下角，都已經蓋好了系主任的章。", emphasis: true },
    { tag: "下午 17:02 · 主任原話", line: "「我今天真的要早點回家。」", quoted: true },
    { tag: "門縫", line: "系主任辦公室的門縫裡透出一點綠光。" },
    { tag: "光源辨識", line: "不是螢幕的光，也不是手機的光。像老舊伺服器快要燒起來的光。", warn: true },
    { tag: "監聽 · 低頻", line: "「招生人數……不足……」", quoted: true },
    { tag: "監聽 · 低頻", line: "「評鑑資料……未補齊……」", quoted: true },
    { tag: "監聽 · 低頻", line: "「教師績效……尚未填報……」", quoted: true },
    { tag: "監聽 · 低頻", line: "「系務會議……需再加開一次……」", quoted: true },
    { tag: "▍", line: "那聲音不是一個人發出來的。", emphasis: true },
    { tag: "比對", line: "比較像很多台印表機、很多封未讀郵件、很多個行政系統，同時在學一個人的語氣說話。" },
    { tag: "事件", line: "小庭倒退一步，踩到地上的紙箱。" },
    { tag: "事件", line: "門，自己開了。", emphasis: true },
    { tag: "目視", line: "系主任坐在辦公桌後面，背對著他。肩膀微微抽動，像是在哭，又像是在笑。" },
    { tag: "小庭", line: "「主任……你還沒回去喔？」", quoted: true },
    { tag: "事件", line: "椅子，慢慢轉過來。" },
    { tag: "目視", line: "系主任的臉很正常，甚至還帶著平常那種溫和又疲憊的笑。" },
    { tag: "▍ 異常", line: "只是他的眼睛裡，倒映的不是小庭。", emphasis: true },
    { tag: "▍ 異常", line: "而是一整排 Excel 表格。", emphasis: true, warn: true },
    { tag: "系主任", line: "「小庭，你相信嗎？」", quoted: true },
    { tag: "系主任", line: "「有些人當上系主任以後……就不能算人了。」", quoted: true, warn: true },
    { tag: "系主任", line: "「剛好你還在，幫我把這三份掃成 PDF，檔名照格式改一下，然後傳到群組。」", quoted: true },
    { tag: "文件", line: "最上面那張紙的標題寫著：" },
    { tag: "▍ 表格", line: "《本系異常事件處理紀錄表》", emphasis: true },
    { tag: "填表人欄位", line: "早就寫好了他的名字。", warn: true },
    { tag: "門外 · 影印機", line: "喀。喀。喀。" },
    { tag: "新公告", line: "「明日起，系辦不得於午夜後直視主任。」", quoted: true, warn: true },
  ];

  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState("");
  const [done, setDone] = useState(false);
  const cur = beats[i];

  useEffect(() => {
    setRevealed(""); setDone(false);
    let n = 0;
    const speed = cur.quoted ? 55 : 38;
    const id = setInterval(() => {
      n++;
      setRevealed(cur.line.slice(0, n));
      if (n >= cur.line.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [i]);

  const next = () => {
    if (!done) { setRevealed(cur.line); setDone(true); return; }
    if (i < beats.length - 1) setI(i + 1);
    else onContinue();
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 900);
    return () => clearInterval(id);
  }, []);

  const progress = ((i + 1) / beats.length) * 100;

  return (
    <div className="scene" onClick={next} style={{
      cursor: "pointer", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 24, padding: "32px 8px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="t-tag" style={{ color: "var(--blood-glow)" }}>PROLOGUE · 序 章</div>
          <div className="t-display" style={{ fontSize: "1.4rem", color: "var(--ink-0)", marginTop: 4 }}>
            設計大樓 6F · 系辦深夜
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span className="t-mono" style={{ color: "var(--ink-2)", fontSize: "0.72rem", letterSpacing: "0.18em" }}>
            {String(i + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")}
          </span>
          <div style={{ width: 220, height: 2, background: "var(--line)" }}>
            <div style={{ width: progress + "%", height: "100%", background: "var(--blood)", transition: "width .35s" }} />
          </div>
        </div>
      </div>

      <div style={{
        position: "relative", border: "1px solid var(--line)",
        background: "radial-gradient(circle at 50% 60%, rgba(45,255,138,0.04), transparent 60%), var(--bg-1)",
        overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1.6fr",
      }}>
        <div style={{
          borderRight: "1px solid var(--line)", padding: 24,
          display: "flex", flexDirection: "column", gap: 18,
          fontFamily: "var(--mono)", color: "var(--ink-2)", fontSize: "0.74rem",
        }}>
          <div>
            <div className="t-tag">場景</div>
            <pre style={{ margin: "8px 0 0", color: "var(--ink-1)", fontSize: "0.7rem", lineHeight: 1.45 }}>{
`┌──────────────┐
│ 影 印 機      │
│ ┌──────────┐ │
│ │           │ │
│ │  ${tick % 2 === 0 ? "▮▮▮▮ " : "▯▯▯▯ "}     │ │
│ │           │ │
│ └──────────┘ │
│   ⚙   ⚙   ⚙   │
└──────────────┘`
            }</pre>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div className="t-tag">門縫・光源</div>
            <div style={{ marginTop: 8, height: 70, position: "relative", background: "#0a0c0b", overflow: "hidden", border: "1px solid var(--line)" }}>
              <div style={{
                position: "absolute", left: "50%", top: 0, bottom: 0, width: 4,
                background: "linear-gradient(180deg, transparent 0%, #2dff8a 30%, #2dff8a 70%, transparent 100%)",
                boxShadow: "0 0 18px #2dff8a, 0 0 36px #2dff8a",
                transform: "translateX(-50%)",
                opacity: i >= 9 ? 1 : 0.25, transition: "opacity .8s",
                animation: i >= 9 ? "flicker-door 2.4s infinite" : "none",
              }} />
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div className="t-tag">音檔・低頻</div>
            <div style={{ display: "flex", gap: 3, marginTop: 8, alignItems: "flex-end", height: 32 }}>
              {Array.from({ length: 18 }).map((_, k) => (
                <div key={k} style={{
                  width: 4,
                  height: ((Math.sin((tick + k) * 0.7) + 1) * 12 + 6) + "px",
                  background: "var(--blood)", opacity: 0.55 + (k % 3) * 0.15,
                }} />
              ))}
            </div>
          </div>
          <style>{`@keyframes flicker-door { 0%, 100% { opacity: 1; } 45% { opacity: 0.4; } 48% { opacity: 1; } 52% { opacity: 0.6; } }`}</style>
        </div>

        <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <div className="t-tag" style={{
            color: cur.warn ? "var(--blood-glow)" : "var(--neon)",
            fontSize: "0.74rem", letterSpacing: "0.22em",
          }}>▍ {cur.tag}</div>
          <div style={{
            fontFamily: "var(--display, var(--serif))",
            fontSize: cur.emphasis ? "2.1rem" : cur.quoted ? "1.4rem" : "1.55rem",
            lineHeight: 1.7,
            color: cur.warn ? "var(--blood-glow)" : "var(--ink-0)",
            fontWeight: cur.emphasis ? 700 : 500,
            fontStyle: cur.quoted ? "italic" : "normal",
            textShadow: cur.warn ? "0 0 14px rgba(255,90,90,0.32)" : "none",
            minHeight: "5.5em",
            borderLeft: cur.quoted ? "3px solid var(--neon-deep)" : "none",
            paddingLeft: cur.quoted ? 18 : 0,
          }}>
            {revealed}
            <span style={{
              display: "inline-block", width: "0.55em", height: "1.05em",
              background: "var(--ink-0)", verticalAlign: "-0.15em", marginLeft: 4,
              opacity: done ? (Math.floor(tick) % 2 === 0 ? 1 : 0) : 0.85,
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="t-mono" style={{ color: "var(--ink-3)", fontSize: "0.72rem", letterSpacing: "0.18em" }}>
          ▍ 點擊任意處繼續{!done && " · 再點一次跳過打字"}
        </span>
        <button className="btn ghost" onClick={(e) => { e.stopPropagation(); onContinue(); }}>
          跳過序章 ▶
        </button>
      </div>
    </div>
  );
}

function DialogueScreen({ onPickChoice, onAdvance }) {
  const data = window.CASE_DATA.case;
  const [idx, setIdx] = useState(0);
  const cur = data.intro[idx];
  const [text, done] = useTypewriter(cur?.text || "", 24, [idx]);
  const isEnd = idx >= data.intro.length - 1;
  const showChoices = isEnd && done;

  const next = () => {
    if (!done) return;
    if (idx < data.intro.length - 1) setIdx(idx + 1);
  };

  return (
    <div className="scene" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gridTemplateRows: "auto 1fr auto", gap: 18 }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">CASE {data.id || "C-073"} · 接案訪談</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            {data.title}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="chip"><span className="dot" /> 錄音中</span>
          <span className="chip live">DIALOGUE</span>
        </div>
      </div>

      {/* 對話主區 */}
      <div className="dossier" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="dossier-h">
          <span>會談紀錄 / TRANSCRIPT</span>
          <span>{idx + 1} / {data.intro.length}</span>
        </div>
        <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
          {data.intro.slice(0, idx + 1).map((line, i) => (
            <div key={i} className="fade-in" style={{
              display: "flex", flexDirection: "column", gap: 6,
              alignSelf: line.isPlayer ? "flex-end" : "flex-start",
              maxWidth: "75%",
            }}>
              <div className="t-tag" style={{
                color: line.isPlayer ? "var(--neon)" : "var(--blood-glow)",
                textAlign: line.isPlayer ? "right" : "left",
              }}>
                ▍{line.speaker}
              </div>
              <div style={{
                fontFamily: "var(--display, var(--serif))",
                fontSize: line.emphasis ? "1.5rem" : "1.2rem",
                lineHeight: 1.7,
                color: line.emphasis ? "var(--blood-glow)" : "var(--ink-0)",
                fontStyle: line.emphasis ? "italic" : "normal",
                padding: "10px 14px",
                background: line.isPlayer ? "rgba(45,255,138,0.05)" : "var(--bg-2)",
                borderLeft: line.isPlayer ? 0 : "2px solid " + (line.emphasis ? "var(--blood)" : "var(--line-2)"),
                borderRight: line.isPlayer ? "2px solid var(--neon-deep)" : 0,
              }}>
                {i === idx ? <span>{text}{!done && <span className="caret">&nbsp;</span>}</span> : line.text}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          padding: "10px 18px", borderTop: "1px solid var(--line)",
          display: "flex", justifyContent: "space-between",
          fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--ink-2)", letterSpacing: "0.16em",
        }}>
          <span>{showChoices ? "選擇下一步詢問 ⤵" : "繼續會談"}</span>
          {!showChoices && (
            <span style={{ color: done ? "var(--neon)" : "var(--ink-3)" }}>
              {done ? "▶ 點擊空白處或按 SPACE 繼續" : "…"}
            </span>
          )}
        </div>
      </div>

      {/* 委託人 side */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="dossier" style={{ padding: 0 }}>
          <div className="dossier-h"><span>受訪者</span><span>SUBJECT</span></div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="bracketed" style={{
              aspectRatio: "1 / 1", background:
                "linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}>
              <span className="bk-bl" /><span className="bk-br" />
              <div style={{ fontSize: "5rem", filter: "grayscale(0.6)", opacity: 0.85 }}>👤</div>
            </div>
            <div>
              <div className="t-display" style={{ fontSize: "1.2rem", color: "var(--ink-0)" }}>{data.intro[0].speaker.split("・")[1] || data.intro[0].speaker}</div>
              <div className="t-tag" style={{ marginTop: 2 }}>女 · 21 · 大三生（人文學院）</div>
            </div>
            <div style={{ fontSize: "0.84rem", color: "var(--ink-1)", lineHeight: 1.6, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              情緒：高度焦慮・夾雜怨氣。<br/>
              觀察：書包側袋有兩本《大學國文》，封面被原子筆寫過「陳教授去吃屎」並用立可白塗掉。
            </div>
          </div>
        </div>

        <div className="dossier" style={{ padding: 0 }}>
          <div className="dossier-h"><span>環境讀數</span><span>ENV</span></div>
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["陰氣", "偏高", "danger"],
              ["EMF", "12.4", "warn"],
              ["氣溫", "21.6°C", ""],
              ["濕度", "76%", ""],
            ].map(([k, v, t]) => (
              <div key={k}>
                <div className="t-tag">{k}</div>
                <div className="t-mono" style={{
                  fontSize: "1.1rem",
                  color: t === "danger" ? "var(--blood-glow)" : t === "warn" ? "var(--amber)" : "var(--ink-0)",
                  marginTop: 2,
                }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部選項 */}
      <div style={{ gridColumn: "1 / -1", minHeight: 78 }}>
        {showChoices ? (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {data.choices.map((c, i) => (
              <button key={c.id} className="btn"
                      onClick={() => onPickChoice(c)}
                      style={{ textAlign: "left", padding: "16px 18px", height: "100%", textTransform: "none", letterSpacing: "0.02em", fontSize: "0.92rem", fontFamily: "var(--display, var(--serif))" }}>
                <div className="t-tag" style={{ marginBottom: 6, color: "var(--neon)" }}>選項 {String.fromCharCode(65 + i)}</div>
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div onClick={next} style={{
            height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px dashed var(--line-2)", cursor: done ? "pointer" : "default",
            color: "var(--ink-2)", fontFamily: "var(--mono)", fontSize: "0.78rem", letterSpacing: "0.18em",
          }}>
            {done ? "▶ 繼續" : "傾聽中…"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 4. 證據檢視 ──────────────────────────────── */
function EvidenceScreen({ onAdvance }) {
  const evi = window.CASE_DATA.case.evidence;
  const [sel, setSel] = useState(evi[0]);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [uv, setUv] = useState(false);
  return (
    <div className="scene" style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", gridTemplateRows: "auto 1fr", gap: 18 }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">EVIDENCE LOCKER · 證 物 庫</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            物件檢視 <span className="t-mono" style={{ fontSize: "1rem", color: "var(--ink-2)" }}>· 4 件已歸檔</span>
          </div>
        </div>
        <button className="btn primary" onClick={onAdvance}>進入論壇情報 ▶</button>
      </div>

      {/* 列表 */}
      <div className="dossier" style={{ overflow: "auto" }}>
        <div className="dossier-h"><span>清單</span><span>{evi.length}</span></div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {evi.map((e) => (
            <div key={e.id} onClick={() => { setSel(e); setRotation(0); }}
                 style={{
                   padding: "12px 14px",
                   borderBottom: "1px solid var(--line)",
                   borderLeft: sel.id === e.id ? "3px solid var(--neon)" : "3px solid transparent",
                   background: sel.id === e.id ? "var(--bg-2)" : "transparent",
                   cursor: "pointer",
                   display: "flex", gap: 12, alignItems: "center",
                 }}>
              <div style={{ fontSize: "1.6rem" }}>{e.thumb}</div>
              <div style={{ flex: 1 }}>
                <div className="t-mono" style={{ fontSize: "0.7rem", color: "var(--ink-2)", letterSpacing: "0.16em" }}>{e.id}</div>
                <div style={{ fontSize: "0.92rem", color: "var(--ink-0)", marginTop: 2 }}>{e.name}</div>
              </div>
              {e.anomaly === "高" && <span className="dot danger" />}
            </div>
          ))}
        </div>
      </div>

      {/* 主檢視 */}
      <div className="dossier slide-in" key={sel.id} style={{ display: "flex", flexDirection: "column" }}>
        <div className="dossier-h">
          <span>{sel.id} · {sel.name}</span>
          <span style={{ display: "flex", gap: 12 }}>
            <span>類型 {sel.type}</span>
            <span style={{ color: sel.anomaly === "高" ? "var(--blood-glow)" : "var(--amber)" }}>異常 {sel.anomaly}</span>
          </span>
        </div>
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, position: "relative", background: "radial-gradient(ellipse at center, var(--bg-2) 0%, var(--bg-1) 100%)" }}>
          <div className="bracketed" style={{
            width: 280, height: 280,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg-3)",
            transform: `rotate(${rotation}deg) scale(${zoom ? 1.25 : 1})`,
            transition: "transform 0.4s cubic-bezier(.4,0,.2,1)",
            filter: uv ? "hue-rotate(220deg) saturate(2) brightness(1.1)" : "none",
          }}>
            <span className="bk-bl" /><span className="bk-br" />
            <div style={{ fontSize: "9rem", filter: uv ? "drop-shadow(0 0 22px #a855f7)" : "drop-shadow(0 0 18px rgba(45,255,138,0.3))" }}>{sel.thumb}</div>
            {uv && (
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.18), transparent 70%)", pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: "30%", left: "20%", color: "#e879f9", fontSize: "0.7rem", fontFamily: "var(--mono)", letterSpacing: "0.12em", textShadow: "0 0 8px #d946ef" }}>
                  ⌗ 隱形指紋・3 處
                </div>
                <div style={{ position: "absolute", bottom: "22%", right: "18%", color: "#e879f9", fontSize: "0.66rem", fontFamily: "var(--mono)", textShadow: "0 0 6px #d946ef" }}>
                  ⌖ 殘留有機物
                </div>
              </div>
            )}
            {/* scanner sweep */}
            <div style={{
              position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
            }}>
              <div style={{
                position: "absolute", left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, var(--neon), transparent)",
                boxShadow: "0 0 12px var(--neon)",
                animation: "scan-sweep 2.4s linear infinite",
              }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setRotation((r) => r - 90)}>↶ 旋轉</button>
            <button className="btn" onClick={() => setRotation((r) => r + 90)}>↷ 旋轉</button>
            <button className={"btn" + (zoom ? " primary" : "")} onClick={() => setZoom(z => !z)}>＋ 放大</button>
            <button className={"btn" + (uv ? " primary" : "")} onClick={() => setUv(u => !u)}>UV 燈</button>
          </div>
        </div>
        <style>{`@keyframes scan-sweep { 0% { top: -10%; } 100% { top: 110%; } }`}</style>
      </div>

      {/* 旁白 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
        <div className="dossier">
          <div className="dossier-h"><span>處理員筆記</span><span>NOTES</span></div>
          <div style={{ padding: 16, fontSize: "0.92rem", color: "var(--ink-1)", lineHeight: 1.75,
                        fontFamily: "var(--display, var(--serif))" }}>
            {sel.notes}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sel.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        </div>

        <div className="dossier">
          <div className="dossier-h"><span>關聯</span><span>LINKS</span></div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: "0.85rem" }}>
            {evi.filter((e) => e.id !== sel.id).slice(0, 2).map((e) => (
              <div key={e.id} onClick={() => setSel(e)}
                   style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 10px", border: "1px solid var(--line)", cursor: "pointer", color: "var(--ink-1)" }}>
                <span>{e.thumb} {e.name}</span>
                <span className="t-mono" style={{ fontSize: "0.7rem", color: "var(--ink-2)" }}>→ {e.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 5. 論壇 ──────────────────────────────── */
function ForumScreen({ onAdvance }) {
  const f = window.CASE_DATA.case.forum;
  const [open, setOpen] = useState(0);
  return (
    <div className="scene" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gridTemplateRows: "auto 1fr auto", gap: 18 }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">OSINT · 公 開 情 報 蒐 集</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            論壇 / 都市記憶
          </div>
        </div>
        <span className="chip warn">⚠ 內容未經查證</span>
      </div>

      <div className="dossier" style={{ overflow: "auto" }}>
        <div className="dossier-h"><span>搜尋結果</span><span>"架空校園 + 系主任"</span></div>
        {f.map((p, i) => (
          <div key={i} onClick={() => setOpen(i)} style={{
            padding: "14px 16px", borderBottom: "1px solid var(--line)",
            cursor: "pointer",
            background: open === i ? "var(--bg-2)" : "transparent",
            borderLeft: open === i ? "3px solid var(--blood)" : "3px solid transparent",
          }}>
            <div className="t-tag" style={{ color: "var(--blood-glow)" }}>{p.board}</div>
            <div style={{ fontSize: "0.98rem", color: "var(--ink-0)", marginTop: 4, fontWeight: 500 }}>{p.title}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 6,
                          fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--ink-2)", letterSpacing: "0.12em" }}>
              <span>@{p.author}</span><span>•</span><span>{p.time}</span><span>•</span><span>{p.replies} 回應</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dossier slide-in" key={open} style={{ display: "flex", flexDirection: "column" }}>
        <div className="dossier-h">
          <span>{f[open].board}</span>
          <span>★ 已標記</span>
        </div>
        <div style={{ padding: 22, flex: 1, overflow: "auto" }}>
          <div className="t-display" style={{ fontSize: "1.5rem", color: "var(--ink-0)" }}>{f[open].title}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8,
                        fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--ink-2)", letterSpacing: "0.14em" }}>
            <span>@{f[open].author}</span><span>{f[open].time}</span>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14,
                        fontFamily: "var(--display, var(--serif))",
                        fontSize: "1.05rem", color: "var(--ink-1)", lineHeight: 1.85 }}>
            <p>{f[open].excerpt}</p>
            <p style={{ color: "var(--ink-2)" }}>下面樓回應 #142 自稱霧港在地：「那場研討會我聽過。地點根本不是學術單位，是虛構校門路後山一座被廢掉的派出所。」</p>
            <p style={{ color: "var(--ink-2)" }}>下面樓回應 #287：「拜託各位學弟妹千萬不要修他的通識課。聽說期末會多一道題：『請以 200 字描述你最熟悉的人。』寫完的同學期末隔天就會請病假。」</p>
            <p style={{ color: "var(--ink-3)" }}>—— 原文已被刪除，以下為 archive.tw 鏡射頁面</p>
          </div>
        </div>
        <div style={{
          padding: "12px 18px", borderTop: "1px solid var(--line)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span className="t-tag">↳ 採信度自評：中</span>
          <button className="btn" onClick={onAdvance}>歸檔 ▶</button>
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
        {["#架空校園", "#系主任", "#陳教授", "#影印機", "#邊境民俗田野", "#All_Pass"].map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── 6. LINE 風 chat ──────────────────────────────── */
function ChatScreen({ onAdvance }) {
  const data = window.CASE_DATA.case.chat;
  const [shown, setShown] = useState(1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (shown >= data.messages.length) return;
    setTyping(true);
    const id = setTimeout(() => {
      setTyping(false);
      setShown((s) => s + 1);
    }, 1200);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className="scene" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gridTemplateRows: "auto 1fr", gap: 18 }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">REAL-TIME · 私 訊 監 聽</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            訊息 / {data.contact}
          </div>
        </div>
        <span className="chip danger"><span className="dot danger" /> 訊號異常</span>
      </div>

      {/* phone-like chat */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch" }}>
        <div style={{
          width: 420,
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          display: "flex", flexDirection: "column",
          boxShadow: "0 18px 60px rgba(0,0,0,0.6), inset 0 0 0 1px var(--line)",
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid var(--line)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "var(--bg-1)",
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-3)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>👤</div>
              <div>
                <div style={{ color: "var(--ink-0)", fontSize: "0.92rem" }}>{data.contact}</div>
                <div className="t-mono" style={{ fontSize: "0.66rem", color: "var(--blood-glow)", letterSpacing: "0.14em" }}>
                  ▍最後上線：剛剛
                </div>
              </div>
            </div>
            <span className="t-mono" style={{ fontSize: "0.7rem", color: "var(--ink-2)" }}>⋯</span>
          </div>

          <div style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, overflow: "auto", background:
                        "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)" }}>
            <div style={{ alignSelf: "center" }} className="t-mono"
                 style={{ alignSelf: "center", fontSize: "0.66rem", color: "var(--ink-3)", letterSpacing: "0.16em", margin: "8px 0 4px" }}>
              ── 2026/05/07 ──
            </div>
            {data.messages.slice(0, shown).map((m, i) => {
              const me = m.from === "我";
              return (
                <div key={i} className="fade-in" style={{
                  display: "flex", flexDirection: "column",
                  alignItems: me ? "flex-end" : "flex-start",
                  gap: 2,
                }}>
                  {!me && i === 0 && <div className="t-tag" style={{ marginBottom: 2 }}>{m.from}</div>}
                  <div style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    background: me ? "var(--neon-deep)" : (m.emphasis ? "var(--blood-deep)" : "var(--bg-3)"),
                    color: me ? "#000" : (m.emphasis ? "#fff" : "var(--ink-0)"),
                    fontSize: "0.92rem",
                    lineHeight: 1.5,
                    borderRadius: me ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                    border: m.emphasis ? "1px solid var(--blood-glow)" : "none",
                    fontFamily: "var(--body)",
                    fontWeight: m.emphasis ? 600 : 400,
                  }}
                       className={m.emphasis ? "shake" : ""}>
                    {m.text}
                  </div>
                  <div className="t-mono" style={{ fontSize: "0.62rem", color: "var(--ink-3)", marginTop: 1 }}>
                    {m.time} {me && "已讀"}
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="fade-in" style={{ alignSelf: "flex-start", padding: "10px 13px",
                                                background: "var(--bg-3)", borderRadius: "2px 10px 10px 10px",
                                                display: "flex", gap: 4 }}>
                <Dot d={0} /><Dot d={0.2} /><Dot d={0.4} />
              </div>
            )}
          </div>

          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)",
                        display: "flex", gap: 10, alignItems: "center", background: "var(--bg-1)" }}>
            <div style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line-2)",
                          fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--ink-2)" }}>
              [ 系統：本通訊已加密・回覆可能延遲 ]
            </div>
            <button className="btn" disabled>送出</button>
          </div>
        </div>
      </div>

      {/* side notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="dossier">
          <div className="dossier-h"><span>分析</span><span>ANALYSIS</span></div>
          <div style={{ padding: 16, fontFamily: "var(--display, var(--serif))",
                        fontSize: "1rem", color: "var(--ink-1)", lineHeight: 1.75 }}>
            <p style={{ marginTop: 0 }}>「同學，要進來坐嗎？」</p>
            <p style={{ color: "var(--blood-glow)", fontWeight: 600 }}>
              背向感知 + 行政權力場 + 替身協議 = 高優先級。
            </p>
            <p style={{ color: "var(--ink-2)" }}>
              建議立即進入處理式組合。延遲愈久，他在校務系統內的權限就愈不可逆。
            </p>
          </div>
        </div>

        <div className="dossier">
          <div className="dossier-h"><span>建議下一步</span><span>NEXT</span></div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn primary" onClick={onAdvance} disabled={shown < data.messages.length}>
              ▶ 啟動處理式組合
            </button>
            <button className="btn ghost" disabled>聯絡支援單位</button>
            <button className="btn ghost" disabled>申請現場介入</button>
          </div>
        </div>

        <div className="dossier">
          <div className="dossier-h"><span>風險</span><span>RISK</span></div>
          <div style={{ padding: 14 }}>
            <RiskBar v={82} />
            <div className="t-mono" style={{ fontSize: "0.72rem", color: "var(--blood-glow)", marginTop: 6, letterSpacing: "0.14em" }}>
              不可逆轉移 · 倒數 03:14
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Dot({ d = 0 }) {
  return <span style={{
    width: 7, height: 7, borderRadius: "50%", background: "var(--ink-2)",
    animation: `chat-dot 1s ${d}s infinite`,
  }} />;
}
function RiskBar({ v }) {
  return (
    <>
      <div style={{ height: 6, background: "var(--bg-3)", border: "1px solid var(--line)" }}>
        <div style={{
          height: "100%", width: v + "%",
          background: "linear-gradient(90deg, var(--amber), var(--blood-glow))",
          boxShadow: "0 0 8px var(--blood)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--ink-2)" }}>
        <span>當前風險</span><span>{v}%</span>
      </div>
    </>
  );
}

/* ── 7. 處理式（拖拉組合）謎題 ──────────────────────────────── */
function PuzzleScreen({ onSolve }) {
  const p = window.CASE_DATA.case.puzzle;
  const [bank, setBank] = useState(() => shuffle(p.steps.map((s) => s.id)));
  const [slots, setSlots] = useState([null, null, null, null]);
  const [drag, setDrag] = useState(null); // dragged step id
  const [shake, setShake] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const stepById = (id) => p.steps.find((s) => s.id === id);

  const placedAll = slots.every((s) => s !== null);
  const correct = placedAll && slots.every((s, i) => s === p.answer[i]);

  const drop = (i) => {
    if (!drag) return;
    setSlots((prev) => {
      const next = [...prev];
      // remove drag from any other slot
      for (let k = 0; k < next.length; k++) if (next[k] === drag) next[k] = null;
      next[i] = drag;
      return next;
    });
    setBank((prev) => prev.filter((id) => id !== drag));
    setDrag(null);
  };
  const removeFromSlot = (i) => {
    const id = slots[i];
    if (!id) return;
    setSlots((prev) => prev.map((s, k) => (k === i ? null : s)));
    setBank((prev) => [...prev, id]);
  };

  const submit = () => {
    if (correct) onSolve(true);
    else { setShake(true); setTimeout(() => setShake(false), 500); }
  };
  const reset = () => {
    setSlots([null, null, null, null]);
    setBank(shuffle(p.steps.map((s) => s.id)));
  };

  return (
    <div className="scene" style={{ display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">CASEBOOK PROTOCOL · 處 理 式 組 合</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            按正確順序執行
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={() => setShowHint((h) => !h)}>{showHint ? "▼" : "▶"} 提示</button>
          <button className="btn ghost" onClick={reset}>↻ 重置</button>
        </div>
      </div>

      <div className="dossier" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--display, var(--serif))", fontSize: "1.05rem", color: "var(--ink-1)" }}>
          {p.brief}
        </div>
        {showHint && (
          <div className="fade-in" style={{
            fontSize: "0.85rem", color: "var(--amber)", fontFamily: "var(--mono)",
            border: "1px dashed var(--amber)", padding: "6px 12px", letterSpacing: "0.04em",
          }}>
            HINT: {p.hint}
          </div>
        )}
      </div>

      {/* slots */}
      <div className={shake ? "shake" : ""} style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto",
        gap: 12, alignItems: "center",
      }}>
        {slots.map((id, i) => (
          <React.Fragment key={i}>
            <div onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)}
                 onClick={() => removeFromSlot(i)}
                 style={{
                   minHeight: 180,
                   border: id ? "1px solid var(--neon)" : "2px dashed var(--line-2)",
                   background: id ? "var(--bg-2)" : "transparent",
                   display: "flex", flexDirection: "column",
                   alignItems: "center", justifyContent: "center",
                   gap: 8, padding: 14, position: "relative",
                   cursor: id ? "pointer" : "default",
                   transition: "all 0.2s",
                 }}>
              <div className="t-tag" style={{ position: "absolute", top: 8, left: 10, color: id ? "var(--neon)" : "var(--ink-3)" }}>
                #{i + 1}
              </div>
              {id ? <SymbolCard step={stepById(id)} placed /> : (
                <div style={{ color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "0.78rem", letterSpacing: "0.14em" }}>
                  ── 拖入符素 ──
                </div>
              )}
            </div>
            {i < slots.length - 1 && (
              <div style={{ color: "var(--ink-2)", fontSize: "1.4rem" }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* bank */}
      <div className="dossier" style={{ padding: 18 }}>
        <div className="t-tag" style={{ marginBottom: 10 }}>SYMBOL BANK · 符素庫</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", minHeight: 144 }}>
          {bank.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1,
                          color: "var(--ink-3)", fontFamily: "var(--mono)", letterSpacing: "0.14em" }}>
              ── 已全部安置 ──
            </div>
          ) : bank.map((id) => {
            const s = stepById(id);
            return (
              <div key={id}
                   draggable
                   onDragStart={() => setDrag(id)}
                   onDragEnd={() => setDrag(null)}
                   style={{ cursor: "grab" }}>
                <SymbolCard step={s} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="t-mono" style={{ fontSize: "0.78rem", color: placedAll ? "var(--neon)" : "var(--ink-2)", letterSpacing: "0.16em" }}>
          {placedAll ? "▍ 順序已就緒" : `▍ 待安置 ${slots.filter((s) => s === null).length} 格`}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost" onClick={() => onSolve(false)}>放棄（結局 B）</button>
          <button className="btn primary" disabled={!placedAll} onClick={submit}>▶ 執行處理式</button>
        </div>
      </div>
    </div>
  );
}
function SymbolCard({ step, placed }) {
  return (
    <div style={{
      width: 134, height: 150,
      border: "1px solid " + (placed ? "var(--neon-deep)" : "var(--line-2)"),
      background: "linear-gradient(180deg, var(--bg-3) 0%, var(--bg-2) 100%)",
      display: "flex", flexDirection: "column",
      padding: 10, gap: 6,
      position: "relative",
    }}>
      <div className="bracketed" style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-1)",
      }}>
        <span className="bk-bl" /><span className="bk-br" />
        <div style={{
          fontFamily: "var(--display, var(--serif))",
          fontSize: "2.6rem", fontWeight: 700,
          color: placed ? "var(--neon)" : "var(--blood-glow)",
          textShadow: placed ? "0 0 14px var(--neon)" : "0 0 12px var(--blood)",
        }}>{step.icon}</div>
      </div>
      <div>
        <div className="t-tag" style={{ color: "var(--ink-2)" }}>{step.id}</div>
        <div style={{ fontFamily: "var(--display, var(--serif))", fontSize: "0.92rem", color: "var(--ink-0)" }}>{step.label}</div>
      </div>
    </div>
  );
}
function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

/* ── 8. 結局 ──────────────────────────────── */
function EndingScreen({ good, onReset }) {
  const e = good ? window.CASE_DATA.case.endings.good : window.CASE_DATA.case.endings.bad;
  return (
    <div className="scene" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 64 }}>
      <div className="hud-corner tl" /><div className="hud-corner tr" />
      <div className="hud-corner bl" /><div className="hud-corner br" />

      <div className="t-mono" style={{
        color: good ? "var(--neon)" : "var(--blood-glow)",
        letterSpacing: "0.4em", fontSize: "0.78rem", marginBottom: 14,
      }}>
        ▍ {e.code} · {e.flag === "GOOD" ? "ENDING_A" : "ENDING_B"} ▍
      </div>

      <div className="t-display glitch animate" data-text={e.title}
           style={{
             fontSize: "4.6rem", color: good ? "var(--ink-0)" : "var(--blood-glow)",
             marginBottom: 30,
           }}>
        {e.title}
      </div>

      <div style={{
        maxWidth: 720,
        fontFamily: "var(--display, var(--serif))",
        fontSize: "1.15rem",
        lineHeight: 2,
        color: "var(--ink-1)",
        textAlign: "left",
        borderTop: "1px solid " + (good ? "var(--neon-deep)" : "var(--blood-deep)"),
        borderBottom: "1px solid " + (good ? "var(--neon-deep)" : "var(--blood-deep)"),
        padding: "28px 32px",
        background: "var(--bg-1)",
      }}>
        {e.body}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
        <button className="btn primary" onClick={onReset}>▶ 返回案件列表</button>
        <button className="btn ghost" onClick={() => alert("結案報告 " + e.code + "\n\n" + e.body)}>下載結案報告</button>
      </div>

      <div className="t-mono" style={{ position: "absolute", bottom: 32, color: "var(--ink-3)", letterSpacing: "0.3em", fontSize: "0.68rem" }}>
        // 本中心保留對「結果」一詞的最終解釋權
      </div>
    </div>
  );
}

/* ── 檔案室（Archive demo） ─────────────────── */
function ArchiveScreen({ onBack }) {
  const cases = window.CASE_DATA.cases;
  const [sel, setSel] = useState(cases[0]);
  return (
    <div className="scene" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gridTemplateRows: "auto 1fr auto", gap: 18 }}>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="t-tag">ARCHIVE · 檔 案 室</div>
          <div className="t-display" style={{ fontSize: "2rem", color: "var(--ink-0)", marginTop: 4 }}>
            歷年案件總覽
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="chip">架空校園 · 1987-2026</span>
          <span className="chip live">{cases.length} 筆已歸檔</span>
        </div>
      </div>

      <div className="dossier" style={{ overflow: "auto" }}>
        <div className="dossier-h"><span>索引</span><span>INDEX</span></div>
        {cases.map((c) => (
          <div key={c.id} onClick={() => setSel(c)} style={{
            padding: "12px 14px", borderBottom: "1px solid var(--line)",
            borderLeft: sel.id === c.id ? "3px solid var(--neon)" : "3px solid transparent",
            background: sel.id === c.id ? "var(--bg-2)" : "transparent",
            cursor: "pointer",
          }}>
            <div className="t-mono" style={{ fontSize: "0.7rem", color: "var(--ink-2)", letterSpacing: "0.16em" }}>{c.id} · 等級 {c.level}</div>
            <div style={{ fontSize: "0.95rem", color: "var(--ink-0)", marginTop: 3 }}>{c.title}</div>
            <div className="t-tag" style={{ marginTop: 4 }}>{c.district}</div>
          </div>
        ))}
      </div>

      <div className="dossier slide-in" key={sel.id} style={{ display: "flex", flexDirection: "column" }}>
        <div className="dossier-h"><span>{sel.id} · {sel.title}</span><span>{sel.status}</span></div>
        <div style={{ padding: 24, flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: "var(--display, var(--serif))", fontSize: "1.3rem", lineHeight: 1.8, color: "var(--ink-0)", borderLeft: "3px solid var(--blood)", paddingLeft: 16, fontStyle: "italic" }}>
            「{sel.excerpt}」
          </div>
          <div style={{ color: "var(--ink-1)", lineHeight: 1.7, fontSize: "0.95rem" }}>{sel.summary}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div><div className="t-tag">委託人</div><div style={{ color: "var(--ink-0)", marginTop: 4, fontSize: "0.9rem" }}>{sel.client}</div></div>
            <div><div className="t-tag">地點</div><div style={{ color: "var(--ink-0)", marginTop: 4, fontSize: "0.9rem" }}>{sel.district}</div></div>
            <div><div className="t-tag">報酬</div><div className="t-mono" style={{ color: "var(--neon)", marginTop: 4 }}>NT$ {sel.reward.toLocaleString()}</div></div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sel.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="t-mono" style={{ color: "var(--ink-3)", fontSize: "0.74rem", letterSpacing: "0.18em" }}>▍ 唯讀模式・需閱覽授權方可下載原檔</span>
        <button className="btn primary" onClick={onBack}>◀ 返回</button>
      </div>
    </div>
  );
}

/* ── 9. 設定 / 主選單（modal） ──────────────────────────────── */
function SettingsScreen({ onClose, tweaks, setTweak }) {
  return (
    <div className="scene" style={{ alignItems: "center", justifyContent: "center" }}>
      <div className="dossier" style={{ width: 520 }}>
        <div className="dossier-h"><span>系統設定</span><span>SETTINGS</span></div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <SettingsRow label="處理員代號" val="#047" />
          <SettingsRow label="所屬單位" val="架空校園・學務處特約" />
          <SettingsRow label="今日勤務" val="C-073 進行中" highlight />
          <SettingsRow label="累計結案" val="38 件" />
          <SettingsRow label="保密協議版本" val="v3.7（2026/04/01）" />
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div className="t-tag" style={{ marginBottom: 8 }}>提示：右下角 [ Tweaks ] 可即時切換主題與特效</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn primary" onClick={onClose}>返回</button>
              <button className="btn ghost">登出</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function SettingsRow({ label, val, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span className="t-tag">{label}</span>
      <span className="t-mono" style={{
        fontSize: "0.92rem",
        color: highlight ? "var(--neon)" : "var(--ink-0)",
      }}>{val}</span>
    </div>
  );
}

/* ── 共用：Nav rail (header tabs) ──────────────────────────────── */
function NavRail({ stage, setStage, onMenu }) {
  const items = [
    { id: "boot",      label: "登入" },
    { id: "cases",     label: "案件" },
    { id: "dialogue",  label: "會談" },
    { id: "evidence",  label: "證物" },
    { id: "forum",     label: "情報" },
    { id: "chat",      label: "通訊" },
    { id: "puzzle",    label: "處理式" },
    { id: "ending",    label: "結案" },
  ];
  // determine current index
  const curIndex = items.findIndex((i) => i.id === stage);
  return (
    <div className="rail">
      {items.map((it, i) => {
        const active = stage === it.id;
        const reached = i <= curIndex;
        return (
          <div key={it.id}
               className={"item " + (active ? "active" : "")}
               style={{ opacity: reached ? 1 : 0.45, cursor: reached ? "pointer" : "not-allowed" }}
               onClick={() => reached && setStage(it.id)}>
            <span className="kbd">{String(i + 1).padStart(2, "0")}</span>
            <span>{it.label}</span>
            {active && <span className="dot" style={{ width: 6, height: 6, marginLeft: 4 }} />}
          </div>
        );
      })}
      <div className="spacer" />
      <div className="item" onClick={onMenu}>
        <span>⚙</span><span>主選單</span>
      </div>
    </div>
  );
}

/* expose */
Object.assign(window, {
  SysBar, BootScreen, CasesScreen, StubCaseScreen, PrologueScreen, DialogueScreen, EvidenceScreen,
  ForumScreen, ChatScreen, PuzzleScreen, EndingScreen, SettingsScreen, ArchiveScreen,
  NavRail,
});

// chat-dot keyframes (global)
const _styleEl = document.createElement("style");
_styleEl.textContent = `@keyframes chat-dot { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }`;
document.head.appendChild(_styleEl);
