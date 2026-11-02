import {useContext} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {AuthContext} from '../context/AuthContext';
import {apiClient} from '../api/client';
import {createBatchLoader} from '../utils/batchLoader';

type Offer={productId:number;skuId:number;shopPrice:number;afterVoucher:number;basePrice:number;applied:any[];note:string};
const loadOffer=createBatchLoader<Offer>(
  async productIds=>(await apiClient.post('/api/v1/promotions/prices',{productIds})).data.data,
  row=>row.productId,
);
export function useProductOffer(id:number){
 const {user}=useContext(AuthContext);
 const focused=useIsFocused();
 return useQuery({
  queryKey:['productOffers',user?.id,id],enabled:id>0&&focused,staleTime:30000,retry:1,
  queryFn:()=>loadOffer(id,String(user?.id??'guest')),
 });
}
