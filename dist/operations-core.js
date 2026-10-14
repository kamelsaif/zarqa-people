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
