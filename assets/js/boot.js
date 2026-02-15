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
})();
