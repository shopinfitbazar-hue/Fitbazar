import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "@/styles/theme";

type PrimaryButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "dark" | "gold" | "light";
}>;

export function PrimaryButton({ children, disabled, loading, onPress, tone = "dark" }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "gold" && styles.gold,
        tone === "light" && styles.light,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={tone === "light" ? colors.ink : colors.surface} /> : <Text style={[styles.text, tone === "light" && styles.lightText]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.55,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  light: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  lightText: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.86,
  },
  text: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});
