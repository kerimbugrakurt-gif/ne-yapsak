import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { BEATS, collect, collectAll, type Beat } from "./collector.js";
import { countByCity } from "./db.js";

// Kullanım: npm run collect               → tüm şehirler
//           npm run collect -- İstanbul    → tek şehir, tüm konular
//           npm run collect -- İstanbul kultur
const [city, beat] = process.argv.slice(2);
const client = new Anthropic();

if (city && beat) {
  if (!(beat in BEATS)) throw new Error(`Bilinmeyen konu: ${beat}. Seçenekler: ${Object.keys(BEATS).join(", ")}`);
  const r = await collect(client, city, beat as Beat);
  console.log(r);
} else {
  await collectAll(client, city ? [city] : undefined);
}
console.log(countByCity());
