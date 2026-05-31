-- moderate_delete_review.sql
-- Night Store Marketplace — удаление отзывов модераторами/админами/овнером.
-- Запускать в Supabase Dashboard → SQL Editor.

begin;

create or replace function public.moderate_delete_review(p_review_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mod uuid := auth.uid();
  v_role text;
  v_target_user uuid;
  v_account uuid;
  v_avg numeric;
  v_positive_count integer;
begin
  select role into v_role from public.users where id = v_mod;

  if v_role not in ('moderator', 'admin', 'owner') then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  select target_user_id, account_id
  into v_target_user, v_account
  from public.reviews
  where id = p_review_id;

  if v_target_user is null then
    return jsonb_build_object('ok', false, 'error', 'review_not_found');
  end if;

  delete from public.reviews where id = p_review_id;

  select avg(rating), count(*) filter (where positive = true)
  into v_avg, v_positive_count
  from public.reviews
  where target_user_id = v_target_user;

  update public.users
  set
    rating = coalesce(v_avg, 0),
    positive_reviews = coalesce(v_positive_count, 0)
  where id = v_target_user;

  if to_regclass('public.moderation_logs') is not null then
    insert into public.moderation_logs(moderator_id, action, target_type, target_id)
    values (v_mod, 'delete_review', 'review', p_review_id);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

commit;
