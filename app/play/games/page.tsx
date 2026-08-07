import Game from "@/components/Game";
import videoGames from "@/data/video-games.json";
import type { Entry } from "@/lib/types";

export default function PlayVideoGamesPage() {
  return <Game title="Name a Video Game" entries={videoGames as Entry[]} />;
}
