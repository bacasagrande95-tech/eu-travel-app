



const CATS=[
 {k:'data',     i:'data',     l:'Só nesta data'},
 {k:'arte',     i:'arte',     l:'Arte e museus'},
 {k:'historia', i:'historia', l:'História e memória'},
 {k:'bairro',   i:'bairro',   l:'Bairros e caminhada'},
 {k:'natureza', i:'natureza', l:'Trilhas e natureza'},
 {k:'noturno',  i:'noturno',  l:'Noturno e vistas'},
 {k:'balada',   i:'balada',   l:'Balada e música ao vivo'},
 {k:'comida',   i:'comida',   l:'Comida e bebida'},
 {k:'compras',  i:'compras',  l:'Compras e mercados'},
 {k:'palco',    i:'palco',    l:'Palco, ópera e concertos'},
 {k:'unica',    i:'unica',    l:'Experiência única'},
 {k:'batevolta',i:'batevolta',l:'Bate-volta de um dia'}
];
const RATES=[{k:'must',l:'Quero muito'},{k:'want',l:'Quero'},{k:'maybe',l:'Talvez'},{k:'no',l:'Passo'}];
const CITY={berlin:'Berlim',paris:'Paris',colonia:'Colônia'};
const KEY='europa-nov2026-v1';
const PKEY='europa-nov2026-plan-v1';
const CKEY='europa-nov2026-gavetas-v1';
const PROFKEY='europa-nov2026-perfis-v1';

/* ---------- perfis: cada pessoa guarda a propria selecao ---------- */
const PEOPLE=[
  {k:'bruno',n:'Bruno',c:'--accent',       f:'img/pessoas/bruno.jpg'},
  {k:'lucas',n:'Lucas',c:'--t-violet-ink', f:'img/pessoas/lucas.jpg'}
];
let store={active:'bruno',people:{}};
let who='bruno';
function profVazio(){return {state:{},plan:{},gavetas:{berlin:[],paris:[],colonia:[]}};}
/* Os dados antigos guardavam o passeio como "i0", "i1"... pela posição no
   catálogo. Agora cada passeio tem id próprio (slug), então o que já está
   salvo é convertido uma vez. Roda também no que vem de JSON importado. */
const IDLEGADO={};
DATA.forEach((it,i)=>{IDLEGADO['i'+i]=it.id;});
const idAtual=k=>IDLEGADO[k]||k;
function migraIds(o){
  const novo={};
  Object.keys(o||{}).forEach(k=>{novo[idAtual(k)]=o[k];});
  return novo;
}
function migraPlano(p){
  const novo={};
  Object.keys(p||{}).forEach(k=>{
    const l=p[k];
    novo[k]=(Array.isArray(l)?l:[]).map(idAtual);
  });
  return novo;
}
function profLoad(){
  try{const raw=localStorage.getItem(PROFKEY);if(raw)store=JSON.parse(raw)||store;}catch(e){}
  if(!store||typeof store!=='object'||Array.isArray(store))store={active:'bruno',people:{}};
  if(!store.people||typeof store.people!=='object')store.people={};
  /* primeira vez: os dados que ja existiam viram o perfil do Bruno */
  if(!store.people.bruno&&!store.people.lucas){
    const velho=profVazio();
    try{const a=localStorage.getItem(KEY);if(a)velho.state=JSON.parse(a)||{};}catch(e){}
    try{const b=localStorage.getItem(PKEY);if(b)velho.plan=JSON.parse(b)||{};}catch(e){}
    try{
      const c=localStorage.getItem(CKEY);
      if(c){const o=JSON.parse(c)||{};['berlin','paris','colonia'].forEach(x=>{velho.gavetas[x]=o[x]||[];});}
    }catch(e){}
    store.people.bruno=velho;
  }
  PEOPLE.forEach(p=>{
    if(!store.people[p.k])store.people[p.k]=profVazio();
    const d=store.people[p.k];
    d.state=migraIds(d.state||{});
    d.plan=migraPlano(d.plan||{});
  });
  who=PEOPLE.some(p=>p.k===store.active)?store.active:'bruno';
  store.active=who;
  /* grava sempre: a conversão de id precisa ficar registrada */
  try{localStorage.setItem(PROFKEY,JSON.stringify(store));}catch(e){}
}
function colToObj(){const o={};['berlin','paris','colonia'].forEach(c=>{o[c]=Array.from(collapsed[c]);});return o;}
function profGrava(){
  store.active=who;
  store.people[who]={state:state,plan:plan,gavetas:colToObj()};
}
function profSalva(){profGrava();try{localStorage.setItem(PROFKEY,JSON.stringify(store));}catch(e){}}
profLoad();

/* ---------- estado ---------- */
let state=store.people[who].state||{};
function save(){profSalva();nuvemMudou();}
if(DATA.some(it=>!it.id)) throw new Error('passeio sem id no catalogo');

const ui={};
['berlin','paris','colonia'].forEach(c=>{ui[c]={q:'',cats:new Set(),tags:new Set(),sort:'cat'};});
const rendered={};
let cur='berlin';

/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const $$=s=>Array.prototype.slice.call(document.querySelectorAll(s));
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ic(name,cls){return '<svg class="ic '+(cls||'')+'"><use href="#i-'+name+'"/></svg>';}
function catOf(k){for(let i=0;i<CATS.length;i++){if(CATS[i].k===k)return CATS[i];}return {i:'unica',l:k};}
/* cor de cada etiqueta: agrupa por natureza, nao por etiqueta solta */
const TAGC={
  'imperdível':'star','ícone':'star','único':'star',
  'grátis':'good','gratuito':'good','barato':'good','fácil':'good','acessível':'good','fácil de entrar':'good','sem caminhar':'good',
  'trilha':'good','natureza':'good','ao ar livre':'good','jardim':'good','parque':'good','campo':'good','praia':'good',
  'verificar':'warn','aviso':'warn','evitar':'warn','armadilha':'warn','fechado':'warn','obras':'warn','fila':'warn','segurança':'warn','regras':'warn',
  'reservar':'warm','agendar':'warm','dresscode':'warm','luxo':'warm','comida':'warm','cerveja':'warm','vinho':'warm','café':'warm',
  'mercado':'warm','doce':'warm','brunch':'warm','vegetariano':'warm','vegano':'warm','asiático':'warm','tradição':'warm',
  'noite':'night','madrugada':'night','pôr do sol':'night','bar':'night','coquetel':'night','jazz':'night','cinema':'night',
  'chuva':'blue','água':'blue','rio':'blue','mar':'blue','porto':'blue','esporte':'blue','bicicleta':'blue',
  'skate':'blue','escalada':'blue','relaxar':'blue','spa':'blue',
  'arte':'violet','museu':'violet','arquitetura':'violet','design':'violet','fotografia':'violet','erudito':'violet',
  'livros':'violet','vitral':'violet','história':'violet','memória':'violet','histórico':'violet','cultura':'violet',
  'político':'violet','religioso':'violet',
  'balada':'pink','techno':'pink','house':'pink','funk':'pink','punk':'pink','shows':'pink','música':'pink',
  'música ao vivo':'pink','dança':'pink','internacional':'pink','world':'pink','indie':'pink','rock':'pink','soul':'pink',
  'tango':'pink','comédia':'pink','teatro':'pink','ópera':'pink','balé':'pink','concerto':'pink','festa':'pink',
  'queer':'pink','gay-friendly':'pink','drag':'pink','experimental':'pink','underground':'pink','alternativo':'pink',
  'imersivo':'pink','interativo':'pink','vinil':'pink'
};
function tagCls(t){return TAGC[t]||'';}
function toast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('on'));
  setTimeout(()=>{t.classList.remove('on');setTimeout(()=>t.remove(),260);},2100);
}

/* ---------- gavetas por categoria ---------- */
const collapsed={berlin:new Set(),paris:new Set(),colonia:new Set()};
function colLe(o){['berlin','paris','colonia'].forEach(c=>{collapsed[c]=new Set((o&&o[c])||[]);});}
colLe(store.people[who].gavetas);
function colSave(){profSalva();}
function colCats(c){return CATS.filter(cat=>DATA.some(it=>it.c===c&&it.k===cat.k));}
function colAll(c,shut){
  colCats(c).forEach(cat=>{shut?collapsed[c].add(cat.k):collapsed[c].delete(cat.k);});
  colSave();renderList(c,false);
}
function colToggle(sec){
  const c=sec.dataset.city,k=sec.dataset.cat;
  const shut=sec.classList.toggle('closed');
  sec.querySelector('.sec-h').setAttribute('aria-expanded',String(!shut));
  if(shut) collapsed[c].add(k); else collapsed[c].delete(k);
  colSave();
  secAllBtn();
  if(reduce) return;
  const body=sec.querySelector('.sec-body');
  const end=body.getBoundingClientRect().height;
  const start=shut?body.scrollHeight:0;
  if(!body.animate) return;
  body.animate([{height:start+'px'},{height:end+'px'}],
    {duration:290,easing:'cubic-bezier(.16,1,.3,1)'});
  if(!shut) setTimeout(()=>revealInView(sec),60);
}

/* ---------- render: lista ---------- */
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let io=null,fbTimer=null;
function revealNow(root){
  const rows=Array.prototype.slice.call(root.querySelectorAll('.row'));
  rows.forEach(r=>r.classList.add('in'));
  checkClamp(rows);
}
/* rede de seguranca: nada pode ficar invisivel por causa de animacao */
function revealInView(root){
  const h=window.innerHeight||900;
  Array.prototype.slice.call(root.querySelectorAll('.row')).forEach(r=>{
    if(r.classList.contains('in')) return;
    const b=r.getBoundingClientRect();
    if(b.top<h*1.4) r.classList.add('in');
  });
}
function observeRows(root){
  if(io) io.disconnect();
  clearTimeout(fbTimer);
  const rows=Array.prototype.slice.call(root.querySelectorAll('.row'));
  if(reduce||typeof IntersectionObserver==='undefined'){revealNow(root);return;}
  io=new IntersectionObserver((en,obs)=>{
    let n=0;
    en.forEach(e=>{
      if(!e.isIntersecting) return;
      const r=e.target;
      r.style.transitionDelay=Math.min(n,7)*26+'ms';
      r.classList.add('in');n++;
      obs.unobserve(r);
    });
    if(n){
      const batch=en.map(e=>e.target);
      setTimeout(()=>{
        batch.forEach(r=>{r.style.transitionDelay='';});
        checkClamp(batch);
      },420);
    }
  },{rootMargin:'0px 0px -6% 0px',threshold:.01});
  rows.forEach(r=>io.observe(r));
  fbTimer=setTimeout(()=>{revealInView(root);checkClamp(rows);},1500);
}
function checkClamp(rows){
  rows.forEach(r=>{
    if(!r || !r.querySelector) return;
    const w=r.querySelector('.r-why'); if(!w) return;
    if(w.classList.contains('open')) return;
    if(w.scrollHeight-w.clientHeight>2 && !r.querySelector('.r-more')){
      const b=document.createElement('button');
      b.className='r-more';b.type='button';
      b.innerHTML='Ler tudo'+ic('seta','ic-s');
      b.setAttribute('aria-expanded','false');
      w.parentNode.insertBefore(b,w.nextSibling);
    }
  });
}

/* ---------- quem gostou de quê ----------
   Devolve as pessoas que marcaram aquele nível naquele passeio. A pessoa
   da vez sai do estado vivo; a outra, do perfil guardado dela. */
function quemMarcou(id,nivel){
  return PEOPLE.filter(p=>{
    const st=(p.k===who)?state:(((store.people||{})[p.k]||{}).state||{});
    const s=st[id];
    return !!s&&s.r===nivel;
  });
}
/* A bolinha: a foto, se já existir em img/pessoas/, e por baixo a inicial
   na cor da pessoa — é o que aparece enquanto a foto não chega. Quando o
   arquivo não existe, o navegador avisa e a imagem sai, deixando a letra. */
function avaHTML(p){
  const foto=p.f?'<img src="'+p.f+'" alt="" loading="lazy" decoding="async">':'';
  return '<span class="ava" style="--pc:var('+p.c+')" title="'+esc(p.n)+'">'
    +foto+'<b>'+esc(p.n.charAt(0))+'</b></span>';
}
function quemHTML(id,nivel){
  const g=quemMarcou(id,nivel);
  return g.length?g.map(avaHTML).join(''):'';
}
/* Redesenha as bolinhas de uma linha depois de uma marcação mudar. */
function avatares(row,id){
  row.querySelectorAll('.step').forEach(b=>{
    const w=b.querySelector('.who');
    if(!w)return;
    w.innerHTML=quemHTML(id,b.dataset.r);
    b.classList.toggle('tem-gente',!!w.firstChild);
  });
}

function rowHTML(it){
  const s=state[it.id]||{};
  const c=catOf(it.k);
  const tags=(it.t||[]).map(t=>'<button class="tag '+tagCls(t)+'" data-tag="'+esc(t)+'">'+(t==='verificar'?'⚠ verificar':esc(t))+'</button>').join('');
  const meta=[it.a,it.d,it.p].filter(Boolean).join('<i>·</i>');
  const steps=RATES.map(r=>{
    const quem=quemHTML(it.id,r.k);
    return '<button class="step'+(quem?' tem-gente':'')+'" data-r="'+r.k+'" aria-pressed="'+(s.r===r.k?'true':'false')+'">'
      +'<span class="step-t">'+r.l+'</span><span class="who">'+quem+'</span></button>';
  }).join('');
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((it.o||it.n)+', '+(it.a||'')+', '+(CITY[it.c]||''));
  return '<article class="row" data-id="'+it.id+'" data-st="'+(s.r||'')+'">'
   +'<span class="swatch" aria-hidden="true"></span>'
   +'<div class="r-body">'
     +'<div class="r-head">'
       +'<h3 class="r-title">'+esc(it.n)+(it.o?' <span class="r-org">'+esc(it.o)+'</span>':'')+'</h3>'
       +'<div class="r-meta">'+meta+'</div>'
     +'</div>'
     +'<p class="r-why">'+it.w+'</p>'
     +'<div class="r-foot">'
       +'<div class="tags">'+tags+'</div>'
     +'<div class="r-act">'
       +'<div class="steps" role="group" aria-label="Interesse">'+steps+'</div>'
       +'<div class="ricons">'
       +'<button class="mini pbtn'+(inPlan(it.id)?' in':'')+'" type="button" title="'+(inPlan(it.id)?'Tirar do roteiro':'Adicionar ao roteiro')+'" aria-label="'+(inPlan(it.id)?'Tirar do roteiro':'Adicionar ao roteiro')+'">'+ic('data','ic-s')+'</button>'
       +'<a class="mini" href="'+maps+'" target="_blank" rel="noopener" title="Abrir no mapa" aria-label="Abrir no mapa">'+ic('pin','ic-s')+'</a>'
       +'<button class="mini nbtn'+(s.n?' has':'')+'" type="button" title="Anotação" aria-label="Anotação">'+ic('nota','ic-s')+'</button>'
       +'</div>'
       +'</div>'
     +'</div>'
     +'<textarea class="note'+(s.n?' show':'')+'" placeholder="Por que te chamou atenção — ou por que não">'+esc(s.n||'')+'</textarea>'
   +'</div></article>';
}
function pass(it,c){
  const u=ui[c];
  if(!u) return true;
  if(u.cats.size && !u.cats.has(it.k)) return false;
  if(u.tags.size){const t=it.t||[];for(const x of u.tags){if(t.indexOf(x)<0)return false;}}
  if(u.q){
    const q=u.q.toLowerCase();
    const hay=(it.n+' '+(it.o||'')+' '+(it.a||'')+' '+(it.w||'')+' '+(it.t||[]).join(' ')).toLowerCase();
    if(hay.indexOf(q)<0) return false;
  }
  return true;
}
function renderList(c,animate){
  const all=DATA.filter(it=>it.c===c);
  const shown=all.filter(it=>pass(it,c));
  const box=document.getElementById('list-'+c);
  const u=ui[c];
  if(!shown.length){
    box.innerHTML='<p class="empty">Nenhum passeio com esses filtros.</p>';counts();return;
  }
  let html='';
  const filtering=!!(u.q||u.cats.size||u.tags.size);
  if(u.sort==='cat'){
    CATS.forEach(cat=>{
      const items=shown.filter(it=>it.k===cat.k);
      if(!items.length) return;
      const shut=!filtering&&collapsed[c].has(cat.k);
      html+='<section class="sec'+(shut?' closed':'')+'" data-city="'+c+'" data-cat="'+cat.k+'" style="--cat:var(--k-'+cat.k+')">'
           +'<button class="sec-h" type="button" aria-expanded="'+(shut?'false':'true')+'">'
             +ic(cat.i,'ic-s')+'<span class="sec-l">'+cat.l+'</span><span class="c">'+items.length+'</span>'+ic('seta','ic-s chev')
           +'</button>'
           +'<div class="sec-body"><div>'+items.map(rowHTML).join('')+'</div></div>'
           +'</section>';
    });
  }else{
    let arr=shown.slice();
    if(u.sort==='name') arr.sort((a,b)=>a.n.localeCompare(b.n,'pt'));
    if(u.sort==='area') arr.sort((a,b)=>(a.a||'').localeCompare(b.a||'','pt')||a.n.localeCompare(b.n,'pt'));
    if(u.sort==='mark'){
      const w={must:0,want:1,maybe:2,no:3};
      arr.sort((a,b)=>{
        const ra=state[a.id]&&state[a.id].r?w[state[a.id].r]:9;
        const rb=state[b.id]&&state[b.id].r?w[state[b.id].r]:9;
        return ra-rb||a.n.localeCompare(b.n,'pt');
      });
    }
    const lab={mark:'Meus marcados primeiro',name:'Nome (A–Z)',area:'Bairro'}[u.sort]||'Todos os passeios';
    html='<section class="sec" style="--cat:var(--accent)">'
        +'<div class="sec-h static">'+ic('unica','ic-s')+'<span class="sec-l">'+lab+'</span><span class="c">'+shown.length+'</span></div>'
        +'<div class="sec-body"><div>'+arr.map(rowHTML).join('')+'</div></div></section>';
  }
  box.innerHTML=html;
  if(animate) observeRows(box); else revealNow(box);
  counts();fsum();
}

/* ---------- interacoes das linhas ---------- */
/* A foto de alguém pode ainda não existir: quando o arquivo não carrega,
   a imagem sai da bolinha e sobra a inicial na cor da pessoa. */
document.addEventListener('error',e=>{
  const t=e.target;
  if(t&&t.tagName==='IMG'&&t.parentNode&&t.parentNode.classList.contains('ava'))t.remove();
},true);

function bindRows(box){
  box.addEventListener('click',e=>{
    const sh=e.target.closest('.sec-h');
    if(sh&&!sh.classList.contains('static')){
      const sec=sh.closest('.sec');
      if(sec) colToggle(sec);
      return;
    }
    const st=e.target.closest('.step');
    if(st){
      const row=st.closest('.row'),id=row.dataset.id,s=state[id]||{};
      if(s.r===st.dataset.r) delete s.r; else s.r=st.dataset.r;
      if(!s.r&&!s.n) delete state[id]; else state[id]=s;
      save();
      row.dataset.st=s.r||'';
      row.querySelectorAll('.step').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.r===s.r)));
      avatares(row,id);
      const sw=row.querySelector('.swatch');
      if(!reduce){sw.classList.add('pop');setTimeout(()=>sw.classList.remove('pop'),230);}
      counts();return;
    }
    const pb=e.target.closest('.pbtn');
    if(pb){
      const row=pb.closest('.row'),id=row.dataset.id,it=byId[id];
      if(inPlan(id)){unplan(id);toast('Fora do roteiro');renderPlan();}
      else{addToPlan(it);renderPlan();}
      return;
    }
    const tg=e.target.closest('.tag');
    if(tg){
      const t=tg.dataset.tag,u=ui[cur];
      if(u.tags.has(t)) u.tags.delete(t); else u.tags.add(t);
      renderChips(cur);renderList(cur);return;
    }
    const nb=e.target.closest('.nbtn');
    if(nb){
      const row=nb.closest('.row'),t=row.querySelector('.note');
      const showing=t.classList.toggle('show');
      if(showing) t.focus();
      return;
    }
    const mr=e.target.closest('.r-more');
    if(mr){
      const w=mr.previousElementSibling;
      const open=w.classList.toggle('open');
      mr.classList.toggle('open',open);
      mr.setAttribute('aria-expanded',String(open));
      mr.firstChild.nodeValue=open?'Mostrar menos':'Ler tudo';
      return;
    }
    const wh=e.target.closest('.r-why');
    if(wh){
      const mr=wh.nextElementSibling;
      if(mr&&mr.classList.contains('r-more')) mr.click();
    }
  },{passive:true});
  box.addEventListener('input',e=>{
    const t=e.target.closest('.note'); if(!t) return;
    const row=t.closest('.row'),id=row.dataset.id;
    clearTimeout(t._tm);
    t._tm=setTimeout(()=>{
      const s=state[id]||{};
      if(t.value.trim()) s.n=t.value.trim(); else delete s.n;
      if(!s.r&&!s.n) delete state[id]; else state[id]=s;
      save();
      const b=row.querySelector('.nbtn');
      b.classList.toggle('has',!!s.n);
      if(!s.n && !t.classList.contains('show')) t.classList.remove('show');
    },420);
  });
  box.addEventListener('focusout',e=>{
    const t=e.target.closest('.note');
    if(t && !t.value.trim() && !(state[t.closest('.row').dataset.id]||{}).n) t.classList.remove('show');
  });
}

/* ---------- chips e resumo de filtro ---------- */
function hotTags(c){
  const m={};
  DATA.filter(x=>x.c===c).forEach(x=>(x.t||[]).forEach(t=>m[t]=(m[t]||0)+1));
  return Object.keys(m).filter(t=>m[t]>=3).sort((a,b)=>m[b]-m[a]).slice(0,16);
}
function renderChips(c){
  const u=ui[c];
  const cat=document.getElementById('cats');
  if(cat && cat.dataset.city!==c){
    cat.dataset.city=c;
    cat.innerHTML=CATS.filter(x=>DATA.some(it=>it.c===c&&it.k===x.k))
      .map(x=>'<button class="chip" data-cat="'+x.k+'">'+ic(x.i,'ic-s')+x.l+'</button>').join('');
  }
  const tg=document.getElementById('tags');
  if(tg && tg.dataset.city!==c){
    tg.dataset.city=c;
    tg.innerHTML=hotTags(c).map(t=>'<button class="chip" data-tg="'+esc(t)+'">'+esc(t)+'</button>').join('');
  }
  if(cat) cat.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',u.cats.has(b.dataset.cat)));
  if(tg) tg.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',u.tags.has(b.dataset.tg)));
  $('#dot-filtro').parentNode.classList.toggle('act',u.cats.size>0||u.tags.size>0);
}
function fsum(){
  const u=ui[cur],p=[];
  u.cats.forEach(k=>p.push(catOf(k).l));
  u.tags.forEach(t=>p.push('#'+t));
  if(u.q) p.push('“'+u.q+'”');
  const el=$('#fsum');
  if(!p.length || ['fontes','gostos','roteiro'].indexOf(cur)>=0){el.classList.remove('show');el.innerHTML='';return;}
  el.innerHTML='<b>Filtros ativos</b> '+p.map(esc).join(' · ')+' <button class="tbtn" id="fsum-x" style="margin-left:auto">Limpar</button>';
  el.classList.add('show');
  const x=$('#fsum-x'); if(x) x.onclick=clearFilters;
}
function clearFilters(){
  const u=ui[cur]; if(!u) return;
  u.cats.clear();u.tags.clear();u.q='';u.sort='cat';
  $('#q').value='';$('#q-x').hidden=true;$('#sort').value='cat';
  renderChips(cur);renderList(cur,false);
}

/* ---------- contadores ---------- */
function counts(){
  ['berlin','paris','colonia'].forEach(c=>{
    const list=DATA.filter(it=>it.c===c);
    const strong=list.filter(it=>state[it.id]&&(state[it.id].r==='must'||state[it.id].r==='want')).length;
    const el=document.getElementById('n-'+c);
    if(el) el.textContent=strong?' '+strong:'';
  });
  const list=DATA.filter(it=>it.c===cur);
  const shown=list.filter(it=>pass(it,cur)).length;
  const done=list.filter(it=>state[it.id]&&state[it.id].r).length;
  const box=document.querySelector('#list-'+cur+' .row-tools');
  const lab='<b>'+shown+'</b> de '+list.length+' passeios · <b>'+done+'</b> marcados';
  if(box) box.querySelector('.n').innerHTML=lab;
  else{
    const l=document.getElementById('list-'+cur);
    if(l && !l.querySelector('.empty')) l.insertAdjacentHTML('afterbegin',
      '<div class="row-tools"><span class="n">'+lab+'</span><button class="tbtn" id="sec-all" type="button"></button></div>');
  }
  secAllBtn();
  stats();
  countTab();
}
function secAllBtn(){
  const b=document.getElementById('sec-all');if(!b)return;
  const cats=colCats(cur);
  if(!cats.length){b.hidden=true;return;}
  b.hidden=false;
  const open=cats.filter(cat=>!collapsed[cur].has(cat.k)).length;
  b.textContent=open?'Recolher tudo':'Abrir tudo';
  b.dataset.shut=open?'1':'0';
}
function stats(){
  let m=0,w=0,y=0,n=0,notes=0;
  DATA.forEach(it=>{const s=state[it.id];if(!s)return;if(s.r==='must')m++;if(s.r==='want')w++;if(s.r==='maybe')y++;if(s.r==='no')n++;if(s.n)notes++;});
  const marked=DATA.filter(it=>state[it.id]&&state[it.id].r).length;
  $('#stats').innerHTML=
     cell(marked+'/'+DATA.length,'itens avaliados')+cell(m,'quero muito')+cell(w,'quero')+cell(y,'talvez')+cell(n,'passo')+cell(notes,'com nota');
  const rows=[];
  ['berlin','paris','colonia'].forEach(c=>{
    const l=DATA.filter(it=>it.c===c),d=l.filter(it=>state[it.id]&&state[it.id].r).length;
    rows.push(barHTML(CITY[c],d,l.length));
  });
  CATS.forEach(c=>{
    const l=DATA.filter(it=>it.k===c.k);if(!l.length)return;
    const d=l.filter(it=>state[it.id]&&state[it.id].r).length;
    if(d) rows.push(barHTML(c.l,d,l.length));
  });
  $('#bars').innerHTML=rows.join('');
  requestAnimationFrame(()=>$$('.bar i').forEach(i=>i.style.width=i.dataset.w+'%'));
}
function cell(v,l){return '<div><div class="v">'+v+'</div><div class="l">'+l+'</div></div>';}
function barHTML(label,d,t){
  const p=t?Math.round(d*100/t):0;
  return '<div><div class="bar-h"><span>'+label+'</span><b>'+d+' / '+t+' ('+p+'%)</b></div><div class="bar"><i data-w="'+p+'"></i></div></div>';
}

/* ---------- fontes ---------- */
const SRCGROUP=[
  ['berlim',[['of','Berlim — oficial e museus','src-b-of'],['co','Berlim — agenda, arte e noite','src-b-ag'],['co','Berlim — comunidade, trilha e ferramentas','src-b-co']]],
  ['paris',[['of','Paris — oficial e museus','src-p-of'],['co','Paris — agenda, arte e noite','src-p-ag'],['co','Paris — comunidade, trilha e ferramentas','src-p-co']]],
  ['colonia',[['of','Colônia e arredores','src-c']]]
];
function renderSrc(){
  SRCGROUP.forEach(([city,groups])=>{
    const host=document.getElementById('src-'+city);
    if(!host) return;
    let h='';
    groups.forEach(([kind,label,key])=>{
      const list=SRC[key]||[];
      if(!list.length) return;
      h+='<div class="fgroup"><div class="sec-h">'+ic(kind==='of'?'alerta':'bairro','ic-s')+'<h3>'+label+'</h3><span class="c">'+list.length+'</span></div>';
      h+=list.map(([t,name,url,desc])=>{
        const d=url.replace(/^https?:\/\//,'').split('/')[0];
        return '<div class="src"><span class="pill '+(t==='of'?'of':(t==='co'?'co':'mi'))+'">'+(t==='of'?'oficial':(t==='co'?'comunidade':'ferramenta'))+'</span>'
          +'<div class="src-b"><a href="'+url+'" target="_blank" rel="noopener">'+esc(name)+'</a><span class="dom">'+esc(d)+'</span><p>'+esc(desc)+'</p></div></div>';
      }).join('');
      h+='</div>';
    });
    host.innerHTML=h;
  });
  const x=SRC['src-x']||[];
  if(x.length){
    const f=document.getElementById('fatos');
    const sec=document.createElement('div');
    sec.className='fgroup';
    sec.innerHTML='<div class="sec-h">'+ic('bairro','ic-s')+'<h3>Ferramentas que servem para as três cidades</h3><span class="c">'+x.length+'</span></div>'
      +x.map(([t,name,url,desc])=>{
        const d=url.replace(/^https?:\/\//,'').split('/')[0];
        return '<div class="src"><span class="pill '+(t==='of'?'of':(t==='co'?'co':'mi'))+'">'+(t==='of'?'oficial':(t==='co'?'comunidade':'ferramenta'))+'</span>'
          +'<div class="src-b"><a href="'+url+'" target="_blank" rel="noopener">'+esc(name)+'</a><span class="dom">'+esc(d)+'</span><p>'+esc(desc)+'</p></div></div>';
      }).join('');
    f.parentNode.insertBefore(sec,f);
  }
}

/* ---------- exportacao ---------- */
function summary(){
  const L=['VIAGEM EUROPA — NOV 2026 · SELEÇÃO DE '+nomeDe(who).toUpperCase(),
    'gerado em '+new Date().toLocaleString('pt-BR'),''];
  ['berlin','paris','colonia'].forEach(c=>{
    const list=DATA.filter(it=>it.c===c);
    const g={must:[],want:[],maybe:[],no:[]};
    let any=false;
    list.forEach(it=>{const s=state[it.id];if(s&&s.r){g[s.r].push(it);any=true;}});
    L.push('=== '+CITY[c].toUpperCase()+' ('+list.length+' itens no catálogo) ===');
    if(!any){L.push('  (nada avaliado ainda)','');return;}
    [['must','QUERO MUITO'],['want','QUERO'],['maybe','TALVEZ'],['no','PASSO']].forEach(([k,lab])=>{
      if(!g[k].length)return;
      L.push('','  '+lab+' ('+g[k].length+')');
      g[k].forEach(it=>{
        const n=state[it.id]&&state[it.id].n;
        L.push('   - ['+catOf(it.k).l+'] '+it.n+(it.o?' ('+it.o+')':'')+' — '+[it.a,it.d,it.p].filter(Boolean).join(' · ')+(n?'\n       nota: '+n:''));
      });
    });
    L.push('');
  });
  const tot=planTotal();
  L.push('=== ROTEIRO ===');
  if(!tot) L.push('  (nada adicionado ao roteiro ainda)');
  else{
    DAYS.forEach(d=>{
      const ids=(plan[d]||[]).slice();if(!ids.length)return;
      L.push('  '+dd2(DAYNO(d))+'/11 · '+WDL[TRIPMAP[d].wd]+' · '+CLAB[TRIPMAP[d].c]+(TRIPMAP[d].note?' · '+TRIPMAP[d].note:'')+' ('+ids.length+')');
      ids.forEach(id=>{
        const it=byId[id];if(!it)return;
        L.push('    - '+it.n+(it.a?' · '+it.a:'')+(it.d?' · '+it.d:''));
      });
    });
    const pool=(plan['pool']||[]).slice();
    if(pool.length){
      L.push('  SEM DIA DEFINIDO ('+pool.length+')');
      pool.forEach(id=>{const it=byId[id];if(it)L.push('    - '+it.n+(it.a?' · '+it.a:''));});
    }
  }
  L.push('','--- NOTAS ---');
  let has=false;
  DATA.forEach(it=>{const s=state[it.id];if(s&&s.n){has=true;L.push('- '+it.n+': '+s.n);}});
  if(!has) L.push('(nenhuma)');
  return L.join('\n');
}
function payload(){
  return JSON.stringify({v:2,perfil:who,nome:nomeDe(who),quando:new Date().toISOString(),
    state:state,plan:plan},null,1);
}

/* ============================================================
   ROTEIRO — modelo, mes, dia aberto, sem dia definido, arrasto
   ============================================================ */
const WDS=['dom','seg','ter','qua','qui','sex','sáb'];
const WDL=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const CLAB={berlin:'Berlim',paris:'Paris',colonia:'Colônia',voo:'Em viagem'};

const TRIPDATE={1:'voo',2:'colonia',3:'colonia',4:'colonia',5:'colonia',6:'berlin',7:'berlin',
  8:'berlin',9:'berlin',10:'colonia',11:'colonia',12:'colonia',13:'paris',14:'paris',15:'paris',
  16:'paris',17:'colonia',18:'colonia'};
const TRIPNOTE={1:'Voo de ida',2:'Chegada · base',5:'Base até a noite',
  6:'Chegada de madrugada',9:'Fim do trecho · volta à noite',10:'Chegada de manhã',
  11:'Carnaval às 11h11',12:'Saída à noite',13:'Chegada de manhã',
  16:'Fim do trecho · volta à noite',17:'Chegada de manhã',18:'Voo de volta'};
const TRIP=[];
for(let d=1;d<=18;d++){
  const iso='2026-11-'+String(d).padStart(2,'0');
  TRIP.push({d:iso,c:TRIPDATE[d],wd:new Date(2026,10,d).getDay(),note:TRIPNOTE[d]||''});
}
const TRIPMAP={};TRIP.forEach(t=>{TRIPMAP[t.d]=t;});
const DAYS=TRIP.map(t=>t.d);
const DAYSET={};DAYS.forEach(d=>{DAYSET[d]=1;});
const CITYDAYS={};TRIP.forEach(t=>{if(t.c!=='voo')(CITYDAYS[t.c]=CITYDAYS[t.c]||[]).push(t.d);});
const byId={};DATA.forEach(it=>{byId[it.id]=it;});

const DAYNO=d=>+d.slice(8);
const dd2=n=>String(n).padStart(2,'0');
const brDay=d=>dd2(DAYNO(d))+'/11';
/* nome original só quando acrescenta algo: evita repetir o próprio título */
function origOf(it){
  const n=(it.n||'').toLowerCase(),o=it.o||'';
  if(!o)return '';
  const b=o.toLowerCase();
  return (n.indexOf(b)>=0||b.indexOf(n)>=0)?'':o;
}

/* ---- persistencia ---- */
let plan=store.people[who].plan||{};
if(typeof plan!=='object'||plan===null||Array.isArray(plan))plan={};
Object.keys(plan).forEach(k=>{
  if(k!=='pool'&&!DAYSET[k]){delete plan[k];return;}
  plan[k]=(Array.isArray(plan[k])?plan[k]:[]).filter(id=>byId[id]);
  if(!plan[k].length)delete plan[k];
});
function planSave(){profSalva();nuvemMudou();}
function dayOf(id){for(const k in plan){if(plan[k].indexOf(id)>=0)return k;}return null;}
function inPlan(id){return dayOf(id)!==null;}
function planTotal(){let n=0;for(const k in plan)n+=plan[k].length;return n;}
function planTo(id,bucket,index){
  const from=dayOf(id);
  if(from!==null)plan[from].splice(plan[from].indexOf(id),1);
  if(!plan[bucket])plan[bucket]=[];
  const arr=plan[bucket];
  let i=(index===null||index===undefined||isNaN(index))?arr.length:index;
  if(i<0)i=0;if(i>arr.length)i=arr.length;
  arr.splice(i,0,id);
  if(from!==null&&from!==bucket&&!plan[from].length)delete plan[from];
  planSave();
}
function unplan(id){
  const from=dayOf(id);if(from===null)return;
  plan[from].splice(plan[from].indexOf(id),1);
  if(!plan[from].length)delete plan[from];
  planSave();
}

/* ---- datas fixas escritas no proprio item ---- */
function fixedDays(it){
  const s=(it.n||'')+' · '+(it.o||'');
  const out=[];
  const add=v=>{if(v>=1&&v<=30&&out.indexOf(v)<0)out.push(v);};
  let m,re;
  re=/(\d{1,2})\s*(?:a|à|e|–|—|-)\s*(\d{1,2})\s*\/\s*11\b/gi;
  while((m=re.exec(s))){add(+m[1]);add(+m[2]);}
  re=/(\d{1,2})\s*\/\s*11\b/g;
  while((m=re.exec(s)))add(+m[1]);
  re=/(\d{1,2})\s+de\s+novembro/gi;
  while((m=re.exec(s)))add(+m[1]);
  return out;
}
function autoDay(it){
  const ds=fixedDays(it);if(!ds.length)return null;
  const ok=ds.map(n=>'2026-11-'+dd2(n)).filter(d=>DAYSET[d]);
  if(!ok.length)return null;
  const same=ok.filter(d=>TRIPMAP[d].c===it.c);
  return (same.length?same:ok)[0];
}

/* ---- render ---- */
let openDay=null;
function renderMonth(){
  const host=document.getElementById('month');if(!host)return;
  const lead=new Date(2026,10,1).getDay();
  const total=Math.ceil((lead+30)/7)*7;
  let h='<div class="mh-row">'+WDS.map(w=>'<div class="mh">'+w+'</div>').join('')+'</div><div class="mgrid">';
  for(let i=0;i<total;i++){
    const day=i-lead+1;
    const cls=['mday'];
    if(i%7===6)cls.push('edge-r');
    if(i>=total-7)cls.push('edge-b');
    if(day<1||day>30){h+='<div class="'+cls.join(' ')+' blank"></div>';continue;}
    const iso='2026-11-'+dd2(day);
    const t=TRIPMAP[iso];
    const n=(plan[iso]||[]).length;
    if(!t){
      cls.push('off');
      h+='<div class="'+cls.join(' ')+'" title="Fora da viagem"><span class="dn">'+dd2(day)+'</span>'
        +(n?'<span class="cnt">'+n+'</span>':'')+'</div>';
      continue;
    }
    cls.push('trip');if(openDay===iso)cls.push('on');
    h+='<button type="button" class="'+cls.join(' ')+'" data-day="'+iso+'" style="--c:var(--c-'+t.c+')"'
      +' aria-label="'+day+' de novembro, '+CLAB[t.c]+(t.note?', '+t.note:'')+(n?', '+n+(n>1?' passeios':' passeio'):'')+'">'
      +'<span class="dn"><i></i>'+dd2(day)+'</span>'
      +'<span class="cnt'+(n?'':' zero')+'">'+(n||'·')+'</span>'
      +'</button>';
  }
  host.innerHTML=h+'</div>';
}
function pitemHTML(id){
  const it=byId[id];if(!it)return '';
  const fx=autoDay(it);
  let fix='';
  if(fx){
    const bad=openDay&&openDay!==fx;
    fix='<div class="pfix'+(bad?' bad':'')+'">'+ic(bad?'alerta':'data','ic-s')
      +(bad?('Só faz sentido em '+brDay(fx)):('Encaixe '+brDay(fx)))+'</div>';
  }
  const meta=[it.a,it.d,it.p].filter(Boolean).join(' · ');
  let act='';
  if(openDay&&dayOf(id)!==openDay&&TRIPMAP[openDay].c===it.c){
    act='<button type="button" class="fit" data-fit="'+openDay+'" title="Pôr neste dia">'
      +ic('mais','ic-s')+dd2(DAYNO(openDay))+'</button>';
  }
  return '<div class="pitem" data-id="'+id+'" data-city="'+it.c+'">'
   +'<button type="button" class="grip" aria-label="Mover '+esc(it.n)+'. Use as setas para reposicionar.">'+ic('grip')+'</button>'
   +'<div class="pbody"><div class="pt">'+esc(it.n)+(origOf(it)?' <span class="po">'+esc(origOf(it))+'</span>':'')+'</div>'
   +(meta?'<div class="pm">'+esc(meta)+'</div>':'')+fix+'</div>'
   +'<div class="pact">'+act+'<button type="button" class="mini rm" title="Tirar do roteiro" aria-label="Tirar do roteiro">'+ic('x','ic-s')+'</button></div>'
   +'</div>';
}
function renderDay(){
  const host=document.getElementById('day-open');if(!host)return;
  if(!openDay){host.innerHTML='';return;}
  const t=TRIPMAP[openDay],ids=(plan[openDay]||[]).slice();
  host.innerHTML='<div class="daywrap" style="--dc:var(--c-'+t.c+')">'
   +'<div class="daybar">'
     +'<button type="button" class="back" id="day-x">'+ic('voltar','ic-s')+'Mês</button>'
     +'<div><div class="dt">'+WDL[t.wd]+', '+dd2(DAYNO(openDay))+' de novembro</div>'
     +'<div class="dw">'+CLAB[t.c]+(t.note?' · '+t.note:'')+' · '
       +(ids.length?ids.length+(ids.length>1?' passeios':' passeio'):'nenhum passeio')+'</div></div>'
   +'</div>'
   +'<div class="plist" data-bucket="'+openDay+'">'
     +(ids.length?ids.map(pitemHTML).join('')
       :'<p class="pempty">Nada neste dia ainda. Pegue um item em “Sem dia definido”, logo abaixo, e arraste para cá — ou toque no botão de mais ao lado dele.</p>')
   +'</div></div>';
}
function renderPool(){
  const host=document.getElementById('pool');if(!host)return;
  const ids=(plan['pool']||[]).slice();
  if(!ids.length&&!planTotal()){
    host.innerHTML='<div class="poolwrap"><div class="pool-h">'+ic('grip','ic-s')
      +'<h3>Sem dia definido</h3><span class="c">0</span></div>'
      +'<p class="pempty">Vazio. No catálogo, toque no ícone de calendário de um passeio para trazê-lo ao roteiro — ele cai aqui e você distribui pelos dias.</p></div>';
    return;
  }
  host.innerHTML='<div class="poolwrap"><div class="pool-h">'+ic('grip','ic-s')
    +'<h3>Sem dia definido</h3><span class="c">'+ids.length+'</span></div>'
    +(ids.length?'<div class="plist" data-bucket="pool">'+ids.map(pitemHTML).join('')+'</div>'
      :'<p class="pempty">Tudo já está num dia.</p>')
    +'</div>';
}
function renderLine(){
  const el=document.getElementById('plan-line');if(!el)return;
  const tot=planTotal(),pool=(plan['pool']||[]).length;
  let days=0;DAYS.forEach(d=>{if((plan[d]||[]).length)days++;});
  el.innerHTML=tot?('<b>'+tot+'</b> no roteiro · <b>'+days+'</b> '+(days===1?'dia':'dias')+' com atividade · <b>'+pool+'</b> sem dia definido')
    :'Nenhum passeio no roteiro ainda.';
}
function countTab(){
  const el=document.getElementById('n-roteiro');if(!el)return;
  const n=planTotal();
  el.textContent=n?' '+n:'';
}
function syncPbtn(){
  $$('.row').forEach(r=>{
    const b=r.querySelector('.pbtn');if(!b)return;
    const on=inPlan(r.dataset.id);
    b.classList.toggle('in',on);
    b.title=on?'Tirar do roteiro':'Adicionar ao roteiro';
    b.setAttribute('aria-label',b.title);
  });
}
function renderPlan(){renderMonth();renderDay();renderLine();renderPool();countTab();syncPbtn();}
function focusItem(id){
  const el=document.querySelector('.pitem[data-id="'+id+'"] .grip');
  if(el)el.focus();
}

/* ---- adicionar a partir do catalogo ---- */
function addToPlan(it){
  const d=autoDay(it);
  if(d){
    planTo(it.id,d,null);
    toast('No roteiro · encaixado em '+brDay(d));
  }else{
    planTo(it.id,'pool',null);
    toast('No roteiro · sem dia definido');
  }
}

/* ---- arrasto por ponteiro (mouse, toque e caneta) ---- */
let dg=null,ph=null;
function clearDrop(){
  $$('.mday.drop').forEach(x=>x.classList.remove('drop'));
  $$('.rd.hot').forEach(x=>x.classList.remove('hot'));
}
function buildRail(city){
  const old=document.getElementById('rail');if(old)old.remove();
  const r=document.createElement('div');
  r.className='rail';r.id='rail';
  let h='<span class="rail-l">Mover para</span>'
    +'<button type="button" class="rd" data-day="pool"><span>—</span><small>sem dia</small></button>';
  TRIP.forEach(t=>{
    h+='<button type="button" class="rd'+(t.c===city?' fit':'')+'" data-day="'+t.d+'" style="--c:var(--c-'+t.c+')"'
      +' aria-label="Mover para '+DAYNO(t.d)+' de novembro, '+CLAB[t.c]+'">'
      +'<span>'+dd2(DAYNO(t.d))+'</span><small>'+WDS[t.wd]+'</small></button>';
  });
  r.innerHTML=h;
  document.body.appendChild(r);
  const f=r.querySelector('.rd.fit');
  if(f&&r.clientWidth)r.scrollLeft=Math.max(0,f.offsetLeft-(r.clientWidth-f.offsetWidth)/2);
}
function insertIndex(list,y){
  const kids=Array.prototype.slice.call(list.children)
    .filter(k=>k.classList.contains('pitem')&&k!==dg.it);
  for(let i=0;i<kids.length;i++){
    const b=kids[i].getBoundingClientRect();
    if(y<b.top+b.height/2)return i;
  }
  return kids.length;
}
function placeGhost(x,y){dg.gh.style.transform='translate3d('+(x-dg.dx)+'px,'+(y-dg.dy)+'px,0)';}
function startDrag(e){
  const g=e.target.closest('.grip');if(!g||dg)return;
  const it=g.closest('.pitem');if(!it)return;
  const r=it.getBoundingClientRect();
  const bucketEl=it.closest('[data-bucket]');
  const gh=it.cloneNode(true);
  gh.classList.add('ghost');
  gh.style.width=r.width+'px';
  gh.style.transform='translate3d('+r.left+'px,'+r.top+'px,0)';
  document.body.appendChild(gh);
  dg={id:it.dataset.id,city:it.dataset.city,it:it,gh:gh,dx:e.clientX-r.left,dy:e.clientY-r.top,
      sx:e.clientX,sy:e.clientY,moved:false,tgt:null,from:bucketEl?bucketEl.dataset.bucket:null};
  addEventListener('pointermove',onMove,{passive:false});
  addEventListener('pointerup',onUp);
  addEventListener('pointercancel',onUp);
}
function onMove(e){
  if(!dg)return;
  if(!dg.moved){
    if(Math.abs(e.clientX-dg.sx)+Math.abs(e.clientY-dg.sy)<5)return;
    dg.moved=true;
    dg.gh.style.opacity='1';
    dg.it.classList.add('dragging');
    document.documentElement.classList.add('busy');
    buildRail(dg.city);
  }
  e.preventDefault();
  placeGhost(e.clientX,e.clientY);
  const el=document.elementFromPoint(e.clientX,e.clientY);
  let day=null,list=null;
  if(el){
    const rb=el.closest('.rd');
    if(rb)day=rb.dataset.day;
    else{
      const mc=el.closest('.mday.trip');
      if(mc)day=mc.dataset.day;
      else{const ls=el.closest('.plist');if(ls)list=ls;}
    }
  }
  clearDrop();
  if(list){
    const idx=insertIndex(list,e.clientY);
    if(!ph){ph=document.createElement('div');ph.className='ph';}
    const kids=Array.prototype.slice.call(list.children)
      .filter(k=>k.classList.contains('pitem')&&k!==dg.it);
    list.insertBefore(ph,kids[idx]||null);
    dg.tgt={type:'list',bucket:list.dataset.bucket,idx:idx};
  }else if(day){
    if(ph&&ph.parentNode)ph.remove();
    dg.tgt={type:'day',day:day};
    if(day!=='pool'){
      const c=document.querySelector('.mday.trip[data-day="'+day+'"]');
      if(c)c.classList.add('drop');
    }
    const rbb=document.querySelector('.rd[data-day="'+day+'"]');
    if(rbb)rbb.classList.add('hot');
  }else{
    if(ph&&ph.parentNode)ph.remove();
    dg.tgt=null;
  }
}
function endDrag(){
  removeEventListener('pointermove',onMove);
  removeEventListener('pointerup',onUp);
  removeEventListener('pointercancel',onUp);
  if(dg&&dg.gh)dg.gh.remove();
  if(dg&&dg.it)dg.it.classList.remove('dragging');
  if(ph){ph.remove();ph=null;}
  const r=document.getElementById('rail');if(r)r.remove();
  document.documentElement.classList.remove('busy');
  clearDrop();
  dg=null;
}
function onUp(){
  if(!dg){endDrag();return;}
  const t=dg.tgt,moved=dg.moved,id=dg.id;
  endDrag();
  if(!moved||!t)return;
  if(t.type==='list'){
    planTo(id,t.bucket,t.idx);
    toast(t.bucket==='pool'?'Sem dia definido':('No dia '+brDay(t.bucket)));
  }else if(t.day==='pool'){
    planTo(id,'pool',null);toast('Sem dia definido');
  }else{
    planTo(id,t.day,null);toast('No dia '+brDay(t.day));
  }
  renderPlan();
}

/* ---- teclado (funciona sem arrasto) ---- */
function onPlanKey(e){
  const g=e.target.closest('.grip');if(!g)return;
  const it=g.closest('.pitem');if(!it)return;
  const id=it.dataset.id,data=byId[id],b=dayOf(id);
  if(e.key==='Delete'||e.key==='Backspace'){
    unplan(id);renderPlan();toast('Fora do roteiro');e.preventDefault();return;
  }
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){
    const arr=plan[b]||[],i=arr.indexOf(id),j=e.key==='ArrowUp'?i-1:i+1;
    if(j<0||j>=arr.length)return;
    planTo(id,b,j);renderPlan();focusItem(id);e.preventDefault();return;
  }
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    if(b==='pool'){
      if(e.key==='ArrowLeft')return;
      const first=(CITYDAYS[data.c]||DAYS)[0];
      planTo(id,first,null);renderPlan();focusItem(id);e.preventDefault();return;
    }
    const i=DAYS.indexOf(b),j=e.key==='ArrowRight'?i+1:i-1;
    if(j<0){planTo(id,'pool',null);renderPlan();focusItem(id);e.preventDefault();return;}
    if(j>=DAYS.length)return;
    planTo(id,DAYS[j],null);renderPlan();focusItem(id);e.preventDefault();
  }
}
function bindPlan(){
  const host=document.getElementById('v-roteiro');
  host.addEventListener('pointerdown',startDrag);
  host.addEventListener('keydown',onPlanKey);
  host.addEventListener('click',e=>{
    const md=e.target.closest('.mday.trip');
    if(md){
      openDay=(openDay===md.dataset.day)?null:md.dataset.day;
      renderPlan();
      if(openDay){
        const dw=document.getElementById('day-open');
        if(dw)requestAnimationFrame(()=>dw.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}));
      }
      return;
    }
    if(e.target.closest('#day-x')){openDay=null;renderPlan();return;}
    const fb=e.target.closest('.fit');
    if(fb){
      planTo(fb.closest('.pitem').dataset.id,fb.dataset.fit,null);
      renderPlan();toast('No dia '+brDay(fb.dataset.fit));return;
    }
    const rm=e.target.closest('.rm');
    if(rm){unplan(rm.closest('.pitem').dataset.id);renderPlan();toast('Fora do roteiro');}
  });
}

/* ============================================================
   TELA DE ABERTURA — menu, fotos em revezamento, entrada animada
   ============================================================ */
const SPCITY=[['berlin','c-berlin'],['paris','c-paris'],['colonia','c-colonia']];
let spIdx=0,spTimer=null,spBoot=null,spOn=true;
function nomeDe(k){const p=PEOPLE.filter(x=>x.k===k)[0];return p?p.n:k;}
function spSeg(){
  const s=document.getElementById('sp-seg');if(!s)return;
  /* logado, quem escreve na abertura é a nuvem */
  if(euId){nuvemPinta();return;}
  s.innerHTML=PEOPLE.map(p=>
    '<button type="button" data-p="'+p.k+'" style="--pc:var('+p.c+')" aria-pressed="'+(p.k===who?'true':'false')+'">'+esc(p.n)+'</button>'
  ).join('');
}
/* deixa visivel, em qualquer aba, de quem sao os dados na tela */
function whoSync(){
  const p=PEOPLE.filter(x=>x.k===who)[0]||PEOPLE[0];
  $$('[data-who]').forEach(el=>{el.textContent=p.n;el.style.setProperty('--pc','var('+p.c+')');});
  const seg=document.querySelectorAll('#sp-seg button');
  for(let i=0;i<seg.length;i++) seg[i].setAttribute('aria-pressed',String(seg[i].dataset.p===who));
}
/* troca de perfil: guarda o que estava, carrega o outro e redesenha */
function profileSet(k){
  if(!PEOPLE.some(p=>p.k===k))return who;
  if(k!==who){
    profGrava();
    who=k;store.active=k;
    const d=store.people[k]||profVazio();
    state=d.state||{};
    plan=d.plan||{};
    colLe(d.gavetas);
    openDay=null;
    profSalva();
    rendered.berlin=rendered.paris=rendered.colonia=false;
    if(['berlin','paris','colonia'].indexOf(cur)>=0){renderList(cur,false);rendered[cur]=true;}
    renderPlan();stats();
  }
  whoSync();spBuild();counts();
  return who;
}
document.getElementById('sp-seg').addEventListener('click',e=>{
  const b=e.target.closest('button[data-p]');
  if(b) profileSet(b.dataset.p);
});
function spBuild(){
  const m=document.getElementById('sp-menu');if(!m)return;
  let marked=0;DATA.forEach(it=>{if(state[it.id]&&state[it.id].r)marked++;});
  let nsrc=0;Object.keys(SRC).forEach(k=>{nsrc+=(SRC[k]||[]).length;});
  const rows=[
    ['berlin','Berlim',DATA.filter(i=>i.c==='berlin').length+' passeios','c-berlin'],
    ['paris','Paris',DATA.filter(i=>i.c==='paris').length+' passeios','c-paris'],
    ['colonia','Colônia',DATA.filter(i=>i.c==='colonia').length+' passeios','c-colonia'],
    ['roteiro','Roteiro',planTotal()?(planTotal()+' no plano'):'dia a dia','accent'],
    ['fontes','Fontes de pesquisa',nsrc+' fontes','ink-3'],
    ['gostos','Meus gostos',marked?(marked+' marcados'):'seu retrato','ink-3']
  ];
  m.innerHTML=rows.map((r,i)=>
    '<button class="sp-item" type="button" data-go="'+r[0]+'" style="--i:'+i+';--cat:var(--'+r[3]+')">'
    +'<span class="dot"></span><span class="lab">'+esc(r[1])+'</span>'
    +'<span class="meta">'+esc(r[2])+'</span>'+ic('seta','ic-s chev')+'</button>').join('');
}
/* reaproveita as fotos ja embutidas nos cabecalhos, sem duplicar bytes */
function spWire(){
  const srcs=SPCITY.map(c=>{
    const im=document.querySelector('#v-'+c[0]+' .hero-img');
    return im?im.getAttribute('src'):'';
  });
  const imgs=document.querySelectorAll('.sp-img');
  for(let i=0;i<imgs.length;i++){
    if(!imgs[i].getAttribute('src')) imgs[i].setAttribute('src',srcs[i]||'');
  }
}
function spDot(n){
  const imgs=document.querySelectorAll('.sp-img'),dots=document.querySelectorAll('.sp-dots i');
  for(let i=0;i<imgs.length;i++) imgs[i].classList.toggle('on',i===n);
  for(let i=0;i<dots.length;i++) dots[i].classList.toggle('on',i===n);
  spIdx=n;
}
function spLoop(){
  clearInterval(spTimer);
  if(reduce) return;
  spTimer=setInterval(()=>spDot((spIdx+1)%SPCITY.length),5200);
}
function spOpen(){
  const sp=document.getElementById('splash');if(!sp)return;
  spSeg();whoSync();spBuild();spWire();spDot(0);
  sp.hidden=false;sp.classList.remove('out');
  document.body.classList.add('lock');
  sp.classList.remove('in');void sp.offsetWidth;sp.classList.add('in');
  spOn=true;
  clearTimeout(spBoot);clearInterval(spTimer);
  spBoot=setTimeout(spLoop,1400);
}
function spGo(v){
  const sp=document.getElementById('splash');
  document.body.classList.remove('lock');
  if(!spOn||!sp||sp.hidden){show(v,true);return;}
  spOn=false;
  clearInterval(spTimer);clearTimeout(spBoot);
  sp.classList.remove('in');sp.classList.add('out');
  show(v,true);
  setTimeout(()=>{sp.hidden=true;sp.classList.remove('out');},470);
}
document.getElementById('sp-menu').addEventListener('click',e=>{
  const b=e.target.closest('.sp-item');if(!b)return;
  spGo(b.dataset.go);
});
document.getElementById('b-inicio').onclick=spOpen;
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&spOn&&!document.getElementById('splash').hidden) spGo('berlin');
});

/* ---------- abas ---------- */
function moveInk(btn,anim){
  const ink=$('#ink');
  if(!btn){ink.style.width='0';return;}
  if(!anim){ink.style.transition='none';}
  ink.style.width=btn.offsetWidth+'px';
  ink.style.transform='translateX('+btn.offsetLeft+'px)';
  if(!anim) requestAnimationFrame(()=>{ink.style.transition='';});
}
/* mantem a aba ativa inteira dentro da faixa, que rola na horizontal */
function revealTab(t,anim){
  const s=document.querySelector('.tabs');if(!s)return;
  const l=t.offsetLeft,w=t.offsetWidth,pad=14;
  if(l-pad<s.scrollLeft) s.scrollTo({left:Math.max(0,l-pad),behavior:anim?'smooth':'auto'});
  else if(l+w+pad>s.scrollLeft+s.clientWidth) s.scrollTo({left:l+w-s.clientWidth+pad,behavior:anim?'smooth':'auto'});
}
function show(v,anim){
  cur=v;
  $$('.view').forEach(x=>x.classList.remove('on'));
  const view=document.getElementById('v-'+v);
  view.classList.add('on');
  $$('.tab').forEach(t=>{
    const on=t.dataset.v===v;
    t.classList.toggle('on',on);
    t.setAttribute('aria-selected',String(on));
    if(on) moveInk(t,anim);
  });
  const onTab=document.querySelector('.tab.on');
  if(onTab) revealTab(onTab,anim);
  const isCity=['berlin','paris','colonia'].indexOf(v)>=0;
  $('#b-busca').hidden=!isCity;$('#b-filtro').hidden=!isCity;
  if(!isCity){closePanel();$('#fsum').classList.remove('show');}
  else{
    renderChips(v);
    $('#q').value=ui[v].q;
    $('#q-x').hidden=!ui[v].q;
    $('#sort').value=ui[v].sort;
    if(!rendered[v]){renderList(v,true);rendered[v]=true;}
    else{fsum();counts();}
  }
  if(v==='gostos'){stats();}
  if(v==='roteiro'){renderPlan();}
  const hero=view.querySelector('.hero-img');
  if(hero&&!reduce){hero.style.animation='none';void hero.offsetWidth;hero.style.animation='';}
  const hi=view.querySelectorAll('.hero-city i');
  hi.forEach(el=>{if(!reduce){el.style.animation='none';void el.offsetWidth;el.style.animation='';}});
  const hs=view.querySelector('.hero-sub');
  if(hs&&!reduce){hs.style.animation='none';void hs.offsetWidth;hs.style.animation='';}
  window.scrollTo({top:0,behavior:anim?'smooth':'auto'});
}
$$('.tab').forEach(t=>t.onclick=()=>show(t.dataset.v,true));

/* ---------- painel ---------- */
function openPanel(which){
  const p=$('#panel');
  if(p.classList.contains('open')){closePanel();return;}
  p.classList.add('open');
  $('#b-busca').setAttribute('aria-expanded','true');
  $('#b-filtro').setAttribute('aria-expanded','true');
  if(which==='search') setTimeout(()=>$('#q').focus(),300);
}
function closePanel(){
  const p=$('#panel');
  p.classList.remove('open');
  $('#b-busca').setAttribute('aria-expanded','false');
  $('#b-filtro').setAttribute('aria-expanded','false');
}
$('#b-busca').onclick=()=>openPanel('search');
$('#b-filtro').onclick=()=>openPanel('filter');

/* ---------- controles gerais ---------- */
$('#q').addEventListener('input',function(){
  if(!ui[cur]) return;
  ui[cur].q=this.value.trim();
  $('#q-x').hidden=!this.value;
  renderList(cur,false);
});
$('#q-x').onclick=()=>{if(!ui[cur])return;$('#q').value='';ui[cur].q='';$('#q-x').hidden=true;renderList(cur,false);};
$('#sort').addEventListener('change',function(){if(!ui[cur])return;ui[cur].sort=this.value;renderList(cur,false);});
$('#cats').addEventListener('click',e=>{
  const b=e.target.closest('.chip'); if(!b||!ui[cur]) return;
  const u=ui[cur],k=b.dataset.cat;
  if(u.cats.has(k))u.cats.delete(k); else u.cats.add(k);
  renderChips(cur);renderList(cur,false);
});
$('#tags').addEventListener('click',e=>{
  const b=e.target.closest('.chip'); if(!b||!ui[cur]) return;
  const u=ui[cur],k=b.dataset.tg||b.dataset.tag;
  if(u.tags.has(k))u.tags.delete(k); else u.tags.add(k);
  renderChips(cur);renderList(cur,false);
});
$('#limpar').onclick=clearFilters;
/* abre e recolhe todas as gavetas da cidade atual */
document.addEventListener('click',e=>{
  const b=e.target.closest('#sec-all');if(!b)return;
  colAll(cur,b.dataset.shut==='1');
});

$('#x-resumo').onclick=()=>{
  const o=$('#out');o.value=summary();o.select();
  try{document.execCommand('copy');toast('Resumo copiado — cole no chat');}catch(e){}
};
$('#x-json').onclick=()=>{
  const o=$('#out');o.value=payload();o.select();
  try{document.execCommand('copy');toast('JSON copiado');}catch(e){}
};
$('#x-baixar').onclick=()=>{
  const b=new Blob([payload()],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download='gostos-viagem-europa-nov2026.json';a.click();
};
$('#x-colar').onclick=()=>{$('#imp-wrap').hidden=false;$('#imp').focus();};
$('#imp-x').onclick=()=>{$('#imp-wrap').hidden=true;};
$('#imp-go').onclick=()=>{
  try{
    const o=JSON.parse($('#imp').value);
    /* se o arquivo diz de quem e, ele entra no perfil certo */
    const alvo=(o.perfil&&PEOPLE.some(p=>p.k===o.perfil))?o.perfil:who;
    profGrava();
    const d=store.people[alvo]||profVazio();
    /* arquivo exportado antes da troca de id chega com "i0", "i1"... */
    d.state=migraIds((o.state&&typeof o.state==='object')?o.state:((o.perfil||o.plan)?{}:o));
    if(o.plan&&typeof o.plan==='object'){
      d.plan=migraPlano(o.plan);
      Object.keys(d.plan).forEach(k=>{
        if(k!=='pool'&&!DAYSET[k]){delete d.plan[k];return;}
        d.plan[k]=(Array.isArray(d.plan[k])?d.plan[k]:[]).filter(id=>byId[id]);
        if(!d.plan[k].length)delete d.plan[k];
      });
    }
    if(o.gavetas&&typeof o.gavetas==='object')d.gavetas=o.gavetas;
    who=alvo;store.active=alvo;
    state=d.state;plan=d.plan;colLe(d.gavetas);
    openDay=null;
    profSalva();
    ['berlin','paris','colonia'].forEach(c=>{renderList(c,false);rendered[c]=true;});
    renderPlan();stats();whoSync();
    $('#imp-wrap').hidden=true;toast('Seleção de '+nomeDe(alvo)+' importada');
  }catch(e){toast('JSON inválido');}
};
$('#x-limpar').onclick=()=>{
  if(!confirm('Apagar as marcações, anotações e o roteiro de '+nomeDe(who)+'? O outro perfil não é tocado.'))return;
  state={};save();
  plan={};planSave();openDay=null;
  ['berlin','paris','colonia'].forEach(c=>{renderList(c,false);rendered[c]=true;});
  renderPlan();stats();toast('Tudo limpo em '+nomeDe(who));
};

/* ---------- scroll + resize ---------- */
let lastY=0,rvT=null;
addEventListener('scroll',()=>{
  const y=window.scrollY;
  $('#chrome').classList.toggle('stuck',y>6);
  lastY=y;
  /* rede de seguranca: nada pode ficar invisivel por causa da animacao de entrada */
  if(!reduce){
    clearTimeout(rvT);
    rvT=setTimeout(()=>{
      const v=document.getElementById('v-'+cur);
      if(v&&v.classList.contains('on'))revealInView(v);
    },120);
  }
},{passive:true});
let rt=null;
addEventListener('resize',()=>{
  clearTimeout(rt);
  rt=setTimeout(()=>{
    const on=document.querySelector('.tab.on');
    if(on) moveInk(on,false);
  },140);
});

/* ============================================================
   NUVEM — entrar e sincronizar

   O app continua funcionando sozinho, do armazenamento do aparelho,
   como sempre. A nuvem entra por cima: ao entrar, o que está no banco
   desce para a tela; a cada marcação, o que é meu sobe. Sem rede nada
   trava — a marcação fica no aparelho e sobe quando a rede voltar.

   Quem vê o quê não é decidido aqui: quem decide é a política do
   banco. Aqui só tratamos o que fazer com o "não pode".
   ============================================================ */
const CHAVENUVEM='europa-nov2026-nuvem-v1';
let euId=null,minhaChave=null,podeRoteiro=false;
let chaveDoId={},idDaChave={};
let nuvemEstado='off',nuvemErro='',nuvemSincronizado=false,nuvemTimer=null;
/* conta cada marcação minha: serve para perceber se alguém marcou
   enquanto uma sincronização estava no ar */
let nuvemVersao=0;

/* a chave local de cada pessoa é o primeiro nome sem acento: bruno, lucas.
   É de propósito — assim as marcações que já existem neste aparelho,
   guardadas com essas chaves, continuam valendo. */
function chaveLocal(nome){
  return String(nome||'').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}
function corDaNuvem(cor){
  const c=String(cor||'').toLowerCase();
  if(c.indexOf('violet')>=0)return '--t-violet-ink';
  return '--accent';
}
function nuvemGuardado(){
  try{const o=JSON.parse(localStorage.getItem(CHAVENUVEM)||'{}');return o&&typeof o==='object'?o:{};}catch(e){return {};}
}
function nuvemGuarda(o){try{localStorage.setItem(CHAVENUVEM,JSON.stringify(o));}catch(e){}}

/* a lista de pessoas passa a vir do banco */
function nuvemPessoas(lista){
  chaveDoId={};idDaChave={};
  lista.forEach(p=>{
    const k=chaveLocal(p.nome);if(!k)return;
    chaveDoId[p.pessoa_id]=k;idDaChave[k]=p.pessoa_id;
    const ja=PEOPLE.filter(x=>x.k===k)[0];
    if(ja){ja.n=p.nome;ja.c=corDaNuvem(p.cor);}
    else{PEOPLE.push({k:k,n:p.nome,c:corDaNuvem(p.cor),f:'img/pessoas/'+k+'.jpg'});}
    if(!store.people[k])store.people[k]=profVazio();
    if(p.pessoa_id===euId){minhaChave=k;podeRoteiro=!!p.pode_editar_roteiro;}
  });
}

/* banco -> aparelho. O banco é a verdade: quem não tem linha fica sem nada.
   A exceção é quando eu mexi na tela durante a busca (manterMeu): aí o que
   está aqui é mais novo e não pode ser atropelado. */
function nuvemAplicar(dados,manterMeu){
  const marcas={},planos={};
  (dados.avaliacoes||[]).forEach(a=>{
    const k=chaveDoId[a.pessoa_id];if(!k)return;
    if(!marcas[k])marcas[k]={};
    marcas[k][a.lugar_id]=(a.nota&&a.nota.trim())?{r:a.nivel,n:a.nota}:{r:a.nivel};
  });
  (dados.roteiro||[]).forEach(r=>{
    const k=chaveDoId[r.pessoa_id];if(!k)return;
    const balde=r.dia||'pool';
    if(!planos[k])planos[k]={};
    (planos[k][balde]=planos[k][balde]||[]).push(r);
  });
  /* atenção: chaveDoId é id->chave, e o que interessa aqui são as chaves locais */
  Object.keys(idDaChave).forEach(k=>{
    if(manterMeu&&k===minhaChave)return;
    const d=store.people[k]||(store.people[k]=profVazio());
    d.state=marcas[k]||{};
    const pl={};
    const p=planos[k]||{};
    Object.keys(p).forEach(dia=>{
      const ids=p[dia].sort((a,b)=>a.posicao-b.posicao).map(x=>x.lugar_id).filter(id=>byId[id]);
      if(ids.length)pl[dia]=ids;
    });
    d.plan=pl;
  });
}

/* o que é meu, no formato do banco */
function nuvemMarcasMinhas(){
  const out=[];
  Object.keys(state).forEach(id=>{
    const s=state[id];if(!s||!s.r)return;
    out.push({pessoa_id:euId,lugar_id:id,nivel:s.r,nota:(s.n&&s.n.trim())?s.n:null});
  });
  return out;
}
function nuvemRoteiroMeu(){
  const out=[];
  Object.keys(plan).forEach(dia=>{
    (plan[dia]||[]).forEach((id,i)=>{
      if(byId[id])out.push({pessoa_id:euId,lugar_id:id,dia:(dia==='pool'?null:dia),posicao:i});
    });
  });
  return out;
}
async function nuvemEmpurra(){
  if(!euId||who!==minhaChave)return;
  await NUVEM.enviarMarcas(euId,nuvemMarcasMinhas());
  if(podeRoteiro)await NUVEM.enviarRoteiro(euId,nuvemRoteiroMeu());
}
/* chamado a cada marcação: espera a poeira baixar e sobe */
function nuvemMudou(){
  if(!euId||who!==minhaChave)return;
  nuvemVersao++;
  clearTimeout(nuvemTimer);
  nuvemTimer=setTimeout(async ()=>{
    try{
      await nuvemEmpurra();
      nuvemEstado='ok';nuvemErro='';
    }catch(e){
      nuvemEstado=(e&&e.status===401)?'expirado':'offline';
      nuvemErro=(e&&e.message)||'';
    }
    nuvemPinta();
  },900);
}

/* depois de aplicar, a tela é refeita a partir do que ficou guardado */
function nuvemRecarrega(){
  const d=store.people[who]||profVazio();
  state=d.state||{};
  plan=d.plan||{};
  colLe(d.gavetas||{berlin:[],paris:[],colonia:[]});
  rendered.berlin=rendered.paris=rendered.colonia=false;
  if(['berlin','paris','colonia'].indexOf(cur)>=0){renderList(cur,false);rendered[cur]=true;}
  renderPlan();stats();counts();spBuild();whoSync();nuvemAvisoRoteiro();
}

async function nuvemSincroniza(){
  if(!euId)return;
  try{
    const versaoAntes=nuvemVersao;
    const dados=await NUVEM.puxar();
    nuvemPessoas(dados.pessoas);
    if(!minhaChave){
      nuvemEstado='erro';
      nuvemErro='esta conta não está na lista de participantes do banco';
      nuvemPinta();return;
    }
    if(who!==minhaChave)profileSet(minhaChave);
    const g=nuvemGuardado();
    nuvemSincronizado=(g.pessoa===euId&&g.sincronizado===true);
    const local=store.people[minhaChave]||profVazio();
    const temLocal=Object.keys(local.state||{}).length>0||Object.keys(local.plan||{}).length>0;
    if(!nuvemSincronizado&&temLocal){
      /* este aparelho já tinha marcação: ela sobe antes de qualquer coisa,
         para não ser atropelada pelo que está no banco */
      await nuvemEmpurra();
      nuvemAplicar(await NUVEM.puxar(),nuvemVersao!==versaoAntes);
    }else{
      nuvemAplicar(dados,nuvemVersao!==versaoAntes);
    }
    nuvemSincronizado=true;
    nuvemGuarda({pessoa:euId,sincronizado:true,tempo:Date.now(),chaves:idDaChave});
    nuvemEstado='ok';nuvemErro='';
    nuvemRecarrega();
  }catch(e){
    nuvemEstado=(e&&e.status===401)?'expirado':'offline';
    nuvemErro=(e&&e.message)||'';
  }
  nuvemPinta();
}

function fichaDeQuemEntrou(){
  const p=PEOPLE.filter(x=>x.k===minhaChave)[0];
  if(!p)return '';
  return '<span class="sp-me" style="--pc:var('+p.c+')"><i></i>'+esc(p.n)+'</span>';
}
function nuvemPinta(){
  const rot=document.getElementById('sp-who-l');
  const seg=document.getElementById('sp-seg');
  const form=document.getElementById('sp-login');
  const aviso=document.getElementById('sp-sync');
  const erro=document.getElementById('sp-erro');
  const dentro=!!euId&&nuvemEstado!=='expirado';
  if(form)form.hidden=dentro;
  if(rot)rot.textContent=dentro?'Você é':'Entre para marcar';
  if(seg)seg.innerHTML=dentro?fichaDeQuemEntrou():'';
  if(erro){
    if(nuvemErro&&!dentro){erro.hidden=false;erro.textContent=nuvemErro;}
    else{erro.hidden=true;erro.textContent='';}
  }
  if(!aviso)return;
  if(!dentro){aviso.hidden=true;return;}
  const texto={
    entrando:'Entrando…',
    ok:'Sincronizado com a nuvem',
    offline:'Sem conexão agora — as marcações ficam neste aparelho e sobem quando a rede voltar',
    expirado:'A sessão venceu — entre de novo',
    erro:nuvemErro||'Algo deu errado na sincronização'
  }[nuvemEstado]||'';
  aviso.hidden=!texto;
  aviso.textContent=texto;
  aviso.dataset.estado=nuvemEstado;
}

/* quem não organiza o roteiro não vê o botão de encaixar — e o banco
   recusaria de qualquer jeito */
function nuvemAvisoRoteiro(){
  const v=document.getElementById('v-roteiro');
  if(!v)return;
  const h2=v.querySelector('h2');
  const velho=document.getElementById('aviso-roteiro');
  if(!euId||podeRoteiro){
    document.body.classList.remove('sem-roteiro');
    if(velho)velho.remove();
    return;
  }
  document.body.classList.add('sem-roteiro');
  if(velho||!h2)return;
  const p=document.createElement('p');
  p.id='aviso-roteiro';p.className='aviso-roteiro';
  p.textContent='O roteiro é organizado pelo Bruno. Você pode marcar os passeios à vontade — eles aparecem aqui quando ele encaixar.';
  h2.parentNode.insertBefore(p,h2.nextSibling);
}

/* primeira coisa que roda: se já existe sessão, entra com o que está no
   aparelho e busca o resto quando a rede deixar */
function nuvemLiga(){
  if(!(window.NUVEM&&NUVEM.configurado))return;
  const g=nuvemGuardado();
  if(g&&g.chaves){
    chaveDoId={};idDaChave={};
    Object.keys(g.chaves).forEach(k=>{idDaChave[k]=g.chaves[k];chaveDoId[g.chaves[k]]=k;});
  }
  const s=NUVEM.lerSessao();
  if(s&&s.user){
    euId=s.user.id;
    minhaChave=chaveDoId[euId]||null;
    nuvemEstado='ok';
    nuvemPinta();
    nuvemSincroniza();
  }else{
    nuvemEstado='off';
    nuvemPinta();
  }
}
document.getElementById('sp-login').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=(document.getElementById('sp-email').value||'').trim();
  const senha=document.getElementById('sp-senha').value||'';
  const b=document.getElementById('sp-entrar');
  if(!email||!senha)return;
  nuvemEstado='entrando';nuvemErro='';nuvemPinta();
  if(b){b.disabled=true;b.textContent='Entrando…';}
  try{
    const u=await NUVEM.entrar(email,senha);
    euId=u.id;minhaChave=null;
    await nuvemSincroniza();
    if(nuvemEstado==='ok')document.getElementById('sp-senha').value='';
  }catch(err){
    nuvemEstado='off';
    nuvemErro=(err&&err.message)||'não deu para entrar';
  }
  if(b){b.disabled=false;b.textContent='Entrar';}
  nuvemPinta();
});

/* ---------- init ---------- */
renderSrc();
renderChips('berlin');
/* uma vez por lista: renderList troca o HTML, nao os ouvintes */
['berlin','paris','colonia'].forEach(c=>bindRows(document.getElementById('list-'+c)));
renderList('berlin',true);rendered['berlin']=true;
bindPlan();renderPlan();
spOpen();
whoSync();
nuvemLiga();
requestAnimationFrame(()=>moveInk(document.querySelector('.tab.on'),false));
stats();
window.addEventListener('load',()=>moveInk(document.querySelector('.tab.on'),false));
