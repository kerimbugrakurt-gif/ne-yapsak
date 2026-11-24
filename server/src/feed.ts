import { upcomingEvents } from "./db.js";
import { BUDGET_MAX, type Budget, type Category, type Companion, type EventRecord } from "./types.js";

export interface Profile {
  city: string;
  interests: Category[];
  companion: Companion;
  budget: Budget;
}

export interface FeedItem {
  id: string;
  kind: EventRecord["kind"];
  title: string;
  category: Category;
  venue: string;
  district: string | null;
  whenText: string;
  priceText: string | null;
  isFree: boolean;
  summary: string;
  reason: string;
  url: string;
  source: string;
  note: string | null;
}

export interface FeedSection {
  id: string;
  title: string;
  style: "hero" | "grid" | "row";
  items: FeedItem[];
}

const CATEGORY_LOVE: Record<Category, string> = {
  konser: "Konser seviyorsun",
  mac: "Maç seviyorsun",
  tiyatro: "Tiyatro seviyorsun",
  "stand-up": "Stand-up seviyorsun",
  sergi: "Sergileri seviyorsun",
  festival: "Festivalleri seviyorsun",
  atolye: "Atölyeleri seviyorsun",
  doga: "Doğayı seviyorsun",
  spor: "Sporu seviyorsun",
  yemek: "Yeme-içmeyi seviyorsun",
  "gece-hayati": "Gece hayatını seviyorsun",
  aile: "Çocuklu aile etkinliği",
};

const COMPANION_FIT: Record<Companion, string> = {
  yalniz: "Tek başına keyifli",
  arkadaslar: "Arkadaşlarla gidilir",
  partner: "Sevgilinle güzel olur",
  "ilk-date": "İlk buluşmaya uygun",
  aile: "Ailecek gidilir",
};

const DAY = new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

function addDays(iso: string, n: number): string {
  const x = d(iso);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/** Bu (ya da gelecek) hafta sonunun Cuma–Pazar aralığı. */
export function weekendRange(today: string): { from: string; to: string } {
  const dow = d(today).getUTCDay(); // 0 Pazar … 6 Cumartesi
  if (dow === 0) return { from: today, to: today };
  if (dow === 6) return { from: today, to: addDays(today, 1) };
  if (dow === 5) return { from: today, to: addDays(today, 2) };
  const toFriday = 5 - dow;
  return { from: addDays(today, toFriday), to: addDays(today, toFriday + 2) };
}

function whenText(e: EventRecord, today: string): string {
  if (e.kind === "kalici") return "Her zaman açık";
  if (e.kind === "suren" && e.endDate) {
    return e.startDate && e.startDate > today
      ? `${DATE.format(d(e.startDate))} – ${DATE.format(d(e.endDate))}`
      : `${LONG.format(d(e.endDate))}'a kadar`;
  }
  if (!e.startDate) return "";
  const label = e.startDate === today ? "Bugün" : e.startDate === addDays(today, 1) ? "Yarın" : `${DAY.format(d(e.startDate))} ${DATE.format(d(e.startDate))}`;
  return e.time ? `${label} · ${e.time}` : label;
}

function overlaps(e: EventRecord, from: string, to: string): boolean {
  if (e.kind === "kalici") return true;
  const start = e.startDate ?? from;
  const end = e.endDate ?? e.startDate ?? to;
  return start <= to && end >= from;
}

function fitsBudget(e: EventRecord, budget: Budget): boolean | null {
  const max = BUDGET_MAX[budget];
  if (e.isFree) return true;
  if (max === undefined) return true;
  if (e.priceMin === null) return null;
  return e.priceMin <= max;
}

function score(e: EventRecord, p: Profile, today: string, weekend: { from: string; to: string }): number {
  let s = 0;
  if (p.interests.includes(e.category)) s += 4;
  if (e.goodFor.includes(p.companion)) s += 3;
  const fit = fitsBudget(e, p.budget);
  if (fit === true) s += 2;
  if (fit === false) s -= 4;
  if (p.budget === "ucretsiz" && e.isFree) s += 3;
  if (overlaps(e, weekend.from, weekend.to)) s += 2;
  if (e.kind === "tek") s += 1; // tarihli etkinlikler önce gelsin
  if (e.kind === "kalici") s -= 1;
  if (e.startDate === today) s += 1;
  if (p.companion === "ilk-date" && e.tags.some((t) => ["sakin", "romantik"].includes(t))) s += 1;
  if (p.companion === "aile" && e.tags.includes("cocuk-dostu")) s += 2;
  return s;
}

function reasonFor(e: EventRecord, p: Profile, today: string): string {
  const parts: string[] = [];
  if (p.interests.includes(e.category)) parts.push(CATEGORY_LOVE[e.category]);
  if (e.goodFor.includes(p.companion)) parts.push(COMPANION_FIT[p.companion]);
  if (e.isFree) parts.push("Ücretsiz");
  else if (fitsBudget(e, p.budget) === true && p.budget !== "yuksek") parts.push("Bütçene uygun");
  if (e.kind === "suren" && e.startDate && e.startDate <= today) parts.push("Şu an açık");
  return parts.slice(0, 2).join(" · ") || "Şehrinde bu hafta";
}

function toItem(e: EventRecord, p: Profile, today: string): FeedItem {
  return {
    id: e.id,
    kind: e.kind,
    title: e.title,
    category: e.category,
    venue: e.venue,
    district: e.district,
    whenText: whenText(e, today),
    priceText: e.isFree ? "Ücretsiz" : e.priceText,
    isFree: e.isFree,
    summary: e.summary,
    reason: reasonFor(e, p, today),
    url: e.url,
    source: e.source,
    note: e.note,
  };
}

export function buildFeed(p: Profile, today: string): { sections: FeedSection[]; total: number; weekend: { from: string; to: string } } {
  const weekend = weekendRange(today);
  const all = upcomingEvents(p.city, today);
  const ranked = all
    .map((e) => ({ e, s: score(e, p, today, weekend) }))
    .sort((a, b) => b.s - a.s || (a.e.startDate ?? "9").localeCompare(b.e.startDate ?? "9"))
    .map((x) => x.e);
  const item = (e: EventRecord) => toItem(e, p, today);

  const weekendItems = ranked.filter((e) => overlaps(e, weekend.from, weekend.to) && fitsBudget(e, p.budget) !== false);
  const sections: FeedSection[] = [
    { id: "senin-icin", title: "Bu hafta sonu senin için", style: "hero", items: weekendItems.slice(0, 8).map(item) },
    {
      id: "bu-aksam",
      title: "Bugün",
      style: "row",
      items: ranked.filter((e) => e.kind === "tek" && e.startDate === today).map(item),
    },
    {
      id: "ilk-date",
      title: "İlk buluşmaya uygun",
      style: "grid",
      items: ranked.filter((e) => e.goodFor.includes("ilk-date")).slice(0, 6).map(item),
    },
    { id: "ucretsiz", title: "Ücretsiz", style: "grid", items: ranked.filter((e) => e.isFree).slice(0, 6).map(item) },
    {
      id: "sahne",
      title: "Konser ve sahne",
      style: "row",
      items: ranked.filter((e) => ["konser", "stand-up", "tiyatro", "gece-hayati"].includes(e.category)).slice(0, 10).map(item),
    },
    { id: "maclar", title: "Maçlar", style: "row", items: ranked.filter((e) => e.category === "mac" || e.category === "spor").slice(0, 10).map(item) },
    { id: "sergiler", title: "Sergiler ve müzeler", style: "row", items: ranked.filter((e) => e.category === "sergi").slice(0, 10).map(item) },
    {
      id: "yakinda",
      title: "Önümüzdeki günler",
      style: "row",
      items: ranked.filter((e) => e.kind === "tek" && (e.startDate ?? "") > weekend.to).slice(0, 10).map(item),
    },
  ];

  // Üstte zaten gösterilenleri alt bölümlerde tekrar etme (bölüm çok boşalmıyorsa).
  const heroIds = new Set(sections[0].items.slice(0, 5).map((i) => i.id));
  for (const s of sections.slice(1)) {
    const fresh = s.items.filter((i) => !heroIds.has(i.id));
    if (fresh.length >= 2) s.items = fresh;
  }

  // İlk buluşmaya çıkanlar için o bölüm hemen ikinci sırada.
  if (p.companion === "ilk-date") {
    const i = sections.findIndex((s) => s.id === "ilk-date");
    sections.splice(1, 0, ...sections.splice(i, 1));
  }
  return { sections: sections.filter((s) => s.items.length > 0), total: all.length, weekend };
}
