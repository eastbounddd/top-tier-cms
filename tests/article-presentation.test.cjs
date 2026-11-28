const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");

const exportsStub = {};
const source = ts.transpileModule(readFileSync("lib/articlePresentation.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function("exports", source)(exportsStub);
const { articlePresentation, normalizeArticleText } = exportsStub;

test("removes CMS foreground overrides while retaining lists, links and layout styles", () => {
  const html = `<ul style="color:white!important; padding: 8px"><li class="text-white" style='COLOR:#fff; -webkit-text-fill-color:#fafafa !important'><strong>Teams</strong> <a href="/schools/lsu" title="Keep color='red'">LSU</a></li></ul><font color="#fff">Legacy text</font>`;
  assert.equal(normalizeArticleText(html), `<ul style="padding: 8px"><li class="text-white"><strong>Teams</strong> <a href="/schools/lsu" title="Keep color='red'">LSU</a></li></ul><font>Legacy text</font>`);
});

test("keeps ranked markup and table structure while removing explicit text colors", () => {
  const data = articlePresentation(`<h2 style="color:#fff!important">3. Third</h2><div style="color:white">NFL line: 2 yards.</div><h2>2. Second</h2><h2>1. First</h2><table><thead><tr><th style="color:#fff">Team</th></tr></thead><tbody><tr><td style="color:white">LSU</td></tr></tbody></table>`);
  assert.equal(data.ranks.length, 3);
  assert.match(data.body, /id="rank-3" class="ranked-heading"/);
  assert.match(data.body, /<div class="rank-stat">NFL line: 2 yards.<\/div>/);
  assert.match(data.body, /<th>Team<\/th>/);
  assert.match(data.body, /<td>LSU<\/td>/);
  assert.doesNotMatch(data.body, /style=/);
});

test("prefers authored takeaways and removes the duplicated body list", () => {
  const html = "<h2>Intro</h2><p>Keep this.</p><h2><strong>Key Takeaways:</strong></h2><p><br></p><div><ul><li><strong>Game time:</strong> Friday at noon.</li><li>Keep an eye on the secondary.</li></ul></div><p>Keep this too.</p>";
  const extracted = articlePresentation(html);
  assert.deepEqual(extracted.takeaways, ["**Game time:** Friday at noon.", "Keep an eye on the secondary."]);
  assert.equal(extracted.body, "<h2>Intro</h2><p>Keep this.</p><p>Keep this too.</p>");
  const authored = ["**Editor note:** A completely different takeaway."];
  assert.deepEqual(articlePresentation(html, "Unused excerpt", authored).takeaways, authored);
  assert.deepEqual(exportsStub.takeawayLead(authored[0]), { lead: "Editor note:", rest: " A completely different takeaway." });
  assert.deepEqual(exportsStub.authoredTakeaways({ takeaways: ["Legacy takeaway"] }), ["Legacy takeaway"]);
  assert.deepEqual(exportsStub.authoredTakeaways({ keyTakeaways: [], takeaways: ["Removed legacy takeaway"] }), []);
});

test("fallback omits repeated sentences, case or punctuation duplicates, fragments, and ellipses", () => {
  const html = "<p>The Iron Bowl. The Tigers will get their final home game.</p><p>The TIGERS will get their final home game!</p><p>Alabama needs to protect the football late...</p>";
  assert.deepEqual(articlePresentation(html, "The Tigers will get their final home game.").takeaways, [
    "The Tigers will get their final home game.", "Alabama needs to protect the football late",
  ]);
  assert.deepEqual(articlePresentation("<p>The Iron Bowl.</p>", "Only one useful sentence is available here.").takeaways, []);
  const five = Array.from({ length: 5 }, (_, i) => "<p>This sentence is a different useful point " + i + ".</p>").join("");
  assert.equal(articlePresentation(five).takeaways.length, 4);
});
