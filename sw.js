/* CoachFlow v1.5: network-first documents; offline fallback */
const CACHE = 'coachflow-static-v19';
const ASSETS = ['./index.html','./manifest.webmanifest','./icon-192.png','./auth-gateway.js','./coachflow-features.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(ASSETS.map(path=>cache.add(path)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('coachflow-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const isDoc=req.mode==='navigate'||new URL(req.url).pathname.endsWith('/index.html');
  if(isDoc){event.respondWith(fetch(req).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',clone)).catch(()=>{});}return response;}).catch(()=>caches.match('./index.html')));return;}
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});return response;})));
});