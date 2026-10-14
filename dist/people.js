/* Employee directory. Its filters do not inherit dashboard date/department filters. */
const PEOPLE_TONES=['blue','teal','violet','amber','rose'];
let peopleQuery='',peopleDepartment='',peopleStatus='all',peopleSort='name',peopleView='cards',peoplePage=1;
try{const saved=localStorage.getItem('zarqa-people-view');if(['cards','table'].includes(saved))peopleView=saved;}catch(_){}
function departmentTone(name){
  const known={'المبيعات':'blue','العمليات':'teal','التسويق':'violet','الموارد البشرية':'rose','المالية':'amber'};
  if(known[name])return known[name];
  return PEOPLE_TONES[Array.from(String(name||'')).reduce((n,c)=>n+c.charCodeAt(0),0)%PEOPLE_TONES.length];
}
function departmentColor(name){return ({blue:'#356bc1',teal:'#168176',violet:'#7953b6',amber:'#ac7726',rose:'#b74e70'})[departmentTone(name)];}
function peopleLabel(){return role==='manager'?tx('فريقي','My team'):tx('كل الموظفين','All employees');}
function directoryEmployees(){
  if(!allowedPages().includes('employees'))return [];
  return state.employees.filter(e=>isHR()||role==='manager'&&(e.id===employeeId||e.manager===employeeId));
}
function normalisePeopleText(s){return String(s||'').toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').trim();}
function filteredPeople(){
  const q=normalisePeopleText(peopleQuery);
  return directoryEmployees().filter(e=>(!peopleDepartment||e.department===peopleDepartment)&&(peopleStatus==='all'||e.status===peopleStatus)&&(!q||normalisePeopleText([e.name,e.id,e.email,e.job,e.department,translateText(e.department||'')].join(' ')).includes(q))).sort((a,b)=>peopleSort==='newest'?String(b.joinDate).localeCompare(String(a.joinDate)):String(a.name).localeCompare(String(b.name),uiLang));
}
function resetPeopleFilters(){peopleQuery='';peopleDepartment='';peopleStatus='all';peopleSort='name';peoplePage=1;}
function peopleDirectoryLink(){return allowedPages().includes('employees')?btn(uiIcon('users-round')+peopleLabel(),'peopleDirectory','','people-entry'):'';}
function departmentPill(name){return '<span class="department-pill" data-tone="'+departmentTone(name)+'">'+esc(uiLang==='en'?translateText(name||''):name||tx('بدون قسم','No department'))+'</span>';}
function peopleCard(e){
  const manager=person(e.manager),title='employee-name-'+e.id;
  return '<article class="employee-card" data-tone="'+departmentTone(e.department)+'" aria-labelledby="'+esc(title)+'"><div class="employee-card-top"><span class="avatar employee-avatar">'+esc(initials(e.name))+'</span>'+badge(e.status)+'</div><h2 id="'+esc(title)+'">'+esc(e.name)+'</h2><p class="employee-job">'+esc(e.job)+'</p>'+departmentPill(e.department)+'<dl class="employee-meta"><div><dt>'+tx('تاريخ الانضمام','Joined')+'</dt><dd class="mono">'+esc(e.joinDate)+'</dd></div><div><dt>'+tx('المدير المباشر','Line manager')+'</dt><dd>'+esc(manager?.name||tx('غير محدد','Not assigned'))+'</dd></div></dl><div class="employee-card-footer"><span class="employee-code mono">'+esc(e.id)+'</span>'+btn(tx('عرض الملف','View profile'),'profile',e.id,'small')+'</div></article>';
}
function employeesPage(){
  const all=directoryEmployees(),rows=filteredPeople(),size=peopleView==='cards'?12:20,pages=Math.max(1,Math.ceil(rows.length/size));peoplePage=Math.min(Math.max(1,peoplePage),pages);
  const start=(peoplePage-1)*size,shown=rows.slice(start,start+size),departments=[...new Set(all.map(e=>e.department))].sort((a,b)=>String(a).localeCompare(String(b),uiLang));
  const statuses=[['all',tx('الكل','Everyone'),'blue'],['active',tx('نشطون','Active'),'teal'],['onboarding',tx('قيد الانضمام','Onboarding'),'violet'],['inactive',tx('منتهية خدمتهم','Inactive'),'rose']];
  const summary='<div class="people-statuses" role="group" aria-label="'+tx('تصفية حسب الحالة','Filter by status')+'">'+statuses.map(([key,label,tone])=>'<button data-action="peopleStatus" data-id="'+key+'" data-tone="'+tone+'" aria-pressed="'+(peopleStatus===key)+'" class="people-status '+(peopleStatus===key?'selected':'')+'"><span>'+label+'</span><b>'+fmt(key==='all'?all.length:all.filter(e=>e.status===key).length)+'</b></button>').join('')+'</div>';
  const filters='<div class="filters people-filters"><div class="filter-field search-field"><label for="peopleSearch">'+tx('ابحث عن موظف','Find an employee')+'</label><div class="people-search">'+uiIcon('search')+'<input id="peopleSearch" value="'+esc(peopleQuery)+'" placeholder="'+tx('الاسم، المسمى، الرقم أو البريد','Name, role, ID or email')+'"></div></div><div class="filter-field"><label for="peopleDepartment">'+tx('القسم','Department')+'</label><select id="peopleDepartment"><option value="">'+tx('كل الأقسام','All departments')+'</option>'+departments.map(d=>'<option value="'+esc(d)+'" '+(peopleDepartment===d?'selected':'')+'>'+esc(uiLang==='en'?translateText(d):d)+'</option>').join('')+'</select></div><div class="filter-field"><label for="peopleSort">'+tx('ترتيب حسب','Sort by')+'</label><select id="peopleSort"><option value="name" '+(peopleSort==='name'?'selected':'')+'>'+tx('الاسم','Name')+'</option><option value="newest" '+(peopleSort==='newest'?'selected':'')+'>'+tx('الأحدث انضمامًا','Newest joiners')+'</option></select></div>'+((peopleQuery||peopleDepartment||peopleStatus!=='all')?btn(tx('مسح الفلاتر','Clear filters'),'clearPeopleFilters','','ghost'):'')+'</div>';
  const view='<div class="people-viewbar"><p role="status">'+tx('عرض','Showing')+' <b>'+fmt(rows.length)+'</b> '+tx('من','of')+' '+fmt(all.length)+' '+tx('موظف','employees')+'</p><div class="view-switch" role="group" aria-label="'+tx('شكل قائمة الموظفين','Directory view')+'">'+[['cards','layout-dashboard',tx('بطاقات','Cards')],['table','file-text',tx('جدول','Table')]].map(([key,icon,label])=>'<button data-action="peopleView" data-id="'+key+'" aria-pressed="'+(peopleView===key)+'" class="'+(peopleView===key?'selected':'')+'">'+uiIcon(icon)+label+'</button>').join('')+'</div></div>';
  const content=!rows.length?'<div class="card people-empty">'+uiIcon('users-round')+'<h2>'+tx(all.length?'لا توجد نتائج مطابقة':'قائمة الموظفين تبدأ من هنا',all.length?'No matching employees':'Your people directory starts here')+'</h2><p>'+tx(all.length?'جرّب اسمًا آخر أو امسح الفلاتر.':'أضف أول موظف لتبدأ في تنظيم ملفات فريقك.',all.length?'Try another name or clear your filters.':'Add your first employee to start organising your team.')+'</p>'+(all.length?btn(tx('عرض الجميع','Show everyone'),'clearPeopleFilters','','primary'):isHR()?btn(tx('إضافة موظف','Add employee'),'employeeForm','','primary'):'')+'</div>':peopleView==='cards'?'<div class="people-grid">'+shown.map(peopleCard).join('')+'</div>':'<div class="card people-table">'+table([tx('الموظف','Employee'),tx('القسم','Department'),tx('تاريخ الانضمام','Joined'),tx('الحالة','Status'),tx('المدير المباشر','Line manager'),''],shown.map(e=>'<tr><td>'+avatar(e)+'<span class="employee-code mono">'+esc(e.id)+'</span></td><td>'+departmentPill(e.department)+'</td><td class="mono">'+esc(e.joinDate)+'</td><td>'+badge(e.status)+'</td><td>'+esc(person(e.manager)?.name||tx('غير محدد','Not assigned'))+'</td><td>'+btn(tx('عرض الملف','View profile'),'profile',e.id,'small')+'</td></tr>'))+'</div>';
  const pagination=rows.length?'<div class="people-pagination"><span>'+tx('السجلات','Records')+' '+fmt(start+1)+'–'+fmt(Math.min(start+size,rows.length))+' '+tx('من','of')+' '+fmt(rows.length)+'</span><div><button class="btn small" data-action="peoplePage" data-id="'+(peoplePage-1)+'" '+(peoplePage===1?'disabled':'')+'>'+uiIcon(tx('chevron-right','chevron-left'))+tx('السابق','Previous')+'</button><span>'+peoplePage+' / '+pages+'</span><button class="btn small" data-action="peoplePage" data-id="'+(peoplePage+1)+'" '+(peoplePage===pages?'disabled':'')+'>'+tx('التالي','Next')+uiIcon(tx('chevron-left','chevron-right'))+'</button></div></div>':'';
  return heading(peopleLabel(),role==='manager'?tx('أعضاء فريقك وملفاتهم، حسب صلاحياتك.','Your team and their profiles, within your access.'):tx('كل ملفات فريقك في مكان واحد. ابحث، صفّي، وافتح ملف أي موظف.','Your entire team in one place. Search, filter and open any employee profile.'),isHR()?btn(tx('إضافة موظف','Add employee'),'employeeForm','','primary'):'')+summary+filters+view+content+pagination;
}
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-action],[data-nav]');if(!el)return;
  if(el.dataset.nav==='employees'&&page!=='employees')resetPeopleFilters();
  const action=el.dataset.action,id=el.dataset.id;
  if(action==='peopleDirectory'){resetPeopleFilters();closeModal();navigate('employees');}
  if(action==='peopleStatus'){peopleStatus=['all','active','onboarding','inactive'].includes(id)?id:'all';peoplePage=1;render();}
  if(action==='peopleView'){peopleView=id==='table'?'table':'cards';peoplePage=1;try{localStorage.setItem('zarqa-people-view',peopleView);}catch(_){}render();}
  if(action==='clearPeopleFilters'){resetPeopleFilters();render();}
  if(action==='peoplePage'){peoplePage=Number(id)||1;render();document.querySelector('.people-viewbar')?.scrollIntoView?.({block:'start',behavior:'auto'});}
});
document.addEventListener('change',ev=>{
  if(ev.target.id==='peopleDepartment'){peopleDepartment=ev.target.value;peoplePage=1;render();}
  if(ev.target.id==='peopleSort'){peopleSort=ev.target.value==='newest'?'newest':'name';peoplePage=1;render();}
});
document.addEventListener('input',ev=>{
  if(ev.target.id!=='peopleSearch')return;peopleQuery=ev.target.value;peoplePage=1;const pos=ev.target.selectionStart;render();$('peopleSearch').focus();$('peopleSearch').setSelectionRange(pos,pos);
});
