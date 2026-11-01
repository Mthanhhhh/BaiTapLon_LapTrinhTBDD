import React,{useEffect,useRef,useState} from 'react';
import {MapProps,mapHtml} from './addressMapHtml';
export default function AddressPinMap({position,onPick}:MapProps){
 const ref=useRef<HTMLIFrameElement>(null),[html]=useState(()=>mapHtml(position));
 useEffect(()=>{const handler=(e:MessageEvent)=>{if(e.source!==ref.current?.contentWindow)return;try{const p=JSON.parse(e.data);if(Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180)onPick(p);}catch{}};window.addEventListener('message',handler);return()=>window.removeEventListener('message',handler);},[onPick]);
 useEffect(()=>{ref.current?.contentWindow?.postMessage(JSON.stringify(position?{type:'position',...position}:{type:'clear'}),'*');},[position]);
 return <iframe ref={ref} title="Ghim địa chỉ giao hàng" srcDoc={html} sandbox="allow-scripts allow-popups" style={{width:'100%',height:240,border:0,borderRadius:12}}/>;
}
