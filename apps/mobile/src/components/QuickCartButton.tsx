import React, {useContext, useState} from 'react';
import {ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {AuthContext} from '../context/AuthContext';
import {useAddToCart} from '../hooks/useCart';
import {ProductResponse} from '../hooks/useProducts';
import {apiClient} from '../api/client';
import {COLORS} from '../theme';
import {Typography} from './ui/Typography';
import {formatVND} from '../utils/formatters';

export function QuickCartButton({productId, name}: {productId:number; name:string}) {
  const {user}=useContext(AuthContext);
  const navigation=useNavigation<any>();
  const add=useAddToCart();
  const [product,setProduct]=useState<ProductResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  const [open,setOpen]=useState(false);
  const busy=loading||add.isPending;
  const submit=async (variantId?:number)=>{
    setError('');
    try {await add.mutateAsync({productId,variantId,quantity:1});setOpen(false);setDone(true);}
    catch(e:any){setError(e?.message||'Không thể thêm sản phẩm. Thử lại nhé.');setOpen(true);}
  };
  const start=async ()=>{
    if(!user){navigation.navigate('Login');return;}
    setLoading(true);setError('');setDone(false);
    try {
      const {data}=await apiClient.get(`/api/v1/products/${productId}`);
      const p=data.data as ProductResponse;setProduct(p);
      if(p.stock<=0){setError('Sản phẩm đã hết hàng.');setOpen(true);}
      else if(p.variants.length>1){setOpen(true);}
      else await submit(p.variants[0]?.id);
    } catch(e:any){setError(e?.message||'Không tải được sản phẩm.');setOpen(true);}
    finally{setLoading(false);}
  };
  return <>
    <TouchableOpacity disabled={busy} onPress={e=>{e.stopPropagation?.();start();}} accessibilityRole="button" accessibilityLabel={done?`Đã thêm ${name} vào giỏ`:`Thêm nhanh ${name} vào giỏ`} style={[styles.button,busy&&{opacity:0.6}]}>
      {busy?<ActivityIndicator size="small" color={COLORS.surface}/>:<Ionicons name={done?'checkmark':'cart-outline'} size={19} color={COLORS.surface}/>}
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>{if(!add.isPending)setOpen(false);}}>
      <View style={styles.backdrop}><View style={styles.sheet}>
        <View style={styles.heading}><Typography weight="bold" style={{flex:1}}>Thêm vào giỏ hàng</Typography><TouchableOpacity disabled={add.isPending} accessibilityLabel="Đóng" onPress={()=>setOpen(false)} style={{padding:10}}><Ionicons name="close" size={22} color={COLORS.ink}/></TouchableOpacity></View>
        <Typography variant="sm">{name}</Typography>
        {!!error&&<Typography variant="sm" color="danger">{error}</Typography>}
        {product&&product.variants.length>1&&<><Typography variant="sm" color="muted">Chọn phân loại để thêm 1 sản phẩm</Typography><ScrollView style={{maxHeight:320}}>{product.variants.map(v=><TouchableOpacity key={v.id} disabled={add.isPending||v.stock<=0} accessibilityRole="button" onPress={()=>submit(v.id)} style={[styles.option,v.stock<=0&&{opacity:0.4}]}><Typography variant="sm" style={{flex:1}}>{v.name}{v.stock<=0?' · Hết hàng':''}</Typography><Typography variant="sm" weight="bold" color="deal">{formatVND(v.price)}</Typography></TouchableOpacity>)}</ScrollView></>}
      </View></View>
    </Modal>
  </>;
}
const styles=StyleSheet.create({
  button:{width:36,height:36,borderRadius:18,backgroundColor:COLORS.primaryDeep,borderWidth:1,borderColor:COLORS.primaryDeep,alignItems:'center',justifyContent:'center',flexShrink:0},
  backdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(25,30,45,0.35)'},
  sheet:{backgroundColor:COLORS.surface,padding:18,borderTopLeftRadius:20,borderTopRightRadius:20,gap:10,width:'100%',maxWidth:520,alignSelf:'center'},
  heading:{flexDirection:'row',alignItems:'center'},
  option:{flexDirection:'row',alignItems:'center',gap:8,padding:12,marginBottom:6,borderRadius:10,borderWidth:1,borderColor:COLORS.border},
});
