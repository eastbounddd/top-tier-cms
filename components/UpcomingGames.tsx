import Link from "next/link";
import Image from "next/image";
import { collegeGames, type CollegeGame } from "@/lib/collegeGames";
import { latestTvGuidePath, schoolByName } from "@/lib/editorial";
import { schoolLogo } from "@/lib/schoolColors";

const kickoff = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric",
  hour: "numeric", minute: "2-digit", timeZoneName: "shortGeneric",
});

function GameCard({ game, guide }: { game: CollegeGame; guide: string }) {
  const hub = schoolByName(game.home.school) ?? schoolByName(game.away.school);
  const href = hub ? `/schools/${hub.slug}` : guide;
  const gameDetails = <>
    <div className="cfb-game-meta">
      {game.state === "upcoming"
        ? game.timeValid ? <time dateTime={game.date}>{kickoff.format(new Date(game.date))}</time> : <span>Kickoff time TBD</span>
        : <strong className={game.state === "live" ? "game-live" : undefined}>{game.state === "live" && <span aria-hidden="true" />}{game.state === "live" ? `Live · ${game.status || "In progress"}` : (game.status || "Final")}</strong>}
      <span>{game.network || "TV TBD"}</span>
    </div>
    <div className="cfb-matchup">
      {[game.away, game.home].map(team => {
        const school = schoolByName(team.school);
        const localLogo = school && schoolLogo(school.slug);
        const logo = localLogo || team.logo;
        return <div key={team.school}>
          <div className="cfb-team">
            {logo && <Image src={logo} alt={`${team.name} logo`} width={20} height={20} loading="lazy" unoptimized={Boolean(localLogo)} />}
            <strong>{team.rank && <small>#{team.rank} </small>}{team.name}</strong>
          </div>
          {game.state !== "upcoming" && team.score != null && <b className="cfb-score">{team.score}</b>}
        </div>;
      })}
    </div>
    <div className="cfb-game-note">{game.conference || "FBS football"}</div>
  </>;
  return <li className="cfb-game">
    <Link href={href} className="cfb-game-content">{gameDetails}</Link>
  </li>;
}

export async function UpcomingGames({ full = false }: { full?: boolean }) {
  const [games, guide] = await Promise.all([collegeGames(full ? 24 : 4), latestTvGuidePath()]);
  const live = games.some(game => game.state === "live");
  const heading = live ? "Live & Upcoming CFB Games" : "Upcoming College Football Games";

  return <section className="cfb-games" aria-labelledby="cfb-games-title">
    <div className="editorial-heading">
      <h2 id="cfb-games-title">{heading}</h2>
      {!full && <Link href={guide ?? "/tv-guide"}>Full TV Guide →</Link>}
      {full && guide && <Link href={guide}>Latest TV guide article →</Link>}
    </div>
    {games.length ? <ul className="cfb-games-grid">{games.map(game => <GameCard key={game.id} game={game} guide={guide ?? (full ? "/college-football" : "/tv-guide")} />)}</ul>
      : <p className="cfb-games-empty">No games are available in the scoreboard right now.</p>}
  </section>;
}
