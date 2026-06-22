import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/styles/theme";
import { shortDate } from "@/utils/format";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ["mobile-notifications"], queryFn: () => api.mobileNotifications() });

  useEffect(() => {
    if (!notifications.data?.notifications.some((item) => !item.isRead)) return;
    void api.markMobileNotificationsRead().then(() => queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] }));
  }, [notifications.data, queryClient]);

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Notifications</Text>
      {notifications.isLoading ? <ActivityIndicator color={colors.gold} /> : null}
      {notifications.data?.notifications.length ? notifications.data.notifications.map((item) => (
        <View key={item.id} style={[styles.card, !item.isRead && styles.unread]}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>{shortDate(item.createdAt)}</Text>
        </View>
      )) : !notifications.isLoading ? <EmptyState title="No notifications" message="Order and offer updates will appear here." /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 26, fontWeight: "900" },
  card: { gap: spacing.xs, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.lg },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.gold },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  message: { color: colors.inkMuted, lineHeight: 20 },
  date: { color: colors.inkMuted, fontSize: 11 },
});
