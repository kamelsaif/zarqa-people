const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const elements=new Map(),storage=new Map();
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,open:false,style:{setProperty(){}},setAttribute(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},querySelectorAll(){return[]},focus(){},setSelectionRange(){},showModal(){this.open=true},close(){this.open=false}});return elements.get(id);}
const context=vm.createContext({console,Date,Math,Set,Intl,Blob,URL,AbortSignal,setTimeout(){},queueMicrotask(){},MutationObserver:class{observe(){}},NodeFilter:{SHOW_TEXT:4},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:''},window:{addEventListener(){},scrollTo(){},print(){}},document:{getElementById:element,documentElement:{setAttribute(){},style:{setProperty(){}}},body:{classList:{toggle(){}},querySelectorAll(){return[]}},querySelector:()=>element('sidebar-link'),querySelectorAll:()=>[],createTreeWalker:()=>({nextNode:()=>null}),addEventListener(){}},navigator:{}});
for(const file of ['icons.js','seed.js','core.js','operations-core.js','portal.js','admin.js','documents.js','laws.js','i18n.js','workspace.js','experience.js','people.js','data-center.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),context);
for(const language of ['ar','en'])for(const page of ['dashboard','requests','scheduler','documents','reports','orgchart','employees','recruitment','onboarding','attendance','leaves','payroll','performance','offboarding','calendar','settings','data','laws','selfservice','portal']){vm.runInContext('uiLang='+JSON.stringify(language)+';page='+JSON.stringify(page)+';render();',context);assert(element('main').innerHTML.length>200,page);assert(!/undefined|NaN/.test(element('main').innerHTML),page+' renders invalid data');}
console.log('✓ All 20 pages render in Arabic and English');
for(const role of ['employee','manager','finance','hr','admin']){vm.runInContext('role='+JSON.stringify(role)+";for(const next of allowedPages()){page=next;render();}",context);assert(!/undefined|NaN/.test(element('main').innerHTML),role+' view');}
console.log('✓ Every allowed page renders for all five roles');
vm.runInContext("role='admin';uiLang='en';page='documents';archiveTab='missing';render();",context);assert(element('main').innerHTML.includes('Complete employment files'));assert(!element('main').innerHTML.includes('id="dateFrom"'));
vm.runInContext("archiveTab='documents';render();",context);assert(element('main').innerHTML.includes('Document archive'));
for(const report of ['headcount','attendance','leaves','requests','contracts','documents','payroll','payments','turnover','onboarding','audit']){vm.runInContext('page="reports";reportKind='+JSON.stringify(report)+';render();',context);assert(!/undefined|NaN/.test(element('main').innerHTML),report);}
vm.runInContext("page='requests';requestView='all';render();requestDetail('leave|L-01');",context);assert(element('dialogBody').innerHTML.includes('data-ops="leave.decide"'));assert(element('dialogBody').innerHTML.includes('decisionNote'));
vm.runInContext("requestPicker();",context);assert.equal((element('dialogBody').innerHTML.match(/data-action="newRequest"/g)||[]).length,17);
for(const type of ['loan','expense','overtime','remote','letter']){vm.runInContext('newRequest('+JSON.stringify(type)+');',context);assert(element('dialogBody').innerHTML.includes('data-ops="request.create"'));}
vm.runInContext("shiftForm('EMP-001|2026-10-20');",context);assert(element('dialogBody').innerHTML.includes('2026-10-20'));
vm.runInContext("contractForm('CON-1');",context);assert(element('dialogBody').innerHTML.includes('renewId'));
vm.runInContext("hrMutate(state,'payroll.prepare',{month:'2026-10'},{role:'admin',employeeId:'EMP-048',email:'admin@example.com',demo:true});page='payroll';render();",context);assert(element('main').innerHTML.includes('Review attendance &amp; request effects')||element('main').innerHTML.includes('Review attendance & request effects'));
vm.runInContext("payrollEffects(state.payroll[0].id);",context);assert(element('dialogBody').innerHTML.includes('Apply to draft'));
vm.runInContext("commandPalette();commandResults('payroll');",context);assert(element('commandResults').innerHTML.includes('Payroll'));
console.log('✓ Archive tabs, reports, request forms, shifts, renewal, payroll review and command search render');
vm.runInContext("uiLang='en';page='laws';render();applyLanguage();",context);assert(element('main').innerHTML.includes('Labour law'));assert.equal(context.document.documentElement.dir,'ltr');
assert.equal(vm.runInContext("translateText('الإجازات والموافقات')",context),'Leave & approvals');
assert.equal(vm.runInContext("translateText('سياسات تُفهم، ومواقف تُطبَّق، وإقرار مسجّل بتاريخ وإصدار.')",context),'Understand policies, apply them to scenarios, and record dated acknowledgments.');
vm.runInContext("role='employee';page='settings';render();",context);assert(!element('navigation').innerHTML.includes('data-nav="settings"'));assert(element('navigation').innerHTML.includes('data-nav="laws"'));
const html=fs.readFileSync('dist/index.html','utf8');for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^https?:/.test(match[1]))assert(fs.existsSync('dist/'+match[1]),'Missing asset '+match[1]);}
console.log('Interface rendering, language direction, role navigation and asset checks passed. No browser visual QA performed.');

module.exports={context,elements};
