export type Entry = {
  id: string;
  name: string;
  aliases?: string[];
};

export type MatchResult =
  | { status: "found"; entry: Entry }
  | { status: "duplicate"; entry: Entry }
  | { status: "not_found" };
