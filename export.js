/**
 * YouTube Saved Shorts URL Extractor
 * Automatically navigates through the YouTube Shorts player, bypasses playlist 
 * virtualization/API limitations, and exports unique URLs into a .txt file.
 * 
 * Works directly in the browser DevTools Console (CSP & Trusted Types compliant).
 */

(async function youtubeShortsExtractor() {
  // --- Configuration ---
  const CONFIG = {
    baseDelay: 320,        // Normal speed when feed advances smoothly (ms)
    maxStuckRetries: 10,   // Number of attempts before assuming the end of the playlist
    jiggleThreshold: 2,    // Attempt number at which scroll jiggle kicks in
    exportPrefix: "youtube_saved_shorts",
    autoMute: true
  };

  const videoIds = new Set();
  let isRunning = true;
  let stuckCount = 0;
  let lastId = null;

  // --- Auto-Mute Audio Streams ---
  let muteInterval = null;
  if (CONFIG.autoMute) {
    muteInterval = setInterval(() => {
      document.querySelectorAll("video").forEach(v => {
        v.muted = true;
        v.volume = 0;
      });
    }, 250);
  }

  // --- Build CSP-Safe HUD (No innerHTML / injection sinks) ---
  const existingHud = document.getElementById("yt-shorts-extractor-hud");
  if (existingHud) existingHud.remove();

  const hud = document.createElement("div");
  hud.id = "yt-shorts-extractor-hud";
  Object.assign(hud.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "9999999",
    background: "rgba(18, 18, 18, 0.96)",
    color: "#f1f1f1",
    padding: "16px 20px",
    borderRadius: "14px",
    boxShadow: "0 10px 32px rgba(0, 0, 0, 0.8)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace",
    fontSize: "13px",
    lineHeight: "1.4",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    backdropFilter: "blur(10px)",
    minWidth: "270px",
    userSelect: "none"
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  });

  const title = document.createElement("span");
  title.textContent = "⚡ Shorts Extractor";
  Object.assign(title.style, {
    fontWeight: "bold",
    color: "#3ea6ff",
    fontSize: "14px"
  });

  const statusEl = document.createElement("span");
  statusEl.textContent = "Initializing...";
  Object.assign(statusEl.style, {
    fontSize: "12px",
    color: "#aaa"
  });

  header.appendChild(title);
  header.appendChild(statusEl);

  const counterEl = document.createElement("div");
  counterEl.textContent = "Collected: 0";
  Object.assign(counterEl.style, {
    fontWeight: "bold",
    fontSize: "16px",
    margin: "8px 0 12px 0",
    fontFamily: "monospace"
  });

  const btnContainer = document.createElement("div");
  Object.assign(btnContainer.style, {
    display: "flex",
    gap: "8px"
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Export .txt";
  Object.assign(downloadBtn.style, {
    flex: "1",
    padding: "8px 12px",
    background: "#2ba640",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px"
  });

  const stopBtn = document.createElement("button");
  stopBtn.textContent = "Stop";
  Object.assign(stopBtn.style, {
    padding: "8px 14px",
    background: "#cc0000",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px"
  });

  btnContainer.appendChild(downloadBtn);
  btnContainer.appendChild(stopBtn);
  hud.appendChild(header);
  hud.appendChild(counterEl);
  hud.appendChild(btnContainer);
  document.body.appendChild(hud);

  function exportToFile() {
    if (videoIds.size === 0) {
      alert("No video links captured yet.");
      return;
    }
    const links = Array.from(videoIds).map(id => `https://www.youtube.com/shorts/${id}`).join("\n");
    const blob = new Blob([links], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${CONFIG.exportPrefix}_${videoIds.size}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadBtn.onclick = exportToFile;
  stopBtn.onclick = () => {
    isRunning = false;
    if (muteInterval) clearInterval(muteInterval);
    statusEl.textContent = "Stopped by user";
    statusEl.style.color = "#ffaa00";
  };

  function updateHUD(statusMessage = null) {
    counterEl.textContent = `Collected: ${videoIds.size}`;
    if (statusMessage) statusEl.textContent = statusMessage;
  }

  function getCurrentVideoId() {
    const match = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function getShortsContainer() {
    return document.querySelector("#shorts-container") ||
           document.querySelector("ytd-shorts") ||
           document.documentElement;
  }

  function advanceFeed(forceLevel = 0) {
    const container = getShortsContainer();
    const activeRenderer = document.querySelector("ytd-reel-video-renderer[is-active]") || container;
    
    if (activeRenderer && typeof activeRenderer.focus === "function") {
      activeRenderer.focus();
    }

    // Scroll jiggle to unstick virtualized chunk boundaries
    if (forceLevel >= CONFIG.jiggleThreshold) {
      container.scrollBy({ top: -160, behavior: "instant" });
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: -300, bubbles: true }));
      setTimeout(() => {
        container.scrollBy({ top: window.innerHeight + 160, behavior: "instant" });
        window.dispatchEvent(new WheelEvent("wheel", { deltaY: 800, bubbles: true }));
      }, 120);
      return;
    }

    // Click native down navigation button if accessible
    const nextBtn = document.querySelector("#navigation-button-down button") ||
                    document.querySelector("ytd-shorts #navigation-button-down yt-icon-button button");
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
    }

    // Keyboard and smooth scroll fallbacks
    window.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowDown",
      code: "ArrowDown",
      keyCode: 40,
      which: 40,
      bubbles: true
    }));
    container.scrollBy({ top: window.innerHeight, behavior: "smooth" });
  }

  // --- Main Execution Loop ---
  while (isRunning) {
    const currentId = getCurrentVideoId();

    if (currentId && currentId !== lastId) {
      lastId = currentId;
      videoIds.add(currentId);
      stuckCount = 0;
      updateHUD("Extracting...");

      advanceFeed(0);
      await new Promise(r => setTimeout(r, CONFIG.baseDelay));
    } else {
      stuckCount++;
      updateHUD(`Buffering chunk (${stuckCount}/${CONFIG.maxStuckRetries})...`);

      // Adaptive exponential backoff
      const waitTime = Math.min(2000, 600 + (stuckCount * 250));
      advanceFeed(stuckCount);
      await new Promise(r => setTimeout(r, waitTime));

      if (stuckCount >= CONFIG.maxStuckRetries) {
        statusEl.textContent = "Reached end of feed";
        statusEl.style.color = "#ffaa00";
        break;
      }
    }
  }

  if (muteInterval) clearInterval(muteInterval);
  updateHUD("Complete!");
  statusEl.style.color = "#2ba640";
  exportToFile();
})();
