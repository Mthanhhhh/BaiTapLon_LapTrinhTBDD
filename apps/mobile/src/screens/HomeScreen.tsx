import * as Crypto from 'expo-crypto';
import {HotFlashStrip} from '../components/HotFlashStrip';
import React,{useContext,useEffect,useState,useMemo} from 'react';
import {View,SafeAreaView,FlatList,TouchableOpacity,StyleSheet} from 'react-native';
import {useIsFocused,useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Ionicons} from '@expo/vector-icons';
import {RootStackParamList} from '../navigation/AppNavigator';
import {Typography,ProductCard,Button} from '../components/ui';
import {DeliveryDestination} from '../components/DeliveryDestination';
import {PromoCarousel} from '../components/PromoCarousel';
import {COLORS} from '../theme';
import {AuthContext} from '../context/AuthContext';
import {useCart} from '../hooks/useCart';
import {ProductListResponse} from '../hooks/useProducts';
import {apiClient} from '../api/client';
import {searchHistory} from '../utils/searchHistory';
export default function HomeScreen(){
 const n=useNavigation<NativeStackNavigationProp<RootStackParamList>>();const focused=useIsFocused();const {user}=useContext(AuthContext);const cart=useCart();const [keyword,setKeyword]=useState('');
 useEffect(()=>{if(focused)searchHistory.getKeywords().then(k=>setKeyword(k.slice(0,5).join('|')));},[focused,user?.id]);
 const sessionId=useMemo(()=>Crypto.randomUUID(),[keyword,user?.id]);
 const products=useInfiniteQuery({queryKey:['recommendations','ai-catalog',user?.id,keyword,sessionId],initialPageParam:0,queryFn:async({pageParam})=>(await apiClient.post('/api/v1/ai/recommendations',{keywords:keyword.split('|').filter(Boolean),sessionId,page:pageParam,size:20})).data.data.page as {content:ProductListResponse[];last:boolean;page:number;totalElements:number},getNextPageParam:p=>p.last?undefined:p.page+1});
 const rows=products.data?.pages.flatMap(p=>p.content)??[];
 const header=<View style={{gap:8,paddingBottom:6}}>
  <View style={[styles.row,{gap:10}]}><Typography variant="lg" weight="bold" role="heading" aria-level={1}>E-Shop</Typography><TouchableOpacity accessibilityRole="button" accessibilityLabel="Tìm kiếm sản phẩm" onPress={()=>n.navigate('Main',{screen:'Search'})} style={[styles.search,{flex:1}]}><Ionicons name="search-outline" size={18} color={COLORS.primaryDeep}/><Typography variant="sm" color="inkSoft" numberOfLines={1}>{'Tìm sản phẩm...'}</Typography></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Giỏ hàng ${cart.data?.totalItems??0} sản phẩm`} onPress={()=>n.navigate('Cart')} style={styles.cartButton}><Ionicons name="cart-outline" size={25} color={COLORS.primaryDeep}/>{!!cart.data?.totalItems&&<View style={styles.cartBadge}><Typography variant="xs" color="surface" weight="bold">{cart.data.totalItems>99?'99+':cart.data.totalItems}</Typography></View>}</TouchableOpacity></View>
  <View style={{flexDirection:'row',backgroundColor:COLORS.surface,borderRadius:12,paddingVertical:8,borderWidth:1,borderColor:COLORS.border}}>{([
    ['Ưu đãi','pricetag-outline','Promotions'],['Đơn mua','cube-outline','Orders'],['Quản lý shop','storefront-outline','SellerCenter']
  ] as const).map(([label,icon,screen],i)=><TouchableOpacity key={screen} accessibilityRole="button" onPress={()=>screen==='Promotions'?n.navigate('Promotions'):screen==='SellerCenter'?n.navigate('SellerCenter'):n.navigate('Main',{screen} as any)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,borderRightWidth:i<2?1:0,borderColor:COLORS.border}}><Ionicons name={icon} size={17} color={COLORS.primaryDeep}/><Typography variant="xs" weight="medium">{label}</Typography></TouchableOpacity>)}</View>
  <DeliveryDestination/><PromoCarousel/>
  <HotFlashStrip/>
  <View style={styles.row}><Typography variant="lg" weight="bold" role="heading" aria-level={2}>Dành cho bạn</Typography></View>
 </View>;
 return <SafeAreaView style={{flex:1}}><FlatList data={rows} keyExtractor={p=>String(p.id)} numColumns={2} columnWrapperStyle={{gap:6}} contentContainerStyle={{padding:8,paddingBottom:24}} ListHeaderComponent={header} renderItem={({item})=><View style={{width:'49%',marginBottom:6}}><ProductCard {...item} compact onPress={()=>n.navigate('ProductDetail',{productId:item.id})}/></View>} refreshing={products.isRefetching} onRefresh={()=>{products.refetch();}} onEndReached={()=>{if(products.hasNextPage&&!products.isFetchingNextPage)products.fetchNextPage();}} onEndReachedThreshold={0.4} ListEmptyComponent={<View style={{padding:20,gap:12}}><Typography>{products.isPending?'Đang tải sản phẩm...':products.isError?'Không tải được sản phẩm.':'Chưa có sản phẩm được đăng bán.'}</Typography>{products.isError&&<Button onPress={()=>products.refetch()}>Thử lại</Button>}</View>} ListFooterComponent={products.isFetchingNextPage?<Typography>Đang tải thêm...</Typography>:null}/></SafeAreaView>;
}
const styles=StyleSheet.create({row:{paddingHorizontal:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},search:{flexDirection:'row',alignItems:'center',gap:8,borderRadius:24,padding:11,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border},cartButton:{alignItems:'center',justifyContent:'center',width:48,height:48,borderRadius:24,borderWidth:2,borderColor:COLORS.primaryDeep,backgroundColor:COLORS.primarySoft},cartBadge:{position:'absolute',right:-4,top:-5,minWidth:19,height:19,borderRadius:10,paddingHorizontal:4,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.deal},categoryPanel:{padding:6,borderWidth:1,borderColor:COLORS.border,borderRadius:18,backgroundColor:COLORS.surface},circle:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'}});
