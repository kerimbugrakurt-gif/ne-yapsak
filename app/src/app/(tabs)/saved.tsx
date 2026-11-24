import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RowCard } from "../../components/EventCards";
import { Icon } from "../../components/Icon";
import { useStore } from "../../lib/store";
import { colors, fonts, radius, space, TAB_BAR_SPACE } from "../../lib/theme";

export default function Saved() {
  const { saved } = useStore();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={saved}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <RowCard item={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 4, marginBottom: space(2) }}>
            <Text style={styles.h1} accessibilityRole="header">
              Kaydedilenler
            </Text>
            {saved.length > 0 && <Text style={styles.muted}>{saved.length} etkinlik</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyArt}>
              <Icon name="heart" size={32} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Henüz bir şey kaydetmedin</Text>
            <Text style={[styles.muted, { textAlign: "center" }]}>Beğendiğin etkinliklerdeki kalbe dokun, burada toplansın.</Text>
            <Pressable onPress={() => router.navigate("/(tabs)")} style={styles.cta} accessibilityRole="button">
              <Text style={styles.ctaText}>Keşfete dön</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space(5), gap: space(3), paddingBottom: TAB_BAR_SPACE, flexGrow: 1 },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: space(3), paddingHorizontal: space(6) },
  emptyArt: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.ink },
  cta: { minHeight: 48, paddingHorizontal: space(6), borderRadius: radius.pill, backgroundColor: colors.accent, justifyContent: "center", marginTop: space(2) },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: "#FFFFFF" },
});
