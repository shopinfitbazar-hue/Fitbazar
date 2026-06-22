import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  async function submit() {
    await register({ name, email, phone, password, confirmPassword });
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <Screen contentStyle={styles.screen}>
        <View style={styles.brand}>
          <Image source={require("../assets/icon.png")} style={styles.brandMark} />
          <Text style={styles.title}>Create your FitBazar account</Text>
          <Text style={styles.subtitle}>Save favourites, check out faster, and track every order.</Text>
        </View>
        <View style={styles.form}>
          <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
          <Field label="Phone" value={phone} onChangeText={setPhone} autoComplete="tel" keyboardType="phone-pad" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton loading={isLoading} onPress={submit}>Create Account</PrimaryButton>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/login")} style={styles.loginLink}>
            <Text style={styles.loginText}>Already registered? <Text style={styles.loginStrong}>Login</Text></Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...inputProps} placeholderTextColor={colors.inkMuted} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  screen: { flexGrow: 1, justifyContent: "center" },
  brand: { alignItems: "center", gap: spacing.sm },
  brandMark: { width: 68, height: 68, borderRadius: radius.md },
  title: { color: colors.ink, fontSize: 28, fontWeight: "900", lineHeight: 34, textAlign: "center" },
  subtitle: { color: colors.inkMuted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  form: { gap: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.lg },
  field: { gap: spacing.xs },
  label: { color: colors.ink, fontWeight: "900" },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.ink, paddingHorizontal: spacing.md },
  error: { color: colors.danger, fontWeight: "700" },
  loginLink: { minHeight: 38, alignItems: "center", justifyContent: "center" },
  loginText: { color: colors.inkMuted },
  loginStrong: { color: colors.goldDark, fontWeight: "900" },
});
