const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");

const exportsStub = {};
const source = ts.transpileModule(readFileSync("lib/collegeGames.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function("exports", source)(exportsStub);
const { selectCollegeGames } = exportsStub;

const now = Date.parse("2026-11-26T21:00:00Z");
const home = { homeAway: "home", team: { id: "1", location: "Nebraska", conferenceId: "5", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/158.png" }, score: "14" };
const away = { homeAway: "away", team: { id: "2", location: "Iowa", conferenceId: "5", logo: "https://example.com/unexpected.png" }, score: "10" };
const event = (id, state, offset, competitors = [home, away]) => ({
  id, date: new Date(now + offset * 3600000).toISOString(),
  status: { type: { state, completed: state === "post", shortDetail: state === "in" ? "Q3" : "Final" } },
  competitions: [{ competitors, timeValid: true, groups: { shortName: "Big Ten", isConference: true }, broadcasts: [{ names: ["CBS"] }] }],
});

test("prioritizes live, AP marquee upcoming, then recent marquee finals", () => {
  const ordinary = [{ ...home, team: { id: "3", location: "Utah State" } }, { ...away, team: { id: "4", location: "UNLV" } }];
  const events = [event("ordinary", "pre", 1, ordinary), event("old-final", "post", -200),
    event("recent-final", "post", -12), event("marquee", "pre", 2), event("live", "in", -1)];
  const polls = [{ type: "cfp", ranks: [{ current: 1, team: { id: "3" } }] },
    { type: "ap", ranks: [{ current: 18, team: { id: "1" } }] }];
  const games = selectCollegeGames(events, polls, 4, now);
  assert.deepEqual(games.map(game => game.id), ["live", "marquee", "recent-final", "ordinary"]);
  assert.deepEqual([games[0].home.score, games[0].away.score, games[0].network, games[0].conference], ["14", "10", "CBS", "Big Ten"]);
  assert.equal(games[1].home.rank, 18);
  assert.equal(games[3].home.rank, undefined);
  assert.equal(games[0].home.logo, home.team.logo);
  assert.equal(games[0].away.logo, undefined);
});

test("omits postponed and incomplete games and handles an unavailable feed", () => {
  const postponed = event("postponed", "pre", 1);
  postponed.status.type.name = "STATUS_POSTPONED";
  assert.deepEqual(selectCollegeGames([postponed, event("missing-team", "pre", 2, [home])], [], 4, now), []);
  assert.deepEqual(selectCollegeGames([], [], 4, now), []);
});
