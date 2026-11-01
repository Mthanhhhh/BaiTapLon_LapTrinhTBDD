import React from 'react';
import {View,TouchableOpacity} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {apiClient} from '../api/client';
import {Typography,Button} from './ui';
import {RevenueChart,OrderStateChart,TopProducts} from './CommerceCharts';
import {formatVND} from '../utils/formatters';
import {COLORS} from '../theme';
export function SellerOverview({shopId}:{shopId:number}){
 const n=useNavigation<any>();const q=useQuery({queryKey:['commerce',shopId,'dashboard'],queryFn:async()=>(await apiClient.get('/api/v1/orders/operations/seller/summary?days=30')).data.data});const d=q.data;
 if(q.isPending)return <Typography>Đang tổng hợp hoạt động shop…</Typography>;if(q.isError)return <Button onPress={()=>q.refetch()}>Tải lại tổng quan</Button>;
 const actions=[['WAITING_CONFIRMATION','Chờ xác nhận','receipt-outline'],['WAITING_PICKUP','Chờ lấy hàng','cube-outline'],['SHIPPING','Đang giao','car-outline'],['RETURNED','Trả hàng','return-down-back-outline']] as const;
 return <View style={{gap:12}}><View style={{padding:16,borderRadius:14,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,gap:8}}><Typography variant="xs" color="inkSoft">Doanh thu đơn đã giao · 30 ngày</Typography><Typography variant="xxl" weight="bold" color="primaryDeep">{formatVND(d?.revenue??0)}</Typography><Typography variant="xs" color="inkSoft">Tiền shop được nhận: {formatVND(d?.sellerReceivable??0)} · Chưa phải khoản chuyển về ngân hàng</Typography><Button size="sm" variant="outline" onPress={()=>n.navigate('SellerAnalytics')}>Xem thuế, phí và đối soát</Button></View><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{actions.map(([status,label,icon])=><TouchableOpacity key={status} accessibilityRole="button" onPress={()=>n.navigate('ShopOrders',{status})} style={{width:'48%',padding:14,borderRadius:12,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,gap:7}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Ionicons name={icon} size={22} color={COLORS.primaryDeep}/><Typography variant="lg" weight="bold">{d?.statuses?.find((r:any)=>r.status===status)?.count??0}</Typography></View><Typography variant="sm">{label}</Typography></TouchableOpacity>)}</View><View style={{flexDirection:'row',gap:8}}><Button style={{flex:1}} variant="outline" onPress={()=>n.navigate('Inbox')}>Tin nhắn khách</Button><Button style={{flex:1}} onPress={()=>n.navigate('PromotionManage')}>Voucher & sale</Button></View><RevenueChart daily={d?.daily} days={30}/><OrderStateChart data={d??{}}/><TopProducts products={d?.topProducts} limit={4}/></View>;
}
