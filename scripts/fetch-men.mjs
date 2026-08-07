/**
 * Regenerate data/men.json from Wikidata.
 * Up to 10,000 men with 35+ Wikimedia sitelinks.
 *
 * Usage: node scripts/fetch-men.mjs
 */

import fs from "fs";

const USER_AGENT = "name-a-woman-game/0.1 (github.com/jenaalsup/name-a-woman)";
const LIMIT = 10000;
const MIN_SITELINKS = 35;

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMen() {
  const query = `
SELECT ?person ?personLabel WHERE {
  ?person wdt:P31 wd:Q5; wdt:P21 wd:Q6581097; wikibase:sitelinks ?linkcount .
  FILTER(?linkcount >= ${MIN_SITELINKS})
  OPTIONAL { ?person rdfs:label ?enLabel. FILTER(LANG(?enLabel) = "en") }
  OPTIONAL { ?person rdfs:label ?mulLabel. FILTER(LANG(?mulLabel) = "mul") }
  BIND(COALESCE(?enLabel, ?mulLabel) AS ?personLabel)
  FILTER(BOUND(?personLabel))
}
LIMIT ${LIMIT}
`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(
      `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": USER_AGENT } },
    );

    if (response.ok) {
      const data = await response.json();
      return data.results.bindings.map((row) => ({
        id: row.person.value.split("/").pop(),
        name: row.personLabel.value,
      }));
    }

    if (attempt < 3) {
      console.log(`retry ${attempt} (${response.status})`);
      await sleep(5000 * attempt);
    } else {
      throw new Error(`Wikidata query failed: HTTP ${response.status}`);
    }
  }

  return [];
}

console.log(`Fetching up to ${LIMIT} men with ${MIN_SITELINKS}+ sitelinks...`);
const rows = await fetchMen();

const entries = rows
  .filter((row) => row.name && !/^Q\d+$/.test(row.name))
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync("data/men.json", `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to data/men.json`);

for (const name of ["Barack Obama", "LeBron James", "Elon Musk", "Tom Hanks"]) {
  console.log(`${name}: ${entries.some((entry) => entry.name === name) ? "yes" : "MISSING"}`);
}
