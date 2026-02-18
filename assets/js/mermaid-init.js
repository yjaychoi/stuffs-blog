(function () {
  var mermaidPromise;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createControlButton(label, title) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", title);
    button.title = title;
    return button;
  }

  function enhanceDiagramViewport(container) {
    var FIT_HORIZONTAL_PADDING = 2;
    var NEAR_FIT_SCALE = 0.95;
    var BOUNDS_PADDING = 12;
    var NAV_MIN_OVERFLOW_PX = 32;
    var DEFAULT_ACTUAL_OVERFLOW_PX = 6;
    var svg = container.querySelector("svg");
    if (!svg || !svg.viewBox || !svg.viewBox.baseVal) {
      return;
    }

    var viewBox = svg.viewBox.baseVal;
    var baseX = Number(viewBox.x || 0);
    var baseY = Number(viewBox.y || 0);
    var baseWidth = Number(viewBox.width || 0);
    var baseHeight = Number(viewBox.height || 0);
    try {
      var bounds = svg.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        var croppedX = bounds.x - BOUNDS_PADDING;
        var croppedY = bounds.y - BOUNDS_PADDING;
        var croppedWidth = bounds.width + BOUNDS_PADDING * 2;
        var croppedHeight = bounds.height + BOUNDS_PADDING * 2;
        var canTightenWidth = croppedWidth > 0 && croppedWidth < baseWidth * 0.97;
        var canTightenHeight = croppedHeight > 0 && croppedHeight < baseHeight * 0.97;
        if (canTightenWidth || canTightenHeight) {
          var nextX = canTightenWidth ? croppedX : baseX;
          var nextY = canTightenHeight ? croppedY : baseY;
          var nextWidth = canTightenWidth ? croppedWidth : baseWidth;
          var nextHeight = canTightenHeight ? croppedHeight : baseHeight;
          svg.setAttribute("viewBox", nextX + " " + nextY + " " + nextWidth + " " + nextHeight);
          baseWidth = nextWidth;
          baseHeight = nextHeight;
        }
      }
    } catch (_) {
      // Ignore measurement failures and keep Mermaid's original viewBox.
    }

    if (baseWidth <= 0 || baseHeight <= 0) {
      return;
    }

    var toolbar = document.createElement("div");
    toolbar.className = "mermaid-diagram__toolbar";

    var zoomOutButton = createControlButton("-", "Zoom out");
    var zoomInButton = createControlButton("+", "Zoom in");
    var fitButton = createControlButton("Fit", "Fit diagram to viewport");
    var actualButton = createControlButton("100%", "Reset diagram zoom");
    var zoomValue = document.createElement("span");
    zoomValue.className = "mermaid-diagram__zoom-value";
    zoomValue.textContent = "100%";

    toolbar.appendChild(zoomOutButton);
    toolbar.appendChild(zoomInButton);
    toolbar.appendChild(fitButton);
    toolbar.appendChild(actualButton);
    toolbar.appendChild(zoomValue);

    var viewport = document.createElement("div");
    viewport.className = "mermaid-diagram__viewport";
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-label", "Mermaid pan and zoom viewport");

    container.innerHTML = "";
    container.appendChild(toolbar);
    container.appendChild(viewport);
    viewport.appendChild(svg);

    svg.removeAttribute("style");
    svg.setAttribute("preserveAspectRatio", "xMidYMin meet");

    var state = {
      minScale: 0.2,
      maxScale: 3.5,
      scale: 1,
      fitScale: 1,
      defaultScale: 1,
      lockedViewportHeight: 0
    };

    function updateZoomLabel() {
      zoomValue.textContent = Math.round(state.scale * 100) + "%";
    }

    function applyScale(nextScale, preserveCenter) {
      var previousScale = state.scale;
      var centerX = viewport.scrollLeft + viewport.clientWidth / 2;
      var centerY = viewport.scrollTop + viewport.clientHeight / 2;

      state.scale = clamp(nextScale, state.minScale, state.maxScale);
      svg.style.width = (baseWidth * state.scale).toFixed(2) + "px";
      svg.style.height = (baseHeight * state.scale).toFixed(2) + "px";
      svg.style.margin = "0 auto";
      updateZoomLabel();
      updateNavigationVisibility();

      if (preserveCenter && previousScale > 0) {
        var ratio = state.scale / previousScale;
        viewport.scrollLeft = centerX * ratio - viewport.clientWidth / 2;
        viewport.scrollTop = centerY * ratio - viewport.clientHeight / 2;
      }
    }

    function lockViewportHeight() {
      state.lockedViewportHeight = Math.max(1, Math.ceil(baseHeight * state.scale));
      viewport.style.height = state.lockedViewportHeight + "px";
    }

    function fitScale() {
      var availableWidth = Math.max(1, viewport.clientWidth - FIT_HORIZONTAL_PADDING * 2);
      return clamp(Math.min(1, availableWidth / baseWidth), state.minScale, state.maxScale);
    }

    function updateNavigationVisibility() {
      var scaledWidth = baseWidth * state.scale;
      var overflowX = scaledWidth - viewport.clientWidth;
      var atDefaultScale = Math.abs(state.scale - state.defaultScale) <= 0.01;
      if (atDefaultScale && state.defaultScale >= 0.999 && overflowX <= DEFAULT_ACTUAL_OVERFLOW_PX) {
        toolbar.hidden = true;
        return;
      }
      var userAdjustedScale = Math.abs(state.scale - state.defaultScale) > 0.01;
      var needsNavigation = state.defaultScale < NEAR_FIT_SCALE || overflowX > NAV_MIN_OVERFLOW_PX || userAdjustedScale;
      toolbar.hidden = !needsNavigation;
    }

    function applyFit() {
      state.fitScale = fitScale();
      var overflowAtActual = baseWidth - viewport.clientWidth;
      var canStartAtActual = state.fitScale >= NEAR_FIT_SCALE && overflowAtActual <= DEFAULT_ACTUAL_OVERFLOW_PX;
      var targetScale = canStartAtActual ? 1 : state.fitScale;
      state.defaultScale = targetScale;
      applyScale(targetScale, false);
      lockViewportHeight();
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    }

    zoomInButton.addEventListener("click", function () {
      applyScale(state.scale * 1.2, true);
    });

    zoomOutButton.addEventListener("click", function () {
      applyScale(state.scale / 1.2, true);
    });

    fitButton.addEventListener("click", function () {
      applyFit();
    });

    actualButton.addEventListener("click", function () {
      applyScale(1, false);
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    });

    viewport.addEventListener(
      "wheel",
      function (event) {
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }
        event.preventDefault();
        applyScale(state.scale * (event.deltaY < 0 ? 1.12 : 0.89), true);
      },
      { passive: false }
    );

    var dragState = null;

    viewport.addEventListener("mousedown", function (event) {
      if (event.button !== 0) {
        return;
      }
      dragState = {
        x: event.clientX,
        y: event.clientY,
        left: viewport.scrollLeft,
        top: viewport.scrollTop
      };
      viewport.classList.add("is-dragging");
      event.preventDefault();
    });

    window.addEventListener("mousemove", function (event) {
      if (!dragState) {
        return;
      }
      viewport.scrollLeft = dragState.left - (event.clientX - dragState.x);
      viewport.scrollTop = dragState.top - (event.clientY - dragState.y);
    });

    window.addEventListener("mouseup", function () {
      if (!dragState) {
        return;
      }
      dragState = null;
      viewport.classList.remove("is-dragging");
    });

    window.addEventListener("resize", function () {
      updateNavigationVisibility();
    });

    requestAnimationFrame(function () {
      applyFit();
      updateNavigationVisibility();
    });
  }

  function hasMermaidBlocks() {
    return document.querySelector("pre code.language-mermaid, pre code[data-lang='mermaid']") !== null;
  }

  function ensureMermaidRuntime() {
    if (window.mermaid) {
      return Promise.resolve(window.mermaid);
    }

    if (mermaidPromise) {
      return mermaidPromise;
    }

    mermaidPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "/assets/js/vendor/mermaid.min.js";
      script.async = true;
      script.onload = function () {
        if (window.mermaid) {
          resolve(window.mermaid);
        } else {
          reject(new Error("Mermaid runtime unavailable after script load."));
        }
      };
      script.onerror = function () {
        reject(new Error("Failed to load Mermaid runtime."));
      };
      document.head.appendChild(script);
    });

    return mermaidPromise;
  }

  function activeMermaidTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "default";
  }

  function renderMermaidBlocks() {
    var blocks = document.querySelectorAll("pre code.language-mermaid, pre code[data-lang='mermaid']");
    if (blocks.length === 0) {
      return;
    }

    ensureMermaidRuntime()
      .then(function (mermaid) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: activeMermaidTheme()
        });

        blocks.forEach(function (codeNode, index) {
          var pre = codeNode.closest("pre");
          if (!pre || pre.dataset.processed === "true") {
            return;
          }

          pre.dataset.processed = "true";
          var source = (codeNode.textContent || "").trim();

          var container = document.createElement("div");
          container.className = "mermaid-diagram";
          container.tabIndex = 0;
          container.setAttribute("role", "region");
          container.setAttribute("aria-label", "Scrollable Mermaid diagram");
          pre.parentNode.insertBefore(container, pre);

          mermaid
            .render("mermaid-diagram-" + index + "-" + Date.now(), source)
            .then(function (result) {
              container.innerHTML = result.svg;
              enhanceDiagramViewport(container);
              pre.hidden = true;
            })
            .catch(function () {
              pre.dataset.processed = "error";
              container.remove();
              pre.hidden = false;
            });
        });
      })
      .catch(function () {
        // Keep source blocks visible when runtime load fails.
      });
  }

  function initMermaid() {
    if (!hasMermaidBlocks()) {
      return;
    }
    renderMermaidBlocks();
  }

  document.addEventListener("stuffs:themechange", function () {
    var rendered = document.querySelectorAll("pre[data-processed='true'][hidden]");
    if (rendered.length > 0) {
      location.reload();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMermaid);
  } else {
    initMermaid();
  }
})();
