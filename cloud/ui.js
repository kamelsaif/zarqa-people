function settingsPage(){
 return heading(tx('إعدادات الشركة','Company settings'),tx('هوية مساحة العمل وإعدادات الرواتب.','Workspace identity and payroll preferences.'),'','YOUR WORKSPACE')+
 '<div class="settings-grid">'+card(tx('الهوية وإعدادات الرواتب','Identity and payroll'),'',
 '<form id="settingsForm">'+field(tx('اسم الشركة','Company name'),'company','text',state.settings.company)+
 field(tx('اسم المنتج','Product name'),'product','text',state.settings.product)+
 field(tx('اللون الأساسي','Accent color'),'accent','color',state.settings.accent)+
 '<div class="field"><label for="logoUpload">'+tx('شعار الشركة — أقل من 500 KB','Company logo — under 500 KB')+'</label><input type="file" id="logoUpload" accept="image/png,image/jpeg,image/svg+xml"></div>'+
 field(tx('اليوم المرجعي للرواتب (١–٢٨)','Reference payday (1–28)'),'payday','number',state.settings.payday,'min="1" max="28"')+
 '<p>'+tx('الإشعارات تُرسل يدويًا بعد اعتماد المالية. الجدولة التلقائية غير مفعّلة.','Notices are sent manually after Finance approval. Automatic scheduling is not enabled.')+'</p><div class="form-actions"><button class="btn primary" type="submit">'+tx('حفظ الإعدادات','Save settings')+'</button></div></form>')+
 card(tx('البيانات والحسابات','Data & accounts'),tx('السجلات والحسابات والخدمات المتصلة','Records, accounts and connected services'),
 '<p>'+tx('لإدارة حسابات الفريق وفحص الاتصال والنسخ الاحتياطية، افتح مركز البيانات والحسابات.','Open Data & accounts to manage team access, verify connections and create backups.')+'</p>',
 '<a class="btn primary" href="#data">'+tx('إدارة البيانات والحسابات','Manage data & accounts')+'</a>')+'</div>';
}
function dataCenterPage(){
 if(role!=='admin')return '<div class="empty">'+tx('هذه الصفحة لمسؤول النظام','Administrator access required')+'</div>';
 const d=dataCenterStatus;
 return heading(tx('البيانات والحسابات','Data & accounts'),tx('إدارة مساحة الشركة والخدمات المتصلة.','Manage company records and connected services.'),'','WORKSPACE ADMINISTRATION')+
 '<div class="cloud-status"><article><span class="badge blue">DATABASE</span><h3>Supabase PostgreSQL</h3><p>'+tx('السجلات والصلاحيات على الخادم','Records and permissions on the server')+'</p></article><article><span class="badge teal">DOCUMENTS</span><h3>Google Drive</h3><p>'+tx(d?.driveConnected?'تم التحقق من الاتصال':'بانتظار الإعداد أو الفحص',d?.driveConnected?'Connection verified':'Setup or verification pending')+'</p></article><article><span class="badge violet">EMAIL</span><h3>Resend</h3><p>'+tx(d?.emailConfigured?'الإعدادات موجودة؛ يلزم اختبار التسليم':'لم يُتحقق من إعداد الإرسال',d?.emailConfigured?'Configured; delivery test still required':'Sending configuration not verified')+'</p></article></div>'+
 '<div class="form-actions">'+btn(tx('فحص الاتصال','Check connection'),'dataCheck','','primary')+btn(tx('تحديث البيانات','Refresh records'),'cloudRefresh')+'</div>'+
 (dataCenterError?'<p class="notice" role="alert">'+esc(dataCenterError)+'</p>':'')+
 accountsPanel()+backupsPanel();
}
function accountsPanel(){
 return card(tx('حسابات الدخول','Sign-in accounts'),tx('هوية موثقة وصلاحية محددة لكل مستخدم','Verified identity and assigned access for each user'),
 table([tx('البريد','Email'),tx('الدور','Role'),tx('الحالة','Status'),tx('الإجراء','Action')],(state.access||[]).map(a=>'<tr><td dir="ltr">'+esc(a.email)+'</td><td>'+esc(dataRoleName(a.role))+'</td><td>'+tx(a.active?'نشط':'موقوف',a.active?'Active':'Disabled')+'</td><td>'+btn(tx('تعديل الدور','Edit role'),'editAccess',a.email,'small')+btn(tx(a.active?'إيقاف':'تفعيل',a.active?'Disable':'Enable'),'cloudToggleAccount',a.userId,'small')+'</td></tr>')),
 btn(tx('ربط مستخدم مسجل','Link registered user'),'cloudLinkForm','','primary'))+
 '<p class="data-note">'+tx('أنشئ أو ادعُ المستخدم من Supabase Authentication أولًا. بعد تأكيد بريده اربطه هنا بملف الموظف. لا يحتاج بريد Google.','Create or invite the user in Supabase Authentication first. After email verification, link the account here to an employee profile. A Google email is not required.')+'</p>';
}
function accessForm(email=''){
 if(role!=='admin')return;
 const a=(state.access||[]).find(a=>a.email===email);
 form(tx('تعديل صلاحية المستخدم','Edit account access'),field(tx('البريد','Email'),'email','email',email,'readonly')+
 selectField(tx('الدور','Role'),'role',['employee','manager','hr','finance','admin'].map(value=>({value,label:dataRoleName(value)})),a?.role||'employee'), 'access');
}
function backupsPanel(){
 return card(tx('نسخة احتياطية مشفّرة','Encrypted backup'),tx('نسخة يدوية من سجلات HR وعضوية الحسابات إلى Drive','Manual snapshot of HR records and account membership to Drive'),
 '<p>'+tx('آخر نسخة مؤكدة: ','Last confirmed backup: ')+esc(dataTime(dataCenterStatus?.lastBackupAt||state.settings.lastBackupAt))+'</p><p>'+tx('المستندات الأصلية وكلمات المرور ليست داخل هذه النسخة. احتفظ بمفتاح فك التشفير في مكان مستقل.','Original documents and passwords are not included. Keep the decryption key separately.')+'</p>',
 btn(tx('إنشاء نسخة الآن','Create backup now'),'cloudBackup','','primary'));
}
function authInfo(){modal('<h2>'+tx('تسجيل الدخول','Sign-in')+'</h2><p>'+tx('Supabase يتحقق من البريد وكلمة المرور. مسؤول الشركة يربط الحساب ويحدد صلاحياته. لا يمكن عرض كلمات المرور من البرنامج.','Supabase verifies email and password. The administrator links each account and assigns access. Passwords cannot be displayed by this application.')+'</p>');}
function cloudSetup(){modal('<h2>'+tx('إعداد الخدمات','Service setup')+'</h2><p>'+tx('اتصال Supabase مخصص لهذه النسخة. مفاتيح Resend وGoogle Drive تُضبط في أسرار الخادم، وليس في الواجهة. راجع دليل النشر المرفق بالمشروع.','Supabase is configured for this edition. Resend and Google Drive credentials belong in server secrets, not the browser. See the deployment guide included in the repository.')+'</p>');}
document.addEventListener('click',async event=>{
 const el=event.target.closest('[data-action]');if(!el)return;
 if(el.dataset.action==='cloudLogout'){await window.ZarqaCloud.logout();return;}
 if(role!=='admin')return;
 try {
  if(el.dataset.action==='cloudRefresh'){state=await callServer('getState');render();}
  if(el.dataset.action==='cloudLinkForm')modal('<h2>'+tx('ربط مستخدم مسجل','Link registered user')+'</h2><form id="cloudLinkForm">'+field(tx('بريد المستخدم المؤكد','Verified user email'),'email','email')+selectField(tx('الدور','Role'),'role',['employee','manager','hr','finance','admin'])+selectField(tx('ملف الموظف','Employee profile'),'employeeId',[{value:'',label:tx('حساب إداري بدون ملف','Administrative account without profile')},...employeeOptions(true)])+'<div class="form-actions"><button class="btn primary" type="submit">'+tx('ربط الحساب','Link account')+'</button></div></form>');
  if(el.dataset.action==='cloudToggleAccount'){
   const a=state.access.find(a=>a.userId===el.dataset.id);if(!a)return;
   state=await callServer('mutate',{action:'access.set',payload:{email:a.email,role:a.role,active:!a.active}});render();
  }
 }catch(error){toast(error.message);}
});
document.addEventListener('submit',async event=>{
 if(event.target.id!=='cloudLinkForm')return;event.preventDefault();
 if(role!=='admin'||busy)return;busy=true;
 try{state=await callServer('admin.linkAccount',Object.fromEntries(new FormData(event.target)));closeModal();render();}
 catch(error){toast(error.message);}finally{busy=false;}
});
