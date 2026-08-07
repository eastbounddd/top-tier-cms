"use client";
import { useEffect, useState } from "react";

type Team = { name: string; logo?: string; score?: string };
type Game = { id: string; date: string; status: string; network?: string; venue?: string; away: Team; home: Team };

export function UpcomingGames() {
  const [games, setGames] = useState<Game[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { const r = await fetch("/api/espn-schedule", { cache: "no-store" }); if (!r.ok) throw new Error(); const j = await r.json(); setGames(j.games ?? []); }
    catch { setError("Schedule data is temporarily unavailable."); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <section className="games shell"><div className="section-row"><div><small>NEXT ON THE SCHEDULE</small><h2>Upcoming College Football Games</h2></div><div className="game-links"><button onClick={load}>Refresh</button><a href="https://www.espn.com/college-football/schedule" target="_blank" rel="noreferrer">Full Schedule →</a></div></div>
    {loading && <p className="muted">Loading upcoming games…</p>}{error && <p className="muted">{error}</p>}
    <div className="game-row">{games.map(g => <article className="game-card" key={g.id}><div className="game-meta"><span>{new Date(g.date).toLocaleString([], { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}</span><b>{g.network || g.status}</b></div>
      <div className="team"><img src={g.away.logo || "/top-tier-logo.png"} alt=""/><strong>{g.away.name}</strong><b>{g.away.score}</b></div>
      <div className="team"><img src={g.home.logo || "/top-tier-logo.png"} alt=""/><strong>{g.home.name}</strong><b>{g.home.score}</b></div>
      {g.venue && <small>{g.venue}</small>}</article>)}</div>
  </section>;
}
