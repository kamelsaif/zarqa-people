const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const properties=new Map([['DRIVE_FOLDER_ID','company-folder']]);
const files=[];
let actor={role:'admin',email:'admin@company.example'},reads=0,writes=0,released=0,trashed=false,failUpload=false,sequence=0;
const folder={isTrashed:()=>trashed,getName:()=>'Private HR',createFile(name,body,mime){if(failUpload)throw Error('Drive unavailable');const file={id:'file-'+(++sequence),name,body,mime};files.push(file);return {getId:()=>file.id};}};
const context=vm.createContext({Date,Math,Set,Map,JSON,Object,console,
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null,setProperties:o=>Object.entries(o).forEach(([k,v])=>properties.set(k,v))})},
 DriveApp:{getFolderById(id){assert.equal(id,'company-folder');reads++;return folder;},getFileById(id){assert.equal(id,'company-book');return{isTrashed:()=>false};}},
 Utilities:{formatDate:()=>new Date().toISOString().slice(0,10),getUuid:()=>String(++sequence)},MimeType:{PLAIN_TEXT:'text/plain'},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})}
});
for(const file of ['dist/seed.js','dist/core.js','dist/operations-core.js','google-workspace/Code.gs'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
context.fixture=vm.runInContext('makeSeed()',context);
context.testActor=()=>actor;
context.testWrite=()=>writes++;
vm.runInContext("readState_=()=>fixture;actor_=()=>testActor();book_=()=>({getId:()=> 'company-book',getName:()=> 'HR Records'});writeState_=()=>testWrite();",context);
const call=(action,payload={})=>context.api(action,payload);
for(const role of ['employee','manager','finance','hr']){
 actor={role,email:role+'@company.example'};
 const before={reads,files:files.length,writes};
 for(const action of ['admin.status','admin.backup'])assert.throws(()=>call(action,{role:'admin',folderId:'attacker-folder'}),/Administrator access required/);
 assert.deepEqual({reads,files:files.length,writes},before,'Unauthorised requests must not probe storage or write');
}
assert.equal(released,8,'Locks are released on rejected calls');
actor={role:'admin',email:'admin@company.example'};
const status=call('admin.status');
assert.equal(status.connected,true);assert.equal(status.databaseName,'HR Records');assert.equal(status.records.employees,48);
assert.equal(status.lastBackupAt,'');assert(!JSON.stringify(status).includes('company-folder'),'No storage identifiers or secrets in status');
call('admin.backup',{folderId:'attacker-folder'});
assert.equal(files.length,1);assert.equal(writes,1);assert.equal(JSON.parse(files[0].body).employees.length,48);
assert.equal(context.fixture.audit[0].action,'data.backup: manual private Drive snapshot');
assert(properties.get('BACKUP_AT'));assert.equal(properties.get('BACKUP_FILE_ID'),files[0].id);
const after=call('admin.status');assert.equal(after.lastBackupAt,properties.get('BACKUP_AT'));
vm.runInContext('backup_(fixture)',context);assert.equal(files.length,1,'Daily snapshot is deduplicated');
call('admin.backup');assert.equal(files.length,2,'Manual backup runs even after today’s snapshot');assert.notEqual(files[0].name,files[1].name);
trashed=true;assert.throws(()=>call('admin.backup'),/trash/);assert.equal(files.length,2);trashed=false;
const priorBackup=properties.get('BACKUP_AT'),priorAudit=context.fixture.audit.length;
failUpload=true;assert.throws(()=>call('admin.backup'),/Drive unavailable/);
assert.equal(properties.get('BACKUP_AT'),priorBackup);assert.equal(context.fixture.audit.length,priorAudit,'Failed backup cannot log success');
console.log('✓ Admin-only storage probes, ignored client destination, private snapshots, daily deduplication, audit and failure handling');

const ui=require('./interface.test.cjs');
for(const language of ['ar','en'])for(const tab of ['storage','accounts','backups']){
 vm.runInContext('role="admin";page="data";uiLang='+JSON.stringify(language)+';dataCenterTab='+JSON.stringify(tab)+';render();',ui.context);
 const html=ui.elements.get('main').innerHTML;
 assert(!/undefined|NaN/.test(html));assert(!html.includes('type="password"'));
 assert(html.includes('data-action="dataTab"'));
}
vm.runInContext('uiLang="en";dataCenterTab="accounts";accessSearch="employee1@example.com";render();',ui.context);
assert.equal(vm.runInContext('accessDirectoryRows().length',ui.context),1);
vm.runInContext('accessForm("employee1@example.com");',ui.context);
assert(ui.elements.get('dialogBody').innerHTML.includes('value="employee1@example.com"'));
for(const role of ['employee','manager','finance','hr']){
 vm.runInContext('role='+JSON.stringify(role)+';page="data";render();',ui.context);
 assert(!vm.runInContext('allowedPages().includes("data")',ui.context));
 assert(!ui.elements.get('navigation').innerHTML.includes('data-nav="data"'));
}
console.log('✓ Data centre tabs, bilingual demo disclosures, account search, role editing and administrator navigation');
