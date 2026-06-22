import type { ComponentProps, PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initMonitoring } from "@/services/monitoring";
import { registerPushToken } from "@/services/push";
import { useAuthStore } from "@/state/auth";
import { useRecentlyViewed } from "@/state/recentlyViewed";
import { colors } from "@/styles/theme";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,
            gcTime: 30 * 60_000,
            retry: 1,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const hydrateRecentlyViewed = useRecentlyViewed((state) => state.hydrate);

  useEffect(() => {
    try {
      initMonitoring();
    } catch {
      undefined;
    }
    void hydrate();
    void hydrateRecentlyViewed();
  }, [hydrate, hydrateRecentlyViewed]);

  useEffect(() => {
    if (user) void registerPushToken().catch(() => undefined);
  }, [user]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const providerChildren = children as ComponentProps<typeof QueryClientProvider>["children"];

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>{providerChildren}</QueryClientProvider>
    </SafeAreaProvider>
  );
}
