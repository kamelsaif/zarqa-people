-- Run in a dedicated Supabase project. No default/demo accounts or HR records.
begin;
create table if not exists public.hr_workspace (
  id text primary key check (id = 'default'),
  revision bigint not null default 0,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
create table if not exists public.hr_members (
  user_id uuid primary key references auth.users(id),
  email text not null unique check (email = lower(email)),
  role text not null check (role in ('admin','hr','finance','manager','employee')),
  employee_id text,
  active boolean not null default true,
  owner boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.hr_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid not null,
  action text not null,
  revision bigint not null
);
create table if not exists public.hr_deliveries (
  id text primary key,
  user_id uuid not null,
  run_id text not null,
  employee_id text not null,
  status text not null check (status in ('sending','sent','review_required')),
  provider_id text,
  updated_at timestamptz not null default now()
);
alter table public.hr_workspace enable row level security;
alter table public.hr_members enable row level security;
alter table public.hr_audit enable row level security;
alter table public.hr_deliveries enable row level security;
-- No browser-accessible policies. Only the verified Edge Function may read/write.
revoke all on public.hr_workspace, public.hr_members, public.hr_audit, public.hr_deliveries from anon, authenticated;
grant all on public.hr_workspace, public.hr_members, public.hr_audit, public.hr_deliveries to service_role;
grant usage, select on sequence public.hr_audit_id_seq to service_role;
create or replace function public.hr_commit(expected_revision bigint, next_data jsonb,
  acting_user uuid, operation text, member_change jsonb default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare next_revision bigint; target public.hr_members; actor public.hr_members;
begin
  -- Every writer serializes on the workspace row, including access revocation.
  perform 1 from public.hr_workspace where id='default' for update;
  select * into actor from public.hr_members where user_id=acting_user and active;
  if not found then raise exception 'ACCESS_REVOKED'; end if;
  if member_change is not null then
    if actor.role <> 'admin' then raise exception 'ADMIN_REQUIRED'; end if;
    select * into target from public.hr_members where user_id=(member_change->>'user_id')::uuid;
    if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
    if target.owner and (member_change->>'role'<>'admin' or not (member_change->>'active')::boolean)
      then raise exception 'OWNER_PROTECTED'; end if;
    update public.hr_members set role=member_change->>'role',
      active=(member_change->>'active')::boolean,
      employee_id=nullif(member_change->>'employee_id',''), updated_at=now()
      where user_id=target.user_id;
  end if;
  update public.hr_workspace set data=jsonb_set(next_data,'{revision}',to_jsonb(expected_revision+1)),
    revision=expected_revision+1, updated_at=now()
    where id='default' and revision=expected_revision returning revision into next_revision;
  if next_revision is null then raise exception 'STALE_REVISION'; end if;
  insert into public.hr_audit(user_id,action,revision) values(acting_user,operation,next_revision);
  return next_revision;
end $$;
revoke all on function public.hr_commit(bigint,jsonb,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.hr_commit(bigint,jsonb,uuid,text,jsonb) to service_role;
create or replace function public.hr_link_member(acting_user uuid, expected_revision bigint,
  target_email text, target_role text, target_employee_id text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor public.hr_members; target_id uuid; current_data jsonb; current_revision bigint;
begin
  select data,revision into current_data,current_revision from public.hr_workspace where id='default' for update;
  if current_revision is distinct from expected_revision then raise exception 'STALE_REVISION'; end if;
  select * into actor from public.hr_members where user_id=acting_user and active and role='admin';
  if not found then raise exception 'ADMIN_REQUIRED'; end if;
  if target_role not in ('admin','hr','finance','manager','employee') then raise exception 'INVALID_ROLE'; end if;
  select id into target_id from auth.users where lower(email)=lower(target_email) and email_confirmed_at is not null;
  if target_id is null then raise exception 'CONFIRMED_AUTH_USER_REQUIRED'; end if;
  if exists(select 1 from public.hr_members where user_id=target_id) then raise exception 'MEMBER_EXISTS'; end if;
  if target_role in ('employee','manager') and nullif(target_employee_id,'') is null then raise exception 'EMPLOYEE_REQUIRED'; end if;
  if nullif(target_employee_id,'') is not null and not exists (
    select 1 from jsonb_array_elements(current_data->'employees') e where e->>'id'=target_employee_id
      and lower(e->>'email')=lower(target_email) and e->>'status'<>'inactive') then raise exception 'EMPLOYEE_MISMATCH'; end if;
  insert into public.hr_members(user_id,email,role,employee_id)
    values(target_id,lower(target_email),target_role,nullif(target_employee_id,''));
  update public.hr_workspace set revision=revision+1,updated_at=now(),
    data=jsonb_set(data,'{revision}',to_jsonb(revision+1)) where id='default';
  insert into public.hr_audit(user_id,action,revision) values(acting_user,'account.link',expected_revision+1);
  return target_id;
end $$;
revoke all on function public.hr_link_member(uuid,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.hr_link_member(uuid,bigint,text,text,text) to service_role;
commit;
