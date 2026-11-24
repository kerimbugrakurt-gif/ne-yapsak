import type { Budget, Category, Companion, EventRecord, FeedItem, FeedResponse, FeedSection, Profile } from "./types";

/**
 * Akış telefonda hesaplanır: events.json indirilir, kullanıcının profiline göre
 * puanlanır ve bölümlere ayrılır. Yapay zeka kullanılmaz, anında çalışır.
 */

const BUDGET_MAX: Record<Budget, number | undefined> = { ucretsiz: 0, dusuk: 500, orta: 1200, yuksek: undefined };

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

// Telefonların tarih/dil verisine güvenmemek için Türkçe adlar elle.
const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);
const shortDate = (iso: string) => `${d(iso).getUTCDate()} ${MONTHS[d(iso).getUTCMonth()]}`;
export const longDate = (iso: string) => `${d(iso).getUTCDate()} ${MONTHS_LONG[d(iso).getUTCMonth()]}`;

/** "31 Ocak'a", "26 Aralık'a", "1 Mayıs'a": Türkçe yönelme eki. */
function untilText(iso: string): string {
  const month = MONTHS_LONG[d(iso).getUTCMonth()];
  const last = [...month].reverse().find((ch) => "aeıioöuü".includes(ch)) ?? "a";
  const back = "aıou".includes(last);
  const endsWithVowel = "aeıioöuü".includes(month[month.length - 1]);
  return `${d(iso).getUTCDate()} ${month}'${endsWithVowel ? "y" : ""}${back ? "a" : "e"} kadar`;
}

function addDays(iso: string, n: number): string {
  const x = d(iso);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/** Türkiye 2016'dan beri sabit UTC+3. */
export function istanbulToday(now = new Date()): string {
  return new Date(now.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

/** Bu (ya da gelecek) hafta sonunun Cuma–Pazar aralığı. */
export function weekendRange(today: string): { from: string; to: string } {
  const dow = d(today).getUTCDay();
  if (dow === 0) return { from: today, to: today };
  if (dow === 6) return { from: today, to: addDays(today, 1) };
  if (dow === 5) return { from: today, to: addDays(today, 2) };
  const toFriday = 5 - dow;
  return { from: addDays(today, toFriday), to: addDays(today, toFriday + 2) };
}

function whenText(e: EventRecord, today: string): string {
  if (e.kind === "kalici") return "Her zaman açık";
  if (e.kind === "suren" && e.endDate) {
    return e.startDate && e.startDate > today ? `${shortDate(e.startDate)} – ${shortDate(e.endDate)}` : untilText(e.endDate);
  }
  if (!e.startDate) return "";
  const label =
    e.startDate === today
      ? "Bugün"
      : e.startDate === addDays(today, 1)
        ? "Yarın"
        : `${DAYS[d(e.startDate).getUTCDay()]} ${shortDate(e.startDate)}`;
  return e.time ? `${label} · ${e.time}` : label;
}

const isUpcoming = (e: EventRecord, today: string) => e.kind === "kalici" || (e.endDate ?? e.startDate ?? "") >= today;

function overlaps(e: EventRecord, from: string, to: string): boolean {
  if (e.kind === "kalici") return true;
  const start = e.startDate ?? from;
  const end = e.endDate ?? e.startDate ?? to;
  return start <= to && end >= from;
}

function fitsBudget(e: EventRecord, budget: Budget): boolean | null {
  const max = BUDGET_MAX[budget];
  if (e.isFree || max === undefined) return true;
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
  if (e.kind === "tek") s += 1;
  if (e.kind === "kalici") s -= 1;
  if (e.startDate === today) s += 1;
  if (p.companion === "ilk-date" && e.tags.some((t) => t === "sakin" || t === "romantik")) s += 1;
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

export function toItem(e: EventRecord, p: Profile, today: string): FeedItem {
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

export function buildFeed(events: EventRecord[], p: Profile, today: string, updatedAt: string | null): FeedResponse {
  const weekend = weekendRange(today);
  const all = events.filter((e) => e.city === p.city && isUpcoming(e, today));
  const ranked = all
    .map((e) => ({ e, s: score(e, p, today, weekend) }))
    .sort((a, b) => b.s - a.s || (a.e.startDate ?? "9").localeCompare(b.e.startDate ?? "9"))
    .map((x) => x.e);
  const item = (e: EventRecord) => toItem(e, p, today);
  const stage = ["konser", "stand-up", "tiyatro", "gece-hayati"];

  const sections: FeedSection[] = [
    {
      id: "senin-icin",
      title: "Bu hafta sonu senin için",
      style: "hero",
      items: ranked.filter((e) => overlaps(e, weekend.from, weekend.to) && fitsBudget(e, p.budget) !== false).slice(0, 8).map(item),
    },
    { id: "bugun", title: "Bugün", style: "row", items: ranked.filter((e) => e.kind === "tek" && e.startDate === today).map(item) },
    { id: "ilk-date", title: "İlk buluşmaya uygun", style: "grid", items: ranked.filter((e) => e.goodFor.includes("ilk-date")).slice(0, 6).map(item) },
    { id: "ucretsiz", title: "Ücretsiz", style: "grid", items: ranked.filter((e) => e.isFree).slice(0, 6).map(item) },
    { id: "sahne", title: "Konser ve sahne", style: "row", items: ranked.filter((e) => stage.includes(e.category)).slice(0, 10).map(item) },
    { id: "maclar", title: "Maçlar", style: "row", items: ranked.filter((e) => e.category === "mac" || e.category === "spor").slice(0, 10).map(item) },
    { id: "sergiler", title: "Sergiler ve müzeler", style: "row", items: ranked.filter((e) => e.category === "sergi").slice(0, 10).map(item) },
    {
      id: "yakinda",
      title: "Önümüzdeki günler",
      style: "row",
      items: ranked.filter((e) => e.kind === "tek" && (e.startDate ?? "") > weekend.to).slice(0, 10).map(item),
    },
  ];

  // Üstte gösterilenleri alt bölümlerde tekrar etme (bölüm çok boşalmıyorsa).
  const top = new Set(sections[0].items.slice(0, 5).map((i) => i.id));
  for (const s of sections.slice(1)) {
    const fresh = s.items.filter((i) => !top.has(i.id));
    if (fresh.length >= 2) s.items = fresh;
  }
  // İlk buluşmaya çıkanlar için o bölüm hemen ikinci sırada.
  if (p.companion === "ilk-date") {
    const i = sections.findIndex((s) => s.id === "ilk-date");
    sections.splice(1, 0, ...sections.splice(i, 1));
  }
  return { today, weekend, total: all.length, updatedAt, sections: sections.filter((s) => s.items.length > 0) };
}
