const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");

const exportsObject = {};
new Function("exports", ts.transpileModule(readFileSync("lib/trackerStats.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(exportsObject);
const { trackerStat } = exportsObject;

test("uses explicit counts from the published tracker copy", () => {
  assert.equal(trackerStat("playoff", { title: "Projected 16-Team CFP Bracket" }), "16-team bracket");
  assert.equal(trackerStat("coaching", { title: "Carousel: 1 open job" }), "1 open job");
  assert.equal(trackerStat("coaching", { body: { html: "<p><strong>Open in-season jobs:</strong>&nbsp;11</p>" } }), "11 open jobs");
  assert.equal(trackerStat("bowl", { excerpt: "92 FBS teams are now bowl eligible." }), "92 eligible");
  assert.equal(trackerStat("bowl", { body: "<p>Eligible programs: 84</p>" }), "84 eligible");
});

test("omits unavailable counts and never turns unrelated numbers into pills", () => {
  assert.equal(trackerStat("playoff", { title: "2026 CFP Top 25" }), undefined);
  assert.equal(trackerStat("coaching", { title: "Carousel: 0 open jobs", excerpt: "3 open jobs before the hires" }), undefined);
  assert.equal(trackerStat("bowl", { excerpt: "13 teams need another win." }), undefined);
});
