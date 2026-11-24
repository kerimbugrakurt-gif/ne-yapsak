import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStore } from "../lib/store";
import { categoryColors, colors, fonts, radius, space } from "../lib/theme";
import type { FeedItem } from "../lib/types";
import { Icon } from "./Icon";

const open = (item: FeedItem) => router.push({ pathname: "/event/[id]", params: { id: item.id } });

function SaveButton({ item, size = 44 }: { item: FeedItem; size?: number }) {
  const { isSaved, toggleSaved } = useStore();
  const on = isSaved(item.id);
  return (
    <Pressable
      onPress={() => toggleSaved(item)}
      accessibilityRole="button"
      accessibilityLabel={on ? "Kaydedilenlerden çıkar" : "Kaydet"}
      hitSlop={6}
      style={[styles.save, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Icon name={on ? "heart-filled" : "heart"} color={on ? "#D93A6A" : colors.ink} size={20} />
    </Pressable>
  );
}

/** Büyük, renkli "senin için" kartı (yatay kaydırılır). */
export function HeroCard({ item }: { item: FeedItem }) {
  const c = categoryColors[item.category];
  return (
    <Pressable
      onPress={() => open(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${c.label}, ${item.whenText}`}
      style={({ pressed }) => [styles.hero, { backgroundColor: c.bg }, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.heroTop}>
        <View style={styles.art}>
          <Icon name={item.category} size={34} strokeWidth={1.8} />
        </View>
        <SaveButton item={item} />
      </View>
      <View style={{ gap: space(1.5) }}>
        <Text style={[styles.heroMeta, { color: c.ink }]} numberOfLines={1}>
          {c.label} · {item.whenText}
        </Text>
        <Text style={styles.heroTitle} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={[styles.heroVenue, { color: c.ink }]} numberOfLines={1}>
          {item.venue}
          {item.district ? `, ${item.district}` : ""}
        </Text>
        <View style={styles.reason}>
          <Text style={styles.reasonText} numberOfLines={1}>
            {item.reason}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Beyaz küçük kart (ızgara ve yatay satırlar için). */
export function SmallCard({ item, width }: { item: FeedItem; width?: number }) {
  const c = categoryColors[item.category];
  return (
    <Pressable
      onPress={() => open(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${c.label}, ${item.whenText}`}
      style={({ pressed }) => [styles.small, width ? { width } : { flex: 1 }, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.smallTop}>
        <View style={[styles.pill, { backgroundColor: item.isFree ? "#D9E4FF" : c.bg }]}>
          <Text style={[styles.pillText, { color: item.isFree ? "#26398C" : c.ink }]}>{item.isFree ? "Ücretsiz" : c.label}</Text>
        </View>
        <View style={[styles.miniArt, { backgroundColor: c.bg }]}>
          <Icon name={item.category} size={18} strokeWidth={1.8} />
        </View>
      </View>
      <Text style={styles.smallTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.smallMeta} numberOfLines={1}>
        {item.whenText}
      </Text>
      <Text style={styles.smallMeta} numberOfLines={1}>
        {item.venue}
      </Text>
    </Pressable>
  );
}

/** Liste satırı (Kaydedilenler). */
export function RowCard({ item }: { item: FeedItem }) {
  const c = categoryColors[item.category];
  return (
    <Pressable
      onPress={() => open(item)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.rowArt, { backgroundColor: c.bg }]}>
        <Icon name={item.category} size={24} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={styles.smallTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.smallMeta} numberOfLines={1}>
          {item.whenText} · {item.venue}
        </Text>
      </View>
      <SaveButton item={item} size={40} />
    </Pressable>
  );
}

export const HERO_WIDTH = 264;

const styles = StyleSheet.create({
  hero: {
    width: HERO_WIDTH,
    height: 300,
    borderRadius: radius.card,
    padding: space(4.5),
    justifyContent: "space-between",
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  art: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  save: { backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  heroMeta: { fontFamily: fonts.bodySemi, fontSize: 12.5 },
  heroTitle: { fontFamily: fonts.display, fontSize: 23, lineHeight: 26, color: colors.ink },
  heroVenue: { fontFamily: fonts.body, fontSize: 13 },
  reason: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, marginTop: 2, maxWidth: "100%" },
  reasonText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  small: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space(3.5), gap: space(1.5) },
  smallTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  miniArt: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  smallTitle: { fontFamily: fonts.display, fontSize: 16, lineHeight: 19, color: colors.ink },
  smallMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: space(3), backgroundColor: colors.surface, borderRadius: radius.md, padding: space(3) },
  rowArt: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
