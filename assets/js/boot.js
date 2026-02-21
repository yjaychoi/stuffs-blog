(function () {
  var root = document.documentElement;
  var storageKey = "stuffs_theme";
  var theme = null;

  root.classList.add("js");

  try {
    var stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") {
      theme = stored;
    }
  } catch (error) {
    // Ignore blocked storage access.
  }

  if (!theme && window.matchMedia) {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  if (!theme) {
    theme = "light";
  }

  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === "dark" ? "#25231f" : "#f3f1e7";

  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    var lastTouchEndMs = 0;
    var doubleTapWindowMs = 300;

    // Prevent iOS/Android double-tap page zoom while keeping normal taps/scrolling.
    document.addEventListener(
      "touchend",
      function (event) {
        if (!event.cancelable || event.changedTouches.length !== 1 || event.touches.length > 0) {
          return;
        }

        var currentTouchEndMs = event.timeStamp;
        if (currentTouchEndMs - lastTouchEndMs <= doubleTapWindowMs) {
          event.preventDefault();
        }

        lastTouchEndMs = currentTouchEndMs;
      },
      { passive: false }
    );

  }
})();
