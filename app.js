/* ============================================================
   APP — EXPEDIÇÃO ATACAMA 2027  (lógica + persistência)
   Tudo salvo no localStorage do próprio aparelho.
   ============================================================ */

/* rede de segurança: evita que erros do carregamento da nuvem (bloqueado
   em preview/sandbox) apareçam como erro fatal — o app funciona em modo local. */
try {
  window.addEventListener("unhandledrejection", function(e){
    console.warn("Promise rejeitada (tratada):", e && e.reason);
    e.preventDefault();
  });
} catch(_){}

const KEY = "rotaviva_v1";

/* Armazenamento resiliente: usa localStorage quando disponível.
   Em iframes de preview que bloqueiam o localStorage, cai para
   memória interna (o app funciona para teste, sem persistir). */
let _mem = {};
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return _mem[k] ?? null; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch(e){ _mem[k]=v; } },
  del(k){ try { localStorage.removeItem(k); } catch(e){ delete _mem[k]; } }
};

/* ============================================================
   MODELO MULTI-VIAGEM
   APP = { viagens:[ {id,nome, viagem, etapas, gastos, checkState} ], ativa:id }
   S é um ATALHO para a viagem ativa (mantém todo o resto do código igual).
   ============================================================ */
let APP = carregarApp();
let S = viagemAtiva();          // referência à viagem ativa
garantirMoto();

/* ---------- integração com a nuvem (Firebase) ---------- */
let _nuvemJaMesclou=false;
function _aoReceberNuvem(appNuvem, veioDoCache){
  // Primeira vez que recebe da nuvem: decide entre local e nuvem.
  try {
    if(!appNuvem || !appNuvem.viagens || !appNuvem.viagens.length) {
      // nuvem vazia -> envia o que temos localmente
      if(window.CLOUD && window.CLOUD.ready) salvarNaNuvem(APP);
      return;
    }
    const localAtual = JSON.stringify(APP);
    const nuvemStr = JSON.stringify(appNuvem);
    if(localAtual === nuvemStr) return;   // iguais, nada a fazer
    // adota a versão da nuvem (fonte de verdade entre aparelhos)
    APP = appNuvem;
    S = viagemAtiva();
    store.set(KEY, JSON.stringify(APP));
    _map=null;
    render();
    if(_nuvemJaMesclou) toast("Dados sincronizados");
    _nuvemJaMesclou=true;
  } catch(e){ console.warn("merge nuvem falhou", e); }
}
function _aoAtualizarNuvem(evento){
  atualizarStatusNuvem();
}
function atualizarStatusNuvem(){
  const el=document.querySelector("#cloud-status"); if(!el || !window.CLOUD) return;
  // Padrão de mercado: Online (verde) quando conectado ao banco;
  // Offline (vermelho) quando sem internet ou sem conexão com o banco.
  const map={
    sincronizando:["🟢 Sincronizando…","var(--ok)"],
    salvando:["🟢 Sincronizando…","var(--ok)"],
    nuvem:["🟢 Online","var(--ok)"],
    offline:["🔴 Offline","var(--danger)"],
    local:["🔴 Offline","var(--danger)"],
    erro:["🔴 Offline","var(--danger)"]
  };
  const s=window.CLOUD.status||"local";
  const [txt,cor]=map[s]||map.offline;
  el.textContent=txt; el.style.color=cor;
  const full=document.querySelector("#cloud-status-full");
  if(full){ full.textContent=txt; full.style.color=cor; }
}
function bootNuvem(){
  try {
    if(typeof iniciarFirebase!=="function") return;
    window.CLOUD._aoReceberNuvem=_aoReceberNuvem;
    const r = iniciarFirebase(_aoAtualizarNuvem);
    if(r && typeof r.catch === "function"){
      r.catch(err=>{ console.warn("Firebase boot falhou (ok em modo local):", err); });
    }
  } catch(err){
    console.warn("bootNuvem erro (ok em modo local):", err);
  }
}

function novaViagemBase(nome){
  return {
    id: "v"+Date.now()+Math.floor(Math.random()*1000),
    nome: nome || "Nova viagem",
    viagem: {
      titulo: nome || "Nova viagem",
      origem: "", destinoPrincipal: "",
      moto: "", consumoPlanejado: 18, cambioUSD_BRL: 5.40,
      orcamentoTotal: 0, dataInicio: "", dataFim: ""
    },
    etapas: [],
    gastos: [],
    checkState: {},
    checklists: {
      "Documentos & Fronteira": [], "Dinheiro": [],
      "Equipamento do piloto": [], "Moto & ferramentas": []
    },
    categorias: ["Hospedagem","Combustível","Alimentação","Pedágio","Passeios","Manutenção","Outros"],
    combustivel: { BR:6.75, AR:7.29, CL:8.53, nota:"Reconfirmar antes da viagem." }
  };
}

/* migra a "Expedição Atacama" (DADOS_FABRICA) para a 1ª viagem */
function viagemAtacama(){
  const base = JSON.parse(JSON.stringify(DADOS_FABRICA));
  return {
    id: "v_atacama_2027",
    nome: base.viagem.titulo,          // "Expedição Atacama 2027"
    viagem: base.viagem,
    etapas: base.etapas,
    gastos: [],
    checkState: {},
    checklists: base.checklists,
    categorias: base.categorias,
    combustivel: base.combustivel
  };
}

function carregarApp(){
  try {
    const raw = store.get(KEY);
    if (raw){
      const o = JSON.parse(raw);
      if (o && o.viagens && o.viagens.length) return o;
    }
  } catch(e){}
  // primeira vez: cria o app já com a Expedição Atacama migrada
  const app = {
    viagens:[ viagemAtacama() ],
    ativa:"v_atacama_2027",
    moto: { marca:"Royal Enfield", modelo:"Super Meteor 650", placa:"", consumo:18 }
  };
  store.set(KEY, JSON.stringify(app));
  return app;
}
/* garante que APP.moto exista mesmo em dados salvos antes desta versão */
function garantirMoto(){
  if(!APP.moto){
    const c = (APP.viagens[0] && APP.viagens[0].viagem && APP.viagens[0].viagem.consumoPlanejado) || 18;
    APP.moto = { marca:"Royal Enfield", modelo:"Super Meteor 650", placa:"", consumo:c };
    salvar();
  }
}
/* consumo da moto (global) usado em todas as viagens */
function consumoMoto(){ return (APP.moto && Number(APP.moto.consumo)) || 18; }

function viagemAtiva(){
  return APP.viagens.find(v=>v.id===APP.ativa) || APP.viagens[0];
}
let _syncTimer=null;
function salvar(){
  store.set(KEY, JSON.stringify(APP));           // sempre salva local (offline)
  // sincroniza na nuvem com debounce (evita gravações excessivas)
  if(window.CLOUD && window.CLOUD.ready){
    clearTimeout(_syncTimer);
    _syncTimer=setTimeout(()=>{ salvarNaNuvem(APP); }, 800);
  }
}

function trocarViagem(id){
  APP.ativa = id; S = viagemAtiva(); salvar();
  _map=null; // força recriar o mapa na próxima abertura
  render();
  document.querySelector('.tabbar button[data-view="resumo"]').click();
  toast("Viagem: "+S.nome);
}
function criarViagem(nome){
  const v = novaViagemBase(nome);
  APP.viagens.push(v); APP.ativa = v.id; S = viagemAtiva(); salvar(); render();
  toast("Viagem criada");
  return v.id;
}
function excluirViagem(id){
  if(APP.viagens.length<=1){ toast("Mantenha ao menos 1 viagem"); return; }
  APP.viagens = APP.viagens.filter(v=>v.id!==id);
  if(APP.ativa===id) APP.ativa = APP.viagens[0].id;
  S = viagemAtiva(); salvar(); render();
  toast("Viagem excluída");
}
function renomearViagem(id, nome){
  const v=APP.viagens.find(x=>x.id===id); if(!v) return;
  v.nome=nome; v.viagem.titulo=nome; salvar(); render();
}

/* ---------- Utilidades ---------- */
const $  = s => document.querySelector(s);
const brl = n => "R$ " + (Number(n)||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const dataBR = iso => { if(!iso||iso==="—") return "—"; const [a,m,d]=iso.split("-"); return `${d}/${m}`; };
const catIcon = c => ({Hospedagem:"🏨",Combustível:"⛽",Alimentação:"🍽️",Pedágio:"🛣️",Passeios:"🎟️",Manutenção:"🔧",Outros:"📦"}[c]||"📦");
const paisNome = p => ({BR:"🇧🇷 Brasil",AR:"🇦🇷 Argentina",CL:"🇨🇱 Chile"}[p]||p);

function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);
}

/* ---------- Navegação ---------- */
function irParaView(view, viaMenu){
  document.querySelectorAll(".tabbar button").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const alvo=document.getElementById("view-"+view);
  if(alvo) alvo.classList.add("active");
  // marca a aba correspondente na tabbar (se existir)
  const tab=document.querySelector('.tabbar button[data-view="'+view+'"]');
  if(tab) tab.classList.add("active");
  else { const bm=document.querySelector("#btn-menu"); if(bm && viaMenu) bm.classList.add("active"); }
  render();
  aoAbrirView(view);
  window.scrollTo(0,0);
}

document.querySelectorAll(".tabbar button[data-view]").forEach(b=>{
  b.onclick=()=>irParaView(b.dataset.view, false);
});

/* ---- Menu (folha inferior) com Viagens / Checklist / Ajustes ---- */
function abrirMenu(){ const m=document.querySelector("#menu-bg"); if(m) m.classList.add("show"); }
function fecharMenu(){ const m=document.querySelector("#menu-bg"); if(m) m.classList.remove("show"); }
(function(){
  const bMenu=document.querySelector("#btn-menu");
  const bMenuTop=document.querySelector("#btn-menu-top");
  if(bMenu) bMenu.onclick=abrirMenu;
  if(bMenuTop) bMenuTop.onclick=abrirMenu;
  const bg=document.querySelector("#menu-bg");
  if(bg) bg.onclick=(e)=>{ if(e.target.id==="menu-bg") fecharMenu(); };
  document.querySelectorAll(".menu-item[data-goto]").forEach(mi=>{
    mi.onclick=()=>{ fecharMenu(); irParaView(mi.dataset.goto, true); };
  });
  const bEdit=document.querySelector("#btn-edit-viagem");
  if(bEdit) bEdit.onclick=()=>formEditarViagem(APP.ativa);
  const bVoltar=document.querySelector("#btn-voltar-roteiro");
  if(bVoltar) bVoltar.onclick=()=>irParaView("roteiro", false);
})();

/* ---------- MODAL ---------- */
function abrirModal(html){
  $("#modal").innerHTML=html;
  $("#modal-bg").classList.add("show");
  // keyboard-avoiding: ao focar um campo, rola-o para a vista (acima do teclado)
  const campos = document.querySelectorAll("#modal input, #modal select, #modal textarea");
  campos.forEach(c=>{
    c.addEventListener("focus", ()=>{
      setTimeout(()=>{ try{ c.scrollIntoView({block:"center", behavior:"smooth"}); }catch(_){ } }, 250);
    });
  });
}
function fecharModal(){ $("#modal-bg").classList.remove("show"); }
$("#modal-bg").onclick = e => { if(e.target.id==="modal-bg") fecharModal(); };

/* confirmação genérica reutilizável (evita exclusões acidentais) */
let _acaoConfirmada=null;
function confirmar(titulo, descricaoHTML, rotuloConfirmar, aoConfirmar){
  _acaoConfirmada=aoConfirmar;
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>${titulo}</h3>
    <p class="hint">${descricaoHTML||"Esta ação não pode ser desfeita."}</p>
    <div class="btn-row">
      <button class="btn sec" style="flex:1" onclick="fecharModal()">Cancelar</button>
      <button class="btn" style="flex:1;background:var(--danger);color:#fff" onclick="(function(){var f=_acaoConfirmada;_acaoConfirmada=null;fecharModal();if(f)f();})()">${rotuloConfirmar||"Excluir"}</button>
    </div>`);
}

/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */
function render(){
  renderHeader(); renderViagens(); renderResumo(); renderRoteiro(); renderGastos(); renderChecks(); renderAjustes();
}

function renderHeader(){
  $("#hd-titulo").textContent = "RotaViva";
  const nome = S && S.nome ? S.nome : "selecionar viagem";
  $("#hd-sub").innerHTML = "▾ " + nome;
}

/* ---------- Cálculos agregados ---------- */
function totalGasto(){ return (S.gastos||[]).reduce((s,g)=>s+(Number(g.valor)||0),0); }
function gastoPorCategoria(){
  const m={}; (S.gastos||[]).forEach(g=>{ m[g.categoria]=(m[g.categoria]||0)+(Number(g.valor)||0); });
  return m;
}
function consumoMedio(){
  const ab=(S.gastos||[]).filter(g=>g.km&&g.litros);
  if(!ab.length) return null;
  const km=ab.reduce((s,g)=>s+Number(g.km),0);
  const lt=ab.reduce((s,g)=>s+Number(g.litros),0);
  return lt>0 ? (km/lt) : null;
}
function kmTotal(){ return S.etapas.reduce((s,e)=>s+(Number(e.km)||0),0); }


/* ============================================================
   VIEW MINHAS VIAGENS
   ============================================================ */
function renderViagens(){
  const box=$("#lista-viagens"); if(!box) return;
  box.innerHTML = APP.viagens.map(v=>{
    const ativa = v.id===APP.ativa;
    const nEt=v.etapas.length, km=v.etapas.reduce((s,e)=>s+(Number(e.km)||0),0);
    const g=(v.gastos||[]).reduce((s,x)=>s+(Number(x.valor)||0),0);
    return `
    <div class="card" style="${ativa?'border-color:var(--accent)':''}">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1;min-width:0">
          <b style="font-size:16px">${v.nome}</b>
          ${ativa?'<span class="flag rev" style="background:rgba(255,107,53,.15);color:var(--accent);border-color:rgba(255,107,53,.4)">ativa</span>':''}
          <div class="hint" style="margin-top:4px">${nEt} etapas · ${km.toLocaleString("pt-BR")} km · gasto ${brl(g)}</div>
        </div>
      </div>
      <div class="btn-row">
        ${ativa?'' : `<button class="btn sm" style="flex:1" onclick="trocarViagem('${v.id}')">Abrir</button>`}
        <button class="btn sec sm" style="flex:1" onclick="formRenomear('${v.id}')">✏️ Renomear</button>
        <button class="btn sec sm" style="flex:1;color:var(--danger);border-color:var(--danger)" onclick="confirmarExcluir('${v.id}')">🗑️</button>
      </div>
    </div>`;
  }).join("");
}
function formNovaViagem(){
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Nova viagem</h3>
    <p class="hint">A viagem começa vazia. Depois você adiciona etapas, paradas, gastos e checklists.</p>
    <label class="fld">Nome da viagem</label>
    <input id="nv-nome" placeholder="Ex.: Volta à Serra Gaúcha 2028" autofocus>
    <label class="fld">Origem</label><input id="nv-origem" placeholder="Ex.: Brasília – DF">
    <label class="fld">Destino principal</label><input id="nv-destino" placeholder="Ex.: Bariloche – AR">
    <div class="row2">
      <div><label class="fld">Orçamento (R$)</label><input id="nv-orc" type="number" value="0"></div>
      <div><label class="fld">Câmbio US$ → R$</label><input id="nv-cambio" type="number" step="0.01" value="5.40"></div>
    </div>
    <p class="hint">O consumo da moto (km/l) é definido em Ajustes → Minha moto e vale para todas as viagens.</p>
    <button class="btn" onclick="salvarNovaViagem()">Criar viagem</button>`);
}
function salvarNovaViagem(){
  const nome=$("#nv-nome").value.trim(); if(!nome){toast("Dê um nome");return;}
  const id=criarViagem(nome);
  const v=APP.viagens.find(x=>x.id===id);
  v.viagem.origem=$("#nv-origem").value.trim();
  v.viagem.destinoPrincipal=$("#nv-destino").value.trim();
  v.viagem.orcamentoTotal=Number($("#nv-orc").value)||0;
  v.viagem.cambioUSD_BRL=Number($("#nv-cambio").value)||5.40;
  salvar(); fecharModal(); render();
  document.querySelector('.tabbar button[data-view="resumo"]').click();
}

/* editar os DADOS de uma viagem (orçamento/consumo/câmbio são por viagem) */
function formEditarViagem(id){
  const v=APP.viagens.find(x=>x.id===id); if(!v) return;
  const d=v.viagem;
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Dados da viagem</h3>
    <label class="fld">Nome da viagem</label>
    <input id="ev-nome" value="${(v.nome||'').replace(/"/g,'&quot;')}">
    <label class="fld">Origem</label><input id="ev-origem" value="${(d.origem||'').replace(/"/g,'&quot;')}">
    <label class="fld">Destino principal</label><input id="ev-destino" value="${(d.destinoPrincipal||'').replace(/"/g,'&quot;')}">
    <div class="row2">
      <div><label class="fld">Orçamento (R$)</label><input id="ev-orc" type="number" value="${d.orcamentoTotal||0}"></div>
      <div><label class="fld">Câmbio US$ → R$</label><input id="ev-cambio" type="number" step="0.01" value="${d.cambioUSD_BRL||5.40}"></div>
    </div>
    <button class="btn" onclick="salvarEdicaoViagem('${id}')">Salvar dados</button>`);
}
function salvarEdicaoViagem(id){
  const v=APP.viagens.find(x=>x.id===id); if(!v) return;
  const nome=$("#ev-nome").value.trim(); if(!nome){ toast("Dê um nome"); return; }
  v.nome=nome; v.viagem.titulo=nome;
  v.viagem.origem=$("#ev-origem").value.trim();
  v.viagem.destinoPrincipal=$("#ev-destino").value.trim();
  v.viagem.orcamentoTotal=Number($("#ev-orc").value)||0;
  v.viagem.cambioUSD_BRL=Number($("#ev-cambio").value)||5.40;
  salvar(); fecharModal(); render(); toast("Dados da viagem salvos");
}
function formRenomear(id){
  const v=APP.viagens.find(x=>x.id===id); if(!v) return;
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Renomear viagem</h3>
    <label class="fld">Nome</label><input id="rn-nome" value="${v.nome}" autofocus>
    <button class="btn" onclick="salvarRenome('${id}')">Salvar</button>`);
}
function salvarRenome(id){
  const nome=$("#rn-nome").value.trim(); if(!nome) return;
  renomearViagem(id,nome); fecharModal(); toast("Renomeada");
}
function confirmarExcluir(id){
  const v=APP.viagens.find(x=>x.id===id); if(!v) return;
  confirmar("Excluir viagem?",
    `A viagem <b>"${v.nome}"</b> e todos os seus dados (roteiro, gastos, checklists) serão apagados. Esta ação não pode ser desfeita.`,
    "Excluir viagem", ()=>excluirViagem(id));
}

/* ============================================================
   VIEW RESUMO
   ============================================================ */
function renderResumo(){
  const g=totalGasto(), orc=S.viagem.orcamentoTotal, pct=orc?Math.min(100,g/orc*100):0;
  const km=kmTotal(), litros=km/consumoMoto();

  $("#kpi-grid").innerHTML = `
    <div class="kpi accent"><div class="label">Distância total</div>
      <div class="value">${km.toLocaleString("pt-BR")} km</div>
      <div class="sub">${S.etapas.length} etapas</div></div>
    <div class="kpi"><div class="label">Combustível (plan.)</div>
      <div class="value">${Math.round(litros)} L</div>
      <div class="sub">a ${consumoMoto()} km/l</div></div>
    <div class="kpi"><div class="label">Período</div>
      <div class="value" style="font-size:16px">${dataBR(S.viagem.dataInicio)}–${dataBR(S.viagem.dataFim)}</div>
      <div class="sub">Out/2027 · 16 dias</div></div>
    <div class="kpi"><div class="label">Hospedagem</div>
      <div class="value" style="font-size:17px">${brl(S.etapas.reduce((s,e)=>s+(Number(e.hotelValor)||0),0))}</div>
      <div class="sub">15 noites</div></div>`;

  $("#res-gasto").textContent = `${brl(g)} / ${brl(orc)}`;
  $("#res-pct").textContent = Math.round(pct)+"%";
  $("#res-bar").style.width = pct+"%";

  const cats=gastoPorCategoria(), max=Math.max(1,...Object.values(cats));
  $("#res-cats").innerHTML = Object.keys(cats).length
    ? Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`
      <div class="cb"><div class="top"><span>${catIcon(c)} ${c}</span><b>${brl(v)}</b></div>
      <div class="bar"><i style="width:${v/max*100}%"></i></div></div>`).join("")
    : `<p class="hint">Nenhum gasto lançado ainda. Vá em <b>Gastos</b> para começar.</p>`;

  // próxima etapa = primeira ainda não "concluída" (usamos data futura simples: a primeira)
  const e=S.etapas[0];
  $("#res-proxima").innerHTML = e ? `
    <div class="etapa-head" style="padding:0" onclick="irRoteiro('${e.id}')">
      <div class="etapa-badge">${e.dia}</div>
      <div class="t"><div class="rota">${e.destino}</div>
        <div class="meta">${dataBR(e.data)} · ${e.km} km · ${paisNome(e.pais)}</div></div>
      <div class="chev">›</div>
    </div>` : "";
}
function irRoteiro(id){
  document.querySelector('.tabbar button[data-view="roteiro"]').click();
  setTimeout(()=>{ const el=document.getElementById("etapa-"+id); if(el){ el.classList.add("open"); el.scrollIntoView({behavior:"smooth",block:"center"}); } },100);
}

/* ============================================================
   VIEW ROTEIRO (editável + paradas)
   ============================================================ */
function renderRoteiro(){
  $("#lista-etapas").innerHTML = S.etapas.map((e,i)=>{
    const rev = /REVIS/i.test(e.tipo);
    const nParadas = (e.paradas||[]).length;
    return `
    <div class="etapa" id="etapa-${e.id}">
      <div class="etapa-head" onclick="abrirEtapa(${i})">
        <div class="etapa-badge">${e.dia}</div>
        <div class="t">
          <div class="rota">${e.destino}${rev?' <span class="flag rev">🔧</span>':''}</div>
          <div class="meta">${dataBR(e.data)} · ${e.km} km · ${paisNome(e.pais)}${nParadas?` · 📍${nParadas}`:''}</div>
        </div>
        <div class="chev">›</div>
      </div>
    </div>`;
  }).join("");
}

/* abre a tela de detalhe dedicada da etapa */
let _etapaAtual=null;
function abrirEtapa(i){
  _etapaAtual=i;
  renderDetalheEtapa();
  irParaView("etapa", true);
}
function renderDetalheEtapa(){
  const i=_etapaAtual; const e=S.etapas[i]; if(!e) return;
  const rev = /REVIS/i.test(e.tipo);
  const box=document.querySelector("#etapa-detalhe"); if(!box) return;
  box.innerHTML=`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="etapa-badge" style="min-width:58px;height:58px">${e.dia}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:800">${e.destino}</div>
          <div class="hint">${dataBR(e.data)} · ${e.origem} → ${e.destino}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <span class="chip">📏 ${e.km} km</span>
        <span class="chip">${paisNome(e.pais)}</span>
        ${rev?'<span class="chip" style="color:var(--warn)">🔧 revisão</span>':''}
        <span class="chip">${e.tipo||''}</span>
      </div>
      <div class="info-row"><span class="ic">🌡️</span><span>${e.clima||"—"}</span></div>
      <div class="info-row"><span class="ic">🏨</span><span>${e.hotel||"—"} ${e.hotelValor?("· "+brl(e.hotelValor)):""}</span></div>
      <div class="info-row"><span class="ic">🌅</span><span>Nascer/Pôr do sol: ${e.nascerPor||"—"}</span></div>
    </div>

    ${e.insights&&e.insights.length?`<div class="card">
      <div class="section-title">Dicas & destaques</div>
      <ul class="lista-insights">${e.insights.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>`:""}

    <div class="card">
      <div class="section-title">📍 Paradas & pontos de interesse</div>
      <div id="paradas-${i}">${renderParadas(e,i)}</div>
      <button class="btn sec sm" style="margin-top:10px;width:100%" onclick="addParada(${i})">＋ Adicionar parada</button>
    </div>

    <div class="btn-row">
      <button class="btn sec sm" style="flex:1" onclick="editarEtapa(${i})">✏️ Editar etapa</button>
      <button class="btn sec sm" style="flex:1;color:var(--danger);border-color:var(--danger)" onclick="removerEtapa(${i})">🗑️ Remover</button>
    </div>`;
}
function renderParadas(e,i){
  if(!e.paradas||!e.paradas.length) return `<p class="hint">Nenhuma parada ainda. Adicione mirantes, fotos, abastecimentos…</p>`;
  return e.paradas.map((p,j)=>`
    <div class="parada ${p.feito?'done':''}">
      <input type="checkbox" ${p.feito?'checked':''} onchange="toggleParada(${i},${j})">
      <span class="nome">${p.nome}</span>
      <button class="ico-btn del" style="width:30px;height:30px" onclick="delParada(${i},${j})">${IC_LIXEIRA}</button>
    </div>`).join("");
}
function toggleEtapa(i){ abrirEtapa(i); }
function toggleParada(i,j){ S.etapas[i].paradas[j].feito=!S.etapas[i].paradas[j].feito; salvar(); $("#paradas-"+i).innerHTML=renderParadas(S.etapas[i],i); }
function delParada(i,j){
  const p=S.etapas[i].paradas[j]; if(!p) return;
  confirmar("Excluir parada?",
    `A parada <b>"${p.nome}"</b> será removida desta etapa.`,
    "Excluir parada",
    ()=>{ S.etapas[i].paradas.splice(j,1); salvar(); $("#paradas-"+i).innerHTML=renderParadas(S.etapas[i],i); renderRoteiro(); toast("Parada excluída"); });
}
function addParada(i){
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Nova parada — ${S.etapas[i].dia}</h3>
    <p class="hint">Mirante, ponto fotográfico, abastecimento, atração para contemplar antes do destino.</p>
    <label class="fld">Nome da parada</label>
    <input id="mp-nome" placeholder="Ex.: Mirante da Cuesta de Lipán" autofocus>
    <button class="btn" onclick="salvarParada(${i})">Adicionar</button>`);
}
function salvarParada(i){
  const nome=$("#mp-nome").value.trim(); if(!nome) return;
  S.etapas[i].paradas.push({nome,feito:false}); salvar(); fecharModal();
  $("#paradas-"+i).innerHTML=renderParadas(S.etapas[i],i); renderRoteiro(); toast("Parada adicionada");
}

/* editar / add / remover etapa */
function editarEtapa(i){ formEtapa(i); }
function addEtapaNova(){ formEtapa(-1); }
function formEtapa(i){
  const e = i>=0 ? S.etapas[i] : {dia:"",data:"2027-10-",origem:"",destino:"",km:0,pais:"AR",tipo:"Pernoite",hotel:"",hotelValor:0,nascerPor:"",clima:"",insights:[],paradas:[]};
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>${i>=0?"Editar etapa":"Nova etapa"}</h3>
    <div class="row2">
      <div><label class="fld">Dia</label><input id="e-dia" value="${e.dia}"></div>
      <div><label class="fld">Data</label><input id="e-data" type="date" value="${e.data}"></div>
    </div>
    <label class="fld">Origem</label><input id="e-origem" value="${e.origem}">
    <label class="fld">Destino (pernoite)</label><input id="e-destino" value="${e.destino}">
    <div class="row2">
      <div><label class="fld">Distância (km)</label><input id="e-km" type="number" value="${e.km}"></div>
      <div><label class="fld">País</label><select id="e-pais">
        <option value="BR"${e.pais=="BR"?" selected":""}>Brasil</option>
        <option value="AR"${e.pais=="AR"?" selected":""}>Argentina</option>
        <option value="CL"${e.pais=="CL"?" selected":""}>Chile</option></select></div>
    </div>
    <label class="fld">Tipo / observação</label><input id="e-tipo" value="${e.tipo}">
    <div class="row2">
      <div><label class="fld">Hotel</label><input id="e-hotel" value="${e.hotel}"></div>
      <div><label class="fld">Valor (R$)</label><input id="e-hv" type="number" value="${e.hotelValor}"></div>
    </div>
    <label class="fld">Clima</label><input id="e-clima" value="${e.clima||''}">
    <label class="fld">Dicas (uma por linha)</label>
    <textarea id="e-ins">${(e.insights||[]).join("\n")}</textarea>
    <button class="btn" onclick="salvarEtapa(${i})">Salvar etapa</button>`);
}
function salvarEtapa(i){
  const obj={
    dia:$("#e-dia").value.trim(), data:$("#e-data").value, origem:$("#e-origem").value.trim(),
    destino:$("#e-destino").value.trim(), km:Number($("#e-km").value)||0, pais:$("#e-pais").value,
    tipo:$("#e-tipo").value.trim(), hotel:$("#e-hotel").value.trim(), hotelValor:Number($("#e-hv").value)||0,
    nascerPor:(i>=0?S.etapas[i].nascerPor:"—"), clima:$("#e-clima").value.trim(),
    insights:$("#e-ins").value.split("\n").map(x=>x.trim()).filter(Boolean),
    paradas:(i>=0?S.etapas[i].paradas:[])
  };
  obj.id = i>=0 ? S.etapas[i].id : "N"+Date.now();
  if(i>=0) S.etapas[i]=obj; else S.etapas.push(obj);
  salvar(); fecharModal(); renderRoteiro(); renderResumo(); if(_etapaAtual!==null && document.getElementById("view-etapa").classList.contains("active")) renderDetalheEtapa(); toast("Etapa salva");
}
function removerEtapa(i){
  const e=S.etapas[i]; if(!e) return;
  confirmar("Remover etapa?",
    `A etapa <b>${e.dia} — ${e.destino}</b> será removida do roteiro.`,
    "Remover etapa",
    ()=>{ S.etapas.splice(i,1); salvar(); renderRoteiro(); renderResumo(); irParaView("roteiro", false); toast("Etapa removida"); });
}

/* ============================================================
   VIEW GASTOS
   ============================================================ */
const IC_LAPIS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const IC_LIXEIRA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

function renderGastos(){
  const g=totalGasto(), saldo=S.viagem.orcamentoTotal-g, cm=consumoMedio();
  $("#g-total").textContent = brl(g);
  $("#g-saldo").textContent = "Saldo: "+brl(saldo);
  $("#g-saldo").style.color = saldo<0 ? "var(--danger)" : "var(--txt-dim)";
  $("#g-consumo").textContent = cm ? cm.toFixed(1)+" km/l" : "— km/l";

  const list=(S.gastos||[]).slice().reverse();
  $("#lista-gastos").innerHTML = list.length ? list.map((gg)=>{
    const idx=S.gastos.indexOf(gg);
    const extra = gg.km&&gg.litros ? `${gg.km} km · ${gg.litros} L` : (gg.data?dataBR(gg.data):"");
    return `<div class="gasto">
      <div class="cat-ic">${catIcon(gg.categoria)}</div>
      <div class="g-t"><b>${gg.desc||gg.categoria}</b><span>${gg.categoria}${extra?" · "+extra:""}</span></div>
      <div class="g-v">${brl(gg.valor)}</div>
      <div class="g-acoes">
        <button class="ico-btn edit" title="Editar" onclick="editarGasto(${idx})">${IC_LAPIS}</button>
        <button class="ico-btn del" title="Excluir" onclick="pedirExcluirGasto(${idx})">${IC_LIXEIRA}</button>
      </div>
    </div>`;
  }).join("") : `<p class="empty">Nenhum lançamento ainda.<br>Toque em <b>Registrar gasto</b> acima.</p>`;
}

/* excluir com confirmação */
function pedirExcluirGasto(i){
  const gg=S.gastos[i]; if(!gg) return;
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Excluir lançamento?</h3>
    <p class="hint">Esta ação não pode ser desfeita.</p>
    <div class="card flat" style="margin-top:12px;background:var(--card-2)">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="cat-ic">${catIcon(gg.categoria)}</div>
        <div style="flex:1"><b>${gg.desc||gg.categoria}</b>
          <div class="hint">${gg.categoria}${gg.data?(" · "+dataBR(gg.data)):""}</div></div>
        <b>${brl(gg.valor)}</b>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn sec" style="flex:1" onclick="fecharModal()">Cancelar</button>
      <button class="btn" style="flex:1;background:var(--danger);color:#fff" onclick="confirmarExcluirGasto(${i})">Excluir</button>
    </div>`);
}
function confirmarExcluirGasto(i){ S.gastos.splice(i,1); salvar(); fecharModal(); renderGastos(); renderResumo(); toast("Lançamento excluído"); }

/* editar lançamento (gasto comum OU abastecimento) */
function editarGasto(i){
  const gg=S.gastos[i]; if(!gg) return;
  const ehAbast = (gg.km!==undefined || gg.litros!==undefined);
  const opts=S.categorias.map(c=>`<option value="${c}"${c===gg.categoria?" selected":""}>${catIcon(c)} ${c}</option>`).join("");
  let campos = `
    <label class="fld">Descrição</label><input id="ed-desc" value="${(gg.desc||'').replace(/"/g,'&quot;')}">
    <div class="row2">
      <div><label class="fld">Valor (R$)</label><input id="ed-valor" type="number" inputmode="decimal" value="${gg.valor}"></div>
      <div><label class="fld">Categoria</label><select id="ed-cat">${opts}</select></div>
    </div>
    <label class="fld">Data</label><input id="ed-data" type="date" value="${gg.data||''}">`;
  if(ehAbast){
    campos += `
    <div class="row2">
      <div><label class="fld">KM rodados</label><input id="ed-km" type="number" inputmode="decimal" value="${gg.km||''}"></div>
      <div><label class="fld">Litros</label><input id="ed-lt" type="number" inputmode="decimal" value="${gg.litros||''}"></div>
    </div>`;
  }
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Editar lançamento</h3>
    ${campos}
    <button class="btn" onclick="salvarEdicaoGasto(${i})">Salvar alterações</button>`);
}
function salvarEdicaoGasto(i){
  const gg=S.gastos[i]; if(!gg) return;
  const valor=Number($("#ed-valor").value)||0;
  if(valor<=0){ toast("Informe um valor"); return; }
  gg.desc=$("#ed-desc").value.trim();
  gg.valor=valor;
  gg.categoria=$("#ed-cat").value;
  gg.data=$("#ed-data").value;
  const ekm=document.querySelector("#ed-km"), elt=document.querySelector("#ed-lt");
  if(ekm) gg.km=Number(ekm.value)||0;
  if(elt) gg.litros=Number(elt.value)||0;
  salvar(); fecharModal(); renderGastos(); renderResumo(); toast("Lançamento atualizado");
}

function modalGasto(){
  const opts=S.categorias.map(c=>`<option value="${c}">${catIcon(c)} ${c}</option>`).join("");
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>Registrar gasto</h3>
    <label class="fld">Descrição</label><input id="gx-desc" placeholder="Ex.: Almoço em Salta" autofocus>
    <div class="row2">
      <div><label class="fld">Valor (R$)</label><input id="gx-valor" type="number" inputmode="decimal"></div>
      <div><label class="fld">Categoria</label><select id="gx-cat">${opts}</select></div>
    </div>
    <label class="fld">Data</label><input id="gx-data" type="date" value="2027-10-02">
    <button class="btn" onclick="salvarGasto()">Salvar gasto</button>`);
}
function salvarGasto(){
  const valor=Number($("#gx-valor").value)||0; if(valor<=0){toast("Informe um valor");return;}
  S.gastos.push({desc:$("#gx-desc").value.trim(),valor,categoria:$("#gx-cat").value,data:$("#gx-data").value});
  salvar(); fecharModal(); renderGastos(); renderResumo(); toast("Gasto registrado");
}
function modalAbast(){
  abrirModal(`<button class="close" onclick="fecharModal()">×</button>
    <h3>⛽ Abastecimento</h3>
    <p class="hint">Informe os km rodados desde o último abastecimento e os litros colocados. O app calcula o consumo real.</p>
    <div class="row2">
      <div><label class="fld">KM rodados</label><input id="ab-km" type="number" inputmode="decimal"></div>
      <div><label class="fld">Litros</label><input id="ab-lt" type="number" inputmode="decimal"></div>
    </div>
    <label class="fld">Valor pago (R$)</label><input id="ab-val" type="number" inputmode="decimal">
    <label class="fld">Local / data</label><input id="ab-data" type="date" value="2027-10-02">
    <button class="btn" onclick="salvarAbast()">Salvar abastecimento</button>`);
}
function salvarAbast(){
  const km=Number($("#ab-km").value)||0, lt=Number($("#ab-lt").value)||0, val=Number($("#ab-val").value)||0;
  if(lt<=0){toast("Informe os litros");return;}
  S.gastos.push({desc:"Abastecimento",valor:val,categoria:"Combustível",data:$("#ab-data").value,km,litros:lt});
  salvar(); fecharModal(); renderGastos(); renderResumo();
  const cm=km>0?(km/lt).toFixed(1):null; toast(cm?`Consumo: ${cm} km/l`:"Abastecimento salvo");
}

/* ============================================================
   VIEW CHECKLISTS
   ============================================================ */
function renderChecks(){
  if(!S.checkState) S.checkState={};
  $("#lista-checks").innerHTML = Object.entries(S.checklists).map(([grupo,itens])=>{
    const feitos=itens.filter(it=>S.checkState[grupo+"|"+it]).length;
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b>${grupo}</b><span class="hint">${feitos}/${itens.length}</span></div>
      <div style="margin-top:8px">
        ${itens.map(it=>{const k=grupo+"|"+it;const c=S.checkState[k];return `
          <div class="parada ${c?'done':''}">
            <input type="checkbox" ${c?'checked':''} onchange="toggleCheck('${encodeURIComponent(k)}')">
            <span class="nome">${it}</span></div>`;}).join("")}
      </div></div>`;
  }).join("");
}
function toggleCheck(k){ k=decodeURIComponent(k); S.checkState[k]=!S.checkState[k]; salvar(); renderChecks(); }

/* ============================================================
   VIEW AJUSTES + BACKUP
   ============================================================ */
function renderAjustes(){
  garantirMoto();
  const m=APP.moto||{};
  const set=(id,v)=>{ const el=document.querySelector(id); if(el) el.value=v??""; };
  set("#moto-marca", m.marca);
  set("#moto-modelo", m.modelo);
  set("#moto-placa", m.placa);
  set("#moto-consumo", m.consumo);
}

const _bmoto=document.querySelector("#btn-salvar-moto");
if(_bmoto) _bmoto.onclick=()=>{
  garantirMoto();
  APP.moto.marca=$("#moto-marca").value.trim();
  APP.moto.modelo=$("#moto-modelo").value.trim();
  APP.moto.placa=$("#moto-placa").value.trim().toUpperCase();
  APP.moto.consumo=Number($("#moto-consumo").value)||18;
  salvar(); render(); toast("Dados da moto salvos");
};
$("#btn-export").onclick=()=>{
  const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="atacama2027_backup.json"; a.click(); toast("Backup exportado");
};
$("#btn-import").onclick=()=>$("#file-import").click();
$("#file-import").onchange=e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ S=JSON.parse(r.result); salvar(); render(); toast("Backup importado"); }catch(err){ toast("Arquivo inválido"); } };
  r.readAsText(f);
};
$("#btn-reset").onclick=()=>{
  confirmar("Restaurar dados de fábrica?",
    "Todas as suas viagens, gastos e edições serão apagados e o app voltará ao estado original. Esta ação não pode ser desfeita.",
    "Restaurar tudo",
    ()=>{ store.del(KEY); APP=carregarApp(); S=viagemAtiva(); _map=null; render(); toast("Dados restaurados"); });
};

/* botões add */
const _bnv=document.querySelector("#btn-nova-viagem"); if(_bnv) _bnv.onclick=formNovaViagem;
$("#btn-add-etapa").onclick=addEtapaNova;
$("#btn-add-gasto").onclick=modalGasto;
$("#btn-add-abast").onclick=modalAbast;


/* ============================================================
   VIEW MAPA (Leaflet + OpenStreetMap)
   ============================================================ */
let _map=null, _layerRota=null, _layerDest=null, _layerParadas=null, _mostrarParadas=true;

function initMapa(){
  if(_map || typeof L==="undefined") return;
  _map = L.map("mapa", {zoomControl:true, attributionControl:true}).setView([-25,-63], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:18, attribution:"© OpenStreetMap"
  }).addTo(_map);
  _layerRota=L.layerGroup().addTo(_map);
  // agrupa marcadores próximos (clustering) quando o plugin está disponível;
  // cai para layerGroup simples se não carregou (ex.: offline sem o plugin)
  const temCluster = (typeof L.markerClusterGroup === "function");
  _layerDest = temCluster
    ? L.markerClusterGroup({ maxClusterRadius:45, showCoverageOnHover:false, spiderfyOnMaxZoom:true })
    : L.layerGroup();
  _layerParadas = temCluster
    ? L.markerClusterGroup({ maxClusterRadius:40, showCoverageOnHover:false })
    : L.layerGroup();
  _map.addLayer(_layerDest);
  _map.addLayer(_layerParadas);
  desenharMapa();
}

function desenharMapa(){
  if(!_map) return;
  _layerRota.clearLayers(); _layerDest.clearLayers(); _layerParadas.clearLayers();

  // pontos da rota, na ordem das etapas, usando coordenadas por id
  const pts=[]; const bounds=[];
  pts.push(COORD_ORIGEM); bounds.push(COORD_ORIGEM);

  S.etapas.forEach((e,i)=>{
    const c = COORD_DESTINOS[e.id] || COORD_DESTINOS[e.dia];
    if(c){
      pts.push(c); bounds.push(c);
      const icon=L.divIcon({className:"", html:`<div class="pin-num">${i+1}</div>`, iconSize:[28,28], iconAnchor:[14,14]});
      const md=L.marker(c,{icon})
        .bindPopup(`<b>${e.dia} · ${e.destino}</b><br>${dataBR(e.data)} · ${e.km} km · ${paisNome(e.pais)}<br>🏨 ${e.hotel||"—"}`);
      _layerDest.addLayer(md);
    }
    // paradas desta etapa
    (e.paradas||[]).forEach(p=>{
      const pc = COORD_PARADAS[p.nome];
      if(pc){
        const icon=L.divIcon({className:"", html:`<div class="pin-stop"></div>`, iconSize:[18,18], iconAnchor:[9,9]});
        const m=L.marker(pc,{icon}).bindPopup(`<b>📍 ${p.nome}</b><br>Parada · ${e.dia}`);
        _layerParadas.addLayer(m); bounds.push(pc);
      }
    });
  });

  // linha da rota
  L.polyline(pts, {color:"#ff6b35", weight:3, opacity:.85}).addTo(_layerRota);

  if(_mostrarParadas){ if(!_map.hasLayer(_layerParadas)) _map.addLayer(_layerParadas); }
  else { _map.removeLayer(_layerParadas); }

  _map._bounds = bounds;
  fitMapa();
}

function fitMapa(){
  if(_map && _map._bounds && _map._bounds.length){
    _map.fitBounds(_map._bounds, {padding:[30,30]});
    setTimeout(()=>_map.invalidateSize(),150);
  }
}

/* integra com a navegação: quando abrir a aba Mapa, inicializa/atualiza */
function aoAbrirView(view){
  if(view==="mapa"){
    setTimeout(()=>{ initMapa(); if(_map){ _map.invalidateSize(); desenharMapa(); } }, 60);
  }
}



/* botões do mapa */
const _bFit=document.querySelector("#btn-fit"); if(_bFit) _bFit.onclick=fitMapa;
const _bTog=document.querySelector("#btn-toggle-paradas");
if(_bTog) _bTog.onclick=()=>{
  _mostrarParadas=!_mostrarParadas;
  _bTog.textContent = _mostrarParadas ? "📍 Paradas: ON" : "📍 Paradas: OFF";
  desenharMapa();
};

/* ---------- inicializa ---------- */
render();
bootNuvem();
atualizarStatusNuvem();
