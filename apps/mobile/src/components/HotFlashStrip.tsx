import React from 'react';
import {View,ScrollView,TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {usePromotionCatalog,useCountdown} from '../hooks/usePromotions';
import {Typography,RemoteImage} from './ui';
import {formatVND} from '../utils/formatters';
import {COLORS} from '../theme';
// Keep the one-second clock out of the product strip's render tree.
function FlashClock({until,active}:{until?:string;active:boolean}){
 const countdown=useCountdown(until);
 return <Typography variant="sm" weight="bold" color="deal">Flash sale {active?countdown.text:''}</Typography>;
}
export function HotFlashStrip(){
 const n=useNavigation<any>(),query=usePromotionCatalog();const campaigns=query.data?.campaigns.filter(c=>c.kind==='FLASH'&&c.phase==='LIVE')??[];
 const items=campaigns.flatMap(c=>c.items??[]).filter(i=>i.remaining>0&&i.thumbnail_url).sort((a,b)=>b.quota_used-a.quota_used).slice(0,12);
 return <View style={{backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,borderRadius:14,padding:10,gap:7}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Ionicons name="flash" size={16} color={COLORS.deal}/><FlashClock until={campaigns[0]?.endsAt} active={items.length>0}/></View><TouchableOpacity accessibilityRole="button" onPress={()=>n.navigate('Promotions')}><Typography variant="xs" color="primaryDeep">Xem tất cả ›</Typography></TouchableOpacity></View>{items.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>{items.map(i=><TouchableOpacity key={i.id} accessibilityRole="button" accessibilityLabel={`Flash sale ${i.name}`} onPress={()=>n.navigate('ProductDetail',{productId:i.product_id,variantId:i.sku_id})} style={{width:92,gap:3}}><RemoteImage targetWidth={320} sourceUrl={i.thumbnail_url} name={i.name} style={{height:65,width:92,borderRadius:8}} resizeMode="contain"/><Typography variant="xs" numberOfLines={1}>{i.name}</Typography><Typography variant="sm" weight="bold" color="deal">{formatVND(i.sale_price)}</Typography><Typography variant="xs" color="inkSoft">Còn {i.remaining} suất</Typography></TouchableOpacity>)}</ScrollView>:<Typography variant="xs" color="inkSoft">Chưa có phiên đang mở. Xem lịch ưu đãi tiếp theo.</Typography>}</View>;
}
