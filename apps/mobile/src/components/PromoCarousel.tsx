import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './ui';
import { COLORS } from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';
const BANNERS = [
 {title:'Khám phá E-Shop',body:'Món bạn thích, trong một lần tìm.',tag:'Mua sắm theo cách của bạn',color:COLORS.sky,icon:'bag-handle-outline'},
 {title:'Hẹn ngày đôi 11.11',body:'Lên danh sách món yêu thích từ hôm nay.',tag:'Cảm hứng mua sắm',color:COLORS.pink,icon:'calendar-outline'},
 {title:'Tìm đúng món bạn cần',body:'Gợi ý thay đổi theo tìm kiếm gần đây.',tag:'Dành riêng cho bạn',color:COLORS.lilac,icon:'search-outline'},
 {title:'Khám phá từng cửa hàng',body:'Xem sản phẩm, danh mục và đánh giá.',tag:'Ghé shop bạn yêu thích',color:COLORS.mint,icon:'storefront-outline'},
 {title:'Theo dõi từng đơn hàng',body:'Cập nhật khi shop xác nhận và gửi hàng.',tag:'Đơn của bạn, luôn trong tầm tay',color:COLORS.peach,icon:'cube-outline'},
] as const;
export function PromoCarousel(){
 const navigation=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 const focused=useIsFocused();const list=useRef<FlatList>(null);
 const [width,setWidth]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false),[dragging,setDragging]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active');
 useEffect(()=>{const s=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>s.remove();},[]);
 const move=(n:number)=>{setIndex(n);list.current?.scrollToOffset({offset:n*width,animated:true});};
 useEffect(()=>{if(!width||!focused||paused||dragging||!foreground)return;const t=setTimeout(()=>move((index+1)%BANNERS.length),1800);return()=>clearTimeout(t);},[width,focused,paused,dragging,index,foreground]);
 return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={styles.frame}>
  {!!width&&<FlatList ref={list} data={BANNERS} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={x=>x.title} onScrollBeginDrag={()=>setDragging(true)} onScrollEndDrag={()=>setDragging(false)} onMomentumScrollEnd={e=>setIndex(Math.round(e.nativeEvent.contentOffset.x/width))} renderItem={({item})=><TouchableOpacity accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>item.icon==='cube-outline'?navigation.navigate('Main',{screen:'Notifications'}):navigation.navigate('Main',{screen:'Search'})} style={[styles.slide,{width,backgroundColor:item.color}]}><View style={{flex:1,gap:4}}><Typography variant="lg" weight="bold" numberOfLines={1}>{item.title}</Typography><Typography variant="xs" color="inkSoft" numberOfLines={2}>{item.body}</Typography></View><Ionicons name={item.icon} size={38} color={COLORS.primaryDeep}/></TouchableOpacity>}/ >}
  <View style={styles.controls}><TouchableOpacity accessibilityLabel="Banner trước" accessibilityRole="button" onPress={()=>move((index+4)%5)}><Ionicons name="chevron-back" size={22} color={COLORS.primaryDeep}/></TouchableOpacity>{BANNERS.map((b,n)=><TouchableOpacity key={b.title} accessibilityRole="button" accessibilityLabel={`Xem banner ${n+1}`} onPress={()=>move(n)} style={[styles.dot,{backgroundColor:index===n?COLORS.primaryDeep:COLORS.border}]}/>)}<TouchableOpacity accessibilityRole="button" accessibilityLabel={paused?'Chạy banner':'Tạm dừng banner'} onPress={()=>setPaused(!paused)}><Ionicons name={paused?'play':'pause'} size={18} color={COLORS.primaryDeep}/></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Banner tiếp theo" onPress={()=>move((index+1)%5)}><Ionicons name="chevron-forward" size={22} color={COLORS.primaryDeep}/></TouchableOpacity></View>
 </View>;
}
const styles=StyleSheet.create({frame:{borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.surface},slide:{padding:12,minHeight:88,flexDirection:'row',gap:8,alignItems:'center'},controls:{flexDirection:'row',gap:12,alignItems:'center',justifyContent:'center',paddingVertical:3},dot:{width:8,height:8,borderRadius:4}});
