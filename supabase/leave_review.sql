-- leave_review.sql
-- Night Store Marketplace — функция отзывов после покупки.
-- Исправляет ошибку: Could not find function public.leave_review(...)
-- Запускать в Supabase Dashboard → SQL Editor.

begin;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete cascade,
  account_id uuid,
  rating integer,
  positive boolean not null default true,
  text text,
  created_at timestamptz not null default now(),
  unique(user_id, account_id)
);

alter table public.reviews add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.reviews add column if not exists target_user_id uuid references public.users(id) on delete cascade;
alter table public.reviews add column if not exists account_id uuid;
alter table public.reviews add column if not exists rating integer;
alter table public.reviews add column if not exists positive boolean not null default true;
alter table public.reviews add column if not exists text text;
alter table public.reviews add column if not exists created_at timestamptz not null default now();

create index if not exists reviews_target_user_idx on public.reviews(target_user_id);
create index if not exists reviews_account_idx on public.reviews(account_id);

create or replace function public.leave_review(
  p_account_id uuid,
  p_rating integer,
  p_positive boolean,
  p_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_seller uuid;
  v_order_id uuid;
  v_exists uuid;
  v_avg numeric;
  v_positive_count integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select id into v_order_id
  from public.orders
  where buyer_id = v_user
    and account_id = p_account_id
  order by created_at desc
  limit 1;

  if v_order_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_order');
  end if;

  select seller_id into v_seller
  from public.accounts
  where id = p_account_id;

  if v_seller is null then
    return jsonb_build_object('ok', false, 'error', 'account_not_found');
  end if;

  select id into v_exists
  from public.reviews
  where user_id = v_user
    and account_id = p_account_id
  limit 1;

  if v_exists is not null then
    return jsonb_build_object('ok', false, 'error', 'already_reviewed');
  end if;

  insert into public.reviews(user_id, target_user_id, account_id, rating, positive, text)
  values (
    v_user,
    v_seller,
    p_account_id,
    greatest(1, least(5, coalesce(p_rating, 5))),
    coalesce(p_positive, true),
    nullif(trim(coalesce(p_text, '')), '')
  );

  select avg(rating), count(*) filter (where positive = true)
  into v_avg, v_positive_count
  from public.reviews
  where target_user_id = v_seller;

  update public.users
  set
    rating = coalesce(v_avg, rating),
    positive_reviews = coalesce(v_positive_count, positive_reviews, 0)
  where id = v_seller;

  -- Если уже выполнялся xp_rewards.sql, триггер сам начислит XP.
  return jsonb_build_object('ok', true);
end;
$$;

commit;
