/**
 * Regenerate data/video-games.json from Wikidata.
 * Includes video games with 5+ Wikimedia sitelinks.
 *
 * Usage: node scripts/fetch-video-games.mjs
 */

import fs from "fs";

const USER_AGENT = "name-a-woman-game/0.1 (github.com/jenaalsup/name-a-woman)";

const SITELINK_BUCKETS = [
  [20, 9999],
  [15, 19],
  [10, 14],
  [5, 9],
];

async function fetchBucket(min, max) {
  const query = `
SELECT ?game ?gameLabel WHERE {
  ?game wdt:P31 wd:Q7889; wikibase:sitelinks ?linkcount .
  FILTER(?linkcount >= ${min} && ?linkcount <= ${max})
  OPTIONAL { ?game rdfs:label ?enLabel. FILTER(LANG(?enLabel) = "en") }
  OPTIONAL { ?game rdfs:label ?mulLabel. FILTER(LANG(?mulLabel) = "mul") }
  OPTIONAL {
    ?article schema:about ?game ;
             schema:isPartOf <https://en.wikipedia.org/> ;
             schema:name ?wikiTitle .
  }
  BIND(COALESCE(?enLabel, ?mulLabel, ?wikiTitle) AS ?gameLabel)
  FILTER(BOUND(?gameLabel))
}
LIMIT 20000
`;

  const response = await fetch(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": USER_AGENT } },
  );

  if (!response.ok) {
    throw new Error(`Wikidata query failed (${min}-${max}): HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.results.bindings.map((row) => ({
    id: row.game.value.split("/").pop(),
    name: row.gameLabel.value,
  }));
}

const byId = new Map();

for (const [min, max] of SITELINK_BUCKETS) {
  console.log(`Fetching sitelinks ${min}-${max}...`);
  const rows = await fetchBucket(min, max);
  for (const row of rows) {
    if (!row.name || /^Q\d+$/.test(row.name)) continue;
    byId.set(row.id, row);
  }
  console.log(`  ${rows.length} rows, ${byId.size} unique total`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

const entries = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync("data/video-games.json", `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to data/video-games.json`);

for (const name of [
  "Minecraft",
  "The Legend of Zelda: Breath of the Wild",
  "Super Mario Bros.",
  "Fortnite",
  "Tetris",
]) {
  console.log(`${name}: ${entries.some((entry) => entry.name === name) ? "yes" : "MISSING"}`);
}
