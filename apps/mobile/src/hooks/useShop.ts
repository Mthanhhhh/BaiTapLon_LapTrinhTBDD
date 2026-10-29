import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { apiClient } from '../api/client';
export function useShop() {
  const { user } = useContext(AuthContext);
  return useQuery({queryKey:['shop',user?.id],enabled:!!user,queryFn:async()=> (await apiClient.get('/api/v1/orders/shop/me')).data.data as {id:number;name:string;status:string}|null});
}
export function useOpenShop() {
  const cache=useQueryClient();
  return useMutation({mutationFn:async(name:string)=>(await apiClient.post('/api/v1/orders/shop/me',{name})).data.data,onSuccess:()=>cache.invalidateQueries({queryKey:['shop']})});
}
