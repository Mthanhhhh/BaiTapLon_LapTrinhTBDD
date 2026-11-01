import {useContext} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AuthContext} from '../context/AuthContext';
import {apiClient} from '../api/client';
type Offer={productId:number;skuId:number;shopPrice:number;afterVoucher:number;basePrice:number;applied:any[];note:string};
const groups=new Map<string,Map<number,{resolve:(offer:Offer|undefined)=>void;reject:(e:any)=>void}[]>>();
function offer(id:number,account:string):Promise<Offer|undefined>{return new Promise((resolve,reject)=>{let group=groups.get(account);if(!group){group=new Map();groups.set(account,group);setTimeout(async()=>{const pending=groups.get(account)!;groups.delete(account);const ids=[...pending.keys()];try{for(let offset=0;offset<ids.length;offset+=60){const batch=ids.slice(offset,offset+60);const rows:Offer[]=(await apiClient.post('/api/v1/promotions/prices',{productIds:batch})).data.data;for(const product of batch)for(const waiter of pending.get(product)??[])waiter.resolve(rows.find(row=>row.productId===product));}}catch(e){for(const waiters of pending.values())for(const w of waiters)w.reject(e);}},80);}const waiters=group.get(id)??[];waiters.push({resolve,reject});group.set(id,waiters);});}
export function useProductOffer(id:number){const {user}=useContext(AuthContext);return useQuery({queryKey:['productOffers',user?.id,id],enabled:id>0,staleTime:30000,retry:1,queryFn:()=>offer(id,String(user?.id??'guest'))});}
