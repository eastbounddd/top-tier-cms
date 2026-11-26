const espnFootball = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const powerConferences: Record<string, string> = { "1": "ACC", "4": "Big 12", "5": "Big Ten", "8": "SEC" };
const day = 86_400_000;

type EspnTeam = { id?: string; location?: string; shortDisplayName?: string; conferenceId?: string; logo?: string };
type EspnCompetitor = { homeAway?: string; team?: EspnTeam; score?: string };
type EspnEvent = {
  id: string;
  date: string;
  status?: { type?: { state?: string; completed?: boolean; shortDetail?: string; name?: string } };
  competitions?: {
    timeValid?: boolean;
    competitors?: EspnCompetitor[];
    groups?: { shortName?: string; isConference?: boolean };
    broadcasts?: { names?: string[] }[];
    geoBroadcasts?: { market?: { type?: string }; media?: { shortName?: string } }[];
  }[];
};
type RankingPoll = { type?: string; ranks?: { current: number; team?: {id?: string} }[] };
type Team = { school: string; name: string; rank?: number; score?: string; conference?: string; logo?: string };
export type CollegeGame = {
  id: string;
  date: string;
  timeValid: boolean;
  state: "live" | "upcoming" | "final";
  status?: string;
  network?: string;
  conference?: string;
  away: Team;
  home: Team;
};

async function espn<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(espnFootball + path, {
      next: { revalidate: 60 }, signal: AbortSignal.timeout(3000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export function selectCollegeGames(events: EspnEvent[], polls: RankingPoll[], limit: number, now = Date.now()): CollegeGame[] {
  const ap = new Map((polls.find(poll => poll.type === "ap")?.ranks ?? []).flatMap(entry =>
    entry.team?.id && entry.current >= 1 && entry.current <= 25 ? [[entry.team.id, entry.current] as const] : []
  ));
  const games = events.flatMap(event => {
    const competition = event.competitions?.[0];
    const status = event.status?.type;
    const start = Date.parse(event.date);
    if (!competition || !Number.isFinite(start) || /POSTPONED|CANCELED|SUSPENDED/i.test(status?.name ?? "")) return [];
    const state = status?.state === "in" ? "live" :
      status?.state === "pre" && start >= now && start <= now + 9 * day ? "upcoming" :
      status?.state === "post" && status.completed && start <= now && start >= now - 4 * day ? "final" : null;
    if (!state) return [];
    const teams = (side: "home" | "away"): Team | null => {
      const competitor = competition.competitors?.find(item => item.homeAway === side);
      const team = competitor?.team;
      if (!team?.location) return null;
      return {
        school: team.location, name: team.shortDisplayName || team.location,
        rank: ap.get(team.id ?? ""), score: competitor?.score,
        conference: powerConferences[team.conferenceId ?? ""],
        logo: team.logo && /^https:\/\/a\.espncdn\.com\//i.test(team.logo) ? team.logo : undefined,
      };
    };
    const home = teams("home"), away = teams("away");
    if (!home || !away) return [];
    const conference = competition.groups?.isConference ? competition.groups.shortName :
      [...new Set([away.conference, home.conference].filter(Boolean))].join(" / ") || undefined;
    const network = competition.broadcasts?.flatMap(item => item.names ?? []).filter(Boolean).join(" / ") ||
      competition.geoBroadcasts?.find(item => item.market?.type === "National")?.media?.shortName;
    const game: CollegeGame = {
      id: event.id, date: event.date, timeValid: competition.timeValid !== false, state,
      status: status?.shortDetail, network, conference, away, home,
    };
    const weight = [away, home].reduce((sum, team) =>
      sum + (team.rank ? 40 - team.rank : 0) + (team.conference ? 8 : 0), 0);
    const marquee = Boolean(away.rank || home.rank || (away.conference && home.conference));
    const priority = state === "live" ? 0 : state === "upcoming" && marquee ? 1 :
      state === "final" && marquee ? 2 : state === "upcoming" ? 3 : 4;
    return [{ game, priority, weight, start }];
  });
  return games.sort((a, b) => a.priority - b.priority || b.weight - a.weight ||
    (a.game.state === "final" ? b.start - a.start : a.start - b.start))
    .slice(0, limit).map(item => item.game);
}

export async function collegeGames(limit: number) {
  const [scoreboard, rankings] = await Promise.all([
    espn<{ events?: EspnEvent[] }>("/scoreboard?groups=80&limit=50"),
    espn<{ rankings?: RankingPoll[] }>("/rankings"),
  ]);
  return selectCollegeGames(scoreboard?.events ?? [], rankings?.rankings ?? [], limit);
}
