const request=async(path,method='GET',body,token,expected=200)=>{const r=await fetch('http://localhost:8080/api/v1/'+path,{method,signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(r.status!==expected)throw Error(path+' '+r.status+' '+JSON.stringify(j));return j.data;};
const password=process.env.PRACTICE_PASSWORD;
if(!password)throw Error('Set PRACTICE_PASSWORD for the two local practice accounts. This test creates orders.');
const b=(await request('auth/login','POST',{email:'buyer.practice.20261029@example.com',password})).accessToken;
const s=(await request('auth/login','POST',{email:'shop.practice.20261029@example.com',password})).accessToken;
const detail=await request('products/shops/3');
const cat=await request('products/shops/3/collections','PUT',[{name:'Bộ sưu tập thực hành',productIds:[21]}],s);
await request('products/shops/3/collections','PUT',[],b,403);
const filtered=await request('products/shops/3/products?collectionId='+cat[0].id+'&minPrice=90000&maxPrice=100000');
if(filtered.content.length!==1||filtered.content[0].id!==21)throw Error('Collection filter mismatch');
if((await request('products/shops/1/products?collectionId='+cat[0].id)).content.length)throw Error('Collection leaks across shops');
for(const method of ['COD','VISA','PAYPAL']){
 await request('cart/items','POST',{productId:21,variantId:47,quantity:1},b);
 const addresses=await request('addresses','GET',undefined,b);
 const o=await request('orders','POST',{addressId:addresses[0].id,paymentMethod:method},b);
 if(o.paymentMethod!==method)throw Error('Method not persisted');
 if(method==='COD'){if(o.status!=='WAITING_CONFIRMATION')throw Error('COD status');}
 else {
  const payment=await request('payments','POST',{orderId:o.id,method,cardNumber:'4111111111111111',cardHolderName:'LOCAL TEST',cardExpiry:'12/28',cardCvv:'123',paypalEmail:'local-test@example.com'},b);
  if(payment.status!=='COMPLETED')throw Error('Payment status');
  const saved=await request('orders/'+o.id,'GET',undefined,b);
  if(saved.status!=='WAITING_CONFIRMATION')throw Error('Paid order status');
  await request('payments','POST',{orderId:o.id,method},b,400);
 }
 console.log(method+' OK order '+o.id);
}
console.log('Shop info, owner-only categories, collection scope, price filters, COD, VISA, PAYPAL: PASS');
