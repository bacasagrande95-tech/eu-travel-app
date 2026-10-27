/* Revisão editorial de 27/10/2026. Sem dados de perfis e sem escrita no banco. */
(function(){
  'use strict';
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cities={berlin:'Berlim · 6–9/11',paris:'Paris · 13–16/11',colonia:'Colônia · base'};
  const priorities=[
    {c:'colonia',id:'colonia-11-11-abertura-da-sessao-de-carnaval-11h11',title:'Carnaval de Colônia · 11/11',when:'Decidir nesta semana',text:'Palco oficial no Heumarkt ou festa em bar/bairro? A área oficial exige ingresso. Confira lote e horário de entrada antes de comprar.',label:'Ver organizador e ingressos'},
    {c:'paris',id:'paris-paris-photo-12-a-15-11-no-grand-palais',title:'Paris Photo · escolher 13, 14 ou 15/11',when:'Comprar quando escolher o dia',text:'€36 na sexta; €41 no sábado/domingo; €26 depois das 17h. Venda online, válida no dia escolhido e sem troca. A feira termina em 15/11.',label:'Comprar no site oficial'},
    {c:'berlin',id:'berlin-reichstag-cupula-de-vidro',title:'Reichstag · reserva gratuita',when:'Solicitar agora',text:'Escolha um horário entre 6 e 9/11. É preciso cadastrar todos os visitantes e receber a confirmação. Disponibilidade de horários não foi verificada.',label:'Solicitar visita gratuita'},
    {c:'berlin',id:'berlin-berliner-unterwelten-bunkers-e-tuneis',title:'Unterwelten · bunkers e túneis',when:'Decidir nesta semana',text:'Escolha tour, idioma e horário. As vendas abrem até 30 dias antes e não há bilheteria no ponto de encontro. A janela de novembro já abriu.',label:'Ver condições e loja oficial'},
    {c:'paris',id:'paris-made-in-france-expo-12-a-15-11',title:'MIF Expo · convite gratuito',when:'Emitir antes de viajar',text:'Grátis com pré-inscrição; €10 no local. Reserve uma manhã entre 13 e 15/11. Porte de Versailles, Hall 7.2.',label:'Emitir convite gratuito'},
    {c:'paris',id:'paris-torre-eiffel',title:'Subir na Torre Eiffel?',when:'Escolher andar e horário agora',text:'Se quiser subir, consulte os horários de 13–16/11 na bilheteria oficial. Ver a torre de fora e assistir às luzes continua gratuito.',label:'Consultar bilheteria oficial'},
    {c:'paris',id:'paris-louvre',title:'Louvre · opção para segunda, 16/11',when:'Reservar após fechar o dia',text:'Abre na segunda, ao contrário do palácio de Versailles. A página atual lista €32 para visitantes fora do EEE; confirme sua categoria.',label:'Ver horários e ingressos'},
    {c:'berlin',id:'berlin-neues-museum-busto-de-nefertiti',title:'Nefertiti · entre 6 e 8/11',when:'Definir o dia',text:'Seu item de roteiro continua sem dia. O Neues Museum fecha segunda, 9/11. Prefira sexta, sábado ou domingo e consulte o horário de entrada.',label:'Consultar visita e ingressos'},
    {c:'paris',id:'paris-ciclo-wagner-na-opera-06-a-22-11',title:'Wagner · conferir ingresso individual',when:'Só se você quiser ópera',text:'Há apresentações em 13/11 às 18h e 15/11 às 14h30. O Ring Pass inclui quatro noites fora da sua janela; confira venda avulsa ou bolsa oficial.',label:'Ver regras do festival'}
  ];
  const notes={
    berlin:['08/11, domingo: feira no Mauerpark; karaokê não confirmado para novembro.','Lichtenberger Winterzeit e LGBTQIA Winterdays têm datas publicadas dentro de 6–9/11.','09/11: aniversário da queda do Muro; cerimônia específica ainda não confirmada na agenda consultada.'],
    paris:['Paris Photo e MIF Expo terminam em 15/11; o dia 16 fica livre para outro programa.','Mercados: La Défense a partir de 12/11; Tuileries a partir de 14/11, segundo o turismo oficial.','Versailles fecha em 16/11, segunda. Luzes dos Champs-Élysées são anunciadas para 22/11, depois da sua passagem.'],
    colonia:['11/11: abertura oficial no Heumarkt com ingresso e horários de acesso.','Prefeitura prevê restrições na Altstadt das 6h às 22h e possíveis mudanças nas paradas de transporte.','Museu Romano-Germânico aberto no Belgisches Haus; Stadtmuseum em Minoritenstraße 13.']
  };
  const item=id=>DATA.find(it=>it.id===id);
  function priorityHTML(p){
    const it=item(p.id);
    return '<li class="decision-item"><div><h3>'+esc(p.title)+'</h3><p class="decision-when">'+esc(p.when)+'</p><p>'+esc(p.text)+'</p></div><a class="decision-link" href="'+esc(it.revisao.url)+'" target="_blank" rel="noopener noreferrer">'+esc(p.label)+' <span aria-hidden="true">↗</span></a></li>';
  }
  document.querySelectorAll('[data-decision-city]').forEach(el=>{
    const c=el.dataset.decisionCity;
    el.innerHTML='<div class="decision-heading"><h2>Decidir agora</h2><a href="agenda.html#'+c+'">Ver revisão completa ↗</a></div>'
      +'<p class="decision-updated">Revisão de 27/10/2026 · '+esc(cities[c])+'</p>'
      +'<ul class="decision-list">'+priorities.filter(p=>p.c===c).slice(0,2).map(priorityHTML).join('')+'</ul>'
      +'<details class="decision-notes"><summary>Datas e mudanças para sua passagem</summary><ul>'+notes[c].map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></details>';
  });
  const full=document.getElementById('agenda-full');
  if(full){
    full.innerHTML=Object.keys(cities).map(c=>'<section class="agenda-section" id="'+c+'"><h2>'+esc(cities[c])+'</h2><ul class="decision-list">'+priorities.filter(p=>p.c===c).map(priorityHTML).join('')+'</ul><ul class="agenda-notes">'+notes[c].map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></section>').join('');
    const rows=DATA.filter(it=>it.k==='data').map(it=>'<tr><th scope="row">'+esc(it.n)+'</th><td>'+esc(it.revisao.status)+'</td><td><a href="'+esc(it.revisao.url)+'" target="_blank" rel="noopener noreferrer">Consultar fonte ↗</a></td></tr>').join('');
    full.innerHTML+='<section class="agenda-section"><h2>Todos os eventos datados do catálogo</h2><p>13 itens revisados. “Pendente” significa que a programação ou parte das condições ainda precisa de confirmação.</p><div class="agenda-table"><table><thead><tr><th scope="col">Evento</th><th scope="col">Situação em 27/10</th><th scope="col">Fonte</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
  }
})();
