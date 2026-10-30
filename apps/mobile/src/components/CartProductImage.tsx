import React from 'react';
import {ImageStyle,StyleProp} from 'react-native';
import {CartItemResponse} from '../hooks/useCart';
import {useProductDetail} from '../hooks/useProducts';
import {RemoteImage} from './ui';
export function CartProductImage({item,style}:{item:CartItemResponse;style:StyleProp<ImageStyle>}){
 const {data:product}=useProductDetail(item.productId);
 const key=item.variantName?.split(' / ')[0]?.trim();
 const url=(key?product?.variantImages?.[key]?.[0]:undefined)??product?.variantImages?.[item.variantName??'']?.[0]??item.productImage;
 return <RemoteImage sourceUrl={url} name={item.productName} style={style}/>;
}
