/**
 * Regenerate data/women.json from Wikidata.
 * Includes women with 25+ Wikimedia sitelinks (proxy for notability).
 *
 * Usage: node scripts/fetch-women.mjs
 */

import fs from "fs";

const USER_AGENT = "name-a-woman-game/0.1 (github.com/jenaalsup/name-a-woman)";

const SITELINK_BUCKETS = [
  [100, 9999],
  [60, 99],
  [40, 59],
  [30, 39],
  [25, 29],
];

async function fetchBucket(min, max) {
  const query = `
SELECT ?person ?personLabel WHERE {
  ?person wdt:P31 wd:Q5; wdt:P21 wd:Q6581072; wikibase:sitelinks ?linkcount .
  FILTER(?linkcount >= ${min} && ?linkcount <= ${max})
  OPTIONAL { ?person rdfs:label ?enLabel. FILTER(LANG(?enLabel) = "en") }
  OPTIONAL { ?person rdfs:label ?mulLabel. FILTER(LANG(?mulLabel) = "mul") }
  OPTIONAL {
    ?article schema:about ?person ;
             schema:isPartOf <https://en.wikipedia.org/> ;
             schema:name ?wikiTitle .
  }
  BIND(COALESCE(?enLabel, ?mulLabel, ?wikiTitle) AS ?personLabel)
  FILTER(BOUND(?personLabel))
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
    id: row.person.value.split("/").pop(),
    name: row.personLabel.value,
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
fs.writeFileSync("data/women.json", `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to data/women.json`);

for (const name of ["Taylor Swift", "Beyoncé", "Oprah Winfrey", "Jennifer Lawrence"]) {
  console.log(`${name}: ${entries.some((entry) => entry.name === name) ? "yes" : "MISSING"}`);
}
