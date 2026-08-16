(() => {
  "use strict";

  const canvas = document.querySelector("#unity-canvas");
  const desktopPlayer = document.querySelector("#desktop-player");
  const mobileNotice = document.querySelector("#mobile-notice");
  const loading = document.querySelector("#loading");
  const progressBar = document.querySelector("#progress-bar");
  const progressLabel = document.querySelector("#progress-label");
  const status = document.querySelector("#runtime-status");
  const fullscreen = document.querySelector("#fullscreen");
  const errorPanel = document.querySelector("#error");
  const errorMessage = document.querySelector("#error-message");
  const retry = document.querySelector("#retry");
  const banner = document.querySelector("#banner");

  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const coarseMobileScreen = window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) <= 1024;
  if (mobileUserAgent || coarseMobileScreen) {
    desktopPlayer.hidden = true;
    mobileNotice.hidden = false;
    fullscreen.hidden = true;
    status.textContent = "手機版不下載遊戲檔案";
    return;
  }

  const showError = (message) => {
    loading.hidden = true;
    errorPanel.hidden = false;
    errorMessage.textContent = message || "請重新整理頁面，或改用最新版 Chrome、Edge、Firefox。";
    status.textContent = "載入失敗";
  };

  const showBanner = (message, type) => {
    banner.textContent = message;
    banner.hidden = false;
    if (type !== "error") window.setTimeout(() => { banner.hidden = true; }, 6000);
  };

  const buildUrl = "Build";
  const revision = "20260816";
  const config = {
    arguments: [],
    dataUrl: `${buildUrl}/WebGL.data.unityweb?v=${revision}`,
    frameworkUrl: `${buildUrl}/WebGL.framework.js.unityweb?v=${revision}`,
    codeUrl: `${buildUrl}/WebGL.wasm.unityweb?v=${revision}`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "Treefar",
    productName: "Lanternbearer",
    productVersion: "1.0",
    showBanner,
    matchWebGLToCanvasSize: true,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    autoSyncPersistentDataPath: true
  };

  const loader = document.createElement("script");
  loader.src = `${buildUrl}/WebGL.loader.js?v=${revision}`;
  loader.onload = () => {
    status.textContent = "正在載入遊戲";
    window.createUnityInstance(canvas, config, (progress) => {
      const percent = Math.round(progress * 100);
      progressBar.style.width = `${percent}%`;
      progressLabel.textContent = `${percent}%`;
    }).then((instance) => {
      loading.hidden = true;
      status.textContent = "可開始試玩 · 請點一下畫面";
      fullscreen.disabled = false;
      fullscreen.addEventListener("click", () => instance.SetFullscreen(1));
      canvas.addEventListener("pointerdown", () => canvas.focus());
      canvas.focus();
    }).catch((error) => showError(error?.message || String(error)));
  };
  loader.onerror = () => showError("找不到 Unity 載入器，請稍後重新整理頁面。 ");
  document.body.appendChild(loader);

  retry.addEventListener("click", () => window.location.reload());
})();
