import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useStore } from "../lib/store";
import { colors } from "../lib/theme";

export default function Index() {
  const { ready, profile } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <Redirect href={profile ? "/(tabs)" : "/onboarding"} />;
}
