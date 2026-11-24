"use client";
import { useEffect, useState } from "react";
export function HeroVideo() {
 const [play,setPlay] = useState(false);
 useEffect(() => { const motion = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setPlay(!motion.matches); update(); motion.addEventListener("change",update); return () => motion.removeEventListener("change",update); }, []);
 return play ? <iframe src="https://www.youtube.com/embed/-6bsfeicV9E?autoplay=1&mute=1&controls=0&loop=1&playlist=-6bsfeicV9E&modestbranding=1&rel=0&playsinline=1" title="Top Tier video" allow="autoplay; encrypted-media"/> : null;
}
