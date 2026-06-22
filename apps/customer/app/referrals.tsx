import { Share, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";

export default function ReferralsScreen(){const user=useAuthStore((state)=>state.user);const code=`FIT${(user?.id||"BAZAR").slice(-6).toUpperCase()}`;return <Screen contentStyle={styles.screen}><Text style={styles.title}>Refer a Friend</Text><Text style={styles.subtitle}>Invite friends to Nepal's premium fashion marketplace.</Text><View style={styles.codeCard}><Text style={styles.label}>Your referral code</Text><Text style={styles.code}>{code}</Text></View><PrimaryButton onPress={()=>Share.share({message:`Shop premium fashion on FitBazar. Use my referral code ${code}: https://www.fit-bazar.com`})}>Share Invite</PrimaryButton></Screen>}
const styles=StyleSheet.create({screen:{paddingTop:spacing.sm},title:{color:colors.ink,fontSize:26,fontWeight:"900"},subtitle:{color:colors.inkMuted,lineHeight:20},codeCard:{alignItems:"center",gap:spacing.sm,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.surface,padding:spacing.xl},label:{color:colors.inkMuted,fontWeight:"800"},code:{color:colors.goldDark,fontSize:30,fontWeight:"900"}});
