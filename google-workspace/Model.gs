function makeSeed(){
 const departments=['المبيعات','العمليات','التسويق','الموارد البشرية','المالية'];
 const names=['آدم حسن','ليلى عادل','عمر كريم','نور علي','يوسف فؤاد','مريم سامي','مالك هاني','سلمى شريف','زياد عاطف','هنا طارق','سيف محمود','رنا أحمد','كريم ناصر','دينا عماد','أحمد عادل','فريدة سامح'];
 const employees=Array.from({length:48},(_,i)=>({id:'EMP-'+String(i+1).padStart(3,'0'),name:names[i%16]+(i>=16?' '+['مراد','سليم'][Math.floor(i/16)-1]:''),email:'employee'+(i+1)+'@example.com',department:departments[i%5],job:['Account Executive','Operations Specialist','Content Strategist','HR Specialist','Finance Analyst'][i%5],manager:'EMP-005',joinDate:i===46?'2026-04-18':i<40?'2026-0'+(3+i%5)+'-'+String(1+i%24).padStart(2,'0'):'2026-10-'+String(1+i%13).padStart(2,'0'),exitDate:i===46?'2026-09-24':null,status:i===46?'inactive':i>=44?'onboarding':'active',salary:14000+(i%8)*2500,allowance:1200,bonus:(i%3)*500,deduction:650,leaveBalance:21,usedLeave:i%8,onboarding:i<44?[0,1,2,3]:[],acknowledgments:[],reviews:3+(i%5)*.25}));
 const attendance=[];for(const month of [9,10])for(let d=1;d<=(month===10?14:30);d++){const date='2026-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0');const day=new Date(date+'T12:00:00Z').getUTCDay();if(day===5||day===6)continue;employees.forEach((e,i)=>{if(e.joinDate>date||e.exitDate&&e.exitDate<=date)return;attendance.push({id:e.id+'-'+date,employeeId:e.id,date,status:(i+d)%19===0?'absent':(i+d)%13===0?'late':'present',in:(i+d)%13===0?'09:23':'09:00',out:'18:00'});});}
 const seed={access:[{email:"admin@example.com",role:"admin"},{email:"hr@example.com",role:"hr"},{email:"finance@example.com",role:"finance"},{email:"manager@example.com",role:"manager"}],schema:1,revision:0,settings:{company:'زرقاء',product:'ZARQA People',accent:'#C8A252',logo:'',currency:'EGP',payday:28,autoSend:false,weekend:[5,6],policyVersion:'1.0',requiredDocuments:['إثبات الهوية','المؤهل الدراسي','صورة شخصية','مستند إضافي حسب الشركة'],managerEmail:'manager@example.com',hrEmail:'hr@example.com',financeEmail:'finance@example.com'},documents:[],employees,attendance,jobs:[{id:'JOB-01',title:'Senior Account Executive',department:'المبيعات',location:'القاهرة · هجين',salary:'18,000–25,000 EGP',description:'نبحث عن مسؤول حسابات لديه خبرة في المبيعات وبناء العلاقات. المهام: إدارة العملاء، تقديم العروض ومتابعة النتائج. المتطلبات: خبرة سنتين، تواصل ممتاز وإجادة الإنجليزية.',status:'published',createdAt:'2026-10-02'},{id:'JOB-02',title:'AI Automation Specialist',department:'العمليات',location:'عن بُعد',salary:'22,000–35,000 EGP',description:'تطوير أتمتة عملية باستخدام أدوات الذكاء الاصطناعي. خبرة في توثيق العمليات، APIs واختبار الحلول.',status:'published',createdAt:'2026-10-05'},{id:'JOB-03',title:'People & Culture Partner',department:'الموارد البشرية',location:'القاهرة · مكتب',salary:'20,000–28,000 EGP',description:'إدارة تجربة الموظف والتوظيف وتطوير الأداء. خبرة عملية في HR وتوثيق السياسات.',status:'draft',createdAt:'2026-10-10'}],candidates:[{id:'C-01',name:'ندى خليل',email:'nada@example.com',jobId:'JOB-02',stage:0,appliedAt:'2026-10-03',source:'LinkedIn',notes:''},{id:'C-02',name:'حازم عادل',email:'hazem@example.com',jobId:'JOB-01',stage:1,appliedAt:'2026-10-04',source:'ترشيح',notes:''},{id:'C-03',name:'شروق مراد',email:'shorouk@example.com',jobId:'JOB-02',stage:2,appliedAt:'2026-10-05',source:'صفحة الوظائف',notes:''},{id:'C-04',name:'رامي نادر',email:'rami@example.com',jobId:'JOB-01',stage:2,appliedAt:'2026-09-25',source:'LinkedIn',notes:''},{id:'C-05',name:'أميرة محمد',email:'amira@example.com',jobId:'JOB-03',stage:3,appliedAt:'2026-09-28',source:'ترشيح',notes:''},{id:'C-06',name:'كريم سليم',email:'karim@example.com',jobId:'JOB-02',stage:4,appliedAt:'2026-09-22',source:'صفحة الوظائف',hiredAt:'2026-10-10',notes:''}],leaves:[{id:'L-01',employeeId:'EMP-001',type:'سنوية',from:'2026-10-18',to:'2026-10-20',reason:'ارتباط عائلي',days:3,stage:0,status:'pending',createdAt:'2026-10-13',approvals:[]},{id:'L-02',employeeId:'EMP-002',type:'سنوية',from:'2026-10-25',to:'2026-10-26',reason:'ظروف شخصية',days:2,stage:1,status:'pending',createdAt:'2026-10-12',approvals:[{role:'manager',at:'2026-10-13',decision:'approved'}]},{id:'L-03',employeeId:'EMP-003',type:'مرضية',from:'2026-10-11',to:'2026-10-12',reason:'إجازة مرضية',days:2,stage:2,status:'approved',createdAt:'2026-10-10',approvals:[]}],policies:[{id:0,title:'ثقافتنا وطريقة العمل',text:'نلتزم بالاحترام، التواصل الواضح وتحمل المسؤولية. ارفع أي مشكلة لمديرك ولا تؤجل الإبلاغ عن الأخطاء.',question:'لاحظت خطأ قد يؤثر على عميل. ماذا تفعل؟',options:['أتجاهله حتى يلاحظه شخص آخر','أبلغ مديري فورًا مع التفاصيل واقتراح الحل','أناقشه خارج الشركة'],correct:1},{id:1,title:'الحضور والإجازات',text:'الإجازة تُطلب من البوابة وتحتاج موافقة المدير ثم الموارد البشرية. إرسال الطلب لا يعني أنه تمت الموافقة. هذه سياسة تدريبية قابلة للتعديل.',question:'قدمت طلب إجازة ولم يصل الاعتماد النهائي. هل تغيب؟',options:['نعم، طالما أرسلت الطلب','لا، أنتظر الموافقة النهائية أو أتواصل مع المدير','أطلب من زميل اعتمادها'],correct:1},{id:2,title:'الخصوصية وأمن المعلومات',text:'ملفات الموظفين والرواتب معلومات سرية. لا تشارك كلمات المرور أو بيانات العملاء. بلّغ عن الرسائل المشبوهة.',question:'شخص يطلب كشف رواتب زميلك عبر رسالة. ماذا تفعل؟',options:['أرسله إذا عرفت اسمه','أرفعه على رابط عام','أرفض المشاركة وأتحقق من الصلاحية عبر HR'],correct:2},{id:3,title:'السلوك المهني والتعاون',text:'نعمل دون تمييز أو إساءة. يمكن الإبلاغ عن المضايقات بسرية للموارد البشرية. نرحب بالنقد المهني المبني على الوقائع.',question:'واجهت إساءة متكررة في الفريق. ما التصرف المناسب؟',options:['أوثق الوقائع وأبلغ HR عبر القناة الرسمية','أنشر التفاصيل على السوشيال ميديا','أرد بإساءة مماثلة'],correct:0}],payroll:[],offboarding:[{id:'O-01',employeeId:'EMP-046',reason:'استقالة',lastDay:'2026-10-31',tasks:[false,true,false,false],status:'pending',createdAt:'2026-10-12'}],reviews:[{id:'R-01',employeeId:'EMP-001',date:'2026-10-10',score:4,notes:'تحسن واضح في المتابعة وجودة التواصل.'},{id:'R-02',employeeId:'EMP-004',date:'2026-10-09',score:3.5,notes:'خطة تطوير للمهارات خلال الربع القادم.'}],events:[{id:'EV-01',title:'إغلاق متغيرات الرواتب',date:'2026-10-24',type:'payroll'},{id:'EV-02',title:'إرسال كشوف الرواتب',date:'2026-10-28',type:'payroll'},{id:'EV-03',title:'مراجعات نهاية فترة التجربة',date:'2026-10-21',type:'review'},{id:'EV-04',title:'لقاء الترحيب بالمنضمين الجدد',date:'2026-10-19',type:'onboarding'}],audit:[{id:'A-0',at:'2026-10-14T08:30:00Z',actor:'النظام',action:'تهيئة مساحة العرض ببيانات تجريبية'}]};
 return typeof hrSeedOperations==='function'?hrSeedOperations(seed):seed;
}

function hrEscape(x){return String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hrWorkDays(from,to,weekend){if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))throw Error('أدخل تاريخًا صحيحًا');let a=new Date(from+'T12:00:00Z'),b=new Date(to+'T12:00:00Z');if(isNaN(a)||isNaN(b)||a>b||(b-a)/86400000>365)throw Error('راجع فترة الإجازة');let n=0;for(;a<=b;a.setUTCDate(a.getUTCDate()+1))if(!weekend.includes(a.getUTCDay()))n++;return n;}
function hrRequired(value,label){const s=String(value||'').trim();if(!s||s.length>4000)throw Error('راجع '+label);return s;}
function hrEmail(value){const s=hrRequired(value,'البريد الإلكتروني').toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw Error('البريد الإلكتروني غير صحيح');return s;}
function hrMutateLegacy(s,action,p,actor){
 const role=actor.role,isHR=['admin','hr'].includes(role),isFinance=['admin','finance'].includes(role),now=new Date().toISOString(),today=now.slice(0,10),id=prefix=>prefix+'-'+now.replace(/\D/g,'')+'-'+Math.floor(Math.random()*10000);
 const employee=eid=>{const e=s.employees.find(e=>e.id===eid);if(!e)throw Error('الموظف غير موجود');return e;};
 const allowed=(yes)=>{if(!yes)throw Error('الدور الحالي لا يملك صلاحية هذه العملية');};
 switch(action){
 case 'employee.add':{allowed(isHR);const e={id:id('EMP'),name:hrRequired(p.name,'الاسم'),email:hrEmail(p.email),department:hrRequired(p.department,'القسم'),job:hrRequired(p.job,'المسمى'),manager:p.manager||s.employees.find(e=>e.email===s.settings.managerEmail)?.id||'',joinDate:p.joinDate||today,status:'onboarding',exitDate:null,salary:Number(p.salary),allowance:0,bonus:0,deduction:0,leaveBalance:21,usedLeave:0,onboarding:[],acknowledgments:[],reviews:0};if(!Number.isFinite(e.salary)||e.salary<0)throw Error('الراتب غير صحيح');if(s.employees.some(x=>x.email===e.email))throw Error('البريد موجود بالفعل');s.employees.push(e);break;}
 case 'employee.edit':{allowed(isHR);const e=employee(p.id);if(p.manager){employee(p.manager);if(p.manager===e.id)throw Error('الموظف لا يكون مديرًا لنفسه');}const email=hrEmail(p.email);if(s.employees.some(x=>x.id!==e.id&&x.email===email))throw Error('البريد موجود بالفعل');const nums={};for(const k of ['salary','allowance','bonus','deduction','leaveBalance']){nums[k]=Number(p[k]);if(!Number.isFinite(nums[k])||nums[k]<0)throw Error('قيمة غير صحيحة: '+k);}if(nums.leaveBalance<e.usedLeave)throw Error('الرصيد أقل من الإجازات المستخدمة');Object.assign(e,{name:hrRequired(p.name,'الاسم'),email,department:hrRequired(p.department,'القسم'),job:hrRequired(p.job,'المسمى'),manager:p.manager||'',...nums});break;}
 case 'access.set':{allowed(role==='admin');const email=hrEmail(p.email);if(!actor.demo&&email.split('@')[1]!==actor.email.split('@')[1])throw Error('استخدم بريدًا داخل نطاق الشركة');if(!['admin','hr','manager','finance','employee'].includes(p.role))throw Error('دور غير صحيح');s.access=s.access||[];const existing=s.access.find(r=>r.email===email);if(existing)existing.role=p.role;else s.access.push({email,role:p.role});break;}
 case 'job.add':allowed(isHR);s.jobs.push({id:id('JOB'),title:hrRequired(p.title,'المسمى'),department:hrRequired(p.department,'القسم'),location:hrRequired(p.location,'الموقع'),salary:hrRequired(p.salary,'نطاق الراتب'),description:hrRequired(p.description,'الوصف'),status:'draft',createdAt:today});break;
 case 'job.publish':{allowed(isHR);const j=s.jobs.find(j=>j.id===p.id);if(!j)throw Error('الوظيفة غير موجودة');j.status=j.status==='published'?'draft':'published';break;}
 case 'candidate.add':allowed(isHR);if(!s.jobs.some(j=>j.id===p.jobId))throw Error('اختر وظيفة');s.candidates.push({id:id('C'),name:hrRequired(p.name,'الاسم'),email:hrEmail(p.email),jobId:p.jobId,stage:0,appliedAt:today,source:p.source||'صفحة الوظائف',notes:''});break;
 case 'candidate.move':{allowed(isHR);const c=s.candidates.find(c=>c.id===p.id);if(!c)throw Error('المرشح غير موجود');if(!Number.isInteger(Number(p.stage))||p.stage<0||p.stage>4)throw Error('مرحلة غير صحيحة');if(c.stage===4&&Number(p.stage)!==4)throw Error('تم التعيين؛ تابع من ملف الموظف');c.notes=String(p.notes||'').slice(0,4000);if(Number(p.stage)===4&&c.stage!==4){const j=s.jobs.find(j=>j.id===c.jobId);hrMutate(s,'employee.add',{name:c.name,email:c.email,department:j.department,job:j.title,salary:p.salary,joinDate:today},actor);c.hiredAt=today;}c.stage=Number(p.stage);break;}
 case 'leave.create':{allowed(isHR||role==='employee'||role==='manager');const e=employee(p.employeeId);allowed(isHR||e.id===actor.employeeId);if(e.status==='inactive')throw Error('الموظف غير نشط');if(!['سنوية','مرضية','بدون أجر'].includes(p.type))throw Error('نوع غير صحيح');const days=hrWorkDays(p.from,p.to,s.settings.weekend);if(!days)throw Error('الفترة لا تحتوي أيام عمل');const reserved=s.leaves.filter(l=>l.employeeId===e.id&&l.type==='سنوية'&&l.status==='pending').reduce((a,l)=>a+l.days,0);if(p.type==='سنوية'&&days>e.leaveBalance-e.usedLeave-reserved)throw Error('الرصيد المتاح غير كافٍ بعد احتساب الطلبات المعلقة');if(s.leaves.some(l=>l.employeeId===e.id&&!['rejected','cancelled'].includes(l.status)&&l.from<=p.to&&l.to>=p.from))throw Error('توجد إجازة متداخلة مع الفترة');s.leaves.unshift({id:id('L'),employeeId:e.id,type:p.type,from:p.from,to:p.to,reason:hrRequired(p.reason,'السبب'),days,stage:0,status:'pending',createdAt:today,approvals:[]});break;}
 case 'leave.decide':{const l=s.leaves.find(l=>l.id===p.id);if(!l||l.status!=='pending')throw Error('الطلب غير متاح للموافقة');const e=employee(l.employeeId);allowed(l.stage===0&&(role==='admin'||role==='manager'&&e.manager===actor.employeeId)||l.stage===1&&isHR);allowed(e.id!==actor.employeeId);if(!['approved','rejected'].includes(p.decision))throw Error('قرار غير صحيح');l.approvals.push({role,at:now,decision:p.decision,by:actor.email});if(p.decision==='rejected')l.status='rejected';else{l.stage++;if(l.stage===2){if(l.type==='سنوية'&&e.usedLeave+l.days>e.leaveBalance)throw Error('الرصيد لم يعد كافيًا');l.status='approved';if(l.type==='سنوية')e.usedLeave+=l.days;}}break;}
 case 'onboarding.complete':{const e=employee(p.employeeId);allowed(isHR||e.id===actor.employeeId);const m=s.policies.find(m=>m.id===Number(p.moduleId));if(!m||Number(p.answer)!==m.correct||p.ack!==true)throw Error('أجب عن الموقف بشكل صحيح ثم أكد قراءة السياسة');if(!e.onboarding.includes(m.id)){e.onboarding.push(m.id);e.acknowledgments.push({moduleId:m.id,version:s.settings.policyVersion,at:now,by:actor.email});}if(e.onboarding.length===s.policies.length&&(s.settings.requiredDocuments||[]).every(t=>(s.documents||[]).some(d=>d.employeeId===e.id&&d.type===t&&d.active!==false&&d.status==='approved')))e.status='active';break;}
 case 'payroll.prepare':{allowed(isHR||isFinance);if(!/^\d{4}-\d{2}$/.test(p.month))throw Error('اختر شهرًا');if(s.payroll.some(r=>r.month===p.month))throw Error('تم إنشاء هذا الشهر بالفعل');const rows=s.employees.filter(e=>e.status!=='inactive'&&e.joinDate<=p.month+'-31').map(e=>({employeeId:e.id,name:e.name,email:e.email,basic:e.salary,allowance:e.allowance,bonus:e.bonus,deduction:e.deduction,net:e.salary+e.allowance+e.bonus-e.deduction,status:'queued'}));if(!rows.length)throw Error('لا توجد رواتب للفترة');s.payroll.unshift({id:id('PAY'),month:p.month,status:'draft',createdAt:now,rows});break;}
 case 'payroll.updateRow':{allowed(isHR||isFinance);const run=s.payroll.find(r=>r.id===p.runId);if(!run||run.status!=='draft')throw Error('يمكن تعديل كشف المسودة فقط');const row=run.rows.find(r=>r.employeeId===p.employeeId);if(!row)throw Error('بند غير موجود');const values={};for(const k of ['basic','allowance','bonus','deduction']){values[k]=Number(p[k]);if(!Number.isFinite(values[k])||values[k]<0)throw Error('قيمة غير صحيحة');}if(values.basic+values.allowance+values.bonus-values.deduction<0)throw Error('الصافي لا يكون سالبًا');Object.assign(row,values,{net:values.basic+values.allowance+values.bonus-values.deduction});break;}
 case 'documents.requirements':allowed(isHR);if(!Array.isArray(p.items)||!p.items.length||p.items.length>12)throw Error('حدد من 1 إلى 12 مستندًا');s.settings.requiredDocuments=[...new Set(p.items.map(t=>hrRequired(t,'اسم المستند')))];break;
 case 'document.register':{allowed(actor.demo&&(isHR||p.employeeId===actor.employeeId));employee(p.employeeId);if(!s.settings.requiredDocuments.includes(p.type))throw Error('نوع مستند غير معروف');s.documents=s.documents||[];s.documents.filter(d=>d.employeeId===p.employeeId&&d.type===p.type&&d.active!==false).forEach(d=>d.active=false);s.documents.push({id:p.id||id('DOC'),employeeId:p.employeeId,type:p.type,name:hrRequired(p.name,'اسم الملف'),mime:p.mime,size:p.size,fileId:p.fileId||'',blobId:p.blobId||'',uploadedAt:now,uploadedBy:actor.email,status:'pending',active:true});break;}
 case 'document.review':{allowed(isHR);const d=(s.documents||[]).find(d=>d.id===p.id&&d.active!==false);if(!d||!['approved','rejected'].includes(p.status))throw Error('مراجعة غير صحيحة');d.status=p.status;d.reason=String(p.reason||'').slice(0,1000);d.reviewedAt=now;d.reviewedBy=actor.email;const e=employee(d.employeeId);if(e.status==='onboarding'&&e.onboarding.length===s.policies.length&&s.settings.requiredDocuments.every(t=>s.documents.some(x=>x.employeeId===e.id&&x.type===t&&x.active!==false&&x.status==='approved')))e.status='active';break;}
 case 'payroll.approve':{allowed(isFinance);const r=s.payroll.find(r=>r.id===p.id);if(!r||r.status!=='draft')throw Error('الكشف غير متاح للاعتماد');r.status='approved';r.approvedAt=now;r.approvedBy=actor.email;break;}
 case 'payroll.simulate':{allowed(actor.demo&&isFinance);const r=s.payroll.find(r=>r.id===p.id);if(!r||!['approved','sent'].includes(r.status))throw Error('اعتمد الكشف أولًا');r.rows.forEach(row=>row.status='simulated');r.status='simulated';break;}
 case 'offboarding.add':{allowed(isHR);employee(p.employeeId);if(s.offboarding.some(o=>o.employeeId===p.employeeId&&o.status==='pending'))throw Error('توجد حالة إنهاء مفتوحة');if(!p.lastDay||!p.reason)throw Error('أكمل التاريخ والسبب');s.offboarding.unshift({id:id('O'),employeeId:p.employeeId,reason:String(p.reason).slice(0,1000),lastDay:p.lastDay,tasks:[false,false,false,false],status:'pending',createdAt:today});break;}
 case 'offboarding.task':{allowed(isHR);const o=s.offboarding.find(o=>o.id===p.id);if(!o||o.status!=='pending'||!Number.isInteger(p.index)||p.index<0||p.index>3)throw Error('مهمة غير صحيحة');o.tasks[p.index]=!!p.done;break;}
 case 'offboarding.finalize':{allowed(isHR);const o=s.offboarding.find(o=>o.id===p.id);if(!o||o.status!=='pending'||!o.tasks.every(Boolean))throw Error('أكمل إخلاء الطرف أولًا');if(o.lastDay>today)throw Error('يمكن الإغلاق في آخر يوم عمل أو بعده');o.status='completed';const e=employee(o.employeeId);e.status='inactive';e.exitDate=o.lastDay;break;}
 case 'review.add':allowed(isHR||role==='manager'&&employee(p.employeeId).manager===actor.employeeId);if(!Number.isFinite(Number(p.score))||Number(p.score)<1||Number(p.score)>5)throw Error('التقييم من 1 إلى 5');s.reviews.unshift({id:id('R'),employeeId:p.employeeId,date:today,score:Number(p.score),notes:hrRequired(p.notes,'الملاحظات')});break;
 case 'event.add':allowed(isHR);if(!p.date)throw Error('حدد التاريخ');s.events.push({id:id('EV'),title:hrRequired(p.title,'العنوان'),date:p.date,type:p.type||'general'});break;
 case 'settings.save':allowed(role==='admin');s.settings.company=hrRequired(p.company,'اسم الشركة');s.settings.product=hrRequired(p.product,'اسم المنتج');if(!/^#[0-9a-f]{6}$/i.test(p.accent))throw Error('لون غير صحيح');s.settings.accent=p.accent;s.settings.logo=String(p.logo||'').startsWith('data:image/')?String(p.logo):'';s.settings.payday=Math.max(1,Math.min(28,Number(p.payday)||28));if(actor.demo)s.settings.autoSend=!!p.autoSend;break;
 case 'policy.save':{allowed(isHR);const m=s.policies.find(m=>m.id===Number(p.id));if(!m)throw Error('سياسة غير موجودة');m.text=hrRequired(p.text,'السياسة');m.question=hrRequired(p.question,'السؤال');m.options=p.options.map(x=>hrRequired(x,'الإجابة'));if(m.options.length!==3||p.correct<0||p.correct>2)throw Error('راجع الخيارات');m.correct=Number(p.correct);s.settings.policyVersion=String(Number(s.settings.policyVersion)+.1);s.employees.filter(e=>e.status!=='inactive').forEach(e=>{e.onboarding=e.onboarding.filter(x=>x!==m.id);});break;}
 default:throw Error('عملية غير معروفة');
 }
 s.revision=(s.revision||0)+1;s.audit.unshift({id:id('A'),at:now,actor:actor.email||role,action});s.audit=s.audit.slice(0,500);return s;
}
function hrMetrics(s,from,to,dept){const es=s.employees.filter(e=>!dept||e.department===dept),ids=new Set(es.map(e=>e.id)),active=es.filter(e=>e.joinDate<=to&&(!e.exitDate||e.exitDate>to)),start=es.filter(e=>e.joinDate<from&&(!e.exitDate||e.exitDate>=from)).length,end=active.length,exits=es.filter(e=>e.exitDate&&e.exitDate>=from&&e.exitDate<=to).length,avg=(start+end)/2;const attendance=s.attendance.filter(a=>ids.has(a.employeeId)&&a.date>=from&&a.date<=to),present=attendance.filter(a=>a.status!=='absent').length,hires=es.filter(e=>e.joinDate>=from&&e.joinDate<=to).length;return{active:active.length,hires,exits,turnover:avg?exits/avg*100:0,attendance:attendance.length?present/attendance.length*100:null,records:attendance.length,payroll:active.reduce((sum,e)=>sum+e.salary+e.allowance+e.bonus-e.deduction,0),pending:s.leaves.filter(l=>l.status==='pending'&&ids.has(l.employeeId)).length,onboarding:active.filter(e=>e.status==='onboarding'||e.onboarding.length<s.policies.length).length,departments:[...new Set(es.map(e=>e.department))].map(name=>({name,count:active.filter(e=>e.department===name).length}))};}

/* Shared browser / Apps Script workflows. No provider credentials. */
const HR_REQUEST_TYPES = [
  ['leave','إجازة','Leave','dates',['manager','hr']],
  ['loan','سلفة','Loan','money',['manager','hr','finance']],
  ['penalty','جزاء إداري','Penalty','money',['hr','finance'],'hr'],
  ['expense','استرداد مصروفات','Expense claim','money',['manager','finance']],
  ['resignation','استقالة','Resignation','date',['manager','hr']],
  ['termination','إنهاء خدمة','Termination','date',['hr'],'hr'],
  ['document','استعارة مستند','Borrow document','date',['hr']],
  ['transfer','نقل وظيفي','Transfer','date',['manager','hr'],'hr'],
  ['promotion','ترقية','Promotion','date',['manager','hr'],'hr'],
  ['excuse','إذن','Permission','hours',['manager','hr']],
  ['letter','خطاب موارد بشرية','HR letter','text',['hr']],
  ['mission','مأمورية','Business mission','dates',['manager','hr']],
  ['overtime','عمل إضافي','Overtime','hours',['manager','finance']],
  ['loanSettlement','تسوية سلفة','Loan settlement','money',['hr','finance']],
  ['encashment','صرف رصيد إجازات','Leave encashment','money',['hr','finance']],
  ['remote','عمل من المنزل','Work from home','dates',['manager','hr']],
  ['shiftChange','تغيير شفت','Shift change','date',['manager']]
];
function hrEnsureOperations(s) {
  for (const k of ['requests','shifts','contracts']) if (!Array.isArray(s[k])) s[k]=[];
  s.settings.workflows=s.settings.workflows||{};
  HR_REQUEST_TYPES.forEach(t=>{if(!s.settings.workflows[t[0]])s.settings.workflows[t[0]]={steps:t[4].slice(),version:1};});
  s.settings.attendancePolicy=s.settings.attendancePolicy||{graceMinutes:15,lateRate:0,absenceRate:0,overtimeRate:0};
  s.operationsVersion=2;
  return s;
}
function hrSeedOperations(s) {
  hrEnsureOperations(s);
  const manager=s.employees.find(e=>e.id==='EMP-005'),owner=s.employees.find(e=>e.id==='EMP-048');if(manager)manager.manager='EMP-048';if(owner)owner.manager='';
  s.contracts=s.employees.filter(e=>e.status!=='inactive').slice(0,12).map((e,i)=>({id:'CON-'+(i+1),employeeId:e.id,type:'fixed',start:e.joinDate,end:i<4?'2026-11-'+String(1+i*4).padStart(2,'0'):'2027-06-30',status:'active',history:[]}));
  s.requests=[['expense','EMP-002','2026-10-12',850,'تكلفة انتقال لمقابلة عميل'],['overtime','EMP-003','2026-10-13',0,'استكمال تسليم مشروع'],['letter','EMP-006','2026-10-14',0,'خطاب تعريف وظيفي'],['remote','EMP-008','2026-10-18',0,'طلب عمل من المنزل'],['resignation','EMP-009','2026-11-15',0,'مراجعة طلب الاستقالة']].map((r,i)=>({id:'REQ-0'+(i+1),type:r[0],employeeId:r[1],from:r[2],to:r[2],amount:r[3],hours:r[0]==='overtime'?2:0,reason:r[4],status:'pending',stage:0,workflow:s.settings.workflows[r[0]].steps.slice(),workflowVersion:1,approvals:[],createdAt:'2026-10-'+String(10+i).padStart(2,'0'),fulfillment:null}));
  for(let d=11;d<=15;d++)s.employees.slice(0,12).forEach((e,i)=>s.shifts.push({id:'SHIFT-'+d+'-'+i,employeeId:e.id,date:'2026-10-'+d,start:i%3===0?'16:00':'09:00',end:i%3===0?'01:00':'18:00',breakMinutes:60,location:i%3===0?'Evening team':'Cairo office',status:'published'}));
  return s;
}
function hrDate(v) { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||isNaN(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)throw Error('تاريخ غير صحيح / Invalid date');return v; }
function hrNumber(v,min,max) {const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error('قيمة خارج النطاق / Value outside allowed range');return n;}
function hrToday(){return new Date().toISOString().slice(0,10);}
function hrDaysUntil(date,base=hrToday()){return Math.ceil((Date.parse(date+'T12:00:00Z')-Date.parse(base+'T12:00:00Z'))/86400000);}
function hrShiftWindow(x) {hrDate(x.date);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.end))throw Error('وقت غير صحيح / Invalid time');const start=Date.parse(x.date+'T'+x.start+':00Z');let end=Date.parse(x.date+'T'+x.end+':00Z');if(end<=start)end+=86400000;if((end-start)/3600000>16)throw Error('الشفت لا يتجاوز 16 ساعة / Shift exceeds 16 hours');return {start,end};}
function hrRequestVisible(s,r,a){const e=s.employees.find(e=>e.id===r.employeeId);return ['admin','hr'].includes(a.role)||r.employeeId===a.employeeId||a.role==='manager'&&e?.manager===a.employeeId||a.role==='finance'&&(r.workflow||[]).includes('finance');}
function hrCanDecide(s,r,a){const e=s.employees.find(e=>e.id===r.employeeId);if(!e||r.status!=='pending'||e.id===a.employeeId)return false;const step=(r.workflow||['manager','hr'])[r.stage||0];return a.role==='admin'||step==='manager'&&a.role==='manager'&&e.manager===a.employeeId||step===a.role&&['hr','finance'].includes(a.role);}
function hrPayParts(r){const e=r.effects||{};return{basic:r.basic,allowance:r.allowance+(e.allowance||0),bonus:r.bonus+(e.bonus||0),deduction:r.deduction+(e.deduction||0),net:r.basic+r.allowance+r.bonus-r.deduction+(e.allowance||0)+(e.bonus||0)-(e.deduction||0)};}
function hrAttendanceStats(s,eid,from,to){
  const p=s.settings.attendancePolicy;let lateMinutes=0,absentDays=0,workedMinutes=0;
  const logs=s.attendance.filter(a=>a.employeeId===eid&&a.date>=from&&a.date<=to);
  for(const a of logs){if(s.leaves.some(l=>l.employeeId===eid&&l.status==='approved'&&l.from<=a.date&&l.to>=a.date))continue;
    const sh=s.shifts.find(x=>x.employeeId===eid&&x.date===a.date&&x.status==='published');
    const mission=s.requests.some(r=>r.employeeId===eid&&r.type==='mission'&&r.status==='approved'&&r.from<=a.date&&r.to>=a.date);
    if(a.status==='absent'){if(sh&&!mission)absentDays++;continue;}
    if(a.in&&a.out){const w=hrShiftWindow({date:a.date,start:a.in,end:a.out});workedMinutes+=Math.max(0,(w.end-w.start)/60000-(sh?.breakMinutes||0));}
    if(sh&&a.in){const w=hrShiftWindow(sh);let punch=Date.parse(a.date+'T'+a.in+':00Z');if(sh.end<=sh.start&&a.in<=sh.end)punch+=86400000;const excused=s.requests.filter(r=>r.employeeId===eid&&r.type==='excuse'&&r.status==='approved'&&r.from===a.date).reduce((n,r)=>n+r.hours*60,0);lateMinutes+=Math.max(0,Math.round((punch-w.start)/60000)-p.graceMinutes-excused);}
  }
  return{lateMinutes,absentDays,workedMinutes,records:logs.length};
}
function hrPayrollEffects(s,run){
  const start=run.periodFrom||run.month+'-01',end=run.periodTo||run.month+'-31';
  return run.rows.map(row=>{
    const stats=hrAttendanceStats(s,row.employeeId,start,end),p=s.settings.attendancePolicy;
    const reqs=s.requests.filter(r=>r.employeeId===row.employeeId&&r.status==='approved'&&!r.fulfillment&&['expense','overtime','penalty','encashment'].includes(r.type)&&r.from>=start&&r.from<=end&&(!r.payrollId||r.payrollId===run.id));
    const effects={allowance:0,bonus:0,deduction:stats.lateMinutes*p.lateRate+stats.absentDays*p.absenceRate,lateMinutes:stats.lateMinutes,absentDays:stats.absentDays,requestIds:reqs.map(r=>r.id).sort()};
    reqs.forEach(r=>{if(r.type==='expense')effects.allowance+=r.amount;if(r.type==='overtime')effects.bonus+=r.hours*p.overtimeRate;if(r.type==='penalty')effects.deduction+=r.amount;if(r.type==='encashment')effects.bonus+=r.amount;});
    ['allowance','bonus','deduction'].forEach(k=>effects[k]=Math.round(effects[k]*100)/100);
    return{employeeId:row.employeeId,effects};
  });
}
function hrOperationsMutate(s,action,p,a){
  const isHR=['admin','hr'].includes(a.role),isFinance=['admin','finance'].includes(a.role),now=new Date().toISOString(),id=prefix=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  const allow=x=>{if(!x)throw Error('غير مسموح لهذا الدور / Permission denied');};
  const employee=eid=>{const e=s.employees.find(e=>e.id===eid);if(!e||e.status==='inactive')throw Error('اختر موظفًا نشطًا / Active employee required');return e;};
  const team=eid=>{const e=employee(eid);return isHR||a.role==='manager'&&e.manager===a.employeeId;};
  switch(action){
    case 'workflow.save':{
      allow(isHR);if(!HR_REQUEST_TYPES.some(t=>t[0]===p.type)||!Array.isArray(p.steps)||!p.steps.length||p.steps.length>4||p.steps.some(x=>!['manager','hr','finance'].includes(x))||new Set(p.steps).size!==p.steps.length)throw Error('راجع مسار الموافقة / Check approval steps');
      if(p.type==='leave'&&p.steps[p.steps.length-1]!=='hr')throw Error('الاعتماد النهائي للإجازات لدى HR / Leave must end at HR');
      s.settings.workflows[p.type]={steps:p.steps.slice(),version:(s.settings.workflows[p.type]?.version||0)+1};break;
    }
    case 'request.create':{
      const type=HR_REQUEST_TYPES.find(t=>t[0]===p.type);if(!type||p.type==='leave')throw Error('نوع طلب غير صحيح / Invalid request type');const e=employee(p.employeeId);allow(isHR||a.employeeId===e.id);if(type[5]==='hr')allow(isHR);
      const date=hrDate(p.from||hrToday()),end=hrDate(p.to||date);if(date>end)throw Error('راجع فترة الطلب / Invalid range');
      const amount=type[3]==='money'?hrNumber(p.amount,.01,10000000):0,hours=type[3]==='hours'?hrNumber(p.hours,.25,24):0;
      const wf=s.settings.workflows[p.type];
      s.requests.unshift({id:id('REQ'),type:p.type,employeeId:e.id,from:date,to:end,amount,hours,reason:hrRequired(p.reason,'التفاصيل / Details'),status:'pending',stage:0,workflow:wf.steps.slice(),workflowVersion:wf.version,createdAt:now,approvals:[],fulfillment:null});break;
    }
    case 'request.decide':case 'leave.decide':{
      const r=(action==='leave.decide'?s.leaves:s.requests).find(x=>x.id===p.id);if(!r)throw Error('الطلب غير موجود / Request not found');allow(hrCanDecide(s,r,a));if(!['approved','rejected'].includes(p.decision))throw Error('قرار غير صحيح / Invalid decision');
      const note=String(p.note||'').trim().slice(0,2000);if(p.decision==='rejected'&&!note)throw Error('اكتب سبب الرفض / Add a rejection reason');
      const workflow=r.workflow||['manager','hr'],final=p.decision==='approved'&&(r.stage||0)+1===workflow.length,e=employee(r.employeeId);
      if(final&&action==='leave.decide'&&r.type==='سنوية'&&e.usedLeave+r.days>e.leaveBalance)throw Error('الرصيد لم يعد كافيًا / Insufficient balance');
      r.approvals.push({role:a.role,step:workflow[r.stage||0],at:now,decision:p.decision,by:a.email,note});
      if(p.decision==='rejected')r.status='rejected';else{r.stage=(r.stage||0)+1;if(final){r.status='approved';r.approvedAt=now;if(action==='leave.decide'&&r.type==='سنوية')e.usedLeave+=r.days;}}
      break;
    }
    case 'request.cancel':{
      const r=(p.source==='leave'?s.leaves:s.requests).find(r=>r.id===p.id);if(!r||r.status!=='pending')throw Error('يمكن سحب الطلب المعلق فقط / Only pending requests can be withdrawn');allow(isHR||r.employeeId===a.employeeId);r.status='cancelled';r.cancelledAt=now;break;
    }
    case 'request.fulfill':{
      const r=s.requests.find(r=>r.id===p.id);if(!r||r.status!=='approved'||r.fulfillment||r.payrollId)throw Error('الطلب غير متاح للتنفيذ / Request not available');allow(isHR||isFinance&&r.workflow.includes('finance'));
      const note=hrRequired(p.note,'توثيق التنفيذ / Fulfillment note');
      if(['resignation','termination'].includes(r.type)){
        allow(isHR);if(s.offboarding.some(o=>o.employeeId===r.employeeId&&o.status==='pending'))throw Error('يوجد إخلاء طرف مفتوح / Offboarding already open');
        s.offboarding.unshift({id:id('O'),employeeId:r.employeeId,reason:r.type==='resignation'?'استقالة':'إنهاء خدمة',lastDay:r.from,tasks:[false,false,false,false],status:'pending',createdAt:hrToday(),sourceRequest:r.id});
      }
      r.fulfillment={at:now,by:a.email,note};break;
    }
    case 'shift.save':{
      allow(team(p.employeeId));const candidate={employeeId:p.employeeId,date:hrDate(p.date),start:p.start,end:p.end,breakMinutes:hrNumber(p.breakMinutes,0,180),location:hrRequired(p.location,'الموقع / Location'),status:'draft'};const w=hrShiftWindow(candidate);
      if(candidate.breakMinutes>=(w.end-w.start)/60000)throw Error('راجع فترة الراحة / Invalid break duration');
      const old=s.shifts.find(x=>x.id===p.id);if(p.id&&!old)throw Error('الشفت غير موجود / Shift not found');if(old)allow(team(old.employeeId));
      if(s.shifts.some(x=>x.id!==p.id&&x.employeeId===p.employeeId&&(()=>{const b=hrShiftWindow(x);return w.start<b.end&&w.end>b.start;})()))throw Error('يوجد تداخل مع شفت آخر / Shift overlaps another assignment');
      if(s.shifts.some(x=>x.id!==p.id&&x.employeeId===p.employeeId&&x.date===p.date))throw Error('شفت واحد لكل موظف في يوم البداية / One shift per employee per start date');
      if(old)Object.assign(old,candidate,{updatedAt:now});else s.shifts.push({...candidate,id:id('SHIFT'),createdAt:now});break;
    }
    case 'shift.publish':{
      hrDate(p.from);hrDate(p.to);allow(isHR||a.role==='manager');const eligible=s.shifts.filter(x=>x.date>=p.from&&x.date<=p.to&&team(x.employeeId)&&(!p.department||employee(x.employeeId).department===p.department));
      if(!eligible.length)throw Error('لا توجد شفتات للنشر / No shifts to publish');eligible.forEach(x=>{x.status='published';x.publishedAt=now;x.publishedBy=a.email;});break;
    }
    case 'shift.remove':{const x=s.shifts.find(x=>x.id===p.id);if(!x)throw Error('الشفت غير موجود / Shift not found');allow(team(x.employeeId));s.shifts=s.shifts.filter(x=>x.id!==p.id);break;}
    case 'attendance.record':{
      allow(isHR);employee(p.employeeId);const date=hrDate(p.date);if(!['present','late','absent'].includes(p.status))throw Error('حالة غير صحيحة / Invalid status');
      const record={id:p.employeeId+'-'+date,employeeId:p.employeeId,date,status:p.status,in:p.status==='absent'?'':p.in,out:p.status==='absent'?'':p.out,source:'manual',recordedBy:a.email,note:hrRequired(p.note,'سبب التسجيل / Recording reason')};
      if(p.status!=='absent')hrShiftWindow({date,start:p.in,end:p.out});const old=s.attendance.find(r=>r.employeeId===p.employeeId&&r.date===date);if(old)Object.assign(old,record);else s.attendance.push(record);break;
    }
    case 'attendance.policy':{
      allow(isHR);if(p.weekend!==undefined){if(!Array.isArray(p.weekend)||p.weekend.length>6||p.weekend.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('راجع أيام العطلة / Check weekend days');s.settings.weekend=[...new Set(p.weekend)];}s.settings.attendancePolicy={graceMinutes:hrNumber(p.graceMinutes,0,120),lateRate:hrNumber(p.lateRate,0,100000),absenceRate:hrNumber(p.absenceRate,0,100000),overtimeRate:hrNumber(p.overtimeRate,0,100000)};break;
    }
    case 'contract.save':{
      allow(isHR);employee(p.employeeId);const start=hrDate(p.start),end=hrDate(p.end);if(end<=start)throw Error('نهاية العقد بعد بدايته / Contract end must follow start');
      if(!['fixed','internship','partTime'].includes(p.type))throw Error('نوع عقد غير صحيح / Invalid contract type');
      const previous=p.renewId?s.contracts.find(c=>c.id===p.renewId&&c.employeeId===p.employeeId&&c.status==='active'):null;
      if(p.renewId&&!previous)throw Error('لا يمكن تجديد هذا العقد / Contract cannot be renewed');
      if(previous&&start<=previous.end)throw Error('التجديد يبدأ بعد نهاية العقد السابق / Renewal starts after prior contract');
      if(s.contracts.some(c=>c.employeeId===p.employeeId&&c.status==='active'&&c.id!==p.renewId&&c.start<=end&&c.end>=start))throw Error('العقد يتداخل مع عقد آخر / Contract overlaps');
      const c={id:id('CON'),employeeId:p.employeeId,start,end,type:p.type,status:'active',createdAt:now,createdBy:a.email,note:String(p.note||'').slice(0,2000),previousId:previous?.id||''};if(previous){previous.status='renewed';previous.renewedBy=c.id;}s.contracts.push(c);break;
    }
    case 'document.expiry':{allow(isHR);const d=s.documents.find(x=>x.id===p.id&&x.active!==false);if(!d)throw Error('المستند غير موجود / Document not found');d.expiresAt=p.expiresAt?hrDate(p.expiresAt):'';break;}
    case 'payroll.effects':{
      allow(isHR||isFinance);const r=s.payroll.find(r=>r.id===p.id&&r.status==='draft');if(!r)throw Error('مسودة فقط / Draft payroll required');const preview=hrPayrollEffects(s,r);
      if(!s.settings.attendancePolicy.overtimeRate&&preview.some(x=>x.effects.requestIds.some(id=>s.requests.find(r=>r.id===id)?.type==='overtime')))throw Error('حدد سعر الإضافي المعتمد قبل إدراجه / Set an overtime rate before applying approved overtime');
      for(const x of preview){const row=r.rows.find(y=>y.employeeId===x.employeeId);if(hrPayParts({...row,effects:x.effects}).net<0)throw Error('التأثير يجعل الصافي سالبًا / Adjustments produce negative pay');}
      preview.forEach(x=>{const row=r.rows.find(y=>y.employeeId===x.employeeId);row.effects=x.effects;row.net=hrPayParts(row).net;});r.effectsSnapshot=JSON.stringify(preview);r.effectsAppliedAt=now;break;
    }
    case 'payroll.payment':{
      allow(isFinance);const r=s.payroll.find(r=>r.id===p.id);if(!r||!['approved','sent','simulated'].includes(r.status)||r.paymentStatus==='paid')throw Error('اعتمد الكشف أو راجع حالة الصرف / Payroll is not ready');
      const date=hrDate(p.date);if(date>hrToday())throw Error('تاريخ الصرف لا يكون في المستقبل / Payment date cannot be in the future');
      const reference=hrRequired(p.reference,'مرجع الصرف / Payment reference');r.paymentStatus='paid';r.paymentDate=date;r.paymentReference=reference;r.paymentRecordedBy=a.email;break;
    }
    default:return false;
  }
  s.revision=(s.revision||0)+1;s.audit.unshift({id:id('A'),at:now,actor:a.email||a.role,action,recordId:p.id||p.employeeId||p.type||'',summary:String(p.note||'').slice(0,500)});s.audit=s.audit.slice(0,500);return true;
}
function hrMutateV2(s,action,p,actor){
  hrEnsureOperations(s);
  if(action==='employee.edit'&&p.manager){let manager=p.manager;const seen=new Set([p.id]);while(manager){if(seen.has(manager))throw Error('علاقة الإدارة تسبب دورة / Reporting line creates a cycle');seen.add(manager);manager=s.employees.find(e=>e.id===manager)?.manager;}}
  if(action==='payroll.prepare'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.month))throw Error('شهر غير صحيح / Invalid month');
  if(action==='payroll.prepare'&&(p.periodFrom||p.periodTo)){hrDate(p.periodFrom);hrDate(p.periodTo);if(p.periodFrom>p.periodTo||hrDaysUntil(p.periodTo,p.periodFrom)>62)throw Error('راجع فترة احتساب المرتب / Check the payroll cut-off period');}
  if(action==='payroll.prepare'){const start=p.periodFrom||p.month+'-01',end=p.periodTo||p.month+'-31',ids=new Set(s.employees.filter(e=>e.status!=='inactive'&&e.joinDate<=p.month+'-31').map(e=>e.id));if(s.payroll.some(r=>(r.periodFrom||r.month+'-01')<=end&&(r.periodTo||r.month+'-31')>=start&&r.rows.some(row=>ids.has(row.employeeId))))throw Error('فترة الاحتساب تتداخل مع كشف سابق؛ راجع التواريخ / Cut-off overlaps an existing payroll; review the dates');}
  if(action==='payroll.updateRow'){const r=s.payroll.find(r=>r.id===p.runId),row=r?.rows.find(x=>x.employeeId===p.employeeId);if(row&&hrPayParts({...row,...Object.fromEntries(['basic','allowance','bonus','deduction'].map(k=>[k,Number(p[k])]))}).net<0)throw Error('الصافي بعد التأثيرات لا يكون سالبًا / Net after adjustments cannot be negative');}
  if(hrOperationsMutate(s,action,p,actor))return s;
  if(action==='payroll.approve'){
    const r=s.payroll.find(r=>r.id===p.id);if(r){const preview=hrPayrollEffects(s,r),hasEffects=preview.some(x=>x.effects.allowance||x.effects.bonus||x.effects.deduction||x.effects.requestIds.length);
      const start=r.periodFrom||r.month+'-01',end=r.periodTo||r.month+'-31';
      if(s.payroll.some(other=>other.id!==r.id&&other.status!=='draft'&&(other.periodFrom||other.month+'-01')<=end&&(other.periodTo||other.month+'-31')>=start&&other.rows.some(row=>r.rows.some(x=>x.employeeId===row.employeeId))))throw Error('فترة الاحتساب تتداخل مع كشف معتمد لنفس الموظفين / Cut-off overlaps an approved payroll for these employees');
      if((hasEffects||r.effectsSnapshot)&&r.effectsSnapshot!==JSON.stringify(preview))throw Error('راجع وطبّق تأثيرات الحضور والطلبات المحدثة أولًا / Review and apply current effects first');
    }
  }
  if(action==='document.register'&&p.expiresAt)hrDate(p.expiresAt);
  hrMutateLegacy(s,action,p,actor);
  if(action==='payroll.prepare'){const r=s.payroll[0];r.periodFrom=p.periodFrom||p.month+'-01';r.periodTo=p.periodTo||new Date(Date.UTC(Number(p.month.slice(0,4)),Number(p.month.slice(5,7)),0,12)).toISOString().slice(0,10);}
  if(action==='leave.create'){const r=s.leaves[0],w=s.settings.workflows.leave;r.workflow=w.steps.slice();r.workflowVersion=w.version;}
  if(action==='payroll.updateRow'){const r=s.payroll.find(r=>r.id===p.runId),row=r.rows.find(r=>r.employeeId===p.employeeId);row.net=hrPayParts(row).net;}
  if(action==='payroll.approve'){const r=s.payroll.find(r=>r.id===p.id);r.paymentStatus='unpaid';r.rows.forEach(row=>(row.effects?.requestIds||[]).forEach(id=>{const req=s.requests.find(x=>x.id===id);if(req)req.payrollId=r.id;}));}
  if(action==='document.register')s.documents[s.documents.length-1].expiresAt=p.expiresAt||'';
  return s;
}
// Roll back partial in-memory mutations when validation fails, including legacy actions.
function hrMutate(s,action,p,actor){const before=JSON.stringify(s);try{return hrMutateV2(s,action,p,actor);}catch(error){Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(before));throw error;}}
