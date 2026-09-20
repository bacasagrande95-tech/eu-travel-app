-- ============================================================
-- Viagem Europa · novembro 2026
-- Passo 2: leitura compartilhada e dono do roteiro.
--
-- A regra nova:
--   · as marcações de todo mundo ficam visíveis para todo mundo —
--     a graça é justamente comparar os gostos;
--   · cada pessoa continua só podendo gravar em nome de si mesma;
--   · o roteiro todo mundo lê, mas só quem tem
--     pode_editar_roteiro = true escreve nele.
--
-- COMO RODAR: painel do Supabase -> SQL Editor -> New query,
-- cole este arquivo inteiro e clique em Run.
--
-- Roda depois do 001 e pode rodar mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- Quem é quem. É daqui que o app tira os nomes, as cores e quem
-- manda no roteiro, em vez de ter isso escrito dentro do código.
-- ------------------------------------------------------------
create table if not exists public.participante (
  pessoa_id           uuid        not null references auth.users (id) on delete cascade,
  nome                text        not null,
  cor                 text        not null,
  pode_editar_roteiro boolean     not null default false,
  criado_em           timestamptz not null default now(),
  primary key (pessoa_id),
  constraint participante_nome_preenchido check (btrim(nome) <> '')
);

alter table public.participante enable row level security;

-- só leitura para o app: quem cadastra gente é o dono do banco,
-- pelo painel ou por SQL. Sem política de escrita, ninguém grava.
grant select on public.participante to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'participante'
                    and policyname = 'participante_leitura') then
    create policy participante_leitura on public.participante
      for select to authenticated
      using (true);
  end if;
end $$;

-- ------------------------------------------------------------
-- Duas perguntas que as políticas repetem. O "select" em volta
-- faz o banco responder uma vez por consulta, não uma vez por
-- linha — é o que mantém a política barata em tabela grande.
-- ------------------------------------------------------------
create or replace function public.e_participante()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.participante p
     where p.pessoa_id = (select auth.uid())
  );
$$;

create or replace function public.pode_editar_roteiro()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.participante p
     where p.pessoa_id = (select auth.uid())
       and p.pode_editar_roteiro
  );
$$;

-- ------------------------------------------------------------
-- Avaliações: todo mundo lê tudo, cada um escreve o seu.
-- ------------------------------------------------------------
drop policy if exists avaliacao_leitura on public.avaliacao;
create policy avaliacao_leitura on public.avaliacao
  for select to authenticated
  using ( (select public.e_participante()) );

drop policy if exists avaliacao_insere on public.avaliacao;
create policy avaliacao_insere on public.avaliacao
  for insert to authenticated
  with check ( pessoa_id = (select auth.uid())
               and (select public.e_participante()) );

drop policy if exists avaliacao_edita on public.avaliacao;
create policy avaliacao_edita on public.avaliacao
  for update to authenticated
  using ( pessoa_id = (select auth.uid())
          and (select public.e_participante()) )
  with check ( pessoa_id = (select auth.uid())
               and (select public.e_participante()) );

drop policy if exists avaliacao_apaga on public.avaliacao;
create policy avaliacao_apaga on public.avaliacao
  for delete to authenticated
  using ( pessoa_id = (select auth.uid())
          and (select public.e_participante()) );

-- ------------------------------------------------------------
-- Roteiro: todo mundo lê, só o dono escreve. "using" decide
-- quais linhas a pessoa alcança; "with check", o que ela pode
-- deixar gravado.
-- ------------------------------------------------------------
drop policy if exists roteiro_leitura on public.item_roteiro;
create policy roteiro_leitura on public.item_roteiro
  for select to authenticated
  using ( (select public.e_participante()) );

drop policy if exists roteiro_insere on public.item_roteiro;
create policy roteiro_insere on public.item_roteiro
  for insert to authenticated
  with check ( pessoa_id = (select auth.uid())
               and (select public.pode_editar_roteiro()) );

drop policy if exists roteiro_edita on public.item_roteiro;
create policy roteiro_edita on public.item_roteiro
  for update to authenticated
  using ( pessoa_id = (select auth.uid())
          and (select public.pode_editar_roteiro()) )
  with check ( pessoa_id = (select auth.uid())
               and (select public.pode_editar_roteiro()) );

drop policy if exists roteiro_apaga on public.item_roteiro;
create policy roteiro_apaga on public.item_roteiro
  for delete to authenticated
  using ( pessoa_id = (select auth.uid())
          and (select public.pode_editar_roteiro()) );

-- ============================================================
-- CONFERÊNCIA — é isto que deve aparecer depois de rodar:
-- 3 tabelas, 3 com segurança ligada, 13 políticas.
-- ============================================================
select 'tabelas' as conferencia, count(*)::text as resultado
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('avaliacao','item_roteiro','participante')
union all
select 'com seguranca ligada', count(*)::text
  from pg_tables
 where schemaname = 'public'
   and tablename in ('avaliacao','item_roteiro','participante') and rowsecurity
union all
select 'politicas de acesso', count(*)::text
  from pg_policies
 where schemaname = 'public'
   and tablename in ('avaliacao','item_roteiro','participante');
