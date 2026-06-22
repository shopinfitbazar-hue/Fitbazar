import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/styles/theme";

export default function AccountScreen() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["mobile-profile"], queryFn: () => api.mobileProfile() });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => { if (profile.data?.user) { setName(profile.data.user.name || ""); setPhone(profile.data.user.phone || ""); } }, [profile.data]);
  const save = useMutation({
    mutationFn: () => api.updateMobileProfile({ name, phone }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["mobile-profile"] }); Alert.alert("Saved", "Your profile was updated."); },
    onError: (error) => Alert.alert("Could not save", error instanceof Error ? error.message : "Please try again."),
  });
  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Personal Details</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Full name</Text><TextInput value={name} onChangeText={setName} style={styles.input} />
        <Text style={styles.label}>Phone</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
        <Text style={styles.label}>Email</Text><View style={styles.readonly}><Text style={styles.readonlyText}>{profile.data?.user.email || ""}</Text></View>
        <PrimaryButton loading={save.isPending} onPress={() => save.mutate()}>Save Changes</PrimaryButton>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { paddingTop: spacing.sm }, title: { color: colors.ink, fontSize: 26, fontWeight: "900" },
  form: { gap: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.lg },
  label: { color: colors.ink, fontWeight: "900" }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.ink, paddingHorizontal: spacing.md },
  readonly: { minHeight: 48, justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.mist, paddingHorizontal: spacing.md }, readonlyText: { color: colors.inkMuted },
});
