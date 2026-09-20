/* ============================================================
   Nuvem — a conversa com o Supabase.

   Este arquivo é só transporte: entrar, sair, ler e gravar.
   Quem decide o que fazer com os dados é o app.js.

   Nada aqui pode derrubar a tela: toda chamada que falha vira
   exceção, e quem chamou decide o que mostrar. É isso que deixa
   o app funcionar sem rede, como sempre funcionou.

   A leitura do banco é compartilhada (as marcações dos dois são
   visíveis para os dois) e a escrita é sempre em nome próprio —
   quem garante isso é a política dentro do banco, não este arquivo.
   ============================================================ */
window.NUVEM=(function(){
  const CFG=window.SUPABASE||{};
  const BASE=String(CFG.url||'').replace(/\/+$/,'');
  const CHAVE=CFG.chave||'';
  const CHAVESESS='europa-nov2026-sessao-v1';
  let sessao=null;

  const configurado=!!(BASE&&CHAVE);

  function lerSessao(){
    if(sessao)return sessao;
    try{const r=localStorage.getItem(CHAVESESS);if(r)sessao=JSON.parse(r);}catch(e){}
    return sessao;
  }
  function gravaSessao(s){
    sessao=s||null;
    try{
      if(sessao)localStorage.setItem(CHAVESESS,JSON.stringify(sessao));
      else localStorage.removeItem(CHAVESESS);
    }catch(e){}
  }

  function cabecalhos(extra){
    const h={apikey:CHAVE,'Content-Type':'application/json'};
    const s=lerSessao();
    if(s&&s.access_token)h.Authorization='Bearer '+s.access_token;
    if(extra)for(const k in extra)h[k]=extra[k];
    return h;
  }

  function erroDe(status,mensagem,codigo){
    const e=new Error(mensagem||('HTTP '+status));
    e.status=status;e.codigo=codigo;
    return e;
  }

  async function pedirAuth(caminho,corpo,comSessao){
    const h={apikey:CHAVE,'Content-Type':'application/json'};
    if(comSessao){
      const s=lerSessao();
      if(s&&s.access_token)h.Authorization='Bearer '+s.access_token;
    }
    const r=await fetch(BASE+'/auth/v1/'+caminho,{method:'POST',headers:h,body:JSON.stringify(corpo)});
    const j=await r.json().catch(()=>null);
    if(!r.ok)throw erroDe(r.status,(j&&(j.error_description||j.msg||j.error))||'',j&&j.error_code);
    return j;
  }

  async function entrar(email,senha){
    if(!configurado)throw erroDe(0,'falta a configuração do Supabase');
    const j=await pedirAuth('token?grant_type=password',{email:email,password:senha});
    gravaSessao({access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at,user:j.user});
    return j.user;
  }

  /* a tela não pede e-mail: pede o nome. O e-mail é montado aqui, sempre
     no mesmo padrão, e é a única coisa que liga o botão à conta do banco. */
  function emailDe(nome){
    return String(nome||'').toLowerCase().trim()+'@'+(CFG.dominio||'viagem.local');
  }
  async function entrarComo(nome,senha){
    return entrar(emailDe(nome),senha);
  }

  async function renova(){
    const s=lerSessao();
    if(!s||!s.refresh_token)throw erroDe(401,'sem sessão para renovar');
    const j=await pedirAuth('token?grant_type=refresh_token',{refresh_token:s.refresh_token});
    gravaSessao({access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at,user:j.user});
    return j.user;
  }

  function sair(){gravaSessao(null);}

  async function api(caminho,opcoes){
    opcoes=opcoes||{};
    const r=await fetch(BASE+'/rest/v1/'+caminho,{
      method:opcoes.method||'GET',
      headers:cabecalhos(opcoes.headers),
      body:opcoes.body?JSON.stringify(opcoes.body):undefined
    });
    /* 401 é token vencido: renova uma vez e repete */
    if(r.status===401&&opcoes.repetiu!==true){
      try{await renova();}
      catch(e){throw erroDe(401,'sessão vencida');}
      return api(caminho,Object.assign({},opcoes,{repetiu:true}));
    }
    if(!r.ok){
      let msg='';
      try{const j=await r.json();msg=(j&&(j.message||j.hint||j.details))||'';}catch(e){}
      throw erroDe(r.status,msg,r&&r.status===403?'42501':'');
    }
    if(r.status===204)return null;
    const t=await r.text();
    return t?JSON.parse(t):null;
  }

  /* tudo de uma vez: quem é quem, as marcações e o roteiro */
  async function puxar(){
    const partes=await Promise.all([
      api('participante?select=pessoa_id,nome,cor,pode_editar_roteiro&order=nome'),
      api('avaliacao?select=pessoa_id,lugar_id,nivel,nota'),
      api('item_roteiro?select=pessoa_id,lugar_id,dia,posicao'),
      api('ideia?select=id,pessoa_id,cidade,texto,estado,lugar_id,criado_em&order=criado_em.desc'),
      api('lugar?select=id,cidade,categoria,nome,original,bairro,duracao,preco,porque,etiquetas')
    ]);
    return {
      pessoas:partes[0]||[],avaliacoes:partes[1]||[],roteiro:partes[2]||[],
      ideias:partes[3]||[],lugares:partes[4]||[]
    };
  }

  /* as ideias são anotadas direto pelo app; o card, não — quem escreve
     card é quem pesquisa, por SQL */
  async function criarIdeia(linha){
    return api('ideia',{
      method:'POST',
      headers:{Prefer:'return=representation'},
      body:linha
    });
  }
  async function apagarIdeia(id){
    return api('ideia?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
  }

  /* sobe as minhas marcações e apaga as minhas que sumiram.
     A lista é sempre completa, então o que não está nela não existe mais. */
  async function enviarMarcas(pessoaId,marcas){
    if(marcas.length){
      await api('avaliacao',{
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body:marcas
      });
    }
    const ids=marcas.map(m=>m.lugar_id);
    const filtro=ids.length?('&lugar_id=not.in.('+ids.join(',')+')'):'';
    await api('avaliacao?pessoa_id=eq.'+pessoaId+filtro,{method:'DELETE'});
  }

  async function enviarRoteiro(pessoaId,itens){
    if(itens.length){
      await api('item_roteiro',{
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body:itens
      });
    }
    const ids=itens.map(i=>i.lugar_id);
    const filtro=ids.length?('&lugar_id=not.in.('+ids.join(',')+')'):'';
    await api('item_roteiro?pessoa_id=eq.'+pessoaId+filtro,{method:'DELETE'});
  }

  return {
    configurado:configurado,
    entrar:entrar,
    entrarComo:entrarComo,
    emailDe:emailDe,
    sair:sair,
    renova:renova,
    puxar:puxar,
    criarIdeia:criarIdeia,
    apagarIdeia:apagarIdeia,
    enviarMarcas:enviarMarcas,
    enviarRoteiro:enviarRoteiro,
    lerSessao:lerSessao
  };
})();
