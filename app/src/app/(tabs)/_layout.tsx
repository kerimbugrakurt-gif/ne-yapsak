import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components/Icon";
import { colors, fonts, radius } from "../../lib/theme";

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Keşfet", icon: "home" },
  saved: { label: "Kaydedilenler", icon: "heart" },
  profile: { label: "Profil", icon: "user" },
};

/** Tasarımdaki koyu, yüzen sekme çubuğu: seçili sekme beyaz hap içinde yazıyla görünür. */
function FloatingTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { bottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const onPress = () => {
          if (!focused) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={[styles.item, focused && styles.itemOn]}
          >
            <Icon name={tab.icon} color={focused ? colors.ink : colors.navMuted} size={20} />
            {focused && <Text style={styles.label}>{tab.label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }} tabBar={(p) => <FloatingTabBar {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.nav,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  item: { minWidth: 48, height: 48, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  itemOn: { backgroundColor: "#FFFFFF", paddingHorizontal: 16 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
});
