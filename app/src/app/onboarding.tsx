import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip } from "../components/Chip";
import { useStore } from "../lib/store";
import { colors, fonts, radius, space } from "../lib/theme";
import { BUDGETS, CITIES, COMPANIONS, INTERESTS, type Budget, type Category, type Companion } from "../lib/types";

const STEPS = [
  { key: "city", title: "Hangi şehirdesin?", sub: "Şimdilik bu beş şehirde etkinlik topluyoruz." },
  { key: "interests", title: "Neleri seversin?", sub: "Ne kadar çok seçersen akışın o kadar sana göre olur." },
  { key: "companion", title: "Genelde kiminle çıkarsın?", sub: "Ana ekrandan istediğin zaman değiştirebilirsin." },
  { key: "budget", title: "Kişi başı bütçen?", sub: "Bütçeni aşan etkinlikleri geriye atarız." },
] as const;

export default function Onboarding() {
  const { profile, saveProfile } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [interests, setInterests] = useState<Category[]>(profile?.interests ?? []);
  const [companion, setCompanion] = useState<Companion>(profile?.companion ?? "arkadaslar");
  const [budget, setBudget] = useState<Budget>(profile?.budget ?? "orta");

  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const canNext = s.key !== "city" || city !== "";

  const next = async () => {
    if (!canNext) return;
    if (!last) return setStep(step + 1);
    await saveProfile({ name: name.trim(), city, interests, companion, budget });
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.progress} accessibilityLabel={`Adım ${step + 1} / ${STEPS.length}`}>
          {STEPS.map((x, i) => (
            <View key={x.key} style={[styles.bar, i <= step && styles.barOn]} />
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 && <Text style={styles.brand}>Ne Yapsak?</Text>}
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.sub}>{s.sub}</Text>

          {s.key === "city" && (
            <View style={{ gap: space(5) }}>
              <View style={{ gap: space(2) }}>
                <Text style={styles.label} nativeID="nameLabel">
                  Adın (isteğe bağlı)
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ör. Kerim"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  maxLength={30}
                  accessibilityLabelledBy="nameLabel"
                  autoComplete="given-name"
                />
              </View>
              <View style={styles.wrap}>
                {CITIES.map((c) => (
                  <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
                ))}
              </View>
            </View>
          )}
          {s.key === "interests" && (
            <View style={styles.wrap}>
              {INTERESTS.map((c) => (
                <Chip
                  key={c.value}
                  label={c.label}
                  selected={interests.includes(c.value)}
                  onPress={() =>
                    setInterests((p) => (p.includes(c.value) ? p.filter((x) => x !== c.value) : [...p, c.value]))
                  }
                />
              ))}
            </View>
          )}
          {s.key === "companion" && (
            <View style={styles.wrap}>
              {COMPANIONS.map((c) => (
                <Chip key={c.value} label={c.label} selected={companion === c.value} onPress={() => setCompanion(c.value)} />
              ))}
            </View>
          )}
          {s.key === "budget" && (
            <View style={styles.wrap}>
              {BUDGETS.map((b) => (
                <Chip key={b.value} label={b.label} selected={budget === b.value} onPress={() => setBudget(b.value)} />
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <Pressable onPress={() => setStep(step - 1)} style={styles.back} accessibilityRole="button">
              <Text style={styles.backText}>Geri</Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={!canNext}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canNext }}
            style={({ pressed }) => [styles.cta, !canNext && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaText}>{last ? "Akışımı göster" : "Devam"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  progress: { flexDirection: "row", gap: space(2), paddingHorizontal: space(5), paddingTop: space(3) },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  barOn: { backgroundColor: colors.accent },
  body: { padding: space(5), paddingTop: space(8), gap: space(2) },
  brand: { fontFamily: fonts.display, fontSize: 18, color: colors.accent, marginBottom: space(3) },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted, marginBottom: space(5) },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: space(4),
    minHeight: 52,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space(2.5) },
  footer: { flexDirection: "row", gap: space(3), padding: space(5) },
  back: { minHeight: 56, paddingHorizontal: space(5), justifyContent: "center" },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.muted },
  cta: { flex: 1, minHeight: 56, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: fonts.displaySemi, fontSize: 18, color: "#FFFFFF" },
});
