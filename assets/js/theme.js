(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var storageKey = "stuffs_theme";
  var toggleButton = document.getElementById("theme-toggle");
  var toggleLabel = toggleButton ? toggleButton.querySelector(".theme-toggle__label") : null;
  var menuButton = document.getElementById("menu-toggle");
  var nav = document.getElementById("site-nav");
  var header = document.querySelector(".site-header");
  var lastScrollY = 0;
  var headerHideGuardUntil = 0;
  var menuCloseTimer = 0;
  var menuCloseDurationMs = 220;

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

  function isMobileViewport() {
    return Boolean(window.matchMedia && window.matchMedia("(max-width: 639px)").matches);
  }

  function setMenuState(open, immediate) {
    if (!menuButton || !nav) {
      return;
    }

    var onMobile = isMobileViewport();

    if (menuCloseTimer) {
      window.clearTimeout(menuCloseTimer);
      menuCloseTimer = 0;
    }

    if (!onMobile) {
      nav.dataset.closing = "false";
      nav.dataset.open = "true";
      menuButton.dataset.open = "true";
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "Close navigation menu");
      if (header) {
        header.dataset.menuOpen = "false";
        header.style.removeProperty("--mobile-menu-panel-height");
      }
      return;
    }

    if (open) {
      nav.dataset.closing = "false";
      nav.dataset.open = "true";
      menuButton.dataset.open = "true";
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "Close navigation menu");

      if (header) {
        header.dataset.menuOpen = "true";
        header.classList.remove("site-header--hidden");
        window.requestAnimationFrame(function () {
          header.style.setProperty("--mobile-menu-panel-height", nav.offsetHeight + "px");
        });
      }
      return;
    }

    menuButton.dataset.open = "false";
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");

    if (immediate || (nav.dataset.open !== "true" && nav.dataset.closing !== "true")) {
      nav.dataset.closing = "false";
      nav.dataset.open = "false";
      if (header) {
        header.dataset.menuOpen = "false";
        header.style.removeProperty("--mobile-menu-panel-height");
      }
      return;
    }

    nav.dataset.closing = "true";
    if (header) {
      header.dataset.menuOpen = "false";
    }

    menuCloseTimer = window.setTimeout(function () {
      nav.dataset.closing = "false";
      nav.dataset.open = "false";
      if (header) {
        header.dataset.menuOpen = "false";
        header.style.removeProperty("--mobile-menu-panel-height");
      }
      menuCloseTimer = 0;
    }, menuCloseDurationMs);
  }

  function isMobileMenuActive() {
    return Boolean(
      menuButton &&
        nav &&
        isMobileViewport() &&
        (nav.dataset.open === "true" || nav.dataset.closing === "true")
    );
  }

  function isMobileMenuVisible() {
    return Boolean(menuButton && nav && isMobileViewport() && nav.dataset.open === "true" && nav.dataset.closing !== "true");
  }

  function toggleMenu() {
    if (!menuButton || !nav) {
      return;
    }

    setMenuState(!isMobileMenuVisible());
  }

  function syncMenuToViewport() {
    if (!menuButton || !nav) {
      return;
    }

    if (isMobileViewport()) {
      setMenuState(false, true);
    } else {
      setMenuState(true, true);
    }
  }

  function updateMobileHeaderVisibility() {
    if (!header) {
      return;
    }

    var currentY = Math.max(window.scrollY, 0);
    if (Date.now() < headerHideGuardUntil) {
      header.classList.remove("site-header--hidden");
      lastScrollY = currentY;
      return;
    }

    var delta = currentY - lastScrollY;
    var mobileMenuIsOpen = isMobileMenuActive();

    if (currentY < 24 || mobileMenuIsOpen || delta < -3) {
      header.classList.remove("site-header--hidden");
    } else if (delta > 5) {
      header.classList.add("site-header--hidden");
    }

    lastScrollY = currentY;
  }

  var initialTheme = readStoredTheme() || getCurrentTheme();
  applyTheme(initialTheme, false);

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      headerHideGuardUntil = Date.now() + 360;
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
      headerHideGuardUntil = Date.now() + 360;
      applyTheme(event.matches ? "dark" : "light", false);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener);
    }
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", toggleMenu);

    nav.addEventListener("click", function (event) {
      if (!isMobileMenuActive()) {
        return;
      }

      var target = event.target;
      if (!target || typeof target.closest !== "function") {
        return;
      }

      var link = target.closest("a");
      if (!link) {
        return;
      }

      var href = link.getAttribute("href") || "";
      var isInPageAnchor = href.indexOf("#") === 0;
      var opensNewTab = link.target === "_blank";

      if (isInPageAnchor || opensNewTab) {
        setMenuState(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (!isMobileMenuActive()) {
        return;
      }

      var target = event.target;
      if (!target || typeof target.closest !== "function") {
        return;
      }

      if (target.closest("#site-nav") || target.closest("#menu-toggle")) {
        return;
      }

      setMenuState(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isMobileMenuActive()) {
        setMenuState(false);
        menuButton.focus();
      }
    });

    window.addEventListener("resize", syncMenuToViewport);
    window.addEventListener("resize", updateMobileHeaderVisibility);
    syncMenuToViewport();
  }

  lastScrollY = window.scrollY;
  window.addEventListener("scroll", updateMobileHeaderVisibility, { passive: true });
  updateMobileHeaderVisibility();
})();
