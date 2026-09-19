import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";
const MAX_DAYS_AHEAD = 70;
const GAME_LIMIT = 12;
const CACHE_SECONDS = 300;
const ESPN_TIMEOUT_MS = 6_000;
const MAX_CONSECUTIVE_FAILURES = 3;

const formatDate = (date: Date) =>
  date.toISOString().slice(0, 10).replaceAll("-", "");

async function getNextEvents() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Include yesterday so games already in progress after midnight UTC remain visible.
  today.setUTCDate(today.getUTCDate() - 1);
  const earliestGameTime = Date.now() - 8 * 60 * 60 * 1000;
  const events: any[] = [];
  let successfulRequests = 0;
  let consecutiveFailures = 0;
  const failures: string[] = [];

  // Request one day at a time. ESPN rejects date ranges, and sending a burst of
  // requests can be rate-limited in serverless environments.
  for (let dayOffset = 0; dayOffset < MAX_DAYS_AHEAD; dayOffset += 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + dayOffset);

    try {
      const params = new URLSearchParams({
        dates: formatDate(date),
        groups: "80",
        limit: "100",
      });
      const response = await fetch(`${ESPN_SCOREBOARD_URL}?${params}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(ESPN_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`ESPN request failed with status ${response.status}`);
      }
      const data = await response.json();
      successfulRequests += 1;
      consecutiveFailures = 0;
      if (Array.isArray(data.events)) events.push(...data.events);
    } catch (error) {
      consecutiveFailures += 1;
      failures.push(
        `${formatDate(date)}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;
      continue;
    }

    const currentEventCount = events.filter((event) => {
      const status = event.status?.type;
      return (
        !status?.completed &&
        (status?.state === "in" ||
          new Date(event.date).getTime() >= earliestGameTime)
      );
    }).length;

    if (currentEventCount >= GAME_LIMIT) return events;
  }

  if (successfulRequests === 0) {
    throw new Error(`Every ESPN request failed (${failures.join(", ")})`);
  }

  return events;
}

export async function GET() {
  try {
    const events = await getNextEvents();
    const earliestGameTime = Date.now() - 8 * 60 * 60 * 1000;

    const games = events
      .map((event: any) => {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors ?? [];
        const home = competitors.find((team: any) => team.homeAway === "home");
        const away = competitors.find((team: any) => team.homeAway === "away");
        const team = (competitor: any) => ({
          name: competitor?.team?.displayName ?? "TBD",
          logo: competitor?.team?.logo,
          score: competitor?.score,
        });

        return {
          id: event.id,
          date: event.date,
          status: event.status?.type?.shortDetail ?? "Scheduled",
          state: event.status?.type?.state,
          completed: Boolean(event.status?.type?.completed),
          network: competition?.broadcasts?.[0]?.names?.[0],
          venue: competition?.venue?.fullName,
          home: team(home),
          away: team(away),
        };
      })
      .filter(
        (game: any) =>
          !game.completed &&
          (game.state === "in" || new Date(game.date).getTime() >= earliestGameTime) &&
          (game.home.name !== "TBD" || game.away.name !== "TBD")
      )
      .sort(
        (first: any, second: any) =>
          new Date(first.date).getTime() - new Date(second.date).getTime()
      )
      .slice(0, GAME_LIMIT)
      .map(({ completed: _completed, state: _state, ...game }: any) => game);

    return NextResponse.json(
      { games, refreshedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error("Unable to load ESPN schedule", error);
    return NextResponse.json(
      { games: [], error: "Unable to load ESPN schedule" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
