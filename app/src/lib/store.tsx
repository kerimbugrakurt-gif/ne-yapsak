import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FeedItem, Profile } from "./types";

const PROFILE_KEY = "neyapsak.profile.v2";
const SAVED_KEY = "neyapsak.saved.v1";

interface StoreValue {
  ready: boolean;
  profile: Profile | null;
  saveProfile: (p: Profile) => Promise<void>;
  saved: FeedItem[];
  isSaved: (id: string) => boolean;
  toggleSaved: (item: FeedItem) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Profil ve kaydedilen etkinlikler: yalnızca telefonda saklanır, hesap gerekmez. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<FeedItem[]>([]);

  useEffect(() => {
    AsyncStorage.multiGet([PROFILE_KEY, SAVED_KEY])
      .then(([[, p], [, s]]) => {
        if (p) setProfile(JSON.parse(p));
        if (s) setSaved(JSON.parse(s));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const saveProfile = useCallback(async (p: Profile) => {
    setProfile(p);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }, []);

  const toggleSaved = useCallback((item: FeedItem) => {
    setSaved((prev) => {
      const next = prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [item, ...prev];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      profile,
      saveProfile,
      saved,
      isSaved: (id) => saved.some((i) => i.id === id),
      toggleSaved,
    }),
    [ready, profile, saveProfile, saved, toggleSaved],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore, StoreProvider içinde kullanılmalı");
  return ctx;
}
