(() => {
  "use strict";

  const canvas = document.querySelector("#unity-canvas");
  const loadingPanel = document.querySelector("#loading-panel");
  const progressBar = document.querySelector("#progress-bar");
  const progressLabel = document.querySelector("#progress-label");
  const status = document.querySelector("#runtime-status");
  const errorPanel = document.querySelector("#error-panel");
  const errorMessage = document.querySelector("#error-message");
  const fullscreenButton = document.querySelector("#fullscreen-button");
  const retryButton = document.querySelector("#retry-button");
  const orientationHint = document.querySelector("#orientation-hint");

  const buildUrl = "Build";
  const loaderUrl = `${buildUrl}/WebGL.loader.js`;
  const config = {
    arguments: [],
    dataUrl: `${buildUrl}/WebGL.data`,
    frameworkUrl: `${buildUrl}/WebGL.framework.js`,
    codeUrl: `${buildUrl}/WebGL.wasm`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "treefar",
    productName: "Glimmer of the Storm",
    productVersion: "1.0",
  };

  const updateOrientationHint = () => {
    const isNarrowScreen = matchMedia("(max-width: 900px)").matches;
    orientationHint.hidden = !(isNarrowScreen && matchMedia("(orientation: portrait)").matches);
  };

  const showError = (message) => {
    loadingPanel.hidden = true;
    errorPanel.hidden = false;
    errorMessage.textContent = message || "請重新整理頁面，或改用最新版 Chrome、Edge、Firefox 或 Safari。";
    status.textContent = "載入失敗";
  };

  updateOrientationHint();
  window.addEventListener("resize", updateOrientationHint, { passive: true });

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
