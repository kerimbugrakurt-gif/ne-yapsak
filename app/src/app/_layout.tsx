import { Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from "@expo-google-fonts/fredoka";
import { Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold } from "@expo-google-fonts/rubik";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { StoreProvider } from "../lib/store";
import { colors } from "../lib/theme";

export default function RootLayout() {
  const [loaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold });
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="event/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </StoreProvider>
  );
}
