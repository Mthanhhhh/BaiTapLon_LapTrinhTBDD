import React,{createContext,useContext,useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiClient,API_BASE_URL} from '../api/client';
import {AuthContext} from '../context/AuthContext';
export type FlashItem={id:number;product_id:number;sku_id:number;sale_price:number;quota_total:number;quota_reserved:number;quota_used:number;remaining:number;userRemaining:number;per_user_limit:number;name:string;variant_name:string;thumbnail_url?:string};
export type Campaign={id:number;name:string;kind:'FLASH'|'VOUCHER';layer:'FLASH'|'SHOP'|'PLATFORM'|'SHIPPING';code?:string;shop_id?:number;discount_type:'FIXED'|'PERCENT';value:number;max_discount?:number;min_order:number;budget_total:number;budget_spent:number;budget_reserved:number;budgetRemaining:number;quota_total:number;quota_used:number;quota_reserved:number;remaining:number;per_user_limit:number;stackable:boolean;status:string;phase:string;startsAt:string;endsAt:string;saved:boolean;reminder:boolean;userUsed:number;items?:FlashItem[];metrics?:{ordersPlaced:number;deliveredOrders:number;deliveredOrderRevenue:number;activeDiscounts:number}};
export type QuoteLine={cartItemId:number;productId:number;skuId:number;shopId:number;quantity:number;basePrice:number;unitPrice:number;flashItemId?:number;name:string;variantName:string};
export type PricingQuote={vatIncluded?:number;vatPercent?:number;quoteHash:string;originalSubtotal:number;subtotal:number;flashSavings:number;discount:number;shippingOriginal:number;shippingDiscount:number;fees:number;tax:number;total:number;lines:QuoteLine[];applied:{id:number;code:string;name:string;layer:string;amount:number}[];vouchers:(Campaign&{eligible:boolean;reason:string})[];serverTime:string;reservationState?:string;expiresAt?:string};
const Live=createContext({connected:false,offset:0});
export const usePromotionLive=()=>useContext(Live);
export function PromotionLiveProvider({children}:{children:React.ReactNode}){
 const cache=useQueryClient();const [connected,setConnected]=useState(false),[offset,setOffset]=useState(0);
 useEffect(()=>{let socket:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,ping:ReturnType<typeof setInterval>|undefined,refreshTimer:ReturnType<typeof setTimeout>|undefined,closed=false,hasConnected=false,attempt=0;
  const refreshNow=()=>{for(const key of ['promotions','promotionQuote','orderPricing','cart','products','recommendations','product','notifications','orders','sellerProducts','shopProducts','commerce','admin','productOffers','skuQuote','cartPricing'])void cache.invalidateQueries({queryKey:[key]});};
  // A checkout may emit several events; refetch each active query once per burst.
  const refresh=()=>{if(!refreshTimer)refreshTimer=setTimeout(()=>{refreshTimer=undefined;refreshNow();},400);};
  const stop=()=>{clearTimeout(refreshTimer);refreshTimer=undefined;clearTimeout(retry);clearInterval(ping);const old=socket;socket=undefined;old?.close();setConnected(false);};
  const connect=()=>{if(closed||AppState.currentState!=='active')return;clearTimeout(retry);const origin=API_BASE_URL.replace(/^http/,'ws');const current=new WebSocket(origin+'/ws/promotions');socket=current;
   current.onopen=()=>{if(socket!==current)return;setConnected(true);attempt=0;if(hasConnected)refresh();hasConnected=true;ping=setInterval(()=>{if(current.readyState===1)current.send('ping');},20000);};
   current.onmessage=event=>{if(socket!==current)return;try{const message=JSON.parse(event.data);if(message.serverTime)setOffset(previous=>{const next=new Date(message.serverTime).getTime()-Date.now();return Number.isFinite(next)&&Math.abs(next-previous)>1000?next:previous;});if(message.type==='PROMOTIONS_CHANGED')refresh();}catch{}};
   current.onclose=()=>{if(socket!==current)return;socket=undefined;setConnected(false);clearInterval(ping);if(!closed&&AppState.currentState==='active')retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempt++,5)));};current.onerror=()=>current.close();};
  const sub=AppState.addEventListener('change',state=>{stop();if(state==='active')connect();});connect();return()=>{closed=true;sub.remove();stop();};
 },[cache]);
 return <Live.Provider value={{connected,offset}}>{children}</Live.Provider>;
}
export function useCountdown(date?:string){const {offset}=usePromotionLive();const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);const seconds=date?Math.max(0,Math.ceil((new Date(date).getTime()-now-offset)/1000)):0;return {seconds,text:`${Math.floor(seconds/3600).toString().padStart(2,'0')}:${Math.floor(seconds%3600/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`,now:now+offset};}
export function usePromotionCatalog(){const {user}=useContext(AuthContext);return useQuery({queryKey:['promotions','catalog',user?.id],queryFn:async()=>(await apiClient.get('/api/v1/promotions/catalog')).data.data as {campaigns:Campaign[];serverTime:string}});}
export function useVoucherWallet(){const {user}=useContext(AuthContext);return useQuery({queryKey:['promotions','wallet',user?.id],enabled:!!user,queryFn:async()=>(await apiClient.get('/api/v1/promotions/wallet')).data.data as Campaign[]});}
export function useOrderPricing(id:number,enabled=true){const {user}=useContext(AuthContext);return useQuery<PricingQuote>({queryKey:['orderPricing',user?.id,id],enabled:!!user&&!!id&&enabled,retry:false,queryFn:async()=>(await apiClient.get(`/api/v1/promotions/orders/${id}/pricing`)).data.data});}
