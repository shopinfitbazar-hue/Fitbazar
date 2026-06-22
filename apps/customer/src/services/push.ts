import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { api, getDeviceId } from "@/api/client";

function platform() {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

export async function registerPushToken() {
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  const token = await Notifications.getExpoPushTokenAsync();
  if (!token.data) return;

  await api.registerDevice({
    app: "CUSTOMER_APP",
    platform: platform(),
    deviceId: getDeviceId(),
    pushToken: token.data,
    provider: "EXPO",
  }).catch(() => undefined);
}
