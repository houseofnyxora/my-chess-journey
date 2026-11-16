const CACHE='my-chess-journey-v2';
const SHELL=['/','/index.html','/css/app.css','/js/app.js','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
async function netFirst(req){
  const c=await caches.open(CACHE);
  const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r});
  const hit=await c.match(req,{ignoreSearch:true});
  if(!hit)return net.catch(()=>c.match('/index.html'));
  return Promise.race([net.catch(()=>hit),new Promise(r=>setTimeout(()=>r(hit),3500))]);
}
async function cacheFirst(req){
  const c=await caches.open(CACHE);
  const hit=await c.match(req);
  if(hit)return hit;
  const r=await fetch(req);
  if(r.ok)c.put(req,r.clone());
  return r;
}
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET')return;
  if(url.origin===location.origin){
    if(url.pathname.startsWith('/room/'))return;
    e.respondWith(netFirst(req));
  }else if(url.hostname==='cdn.jsdelivr.net'){
    e.respondWith(cacheFirst(req));
  }
});
