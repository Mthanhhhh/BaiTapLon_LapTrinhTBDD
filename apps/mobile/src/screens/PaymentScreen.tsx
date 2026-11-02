import React,{useContext} from 'react';
import {View,ScrollView,Image,StyleSheet} from 'react-native';
import {useNavigation,useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '../api/client';
import {AuthContext} from '../context/AuthContext';
import {MarketplaceHeader} from '../components/MarketplaceHeader';
import {Typography,Button} from '../components/ui';
import {COLORS} from '../theme';
import {formatVND} from '../utils/formatters';
export default function PaymentScreen(){
 const n=useNavigation<any>(),route=useRoute<any>(),{user}=useContext(AuthContext);const id=Number(route.params?.orderId);
 const order=useQuery({queryKey:['orders',user?.id,'payment',id],enabled:!!user&&id>0,queryFn:async()=>(await apiClient.get(`/api/v1/orders/${id}`)).data.data});
 return <View style={{flex:1}}><MarketplaceHeader back title="Thanh toán" cartVisible={false}/><ScrollView contentContainerStyle={s.content}><Image source={require('../../assets/illustrations/inbox-parcel.png')} style={s.art} resizeMode="contain"/><Typography variant="lg" weight="bold">Thanh toán an toàn qua ngân hàng</Typography>{order.data&&<Typography weight="bold">Đơn {order.data.orderNo??`#${id}`} · {formatVND(order.data.total)}</Typography>}<View style={s.panel}><Typography weight="bold">Visa · Thẻ nội địa</Typography><Typography variant="sm" color="inkSoft">Cửa hàng chưa kết nối cổng thanh toán. Không có khoản tiền nào bị trừ và đơn chưa được đánh dấu đã thanh toán.</Typography><Typography variant="sm" color="inkSoft">Sau khi kết nối, bạn sẽ xác thực trực tiếp trên trang của cổng thanh toán hoặc ngân hàng.</Typography></View><Button onPress={()=>n.navigate('Main',{screen:'Orders',params:{status:'PENDING_PAYMENT'}})}>Xem đơn chờ thanh toán</Button><Typography variant="xs" color="inkSoft">Bạn có thể hủy đơn chưa thanh toán và đặt lại bằng thanh toán khi nhận hàng (COD).</Typography></ScrollView></View>;
}
const s=StyleSheet.create({content:{padding:16,gap:16},art:{width:'100%',height:160},panel:{backgroundColor:COLORS.surface,borderRadius:16,borderWidth:1,borderColor:COLORS.border,padding:16,gap:10}});
