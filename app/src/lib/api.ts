import { Platform } from "react-native";
import type { FeedItem, FeedResponse, Profile } from "./types";

/**
 * Sunucu adresi. Yayındaki uygulamada EXPO_PUBLIC_API_URL ile verilir
 * (ör. https://ne-yapsak.onrender.com). Web sürümü sunucuyla aynı adresten
 * yayınlandığında boş bırakılabilir.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === "web" ? "" : "http://localhost:8787")
).replace(/\/$/, "");

// Detay ekranı akıştan gelen kartı yeniden indirmeden gösterebilsin diye.
const itemCache = new Map<string, FeedItem>();
export const cachedItem = (id: string) => itemCache.get(id);

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new Error("İnternete ya da sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Sunucu hatası (${res.status})`);
  return body as T;
}

export async function fetchFeed(p: Profile, signal?: AbortSignal): Promise<FeedResponse> {
  const q = new URLSearchParams({
    city: p.city,
    interests: p.interests.join(","),
    companion: p.companion,
    budget: p.budget,
  });
  const feed = await getJson<FeedResponse>(`/api/feed?${q}`, signal);
  for (const s of feed.sections) for (const i of s.items) itemCache.set(i.id, i);
  return feed;
}
