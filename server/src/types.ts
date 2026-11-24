export const CATEGORIES = [
  "konser",
  "mac",
  "tiyatro",
  "stand-up",
  "sergi",
  "festival",
  "atolye",
  "doga",
  "spor",
  "yemek",
  "gece-hayati",
  "aile",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const COMPANIONS = ["yalniz", "arkadaslar", "partner", "ilk-date", "aile"] as const;
export type Companion = (typeof COMPANIONS)[number];

export const BUDGETS = ["ucretsiz", "dusuk", "orta", "yuksek"] as const;
export type Budget = (typeof BUDGETS)[number];

/** Kişi başı en yüksek fiyat (TL); undefined = sınır yok. */
export const BUDGET_MAX: Record<Budget, number | undefined> = {
  ucretsiz: 0,
  dusuk: 500,
  orta: 1200,
  yuksek: undefined,
};

export const CITIES = ["İstanbul", "Ankara", "İzmir", "Antalya", "Bursa"] as const;

/**
 * tek    = tek günlük (konser, maç)
 * suren  = başlangıç-bitiş aralığında her gün (sergi, festival)
 * kalici = tarihsiz, her zaman açık (müze, park, rota)
 */
export type EventKind = "tek" | "suren" | "kalici";

export interface EventRecord {
  id: string;
  kind: EventKind;
  title: string;
  category: Category;
  city: string;
  venue: string;
  district: string | null;
  /** YYYY-MM-DD; kalici için null */
  startDate: string | null;
  /** YYYY-MM-DD; yalnızca suren için */
  endDate: string | null;
  /** "21:00" ya da "10:00-18:00"; bilinmiyorsa null */
  time: string | null;
  /** Kaynaktaki fiyat metni, ör. "650 TL'den başlayan" */
  priceText: string | null;
  /** TL cinsinden en düşük fiyat; bilinmiyorsa null */
  priceMin: number | null;
  isFree: boolean;
  url: string;
  source: string;
  /** 1-2 cümle Türkçe tanıtım */
  summary: string;
  /** Kaynaklar çelişiyorsa ya da doğrulanması gerekiyorsa uyarı */
  note: string | null;
  goodFor: Companion[];
  /** ör. romantik, sakin, enerjik, kapali-mekan, acik-hava, cocuk-dostu */
  tags: string[];
  updatedAt: string;
}
