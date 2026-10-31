import React,{useState} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {View,ScrollView,TouchableOpacity,StyleSheet} from 'react-native';
import {useNavigation,useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '../api/client';
import {CategoryResponse} from '../hooks/useProducts';
import {CategoryArtwork} from '../components/CategoryArtwork';
import {MarketplaceHeader} from '../components/MarketplaceHeader';
import {Button,Typography} from '../components/ui';
import {COLORS} from '../theme';
type Source={id:number;name:string;sourceUrl:string;province:string;ratingAvg:number;ratingCount:number;productCount:number;soldCount:number};
export default function CategoriesScreen(){
 const n=useNavigation<any>(),route=useRoute<any>();const [selectedId,setSelectedId]=useState<number|undefined>(route.params?.categoryId);
 const q=useQuery({queryKey:['categoryCatalog'],queryFn:async()=>(await apiClient.get('/api/v1/categories/catalog')).data.data as CategoryResponse[]});
 const roots=(q.data||[]).filter(c=>!c.parentId),selected=roots.find(c=>c.id===selectedId)||roots[0];
 const children=(q.data||[]).filter(c=>c.parentId===selected?.id);
 const sources=useQuery({queryKey:['categoryShops',selected?.id],enabled:!!selected,queryFn:async()=>(await apiClient.get(`/api/v1/categories/${selected!.id}/shops`)).data.data as Source[]});
 const browse=(c:CategoryResponse)=>n.navigate('Main',{screen:'Search',params:{categoryId:c.id,categoryName:c.name,keyword:''}});
 return <View style={{flex:1}}><MarketplaceHeader back title="Danh mục sản phẩm"/>{q.isPending?<Typography style={{padding:16}}>Đang tải danh mục…</Typography>:q.isError?<View style={{padding:16,gap:12}}><Typography>Chưa tải được danh mục.</Typography><Button onPress={()=>q.refetch()}>Thử lại</Button></View>:<View style={s.body}>
  <ScrollView style={s.rail} contentContainerStyle={{paddingBottom:24}} showsVerticalScrollIndicator={false}>{roots.map(c=><TouchableOpacity key={c.id} accessibilityRole="button" accessibilityLabel={`Danh mục ${c.name}`} accessibilityState={{selected:selected?.id===c.id}} onPress={()=>setSelectedId(c.id)} style={[s.rootItem,selected?.id===c.id&&s.selected]}><CategoryArtwork category={c} size={42}/><Typography variant="xs" weight={selected?.id===c.id?'bold':'medium'} color={selected?.id===c.id?'primaryDeep':'inkSoft'} align="center" style={{fontSize:13}}>{c.name}</Typography></TouchableOpacity>)}</ScrollView>
  <ScrollView style={{flex:1}} contentContainerStyle={s.content} key={selected?.id}>
   <Typography variant="lg" weight="bold" role="heading" aria-level={2}>{selected?.name}</Typography>
   {selected&&<Button size="sm" variant="outline" onPress={()=>browse(selected)}>Xem tất cả sản phẩm</Button>}
   <View style={s.grid}>{children.map(c=><TouchableOpacity key={c.id} accessibilityRole="button" accessibilityLabel={`Xem ${c.name}`} onPress={()=>browse(c)} style={s.child}><CategoryArtwork category={c} size={46}/><Typography variant="xs" align="center" style={{fontSize:13,lineHeight:17}}>{c.name}</Typography></TouchableOpacity>)}</View>
   <View style={s.separator}/><Typography variant="md" weight="bold">Thương hiệu nổi bật</Typography>
   {sources.isPending?<Typography variant="sm">Đang tải shop…</Typography>:sources.isError?<Button variant="outline" onPress={()=>sources.refetch()}>Tải lại shop</Button>:sources.data?.length?<View style={s.shopGrid}>{sources.data.map(shop=><TouchableOpacity key={shop.id} accessibilityRole="button" accessibilityLabel={`Xem shop ${shop.name}`} onPress={()=>n.navigate('Shop',{shopId:shop.id})} style={s.shopCard}><Typography variant="sm" weight="bold" align="center" numberOfLines={2}>{shop.name}</Typography><Typography variant="xs" color="inkSoft" align="center">{shop.productCount} sản phẩm</Typography>{shop.ratingCount>0&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3}}><Ionicons name="star" size={12} color={COLORS.primaryDeep}/><Typography variant="xs" color="primaryDeep">{Number(shop.ratingAvg).toFixed(1)}</Typography></View>}</TouchableOpacity>)}</View>:<Typography variant="sm" color="inkSoft">Shop đang được cập nhật.</Typography>}

  </ScrollView>
 </View>}</View>;
}
const s=StyleSheet.create({body:{flex:1,flexDirection:'row',backgroundColor:COLORS.surface},rail:{width:96,flexGrow:0,backgroundColor:COLORS.surfaceAlt,borderRightWidth:1,borderColor:COLORS.border},rootItem:{alignItems:'center',justifyContent:'center',paddingHorizontal:7,paddingVertical:12,gap:5,minHeight:96,borderLeftWidth:3,borderColor:'transparent'},selected:{backgroundColor:COLORS.surface,borderLeftColor:COLORS.primaryDeep},content:{padding:14,gap:12,paddingBottom:32},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-start',rowGap:12},child:{width:'33.333%',minHeight:112,paddingHorizontal:3,alignItems:'center',gap:8},separator:{height:1,backgroundColor:COLORS.border,marginVertical:2},shopGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},shopCard:{width:'47%',minHeight:92,justifyContent:'center',padding:8,borderWidth:1,borderColor:COLORS.border,borderRadius:12,gap:5},source:{padding:12,borderWidth:1,borderColor:COLORS.border,borderRadius:12,gap:8}});
