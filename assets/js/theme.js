(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var storageKey = "stuffs_theme";
  var toggleButton = document.getElementById("theme-toggle");
  var toggleLabel = toggleButton ? toggleButton.querySelector(".theme-toggle__label") : null;
  var menuButton = document.getElementById("menu-toggle");
  var nav = document.getElementById("site-nav");

  function readStoredTheme() {
    try {
      var value = localStorage.getItem(storageKey);
      if (value === "light" || value === "dark") {
        return value;
      }
    } catch (error) {
      // Ignore blocked storage access.
    }
    return null;
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Session-only fallback is acceptable when storage is blocked.
    }
  }

  function prefersDark() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function updateToggle(theme) {
    if (!toggleButton) {
      return;
    }

    var isDark = theme === "dark";
    toggleButton.setAttribute("aria-pressed", String(isDark));
    toggleButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

    if (toggleLabel) {
      toggleLabel.textContent = isDark ? "Light" : "Dark";
    }
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    root.style.backgroundColor = theme === "dark" ? "#25231f" : "#f3f1e7";
    if (document.body) {
      document.body.style.backgroundColor = theme === "dark" ? "#25231f" : "#f3f1e7";
    }
    updateToggle(theme);

    if (persist) {
      storeTheme(theme);
    }

    document.dispatchEvent(new CustomEvent("stuffs:themechange", { detail: { theme: theme } }));
  }

  function getCurrentTheme() {
    var current = root.getAttribute("data-theme");
    if (current === "light" || current === "dark") {
      return current;
    }
    return prefersDark() ? "dark" : "light";
  }

  function setMenuState(open) {
    if (!menuButton || !nav) {
      return;
    }

    nav.dataset.open = open ? "true" : "false";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  }

  function syncMenuToViewport() {
    if (!menuButton || !nav) {
      return;
    }

    if (window.matchMedia("(max-width: 639px)").matches) {
      setMenuState(false);
    } else {
      setMenuState(true);
    }
  }

  var initialTheme = readStoredTheme() || getCurrentTheme();
  applyTheme(initialTheme, false);

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      var nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  if (window.matchMedia) {
    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var listener = function (event) {
      if (readStoredTheme() !== null) {
        return;
      }
      applyTheme(event.matches ? "dark" : "light", false);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener);
    }
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      setMenuState(nav.dataset.open !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.dataset.open === "true" && window.matchMedia("(max-width: 639px)").matches) {
        setMenuState(false);
        menuButton.focus();
      }
    });

    window.addEventListener("resize", syncMenuToViewport);
    syncMenuToViewport();
  }
})();
