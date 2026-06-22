import { create } from "zustand";
import type { MobileAuthResponse, MobileSessionUser } from "@fitbazar/shared-types";
import { api, clearTokens, getDeviceId, readAccessToken, readRefreshToken, writeTokens } from "@/api/client";

type AuthState = {
  user: MobileSessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; phone?: string; password: string; confirmPassword: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithGoogleCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function storeSession(response: MobileAuthResponse) {
  await writeTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  async hydrate() {
    if (get().isHydrated) return;

    set({ isLoading: true, error: null });
    const accessToken = await readAccessToken();
    const refreshToken = await readRefreshToken();

    try {
      if (accessToken) {
        const response = await api.get<{ user: MobileSessionUser }>("/api/mobile/v1/auth/me", { accessToken });
        set({ user: response.user, accessToken, refreshToken, isHydrated: true, isLoading: false });
        return;
      }

      if (refreshToken) {
        const refreshed = await api.mobileRefresh({ refreshToken, deviceId: getDeviceId() });
        await storeSession(refreshed);
        set({
          user: refreshed.user,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          isHydrated: true,
          isLoading: false,
        });
        return;
      }
    } catch {
      await clearTokens();
    }

    set({ user: null, accessToken: null, refreshToken: null, isHydrated: true, isLoading: false });
  },

  async login(email, password) {
    set({ isLoading: true, error: null });

    try {
      const response = await api.mobileLogin({
        email,
        password,
        app: "CUSTOMER_APP",
        deviceId: getDeviceId(),
      });
      await storeSession(response);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isHydrated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
      throw error;
    }
  },

  async register(input) {
    set({ isLoading: true, error: null });
    try {
      const response = await api.mobileRegister({ ...input, deviceId: getDeviceId() });
      await storeSession(response);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isHydrated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
      throw error;
    }
  },

  async loginWithGoogle(idToken) {
    set({ isLoading: true, error: null });
    try {
      const response = await api.mobileGoogleSignIn({ idToken, deviceId: getDeviceId() });
      await storeSession(response);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isHydrated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
      throw error;
    }
  },

  async loginWithGoogleCode(code) {
    set({ isLoading: true, error: null });
    try {
      const response = await api.mobileGoogleExchange({ code, deviceId: getDeviceId() });
      await storeSession(response);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isHydrated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
      throw error;
    }
  },

  async logout() {
    const { accessToken, refreshToken } = get();
    set({ isLoading: true });

    try {
      await api.post("/api/mobile/v1/auth/logout", { refreshToken }, { accessToken });
    } catch {
      undefined;
    }

    await clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isHydrated: true, isLoading: false, error: null });
  },
}));
