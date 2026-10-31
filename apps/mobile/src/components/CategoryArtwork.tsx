import React from 'react';
import {Image,View} from 'react-native';
import {CategoryResponse} from '../hooks/useProducts';
const atlas=require('../../assets/categories/category-clay-atlas.png');
/** One bundled 5×5 atlas, identical crop geometry on web, Android and iOS. */
export function CategoryArtwork({category,size=48}:{category:CategoryResponse;size?:number}){
 const raw=Number(category.iconUrl?.replace('clay:',''));const index=Number.isInteger(raw)&&raw>=0&&raw<25?raw:6;
 const cell=size/0.84,inset=cell*0.08;
 return <View accessible={false} style={{width:size,height:size,overflow:'hidden',alignSelf:'center'}}><Image source={atlas} resizeMode="stretch" style={{position:'absolute',width:cell*5,height:cell*5,left:-(index%5)*cell-inset,top:-Math.floor(index/5)*cell-inset}}/></View>;
}
