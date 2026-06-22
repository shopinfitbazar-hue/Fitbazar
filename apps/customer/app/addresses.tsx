import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/styles/theme";

const initial = { name: "", phone: "", line1: "", zone: "Kathmandu", district: "Kathmandu", isDefault: true };
export default function AddressesScreen() {
  const client = useQueryClient(); const [form, setForm] = useState(initial);
  const addresses = useQuery({ queryKey: ["mobile-addresses"], queryFn: () => api.mobileAddresses() });
  const create = useMutation({ mutationFn: () => api.createMobileAddress(form), onSuccess: async () => { setForm(initial); await client.invalidateQueries({ queryKey: ["mobile-addresses"] }); }, onError: (error) => Alert.alert("Could not save", error instanceof Error ? error.message : "Try again") });
  const makeDefault = useMutation({ mutationFn: (id: string) => api.updateMobileAddress(id, { isDefault: true }), onSuccess: () => client.invalidateQueries({ queryKey: ["mobile-addresses"] }) });
  const remove = useMutation({ mutationFn: (id: string) => api.deleteMobileAddress(id), onSuccess: () => client.invalidateQueries({ queryKey: ["mobile-addresses"] }) });
  return <Screen contentStyle={styles.screen}>
    <Text style={styles.title}>Saved Addresses</Text>
    {addresses.data?.addresses.map((address) => <View key={address.id} style={styles.card}>
      <View style={styles.row}><Text style={styles.cardTitle}>{address.name}</Text>{address.isDefault ? <Text style={styles.defaultText}>Default</Text> : null}</View>
      <Text style={styles.meta}>{address.line1}, {address.district}, {address.zone}</Text><Text style={styles.meta}>{address.phone}</Text>
      <View style={styles.actions}>{!address.isDefault ? <Pressable onPress={() => address.id && makeDefault.mutate(address.id)}><Text style={styles.link}>Make default</Text></Pressable> : null}<Pressable onPress={() => address.id && remove.mutate(address.id)}><Text style={styles.remove}>Delete</Text></Pressable></View>
    </View>)}
    <View style={styles.form}><Text style={styles.formTitle}>Add address</Text>{(["name","phone","line1","zone","district"] as const).map((field) => <TextInput key={field} value={form[field]} onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))} placeholder={field === "line1" ? "Street address" : field[0].toUpperCase()+field.slice(1)} placeholderTextColor={colors.inkMuted} style={styles.input} />)}<PrimaryButton loading={create.isPending} onPress={() => create.mutate()}>Save Address</PrimaryButton></View>
  </Screen>;
}
const styles = StyleSheet.create({ screen:{paddingTop:spacing.sm},title:{color:colors.ink,fontSize:26,fontWeight:"900"},card:{gap:spacing.xs,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.surface,padding:spacing.lg},row:{flexDirection:"row",justifyContent:"space-between"},cardTitle:{color:colors.ink,fontWeight:"900"},defaultText:{color:colors.success,fontWeight:"900",fontSize:12},meta:{color:colors.inkMuted},actions:{flexDirection:"row",gap:spacing.lg,marginTop:spacing.sm},link:{color:colors.goldDark,fontWeight:"900"},remove:{color:colors.danger,fontWeight:"900"},form:{gap:spacing.sm,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.surface,padding:spacing.lg},formTitle:{color:colors.ink,fontSize:18,fontWeight:"900"},input:{minHeight:46,borderWidth:1,borderColor:colors.line,borderRadius:radius.sm,color:colors.ink,paddingHorizontal:spacing.md} });
