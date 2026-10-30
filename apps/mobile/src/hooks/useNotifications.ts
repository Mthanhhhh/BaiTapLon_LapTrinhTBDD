import { AppState } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { apiClient } from '../api/client';
export type InboxItem={id:number;type:string;title:string;body:string;orderId?:number;isRead:boolean;createdAt:string};
export function useNotifications(page=0){const {user}=useContext(AuthContext);const [active,setActive]=useState(AppState.currentState==='active');useEffect(()=>{const sub=AppState.addEventListener('change',s=>setActive(s==='active'));return()=>sub.remove();},[]);return useQuery({queryKey:['notifications',user?.id,page],enabled:!!user&&active,refetchInterval:2000,refetchIntervalInBackground:false,queryFn:async()=>(await apiClient.get('/api/v1/auth/notifications',{params:{page}})).data.data as {content:InboxItem[];unread:number;last:boolean}});}
export function useReadNotification(){const cache=useQueryClient();return useMutation({mutationFn:async(id?:number)=>apiClient.post(id?`/api/v1/auth/notifications/${id}/read`:'/api/v1/auth/notifications/read-all'),onSuccess:()=>cache.invalidateQueries({queryKey:['notifications']})});}
