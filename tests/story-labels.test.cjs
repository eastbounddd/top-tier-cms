const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");
const exportsObject = {};
new Function("exports", ts.transpileModule(fs.readFileSync("lib/storyLabels.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(exportsObject);
const { savedStoryLabels, visibleStoryLabels } = exportsObject;

test("expires BREAKING at exactly 12 hours and preserves the other label", () => {
  const published = "2026-11-27T12:00:00.000Z";
  const article = { labels: ["BREAKING", "EXCLUSIVE"], published_at: published };
  const cutoff = Date.parse(published) + 12 * 3600_000;
  assert.deepEqual(visibleStoryLabels(article, cutoff - 1), ["BREAKING", "EXCLUSIVE"]);
  assert.deepEqual(visibleStoryLabels(article, cutoff), ["EXCLUSIVE"]);
  assert.deepEqual(visibleStoryLabels(article, Date.parse(published) - 1), ["EXCLUSIVE"]);
});

test("keeps the old Breaking and Hot rules until migration, then honors explicit choices", () => {
  assert.deepEqual(savedStoryLabels({ category: "Breaking News", is_top_story: true }), ["BREAKING"]);
  assert.deepEqual(savedStoryLabels({ is_top_story: true, title: "Season preview" }), ["HOT"]);
  assert.deepEqual(savedStoryLabels({ is_top_story: true, title: "Expected to flip" }), []);
  assert.deepEqual(savedStoryLabels({ labels: [], is_top_story: true }), []);
  assert.deepEqual(savedStoryLabels({ labels: ["PARTNER", "RECAP", "RECAP", "unknown"] }), ["PARTNER", "RECAP"]);
});
