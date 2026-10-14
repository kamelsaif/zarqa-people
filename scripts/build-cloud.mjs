import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {emptyState} from '../cloud/empty-state.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'artifacts','godaddy');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
await fs.cp(path.join(root,'dist'),output,{recursive:true,filter:source=>!source.endsWith('.zip') && path.basename(source)!=='seed.js'});
let app=await fs.readFile(path.join(root,'dist/app.js'),'utf8');
app=app.replace("const LIVE=typeof google!=='undefined'&&google.script&&google.script.run;",'const CLOUD=true; const LIVE=true;');
app=app.replace('function settingsPage(){','function workspaceEditionSettingsPage(){');
app=app.replace("let state=makeSeed(),role='admin',employeeId='EMP-048'","let state="+JSON.stringify(emptyState())+",role='employee',employeeId=''");
app=app.replace("function callServer(action,payload={}){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).api(action,payload));}","function callServer(action,payload={}){return window.ZarqaCloud.call(action,payload);}");
app=app.replace("page=location.hash.slice(1)||'dashboard';render();","page=location.hash.slice(1)||'dashboard';");
app=app.replace("if(form.id==='documentUpload'", "if(form.id==='cloudAuthForm'||form.id==='cloudLinkForm'||form.id==='documentUpload'");
app=app.replace("window.addEventListener('hashchange',()=>{", "window.addEventListener('hashchange',()=>{if(document.body.classList.contains('cloud-locked'))return;");
app=app.replace("const id=el.dataset.id,a=el.dataset.action;try{switch(a)","const id=el.dataset.id,a=el.dataset.action;if(['importData','confirmImport','resetDemo','confirmReset','demoCredentials','logoutDemo'].includes(a))return;try{switch(a)");
app=app.replace("selectField('القسم','department',[...new Set(state.employees.map(e=>e.department))])", "field('القسم','department','text','')");
app=app.replaceAll(".length/state.policies.length", ".length/Math.max(1,state.policies.length)");
app=app.replaceAll("'18000'", "'0'");
app=app.replaceAll("'سجلات Google Workspace'", "'سجلات Supabase'").replaceAll("'Use your Google Workspace identity.'", "'Use your registered Supabase account.'");
app=app.replace('type="checkbox" name="autoSend"','type="checkbox" name="autoSend" disabled');
app=app.replace("تفعيل الجدولة '+(LIVE?'(تشغيل حقيقي)' :'التجريبية')", "الجدولة التلقائية غير متاحة في هذه النسخة '+''");
app=app.replace("'GOOGLE WORKSPACE • متصل'", "'SUPABASE • متصل'").replace("'متصل بـ Google Workspace'", "'Supabase PostgreSQL'").replace("'Sheets + Drive · صلاحيات الخادم'", "'Auth + Database · صلاحيات الخادم'");
app=app.replace("سيتم إنشاء PDF خاص وإرساله إلى بريد كل موظف مسجل في هذا الكشف المعتمد.","سيتم إرسال إشعار برابط بوابة الموظف لكل صاحب كشف معتمد. يلزم تسجيل الدخول لعرض الكشف وحفظ PDF.");
app=app.replace("}).catch(e=>{$('main').innerHTML=", "}).catch(e=>{if(document.body.classList.contains('cloud-locked'))return;$('main').innerHTML=");
app=app.replace("$('roleSelect').disabled=true;", "$('roleSelect').disabled=true;$('roleSelect').hidden=true;");
await fs.writeFile(path.join(output,'app.js'),app);
for(const filename of ['portal.js','workspace.js']){
 let source=await fs.readFile(path.join(output,filename),'utf8');
 source=source.replaceAll('.length/state.policies.length','.length/Math.max(1,state.policies.length)');
 source=source.replaceAll("LIVE?'Google Workspace'", "LIVE?'Supabase'");
 await fs.writeFile(path.join(output,filename),source);
}
let html=await fs.readFile(path.join(output,'index.html'),'utf8');
html=html.replace('<body>','<body class="cloud-locked">').replace('</head>','<link rel="stylesheet" href="cloud.css"></head>');
html=html.replace('<script src="seed.js"></script>','');
html=html.replace('<script src="app.js"></script>','<script src="cloud-config.js"></script><script src="cloud-client.js"></script><script src="cloud-ui.js"></script><script src="app.js"></script>');
html=html.replace('<button class="menu-action" id="helpButton"','<button class="menu-action" data-action="cloudLogout">تسجيل الخروج / Sign out</button><button class="menu-action" id="helpButton"');
await fs.writeFile(path.join(output,'index.html'),html);
await fs.copyFile(path.join(root,'cloud/config.example.js'),path.join(output,'cloud-config.js'));
await fs.copyFile(path.join(root,'cloud/ui.js'),path.join(output,'cloud-ui.js'));
await fs.copyFile(path.join(root,'cloud/cloud.css'),path.join(output,'cloud.css'));
await fs.copyFile(path.join(root,'cloud/htaccess'),path.join(output,'.htaccess'));
// The backend contains the existing validated business rules, without demo fixtures.
const engine=await fs.readFile(path.join(root,'dist/core.js'),'utf8')+'\n'+await fs.readFile(path.join(root,'dist/operations-core.js'),'utf8')+
 '\nexport {hrMutate,hrEnsureOperations,hrDate,hrRequestVisible};\n';
await fs.writeFile(path.join(root,'cloud/engine.mjs'),engine);
const shared=path.join(root,'cloud/supabase/functions/_shared');await fs.mkdir(shared,{recursive:true});
for(const file of ['engine.mjs','domain.mjs','services.mjs','handler.mjs'])await fs.copyFile(path.join(root,'cloud',file),path.join(shared,file));
await build({entryPoints:[path.join(root,'cloud/client.js')],outfile:path.join(output,'cloud-client.js'),bundle:true,minify:true,format:'iife',target:'es2022',legalComments:'eof'});
await fs.writeFile(path.join(root,'cloud/initial-state.json'),JSON.stringify(emptyState(),null,2)+'\n');
const bootstrap = `-- One-time initialization. Replace the placeholder with the confirmed owner's email.
-- Run AFTER migrations/001_hr.sql. Refuses to overwrite an existing workspace.
begin;
do $bootstrap$
declare owner_id uuid; owner_email text := 'REPLACE_WITH_CONFIRMED_OWNER_EMAIL';
begin
  if exists(select 1 from public.hr_workspace) or exists(select 1 from public.hr_members)
    then raise exception 'WORKSPACE_ALREADY_INITIALIZED'; end if;
  select id into owner_id from auth.users where lower(email)=lower(owner_email) and email_confirmed_at is not null;
  if owner_id is null then raise exception 'CONFIRMED_OWNER_REQUIRED'; end if;
  insert into public.hr_workspace(id,data) values('default', $state$${JSON.stringify(emptyState())}$state$::jsonb);
  insert into public.hr_members(user_id,email,role,active,owner) values(owner_id,lower(owner_email),'admin',true,true);
end $bootstrap$;
commit;
`;
await fs.writeFile(path.join(root,'cloud/bootstrap.example.sql'),bootstrap);
console.log('Built locked-by-default GoDaddy frontend and Supabase function bundle. No credentials or live data included.');
