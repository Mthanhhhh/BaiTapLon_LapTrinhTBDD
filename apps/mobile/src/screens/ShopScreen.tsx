import {provinceLabel} from '../utils/vietnamShipping';
import React, { useContext, useState } from 'react';
import { View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Typography, Button, ProductCard } from '../components/ui';
import { COLORS } from '../theme';
import { ProductListResponse } from '../hooks/useProducts';

type Collection = { id?: number; name: string; productIds: number[] };
type Shop = { id:number; ownerUserId:number; name:string; description?:string; province?:string; productCount:number; soldCount:number; rating:number; reviewCount:number; collections:Collection[] };
const SORTS = [['sold','Bán chạy'],['popular','Phổ biến'],['new','Mới nhất'],['priceAsc','Giá tăng'],['priceDesc','Giá giảm'],['rating','Đánh giá']] as const;
export default function ShopScreen() {
  const navigation=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {params}=useRoute<RouteProp<RootStackParamList,'Shop'>>();
  const id=Number(params.shopId);
  const {user}=useContext(AuthContext);
  const cache=useQueryClient();
  const [sort,setSort]=useState('sold');
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [collection,setCollection]=useState<number|undefined>();
  const [min,setMin]=useState('');const [max,setMax]=useState('');
  const [prices,setPrices]=useState<{minPrice?:number;maxPrice?:number}>({});
  const [filters,setFilters]=useState(false);const [tab,setTab]=useState('products');
  const [editing,setEditing]=useState(false);const [draft,setDraft]=useState<Collection[]>([]);
  const [editError,setEditError]=useState('');const [filterError,setFilterError]=useState('');
  const shop=useQuery({queryKey:['shopDetail',id],queryFn:async()=> (await apiClient.get(`/api/v1/products/shops/${id}`)).data.data as Shop,enabled:Number.isFinite(id)&&id>0});
  const products=useInfiniteQuery({queryKey:['shopProducts',id,sort,search,collection,prices],initialPageParam:0,queryFn:async({pageParam})=>(await apiClient.get(`/api/v1/products/shops/${id}/products`,{params:{sort,keyword:search,collectionId:collection,...prices,page:pageParam,size:20}})).data.data as {content:ProductListResponse[];last:boolean;page:number;totalElements:number},getNextPageParam:p=>p.last?undefined:p.page+1,enabled:!!shop.data});
  const reviews=useInfiniteQuery({queryKey:['shopReviews',id],initialPageParam:0,queryFn:async({pageParam})=>(await apiClient.get(`/api/v1/products/shops/${id}/reviews`,{params:{page:pageParam}})).data.data as {id:number;productName:string;userName:string;rating:number;comment?:string}[],getNextPageParam:(p,pages)=>p.length===20?pages.length:undefined,enabled:!!shop.data&&tab==='reviews'});
  const own=shop.data?.ownerUserId===user?.id;
  const catalog=useInfiniteQuery({queryKey:['shopCatalog',id],initialPageParam:0,queryFn:async({pageParam})=>(await apiClient.get(`/api/v1/products/shops/${id}/products`,{params:{size:100,page:pageParam}})).data.data as {content:ProductListResponse[];last:boolean;page:number},getNextPageParam:p=>p.last?undefined:p.page+1,enabled:own&&editing});
  const save=useMutation({mutationFn:async()=>apiClient.put(`/api/v1/products/shops/${id}/collections`,draft),onSuccess:()=>{setEditing(false);setCollection(undefined);cache.invalidateQueries({queryKey:['shopDetail',id]});cache.invalidateQueries({queryKey:['shopProducts',id]});},onError:(e:any)=>setEditError(e.message)});
  const back=()=>navigation.canGoBack()?navigation.goBack():navigation.navigate('Main',{screen:'Home'});
  const chip=(label:string,active:boolean,onPress:()=>void,key?:string|number)=><TouchableOpacity key={key??label} accessibilityRole="button" onPress={onPress} style={[styles.chip,active&&styles.selected]}><Typography variant="sm" color={active?'primaryDeep':'inkSoft'}>{label}</Typography></TouchableOpacity>;
  if(shop.isPending)return <View style={styles.center}><ActivityIndicator/><Typography>Đang tải shop...</Typography></View>;
  if(shop.isError||!shop.data)return <View style={styles.center}><Typography>Không tải được shop.</Typography><Button onPress={()=>shop.refetch()}>Thử lại</Button><Button onPress={back}>Quay lại</Button></View>;
  const s=shop.data;
  return <SafeAreaView style={styles.root}>
    <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={back}><Ionicons name="arrow-back" size={24} color={COLORS.ink}/></TouchableOpacity><Typography variant="lg" weight="bold">Cửa hàng</Typography></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.titleRow}><Ionicons name="storefront-outline" size={30} color={COLORS.primaryDeep}/><View style={{flex:1}}><Typography variant="xl" weight="bold" role="heading" aria-level={1}>{s.name}</Typography><Typography variant="sm" color="inkSoft">{provinceLabel(s.province)||'Chưa cập nhật địa điểm'}</Typography></View></View>
        {!!s.description&&<Typography variant="sm">{s.description}</Typography>}
        <View style={styles.stats}><Typography variant="sm">{s.productCount} sản phẩm</Typography><Typography variant="sm">Đã bán {s.soldCount}</Typography><Typography variant="sm">{s.reviewCount?`${Number(s.rating).toFixed(1)}/5 · ${s.reviewCount} đánh giá`:'Chưa có đánh giá'}</Typography></View>
        {own&&<Button variant="outline" onPress={()=>navigation.navigate('ShopOrders')}>Quản lý đơn shop</Button>}
        {own&&<Button variant="outline" onPress={()=>{setDraft(s.collections.map(c=>({...c,productIds:[...c.productIds]})));setEditError('');setEditing(true);}}>Tùy chỉnh danh mục</Button>}
      </View>
      <View style={styles.row}>{chip('Sản phẩm',tab==='products',()=>setTab('products'))}{chip(`Đánh giá (${s.reviewCount})`,tab==='reviews',()=>setTab('reviews'))}</View>
      {tab==='products'?<>
        <View style={styles.row}><TextInput accessibilityLabel="Tìm trong shop" placeholder="Tìm sản phẩm trong shop" value={keyword} onChangeText={setKeyword} onSubmitEditing={()=>setSearch(keyword.trim())} style={[styles.input,{flex:1}]}/><Button size="sm" onPress={()=>setSearch(keyword.trim())}>Tìm</Button></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{chip('Tất cả danh mục',!collection,()=>setCollection(undefined))}{s.collections.map(c=>chip(c.name,collection===c.id,()=>setCollection(c.id),c.id))}</ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{SORTS.map(([v,l])=>chip(l,sort===v,()=>setSort(v),v))}{chip('Lọc giá',filters,()=>setFilters(!filters))}</ScrollView>
        {filters&&<View style={styles.card}><View style={styles.row}><TextInput accessibilityLabel="Giá từ" placeholder="Giá từ" keyboardType="numeric" value={min} onChangeText={setMin} style={[styles.input,{flex:1}]}/><TextInput accessibilityLabel="Giá đến" placeholder="Giá đến" keyboardType="numeric" value={max} onChangeText={setMax} style={[styles.input,{flex:1}]}/></View><Button size="sm" onPress={()=>{const lo=min?Number(min):undefined,hi=max?Number(max):undefined;if((lo!==undefined&&(!Number.isFinite(lo)||lo<0))||(hi!==undefined&&(!Number.isFinite(hi)||hi<0))||(lo!==undefined&&hi!==undefined&&lo>hi)){setFilterError('Khoảng giá không hợp lệ');return;}setFilterError('');setPrices({minPrice:lo,maxPrice:hi});}}>Áp dụng</Button>{!!filterError&&<Typography>{filterError}</Typography>}</View>}
        <Typography variant="sm" color="inkSoft">{products.data?.pages[0]?.totalElements??0} sản phẩm</Typography>
        {products.isPending&&<ActivityIndicator/>}{products.isError&&<Button onPress={()=>products.refetch()}>Tải lại sản phẩm</Button>}
        <View style={styles.grid}>{products.data?.pages.flatMap(p=>p.content).map(p=><View style={styles.product} key={p.id}><ProductCard {...p} shopName={s.name} shopLocation={s.province} onPress={()=>navigation.push('ProductDetail',{productId:p.id})}/></View>)}</View>
        {!products.isPending&&!products.isError&&!products.data?.pages[0]?.totalElements&&<Typography>Chưa có sản phẩm phù hợp. Hãy đổi danh mục hoặc bộ lọc.</Typography>}
        {products.hasNextPage&&<Button variant="outline" loading={products.isFetchingNextPage} onPress={()=>products.fetchNextPage()}>Xem thêm sản phẩm</Button>}
      </>:<View style={styles.card}>{reviews.isPending&&<ActivityIndicator/>}{reviews.isError&&<Button onPress={()=>reviews.refetch()}>Tải lại đánh giá</Button>}{reviews.data?.pages.flat().map(r=><View key={r.id} style={styles.review}><Typography weight="bold">{r.userName} · {r.rating}/5</Typography><Typography variant="xs" color="inkSoft">{r.productName}</Typography><Typography variant="sm">{r.comment||'Người mua không để lại nội dung.'}</Typography></View>)}{reviews.data?.pages[0]?.length===0&&<Typography>Shop chưa có đánh giá từ người mua.</Typography>}{reviews.hasNextPage&&<Button onPress={()=>reviews.fetchNextPage()}>Xem thêm đánh giá</Button>}</View>}
    </ScrollView>
    <Modal visible={editing} animationType="slide" onRequestClose={()=>setEditing(false)} transparent><View style={styles.modalBackdrop}><View style={styles.modal}><Typography variant="lg" weight="bold">Danh mục của shop</Typography><Typography variant="sm" color="inkSoft">Đặt tên và chọn sản phẩm cho từng danh mục.</Typography><ScrollView>
      {draft.map((c,i)=><View key={i} style={styles.card}><TextInput accessibilityLabel={`Tên danh mục ${i+1}`} value={c.name} maxLength={100} onChangeText={name=>setDraft(d=>d.map((x,j)=>j===i?{...x,name}:x))} style={styles.input}/>{catalog.data?.pages.flatMap(p=>p.content).map(p=>chip(`${c.productIds.includes(p.id)?'Đã chọn · ':''}${p.name}`,c.productIds.includes(p.id),()=>setDraft(d=>d.map((x,j)=>j===i?{...x,productIds:x.productIds.includes(p.id)?x.productIds.filter(v=>v!==p.id):[...x.productIds,p.id]}:x)),p.id))}<Button variant="outline" size="sm" onPress={()=>setDraft(d=>d.filter((_,j)=>j!==i))}>Bỏ danh mục</Button></View>)}
      {catalog.hasNextPage&&<Button onPress={()=>catalog.fetchNextPage()}>Tải thêm sản phẩm để chọn</Button>}{catalog.isError&&<Typography>Không tải được sản phẩm. Hãy đóng và thử lại.</Typography>}
      <Button variant="outline" onPress={()=>setDraft(d=>[...d,{name:'',productIds:[]}])}>Thêm danh mục</Button>
    </ScrollView>{!!editError&&<Typography>{editError}</Typography>}<Button loading={save.isPending} disabled={save.isPending||draft.some(c=>!c.name.trim())} onPress={()=>save.mutate()}>Lưu danh mục</Button><Button variant="outline" onPress={()=>setEditing(false)}>Đóng</Button></View></View></Modal>
  </SafeAreaView>;
}
const styles=StyleSheet.create({root:{flex:1},center:{flex:1,justifyContent:'center',padding:24,gap:12},header:{flexDirection:'row',alignItems:'center',gap:16,padding:16,backgroundColor:COLORS.surface,borderBottomWidth:1,borderColor:COLORS.border},content:{padding:10,gap:8,paddingBottom:40},card:{backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:16,gap:12},titleRow:{flexDirection:'row',gap:12,alignItems:'center'},stats:{flexDirection:'row',flexWrap:'wrap',gap:14},row:{flexDirection:'row',alignItems:'center',gap:8},chip:{paddingHorizontal:12,paddingVertical:12,borderWidth:1,borderColor:COLORS.border,borderRadius:24,marginRight:8,marginVertical:4,backgroundColor:COLORS.surface},selected:{backgroundColor:COLORS.primarySoft,borderColor:COLORS.primaryDeep},input:{borderWidth:1,borderColor:COLORS.border,borderRadius:10,padding:12,minWidth:0,color:COLORS.ink,backgroundColor:COLORS.surface},grid:{flexDirection:'row',flexWrap:'wrap',gap:6},product:{width:'48%',flexGrow:1,maxWidth:'49%'},review:{paddingVertical:12,borderBottomWidth:1,borderColor:COLORS.border,gap:6},modalBackdrop:{flex:1,backgroundColor:'rgba(30,35,50,0.35)',justifyContent:'center',alignItems:'center',padding:16},modal:{width:'100%',maxWidth:480,maxHeight:'90%',backgroundColor:COLORS.surface,borderRadius:16,padding:16,gap:12}});
