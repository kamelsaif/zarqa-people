import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
import {actorFor,scopeState,validateMutation,validateDocument} from '../cloud/domain.mjs';
import {emptyState} from '../cloud/empty-state.mjs';
import {createHandler} from '../cloud/handler.mjs';
import {cloudServices} from '../cloud/services.mjs';
import {decryptBackup} from '../scripts/decrypt-backup.mjs';
const owner='11111111-1111-4111-8111-111111111111', employee='22222222-2222-4222-8222-222222222222';
const user={id:employee,email:'employee@example.com',email_confirmed_at:'2026-10-14T00:00:00Z'};
const membership={user_id:employee,email:user.email,role:'employee',employee_id:'E1',active:true};
function fixture(){const s=emptyState();s.employees=[{id:'E1',name:'One',status:'active',email:user.email,salary:100,manager:'M1'},{id:'E2',name:'Two',status:'active',email:'two@example.com',salary:200,manager:'M1'},{id:'E3',name:'Three',status:'active',salary:300,manager:'M2'}];return s;}
test('verified user ID membership defeats spoofed browser roles and user metadata',()=>{
 const s=fixture();assert.equal(actorFor({...user,user_metadata:{role:'admin'}},membership,s).role,'employee');
 assert.throws(()=>actorFor({...user,id:owner},membership,s),/Access denied/);
 assert.throws(()=>actorFor({...user,email_confirmed_at:null},membership,s),/Access denied/);
 assert.throws(()=>actorFor(user,{...membership,active:false},s),/Access denied/);
 assert.throws(()=>actorFor(user,null,s),/Access denied/);
 s.employees[0].status='inactive';assert.throws(()=>actorFor(user,membership,s),/inactive/);
});
test('employee scope excludes other salaries, contracts, requests and payroll effect metadata',()=>{
 const s=fixture();s.payroll=[{id:'P',month:'2026-10',status:'approved',adjustments:[{employeeId:'E2',amount:99}],rows:[{employeeId:'E1',net:100},{employeeId:'E2',net:200}]}];
 s.requests=[{id:'R1',employeeId:'E1'},{id:'R2',employeeId:'E2'}];s.documents=[{id:'D',employeeId:'E2',fileId:'private'}];
 const view=scopeState(s,actorFor(user,membership,s));
 assert.deepEqual(view.employees.map(e=>e.id),['E1']);assert.equal(view.payroll[0].rows.length,1);assert.equal(view.payroll[0].adjustments,undefined);
 assert.equal(view.documents.length,0);assert.equal(view.requests.length,1);assert.equal(s.employees.length,3);
});
test('manager sees only team, with colleague salary and private profile fields removed',()=>{
 const s=fixture();s.employees[0].privateNotes='sensitive';
 const view=scopeState(s,{role:'manager',employeeId:'M1'});
 assert.deepEqual(view.employees.map(e=>e.id),['E1','E2']);assert.equal(view.employees[0].salary,0);assert.equal(view.employees[0].privateNotes,undefined);
});
test('live mutation forbids simulation, arbitrary file registration and other employee writes',()=>{
 const s=fixture(),a=actorFor(user,membership,s);
 for(const action of ['document.register','payroll.simulate','access.set'])assert.throws(()=>validateMutation(action,{},a,s));
 assert.throws(()=>validateMutation('leave.create',{employeeId:'E2'},a,s));
 assert.throws(()=>validateMutation('settings.save',{autoSend:true},{role:'admin'},s));
});
test('uploads require ownership, allowed requirement and matching file signature',()=>{
 const s=fixture();s.settings.requiredDocuments=['ID'];const a=actorFor(user,membership,s);
 const p={employeeId:'E1',type:'ID',mime:'application/pdf',base64:btoa('%PDF-1.7\n')};
 assert.equal(validateDocument(p,s,a)[0],37);
 assert.throws(()=>validateDocument({...p,employeeId:'E2'},s,a));
 assert.throws(()=>validateDocument({...p,base64:btoa('<script>bad</script>')},s,a));
 assert.throws(()=>validateDocument({...p,mime:'image/png'},s,a));
});
test('HTTP endpoint rejects unknown sessions, origins and spoofed roles before data disclosure',async()=>{
 const envValues={APP_ORIGIN:'https://hr.example.com',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-secret',SUPABASE_ANON_KEY:'public-key'};
 let authenticated=false;
 const handler=createHandler(k=>envValues[k],async url=>{
  if(url.endsWith('/auth/v1/user'))return Response.json(authenticated?user:{error:'invalid'},{status:authenticated?200:401});
  if(url.includes('hr_workspace?'))return Response.json([{data:fixture(),revision:0}]);
  if(url.includes('hr_members?user_id='))return Response.json([membership]);
  throw Error('Unexpected external call');
 });
 const req=(origin='https://hr.example.com',token='Bearer invalid')=>new Request('https://test.supabase.co/functions/v1/hr-api',{method:'POST',headers:{Origin:origin,Authorization:token},body:JSON.stringify({action:'bootstrap',role:'admin'})});
 assert.equal((await handler(req('https://evil.example'))).status,403);
 assert.equal((await handler(req())).status,401);
 authenticated=true;const response=await handler(req());const data=await response.json();
 assert.equal(data.actor.role,'employee');assert.equal(data.state.employees.length,1);assert(!JSON.stringify(data).includes('server-secret'));
});
test('PostgreSQL grants, atomic revisions, owner protection and account links',async t=>{
 const db=new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);');
 await db.exec(await fs.readFile(new URL('../cloud/migrations/001_hr.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1,$2,now()),($3,$4,now())',[owner,'owner@example.com',employee,user.email]);
 await db.query("insert into public.hr_workspace(id,data) values('default',$1)",[fixture()]);
 await db.query("insert into public.hr_members(user_id,email,role,active,owner) values($1,'owner@example.com','admin',true,true)",[owner]);
 const commit=(expected,data,change=null)=>db.query('select public.hr_commit($1,$2,$3,$4,$5)',[expected,data,owner,'test',change]);
 await t.test('anonymous and authenticated clients cannot read tables or execute privileged RPCs',async()=>{
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   await assert.rejects(db.exec('select * from public.hr_workspace'),/permission denied/);
   await assert.rejects(commit(0,fixture()),/permission denied/);
   await db.exec('reset role');
  }
 });
 await t.test('stale revision rolls back account changes and does not append audit',async()=>{
  await commit(0,fixture());
  await assert.rejects(commit(0,fixture()),/STALE_REVISION/);
  assert.equal((await db.query('select count(*)::int as count from public.hr_audit')).rows[0].count,1);
 });
 await t.test('owner cannot be demoted or disabled',async()=>{
  await assert.rejects(commit(1,fixture(),{user_id:owner,role:'employee',active:true}),/OWNER_PROTECTED/);
  await assert.rejects(commit(1,fixture(),{user_id:owner,role:'admin',active:false}),/OWNER_PROTECTED/);
 });
 await t.test('account linking checks confirmed auth user and employee email, advances revision',async()=>{
  await assert.rejects(db.query('select public.hr_link_member($1,1,$2,$3,$4)',[owner,user.email,'employee','E2']),/EMPLOYEE_MISMATCH/);
  await db.query('select public.hr_link_member($1,1,$2,$3,$4)',[owner,user.email,'employee','E1']);
  assert.equal((await db.query('select revision::int from public.hr_workspace')).rows[0].revision,2);
  await assert.rejects(db.query('select public.hr_link_member($1,2,$2,$3,$4)',[employee,'owner@example.com','admin',null]),/ADMIN_REQUIRED/);
 });
 await t.test('disabled actor cannot commit even with a previously valid snapshot',async()=>{
  await commit(2,fixture(),{user_id:employee,role:'employee',active:false,employee_id:'E1'});
  await assert.rejects(db.query('select public.hr_commit(3,$1,$2,$3,null)',[fixture(),employee,'leave.create']),/ACCESS_REVOKED/);
 });
 await db.close();
});
test('cloud artifact is closed by default, excludes seed fixtures, and parses',async()=>{
 const html=await fs.readFile('artifacts/godaddy/index.html','utf8');
 const app=await fs.readFile('artifacts/godaddy/app.js','utf8');
 assert(html.includes('cloud-locked'));assert(!html.includes('src="seed.js"'));
 await assert.rejects(fs.access('artifacts/godaddy/seed.js'));
 assert(app.includes('window.ZarqaCloud.call'));assert(!app.includes('let state=makeSeed()'));
 assert(!app.includes("page=location.hash.slice(1)||'dashboard';render();"));
 new vm.Script(app);new vm.Script(await fs.readFile('artifacts/godaddy/cloud-ui.js','utf8'));
});
test('payroll receipts reconcile a lost state commit without sending a second email',async()=>{
 const settings={APP_ORIGIN:'https://hr.example.com',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-secret',RESEND_API_KEY:'test-email-key',EMAIL_FROM:'people@example.com'};
 let persisted=fixture(), failCommit=true, emails=0; const deliveries=new Map();
 persisted.payroll=[{id:'P1',month:'2026-10',status:'approved',approvedBy:'finance@example.com',rows:[{employeeId:'E1',email:user.email,status:'queued'}]}];
 const fetcher=async (url,opts={})=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({...user,id:owner});
  if(url.includes('/hr_workspace?'))return Response.json([{data:structuredClone(persisted),revision:persisted.revision}]);
  if(url.includes('/hr_members?user_id='))return Response.json([{user_id:owner,email:'owner@example.com',role:'admin',active:true}]);
  if(url.includes('/hr_members?employee_id='))return Response.json([{email:user.email}]);
  if(url.includes('/hr_deliveries')){
   const id=new URL(url).searchParams.get('id')?.slice(3), body=opts.body?JSON.parse(opts.body):null;
   if(opts.method==='POST'){assert(!deliveries.has(body.id));deliveries.set(body.id,body);return new Response(null,{status:201});}
   if(opts.method==='PATCH'){Object.assign(deliveries.get(id),body);return new Response(null,{status:204});}
   return Response.json(deliveries.has(id)?[deliveries.get(id)]:[]);
  }
  if(url.endsWith('/rpc/hr_commit')){
   if(failCommit){failCommit=false;return Response.json({message:'STALE_REVISION'},{status:400});}
   persisted=JSON.parse(opts.body).next_data;persisted.revision++;return Response.json(persisted.revision);
  }
  if(url==='https://api.resend.com/emails'){
   emails++;assert.equal(opts.headers['Idempotency-Key'],'payslip:P1:E1');
   const body=JSON.parse(opts.body);assert.deepEqual(body.to,[user.email]);assert(!body.attachments);
   return Response.json({id:'provider-receipt'});
  }
  throw Error('Unexpected request: '+url);
 };
 const handler=createHandler(k=>settings[k],fetcher);
 const request=()=>new Request('https://test.supabase.co/functions/v1/hr-api',{method:'POST',headers:{Origin:settings.APP_ORIGIN,Authorization:'Bearer test'},body:JSON.stringify({action:'sendPayroll',payload:{id:'P1'},expectedRevision:0})});
 assert.equal((await handler(request())).status,200);assert.equal(emails,1);assert.equal(persisted.payroll[0].rows[0].status,'queued');
 assert.equal((await handler(request())).status,200);assert.equal(emails,1);assert.equal(persisted.payroll[0].rows[0].status,'sent');
 assert.equal(deliveries.get('payslip:P1:E1').provider_id,'provider-receipt');
});
test('backup encryption round-trips, rejects wrong keys and detects tampering',async()=>{
 const key='01'.repeat(32), settings={BACKUP_ENCRYPTION_KEY:key,GOOGLE_DRIVE_FOLDER_ID:'private-folder',GOOGLE_CLIENT_ID:'fixture',GOOGLE_CLIENT_SECRET:'fixture',GOOGLE_REFRESH_TOKEN:'fixture'};
 let envelope;
 const service=cloudServices(k=>settings[k],async (url,opts)=>{
  if(url.includes('oauth2.googleapis.com'))return Response.json({access_token:'fixture'});
  const multipart=new Uint8Array(await opts.body.arrayBuffer());
  const marker=new TextEncoder().encode('ZPBACKUP1');let start=-1;
  for(let i=0;i<multipart.length-marker.length;i++)if(marker.every((v,j)=>multipart[i+j]===v)){start=i;break;}
  assert(start>0);
  const boundary=opts.headers['Content-Type'].split('boundary=')[1];
  envelope=multipart.subarray(start,multipart.length-new TextEncoder().encode('\r\n--'+boundary+'--').length);
  return Response.json({id:'private-backup'});
 });
 const data={state:fixture(),members:[membership]};await service.backup(data);
 assert.deepEqual(await decryptBackup(envelope,key),data);
 await assert.rejects(decryptBackup(envelope,'02'.repeat(32)));
 const changed=new Uint8Array(envelope);changed[changed.length-1]^=1;
 await assert.rejects(decryptBackup(changed,key));
});
test('empty cloud workspace renders allowed pages without demo fixtures or invalid values',async()=>{
 const elements=new Map(),storage=new Map(),classes=new Set(['cloud-locked']);
 const classList={add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(){},contains:k=>classes.has(k)};
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,style:{setProperty(){}},setAttribute(){},classList,addEventListener(){},querySelectorAll(){return[]},focus(){},showModal(){},close(){}});return elements.get(id);};
 const context=vm.createContext({console,Date,Math,Set,Intl,Blob,URL,AbortSignal,setTimeout(){},queueMicrotask(){},MutationObserver:class{observe(){}},NodeFilter:{SHOW_TEXT:4},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:''},window:{addEventListener(){},scrollTo(){},print(){},ZarqaCloud:{call:()=>new Promise(()=>{})}},document:{getElementById:element,documentElement:{setAttribute(){},style:{setProperty(){}}},body:{classList,querySelectorAll(){return[]}},querySelector:()=>element('sidebar-link'),querySelectorAll:()=>[],createTreeWalker:()=>({nextNode:()=>null}),addEventListener(){}},navigator:{}});
 for(const file of ['icons.js','core.js','operations-core.js','portal.js','admin.js','documents.js','laws.js','i18n.js','workspace.js','experience.js','people.js','data-center.js','cloud-ui.js','app.js'])vm.runInContext(await fs.readFile('artifacts/godaddy/'+file,'utf8'),context);
 vm.runInContext('hrEnsureOperations(state);',context);
 for(const language of ['ar','en'])for(const r of ['admin','hr','finance','employee','manager']){
  vm.runInContext('uiLang='+JSON.stringify(language)+';role='+JSON.stringify(r)+';',context);
  for(const page of vm.runInContext('allowedPages()',context)){
   vm.runInContext('page='+JSON.stringify(page)+';render();',context);
   assert(!/undefined|NaN/.test(element('main').innerHTML),r+' '+page+' '+language);
  }
 }
 assert.equal(storage.has('zarqa-people-state'),false);
});
