/* Presentation preferences are local to this device; HR records are unchanged. */
let readingStyle={fontSize:'standard',density:'comfortable'};
try { const saved=JSON.parse(localStorage.getItem('zarqa-reading-style')||'{}');
  if(['standard','large'].includes(saved.fontSize))readingStyle.fontSize=saved.fontSize;
  if(['comfortable','compact'].includes(saved.density))readingStyle.density=saved.density;
} catch (_) {}
function applyReadingStyle(){
  document.documentElement.setAttribute('data-font-size',readingStyle.fontSize);
  document.documentElement.setAttribute('data-density',readingStyle.density);
}
applyReadingStyle();

function routeIcon(route){return ({dashboard:'layout-dashboard',selfservice:'user-round',requests:'inbox',calendar:'calendar-days',employees:'users-round',recruitment:'briefcase-business',onboarding:'graduation-cap',documents:'folder-closed',performance:'chart-no-axes-combined',offboarding:'log-out',attendance:'clock-3',scheduler:'calendar-days',leaves:'calendar-check',payroll:'wallet',reports:'file-text',orgchart:'network',laws:'scale',settings:'settings-2',data:'settings-2',portal:'user-round'})[route]||'layout-dashboard';}
function actionIcon(action){return ({employeeForm:'plus',jobForm:'plus',candidateForm:'plus',requestPicker:'plus',leaveForm:'plus',shiftForm:'plus',contractForm:'plus',attendanceForm:'plus',eventForm:'plus',offboardingForm:'plus',reviewForm:'plus',quickCreate:'plus',workflows:'settings-2',attendancePolicy:'sliders-horizontal',preparePayroll:'wallet',approvePayroll:'check',sendPayroll:'mail',print:'download',documentUpload:'upload'})[action]||'';}
function kpiIcon(glyph){return ({'♙':'users-round','◷':'clock-3','↗':'chart-no-axes-combined','▣':'wallet','✓':'check','☷':'inbox','◎':'user-round','◇':'graduation-cap','▦':'calendar-days','☆':'chart-no-axes-combined'})[glyph]||'layout-dashboard';}
function pageContext(){if(['attendance','leaves','scheduler','payroll'].includes(page))return tx('التشغيل والرواتب','OPERATIONS & PAYROLL');if(['reports','orgchart','laws','settings','data'].includes(page))return tx('الرؤية والإدارة','INSIGHTS & ADMINISTRATION');if(['employees','recruitment','onboarding','documents','performance','offboarding'].includes(page))return tx('الأفراد وتجربتهم','PEOPLE & EXPERIENCE');return tx('مساحة العمل','WORKSPACE');}
function activeDatePreset(){const today=hrToday();if(to!==today)return '';if(from===today.slice(0,7)+'-01')return 'month';if(from===datePlus(today,-29))return '30';if(from===today.slice(0,4)+'-'+String(Math.floor((Number(today.slice(5,7))-1)/3)*3+1).padStart(2,'0')+'-01')return 'quarter';return '';}

function renderUiChrome(){
  $('main').setAttribute('data-area',(['employees','recruitment','onboarding','documents','performance','offboarding'].includes(page)?'people':['attendance','scheduler','leaves'].includes(page)?'operations':page==='payroll'?'finance':['reports','orgchart','laws'].includes(page)?'insights':'workspace'));
  $('main').setAttribute('data-page',page);
  $('breadcrumb').innerHTML='<span>'+esc(state.settings.company)+'</span>'+uiIcon(tx('chevron-left','chevron-right'))+'<b>'+esc(routeLabel(page))+'</b>';
  $('headerSearchIcon').innerHTML=uiIcon('search');
  $('headerSearchLabel').textContent=tx('ابحث عن صفحة أو موظف','Search pages or people');
  $('displayButton').innerHTML=uiIcon('sliders-horizontal');
  $('accountChevron').innerHTML=uiIcon('chevron-down');
  $('menuButton').innerHTML=uiIcon('menu');
  $('sidebarClose').innerHTML=uiIcon('x');
  $('closeDialog').innerHTML=uiIcon('x');
  $('accountTitle').textContent=LIVE?actorEmail:tx('مساحة العرض التجريبي','Demo workspace');
  $('portalMenuButton').innerHTML=uiIcon('user-round')+tx('بوابة الموظف','Employee portal');
  $('readingMenuButton').innerHTML=uiIcon('sliders-horizontal')+tx('طريقة العرض','Display preferences');
  $('helpButton').innerHTML=uiIcon('circle-question-mark')+tx('دليل الاستخدام','Getting started');
  document.querySelector('.sidebar-link').innerHTML=uiIcon('settings-2')+tx('إعدادات الشركة والربط','Company settings');
  $('navigation').setAttribute('aria-label',tx('أقسام النظام','Application sections'));
  document.querySelector('.account-role-label').hidden=!!LIVE||employeeSession;
  document.title=state.settings.product+' · '+routeLabel(page);
  syncSidebarAccess();
}
function syncSidebarAccess(){const mobile=window.matchMedia?.('(max-width:850px)').matches;$('sidebar').inert=!!mobile&&!$('sidebar').classList.contains('open');}
function setSidebar(open){
  $('sidebar').classList.toggle('open',!!open);
  document.body.classList.toggle('nav-open',!!open);
  $('menuButton').setAttribute('aria-expanded',String(!!open));
  syncSidebarAccess();
  if(window.matchMedia?.('(max-width:850px)').matches){if(open)$('sidebarClose').focus();else if($('sidebar').contains(document.activeElement))$('menuButton').focus();}
}
window.addEventListener('resize',syncSidebarAccess);
function readingPreferences(){
  $('accountMenu').open=false;
  const option=(group,value,title,detail)=>'<label class="preference-option"><input type="radio" name="'+group+'" value="'+value+'" '+(readingStyle[group]===value?'checked':'')+'><span><b>'+title+'</b><small>'+detail+'</small></span></label>';
  modal('<h2>'+tx('طريقة العرض','Display preferences')+'</h2><p>'+tx('اختار العرض الأنسب لقراءتك. الإعدادات دي بتتحفظ على جهازك.','Choose what feels comfortable to read. These preferences are saved on this device.')+'</p><form id="readingPreferencesForm"><fieldset class="preference-group"><legend>'+tx('حجم الخط','Text size')+'</legend><div class="preference-options">'+option('fontSize','standard',tx('قياسي','Standard'),tx('نص واضح ومتوازن','Clear and balanced text'))+option('fontSize','large',tx('أكبر','Larger'),tx('قراءة أسهل بحجم أكبر','More room for easier reading'))+'</div></fieldset><fieldset class="preference-group"><legend>'+tx('مسافات الجداول','Table spacing')+'</legend><div class="preference-options">'+option('density','comfortable',tx('مريحة','Comfortable'),tx('مسافات أوسع بين الصفوف','More space between rows'))+option('density','compact',tx('مدمجة','Compact'),tx('صفوف أكثر على الشاشة','More rows on screen'))+'</div></fieldset><div class="form-actions"><button class="btn primary" type="submit">'+tx('حفظ طريقة العرض','Save preferences')+'</button>'+btn(tx('إلغاء','Cancel'),'close')+'</div></form>');
}
document.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]');
  if(action?.dataset.action==='readingPreferences')readingPreferences();
  if(!event.target.closest('.account-menu'))$('accountMenu').open=false;
  if(event.target.closest('#accountMenu button'))$('accountMenu').open=false;
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='readingPreferencesForm')return;
  event.preventDefault();const data=new FormData(event.target);
  readingStyle={fontSize:data.get('fontSize')==='large'?'large':'standard',density:data.get('density')==='compact'?'compact':'comfortable'};
  try{localStorage.setItem('zarqa-reading-style',JSON.stringify(readingStyle));}catch(_){}
  applyReadingStyle();closeModal();render();toast(tx('تم حفظ طريقة العرض','Display preferences saved'));
});
Object.assign(EN,{'طريقة العرض':'Display preferences','قائمة الحساب':'Account menu','تجربة صلاحيات مختلفة':'Try different roles','فتح القائمة':'Open navigation','إغلاق القائمة':'Close navigation','التنقل الرئيسي':'Main navigation','دليل الاستخدام':'Getting started','ابحث عن صفحة أو موظف':'Search pages or people'});
