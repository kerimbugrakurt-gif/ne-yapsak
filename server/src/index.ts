import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";
import { z } from "zod";
import { collectAll, istanbulToday } from "./collector.js";
import { countByCity, getEvent, lastRun } from "./db.js";
import { buildFeed } from "./feed.js";
import { seedIfEmpty } from "./seed.js";
import { BUDGETS, CATEGORIES, CITIES, COMPANIONS } from "./types.js";

const PORT = Number(process.env.PORT ?? 8787);
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = hasKey ? new Anthropic() : null;

const seeded = seedIfEmpty(istanbulToday());
if (seeded) console.log(`[seed] ${seeded} başlangıç etkinliği yüklendi`);

// Etkinlik taraması: varsayılan Pazartesi ve Perşembe 05:20 (İstanbul). Maliyet için seyrek tutulur.
const COLLECT_CRON = process.env.COLLECT_CRON ?? "20 5 * * 1,4";
// Taranacak şehirler (virgülle). Maliyeti düşürmek için önce tek şehirle başlanabilir.
const COLLECT_CITIES = (process.env.COLLECT_CITIES ?? CITIES.join(","))
  .split(",")
  .map((c) => c.trim())
  .filter((c): c is (typeof CITIES)[number] => (CITIES as readonly string[]).includes(c));
let collecting = false;
async function runCollector(reason: string) {
  if (!client || collecting) return;
  collecting = true;
  console.log(`[collector] başladı (${reason})`);
  try {
    await collectAll(client, COLLECT_CITIES);
  } finally {
    collecting = false;
    console.log("[collector] bitti", countByCity());
  }
}
if (client) {
  cron.schedule(COLLECT_CRON, () => void runCollector("zamanlanmış"), { timezone: "Europe/Istanbul" });
} else {
  console.log("[collector] ANTHROPIC_API_KEY yok: tarama kapalı, yalnızca mevcut veri sunuluyor");
}

const FeedQuery = z.object({
  city: z.enum(CITIES),
  interests: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",") : []))
    .pipe(z.array(z.enum(CATEGORIES))),
  companion: z.enum(COMPANIONS).default("arkadaslar"),
  budget: z.enum(BUDGETS).default("orta"),
});

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, collector: client ? "açık" : "kapalı", events: countByCity(), lastCollect: lastRun().finishedAt });
});

app.get("/api/cities", (_req, res) => {
  res.json({ cities: CITIES });
});

app.get("/api/feed", (req, res) => {
  const q = FeedQuery.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: "Geçersiz istek", details: q.error.issues });
    return;
  }
  const today = istanbulToday();
  res.set("Cache-Control", "public, max-age=300");
  res.json({ today, ...buildFeed(q.data, today), updatedAt: lastRun().finishedAt });
});

app.get("/api/events/:id", (req, res) => {
  const e = getEvent(req.params.id);
  if (!e) {
    res.status(404).json({ error: "Etkinlik bulunamadı" });
    return;
  }
  res.json(e);
});

// Elle tarama başlatma (yalnızca ADMIN_TOKEN ile).
app.post("/admin/collect", (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (!token || req.get("authorization") !== `Bearer ${token}`) {
    res.status(401).json({ error: "Yetkisiz" });
    return;
  }
  if (!client) {
    res.status(400).json({ error: "ANTHROPIC_API_KEY tanımlı değil" });
    return;
  }
  const alreadyRunning = collecting;
  void runCollector("elle");
  res.status(202).json({ started: !alreadyRunning, message: alreadyRunning ? "Tarama zaten sürüyor" : "Tarama başladı" });
});

// Uygulamanın web sürümü (app/dist) varsa aynı adresten sunulur: telefonda linkle denemek için.
const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app/dist");
if (fs.existsSync(path.join(webDir, "index.html"))) {
  app.use(express.static(webDir, { maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/admin/")) return next();
    res.sendFile(path.join(webDir, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Ne Yapsak? sunucusu http://localhost:${PORT}`);
});
