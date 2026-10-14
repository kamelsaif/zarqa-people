-- One-time initialization. Replace the placeholder with the confirmed owner's email.
-- Run AFTER migrations/001_hr.sql. Refuses to overwrite an existing workspace.
begin;
do $bootstrap$
declare owner_id uuid; owner_email text := 'REPLACE_WITH_CONFIRMED_OWNER_EMAIL';
begin
  if exists(select 1 from public.hr_workspace) or exists(select 1 from public.hr_members)
    then raise exception 'WORKSPACE_ALREADY_INITIALIZED'; end if;
  select id into owner_id from auth.users where lower(email)=lower(owner_email) and email_confirmed_at is not null;
  if owner_id is null then raise exception 'CONFIRMED_OWNER_REQUIRED'; end if;
  insert into public.hr_workspace(id,data) values('default', $state${"schema":1,"revision":0,"settings":{"company":"زرقاء","product":"ZARQA People","accent":"#C8A252","logo":"","currency":"EGP","payday":28,"autoSend":false,"weekend":[5,6],"policyVersion":"1.0","requiredDocuments":[],"managerEmail":"","hrEmail":"","financeEmail":""},"access":[],"employees":[],"attendance":[],"jobs":[],"candidates":[],"leaves":[],"policies":[],"payroll":[],"offboarding":[],"reviews":[],"events":[],"audit":[],"documents":[],"requests":[],"shifts":[],"contracts":[]}$state$::jsonb);
  insert into public.hr_members(user_id,email,role,active,owner) values(owner_id,lower(owner_email),'admin',true,true);
end $bootstrap$;
commit;
