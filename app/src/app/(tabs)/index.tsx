import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip } from "../../components/Chip";
import { HERO_WIDTH, HeroCard, SmallCard } from "../../components/EventCards";
import { Icon } from "../../components/Icon";
import { loadFeed } from "../../lib/api";
import { longDate } from "../../lib/feed";
import { useStore } from "../../lib/store";
import { colors, fonts, radius, space, TAB_BAR_SPACE } from "../../lib/theme";
import { COMPANIONS, type Companion, type FeedResponse, type FeedSection } from "../../lib/types";


export default function Discover() {
  const { profile, saveProfile } = useStore();
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  const load = useCallback(async (force = false) => {
    if (!profile) return;
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    try {
      const f = await loadFeed(profile, { signal: c.signal, force, onCached: (cf) => !c.signal.aborted && setFeed(cf) });
      if (!c.signal.aborted) {
        setFeed(f);
        setError(null);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    }
  }, [profile]);

  useEffect(() => {
    load();
    return () => ctl.current?.abort();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  if (!profile) return null;

  const setCompanion = (c: Companion) => saveProfile({ ...profile, companion: c });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push("/onboarding")} accessibilityRole="button" accessibilityLabel={`Şehir: ${profile.city}. Değiştir`} style={styles.city} hitSlop={8}>
              <Icon name="pin" size={14} color={colors.accent} strokeWidth={2.2} />
              <Text style={styles.cityText}>{profile.city}</Text>
            </Pressable>
            <Text style={styles.h1} accessibilityRole="header">
              Ne yapsak{profile.name ? `, ${profile.name}` : ""}?
            </Text>
          </View>
          <Pressable
            onPress={() => router.navigate("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel="Profil"
            style={styles.avatar}
          >
            {profile.name ? <Text style={styles.avatarText}>{profile.name[0].toLocaleUpperCase("tr-TR")}</Text> : <Icon name="user" color="#FFFFFF" size={22} />}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
          {COMPANIONS.map((c) => (
            <Chip key={c.value} label={c.label} selected={profile.companion === c.value} onPress={() => setCompanion(c.value)} />
          ))}
        </ScrollView>

        {!feed && !error && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.muted}>Şehrindeki etkinlikler hazırlanıyor…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load(true)} style={styles.retry} accessibilityRole="button">
              <Icon name="refresh" size={18} color={colors.accent} />
              <Text style={styles.retryText}>Tekrar dene</Text>
            </Pressable>
          </View>
        )}

        {feed && feed.sections.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{profile.city} için henüz etkinlik yok</Text>
            <Text style={styles.muted}>Etkinlik listesi haftada iki kez güncellenir. Biraz sonra tekrar bak ya da başka bir şehir seç.</Text>
          </View>
        )}

        {feed?.sections.map((s, i) => (
          <Section key={s.id} section={s} subtitle={i === 0 ? `${longDate(feed.weekend.from)} – ${longDate(feed.weekend.to)}` : undefined} />
        ))}

        {feed?.updatedAt && (
          <Text style={styles.updated}>
            Liste {longDate(feed.updatedAt.slice(0, 10))} tarihinde güncellendi. Gitmeden önce bilet sayfasından tarih ve saati kontrol et.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ section, subtitle }: { section: FeedSection; subtitle?: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.h2} accessibilityRole="header">
          {section.title}
        </Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      {section.style === "hero" && (
        <FlatList
          horizontal
          data={section.items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <HeroCard item={item} />}
          contentContainerStyle={styles.hRow}
          showsHorizontalScrollIndicator={false}
          snapToInterval={HERO_WIDTH + space(3)}
          decelerationRate="fast"
        />
      )}
      {section.style === "row" && (
        <FlatList
          horizontal
          data={section.items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <SmallCard item={item} width={200} />}
          contentContainerStyle={styles.hRow}
          showsHorizontalScrollIndicator={false}
        />
      )}
      {section.style === "grid" && (
        <View style={styles.grid}>
          {chunk(section.items, 2).map((pair, r) => (
            <View key={r} style={styles.gridRow}>
              {pair.map((it) => (
                <SmallCard key={it.id} item={it} />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: space(3), paddingHorizontal: space(5), paddingTop: space(4) },
  city: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", minHeight: 28 },
  cityText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink, marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 20, color: "#FFFFFF" },
  chips: { gap: space(2), paddingHorizontal: space(5), paddingVertical: space(4) },
  section: { marginTop: space(2), marginBottom: space(4) },
  sectionHead: { paddingHorizontal: space(5), marginBottom: space(3), gap: 2 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 19, color: colors.ink },
  sectionSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  hRow: { gap: space(3), paddingHorizontal: space(5) },
  grid: { paddingHorizontal: space(5), gap: space(3) },
  gridRow: { flexDirection: "row", gap: space(3) },
  center: { alignItems: "center", gap: space(3), paddingVertical: space(16) },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: "center" },
  errorBox: { marginHorizontal: space(5), marginTop: space(6), backgroundColor: colors.surface, borderRadius: radius.md, padding: space(5), gap: space(3), alignItems: "center" },
  errorText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink, textAlign: "center" },
  retry: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: space(4), borderRadius: radius.pill, backgroundColor: colors.accentSoft },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.accent },
  empty: { marginHorizontal: space(5), marginTop: space(6), gap: space(2), alignItems: "center" },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 19, color: colors.ink, textAlign: "center" },
  updated: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.muted, paddingHorizontal: space(5), marginTop: space(2) },
});
