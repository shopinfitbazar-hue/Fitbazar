import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/styles/theme";
import { shortDate } from "@/utils/format";

export default function SupportScreen() {
  const client = useQueryClient(); const [topic,setTopic]=useState("Order Help"); const [orderNumber,setOrderNumber]=useState(""); const [message,setMessage]=useState("");
  const tickets=useQuery({queryKey:["mobile-support"],queryFn:()=>api.mobileSupport()});
  const create=useMutation({mutationFn:()=>api.createMobileSupport({topic,orderNumber,message}),onSuccess:async()=>{setMessage("");await client.invalidateQueries({queryKey:["mobile-support"]});Alert.alert("Request received","FitBazar support will reply here.");},onError:(error)=>Alert.alert("Could not submit",error instanceof Error?error.message:"Please try again")});
  return <Screen contentStyle={styles.screen}><Text style={styles.title}>Customer Support</Text><View style={styles.form}><TextInput value={topic} onChangeText={setTopic} placeholder="Topic" placeholderTextColor={colors.inkMuted} style={styles.input}/><TextInput value={orderNumber} onChangeText={setOrderNumber} placeholder="Order number (optional)" placeholderTextColor={colors.inkMuted} style={styles.input}/><TextInput value={message} onChangeText={setMessage} placeholder="How can we help?" placeholderTextColor={colors.inkMuted} multiline style={[styles.input,styles.message]}/><PrimaryButton loading={create.isPending} onPress={()=>create.mutate()}>Send Request</PrimaryButton></View><Text style={styles.sectionTitle}>Your requests</Text>{tickets.data?.tickets.map((ticket)=><View key={ticket.id} style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>{ticket.topic}</Text><Text style={styles.status}>{ticket.status}</Text></View><Text style={styles.meta}>{ticket.message}</Text><Text style={styles.date}>{shortDate(ticket.updatedAt)}</Text></View>)}</Screen>;
}
const styles=StyleSheet.create({screen:{paddingTop:spacing.sm},title:{color:colors.ink,fontSize:26,fontWeight:"900"},sectionTitle:{color:colors.ink,fontSize:18,fontWeight:"900"},form:{gap:spacing.sm,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.surface,padding:spacing.lg},input:{minHeight:46,borderWidth:1,borderColor:colors.line,borderRadius:radius.sm,color:colors.ink,paddingHorizontal:spacing.md},message:{minHeight:110,paddingTop:spacing.md,textAlignVertical:"top"},card:{gap:spacing.xs,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.surface,padding:spacing.lg},row:{flexDirection:"row",justifyContent:"space-between",gap:spacing.sm},cardTitle:{flex:1,color:colors.ink,fontWeight:"900"},status:{color:colors.success,fontSize:12,fontWeight:"900"},meta:{color:colors.inkMuted,lineHeight:20},date:{color:colors.inkMuted,fontSize:11}});
