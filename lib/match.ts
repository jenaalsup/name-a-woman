import { normalize } from "./normalize";
import type { Entry, MatchResult } from "./types";

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 +
            Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }

  return matrix[b.length][a.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export function createMatcher(entries: Entry[]) {
  const exact = new Map<string, Entry>();
  const searchable: { normalized: string; entry: Entry }[] = [];

  for (const entry of entries) {
    for (const label of [entry.name, ...(entry.aliases ?? [])]) {
      const normalized = normalize(label);
      exact.set(normalized, entry);
      searchable.push({ normalized, entry });
    }
  }

  return function matchInput(
    input: string,
    foundIds: Set<string>,
  ): MatchResult {
    const normalizedInput = normalize(input);
    if (!normalizedInput) return { status: "not_found" };

    let entry = exact.get(normalizedInput) ?? null;

    if (!entry) {
      let bestScore = 0;
      for (const { normalized, entry: candidate } of searchable) {
        const score = similarity(normalizedInput, normalized);
        if (score >= 0.85 && score > bestScore) {
          bestScore = score;
          entry = candidate;
        }
      }
    }

    if (!entry) return { status: "not_found" };
    if (foundIds.has(entry.id)) return { status: "duplicate", entry };
    return { status: "found", entry };
  };
}
