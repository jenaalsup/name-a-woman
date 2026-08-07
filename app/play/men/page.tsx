import Game from "@/components/Game";
import men from "@/data/men.json";
import type { Entry } from "@/lib/types";

export default function PlayMenPage() {
  return <Game title="Name a Man" entries={men as Entry[]} />;
}
