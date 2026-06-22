import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/styles/theme";

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  message: {
    color: colors.inkMuted,
    lineHeight: 20,
  },
});
