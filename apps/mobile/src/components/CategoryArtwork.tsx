import React from 'react';
import {Image,View} from 'react-native';
import {CategoryResponse} from '../hooks/useProducts';
import {Ionicons} from '@expo/vector-icons';
import {SUBCATEGORY_ICONS} from '../data/subcategoryIcons';
const atlas=require('../../assets/categories/category-clay-atlas.png');
/** One bundled 5×5 atlas, identical crop geometry on web, Android and iOS. */
export function CategoryArtwork({category,size=48}:{category:CategoryResponse;size?:number}){
 if(category.parentId){const palette=['#5467B3','#248B85','#CD6582','#C17B22','#7765B8'];const color=palette[category.id%palette.length];return <View accessible={false} style={{width:size,height:size,alignItems:'center',justifyContent:'center',alignSelf:'center'}}><View style={{position:'absolute',bottom:1,width:size*.7,height:size*.14,borderRadius:size,backgroundColor:color+'22'}}/><View style={{width:size*.85,height:size*.85,alignItems:'center',justifyContent:'center',borderRadius:size*.3,backgroundColor:color+'14',borderBottomWidth:3,borderRightWidth:2,borderColor:color+'33',transform:[{rotate:'-5deg'}]}}><Ionicons name={(SUBCATEGORY_ICONS[category.id]??'shapes') as any} size={size*.58} color={color}/></View></View>;}
 const raw=Number(category.iconUrl?.replace('clay:',''));const index=Number.isInteger(raw)&&raw>=0&&raw<25?raw:6;
 const bounds=[[20,30,220,245],[248,50,261,225],[508,55,244,225],[770,35,235,250],[1050,38,195,250],[20,300,235,215],[270,310,235,202],[510,278,240,240],[775,280,220,240],[1000,320,250,200],[20,520,235,240],[280,535,220,230],[500,525,250,230],[775,530,230,230],[1050,520,190,240],[20,780,235,215],[260,785,250,205],[510,765,245,233],[775,785,245,210],[1040,765,205,235],[15,1020,265,205],[300,980,180,250],[510,1010,245,220],[770,1028,250,195],[1035,985,205,245]];
 const [x,y,w,h]=bounds[index];const scale=Math.min(size/w,size/h)*.94;
 return <View accessible={false} style={{width:size,height:size,alignItems:'center',justifyContent:'center',alignSelf:'center'}}><View style={{width:w*scale,height:h*scale,overflow:'hidden'}}><Image source={atlas} resizeMode="stretch" style={{position:'absolute',width:1254*scale,height:1254*scale,left:-x*scale,top:-y*scale}}/></View></View>;
}
