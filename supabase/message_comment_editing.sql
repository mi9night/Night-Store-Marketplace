-- message_comment_editing.sql
-- Night Store Marketplace — редактирование/удаление своих ЛС + отметка edited_at.
-- Запускать в Supabase Dashboard → SQL Editor.

begin;

alter table public.messages add column if not exists edited_at timestamptz;
alter table public.forum_comments add column if not exists edited_at timestamptz;

create or replace function public.edit_own_message(
  p_message_id uuid,
  p_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_updated_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if nullif(trim(coalesce(p_text, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'empty_text');
  end if;

  update public.messages
  set
    text = trim(p_text),
    edited_at = now()
  where id = p_message_id
    and sender_id = v_user
  returning id into v_updated_id;

  if v_updated_id is null then
    return jsonb_build_object('ok', false, 'error', 'message_not_found_or_forbidden');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_own_message(
  p_message_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_deleted_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  delete from public.messages
  where id = p_message_id
    and sender_id = v_user
  returning id into v_deleted_id;

  if v_deleted_id is null then
    return jsonb_build_object('ok', false, 'error', 'message_not_found_or_forbidden');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

commit;
