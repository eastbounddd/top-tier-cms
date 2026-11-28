const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function load(name) {
  const exports = {};
  const source = fs.readFileSync("lib/" + name + ".ts", "utf8");
  new Function("exports", ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)(exports);
  return exports;
}

test("cover alt text prefers the editor alt field, then caption, then headline", () => {
  const { articleCoverAlt } = load("articleCoverAlt");
  assert.equal(articleCoverAlt({ title: "Headline", body: { cover_alt: " Photo alt ", cover_caption: "Caption" } }), "Photo alt");
  assert.equal(articleCoverAlt({ title: "Headline", body: { cover_alt: " ", cover_caption: " Caption " } }), "Caption");
  assert.equal(articleCoverAlt({ title: "Headline", body: "Old article body" }), "Headline");
});

test("discloses known partner articles and respects explicit editor settings", () => {
  const { articleSponsorship, tagSponsoredLinks } = load("articleSponsorship");
  const slug = "top-tier-x-underdog-sports";
  assert.deepEqual(articleSponsorship({ slug }), { sponsored: true, name: "Underdog" });
  assert.deepEqual(articleSponsorship({ slug, body: { partner_name: "" } }), { sponsored: false, name: "" });
  assert.deepEqual(articleSponsorship({ slug: "new", is_sponsored: true, body: { partner_name: " Acme " } }), { sponsored: true, name: "Acme" });

  const html = '<a href="https://links.pikkit.com/invite/TOPTIER" rel="noreferrer noopener">Offer</a><a href="/articles/a">Internal</a><a href="https://pikkit.com.example.test">Unrelated</a>';
  const tagged = tagSponsoredLinks(html, "Pikkit");
  assert.match(tagged, /rel="sponsored noopener noreferrer">Offer/);
  assert.match(tagged, /<a href="\/articles\/a">Internal<\/a>/);
  assert.match(tagged, /<a href="https:\/\/pikkit.com.example.test">Unrelated<\/a>/);
  assert.equal(tagSponsoredLinks(tagged, "Pikkit"), tagged);
});

test("retired writer slugs generate the current canonical path", () => {
  const { writerPath } = load("writerPaths");
  assert.equal(writerPath("kary-haeth-ca0cf206"), "/writers/kary-heath-ab2ac1d3");
  assert.equal(writerPath("a-writer"), "/writers/a-writer");
});
