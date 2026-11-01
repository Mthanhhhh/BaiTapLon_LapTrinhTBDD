import React,{useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {PurchaseSelector} from './PurchaseSelector';
import {COLORS} from '../theme';
export function QuickCartButton({productId,name}:{productId:number;name:string}){const [open,setOpen]=useState(false);return <><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Thêm ${name} vào giỏ`} onPress={e=>{e.stopPropagation?.();setOpen(true);}} style={{width:36,height:36,borderRadius:18,backgroundColor:COLORS.primaryDeep,alignItems:'center',justifyContent:'center'}}><Ionicons name="cart-outline" size={19} color={COLORS.surface}/></TouchableOpacity><PurchaseSelector key={open?'open':'closed'} productId={productId} mode={open?'cart':null} onClose={()=>setOpen(false)}/></>;}
