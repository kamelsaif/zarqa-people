import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../cloud/ui.js',import.meta.url),'utf8');
function setup(callServer,language='en'){
 const notices=[];
 const context=vm.createContext({role:'admin',page:'data',dataCenterBusy:false,dataCenterStatus:null,dataCenterError:'',
  state:{settings:{}},callServer,render(){},toast:message=>notices.push(message),
  tx:(ar,en)=>language==='ar'?ar:en,actionTitle:action=>action,reportData:()=>({headers:[]}),document:{addEventListener(){}},
  card:(title,subtitle,body,actions)=>body+actions,esc:String,dataTime:value=>value||'Not recorded yet'});
 vm.runInContext(source,context);
 return {context,notices};
}
for(const language of ['ar','en'])test(`backup refreshes complete service status and prevents repeat submissions in ${language}`,async()=>{
 let resolveBackup;
 const calls=[],savedAt='2026-10-15T01:14:54Z';
 const {context,notices}=setup(async action=>{
  calls.push(action);
  if(action==='admin.backup')return new Promise(resolve=>{resolveBackup=resolve;});
  if(action==='getState')return {settings:{lastBackupAt:savedAt},revision:1};
  if(action==='admin.status')return {driveConnected:true,emailConfigured:true,lastBackupAt:savedAt};
  throw Error('Unexpected request');
 },language);
 const work=context.checkDataConnection(true);
 assert.equal(context.dataCenterBusy,true);
 assert.match(context.backupsPanel(),/disabled aria-busy="true"/);
 assert.match(context.backupsPanel(),language==='ar'?/جارٍ حفظ النسخة/:/Saving backup/);
 await context.checkDataConnection(true);
 assert.deepEqual(calls,['admin.backup']);
 resolveBackup({driveConnected:true,lastBackupAt:savedAt});
 await work;
 assert.deepEqual(calls,['admin.backup','getState','admin.status']);
 assert.equal(context.dataCenterStatus.emailConfigured,true);
 assert.equal(context.dataCenterStatus.driveConnected,true);
 assert.equal(context.state.revision,1);
 assert.equal(context.dataCenterBusy,false);
 assert.doesNotMatch(context.backupsPanel(),/disabled|Saving backup|جارٍ حفظ النسخة/);
 assert.equal(notices.length,1);
});
test('failed backup preserves the previous confirmed timestamp and enables retry',async()=>{
 const {context,notices}=setup(async()=>{throw Error('Drive unavailable');});
 context.state.settings.lastBackupAt='previous';
 await context.checkDataConnection(true);
 assert.equal(context.state.settings.lastBackupAt,'previous');
 assert.equal(context.dataCenterBusy,false);
 assert.match(context.dataCenterError,/Could not complete.*Drive unavailable/);
 assert.equal(notices.length,0);
});
test('a successful backup is not reported as failed when the status refresh fails',async()=>{
 const {context}=setup(async action=>{
  if(action==='admin.backup')return {driveConnected:true,lastBackupAt:'saved'};
  if(action==='getState')return {settings:{lastBackupAt:'saved'},revision:2};
  throw Error('Status unavailable');
 });
 await context.checkDataConnection(true);
 assert.match(context.dataCenterError,/Backup saved, but status refresh failed/);
 assert.equal(context.state.settings.lastBackupAt,'saved');
 assert.equal(context.dataCenterBusy,false);
});
test('failed connection check clears stale success and never creates a backup',async()=>{
 const calls=[];
 const {context}=setup(async action=>{calls.push(action);throw Error('Connection unavailable');});
 context.dataCenterStatus={driveConnected:true,emailConfigured:true};
 await context.checkDataConnection();
 assert.deepEqual(calls,['admin.status']);
 assert.equal(context.dataCenterStatus,null);
 assert.equal(context.dataCenterBusy,false);
});
test('non-admin cannot trigger a service check or a backup',async()=>{
 const {context}=setup(async()=>{throw Error('Must not call');});
 context.role='employee';
 await context.checkDataConnection();await context.checkDataConnection(true);
 assert.equal(context.dataCenterBusy,false);
 assert.equal(context.dataCenterError,'');
});
