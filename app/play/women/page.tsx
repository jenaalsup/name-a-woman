import Game from "@/components/Game";
import women from "@/data/women.json";
import type { Entry } from "@/lib/types";

export default function PlayWomenPage() {
  return <Game title="Name a Woman" entries={women as Entry[]} />;
}
