const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");

function load(file, deps = {}) {
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    name => deps[name] || require(name), module, module.exports,
  );
  return module.exports;
}

const { chicagoDate, publicArticles } = load("lib/articleWorkflow.ts");
const { followPromo, promoHtml, safeArticleUrl, videoHtml, withFollowPromo } =
  load("lib/articleBlocks.ts");

test("interprets Chicago scheduling in standard and daylight time and handles DST transitions", () => {
  assert.equal(chicagoDate("2027-01-16T09:00"), "2027-01-16T15:00:00.000Z");
  assert.equal(chicagoDate("2027-07-16T09:00"), "2027-07-16T14:00:00.000Z");
  assert.equal(chicagoDate("2027-03-14T02:30"), null);
  assert.equal(chicagoDate("2027-11-07T01:30"), "2027-11-07T06:30:00.000Z");
  assert.equal(chicagoDate("2027-02-31T12:00"), null);
  assert.match(publicArticles(), /^status\.eq\.published,and\(status\.eq\.scheduled,published_at\.lte\.\d{4}/);
});

test("inserts the mid-article follow card once and keeps other promo cards intact", () => {
  const body = "<p>One</p><p>Two</p><p>Three</p><p>Four</p>";
  const card = promoHtml(followPromo);
  assert.equal(withFollowPromo(body, false), body);
  assert.equal(withFollowPromo(body, true), body.replace("<p>Three</p>", "<p>Three</p>" + card));
  assert.equal(withFollowPromo(body + card, true), body + card);
  assert.match(promoHtml({ ...followPromo, title: "<script>" }), /&lt;script&gt;/);
  assert.equal(safeArticleUrl("//example.com"), "");
  assert.equal(safeArticleUrl("javascript:alert(1)"), "");
  assert.match(videoHtml("https://youtu.be/dQw4w9WgXcQ"), /youtube-nocookie\.com\/embed\//);
  assert.match(videoHtml("https://www.instagram.com/reel/abc123/"), /instagram\.com\/reel\/abc123\/embed\//);
  assert.equal(videoHtml("https://instagram.com.example.test/reel/abc123/"), "");
});
