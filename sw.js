/* ============================================================
   SERVICE WORKER — RotaViva (PWA offline)
   Faz cache dos arquivos do app para funcionar sem internet
   depois de instalado na tela inicial.
   ============================================================ */

const CACHE = "rotaviva-v1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./estilo.css",
  "./dados.js",
  "./mapa_coords.js",
  "./app.js",
  "./manifest.json",
  "./icone.svg"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  // mapas (tiles do OpenStreetMap) e Leaflet: tenta rede, não quebra se offline
  if (req.url.includes("tile.openstreetmap.org") || req.url.includes("jsdelivr.net")) {
    e.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }
  // demais: cache-first (app funciona offline)
  e.respondWith(
    caches.match(req).then(hit=> hit || fetch(req).then(res=>{
      return caches.open(CACHE).then(c=>{ try{c.put(req,res.clone());}catch(_){ } return res; });
    }).catch(()=>caches.match("./index.html")))
  );
});
