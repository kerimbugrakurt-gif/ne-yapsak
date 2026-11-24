import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { BEATS, collect, collectAll, istanbulToday, type Beat } from "./collector.js";
import { seedIfEmpty } from "./seed.js";
import { DATA_FILE, Store } from "./store.js";
import { CITIES } from "./types.js";

// Kullanım: npm run collect                       → COLLECT_CITIES (yoksa 5 şehir), tüm konular
//           npm run collect -- İstanbul            → tek şehir
//           npm run collect -- İstanbul kultur     → tek şehir, tek konu
//           npm run collect -- --seed-only         → yalnızca başlangıç verisini yaz
const args = process.argv.slice(2);
const store = new Store();
const seeded = seedIfEmpty(store, istanbulToday());
if (seeded) console.log(`[seed] ${seeded} başlangıç etkinliği eklendi`);

if (args[0] === "--seed-only") {
  store.save(true);
} else {
  const client = new Anthropic();
  const [city, beat] = args;
  if (city && beat) {
    if (!(beat in BEATS)) throw new Error(`Bilinmeyen konu: ${beat}. Seçenekler: ${Object.keys(BEATS).join(", ")}`);
    console.log(await collect(client, store, city, beat as Beat));
  } else {
    const cities = city
      ? [city]
      : (process.env.COLLECT_CITIES ?? CITIES.join(","))
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
    await collectAll(client, store, cities);
  }
  store.save(true);
}
console.log(`[collector] ${DATA_FILE}:`, store.countByCity());
