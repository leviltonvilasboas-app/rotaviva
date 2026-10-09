/* ============================================================
   FIREBASE — RotaViva (sincronização em nuvem + offline nativo)
   Usa Firestore com cache offline persistente e login anônimo.
   A config abaixo é pública por design (a segurança vem das
   regras do Firestore). Projeto: rotaviva-16141.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCIBDJ1zJWXR7oUN9p2ZQF2MQt9pOmejqE",
  authDomain: "rotaviva-16141.firebaseapp.com",
  projectId: "rotaviva-16141",
  storageBucket: "rotaviva-16141.firebasestorage.app",
  messagingSenderId: "579036776924",
  appId: "1:579036776924:web:8f115a6636d3963bbae719"
};

/* Estado da nuvem, exposto para o app.js */
window.CLOUD = {
  ready: false,       // SDK carregado e autenticado
  uid: null,          // id do usuário anônimo
  online: navigator.onLine,
  db: null,
  auth: null,
  docRef: null,       // referência ao documento do usuário
  status: "local"     // "local" | "sincronizando" | "nuvem" | "offline" | "erro"
};

/* Carrega os SDKs do Firebase (modular, via CDN) e inicializa.
   Chamado por app.js após o DOM existir. */
async function iniciarFirebase(aoAtualizar){
  // Só tenta a nuvem em contexto https real (não no preview file://, blob:, srcdoc).
  try {
    const proto = (location && location.protocol) || "";
    const ehHttps = proto === "https:" || (proto === "http:" && location.hostname === "localhost");
    if(!ehHttps){
      window.CLOUD.status = "local";
      if(typeof aoAtualizar === "function") aoAtualizar("local");
      return;   // ambiente de preview/local — mantém só o armazenamento local
    }
  } catch(e){ window.CLOUD.status="local"; return; }

  try {
    const appMod   = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const authMod  = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const fsMod    = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const app = appMod.initializeApp(firebaseConfig);

    // Firestore com cache offline persistente (multi-aba)
    let db;
    try {
      db = fsMod.initializeFirestore(app, {
        localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() })
      });
    } catch(e) {
      db = fsMod.getFirestore(app);   // fallback
    }
    const auth = authMod.getAuth(app);

    window.CLOUD.db = db;
    window.CLOUD.auth = auth;
    window.CLOUD._fs = fsMod;         // guarda helpers do firestore
    window.CLOUD._aoAtualizar = aoAtualizar;

    // login anônimo
    await authMod.signInAnonymously(auth);
    authMod.onAuthStateChanged(auth, (user)=>{
      if(user){
        window.CLOUD.uid = user.uid;
        window.CLOUD.docRef = fsMod.doc(db, "usuarios", user.uid);
        window.CLOUD.ready = true;
        window.CLOUD.status = navigator.onLine ? "nuvem" : "offline";
        if(typeof aoAtualizar === "function") aoAtualizar("auth");
        escutarNuvem();
      }
    });

    // status de conexão
    window.addEventListener("online",  ()=>{ window.CLOUD.online=true;  window.CLOUD.status="nuvem";   if(aoAtualizar) aoAtualizar("online"); });
    window.addEventListener("offline", ()=>{ window.CLOUD.online=false; window.CLOUD.status="offline"; if(aoAtualizar) aoAtualizar("offline"); });

  } catch(err){
    console.warn("Firebase indisponível, usando apenas armazenamento local:", err);
    window.CLOUD.status = "local";
    if(typeof aoAtualizar === "function") aoAtualizar("erro");
  }
}

/* Escuta mudanças na nuvem em tempo real (sincroniza entre aparelhos) */
function escutarNuvem(){
  const C = window.CLOUD; if(!C.ready || !C.docRef) return;
  C._fs.onSnapshot(C.docRef, (snap)=>{
    if(snap.exists()){
      const data = snap.data();
      if(data && data.app && typeof C._aoReceberNuvem === "function"){
        C._aoReceberNuvem(data.app, snap.metadata.fromCache);
      }
    }
  }, (err)=>{ console.warn("onSnapshot erro:", err); });
}

/* Grava o estado completo do app na nuvem (merge) */
async function salvarNaNuvem(appState){
  const C = window.CLOUD;
  if(!C.ready || !C.docRef) return false;
  try {
    C.status = "sincronizando"; if(C._aoAtualizar) C._aoAtualizar("salvando");
    await C._fs.setDoc(C.docRef, { app: appState, atualizadoEm: Date.now() }, { merge: true });
    C.status = C.online ? "nuvem" : "offline";
    if(C._aoAtualizar) C._aoAtualizar("salvo");
    return true;
  } catch(err){
    console.warn("Erro ao salvar na nuvem:", err);
    C.status = "erro"; if(C._aoAtualizar) C._aoAtualizar("erro");
    return false;
  }
}
