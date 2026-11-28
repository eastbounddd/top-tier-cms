const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function load(name, dependencies = {}) {
  const exports = {};
  const source = fs.readFileSync("lib/" + name + ".ts", "utf8");
  new Function("exports", "require", ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)(exports, key => dependencies[key]);
  return exports;
}
const { dashboardFilters, dashboardHref, dashboardDateBounds } = load("dashboardFilters", {
  "@/lib/articleWorkflow": load("articleWorkflow"),
  "@/lib/storyLabels": load("storyLabels"),
});

test("URLs round-trip combined dashboard filters, tabs, sorting and pagination", () => {
  const filters = dashboardFilters({ q: "  Iron Bowl  ", school: "Auburn", category: "College Football",
    author: "name:Jane Doe", label: "PREVIEW", partner: "no", featured: "yes",
    sort: "oldest", status: "published", page: "2", from: "2026-11-01", to: "2026-11-27" });
  const url = new URL(dashboardHref(filters), "https://www.toptierstate.net");
  assert.equal(url.pathname, "/dashboard");
  assert.deepEqual(dashboardFilters(Object.fromEntries(url.searchParams)), filters);
  assert.equal(dashboardHref(dashboardFilters({})), "/dashboard");
  assert.equal(dashboardFilters({ page: "-2", sort: "bad", label: "unknown", author: "profile:bad" }).page, 1);
  assert.equal(dashboardFilters({ author: "profile:bad" }).author, "");
});

test("date filters include the full Central Time day even across DST", () => {
  const bounds = dashboardDateBounds(dashboardFilters({ from: "2026-11-01", to: "2026-11-01" }));
  assert.deepEqual(bounds, { from: "2026-11-01T05:00:00.000Z", until: "2026-11-02T06:00:00.000Z" });
  assert.equal(dashboardFilters({ to: "2026-02-30" }).to, "");
});
