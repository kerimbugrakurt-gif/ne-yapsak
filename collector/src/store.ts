import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EventRecord } from "./types.js";

/**
 * Etkinlikler tek bir JSON dosyasında durur: public/events.json.
 * GitHub Actions bu dosyayı günceller ve depoya işler; Cloudflare Pages yayınlar;
 * uygulama doğrudan bu dosyayı indirir.
 */
export interface EventsFile {
  version: 1;
  updatedAt: string | null;
  events: EventRecord[];
}

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_FILE = process.env.DATA_FILE ?? path.resolve(here, "../../public/events.json");

export class Store {
  private byId = new Map<string, EventRecord>();
  updatedAt: string | null = null;

  constructor(private readonly file = DATA_FILE) {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8")) as EventsFile;
      this.updatedAt = data.updatedAt;
      for (const e of data.events) this.byId.set(e.id, e);
    }
  }

  get size(): number {
    return this.byId.size;
  }

  upsert(events: EventRecord[]): number {
    for (const e of events) {
      const old = this.byId.get(e.id);
      // Yeni kayıtta boş kalan saat/fiyat bilgisini eskisinden koru.
      this.byId.set(
        e.id,
        old
          ? {
              ...e,
              time: e.time ?? old.time,
              priceText: e.priceText ?? old.priceText,
              priceMin: e.priceMin ?? old.priceMin,
            }
          : e,
      );
    }
    return events.length;
  }

  /** Bugün ve sonrasında gidilebilecek kayıtların başlıkları (tekrar aramamak için). */
  titlesFor(city: string, today: string): string[] {
    return [...this.byId.values()]
      .filter((e) => e.city === city && (e.kind === "kalici" || (e.endDate ?? e.startDate ?? "") >= today))
      .map((e) => e.title);
  }

  /** Bitişinden 2 gün geçmiş etkinlikleri siler. */
  prune(today: string): number {
    const cutoff = new Date(`${today}T12:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - 2);
    const c = cutoff.toISOString().slice(0, 10);
    let n = 0;
    for (const [id, e] of this.byId) {
      if (e.kind !== "kalici" && (e.endDate ?? e.startDate ?? "") < c) {
        this.byId.delete(id);
        n++;
      }
    }
    return n;
  }

  countByCity(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const e of this.byId.values()) out[e.city] = (out[e.city] ?? 0) + 1;
    return out;
  }

  /** Kararlı sırayla yazar: değişmeyen veri, git'te gereksiz fark üretmez. */
  save(markUpdated = true): void {
    if (markUpdated) this.updatedAt = new Date().toISOString();
    const events = [...this.byId.values()].sort((a, b) => a.id.localeCompare(b.id));
    const data: EventsFile = { version: 1, updatedAt: this.updatedAt, events };
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(data, null, 1) + "\n");
  }
}
