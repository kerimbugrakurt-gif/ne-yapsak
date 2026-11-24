import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Store } from "./store.js";
import { CATEGORIES, CITIES, COMPANIONS, type EventRecord } from "./types.js";

const MODEL = process.env.COLLECTOR_MODEL ?? "claude-opus-5-5";
const MAX_TURNS = 10;
const SEARCHES_PER_RUN = Number(process.env.SEARCHES_PER_RUN ?? 6);
const WINDOW_DAYS = 14;

/** Her şehir için ayrı ayrı taranan konu grupları. */
export const BEATS = {
  "muzik-sahne": "konserler, stand-up gösterileri, tiyatro oyunları, festivaller ve canlı müzikli gece mekanları",
  spor: "futbol (Süper Lig, 1. Lig), basketbol ve voleybol maçları; ayrıca koşu, bisiklet gibi katılımlı spor etkinlikleri",
  kultur:
    "müze ve galeri sergileri (şu an açık olanlar dahil), kalıcı müzeler, atölyeler (seramik, yemek, sanat), çocuklu aileler için etkinlikler, rehberli doğa yürüyüşleri ve yeme-içme rotaları",
} as const;
export type Beat = keyof typeof BEATS;

// Sabit sistem istemi (önbelleğe alınabilir): tarih ve şehir bilgisi kullanıcı mesajında.
const SYSTEM = `Sen "Ne Yapsak?" uygulamasının etkinlik editörüsün. Görevin, verilen Türk şehrinde verilen tarih aralığında gidilebilecek GERÇEK etkinlikleri web'de bulup save_events aracıyla kaydetmek.

Kaynaklar: Biletix, Passo, Bubilet, Biletinial, Mobilet, Songkick, mekanların kendi siteleri (Zorlu PSM, CSO Ada, IF Performance, Jolly Joker, Babylon vb.), belediyelerin kültür-sanat takvimleri, müze siteleri (İstanbul Modern, Pera, Sakıp Sabancı, Arter, Arkas vb.), TFF ve kulüp fikstürleri, gazetelerin hafta sonu rehberleri. Türkçe ara; aramaya tarihi ve yılı yaz.

Kurallar:
- YALNIZCA tarihi VE yılı kaynakta açıkça görünen etkinlikleri kaydet. Geçmiş yıllara ait listeleri kullanma (ör. 28 Kasım'ın hangi güne denk geldiğini kontrol et).
- Hiçbir bilgiyi uydurma. Saat, fiyat ya da semt kaynakta yoksa null bırak.
- Kaynaklar çelişiyorsa "note" alanına kısaca yaz.
- kind: "tek" tek günlük (konser, maç) → startDate dolu, endDate null. "suren" belli tarihler arasında her gün (sergi, festival) → ikisi de dolu. "kalici" her zaman açık (müze, kalıcı koleksiyon) → ikisi de null.
- url: etkinliği gördüğün sayfanın tam adresi.
- summary: kullanıcıya 1-2 cümlelik, samimi Türkçe tanıtım (ne olduğu, neden gidilir).
- goodFor: kimlere uygun (yalniz, arkadaslar, partner, ilk-date, aile). ilk-date: konuşmaya imkân veren, baskısız, kısa, halka açık yerler (sergi, stand-up, atölye, küçük konser).
- tags: kısa etiketler (romantik, sakin, enerjik, kapali-mekan, acik-hava, cocuk-dostu, canli-muzik, kalabalik, gece, gunduz).
- Daha önce kaydedilmiş başlıklar sana verilir; onları tekrar arama, yenilerini bul (yeni bilgi bulduysan aynı başlıkla tekrar kaydedebilirsin).
- Aramaları bitirince bulduğun her şeyi TEK bir save_events çağrısıyla kaydet, sonra kısa bir özetle bitir. Hiç sağlam etkinlik bulamazsan boş liste kaydet.`;

const EventInput = z.object({
  kind: z.enum(["tek", "suren", "kalici"]),
  title: z.string().min(2).max(140),
  category: z.enum(CATEGORIES),
  venue: z.string().min(1).max(120),
  district: z.string().max(80).nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  time: z.string().max(20).nullable(),
  priceText: z.string().max(80).nullable(),
  priceMin: z.number().int().min(0).max(100000).nullable(),
  isFree: z.boolean(),
  url: z.string().url().max(500),
  source: z.string().min(2).max(80),
  summary: z.string().min(10).max(400),
  note: z.string().max(300).nullable(),
  goodFor: z.array(z.enum(COMPANIONS)).max(5),
  tags: z.array(z.string().max(30)).max(8),
});

const nullable = (t: string) => ({ type: [t, "null"] });

const SAVE_TOOL: Anthropic.Beta.BetaTool = {
  name: "save_events",
  description: "Bulunan gerçek etkinlikleri veritabanına kaydeder. Döndürdüğü metin kaç kaydın kabul ya da reddedildiğini söyler.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["events"],
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "kind", "title", "category", "venue", "district", "startDate", "endDate", "time", "priceText",
            "priceMin", "isFree", "url", "source", "summary", "note", "goodFor", "tags",
          ],
          properties: {
            kind: { type: "string", enum: ["tek", "suren", "kalici"] },
            title: { type: "string" },
            category: { type: "string", enum: [...CATEGORIES] },
            venue: { type: "string" },
            district: nullable("string"),
            startDate: { ...nullable("string"), description: "YYYY-MM-DD" },
            endDate: { ...nullable("string"), description: "YYYY-MM-DD" },
            time: { ...nullable("string"), description: "ör. 21:00 ya da 10:00-18:00" },
            priceText: nullable("string"),
            priceMin: { ...nullable("integer"), description: "TL, en düşük bilet" },
            isFree: { type: "boolean" },
            url: { type: "string" },
            source: { type: "string", description: "ör. Biletix, Passo, İstanbul Modern" },
            summary: { type: "string" },
            note: nullable("string"),
            goodFor: { type: "array", items: { type: "string", enum: [...COMPANIONS] } },
            tags: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
};

/** Türkiye 2016'dan beri sabit UTC+3. */
export function istanbulToday(now = new Date()): string {
  return new Date(now.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function slug(s: string): string {
  return s
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Model girdisini doğrular ve kayda çevirir; geçersizse nedenini döndürür. */
export function normalize(
  raw: unknown,
  city: string,
  today: string,
): { ok: true; event: EventRecord } | { ok: false; reason: string } {
  const p = EventInput.safeParse(raw);
  if (!p.success) return { ok: false, reason: `şema: ${p.error.issues[0]?.path.join(".")}` };
  const e = p.data;
  if (!/^https?:\/\//.test(e.url)) return { ok: false, reason: `${e.title}: url http(s) değil` };
  const limit = addDays(today, 60);
  if (e.kind === "tek") {
    if (!e.startDate) return { ok: false, reason: `${e.title}: tarih yok` };
    if (e.startDate < today || e.startDate > limit) return { ok: false, reason: `${e.title}: tarih aralık dışında` };
  } else if (e.kind === "suren") {
    if (!e.startDate || !e.endDate) return { ok: false, reason: `${e.title}: başlangıç/bitiş eksik` };
    if (e.endDate < today || e.endDate < e.startDate) return { ok: false, reason: `${e.title}: bitmiş ya da hatalı aralık` };
  }
  const startDate = e.kind === "kalici" ? null : e.startDate;
  return {
    ok: true,
    event: {
      ...e,
      id: `${slug(city)}-${slug(e.title)}-${startDate ?? "kalici"}`,
      city,
      startDate,
      endDate: e.kind === "suren" ? e.endDate : null,
      priceMin: e.isFree ? 0 : e.priceMin,
      updatedAt: new Date().toISOString(),
    },
  };
}

export interface CollectResult {
  city: string;
  beat: Beat;
  saved: number;
  rejected: string[];
}

export async function collect(client: Anthropic, store: Store, city: string, beat: Beat): Promise<CollectResult> {
  const today = istanbulToday();
  const until = addDays(today, WINDOW_DAYS);
  const known = store.titlesFor(city, today);
  const result: CollectResult = { city, beat, saved: 0, rejected: [] };

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: [
        `Şehir: ${city}`,
        `Bugün: ${today}. Aralık: ${today} – ${until}.`,
        `Konu: ${BEATS[beat]}.`,
        `Şu an açık olan uzun süreli sergi/festivaller ve kalıcı müzeler de bu aralığa dahildir.`,
        known.length ? `Zaten kayıtlı başlıklar: ${known.slice(0, 80).join(" | ")}` : "Bu şehir için henüz kayıt yok.",
      ].join("\n"),
    },
  ];

  const tools: Anthropic.Beta.BetaToolUnion[] = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: SEARCHES_PER_RUN,
      user_location: { type: "approximate", city, country: "TR", timezone: "Europe/Istanbul" },
    },
    SAVE_TOOL,
  ];

  let savedOnce = false;
  let nudged = false;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      cache_control: { type: "ephemeral" },
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      tools,
      messages,
    });
    if (res.stop_reason === "refusal") throw new Error("model isteği reddetti");
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason === "pause_turn") continue;

    const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (uses.length === 0) {
      if (savedOnce || nudged) break;
      nudged = true;
      messages.push({ role: "user", content: "Bulduklarını şimdi save_events ile kaydet." });
      continue;
    }
    if (res.stop_reason === "max_tokens") throw new Error("araç girdisi kesildi (max_tokens)");

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const u of uses) {
      if (u.name !== "save_events") {
        results.push({ type: "tool_result", tool_use_id: u.id, is_error: true, content: `Bilinmeyen araç: ${u.name}` });
        continue;
      }
      const list = Array.isArray((u.input as { events?: unknown }).events) ? (u.input as { events: unknown[] }).events : [];
      const good: EventRecord[] = [];
      for (const raw of list) {
        const n = normalize(raw, city, today);
        if (n.ok) good.push(n.event);
        else result.rejected.push(n.reason);
      }
      result.saved += store.upsert(good);
      savedOnce = true;
      results.push({
        type: "tool_result",
        tool_use_id: u.id,
        content: `${good.length} kayıt kaydedildi.${result.rejected.length ? ` Reddedilenler: ${result.rejected.slice(-10).join("; ")}` : ""}`,
      });
    }
    messages.push({ role: "user", content: results });
  }
  return result;
}

/** Tüm şehir ve konuları sırayla tarar; biri hata verirse diğerleriyle devam eder. */
export async function collectAll(
  client: Anthropic,
  store: Store,
  cities: readonly string[] = CITIES,
  log: (msg: string) => void = console.log,
): Promise<CollectResult[]> {
  const removed = store.prune(istanbulToday());
  if (removed) log(`[collector] ${removed} eski etkinlik silindi`);
  const out: CollectResult[] = [];
  for (const city of cities) {
    for (const beat of Object.keys(BEATS) as Beat[]) {
      try {
        const r = await collect(client, store, city, beat);
        store.save(false); // her adımdan sonra yaz: iş yarıda kesilse de bulunanlar kaybolmasın
        log(`[collector] ${city}/${beat}: ${r.saved} kaydedildi, ${r.rejected.length} reddedildi`);
        out.push(r);
      } catch (err) {
        log(`[collector] ${city}/${beat} HATA: ${(err as Error).message}`);
      }
    }
  }
  return out;
}
