import {useContext,useEffect,useRef,useState} from 'react';
import {Platform} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {AuthContext} from '../context/AuthContext';
import {apiClient} from '../api/client';

WebBrowser.maybeCompleteAuthSession();
type Provider='google'|'facebook';
type Config={google:{clientId:string;configured:boolean};facebook:{clientId:string;configured:boolean};facebookGraphVersion:string};
export function useSocialOAuth(onSuccess:()=>void){
 const {socialLogin}=useContext(AuthContext);
 const [busy,setBusy]=useState<Provider|null>(null);
 const [error,setError]=useState('');
 const consumed=useRef(new Set<string>());
 const config=useQuery<Config>({queryKey:['oauthConfig'],retry:1,queryFn:async()=>(await apiClient.get('/api/v1/auth/oauth/config')).data.data});
 const appRedirectUri=AuthSession.makeRedirectUri({scheme:'eshop',path:'oauth/callback'});
 const redirectUri=Platform.OS==='web'?appRedirectUri:`${apiClient.defaults.baseURL}/api/v1/auth/oauth/mobile/callback`;
 const [googleRequest,googleResult,promptGoogle]=AuthSession.useAuthRequest({
   clientId:config.data?.google.clientId||'not-configured',redirectUri,
   responseType:AuthSession.ResponseType.Code,usePKCE:true,scopes:['openid','email','profile'],
   extraParams:{prompt:'select_account'},
 },{authorizationEndpoint:'https://accounts.google.com/o/oauth2/v2/auth'});
 const version=config.data?.facebookGraphVersion||'v24.0';
 const [facebookRequest,facebookResult,promptFacebook]=AuthSession.useAuthRequest({
   clientId:config.data?.facebook.clientId||'not-configured',redirectUri,
   responseType:AuthSession.ResponseType.Code,usePKCE:false,scopes:['public_profile','email'],
 },{authorizationEndpoint:`https://www.facebook.com/${version}/dialog/oauth`});
 useEffect(()=>{
  const accept=async(provider:Provider,result:AuthSession.AuthSessionResult|null,request:AuthSession.AuthRequest|null)=>{
   if(!result)return;
   if(result.type==='success'){
    const code=result.params.code;
    if(!code||consumed.current.has(code))return;
    consumed.current.add(code);
    try{await socialLogin({provider,code,redirectUri,codeVerifier:provider==='google'?request?.codeVerifier:undefined});onSuccess();}
    catch(e:any){setError(e?.message||'Không thể đăng nhập. Vui lòng thử lại.');}
    finally{setBusy(null);}
   }else if(result.type==='error'){setError('Nhà cung cấp từ chối đăng nhập. Vui lòng thử lại.');setBusy(null);}
   else if(result.type==='cancel'||result.type==='dismiss'){setBusy(null);}
  };
  if(busy==='google')void accept('google',googleResult,googleRequest);
  if(busy==='facebook')void accept('facebook',facebookResult,facebookRequest);
 },[googleResult,facebookResult]);
 const begin=(provider:Provider)=>{
  setError('');
  if(busy)return;
  if(config.isPending){setError('Đang chuẩn bị đăng nhập, vui lòng thử lại sau giây lát.');return;}
  if(config.isError){setError('Không tải được cấu hình đăng nhập. Vui lòng kiểm tra kết nối máy chủ.');return;}
  if(!config.data?.[provider].configured){setError(`Chưa kết nối ${provider==='google'?'Google':'Facebook'}. Chủ ứng dụng cần cấu hình OAuth để bật đăng nhập này.`);return;}
  const request=provider==='google'?googleRequest:facebookRequest;
  if(!request){setError('Đang chuẩn bị phiên đăng nhập. Vui lòng thử lại.');return;}
  setBusy(provider);
  if(Platform.OS!=='web'){
   void (async()=>{
    try{
     const discovery={authorizationEndpoint:provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':`https://www.facebook.com/${version}/dialog/oauth`};
     const url=await request.makeAuthUrlAsync(discovery);
     const result=await WebBrowser.openAuthSessionAsync(url,appRedirectUri);
     if(result.type!=='success')return;
     const parsed=request.parseReturnUrl(result.url);
     if(parsed.type!=='success'||!parsed.params.code)throw new Error('Phiên đăng nhập không hợp lệ hoặc đã bị hủy.');
     await socialLogin({provider,code:parsed.params.code,redirectUri,codeVerifier:provider==='google'?request.codeVerifier:undefined});
     onSuccess();
    }catch(e:any){setError(e?.message||'Không thể đăng nhập. Vui lòng thử lại.');}
    finally{setBusy(null);}
   })();return;
  }
  // Invoke synchronously from the click handler so browsers allow the provider popup/tab.
  const prompt=provider==='google'?promptGoogle:promptFacebook;
  void prompt().catch(()=>{setError('Không mở được cửa sổ đăng nhập. Vui lòng cho phép cửa sổ bật lên và thử lại.');setBusy(null);});
 };
 return {begin,busy,error};
}
