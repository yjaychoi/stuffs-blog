(function () {
  function utterancesTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "github-dark" : "github-light";
  }

  function mountUtterances(shell, toggleButton, mountNode) {
    if (!shell || !toggleButton || !mountNode || shell.dataset.loaded === "true") {
      return;
    }

    var repo = shell.getAttribute("data-comments-repo");
    var issueTerm = shell.getAttribute("data-comments-issue-term");

    if (!repo || !issueTerm) {
      mountNode.innerHTML = "<p class=\"comments-shell__fallback\">Comments are unavailable due to incomplete configuration.</p>";
      return;
    }

    shell.dataset.loaded = "pending";
    toggleButton.disabled = true;

    var script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    script.setAttribute("label", "comment");
    script.setAttribute("theme", utterancesTheme());

    script.onload = function () {
      shell.dataset.loaded = "true";
      toggleButton.disabled = false;
      toggleButton.setAttribute("aria-expanded", "true");
      toggleButton.textContent = "Comments loaded";
    };

    script.onerror = function () {
      shell.dataset.loaded = "false";
      toggleButton.disabled = false;
      toggleButton.textContent = "Show comments";
      mountNode.innerHTML = "<p class=\"comments-shell__fallback\">Unable to load comments right now. Please try again later.</p>";
    };

    mountNode.innerHTML = "";
    mountNode.appendChild(script);
  }

  function updateUtterancesTheme() {
    var iframe = document.querySelector(".comments-shell iframe.utterances-frame");
    if (!iframe || !iframe.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      {
        type: "set-theme",
        theme: utterancesTheme()
      },
      "https://utteranc.es"
    );
  }

  function initComments() {
    var shells = document.querySelectorAll(".comments-shell[data-comments-provider]");

    shells.forEach(function (shell) {
      var provider = shell.getAttribute("data-comments-provider");
      if (provider !== "utterances") {
        return;
      }

      var toggleButton = shell.querySelector("[data-comments-toggle]");
      var mountNode = shell.querySelector("[data-comments-mount]");
      if (!toggleButton || !mountNode) {
        return;
      }

      var activate = function () {
        mountUtterances(shell, toggleButton, mountNode);
      };

      toggleButton.addEventListener("click", activate);
      toggleButton.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  document.addEventListener("stuffs:themechange", updateUtterancesTheme);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComments);
  } else {
    initComments();
  }
})();
