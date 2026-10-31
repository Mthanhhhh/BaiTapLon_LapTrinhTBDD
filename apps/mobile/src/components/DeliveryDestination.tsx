import React,{useContext,useState} from 'react';
import {Modal,ScrollView,TouchableOpacity,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Ionicons} from '@expo/vector-icons';
import {AuthContext} from '../context/AuthContext';
import {useAddresses} from '../hooks/useCart';
import {resolveProvince,VIETNAM_PROVINCES} from '../utils/vietnamShipping';
import {COLORS} from '../theme';
import {Typography} from './ui/Typography';

export function useDeliveryDestination(){
 const {user}=useContext(AuthContext);
 const addresses=useAddresses();
 const storageKey=`delivery-province:${user?.id??'guest'}`;
 const queryKey=['deliveryProvince',user?.id??'guest'];
 const selected=useQuery({queryKey,queryFn:()=>AsyncStorage.getItem(storageKey),staleTime:Infinity});
 const primary=addresses.data?.find(a=>a.isDefault)??addresses.data?.[0];
 return {province:resolveProvince(selected.data)?.name??resolveProvince(primary?.city)?.name,storageKey,queryKey};
}
export function DeliveryDestination(){
 const {province,storageKey,queryKey}=useDeliveryDestination();
 const cache=useQueryClient();
 const [open,setOpen]=useState(false);
 const [error,setError]=useState('');
 const select=async(name:string)=>{
   try{await AsyncStorage.setItem(storageKey,name);cache.setQueryData(queryKey,name);setOpen(false);setError('');}
   catch{setError('Chưa lưu được nơi nhận. Vui lòng thử lại.');}
 };
 return <>
  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chọn tỉnh nhận hàng để tính thời gian giao dự kiến" onPress={()=>setOpen(true)} style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:4}}>
   <Ionicons name="location-outline" size={14} color={COLORS.primaryDeep}/><Typography variant="xs" color="inkSoft" numberOfLines={1} style={{flex:1}}>Giao đến: {province||'Chọn tỉnh/thành nhận hàng'}</Typography><Ionicons name="chevron-down" size={13} color={COLORS.primaryDeep}/>
  </TouchableOpacity>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={{flex:1,backgroundColor:'rgba(25,30,45,0.35)',justifyContent:'flex-end'}}><View style={{maxHeight:'80%',backgroundColor:COLORS.surface,padding:18,borderTopLeftRadius:20,borderTopRightRadius:20,width:'100%',maxWidth:520,alignSelf:'center',gap:10}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Typography weight="bold">Nơi nhận hàng</Typography><TouchableOpacity accessibilityLabel="Đóng" onPress={()=>setOpen(false)} style={{padding:10}}><Ionicons name="close" size={22} color={COLORS.ink}/></TouchableOpacity></View>
    <Typography variant="sm" color="muted">Ước tính theo tỉnh gửi và tỉnh nhận. Lịch thực tế tùy hãng vận chuyển, địa chỉ và thời điểm lấy hàng. Lựa chọn này không thay đổi địa chỉ đặt hàng.</Typography>
    {!!error&&<Typography color="danger">{error}</Typography>}
    <ScrollView>{VIETNAM_PROVINCES.map(p=><TouchableOpacity key={p.name} accessibilityRole="button" onPress={()=>select(p.name)} style={{paddingVertical:12,borderBottomWidth:1,borderColor:COLORS.border,flexDirection:'row',justifyContent:'space-between'}}><Typography variant="sm" weight={province===p.name?'bold':'regular'}>{p.name}</Typography>{province===p.name&&<Ionicons name="checkmark" size={20} color={COLORS.primaryDeep}/>}</TouchableOpacity>)}</ScrollView>
   </View></View>
  </Modal>
 </>;
}
