import {LinearGradient} from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
const BANNERS = [
 {title:'Mua vui mỗi ngày',image:require('../../assets/banners/eshop-original-01.png'),colors:['#184AE2','#6C8EFF'] as const,ink:'#FFFFFF',accent:'#FFEF65'},
 {title:'Flash sale đang mở',image:require('../../assets/banners/eshop-original-02.png'),colors:['#E4284D','#FF7890'] as const,ink:'#FFFFFF',accent:'#FFF2A1'},
 {title:'Công nghệ bên bạn',image:require('../../assets/banners/eshop-original-03.png'),colors:['#6E27C5','#BA8BFF'] as const,ink:'#FFFFFF',accent:'#FFF0A0'},
 {title:'Chăm mình một chút',image:require('../../assets/banners/eshop-original-04.png'),colors:['#FFDC46','#FFF09F'] as const,ink:'#332943',accent:'#442347'},
 {title:'Mặc đẹp mỗi ngày',image:require('../../assets/banners/eshop-original-05.png'),colors:['#007B83','#58CBBE'] as const,ink:'#FFFFFF',accent:'#F8F29A'},
 {title:'Góc nhà yêu thương',image:require('../../assets/banners/eshop-original-06.png'),colors:['#ED5424','#FFB37C'] as const,ink:'#FFFFFF',accent:'#FFF8B6'},
 {title:'Niềm vui bé xinh',image:require('../../assets/banners/eshop-original-07.png'),colors:['#B52279','#F39BCF'] as const,ink:'#FFFFFF',accent:'#FFEB94'},
 {title:'Sẵn sàng vận động',image:require('../../assets/banners/eshop-original-08.png'),colors:['#1055AA','#64B2EB'] as const,ink:'#FFFFFF',accent:'#BDFBE5'},
 {title:'Bếp ấm, nhà vui',image:require('../../assets/banners/eshop-original-09.png'),colors:['#E6B920','#FFE785'] as const,ink:'#332943',accent:'#3F3150'},
 {title:'Góc làm việc mới',image:require('../../assets/banners/eshop-original-10.png'),colors:['#4D33A8','#A99BED'] as const,ink:'#FFFFFF',accent:'#FFED9B'},
] as const;
export function PromoCarousel(){
 const navigation=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 const focused=useIsFocused();const list=useRef<FlatList>(null);
 const [width,setWidth]=useState(0),[index,setIndex]=useState(0),[paused,setPaused]=useState(false),[dragging,setDragging]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active');
 const activeIndex=useRef(0);
 useEffect(()=>{const s=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>s.remove();},[]);
 const move=useCallback((n:number)=>{const next=(n+BANNERS.length)%BANNERS.length;activeIndex.current=next;setIndex(next);list.current?.scrollToOffset({offset:next*width,animated:true});},[width]);
 useEffect(()=>{if(width)list.current?.scrollToOffset({offset:activeIndex.current*width,animated:false});},[width]);
 useEffect(()=>{if(!width||!focused||paused||dragging||!foreground)return;const t=setTimeout(()=>move(index+1),1800);return()=>clearTimeout(t);},[width,focused,paused,dragging,index,foreground,move]);
 return <View accessibilityLabel="Banner mua sắm" onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={styles.frame}>
  {!!width&&<FlatList ref={list} data={BANNERS} horizontal pagingEnabled showsHorizontalScrollIndicator={false} initialNumToRender={2} windowSize={3} keyExtractor={x=>x.title} getItemLayout={(_,n)=>({length:width,offset:n*width,index:n})} onScrollBeginDrag={()=>setDragging(true)} onScrollEndDrag={()=>setDragging(false)} onMomentumScrollEnd={e=>{const next=Math.max(0,Math.min(BANNERS.length-1,Math.round(e.nativeEvent.contentOffset.x/width)));activeIndex.current=next;setIndex(next);}} renderItem={({item})=><TouchableOpacity accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>navigation.navigate('Main',{screen:'Search'})} activeOpacity={0.95} style={{width,height:width/4}}><View style={{position:'absolute',inset:0,backgroundColor:item.colors[0]}}/><Image source={item.image} accessibilityLabel={item.title} style={{position:'absolute',right:0,width:'58%',height:'100%'}} resizeMode="cover"/><LinearGradient colors={[item.colors[0],item.colors[0]+'E8',item.colors[1]+'00']} locations={[0,0.45,1]} start={{x:0,y:0}} end={{x:1,y:0}} style={{position:'absolute',inset:0}}/><View style={{position:'absolute',left:32,top:8,width:'59%'}}><Text style={{fontSize:11,letterSpacing:.7,fontWeight:'800',color:item.ink}}>E-SHOP / SẮM THEO GU</Text><Text style={{fontSize:width<350?17:19,lineHeight:23,fontFamily:'PlusJakartaSans-Bold',fontStyle:'italic',color:item.ink}} numberOfLines={1}>{item.title}</Text><Text style={{alignSelf:'flex-start',fontSize:11,fontWeight:'800',color:item.colors[0],backgroundColor:item.accent,paddingHorizontal:7,paddingVertical:2,borderRadius:3,marginTop:3}} numberOfLines={1}>KHÁM PHÁ NGAY ↗</Text></View></TouchableOpacity>}/>}
  {!!width&&<>
   <TouchableOpacity style={[styles.arrow,{left:6}]} accessibilityLabel="Banner trước" accessibilityRole="button" onPress={()=>move(index-1)}><Ionicons name="chevron-back" size={20} color="#FFFFFF"/></TouchableOpacity>
   <TouchableOpacity style={[styles.arrow,{right:6}]} accessibilityLabel="Banner tiếp theo" accessibilityRole="button" onPress={()=>move(index+1)}><Ionicons name="chevron-forward" size={20} color="#FFFFFF"/></TouchableOpacity>
   <View style={styles.dots}>{BANNERS.map((b,n)=><TouchableOpacity key={b.title} accessibilityRole="button" accessibilityLabel={`Xem banner ${n+1}`} aria-selected={index===n} onPress={()=>move(n)} style={styles.dotTarget}><View style={[styles.dot,index===n&&styles.activeDot]}/></TouchableOpacity>)}</View>
   <TouchableOpacity style={styles.pause} accessibilityRole="button" accessibilityLabel={paused?'Chạy banner':'Tạm dừng banner'} onPress={()=>setPaused(!paused)}><Ionicons name={paused?'play':'pause'} size={14} color="#FFFFFF"/></TouchableOpacity>
  </>}
 </View>;
}
const styles=StyleSheet.create({
 frame:{borderRadius:14,overflow:'hidden',position:'relative',aspectRatio:4,backgroundColor:'#EDF1F5'},
 image:{width:'100%',height:'100%'},
 arrow:{position:'absolute',top:'50%',marginTop:-14,width:28,height:28,borderRadius:14,backgroundColor:'rgba(20,25,40,0.40)',alignItems:'center',justifyContent:'center'},
 dots:{position:'absolute',bottom:2,left:0,right:0,flexDirection:'row',alignItems:'center',justifyContent:'center',pointerEvents:'box-none'},
 dotTarget:{width:14,height:20,alignItems:'center',justifyContent:'center'},
 dot:{width:5,height:5,borderRadius:3,backgroundColor:'rgba(255,255,255,0.65)',borderWidth:0.5,borderColor:'rgba(20,25,40,0.4)'},
 activeDot:{width:10,backgroundColor:'#FFFFFF'},
 pause:{position:'absolute',right:6,bottom:6,width:24,height:24,borderRadius:12,backgroundColor:'rgba(20,25,40,0.5)',alignItems:'center',justifyContent:'center'},
});
