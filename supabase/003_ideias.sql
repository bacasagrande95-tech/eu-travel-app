-- ============================================================
-- Viagem Europa · novembro 2026
-- Passo 3: ideias anotadas no app e os cards que nascem delas.
--
-- A ideia é o que a pessoa escreveu, sem pesquisa nenhuma — fica
-- guardada e visível para os dois. O card é a ficha que nasce depois,
-- escrita à mão (pelo Bruno, com o agente), e entra no catálogo como
-- qualquer outro passeio, com as etiquetas "novo" e "por <nome>".
--
-- Roda depois do 002 e pode rodar mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- Ideia. Nasce "pendente" e vira "atendida" quando o card existe.
-- Apagar é liberado para os dois: a lista de ideias é do casal,
-- diferente das marcações, que são de cada um.
-- ------------------------------------------------------------
create table if not exists public.ideia (
  id          uuid        primary key default gen_random_uuid(),
  pessoa_id   uuid        not null references auth.users (id) on delete cascade,
  cidade      text        not null check (cidade in ('berlin','paris','colonia')),
  texto       text        not null,
  estado      text        not null default 'pendente'
                          check (estado in ('pendente','atendida')),
  lugar_id    text,
  criado_em   timestamptz not null default now(),
  atendida_em timestamptz,
  constraint ideia_texto_preenchido check (btrim(texto) <> '')
);

create index if not exists ideia_por_cidade
  on public.ideia (cidade, estado, criado_em desc);

alter table public.ideia enable row level security;
grant select, insert, update, delete on public.ideia to authenticated;

drop policy if exists ideia_leitura on public.ideia;
create policy ideia_leitura on public.ideia
  for select to authenticated
  using ( (select public.e_participante()) );

drop policy if exists ideia_insere on public.ideia;
create policy ideia_insere on public.ideia
  for insert to authenticated
  with check ( pessoa_id = (select auth.uid())
               and (select public.e_participante()) );

drop policy if exists ideia_edita on public.ideia;
create policy ideia_edita on public.ideia
  for update to authenticated
  using ( pessoa_id = (select auth.uid())
          and (select public.e_participante()) )
  with check ( pessoa_id = (select auth.uid())
               and (select public.e_participante()) );

drop policy if exists ideia_apaga on public.ideia;
create policy ideia_apaga on public.ideia
  for delete to authenticated
  using ( (select public.e_participante()) );

-- ------------------------------------------------------------
-- Lugar: a ficha pronta, que passa a fazer parte do catálogo.
-- O app só lê. Quem escreve é quem pesquisa (por SQL), de propósito:
-- o app não inventa card sozinho.
-- ------------------------------------------------------------
create table if not exists public.lugar (
  id        text        primary key,
  cidade    text        not null check (cidade in ('berlin','paris','colonia')),
  categoria text        not null,
  nome      text        not null,
  original  text,
  bairro    text,
  duracao   text,
  preco     text,
  porque    text        not null,
  etiquetas text[]      not null default '{}',
  autor_id  uuid        references auth.users (id) on delete set null,
  ideia_id  uuid        references public.ideia (id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint lugar_nome_preenchido check (btrim(nome) <> ''),
  constraint lugar_categoria_valida check (categoria in
    ('data','arte','historia','bairro','natureza','noturno','balada',
     'comida','compras','palco','unica','batevolta')),
  constraint lugar_id_prefixado check (id like 'sug-%')
);

create index if not exists lugar_por_cidade on public.lugar (cidade, categoria);

alter table public.lugar enable row level security;
grant select on public.lugar to authenticated;

drop policy if exists lugar_leitura on public.lugar;
create policy lugar_leitura on public.lugar
  for select to authenticated
  using ( (select public.e_participante()) );

-- ============================================================
-- CONFERÊNCIA — deve aparecer: 5 tabelas, 5 com segurança ligada,
-- 14 políticas.
-- ============================================================
select 'tabelas' as conferencia, count(*)::text as resultado
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('avaliacao','item_roteiro','participante','ideia','lugar')
union all
select 'com seguranca ligada', count(*)::text
  from pg_tables
 where schemaname = 'public'
   and tablename in ('avaliacao','item_roteiro','participante','ideia','lugar') and rowsecurity
union all
select 'politicas de acesso', count(*)::text
  from pg_policies
 where schemaname = 'public'
   and tablename in ('avaliacao','item_roteiro','participante','ideia','lugar');
