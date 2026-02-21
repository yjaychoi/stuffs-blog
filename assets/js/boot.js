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
    var lastTouchX = 0;
    var lastTouchY = 0;
    var doubleTapWindowMs = 300;
    var doubleTapDistancePx = 24;

    function getInteractiveTapTarget(target) {
      if (!target || typeof target.closest !== "function") {
        return null;
      }

      return target.closest(
        "a, button, input, select, textarea, label, summary, [role='button'], [role='link'], [contenteditable='true'], [tabindex]:not([tabindex='-1'])"
      );
    }

    function replayTapOnInteractiveTarget(target) {
      var interactiveTarget = getInteractiveTapTarget(target);
      if (!interactiveTarget) {
        return;
      }

      if (typeof interactiveTarget.click === "function") {
        interactiveTarget.click();
        return;
      }

      interactiveTarget.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }

    // Prevent iOS/Android double-tap page zoom while keeping normal taps/scrolling.
    document.addEventListener(
      "touchend",
      function (event) {
        if (!event.cancelable || event.changedTouches.length !== 1 || event.touches.length > 0) {
          return;
        }

        var touch = event.changedTouches[0];
        var currentTouchEndMs = event.timeStamp;
        var isRapidTap = lastTouchEndMs > 0 && currentTouchEndMs - lastTouchEndMs <= doubleTapWindowMs;
        var isNearbyTap =
          Math.abs(touch.clientX - lastTouchX) <= doubleTapDistancePx &&
          Math.abs(touch.clientY - lastTouchY) <= doubleTapDistancePx;

        if (isRapidTap && isNearbyTap) {
          event.preventDefault();
          replayTapOnInteractiveTarget(event.target);
        }

        lastTouchEndMs = currentTouchEndMs;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      },
      { passive: false }
    );
  }
})();
