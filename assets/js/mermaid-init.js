(function () {
  var mermaidPromise;
  var mermaidRenderCounter = 0;
  var mermaidRenderVersion = 0;
  var mermaidBlockSelector = "pre code.language-mermaid, pre code[data-lang='mermaid']";

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

  function touchDistance(touchA, touchB) {
    var dx = touchA.clientX - touchB.clientX;
    var dy = touchA.clientY - touchB.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function enhanceDiagramViewport(container, diagramLabel) {
    if (typeof container.__stuffsMermaidCleanup === "function") {
      container.__stuffsMermaidCleanup();
      container.__stuffsMermaidCleanup = null;
    }

    var FIT_HORIZONTAL_PADDING = 2;
    var NEAR_FIT_SCALE = 0.95;
    var BOUNDS_PADDING = 12;
    var NAV_MIN_OVERFLOW_PX = 32;
    var DEFAULT_ACTUAL_OVERFLOW_PX = 6;
    var HEIGHT_LIMIT_RATIO = 0.8;
    var WIDTH_FIT_TARGET_SCALE = 0.8;
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
    viewport.setAttribute("aria-label", diagramLabel + " pan and zoom viewport");

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
      lockedViewportHeight: 0,
      widthFitAdjusted: false,
      heightCap: 0,
      strictHeightCap: false
    };
    var cleanupTasks = [];

    function addWindowListener(type, listener, options) {
      window.addEventListener(type, listener, options);
      cleanupTasks.push(function () {
        window.removeEventListener(type, listener, options);
      });
    }

    function updateZoomLabel() {
      zoomValue.textContent = Math.round(state.scale * 100) + "%";
    }

    function viewportHeightLimit() {
      var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      return Math.max(1, Math.floor(viewportHeight * HEIGHT_LIMIT_RATIO));
    }

    function refreshHeightPolicy() {
      var viewportCap = viewportHeightLimit();
      var fitAtEightyPercentHeight = Math.max(1, Math.ceil(baseHeight * WIDTH_FIT_TARGET_SCALE));
      state.heightCap = viewportCap;
      state.strictHeightCap = false;

      if (state.widthFitAdjusted && fitAtEightyPercentHeight > viewportCap) {
        state.heightCap = fitAtEightyPercentHeight;
        state.strictHeightCap = true;
      }
    }

    function lockViewportHeight() {
      var scaledHeight = Math.max(1, Math.ceil(baseHeight * state.scale));
      var limit = Math.max(1, Math.ceil(state.heightCap || viewportHeightLimit()));
      var targetHeight = Math.min(scaledHeight, limit);

      viewport.style.height = targetHeight + "px";

      var scaledWidth = baseWidth * state.scale;
      var hasHorizontalOverflow = scaledWidth > viewport.clientWidth + 0.5;
      var showsFullDiagramHeight = targetHeight >= scaledHeight;
      if (hasHorizontalOverflow && showsFullDiagramHeight) {
        var horizontalScrollbarHeight = Math.max(0, viewport.offsetHeight - viewport.clientHeight);
        if (horizontalScrollbarHeight > 0) {
          var adjustedHeight = targetHeight + horizontalScrollbarHeight;
          if (state.strictHeightCap) {
            adjustedHeight = Math.min(adjustedHeight, limit);
          }
          targetHeight = adjustedHeight;
          viewport.style.height = adjustedHeight + "px";
        }
      }

      state.lockedViewportHeight = targetHeight;
    }

    function applyScale(nextScale, preserveCenter) {
      var previousScale = state.scale;
      var centerX = viewport.scrollLeft + viewport.clientWidth / 2;
      var centerY = viewport.scrollTop + viewport.clientHeight / 2;

      state.scale = clamp(nextScale, state.minScale, state.maxScale);
      svg.style.width = (baseWidth * state.scale).toFixed(2) + "px";
      svg.style.height = (baseHeight * state.scale).toFixed(2) + "px";
      svg.style.margin = "0 auto";
      lockViewportHeight();
      updateZoomLabel();
      updateNavigationVisibility();

      if (preserveCenter && previousScale > 0) {
        var ratio = state.scale / previousScale;
        viewport.scrollLeft = centerX * ratio - viewport.clientWidth / 2;
        viewport.scrollTop = centerY * ratio - viewport.clientHeight / 2;
      }
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
      var fitsWidthAtActual = state.fitScale >= NEAR_FIT_SCALE && overflowAtActual <= DEFAULT_ACTUAL_OVERFLOW_PX;
      var actualHeightAtScaleOne = Math.max(1, Math.ceil(baseHeight));
      var exceedsViewportCapAtActual = actualHeightAtScaleOne > viewportHeightLimit();
      var useEightyPercentWidthFit = fitsWidthAtActual && exceedsViewportCapAtActual;
      var targetScale = fitsWidthAtActual ? (useEightyPercentWidthFit ? WIDTH_FIT_TARGET_SCALE : 1) : state.fitScale;
      state.widthFitAdjusted = useEightyPercentWidthFit;
      state.defaultScale = targetScale;
      refreshHeightPolicy();
      applyScale(targetScale, false);
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
    var touchDragState = null;
    var pinchState = null;
    var touchIntentThresholdPx = 6;
    var touchEdgeTolerancePx = 1;

    function verticalPageScrollPolicy() {
      var maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      var atTop = viewport.scrollTop <= touchEdgeTolerancePx;
      var atBottom = viewport.scrollTop >= maxScrollTop - touchEdgeTolerancePx;

      if (atTop && atBottom) {
        return "both";
      }
      if (atTop) {
        return "up";
      }
      if (atBottom) {
        return "down";
      }
      return "none";
    }

    function shouldAllowPageScroll(policy, deltaX, deltaY) {
      if (policy === "none") {
        return false;
      }

      if (policy === "both") {
        return true;
      }

      var verticalIntent = Math.abs(deltaY) >= Math.abs(deltaX);
      if (!verticalIntent) {
        return false;
      }

      if (policy === "up") {
        return deltaY > 0;
      }

      if (policy === "down") {
        return deltaY < 0;
      }

      return false;
    }

    function createTouchDragState(touch) {
      return {
        x: touch.clientX,
        y: touch.clientY,
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        mode: "pending",
        pageScrollPolicy: verticalPageScrollPolicy()
      };
    }

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

    addWindowListener("mousemove", function (event) {
      if (!dragState) {
        return;
      }
      viewport.scrollLeft = dragState.left - (event.clientX - dragState.x);
      viewport.scrollTop = dragState.top - (event.clientY - dragState.y);
    });

    addWindowListener("mouseup", function () {
      if (!dragState) {
        return;
      }
      dragState = null;
      viewport.classList.remove("is-dragging");
    });

    viewport.addEventListener(
      "touchstart",
      function (event) {
        if (event.touches.length >= 2) {
          var first = event.touches[0];
          var second = event.touches[1];
          pinchState = {
            distance: Math.max(1, touchDistance(first, second)),
            scale: state.scale
          };
          touchDragState = null;
          viewport.classList.add("is-dragging");
          event.preventDefault();
          return;
        }

        if (event.touches.length === 1) {
          var touch = event.touches[0];
          touchDragState = createTouchDragState(touch);
          viewport.classList.remove("is-dragging");
        }
      },
      { passive: false }
    );

    viewport.addEventListener(
      "touchmove",
      function (event) {
        if (event.touches.length >= 2 && pinchState) {
          var first = event.touches[0];
          var second = event.touches[1];
          var distance = Math.max(1, touchDistance(first, second));
          applyScale(pinchState.scale * (distance / pinchState.distance), true);
          event.preventDefault();
          return;
        }

        if (event.touches.length === 1 && touchDragState) {
          var touch = event.touches[0];
          var deltaX = touch.clientX - touchDragState.x;
          var deltaY = touch.clientY - touchDragState.y;
          var movedEnough = Math.abs(deltaX) >= touchIntentThresholdPx || Math.abs(deltaY) >= touchIntentThresholdPx;

          if (touchDragState.mode === "pending") {
            if (!movedEnough) {
              return;
            }

            if (shouldAllowPageScroll(touchDragState.pageScrollPolicy, deltaX, deltaY)) {
              touchDragState.mode = "page";
              viewport.classList.remove("is-dragging");
              return;
            }

            touchDragState.mode = "pan";
            viewport.classList.add("is-dragging");
          }

          if (touchDragState.mode === "page") {
            return;
          }

          viewport.scrollLeft = touchDragState.left - deltaX;
          viewport.scrollTop = touchDragState.top - deltaY;
          event.preventDefault();
        }
      },
      { passive: false }
    );

    viewport.addEventListener(
      "touchend",
      function (event) {
        if (event.touches.length < 2) {
          pinchState = null;
        }

        if (event.touches.length === 1) {
          var touch = event.touches[0];
          touchDragState = createTouchDragState(touch);
          viewport.classList.remove("is-dragging");
          return;
        }

        touchDragState = null;
        viewport.classList.remove("is-dragging");
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchcancel",
      function () {
        pinchState = null;
        touchDragState = null;
        viewport.classList.remove("is-dragging");
      },
      { passive: true }
    );

    viewport.addEventListener(
      "gesturestart",
      function (event) {
        event.preventDefault();
      },
      { passive: false }
    );

    viewport.addEventListener(
      "gesturechange",
      function (event) {
        event.preventDefault();
      },
      { passive: false }
    );

    addWindowListener("resize", function () {
      refreshHeightPolicy();
      lockViewportHeight();
      updateNavigationVisibility();
    });

    container.__stuffsMermaidCleanup = function () {
      while (cleanupTasks.length > 0) {
        var cleanup = cleanupTasks.pop();
        if (typeof cleanup === "function") {
          cleanup();
        }
      }
    };

    requestAnimationFrame(function () {
      applyFit();
      updateNavigationVisibility();
    });
  }

  function hasMermaidBlocks() {
    return document.querySelector(mermaidBlockSelector) !== null;
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

  function cleanUpDiagramContainer(container) {
    if (!container) {
      return;
    }

    if (typeof container.__stuffsMermaidCleanup === "function") {
      container.__stuffsMermaidCleanup();
      container.__stuffsMermaidCleanup = null;
    }
  }

  function removeDiagramContainer(pre) {
    if (!pre) {
      return;
    }

    var previous = pre.previousElementSibling;
    if (!previous || !previous.classList || !previous.classList.contains("mermaid-diagram")) {
      return;
    }

    cleanUpDiagramContainer(previous);
    previous.remove();
  }

  function renderMermaidBlocks(options) {
    var force = Boolean(options && options.force === true);
    var blocks = document.querySelectorAll(mermaidBlockSelector);
    if (blocks.length === 0) {
      return;
    }

    var renderVersion = ++mermaidRenderVersion;

    ensureMermaidRuntime()
      .then(function (mermaid) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: activeMermaidTheme()
        });

        blocks.forEach(function (codeNode, index) {
          var pre = codeNode.closest("pre");
          if (!pre) {
            return;
          }

          var existingContainer = pre.previousElementSibling;
          var hasExistingContainer =
            Boolean(existingContainer && existingContainer.classList && existingContainer.classList.contains("mermaid-diagram"));
          var isReplacingExisting = force && pre.dataset.processed === "true" && hasExistingContainer;
          if (!force && pre.dataset.processed === "true" && hasExistingContainer) {
            return;
          }

          if (hasExistingContainer && !isReplacingExisting) {
            removeDiagramContainer(pre);
          }

          pre.dataset.processed = "pending";
          if (!isReplacingExisting) {
            pre.hidden = false;
          }

          var source = (codeNode.textContent || "").trim();
          var diagramLabel = "Scrollable Mermaid diagram " + (index + 1);
          var container;
          if (isReplacingExisting) {
            container = existingContainer;
          } else {
            container = document.createElement("div");
            container.className = "mermaid-diagram";
            container.tabIndex = 0;
            container.setAttribute("role", "region");
            container.setAttribute("aria-label", diagramLabel);
            pre.parentNode.insertBefore(container, pre);
          }

          mermaid
            .render("mermaid-diagram-" + index + "-" + mermaidRenderCounter++, source)
            .then(function (result) {
              if (renderVersion !== mermaidRenderVersion) {
                if (!isReplacingExisting) {
                  cleanUpDiagramContainer(container);
                  container.remove();
                }
                return;
              }

              container.innerHTML = result.svg;
              enhanceDiagramViewport(container, diagramLabel);
              pre.dataset.processed = "true";
              pre.hidden = true;
            })
            .catch(function () {
              if (renderVersion !== mermaidRenderVersion) {
                if (!isReplacingExisting) {
                  cleanUpDiagramContainer(container);
                  container.remove();
                }
                return;
              }

              if (isReplacingExisting) {
                pre.dataset.processed = "true";
                pre.hidden = true;
                return;
              }

              pre.dataset.processed = "error";
              cleanUpDiagramContainer(container);
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
      renderMermaidBlocks({ force: true });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMermaid);
  } else {
    initMermaid();
  }
})();
