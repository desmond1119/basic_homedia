-- Upsert function for app_users
create or replace function public.handle_app_user_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'id', new.id,
    'email', new.email,
    'username', coalesce(new.raw_user_meta_data ->> 'username', new.email),
    'full_name', coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'avatar_url', new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.app_users (id, email, username, full_name, avatar_url)
  values (
    payload ->> 'id',
    payload ->> 'email',
    payload ->> 'username',
    payload ->> 'full_name',
    payload ->> 'avatar_url'
  )
  on conflict (id)
  do update set
    email = excluded.email,
    username = coalesce(excluded.username, public.app_users.username),
    full_name = coalesce(excluded.full_name, public.app_users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.app_users.avatar_url),
    updated_at = now();

  return new;
exception when unique_violation then
  -- Ignore duplicate inserts from race conditions
  return new;
end;
$$;

alter function public.handle_app_user_upsert() owner to postgres;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_app_user_upsert();
