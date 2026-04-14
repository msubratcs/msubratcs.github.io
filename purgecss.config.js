module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
  // Mermaid populates pre.mermaid (and its SVG descendants) into the DOM at
  // runtime via _includes/scripts/mermaid.liquid, so PurgeCSS cannot see the
  // descendant markup (pre.mermaid svg, any .node / .edgeLabel / .cluster
  // classes Mermaid emits) in the static HTML. Safelist any selector that
  // mentions them so rules targeting rendered Mermaid output survive the
  // production purge step.
  safelist: {
    greedy: [/mermaid/, /unloaded/],
  },
};
