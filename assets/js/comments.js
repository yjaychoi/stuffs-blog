(function () {
  var MOUNT_TIMEOUT_MS = 2500;
  var LOCALHOST_HOSTS = {
    localhost: true,
    "127.0.0.1": true,
    "[::1]": true
  };

  function isLoopbackHost(hostname) {
    return !!LOCALHOST_HOSTS[hostname];
  }

  function parseUrl(value) {
    try {
      return new URL(value, window.location.href);
    } catch (error) {
      return null;
    }
  }

  function looksLikeCustomTheme(themeValue) {
    if (!themeValue) {
      return false;
    }

    return /^https?:\/\//i.test(themeValue) || themeValue.indexOf("//") === 0 || themeValue.charAt(0) === "/";
  }

  function canUseCustomThemeUrl(themeValue, resolvedTheme) {
    if (!looksLikeCustomTheme(themeValue)) {
      return true;
    }

    var parsed = parseUrl(resolvedTheme);
    if (!parsed) {
      return false;
    }

    if (parsed.protocol !== "https:") {
      return false;
    }

    if (isLoopbackHost(parsed.hostname)) {
      return false;
    }

    return true;
  }

  function resolveThemeValue(themeValue) {
    if (!themeValue) {
      return "";
    }

    if (/^https?:\/\//i.test(themeValue)) {
      return themeValue;
    }

    if (themeValue.indexOf("//") === 0) {
      return window.location.protocol + themeValue;
    }

    if (themeValue.charAt(0) === "/") {
      return window.location.origin + themeValue;
    }

    return themeValue;
  }

  function giscusTheme(shell) {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    var darkTheme = shell.getAttribute("data-comments-theme-dark") || "dark_dimmed";
    var lightTheme = shell.getAttribute("data-comments-theme-light") || "light";
    var fallbackTheme = isDark ? "dark_dimmed" : "light";
    var selectedTheme = isDark ? darkTheme : lightTheme;
    var resolvedTheme = resolveThemeValue(selectedTheme);

    if (!resolvedTheme) {
      return fallbackTheme;
    }

    if (!canUseCustomThemeUrl(selectedTheme, resolvedTheme)) {
      return fallbackTheme;
    }

    return resolvedTheme;
  }

  function showFallback(mountNode, message) {
    if (!mountNode) {
      return;
    }

    var fallback = mountNode.querySelector("[data-comments-loading]") || mountNode.querySelector(".comments-shell__fallback");
    if (!fallback) {
      fallback = document.createElement("p");
      fallback.className = "comments-shell__fallback";
      fallback.setAttribute("data-comments-loading", "true");
      mountNode.insertBefore(fallback, mountNode.firstChild);
    }

    fallback.textContent = message;
    fallback.removeAttribute("hidden");
  }

  function mountGiscus(shell) {
    if (!shell || shell.dataset.loaded === "true" || shell.dataset.loaded === "pending") {
      return;
    }

    var mountNode = shell.querySelector("[data-comments-mount]");
    if (!mountNode) {
      return;
    }

    var repo = shell.getAttribute("data-comments-repo");
    var repoId = shell.getAttribute("data-comments-repo-id");
    var category = shell.getAttribute("data-comments-category");
    var categoryId = shell.getAttribute("data-comments-category-id");
    var mapping = shell.getAttribute("data-comments-mapping") || "url";
    var strict = shell.getAttribute("data-comments-strict") || "0";
    var reactionsEnabled = shell.getAttribute("data-comments-reactions-enabled") || "1";
    var emitMetadata = shell.getAttribute("data-comments-emit-metadata") || "0";
    var inputPosition = shell.getAttribute("data-comments-input-position") || "bottom";
    var lang = shell.getAttribute("data-comments-lang") || "ko";
    var loading = shell.getAttribute("data-comments-loading") || "lazy";

    if (!repo || !repoId || !category || !categoryId) {
      shell.dataset.loaded = "false";
      showFallback(mountNode, "Comments are unavailable due to incomplete configuration.");
      return;
    }

    shell.dataset.loaded = "pending";

    var fallback = mountNode.querySelector("[data-comments-loading]");
    if (fallback) {
      fallback.textContent = "Loading comments...";
    }

    var timedOut = false;
    var cleanup = null;
    var onMounted = function () {
      if (timedOut) {
        return;
      }
      shell.dataset.loaded = "true";
      if (fallback && fallback.parentNode) {
        fallback.parentNode.removeChild(fallback);
      }
      updateGiscusTheme();
      if (cleanup) {
        cleanup();
      }
    };

    var observer = new MutationObserver(function () {
      if (mountNode.querySelector("iframe.giscus-frame")) {
        onMounted();
      }
    });
    observer.observe(mountNode, { childList: true, subtree: true });

    var timeoutId = window.setTimeout(function () {
      if (shell.dataset.loaded === "true") {
        return;
      }
      timedOut = true;
      shell.dataset.loaded = "false";
      showFallback(
        mountNode,
        "Unable to initialize giscus comments. Check the repository/discussions configuration."
      );
      if (cleanup) {
        cleanup();
      }
    }, MOUNT_TIMEOUT_MS);

    cleanup = function () {
      observer.disconnect();
      window.clearTimeout(timeoutId);
      cleanup = null;
    };

    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", mapping);
    script.setAttribute("data-strict", strict);
    script.setAttribute("data-reactions-enabled", reactionsEnabled);
    script.setAttribute("data-emit-metadata", emitMetadata);
    script.setAttribute("data-input-position", inputPosition);
    script.setAttribute("data-theme", giscusTheme(shell));
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-loading", loading);
    script.setAttribute("data-comments-client", "giscus");

    script.onload = function () {};

    script.onerror = function () {
      timedOut = true;
      shell.dataset.loaded = "false";
      showFallback(mountNode, "Unable to load comments right now. Please try again later.");
      if (cleanup) {
        cleanup();
      }
    };

    var existingScript = mountNode.querySelector("script[data-comments-client='giscus']");
    if (existingScript) {
      existingScript.parentNode.removeChild(existingScript);
    }
    mountNode.appendChild(script);

    if (mountNode.querySelector("iframe.giscus-frame")) {
      onMounted();
    }
  }

  function updateGiscusTheme() {
    var shells = Array.prototype.slice.call(document.querySelectorAll(".comments-shell[data-comments-provider='giscus']"));
    shells.forEach(function (shell) {
      var iframe = shell.querySelector("iframe.giscus-frame");
      if (!iframe || !iframe.contentWindow) {
        return;
      }

      iframe.contentWindow.postMessage(
        {
          giscus: {
            setConfig: {
              theme: giscusTheme(shell)
            }
          }
        },
        "https://giscus.app"
      );
    });
  }

  function initComments() {
    var shells = Array.prototype.slice.call(document.querySelectorAll(".comments-shell[data-comments-provider='giscus']"));
    if (!shells.length) {
      return;
    }

    var mountedByScroll = false;
    var observer = null;

    var startObserving = function () {
      if (mountedByScroll) {
        return;
      }
      mountedByScroll = true;

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }
            mountGiscus(entry.target);
            observer.unobserve(entry.target);
          });
        });

        shells.forEach(function (shell) {
          observer.observe(shell);
        });
        return;
      }

      var checkVisibility = function () {
        shells.forEach(function (shell) {
          if (shell.dataset.loaded === "true" || shell.dataset.loaded === "pending") {
            return;
          }
          var rect = shell.getBoundingClientRect();
          if (rect.top <= window.innerHeight && rect.bottom >= 0) {
            mountGiscus(shell);
          }
        });
      };

      window.addEventListener("scroll", checkVisibility, { passive: true });
      checkVisibility();
    };

    if (window.scrollY > 0) {
      startObserving();
      return;
    }

    window.addEventListener(
      "scroll",
      function onFirstScroll() {
        window.removeEventListener("scroll", onFirstScroll);
        startObserving();
      },
      { passive: true }
    );
  }

  document.addEventListener("stuffs:themechange", updateGiscusTheme);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComments);
  } else {
    initComments();
  }
})();
