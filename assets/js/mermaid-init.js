(function () {
  var mermaidPromise;

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
