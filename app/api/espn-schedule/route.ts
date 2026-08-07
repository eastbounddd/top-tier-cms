import { NextResponse } from "next/server";

export const revalidate = 600;
export async function GET() {
  try {
    const start = new Date();
    const end = new Date(start); end.setDate(end.getDate() + 14);
    const fmt = (d: Date) => d.toISOString().slice(0,10).replaceAll("-", "");
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${fmt(start)}-${fmt(end)}&limit=100`;
    const response = await fetch(url, { next: { revalidate: 600 }, headers: { "User-Agent": "TopTierMedia/1.0" } });
    if (!response.ok) throw new Error("ESPN request failed");
    const data = await response.json();
    const games = (data.events ?? []).map((event: any) => {
      const comp = event.competitions?.[0]; const competitors = comp?.competitors ?? [];
      const home = competitors.find((c: any) => c.homeAway === "home"); const away = competitors.find((c: any) => c.homeAway === "away");
      const team = (c: any) => ({ name: c?.team?.displayName ?? "TBD", logo: c?.team?.logo, score: c?.score });
      return { id: event.id, date: event.date, status: event.status?.type?.shortDetail ?? "Scheduled", network: comp?.broadcasts?.[0]?.names?.[0], venue: comp?.venue?.fullName, home: team(home), away: team(away) };
    }).filter((g: any) => g.home.name !== "TBD" || g.away.name !== "TBD").slice(0, 12);
    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ games: [], error: "Unable to load ESPN schedule" }, { status: 502 });
  }
}
