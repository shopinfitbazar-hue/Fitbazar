import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/api/client";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";

WebBrowser.maybeCompleteAuthSession();

function GoogleSignInButton() {
  const loginWithGoogleCode = useAuthStore((state) => state.loginWithGoogleCode);
  const isLoading = useAuthStore((state) => state.isLoading);

  async function signIn() {
    try {
      const callbackPath = "/api/mobile/v1/auth/google/bridge";
      const authUrl = `${API_BASE_URL}/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, "fitbazar://auth/google");
      if (result.type !== "success") return;

      const callback = new URL(result.url);
      const error = callback.searchParams.get("error");
      const code = callback.searchParams.get("code");
      if (error) throw new Error(error);
      if (!code) throw new Error("Google did not return an authorization code.");

      await loginWithGoogleCode(code);
      router.replace("/");
    } catch (error) {
      Alert.alert("Google sign-in failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading}
      onPress={() => void signIn()}
      style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
    >
      <Ionicons name="logo-google" color={colors.ink} size={20} />
      <Text style={styles.googleText}>Continue with Google</Text>
    </Pressable>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  async function submit() {
    await login(email, password);
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <Screen contentStyle={styles.screen}>
        <View style={styles.brand}>
          <Image source={require("../assets/icon.png")} style={styles.brandMark} />
          <Text style={styles.logo}>FIT BAZAR</Text>
          <Text style={styles.subtitle}>Premium Style. Trusted Quality. Delivered to Nepal.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.inkMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton loading={isLoading} onPress={submit}>
            Login
          </PrimaryButton>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
          <GoogleSignInButton />
          <Pressable accessibilityRole="button" onPress={() => router.push("/signup")} style={styles.signupLink}>
            <Text style={styles.signupText}>New to FitBazar? <Text style={styles.signupStrong}>Create account</Text></Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  screen: {
    flexGrow: 1,
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  brandMark: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  logo: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  label: {
    color: colors.ink,
    fontWeight: "900",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    color: colors.ink,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { color: colors.inkMuted, fontSize: 12 },
  googleButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  googleText: { color: colors.ink, fontWeight: "900" },
  pressed: { opacity: 0.78 },
  signupLink: { minHeight: 38, alignItems: "center", justifyContent: "center" },
  signupText: { color: colors.inkMuted, textAlign: "center" },
  signupStrong: { color: colors.goldDark, fontWeight: "900" },
});
