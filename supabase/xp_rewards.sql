-- xp_rewards.sql
-- Night Store Marketplace — рабочая система начисления XP.
-- Запускать в Supabase Dashboard → SQL Editor.
-- Что делает:
-- +50 XP  за положительный отзыв продавцу
-- +100 XP за успешную продажу продавцу
-- +25 XP  за завершение гарантии продавцу
-- +200 XP за верификацию профиля
-- +150 XP за участие в розыгрыше
-- +10 XP  за комментарий на форуме
-- +1 XP   за личное сообщение

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Колонки статистики
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.users add column if not exists xp integer not null default 0;
alter table public.users add column if not exists sales integer not null default 0;
alter table public.users add column if not exists positive_reviews integer not null default 0;
alter table public.users add column if not exists completed_guarantees integer not null default 0;
alter table public.users add column if not exists giveaways integer not null default 0;
alter table public.users add column if not exists forum_activity_xp integer not null default 0;

-- Лог начислений, чтобы не давать XP дважды за одно и то же событие.
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  ref_table text,
  ref_id text,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref_table, ref_id)
);

create index if not exists xp_events_user_id_idx on public.xp_events(user_id);
create index if not exists xp_events_created_at_idx on public.xp_events(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Универсальное начисление XP
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.award_user_xp(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_ref_table text default null,
  p_ref_id text default null,
  p_forum_activity integer default 0,
  p_sales integer default 0,
  p_positive_reviews integer default 0,
  p_completed_guarantees integer default 0,
  p_giveaways integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_amount = 0 then
    return;
  end if;

  insert into public.xp_events(user_id, amount, reason, ref_table, ref_id)
  values (p_user_id, p_amount, p_reason, p_ref_table, p_ref_id)
  on conflict (user_id, reason, ref_table, ref_id) do nothing;

  -- Если событие уже было записано раньше, не начисляем повторно.
  if not found then
    return;
  end if;

  update public.users
  set
    xp = coalesce(xp, 0) + p_amount,
    forum_activity_xp = coalesce(forum_activity_xp, 0) + greatest(p_forum_activity, 0),
    sales = coalesce(sales, 0) + greatest(p_sales, 0),
    positive_reviews = coalesce(positive_reviews, 0) + greatest(p_positive_reviews, 0),
    completed_guarantees = coalesce(completed_guarantees, 0) + greatest(p_completed_guarantees, 0),
    giveaways = coalesce(giveaways, 0) + greatest(p_giveaways, 0)
  where id = p_user_id;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Триггеры начисления
-- ═══════════════════════════════════════════════════════════════════════════

-- Продажа: после создания заказа продавцу +100 XP и +1 sale.
create or replace function public.xp_on_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  v_seller_id := nullif(to_jsonb(new)->>'seller_id', '')::uuid;

  if v_seller_id is null and new.account_id is not null then
    select seller_id into v_seller_id
    from public.accounts
    where id = new.account_id;
  end if;

  if v_seller_id is not null then
    perform public.award_user_xp(
      v_seller_id,
      100,
      'sale_completed',
      'orders',
      new.id::text,
      0,
      1,
      0,
      0,
      0
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_xp_on_order_insert on public.orders;
create trigger trg_xp_on_order_insert
after insert on public.orders
for each row execute function public.xp_on_order_insert();

-- Завершение гарантии: когда заказ стал completed, продавцу +25 XP.
create or replace function public.xp_on_order_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_old_status text;
  v_new_status text;
begin
  v_old_status := lower(coalesce(to_jsonb(old)->>'status', ''));
  v_new_status := lower(coalesce(to_jsonb(new)->>'status', ''));

  if v_new_status = 'completed' and v_old_status is distinct from v_new_status then
    v_seller_id := nullif(to_jsonb(new)->>'seller_id', '')::uuid;

    if v_seller_id is null and new.account_id is not null then
      select seller_id into v_seller_id
      from public.accounts
      where id = new.account_id;
    end if;

    if v_seller_id is not null then
      perform public.award_user_xp(
        v_seller_id,
        25,
        'guarantee_completed',
        'orders',
        new.id::text,
        0,
        0,
        0,
        1,
        0
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_xp_on_order_completed on public.orders;
create trigger trg_xp_on_order_completed
after update on public.orders
for each row execute function public.xp_on_order_completed();

-- Положительный отзыв: продавцу +50 XP и +1 positive_reviews.
create or replace function public.xp_on_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.positive, false) = true and new.target_user_id is not null then
    perform public.award_user_xp(
      new.target_user_id,
      50,
      'positive_review',
      'reviews',
      new.id::text,
      0,
      0,
      1,
      0,
      0
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_xp_on_review_insert on public.reviews;
create trigger trg_xp_on_review_insert
after insert on public.reviews
for each row execute function public.xp_on_review_insert();

-- Верификация: +200 XP один раз, когда verified становится true.
create or replace function public.xp_on_user_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.verified, false) = true and coalesce(old.verified, false) = false then
    perform public.award_user_xp(
      new.id,
      200,
      'profile_verified',
      'users',
      new.id::text,
      0,
      0,
      0,
      0,
      0
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_xp_on_user_verified on public.users;
create trigger trg_xp_on_user_verified
after update of verified on public.users
for each row execute function public.xp_on_user_verified();

-- Участие в розыгрыше: +150 XP участнику.
do $$
begin
  if to_regclass('public.giveaway_participants') is not null then
    create or replace function public.xp_on_giveaway_join()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      perform public.award_user_xp(
        new.user_id,
        150,
        'giveaway_joined',
        'giveaway_participants',
        coalesce(to_jsonb(new)->>'id', new.giveaway_id::text || ':' || new.user_id::text),
        0,
        0,
        0,
        0,
        1
      );
      return new;
    end;
    $fn$;

    drop trigger if exists trg_xp_on_giveaway_join on public.giveaway_participants;
    create trigger trg_xp_on_giveaway_join
    after insert on public.giveaway_participants
    for each row execute function public.xp_on_giveaway_join();
  end if;
end $$;

-- Комментарий на форуме: +10 XP автору.
do $$
begin
  if to_regclass('public.forum_comments') is not null then
    create or replace function public.xp_on_forum_comment()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      perform public.award_user_xp(
        new.author_id,
        10,
        'forum_comment',
        'forum_comments',
        new.id::text,
        10,
        0,
        0,
        0,
        0
      );
      return new;
    end;
    $fn$;

    drop trigger if exists trg_xp_on_forum_comment on public.forum_comments;
    create trigger trg_xp_on_forum_comment
    after insert on public.forum_comments
    for each row execute function public.xp_on_forum_comment();
  end if;
end $$;

-- Личные сообщения: +1 XP отправителю.
do $$
begin
  if to_regclass('public.messages') is not null then
    create or replace function public.xp_on_message_insert()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      perform public.award_user_xp(
        new.sender_id,
        1,
        'message_sent',
        'messages',
        new.id::text,
        1,
        0,
        0,
        0,
        0
      );
      return new;
    end;
    $fn$;

    drop trigger if exists trg_xp_on_message_insert on public.messages;
    create trigger trg_xp_on_message_insert
    after insert on public.messages
    for each row execute function public.xp_on_message_insert();
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Синхронизация уже существующих данных
-- ═══════════════════════════════════════════════════════════════════════════
-- Можно запускать повторно: xp_events защитит от двойного начисления.

create or replace function public.sync_existing_xp_rewards()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_seller_id uuid;
begin
  -- Заказы / продажи
  for r in select * from public.orders loop
    v_seller_id := nullif(to_jsonb(r)->>'seller_id', '')::uuid;
    if v_seller_id is null and r.account_id is not null then
      select seller_id into v_seller_id from public.accounts where id = r.account_id;
    end if;

    if v_seller_id is not null then
      perform public.award_user_xp(v_seller_id, 100, 'sale_completed', 'orders', r.id::text, 0, 1, 0, 0, 0);

      if lower(coalesce(to_jsonb(r)->>'status', '')) = 'completed' then
        perform public.award_user_xp(v_seller_id, 25, 'guarantee_completed', 'orders', r.id::text, 0, 0, 0, 1, 0);
      end if;
    end if;
  end loop;

  -- Отзывы
  for r in select * from public.reviews where coalesce(positive, false) = true loop
    perform public.award_user_xp(r.target_user_id, 50, 'positive_review', 'reviews', r.id::text, 0, 0, 1, 0, 0);
  end loop;

  -- Верификация
  for r in select id from public.users where coalesce(verified, false) = true loop
    perform public.award_user_xp(r.id, 200, 'profile_verified', 'users', r.id::text, 0, 0, 0, 0, 0);
  end loop;

  -- Розыгрыши
  if to_regclass('public.giveaway_participants') is not null then
    for r in select * from public.giveaway_participants loop
      perform public.award_user_xp(r.user_id, 150, 'giveaway_joined', 'giveaway_participants', coalesce(to_jsonb(r)->>'id', r.giveaway_id::text || ':' || r.user_id::text), 0, 0, 0, 0, 1);
    end loop;
  end if;

  -- Форум
  if to_regclass('public.forum_comments') is not null then
    for r in select * from public.forum_comments loop
      perform public.award_user_xp(r.author_id, 10, 'forum_comment', 'forum_comments', r.id::text, 10, 0, 0, 0, 0);
    end loop;
  end if;

  -- Сообщения
  if to_regclass('public.messages') is not null then
    for r in select * from public.messages loop
      perform public.award_user_xp(r.sender_id, 1, 'message_sent', 'messages', r.id::text, 1, 0, 0, 0, 0);
    end loop;
  end if;
end;
$$;

select public.sync_existing_xp_rewards();

commit;
