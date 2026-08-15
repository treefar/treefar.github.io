(() => {
  "use strict";

  const canvas = document.querySelector("#unity-canvas");
  const desktopPlayer = document.querySelector("#desktop-player");
  const mobileNotice = document.querySelector("#mobile-notice");
  const loadingPanel = document.querySelector("#loading-panel");
  const progressBar = document.querySelector("#progress-bar");
  const progressLabel = document.querySelector("#progress-label");
  const status = document.querySelector("#runtime-status");
  const errorPanel = document.querySelector("#error-panel");
  const errorMessage = document.querySelector("#error-message");
  const fullscreenButton = document.querySelector("#fullscreen-button");
  const retryButton = document.querySelector("#retry-button");

  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const coarseNarrowScreen = window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) <= 1024;
  const narrowViewport = window.innerWidth <= 900;
  const shouldBlockMobile = mobileUserAgent || coarseNarrowScreen || narrowViewport;

  if (shouldBlockMobile) {
    desktopPlayer.hidden = true;
    mobileNotice.hidden = false;
    fullscreenButton.hidden = true;
    status.textContent = "手機版不載入遊戲檔案";
    return;
  }

  const buildUrl = "Build";
  const loaderUrl = `${buildUrl}/BuildWebGL.loader.js`;
  const config = {
    arguments: [],
    dataUrl: `${buildUrl}/BuildWebGL.data.unityweb`,
    frameworkUrl: `${buildUrl}/BuildWebGL.framework.js.unityweb`,
    codeUrl: `${buildUrl}/BuildWebGL.wasm.unityweb`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "STU Animation and Game Design",
    productName: "GameProtoLab",
    productVersion: "1.0",
  };

  const showError = (message) => {
    loadingPanel.hidden = true;
    errorPanel.hidden = false;
    errorMessage.textContent = message || "請重新整理頁面，或改用最新版 Chrome、Edge、Firefox。";
    status.textContent = "載入失敗";
  };

  const loader = document.createElement("script");
  loader.src = loaderUrl;
  loader.onload = () => {
    status.textContent = "正在載入遊戲";
    window.createUnityInstance(canvas, config, (progress) => {
      const percent = Math.round(progress * 100);
      progressBar.style.width = `${percent}%`;
      progressLabel.textContent = `${percent}%`;
    }).then((instance) => {
      loadingPanel.hidden = true;
      status.textContent = "可開始試玩";
      fullscreenButton.disabled = false;
      fullscreenButton.addEventListener("click", () => instance.SetFullscreen(1));
      canvas.focus();
    }).catch((error) => showError(error?.message));
  };
  loader.onerror = () => showError("找不到 Unity 載入器，請稍後重新整理頁面。");
  document.body.appendChild(loader);

  retryButton.addEventListener("click", () => window.location.reload());
})();
