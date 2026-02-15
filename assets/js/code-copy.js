(function () {
  var liveRegion = document.getElementById("aria-live-region");

  function announce(message) {
    if (!liveRegion) {
      return;
    }
    liveRegion.textContent = "";
    window.requestAnimationFrame(function () {
      liveRegion.textContent = message;
    });
  }

  function detectLanguage(block) {
    var nodes = [block, block.parentElement, block.parentElement ? block.parentElement.parentElement : null];

    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      if (!node || !node.className) {
        continue;
      }

      var text = String(node.className);
      var match = text.match(/(?:language|highlighter)-([a-z0-9+_-]+)/i);
      if (match && match[1]) {
        return match[1].replace(/[_-]/g, " ");
      }
    }

    return "code";
  }

  function extractSource(block) {
    var preferred = block.querySelector(".rouge-code pre") || block.querySelector("pre code") || block.querySelector("pre");
    var source = preferred ? preferred.textContent : "";
    return (source || "").replace(/\n$/, "");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();

      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function buildPanel(block, index) {
    if (block.closest(".code-panel")) {
      return;
    }

    var language = detectLanguage(block);
    var source = extractSource(block);

    var panel = document.createElement("section");
    panel.className = "code-panel";

    var toolbar = document.createElement("div");
    toolbar.className = "code-panel__toolbar";

    var label = document.createElement("span");
    label.className = "code-panel__label";
    label.textContent = language;

    var button = document.createElement("button");
    button.className = "code-copy-button";
    button.type = "button";
    button.setAttribute("aria-label", "Copy code block to clipboard");
    button.setAttribute("data-code-index", String(index));
    button.textContent = "Copy";

    button.addEventListener("click", function () {
      copyText(source)
        .then(function () {
          button.dataset.state = "copied";
          button.textContent = "Copied";
          announce("Code copied to clipboard.");

          window.setTimeout(function () {
            button.dataset.state = "idle";
            button.textContent = "Copy";
          }, 1400);
        })
        .catch(function () {
          announce("Copy failed.");
        });
    });

    toolbar.appendChild(label);
    toolbar.appendChild(button);

    var content = document.createElement("div");
    content.className = "code-panel__content";
    content.tabIndex = 0;
    content.setAttribute("role", "region");
    content.setAttribute("aria-label", "Scrollable code block");

    var parent = block.parentNode;
    if (!parent) {
      return;
    }

    parent.insertBefore(panel, block);
    content.appendChild(block);
    panel.appendChild(toolbar);
    panel.appendChild(content);
  }

  function enhanceCodeBlocks() {
    var blocks = document.querySelectorAll(".post-content .highlight");
    blocks.forEach(function (block, index) {
      if (!block.querySelector("pre")) {
        return;
      }
      buildPanel(block, index);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceCodeBlocks);
  } else {
    enhanceCodeBlocks();
  }
})();
