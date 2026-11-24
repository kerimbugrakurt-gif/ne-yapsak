import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { useStore } from "../../lib/store";
import { colors, fonts, radius, space, TAB_BAR_SPACE } from "../../lib/theme";
import { BUDGETS, COMPANIONS, INTERESTS } from "../../lib/types";

export default function ProfileScreen() {
  const { profile } = useStore();
  if (!profile) return null;
  const rows = [
    { label: "Şehir", value: profile.city },
    { label: "İlgi alanları", value: profile.interests.map((i) => INTERESTS.find((x) => x.value === i)?.label).join(", ") || "Seçilmedi" },
    { label: "Genelde kiminle", value: COMPANIONS.find((c) => c.value === profile.companion)?.label ?? "" },
    { label: "Bütçe", value: BUDGETS.find((b) => b.value === profile.budget)?.label ?? "" },
  ];
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1} accessibilityRole="header">
          {profile.name ? `Merhaba ${profile.name}` : "Profilin"}
        </Text>

        <View style={styles.card}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.row, i > 0 && styles.rowLine]}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.value}>{r.value}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.push("/onboarding")} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>Tercihlerimi düzenle</Text>
        </Pressable>

        <View style={styles.about}>
          <Icon name="info" size={20} color={colors.accent} />
          <Text style={styles.aboutText}>
            Etkinlikler bilet sitelerinden, belediye takvimlerinden, fikstürlerden ve müze programlarından yapay zekayla haftada iki kez toplanır. Her kartta kaynağı ve bilet linki vardır. Tercihlerin ve kaydettiklerin yalnızca bu telefonda saklanır.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space(5), gap: space(4), paddingBottom: TAB_BAR_SPACE },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space(4) },
  row: { paddingVertical: space(3.5), gap: 2 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.line },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  value: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  cta: { minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: fonts.displaySemi, fontSize: 17, color: "#FFFFFF" },
  about: { flexDirection: "row", gap: space(3), backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space(4) },
  aboutText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.ink },
});
