import React from 'react';
import {ScrollView,TouchableOpacity,View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {apiClient} from '../api/client';
import {CategoryResponse} from '../hooks/useProducts';
import {CategoryArtwork} from './CategoryArtwork';
import {Typography} from './ui';
import {COLORS} from '../theme';
export function CategoryStrip(){
 const navigation=useNavigation<any>();const query=useQuery({queryKey:['categoryCatalog'],queryFn:async()=>(await apiClient.get('/api/v1/categories/catalog')).data.data as CategoryResponse[]});
 return <View style={{gap:5,paddingHorizontal:12,paddingBottom:8,backgroundColor:COLORS.surface}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Typography weight="bold" variant="sm">Danh mục sản phẩm</Typography><TouchableOpacity accessibilityRole="button" onPress={()=>navigation.navigate('Categories')}><Typography variant="xs" color="primaryDeep">Xem tất cả ›</Typography></TouchableOpacity></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:5,paddingVertical:3}}>{query.data?.filter(c=>!c.parentId).map(c=><TouchableOpacity key={c.id} accessibilityRole="button" accessibilityLabel={`Mở danh mục ${c.name}`} onPress={()=>navigation.navigate('Categories',{categoryId:c.id})} style={{width:68,alignItems:'center',gap:4}}><CategoryArtwork category={c} size={48}/><Typography variant="xs" numberOfLines={2} align="center" style={{height:30,fontSize:11,lineHeight:14}}>{c.name}</Typography></TouchableOpacity>)}</ScrollView></View>;
}
