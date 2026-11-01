import React,{useContext,useEffect} from 'react';
import {AppState} from 'react-native';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {AuthContext} from '../context/AuthContext';
import {apiClient,API_BASE_URL} from '../api/client';
export function ChatLive({children}:{children:React.ReactNode}){
 const {user}=useContext(AuthContext),cache=useQueryClient();
 useEffect(()=>{if(!user)return;let closed=false,generation=0,ws:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined;
  const stop=()=>{generation++;clearTimeout(retry);const old=ws;ws=undefined;old?.close();};
  const connect=async()=>{if(closed||AppState.currentState!=='active')return;const version=++generation;try{const r=await apiClient.post('/api/v1/orders/chat/ticket');if(closed||version!==generation)return;const current=new WebSocket(API_BASE_URL.replace(/^http/,'ws')+'/ws/chat?ticket='+encodeURIComponent(r.data.data.ticket));ws=current;current.onmessage=()=>{if(ws!==current)return;void cache.invalidateQueries({queryKey:['chat']});void cache.invalidateQueries({queryKey:['notifications']});};current.onclose=()=>{if(ws!==current)return;ws=undefined;if(!closed&&AppState.currentState==='active')retry=setTimeout(connect,2500);};current.onerror=()=>current.close();}catch{if(!closed&&version===generation&&AppState.currentState==='active')retry=setTimeout(connect,5000);}};
  void connect();const sub=AppState.addEventListener('change',state=>{stop();if(state==='active')void connect();});return()=>{closed=true;sub.remove();stop();};
 },[user?.id,cache]);return <>{children}</>;
}
export function useChatInbox(){const {user}=useContext(AuthContext);return useQuery<any[]>({queryKey:['chat','inbox',user?.id],enabled:!!user,refetchInterval:15000,queryFn:async()=>(await apiClient.get('/api/v1/orders/chat')).data.data});}
