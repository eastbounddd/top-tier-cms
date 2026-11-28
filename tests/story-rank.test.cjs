const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function load(name, deps = {}) {
  const exports = {};
  new Function("exports", "require", ts.transpileModule(fs.readFileSync("lib/" + name + ".ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)(exports, path => deps[path]);
  return exports;
}
const { storyScore, rankStories, selectLead, canLead } = load("storyRank", {
  "@/lib/articleSponsorship": load("articleSponsorship"),
  "@/lib/storyLabels": load("storyLabels"),
});
const now = Date.parse("2026-11-27T12:00:00Z");
const story = (slug, hours, fields = {}) => ({
  slug, published_at: new Date(now - hours * 3600_000).toISOString(), labels: [], ...fields,
});

test("freshness halves every 12 hours and active label boosts fade with it", () => {
  assert.equal(storyScore(story("now", 0), now), 100);
  assert.equal(storyScore(story("12h", 12), now), 50);
  assert.equal(storyScore(story("24h", 24), now), 25);
  assert.equal(storyScore(story("breaking", 0, { labels: ["BREAKING"] }), now), 200);
  assert.equal(storyScore(story("expired", 12, { labels: ["BREAKING"] }), now), 50);
  assert.equal(storyScore(story("neutral", 0, { labels: ["RECAP", "OPINION"] }), now), 100);
  assert.equal(storyScore(story("old-featured", 24, { labels: undefined, is_top_story: true }), now), 25);
  assert.deepEqual(rankStories([story("before", 12), story("fresh", 0)], now).map(r => r.article.slug), ["fresh", "before"]);
});

test("lead honors a current feature, ignores an expired one, and blocks partner stories", () => {
  const fresh = story("fresh", 0);
  const active = story("feature", 23, { is_top_story: true });
  const old = story("old", 25, { is_top_story: true });
  const partner = story("partner", 0, { is_top_story: true, labels: ["PARTNER"] });
  assert.equal(selectLead([fresh, active, old, partner], now), active);
  assert.equal(selectLead([fresh, old, partner], now), fresh);
  assert.equal(selectLead([story("out-of-window", 73), partner], now), undefined);
  assert.equal(canLead(story("top-tier-x-underdog-sports", 0, { labels: undefined })), false);
});
