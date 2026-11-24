import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radius, space } from "../lib/theme";

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { opacity: 0.75 }]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space(4),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  selectedLabel: { color: "#FFFFFF" },
});
