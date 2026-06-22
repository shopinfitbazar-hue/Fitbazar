import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

let initialized = false;

export function initMonitoring() {
  if (initialized) return;

  const extra = Constants.expoConfig?.extra as { sentryDsn?: string } | undefined;
  if (!extra?.sentryDsn) return;

  Sentry.init({
    dsn: extra.sentryDsn,
    tracesSampleRate: 0.1,
    enableNativeCrashHandling: true,
  });
  initialized = true;
}
