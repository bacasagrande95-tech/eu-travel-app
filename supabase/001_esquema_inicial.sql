-- ============================================================
-- Viagem Europa · novembro 2026
-- Esquema inicial do banco.
--
-- COMO RODAR: painel do Supabase -> SQL Editor -> New query,
-- cole este arquivo inteiro e clique em Run.
--
-- Pode rodar mais de uma vez sem quebrar nada: as tabelas usam
-- "if not exists" e as políticas são criadas uma única vez.
-- ============================================================

-- ------------------------------------------------------------
-- Avaliação: a nota de interesse e a anotação escrita de UMA pessoa
-- sobre UM passeio. O id do passeio é o slug estável do catálogo
-- (ex.: berlin-neues-museum-busto-de-nefertiti), que fica no app.
-- ------------------------------------------------------------
create table if not exists public.avaliacao (
  pessoa_id     uuid        not null references auth.users (id) on delete cascade,
  lugar_id      text        not null,
  nivel         text        check (nivel in ('must','want','maybe','no')),
  nota          text,
  atualizado_em timestamptz not null default now(),
  primary key (pessoa_id, lugar_id),
  -- uma linha só existe se tiver conteúdo: ou tem nível, ou tem anotação
  constraint avaliacao_tem_conteudo
    check (nivel is not null or (nota is not null and btrim(nota) <> ''))
);

-- ------------------------------------------------------------
-- Roteiro: onde cada passeio foi encaixado.
-- dia nulo = ainda está em "sem dia definido".
-- posicao = a ordem dentro daquele dia (ou dentro do pool).
-- ------------------------------------------------------------
create table if not exists public.item_roteiro (
  pessoa_id     uuid        not null references auth.users (id) on delete cascade,
  lugar_id      text        not null,
  dia           date,
  posicao       integer     not null,
  atualizado_em timestamptz not null default now(),
  primary key (pessoa_id, lugar_id)
);

create index if not exists item_roteiro_ordem
  on public.item_roteiro (pessoa_id, dia, posicao);

-- ------------------------------------------------------------
-- Acesso. A regra é uma só: cada pessoa só enxerga e só mexe
-- no que é dela. Quem garante isso é o banco, não o aplicativo —
-- então nem um erro no app consegue vazar o dado do outro.
-- ------------------------------------------------------------
alter table public.avaliacao    enable row level security;
alter table public.item_roteiro enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.avaliacao    to authenticated;
grant select, insert, update, delete on public.item_roteiro to authenticated;

-- avaliação
-- "create policy" não aceita "if not exists", então cada uma passa por um
-- teste antes. É isso que permite rodar o arquivo quantas vezes quiser.
do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'avaliacao'
                    and policyname = 'avaliacao_leitura') then
    create policy avaliacao_leitura on public.avaliacao
      for select to authenticated
      using ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'avaliacao'
                    and policyname = 'avaliacao_insere') then
    create policy avaliacao_insere on public.avaliacao
      for insert to authenticated
      with check ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'avaliacao'
                    and policyname = 'avaliacao_edita') then
    create policy avaliacao_edita on public.avaliacao
      for update to authenticated
      using ( pessoa_id = (select auth.uid()) )
      with check ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'avaliacao'
                    and policyname = 'avaliacao_apaga') then
    create policy avaliacao_apaga on public.avaliacao
      for delete to authenticated
      using ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'item_roteiro'
                    and policyname = 'roteiro_leitura') then
    create policy roteiro_leitura on public.item_roteiro
      for select to authenticated
      using ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'item_roteiro'
                    and policyname = 'roteiro_insere') then
    create policy roteiro_insere on public.item_roteiro
      for insert to authenticated
      with check ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'item_roteiro'
                    and policyname = 'roteiro_edita') then
    create policy roteiro_edita on public.item_roteiro
      for update to authenticated
      using ( pessoa_id = (select auth.uid()) )
      with check ( pessoa_id = (select auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'item_roteiro'
                    and policyname = 'roteiro_apaga') then
    create policy roteiro_apaga on public.item_roteiro
      for delete to authenticated
      using ( pessoa_id = (select auth.uid()) );
  end if;
end $$;

-- ------------------------------------------------------------
-- Carimbo de "quando mudou pela última vez".
-- Sem privilégio especial: roda como quem chamou.
-- ------------------------------------------------------------
create or replace function public.toca_atualizado_em()
returns trigger
language plpgsql
-- sem search_path próprio, a função aceitaria um schema plantado no caminho
-- de busca de quem chama; fixo em vazio porque ela só usa now() (pg_catalog).
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end
$$;

drop trigger if exists avaliacao_atualiza on public.avaliacao;
create trigger avaliacao_atualiza
  before update on public.avaliacao
  for each row execute function public.toca_atualizado_em();

drop trigger if exists roteiro_atualiza on public.item_roteiro;
create trigger roteiro_atualiza
  before update on public.item_roteiro
  for each row execute function public.toca_atualizado_em();

-- ============================================================
-- CONFERÊNCIA — é isto que deve aparecer depois de rodar:
-- 2 tabelas, 2 com segurança ligada, 8 políticas.
-- ============================================================
select 'tabelas' as conferencia, count(*)::text as resultado
  from information_schema.tables
 where table_schema = 'public' and table_name in ('avaliacao','item_roteiro')
union all
select 'com seguranca ligada', count(*)::text
  from pg_tables
 where schemaname = 'public' and tablename in ('avaliacao','item_roteiro') and rowsecurity
union all
select 'politicas de acesso', count(*)::text
  from pg_policies
 where schemaname = 'public' and tablename in ('avaliacao','item_roteiro');
