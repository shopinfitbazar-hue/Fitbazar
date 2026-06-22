import { StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProductCard } from "@/components/ProductCard";
import { Screen } from "@/components/Screen";
import { useRecentlyViewed } from "@/state/recentlyViewed";
import { colors, spacing } from "@/styles/theme";

export default function RecentlyViewedScreen(){const products=useRecentlyViewed((state)=>state.products);const clear=useRecentlyViewed((state)=>state.clear);return <Screen contentStyle={styles.screen}><Text style={styles.title}>Recently Viewed</Text>{products.length?<><View style={styles.grid}>{products.map((product)=><ProductCard key={product.id} product={product}/>)}</View><PrimaryButton tone="light" onPress={()=>void clear()}>Clear History</PrimaryButton></>:<EmptyState title="No recently viewed products" message="Products you open will appear here."/>}</Screen>}
const styles=StyleSheet.create({screen:{paddingTop:spacing.sm},title:{color:colors.ink,fontSize:26,fontWeight:"900"},grid:{flexDirection:"row",flexWrap:"wrap",gap:spacing.md}});
