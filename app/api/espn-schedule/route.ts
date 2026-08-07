import { NextResponse } from "next/server";

export const revalidate = 600;

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";
const WINDOW_DAYS = 35;
const MAX_WINDOWS = 11;

const formatDate = (date: Date) =>
  date.toISOString().slice(0, 10).replaceAll("-", "");

async function getNextEvents() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let windowIndex = 0; windowIndex < MAX_WINDOWS; windowIndex += 1) {
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() + windowIndex * WINDOW_DAYS);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + WINDOW_DAYS - 1);

    const params = new URLSearchParams({
      dates: `${formatDate(start)}-${formatDate(end)}`,
      groups: "80",
      limit: "100",
    });

    const response = await fetch(`${ESPN_SCOREBOARD_URL}?${params}`, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "TopTierMedia/1.0" },
    });

    if (!response.ok) {
      throw new Error(`ESPN request failed with status ${response.status}`);
    }

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];

    if (events.length > 0) return events;
  }

  return [];
}

export async function GET() {
  try {
    const events = await getNextEvents();
    const now = Date.now();

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
          completed: Boolean(event.status?.type?.completed),
          network: competition?.broadcasts?.[0]?.names?.[0],
          venue: competition?.venue?.fullName,
          home: team(home),
          away: team(away),
        };
      })
      .filter(
        (game: any) =>
          (!game.completed || new Date(game.date).getTime() >= now) &&
          (game.home.name !== "TBD" || game.away.name !== "TBD")
      )
      .sort(
        (first: any, second: any) =>
          new Date(first.date).getTime() - new Date(second.date).getTime()
      )
      .slice(0, 12)
      .map(({ completed: _completed, ...game }: any) => game);

    return NextResponse.json({ games });
  } catch {
    return NextResponse.json(
      { games: [], error: "Unable to load ESPN schedule" },
      { status: 502 }
    );
  }
}
