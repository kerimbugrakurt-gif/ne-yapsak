// Sunucudaki server/src/types.ts ve feed.ts ile aynı sözleşme.

export type Category =
  | "konser"
  | "mac"
  | "tiyatro"
  | "stand-up"
  | "sergi"
  | "festival"
  | "atolye"
  | "doga"
  | "spor"
  | "yemek"
  | "gece-hayati"
  | "aile";

export type Companion = "yalniz" | "arkadaslar" | "partner" | "ilk-date" | "aile";
export type Budget = "ucretsiz" | "dusuk" | "orta" | "yuksek";

export interface Profile {
  name: string;
  city: string;
  interests: Category[];
  companion: Companion;
  budget: Budget;
}

export interface FeedItem {
  id: string;
  kind: "tek" | "suren" | "kalici";
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

export interface FeedResponse {
  today: string;
  weekend: { from: string; to: string };
  total: number;
  updatedAt: string | null;
  sections: FeedSection[];
}

export const CITIES = ["İstanbul", "Ankara", "İzmir", "Antalya", "Bursa"];

export const INTERESTS: { value: Category; label: string }[] = [
  { value: "konser", label: "Konser" },
  { value: "mac", label: "Maç" },
  { value: "tiyatro", label: "Tiyatro" },
  { value: "stand-up", label: "Stand-up" },
  { value: "sergi", label: "Sergi & Müze" },
  { value: "festival", label: "Festival" },
  { value: "atolye", label: "Atölye" },
  { value: "doga", label: "Doğa" },
  { value: "spor", label: "Spor & Macera" },
  { value: "yemek", label: "Yeme-İçme" },
  { value: "gece-hayati", label: "Gece Hayatı" },
  { value: "aile", label: "Çocuklu Aile" },
];

export const COMPANIONS: { value: Companion; label: string }[] = [
  { value: "yalniz", label: "Tek başıma" },
  { value: "arkadaslar", label: "Arkadaşlarla" },
  { value: "partner", label: "Sevgilimle / Eşimle" },
  { value: "ilk-date", label: "İlk buluşma" },
  { value: "aile", label: "Ailecek" },
];

export const BUDGETS: { value: Budget; label: string }[] = [
  { value: "ucretsiz", label: "Ücretsiz" },
  { value: "dusuk", label: "500 ₺'ye kadar" },
  { value: "orta", label: "1.200 ₺'ye kadar" },
  { value: "yuksek", label: "Fark etmez" },
];
