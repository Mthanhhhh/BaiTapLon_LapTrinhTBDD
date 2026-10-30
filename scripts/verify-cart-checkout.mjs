const pw=process.env.PRACTICE_PASSWORD;
if(!pw||process.env.ALLOW_PRACTICE_CART_RESET!=='1')throw Error('Set PRACTICE_PASSWORD and ALLOW_PRACTICE_CART_RESET=1. This test clears the local practice buyer cart and creates an order.');
async function api(path,method='GET',body,token,expected=200){const r=await fetch('http://localhost:8080/api/v1/'+path,{method,signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(r.status!==expected)throw Error(path+' '+r.status+' '+JSON.stringify(d));return d.data;}
const token=(await api('auth/login','POST',{email:'buyer.practice.20261029@example.com',password:pw})).accessToken;
const catalog=await api('products/recommendations?keyword=iPhone');const product=await api('products/'+catalog.content[0].id);if(!product.variantImages||!product.optionLabels?.length)throw Error('Missing variant photo metadata');
const v=product.variants.find(v=>v.stock>2);const before=(await api('orders','GET',undefined,token)).totalElements;
await api('cart','DELETE',undefined,token);
let c=await api('cart/items','POST',{productId:product.id,variantId:v.id,quantity:1},token);
const item=c.items[0];c=await api('cart/items/'+item.id,'PUT',{quantity:2},token);if(c.totalAmount!==v.price*2||c.totalItems!==2)throw Error('Cart totals');
if((await api('orders','GET',undefined,token)).totalElements!==before)throw Error('Cart created an order');
await api('cart/items/'+item.id,'DELETE',undefined,token);
c=await api('cart/items','POST',{productId:product.id,variantId:v.id,quantity:1},token);
const address=await api('addresses','POST',{fullName:'Khách kiểm thử local',phone:'0900000101',street:'Địa chỉ kiểm thử local',city:'TP Hồ Chí Minh',state:'Quận kiểm thử',country:'VN',isDefault:false},token);
const order=await api('orders','POST',{addressId:address.id,paymentMethod:'COD',note:'Đơn kiểm thử giỏ hàng sau khi đồng bộ GitHub'},token);
if(order.status!=='WAITING_CONFIRMATION'||order.total!==v.price*1.1)throw Error('Checkout totals/status');
if((await api('cart','GET',undefined,token)).items.length)throw Error('Cart not cleared');
const legacy=await api('orders/14','GET',undefined,token);if(!legacy.total||!legacy.items[0]?.price)throw Error('Legacy order values lost');
const urls=[...new Set(Object.values(product.variantImages).flat())];for(const url of urls.slice(0,3)){const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('Bad photo '+url);}
// Leave one product in the cart so the user can inspect the new cart screen.
await api('cart/items','POST',{productId:product.id,variantId:v.id,quantity:1},token);
console.log(JSON.stringify({productId:product.id,variantImages:urls.length,cartAddUpdateRemove:true,noOrderOnCartChanges:true,CODOrder:order.id,legacyOrderPreserved:true,cloudinaryPhotos:true,cartReadyForPractice:true}));
