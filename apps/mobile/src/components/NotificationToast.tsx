import React,{useContext,useEffect,useRef,useState} from 'react';
import {View,TouchableOpacity} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {AuthContext} from '../context/AuthContext';
import {useNotifications,InboxItem} from '../hooks/useNotifications';
import {Typography} from './ui';
import {COLORS} from '../theme';
export function NotificationToast(){const {user}=useContext(AuthContext);const q=useNotifications();const cache=useQueryClient();const last=useRef<number|undefined>(undefined);const [item,setItem]=useState<InboxItem>();useEffect(()=>{last.current=undefined;setItem(undefined);},[user?.id]);useEffect(()=>{const next=q.data?.content[0];if(!next)return;if(last.current!==undefined&&next.id>last.current){setItem(next);cache.invalidateQueries({queryKey:['orders',user?.id]});}last.current=next.id;},[q.data,user?.id]);useEffect(()=>{if(!item)return;const t=setTimeout(()=>setItem(undefined),6000);return()=>clearTimeout(t);},[item]);return item?<View accessibilityLiveRegion="polite" style={{position:'absolute',left:16,right:16,top:12,padding:16,borderRadius:16,borderWidth:1,borderColor:COLORS.primaryDeep,backgroundColor:COLORS.surface,zIndex:100,gap:6}}><Typography weight="bold">{item.title}</Typography><Typography variant="sm">{item.body}</Typography><TouchableOpacity accessibilityRole="button" onPress={()=>setItem(undefined)}><Typography variant="xs" color="primaryDeep">Đóng thông báo</Typography></TouchableOpacity></View>:null;}

