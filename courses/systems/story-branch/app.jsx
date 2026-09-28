// 架空校園怪異事件處理簿 — App shell + state machine

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "horror",
  "type": "mincho",
  "fx": true,
  "density": "tech",
  "fontScale": 1.0
}/*EDITMODE-END*/;

function App() {
  const t = useTweaks(TWEAK_DEFAULTS);
  const v = t.values;

  const [stage, setStage] = React.useState("boot");
  const [pickedCase, setPickedCase] = React.useState(null);
  const [pickedChoice, setPickedChoice] = React.useState(null);
  const [endingGood, setEndingGood] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showArchive, setShowArchive] = React.useState(false);

  React.useEffect(() => {
    const a = () => setShowArchive(true);
    const s = () => setShowSettings(true);
    window.addEventListener("nav-archive", a);
    window.addEventListener("nav-settings", s);
    return () => {
      window.removeEventListener("nav-archive", a);
      window.removeEventListener("nav-settings", s);
    };
  }, []);

  // theme classes
  const themeClass =
    v.theme === "dossier" ? "theme-dossier" :
    v.theme === "cyber"   ? "theme-cyber"   : "";
  const typeClass = "type-" + (v.type || "mincho");

  // CSS vars from tweaks
  const cssVars = {
    "--fs-scale": v.fontScale,
    "--noise":    v.fx ? 1 : 0,
    "--scanline": v.fx ? 1 : 0,
  };

  const reset = () => {
    setStage("cases");
    setPickedChoice(null);
    setPickedCase(null);
  };

  const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => {
    const onR = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const ww = Math.min(1480, vp.w - 32);
  const hh = Math.min(900, vp.h - 32);

  return (
    <ChromeWindow
      width={ww}
      height={hh}
      url="campus-net://fictional-campus/c-073"
      tabs={[
        { title: "處理員終端 ・ C-073" },
        { title: "民俗檔案資料庫" },
      ]}
      activeIndex={0}
    >
    <div className={"app " + themeClass + " " + typeClass} style={cssVars}>
      <SysBar caseId={pickedCase?.id} />
      {stage !== "boot" && (
        <NavRail stage={stage} setStage={setStage} onMenu={() => setShowSettings(true)} />
      )}

      <div style={{ position: "relative", flex: 1, minHeight: 0, height: "100%" }}>
        {stage === "boot" && <BootScreen onEnter={() => setStage("cases")} />}
        {stage === "cases" && (
          <CasesScreen onPickCase={(c) => {
            setPickedCase(c);
            setStage(c.id === "C-073" ? "prologue" : "stub");
          }} />
        )}
        {stage === "stub" && (
          <StubCaseScreen caseInfo={pickedCase} onBack={() => setStage("cases")} />
        )}
        {stage === "prologue" && (
          <PrologueScreen onContinue={() => setStage("dialogue")} />
        )}
        {stage === "dialogue" && (
          <DialogueScreen
            onPickChoice={(c) => { setPickedChoice(c); setStage("evidence"); }} />
        )}
        {stage === "evidence" && <EvidenceScreen onAdvance={() => setStage("forum")} />}
        {stage === "forum"    && <ForumScreen    onAdvance={() => setStage("chat")} />}
        {stage === "chat"     && <ChatScreen     onAdvance={() => setStage("puzzle")} />}
        {stage === "puzzle"   && (
          <PuzzleScreen onSolve={(good) => { setEndingGood(good); setStage("ending"); }} />
        )}
        {stage === "ending"   && (
          <EndingScreen good={endingGood} onReset={reset} />
        )}

        {showSettings && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50 }}>
            <SettingsScreen onClose={() => setShowSettings(false)} tweaks={v} setTweak={t.setTweak} />
          </div>
        )}
        {showArchive && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50 }}>
            <ArchiveScreen onBack={() => setShowArchive(false)} />
          </div>
        )}

        {/* effects layer */}
        {v.fx && <div className="fx-overlay" />}
        {v.fx && <div className="fx-vignette" />}
      </div>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks" noDeckControls>
        <TweakSection label="主題">
          <TweakRadio
            label="配色"
            value={v.theme}
            options={[
              { label: "恐怖", value: "horror" },
              { label: "卷宗", value: "dossier" },
              { label: "賽博", value: "cyber" },
            ]}
            onChange={(val) => t.setTweak("theme", val)}
          />
          <TweakRadio
            label="字體"
            value={v.type}
            options={[
              { label: "明體", value: "mincho" },
              { label: "黑體", value: "gothic" },
            ]}
            onChange={(val) => t.setTweak("type", val)}
          />
        </TweakSection>

        <TweakSection label="特效">
          <TweakToggle
            label="雜訊 / 掃描線"
            value={v.fx}
            onChange={(val) => t.setTweak("fx", val)}
          />
        </TweakSection>

        <TweakSection label="可讀性">
          <TweakSlider
            label="字級"
            value={v.fontScale}
            min={0.85} max={1.25} step={0.05}
            unit="x"
            onChange={(val) => t.setTweak("fontScale", val)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
    </ChromeWindow>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
