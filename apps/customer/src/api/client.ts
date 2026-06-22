import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { createFitBazarApiClient } from "@fitbazar/shared-api";

export const tokenKeys = {
  access: "fitbazar.customer.accessToken",
  refresh: "fitbazar.customer.refreshToken",
};

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

export const API_BASE_URL = (extra?.apiBaseUrl || "http://localhost:3000").replace(/\/$/, "");

export async function readAccessToken() {
  return SecureStore.getItemAsync(tokenKeys.access).catch(() => null);
}

export async function readRefreshToken() {
  return SecureStore.getItemAsync(tokenKeys.refresh).catch(() => null);
}

export async function writeTokens(input: { accessToken: string; refreshToken: string }) {
  await Promise.all([
    SecureStore.setItemAsync(tokenKeys.access, input.accessToken),
    SecureStore.setItemAsync(tokenKeys.refresh, input.refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(tokenKeys.access).catch(() => undefined),
    SecureStore.deleteItemAsync(tokenKeys.refresh).catch(() => undefined),
  ]);
}

export function getDeviceId() {
  const sessionId = (Constants as unknown as { sessionId?: string }).sessionId;
  return `customer:${sessionId || Constants.expoConfig?.slug || "fitbazar"}`;
}

export const api = createFitBazarApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: readAccessToken,
});
