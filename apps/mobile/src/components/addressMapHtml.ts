export type Pin = {latitude: number; longitude: number};
export type MapProps = {position?: Pin; onPick: (point: Pin) => void};
export function mapHtml(position?: Pin) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
  const initial=${JSON.stringify(position ?? null)};const map=L.map('map').setView(initial?[initial.latitude,initial.longitude]:[16,106],initial?16:5);
  L.tileLayer('https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.openstreetmap.fr">OSM France</a>'}).addTo(map);
  let marker;function place(p,move){if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;if(!marker){marker=L.marker([p.latitude,p.longitude],{draggable:true}).addTo(map);marker.on('dragend',()=>emit(marker.getLatLng()));}else marker.setLatLng([p.latitude,p.longitude]);if(move)map.setView([p.latitude,p.longitude],16);}
  function emit(p){const data=JSON.stringify({latitude:p.lat,longitude:p.lng});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(data);else parent.postMessage(data,'*');}
  map.on('click',e=>{place({latitude:e.latlng.lat,longitude:e.latlng.lng},false);emit(e.latlng);});
  function receive(e){try{const p=JSON.parse(e.data);if(p.type==='position')place(p,true);else if(p.type==='clear'&&marker){map.removeLayer(marker);marker=null;}}catch{}}
  window.addEventListener('message',receive);document.addEventListener('message',receive);if(initial)place(initial,false);
  </script></body></html>`;
}
