import React,{useRef,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,Switch,StyleSheet} from 'react-native';
import regions from '../data/vietnam-regions-v2.json';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../api/client';
import {AddressResponse} from '../hooks/useCart';
import AddressPinMap from './AddressPinMap';
import {Pin} from './addressMapHtml';
import {COLORS} from '../theme';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
export default function DeliveryAddressForm({onSaved,firstAddress,initial}:{onSaved:()=>void;firstAddress:boolean;initial?:AddressResponse}){
 const [fullName,setFullName]=useState(initial?.fullName??''),[phone,setPhone]=useState(initial?.phone??''),[street,setStreet]=useState(initial?.street??''),[city,setCity]=useState(regions.find(p=>normalize(p.name).includes(normalize(initial?.city??'---')))?.name??''),[ward,setWard]=useState(initial?.state??'');
 const [selector,setSelector]=useState<'city'|'ward'|null>(null),[search,setSearch]=useState(''),[isDefault,setDefault]=useState(initial?.isDefault??firstAddress),[position,setPosition]=useState<Pin|undefined>(initial?.latitude!=null&&initial.longitude!=null?{latitude:initial.latitude,longitude:initial.longitude}:undefined),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [results,setResults]=useState<any[]>([]);const request=useRef(0);const cache=useQueryClient();const save=useMutation({mutationFn:async(payload:any)=>(await (initial?apiClient.put(`/api/v1/addresses/${initial.id}`,payload):apiClient.post('/api/v1/addresses',payload))).data.data,onSuccess:()=>cache.invalidateQueries({queryKey:['addresses']})});
 const province=regions.find(p=>p.name===city),choices=selector==='city'?regions:province?.wards??[];
 const changeAddress=(set:(s:string)=>void,value:string)=>{request.current++;setBusy(false);set(value);setPosition(undefined);setResults([]);setMessage('');};
 const locate=async(point?:Pin)=>{
  if(!point&&(!street.trim()||!city||!ward)){setMessage('Chọn tỉnh, phường/xã và nhập số nhà, tên đường trước.');return;}
  const seq=++request.current;setBusy(true);setResults([]);if(point)setPosition(point);
  try{const query=encodeURIComponent(`${street}, ${ward}, ${city}, Việt Nam`);
   const response=await fetch(point?`https://photon.komoot.io/reverse?lat=${point.latitude}&lon=${point.longitude}&limit=1`:`https://photon.komoot.io/api/?q=${query}&limit=5&bbox=102,8,115,24`,{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error();const data=await response.json();if(seq!==request.current)return;
   const features=(data.features??[]).filter((f:any)=>f.properties?.countrycode?.toUpperCase()==='VN');
   if(point){const p=features[0]?.properties;setMessage(p?`Vị trí ghim: ${[p.housenumber,p.street,p.name,p.city,p.state].filter(Boolean).join(', ')}. Kiểm tra phường/xã đã chọn.`:'Đã ghim tọa độ. Chưa tìm được tên đường tại vị trí này.');}
   else if(features.length){setResults(features);setMessage('Chọn vị trí phù hợp bên dưới, rồi kéo ghim để chỉnh chính xác.');}
   else setMessage('Chưa tìm thấy địa chỉ. Chạm bản đồ và kéo ghim tới vị trí nhận hàng.');
  }catch{if(seq===request.current)setMessage('Chưa kết nối được dịch vụ tìm địa chỉ. Bạn vẫn có thể kéo ghim và lưu địa chỉ.');}
  finally{if(seq===request.current)setBusy(false);}
 };
 const submit=()=>{if(!fullName.trim()||!phone.trim()||!street.trim()||!city||!ward){setMessage('Vui lòng điền đủ người nhận, điện thoại và địa chỉ.');return;}if(!/^(?:\+84|0)\d{9,10}$/.test(phone.replace(/\s/g,''))){setMessage('Kiểm tra số điện thoại Việt Nam.');return;}save.mutate({fullName:fullName.trim(),phone:phone.trim(),street:street.trim(),city,state:ward,country:'Việt Nam',isDefault,...position},{onSuccess:onSaved,onError:(e:any)=>setMessage(e.response?.data?.message??'Chưa lưu được địa chỉ. Thử lại nhé.')});};
 return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:10,paddingBottom:20}}>
  <Text style={styles.label}>Tên người nhận</Text><TextInput accessibilityLabel="Tên người nhận" style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Họ và tên"/>
  <Text style={styles.label}>Số điện thoại</Text><TextInput accessibilityLabel="Số điện thoại nhận hàng" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Số điện thoại nhận hàng"/>
  <Text style={styles.label}>Số nhà, tên đường</Text><TextInput accessibilityLabel="Số nhà, tên đường" style={styles.input} value={street} onChangeText={v=>changeAddress(setStreet,v)} placeholder="Ví dụ: 12 Nguyễn Huệ"/>
  <Text style={styles.label}>Tỉnh / thành phố</Text><TouchableOpacity accessibilityRole="button" style={styles.input} onPress={()=>{setSelector(selector==='city'?null:'city');setSearch('');}}><Text>{city||'Chọn tỉnh / thành phố'} ▾</Text></TouchableOpacity>
  <Text style={styles.label}>Phường / xã / đặc khu</Text><TouchableOpacity accessibilityRole="button" disabled={!city} style={[styles.input,!city&&{opacity:0.5}]} onPress={()=>{setSelector(selector==='ward'?null:'ward');setSearch('');}}><Text>{ward||'Chọn phường / xã'} ▾</Text></TouchableOpacity>
  {selector&&<View style={styles.select}><TextInput accessibilityLabel="Tìm trong danh sách địa chỉ" style={styles.input} placeholder="Tìm theo tên…" value={search} onChangeText={setSearch}/><ScrollView nestedScrollEnabled style={{maxHeight:220}} keyboardShouldPersistTaps="handled">{choices.filter(p=>normalize(p.name).includes(normalize(search))).map(p=><TouchableOpacity key={p.code} style={styles.choice} onPress={()=>{changeAddress(selector==='city'?setCity:setWard,p.name);if(selector==='city')setWard('');setSelector(null);}}><Text>{p.name}</Text></TouchableOpacity>)}</ScrollView></View>}
  <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.outline} onPress={()=>locate()}><Text style={styles.label}>{busy?'Đang tìm vị trí…':'⌖ Tìm địa chỉ trên bản đồ'}</Text></TouchableOpacity>
  {results.map((f,i)=><TouchableOpacity key={i} style={styles.choice} onPress={()=>{setPosition({latitude:f.geometry.coordinates[1],longitude:f.geometry.coordinates[0]});setResults([]);setMessage('Đã chọn vị trí. Kéo ghim nếu cần chỉnh lại.');}}><Text>{[f.properties.housenumber,f.properties.street,f.properties.name,f.properties.city,f.properties.state].filter(Boolean).join(', ')}</Text></TouchableOpacity>)}
  <AddressPinMap position={position} onPick={p=>{void locate(p);}}/>
  <Text style={styles.hint}>{position?`${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`:'Chạm bản đồ hoặc kéo ghim để chọn vị trí.'}</Text>
  {!!message&&<Text accessibilityRole="alert" style={styles.hint}>{message}</Text>}
  <View style={styles.row}><Text style={styles.label}>Đặt làm địa chỉ mặc định</Text><Switch value={isDefault} disabled={firstAddress} onValueChange={setDefault} trackColor={{true:COLORS.primary}}/></View>
  <TouchableOpacity accessibilityRole="button" style={styles.submit} disabled={save.isPending} onPress={submit}><Text style={{color:'#fff',fontWeight:'700'}}>{save.isPending?'Đang lưu…':'Lưu địa chỉ'}</Text></TouchableOpacity>
 </ScrollView>;
}
const styles=StyleSheet.create({label:{fontWeight:'600',color:COLORS.ink,fontSize:14},input:{borderWidth:1,borderColor:'#DADDEC',borderRadius:10,padding:12,minHeight:46,color:COLORS.ink,backgroundColor:'#fff'},select:{borderWidth:1,borderColor:'#DADDEC',padding:8,borderRadius:10},choice:{padding:13,borderBottomWidth:1,borderBottomColor:'#EEEFF5',minHeight:46},outline:{borderWidth:1,borderColor:COLORS.primary,borderRadius:10,padding:13,alignItems:'center'},hint:{fontSize:13,color:COLORS.inkSoft,lineHeight:19},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:8},submit:{backgroundColor:COLORS.primary,borderRadius:12,padding:15,alignItems:'center'}});
