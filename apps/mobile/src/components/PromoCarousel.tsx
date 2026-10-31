import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
const BANNERS = [
 {title:'Đón Tết linh đình – Săn sale cực đỉnh',image:require('../../assets/banners/campaign-01.jpg')},
 {title:'Chăm da toàn diện',image:require('../../assets/banners/campaign-02.jpg')},
 {title:'Rạng rỡ tựu trường',image:require('../../assets/banners/campaign-03.jpg')},
 {title:'Săn deal đỉnh nóc',image:require('../../assets/banners/campaign-04.jpg')},
 {title:'Săn deal đồng giá',image:require('../../assets/banners/campaign-05.jpg')},
 {title:'Vali giá tốt – Thả ga du lịch',image:require('../../assets/banners/campaign-06.jpg')},
 {title:'Thoải mái lướt hè',image:require('../../assets/banners/campaign-07.jpg')},
 {title:'Nhà cửa thơm mát',image:require('../../assets/banners/campaign-08.jpg')},
 {title:'Săn deal da khỏe – Cùng mẹ chăm bé',image:require('../../assets/banners/campaign-09.jpg')},
 {title:'Mọt sách Tiki – Săn deal da khỏe',image:require('../../assets/banners/campaign-10.jpg')},
 {title:'Top deal yến sào',image:require('../../assets/banners/campaign-11.jpg')},
 {title:'Halloween sale tới tấp',image:require('../../assets/banners/campaign-12.jpg')},
] as const;
export function PromoCarousel(){
 const navigation=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 const focused=useIsFocused();const list=useRef<FlatList>(null);
 const [width,setWidth]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false),[dragging,setDragging]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active');
 const activeIndex=useRef(0);
 useEffect(()=>{const s=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>s.remove();},[]);
 const move=(n:number)=>{const next=(n+BANNERS.length)%BANNERS.length;activeIndex.current=next;setIndex(next);list.current?.scrollToOffset({offset:next*width,animated:true});};
 useEffect(()=>{if(width)list.current?.scrollToOffset({offset:activeIndex.current*width,animated:false});},[width]);
 useEffect(()=>{if(!width||!focused||paused||dragging||!foreground)return;const t=setTimeout(()=>move(index+1),1800);return()=>clearTimeout(t);},[width,focused,paused,dragging,index,foreground]);
 return <View accessibilityLabel="Banner mua sắm" onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={styles.frame}>
  {!!width&&<FlatList ref={list} data={BANNERS} horizontal pagingEnabled showsHorizontalScrollIndicator={false} initialNumToRender={2} windowSize={3} keyExtractor={x=>x.title} getItemLayout={(_,n)=>({length:width,offset:n*width,index:n})} onScrollBeginDrag={()=>setDragging(true)} onScrollEndDrag={()=>setDragging(false)} onMomentumScrollEnd={e=>{const next=Math.max(0,Math.min(BANNERS.length-1,Math.round(e.nativeEvent.contentOffset.x/width)));activeIndex.current=next;setIndex(next);}} renderItem={({item})=><TouchableOpacity accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>navigation.navigate('Main',{screen:'Search'})} activeOpacity={0.95} style={{width,height:width*270/540}}><Image source={item.image} accessibilityLabel={item.title} style={styles.image} resizeMode="cover"/></TouchableOpacity>}/>}
  {!!width&&<>
   <TouchableOpacity style={[styles.arrow,{left:6}]} accessibilityLabel="Banner trước" accessibilityRole="button" onPress={()=>move(index-1)}><Ionicons name="chevron-back" size={20} color="#FFFFFF"/></TouchableOpacity>
   <TouchableOpacity style={[styles.arrow,{right:6}]} accessibilityLabel="Banner tiếp theo" accessibilityRole="button" onPress={()=>move(index+1)}><Ionicons name="chevron-forward" size={20} color="#FFFFFF"/></TouchableOpacity>
   <View style={styles.dots}>{BANNERS.map((b,n)=><TouchableOpacity key={b.title} accessibilityRole="button" accessibilityLabel={`Xem banner ${n+1}`} aria-selected={index===n} onPress={()=>move(n)} style={styles.dotTarget}><View style={[styles.dot,index===n&&styles.activeDot]}/></TouchableOpacity>)}</View>
   <TouchableOpacity style={styles.pause} accessibilityRole="button" accessibilityLabel={paused?'Chạy banner':'Tạm dừng banner'} onPress={()=>setPaused(!paused)}><Ionicons name={paused?'play':'pause'} size={14} color="#FFFFFF"/></TouchableOpacity>
  </>}
 </View>;
}
const styles=StyleSheet.create({
 frame:{borderRadius:14,overflow:'hidden',position:'relative',aspectRatio:540/270,backgroundColor:'#EDF1F5'},
 image:{width:'100%',height:'100%'},
 arrow:{position:'absolute',top:'50%',marginTop:-14,width:28,height:28,borderRadius:14,backgroundColor:'rgba(20,25,40,0.40)',alignItems:'center',justifyContent:'center'},
 dots:{position:'absolute',bottom:2,left:0,right:0,flexDirection:'row',alignItems:'center',justifyContent:'center',pointerEvents:'box-none'},
 dotTarget:{width:14,height:20,alignItems:'center',justifyContent:'center'},
 dot:{width:5,height:5,borderRadius:3,backgroundColor:'rgba(255,255,255,0.65)',borderWidth:0.5,borderColor:'rgba(20,25,40,0.4)'},
 activeDot:{width:10,backgroundColor:'#FFFFFF'},
 pause:{position:'absolute',right:6,bottom:6,width:24,height:24,borderRadius:12,backgroundColor:'rgba(20,25,40,0.5)',alignItems:'center',justifyContent:'center'},
});
