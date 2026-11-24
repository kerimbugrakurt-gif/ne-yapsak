import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { EventRecord } from "./types.js";

const DB_PATH = process.env.DB_PATH ?? path.resolve("data/events.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  city        TEXT NOT NULL,
  venue       TEXT NOT NULL,
  district    TEXT,
  start_date  TEXT,
  end_date    TEXT,
  time        TEXT,
  price_text  TEXT,
  price_min   INTEGER,
  is_free     INTEGER NOT NULL DEFAULT 0,
  url         TEXT NOT NULL,
  source      TEXT NOT NULL,
  summary     TEXT NOT NULL,
  note        TEXT,
  good_for    TEXT NOT NULL DEFAULT '[]',
  tags        TEXT NOT NULL DEFAULT '[]',
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_city ON events(city);

CREATE TABLE IF NOT EXISTS collect_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at  TEXT NOT NULL,
  finished_at TEXT,
  city        TEXT NOT NULL,
  beat        TEXT NOT NULL,
  saved       INTEGER NOT NULL DEFAULT 0,
  error       TEXT
);
`);

type Row = {
  id: string; kind: string; title: string; category: string; city: string; venue: string;
  district: string | null; start_date: string | null; end_date: string | null; time: string | null;
  price_text: string | null; price_min: number | null; is_free: number; url: string; source: string;
  summary: string; note: string | null; good_for: string; tags: string; updated_at: string;
};

function fromRow(r: Row): EventRecord {
  return {
    id: r.id,
    kind: r.kind as EventRecord["kind"],
    title: r.title,
    category: r.category as EventRecord["category"],
    city: r.city,
    venue: r.venue,
    district: r.district,
    startDate: r.start_date,
    endDate: r.end_date,
    time: r.time,
    priceText: r.price_text,
    priceMin: r.price_min,
    isFree: r.is_free === 1,
    url: r.url,
    source: r.source,
    summary: r.summary,
    note: r.note,
    goodFor: JSON.parse(r.good_for),
    tags: JSON.parse(r.tags),
    updatedAt: r.updated_at,
  };
}

const upsertStmt = db.prepare(`
INSERT INTO events (id, kind, title, category, city, venue, district, start_date, end_date, time,
  price_text, price_min, is_free, url, source, summary, note, good_for, tags, updated_at)
VALUES (@id, @kind, @title, @category, @city, @venue, @district, @startDate, @endDate, @time,
  @priceText, @priceMin, @isFree, @url, @source, @summary, @note, @goodFor, @tags, @updatedAt)
ON CONFLICT(id) DO UPDATE SET
  kind=excluded.kind, title=excluded.title, category=excluded.category, venue=excluded.venue,
  district=excluded.district, start_date=excluded.start_date, end_date=excluded.end_date,
  time=COALESCE(excluded.time, events.time), price_text=COALESCE(excluded.price_text, events.price_text),
  price_min=COALESCE(excluded.price_min, events.price_min), is_free=excluded.is_free, url=excluded.url,
  source=excluded.source, summary=excluded.summary, note=excluded.note, good_for=excluded.good_for,
  tags=excluded.tags, updated_at=excluded.updated_at
`);

export const upsertEvents = db.transaction((events: EventRecord[]) => {
  for (const e of events) {
    upsertStmt.run({
      ...e,
      isFree: e.isFree ? 1 : 0,
      goodFor: JSON.stringify(e.goodFor),
      tags: JSON.stringify(e.tags),
    });
  }
  return events.length;
});

/** Bugün ve sonrasında gidilebilecek etkinlikler (kalıcı mekanlar dahil). */
export function upcomingEvents(city: string, today: string): EventRecord[] {
  const rows = db
    .prepare(
      `SELECT * FROM events WHERE city = ? AND (
         kind = 'kalici' OR COALESCE(end_date, start_date) >= ?
       )`,
    )
    .all(city, today) as Row[];
  return rows.map(fromRow);
}

export function getEvent(id: string): EventRecord | null {
  const r = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as Row | undefined;
  return r ? fromRow(r) : null;
}

export function titlesFor(city: string, today: string): string[] {
  return (
    db
      .prepare(
        `SELECT title FROM events WHERE city = ? AND (kind = 'kalici' OR COALESCE(end_date, start_date) >= ?)`,
      )
      .all(city, today) as { title: string }[]
  ).map((r) => r.title);
}

/** Bitişinden 2 gün geçmiş etkinlikleri siler. */
export function pruneOld(today: string): number {
  const cutoff = new Date(`${today}T12:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 2);
  const c = cutoff.toISOString().slice(0, 10);
  return db.prepare(`DELETE FROM events WHERE kind != 'kalici' AND COALESCE(end_date, start_date) < ?`).run(c).changes;
}

export function countByCity(): Record<string, number> {
  const rows = db.prepare("SELECT city, COUNT(*) AS n FROM events GROUP BY city").all() as { city: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.city, r.n]));
}

export function logRunStart(city: string, beat: string): number {
  return Number(
    db.prepare("INSERT INTO collect_runs (started_at, city, beat) VALUES (?, ?, ?)").run(new Date().toISOString(), city, beat)
      .lastInsertRowid,
  );
}

export function logRunEnd(id: number, saved: number, error: string | null) {
  db.prepare("UPDATE collect_runs SET finished_at = ?, saved = ?, error = ? WHERE id = ?").run(
    new Date().toISOString(),
    saved,
    error,
    id,
  );
}

export function lastRun(): { finishedAt: string | null } {
  const r = db.prepare("SELECT MAX(finished_at) AS f FROM collect_runs WHERE error IS NULL").get() as { f: string | null };
  return { finishedAt: r.f };
}
