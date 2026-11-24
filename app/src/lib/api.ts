import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildFeed, istanbulToday } from "./feed";
import type { EventRecord, FeedItem, FeedResponse, Profile } from "./types";

/**
 * Etkinlik verisinin adresi (Cloudflare Pages). Sunucu yok: uygulama tek bir
 * JSON dosyası indirir ve akışı kendisi hesaplar.
 */
export const DATA_URL = (process.env.EXPO_PUBLIC_DATA_URL ?? "https://ne-yapsak.pages.dev").replace(/\/$/, "");

const CACHE_KEY = "neyapsak.events.v1";

interface EventsFile {
  version: 1;
  updatedAt: string | null;
  events: EventRecord[];
}

// Detay ekranı akıştan gelen kartı yeniden hesaplamadan gösterebilsin diye.
const itemCache = new Map<string, FeedItem>();
export const cachedItem = (id: string) => itemCache.get(id);

let memory: EventsFile | null = null;

async function readCache(): Promise<EventsFile | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as EventsFile) : null;
  } catch {
    return null;
  }
}

async function download(signal?: AbortSignal): Promise<EventsFile> {
  let res: Response;
  try {
    res = await fetch(`${DATA_URL}/events.json`, { signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new Error("İnternete ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
  }
  if (!res.ok) throw new Error(`Etkinlik listesi indirilemedi (${res.status}).`);
  const data = (await res.json()) as EventsFile;
  if (!Array.isArray(data?.events)) throw new Error("Etkinlik listesi okunamadı.");
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
  return data;
}

function toFeed(data: EventsFile, p: Profile): FeedResponse {
  const feed = buildFeed(data.events, p, istanbulToday(), data.updatedAt);
  for (const s of feed.sections) for (const i of s.items) itemCache.set(i.id, i);
  return feed;
}

/**
 * Önce eldeki (bellek ya da telefon önbelleği) veriyle hemen bir akış verir,
 * ardından güncel listeyi indirir. İnternet yoksa önbellekteki listeyle çalışır.
 */
export async function loadFeed(
  p: Profile,
  opts: { signal?: AbortSignal; onCached?: (f: FeedResponse) => void; force?: boolean } = {},
): Promise<FeedResponse> {
  const cached = memory ?? (await readCache());
  if (cached && opts.onCached) opts.onCached(toFeed(cached, p));
  if (memory && !opts.force) return toFeed(memory, p);
  try {
    memory = await download(opts.signal);
  } catch (e) {
    if (cached && (e as Error).name !== "AbortError") {
      memory = cached;
      return toFeed(cached, p);
    }
    throw e;
  }
  return toFeed(memory, p);
}

/** Profil değişince yeniden indirmeden akışı yeniden hesaplamak için. */
export function feedFromMemory(p: Profile): FeedResponse | null {
  return memory ? toFeed(memory, p) : null;
}
