import React,{useContext,useEffect,useState} from 'react';
import {View,SafeAreaView,FlatList,TouchableOpacity,ScrollView,StyleSheet} from 'react-native';
import {useIsFocused,useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import {Ionicons} from '@expo/vector-icons';
import {RootStackParamList} from '../navigation/AppNavigator';
import {Typography,ProductCard,Button} from '../components/ui';
import {DeliveryDestination} from '../components/DeliveryDestination';
import {PromoCarousel} from '../components/PromoCarousel';
import {CategoryArtwork} from '../components/CategoryArtwork';
import {COLORS} from '../theme';
import {AuthContext} from '../context/AuthContext';
import {useCart} from '../hooks/useCart';
import {CategoryResponse,ProductListResponse} from '../hooks/useProducts';
import {apiClient} from '../api/client';
import {searchHistory} from '../utils/searchHistory';
const CATEGORY_NAMES:Record<string,string>={Electronics:'Điện tử',Smartphones:'Điện thoại',Tablets:'Máy tính bảng',Laptops:'Laptop',Headphones:'Tai nghe',Fashion:'Thời trang',Shoes:'Giày dép',Bags:'Túi xách',Hoodies:'Áo hoodie',Beauty:'Làm đẹp','Fresh Fruits':'Trái cây',Lipstick:'Son môi',Toys:'Đồ chơi'};
const categoryName=(c:CategoryResponse)=>CATEGORY_NAMES[c.name]??c.name;
export default function HomeScreen(){
 const n=useNavigation<NativeStackNavigationProp<RootStackParamList>>();const focused=useIsFocused();const {user}=useContext(AuthContext);const cart=useCart();const [keyword,setKeyword]=useState('');
 useEffect(()=>{if(focused)searchHistory.getKeywords().then(k=>setKeyword(k[0]??''));},[focused,user?.id]);
 const cats=useQuery({queryKey:['categoryCatalog'],queryFn:async()=>(await apiClient.get('/api/v1/categories/catalog')).data.data as CategoryResponse[]});
 const products=useInfiniteQuery({queryKey:['recommendations','full-catalog',user?.id,keyword],initialPageParam:0,queryFn:async({pageParam})=>(await apiClient.get('/api/v1/products/recommendations',{params:{keyword,page:pageParam,size:20}})).data.data as {content:ProductListResponse[];last:boolean;page:number;totalElements:number},getNextPageParam:p=>p.last?undefined:p.page+1});
 const rows=products.data?.pages.flatMap(p=>p.content)??[];
 const categoryItems=(cats.data??[]).filter(c=>!c.parentId);
 const header=<View style={{gap:8,paddingBottom:6}}>
  <View style={[styles.row,{gap:10}]}><Typography variant="lg" weight="bold" role="heading" aria-level={1}>E-Shop</Typography><TouchableOpacity accessibilityRole="button" accessibilityLabel="Tìm kiếm sản phẩm" onPress={()=>n.navigate('Main',{screen:'Search'})} style={[styles.search,{flex:1}]}><Ionicons name="search-outline" size={18} color={COLORS.primaryDeep}/><Typography variant="sm" color="inkSoft" numberOfLines={1}>{'Tìm sản phẩm...'}</Typography></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Giỏ hàng ${cart.data?.totalItems??0} sản phẩm`} onPress={()=>n.navigate('Cart')} style={styles.cartButton}><Ionicons name="cart-outline" size={25} color={COLORS.primaryDeep}/>{!!cart.data?.totalItems&&<View style={styles.cartBadge}><Typography variant="xs" color="surface" weight="bold">{cart.data.totalItems>99?'99+':cart.data.totalItems}</Typography></View>}</TouchableOpacity></View>
  <View style={{flexDirection:'row',backgroundColor:COLORS.surface,borderRadius:12,paddingVertical:8,borderWidth:1,borderColor:COLORS.border}}>{([
    ['Ưu đãi','pricetag-outline','Promotions'],['Đơn mua','cube-outline','Orders'],['Quản lý shop','storefront-outline','SellerCenter']
  ] as const).map(([label,icon,screen],i)=><TouchableOpacity key={screen} accessibilityRole="button" onPress={()=>screen==='Promotions'?n.navigate('Promotions'):screen==='SellerCenter'?n.navigate('SellerCenter'):n.navigate('Main',{screen} as any)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,borderRightWidth:i<2?1:0,borderColor:COLORS.border}}><Ionicons name={icon} size={17} color={COLORS.primaryDeep}/><Typography variant="xs" weight="medium">{label}</Typography></TouchableOpacity>)}</View>
  <DeliveryDestination/><PromoCarousel/>
  <View style={{gap:6}}><View style={styles.row}><Typography variant="lg" weight="bold" role="heading" aria-level={2}>Danh mục sản phẩm</Typography><TouchableOpacity accessibilityRole="button" accessibilityLabel="Xem tất cả danh mục" onPress={()=>n.navigate('Categories')}><Typography variant="xs" color="primaryDeep">Xem tất cả ›</Typography></TouchableOpacity></View><View style={styles.categoryPanel}>{cats.isError?<Button variant="outline" onPress={()=>cats.refetch()}>Tải lại danh mục</Button>:<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,paddingVertical:2}}>{categoryItems.map(c=><TouchableOpacity key={c.id} accessibilityRole="button" accessibilityLabel={`Mở danh mục ${categoryName(c)}`} onPress={()=>{searchHistory.recordViewedCategory(c.id);n.navigate('Categories',{categoryId:c.id});}} style={{width:72,alignItems:'center',justifyContent:'flex-start',gap:3}}><CategoryArtwork category={c} size={44}/><Typography variant="xs" align="center" style={{fontSize:11,lineHeight:14,width:'100%',minHeight:28}} numberOfLines={2}>{categoryName(c)}</Typography></TouchableOpacity>)}</ScrollView>}</View></View>
  <View style={styles.row}><Typography variant="lg" weight="bold" role="heading" aria-level={2}>Dành cho bạn</Typography></View>
 </View>;
 return <SafeAreaView style={{flex:1}}><FlatList data={rows} keyExtractor={p=>String(p.id)} numColumns={2} columnWrapperStyle={{gap:6}} contentContainerStyle={{padding:8,paddingBottom:24}} ListHeaderComponent={header} renderItem={({item})=><View style={{width:'49%',marginBottom:6}}><ProductCard {...item} compact onPress={()=>n.navigate('ProductDetail',{productId:item.id})}/></View>} refreshing={products.isRefetching} onRefresh={()=>{products.refetch();cats.refetch();}} onEndReached={()=>{if(products.hasNextPage&&!products.isFetchingNextPage)products.fetchNextPage();}} onEndReachedThreshold={0.4} ListEmptyComponent={<View style={{padding:20,gap:12}}><Typography>{products.isPending?'Đang tải sản phẩm...':products.isError?'Không tải được sản phẩm.':'Chưa có sản phẩm được đăng bán.'}</Typography>{products.isError&&<Button onPress={()=>products.refetch()}>Thử lại</Button>}</View>} ListFooterComponent={products.isFetchingNextPage?<Typography>Đang tải thêm...</Typography>:null}/></SafeAreaView>;
}
const styles=StyleSheet.create({row:{paddingHorizontal:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},search:{flexDirection:'row',alignItems:'center',gap:8,borderRadius:24,padding:11,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border},cartButton:{alignItems:'center',justifyContent:'center',width:48,height:48,borderRadius:24,borderWidth:2,borderColor:COLORS.primaryDeep,backgroundColor:COLORS.primarySoft},cartBadge:{position:'absolute',right:-4,top:-5,minWidth:19,height:19,borderRadius:10,paddingHorizontal:4,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.deal},categoryPanel:{padding:6,borderWidth:1,borderColor:COLORS.border,borderRadius:18,backgroundColor:COLORS.surface},circle:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'}});
