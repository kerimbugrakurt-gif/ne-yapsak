import { router, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components/Icon";
import { cachedItem } from "../../lib/api";
import { useStore } from "../../lib/store";
import { categoryColors, colors, fonts, radius, space } from "../../lib/theme";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saved, isSaved, toggleSaved } = useStore();
  const item = cachedItem(String(id)) ?? saved.find((s) => s.id === id);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missing}>
          <Text style={styles.h1}>Etkinlik bulunamadı</Text>
          <Text style={styles.body}>Liste güncellenmiş olabilir.</Text>
          <Pressable onPress={close} style={styles.secondary} accessibilityRole="button">
            <Text style={styles.secondaryText}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const c = categoryColors[item.category];
  const on = isSaved(item.id);
  const isHttp = /^https?:\/\//.test(item.url);

  const share = () =>
    Share.share({ message: `${item.title} · ${item.whenText} · ${item.venue}\n${item.url}\n\nNe Yapsak? uygulamasında buldum.` }).catch(() => {});

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.round}>
          <Icon name="back" size={22} />
        </Pressable>
        <View style={{ flexDirection: "row", gap: space(2) }}>
          <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Paylaş" style={styles.round}>
            <Icon name="share" size={20} />
          </Pressable>
          <Pressable
            onPress={() => toggleSaved(item)}
            accessibilityRole="button"
            accessibilityLabel={on ? "Kaydedilenlerden çıkar" : "Kaydet"}
            style={styles.round}
          >
            <Icon name={on ? "heart-filled" : "heart"} color={on ? "#D93A6A" : colors.ink} size={20} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.hero}>
          <View style={styles.art}>
            <Icon name={item.category} size={44} strokeWidth={1.6} />
          </View>
          <Text style={[styles.meta, { color: c.ink }]}>{c.label}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {item.title}
          </Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.facts}>
            <Fact icon="info" label="Ne zaman" value={item.whenText} />
            <Fact icon="pin" label="Nerede" value={`${item.venue}${item.district ? `, ${item.district}` : ""}`} />
            {item.priceText && <Fact icon="tiyatro" label="Fiyat" value={item.priceText} />}
          </View>

          <View style={styles.reason}>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>

          <Text style={styles.body}>{item.summary}</Text>

          {item.note && (
            <View style={styles.note} accessibilityRole="alert">
              <Text style={styles.noteText}>{item.note}</Text>
            </View>
          )}

          <Text style={styles.source}>Kaynak: {item.source}</Text>

          {isHttp && (
            <Pressable onPress={() => Linking.openURL(item.url).catch(() => {})} style={styles.primary} accessibilityRole="link">
              <Text style={styles.primaryText}>Bilete / detaya git</Text>
              <Icon name="external" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <Icon name={icon} size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: space(4), paddingTop: space(2) },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  hero: { paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: space(6), gap: space(2) },
  art: { width: 80, height: 80, borderRadius: 26, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginBottom: space(2) },
  meta: { fontFamily: fonts.bodySemi, fontSize: 14 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink },
  sheet: { flexGrow: 1, backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: space(5), gap: space(4), paddingBottom: space(10) },
  facts: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space(4), gap: space(3.5) },
  fact: { flexDirection: "row", gap: space(3), alignItems: "center" },
  factIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  factLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  factValue: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  reason: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  reasonText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.accent },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.ink },
  note: { backgroundColor: colors.warnBg, borderRadius: radius.sm, padding: space(3.5) },
  noteText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.warnInk },
  source: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  primary: { flexDirection: "row", gap: space(2), minHeight: 56, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: fonts.displaySemi, fontSize: 18, color: "#FFFFFF" },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: space(3), padding: space(6) },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  secondary: { minHeight: 48, paddingHorizontal: space(6), borderRadius: radius.pill, backgroundColor: colors.surface, justifyContent: "center" },
  secondaryText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
});
