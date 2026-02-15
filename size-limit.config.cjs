module.exports = [
  {
    path: "_site/assets/css/main.css",
    limit: "60 KB"
  },
  {
    path: [
      "_site/assets/js/theme.js",
      "_site/assets/js/code-copy.js",
      "_site/assets/js/comments.js",
      "_site/assets/js/mermaid-init.js"
    ],
    limit: "60 KB"
  },
  {
    path: "_site/assets/js/vendor/mermaid.min.js",
    limit: "350 KB"
  }
];
