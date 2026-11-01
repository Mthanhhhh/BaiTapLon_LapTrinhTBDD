import React, {useEffect,useRef,useState} from 'react';
import {WebView} from 'react-native-webview';
import {MapProps,mapHtml} from './addressMapHtml';
export default function AddressPinMap({position,onPick}:MapProps){
  const ref=useRef<WebView>(null), [html]=useState(()=>mapHtml(position));
  useEffect(()=>{ref.current?.postMessage(JSON.stringify(position?{type:'position',...position}:{type:'clear'}));},[position]);
  return <WebView applicationNameForUserAgent="EshopClassroom/1.0" ref={ref} source={{html}} style={{height:240,flex:0}} originWhitelist={['*']} onMessage={event=>{try{const p=JSON.parse(event.nativeEvent.data);if(Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180)onPick(p);}catch{}}}/>;
}
