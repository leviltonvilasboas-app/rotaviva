/* ============================================================
   SERVICE WORKER — RotaViva (PWA offline)
   Faz cache dos arquivos do app para funcionar sem internet.
   IMPORTANTE: ao mudar nome/ícone/arquivos, incremente a versão
   do CACHE abaixo (v2 -> v3...) para forçar a renovação no celular.
   ============================================================ */

const CACHE = "rotaviva-v4";   // << versão incrementada força atualização
const ARQUIVOS = [
  "./",
  "./index.html",
  "./estilo.css",
  "./dados.js",
  "./mapa_coords.js",
  "./app.js",
  "./firebase.js",
  "./icone.svg"
  // manifest.json NÃO entra aqui de propósito — sempre buscado da rede
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

  // manifest.json e icone.svg: SEMPRE da rede (network-first) para nome/ícone
  // atualizarem na hora; cai para cache só se estiver offline.
  if (req.url.includes("manifest.json") || req.url.includes("icone.svg")) {
    e.respondWith(
      fetch(req).then(res=>{
        return caches.open(CACHE).then(c=>{ try{c.put(req,res.clone());}catch(_){ } return res; });
      }).catch(()=>caches.match(req))
    );
    return;
  }

  // mapas, Leaflet, Firebase: rede primeiro, não quebra offline
  if (req.url.includes("tile.openstreetmap.org") || req.url.includes("jsdelivr.net") ||
      req.url.includes("gstatic.com") || req.url.includes("firebase") || req.url.includes("googleapis.com")) {
    e.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }

  // demais arquivos do app: cache-first (funciona offline)
  e.respondWith(
    caches.match(req).then(hit=> hit || fetch(req).then(res=>{
      return caches.open(CACHE).then(c=>{ try{c.put(req,res.clone());}catch(_){ } return res; });
    }).catch(()=>caches.match("./index.html")))
  );
});
