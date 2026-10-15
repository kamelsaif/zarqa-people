import {actorFor,scopeState,validateMutation,validateDocument,ROLES} from './domain.mjs';
import {cloudServices} from './services.mjs';
import {hrMutate,hrEnsureOperations,hrDate} from './engine.mjs';

export function createHandler(env, fetcher = fetch) {
  const services = cloudServices(env, fetcher);
  const dbUrl = () => env('SUPABASE_URL');
  const dbHeaders = () => ({apikey:env('SUPABASE_SERVICE_ROLE_KEY'),
    Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json'});
  async function db(path, method='GET', body, extra={}) {
    const res = await fetcher(dbUrl()+'/rest/v1/'+path,{method,headers:{...dbHeaders(),...extra},
      ...(body === undefined ? {} : {body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
    if (!res.ok) {
      const details = await res.json().catch(()=>({}));
      if (String(details.message).includes('STALE_REVISION')) throw Object.assign(new Error('Someone updated these records. Refresh and review before saving. / البيانات اتغيرت؛ حدّث الصفحة وراجعها.'),{status:409});
      if (String(details.message).includes('OWNER_PROTECTED')) throw new Error('The owner account must remain an active administrator');
      if (String(details.message).includes('ACCESS_REVOKED')) throw Object.assign(new Error('Access revoked'),{status:403});
      if (String(details.message).includes('CONFIRMED_AUTH_USER_REQUIRED')) throw new Error('Create/invite the user in Supabase Authentication and confirm their email first');
      if (String(details.message).includes('MEMBER_EXISTS')) throw new Error('This account is already linked');
      if (String(details.message).includes('EMPLOYEE_MISMATCH')) throw new Error('Employee profile email must match the account');
      throw new Error('Database operation failed');
    }
    if (res.status === 204) return null;
    const text = await res.text(); return text ? JSON.parse(text) : null;
  }
  async function readWorkspace() {
    const rows = await db('hr_workspace?id=eq.default&select=data,revision');
    if (!rows?.length) throw new Error('Workspace is not initialized');
    const state = hrEnsureOperations(rows[0].data); state.revision = Number(rows[0].revision); return state;
  }
  async function member(userId) { return (await db('hr_members?user_id=eq.'+encodeURIComponent(userId)+'&select=*'))?.[0]; }
  async function view(state,actor) {
    const members = actor.role === 'admin' ? await db('hr_members?select=user_id,email,role,employee_id,active') : [];
    const scoped = scopeState(state,actor,members);
    if (actor.role === 'admin') {
      // These operations are committed by PostgreSQL, outside the business-rule audit array.
      const systemAudit = await db('hr_audit?select=id,at,user_id,action,revision&action=in.(data.backup,account.link)&order=at.desc&limit=500');
      const emails = new Map(members.map(member => [member.user_id,member.email]));
      scoped.audit = [...scoped.audit,...systemAudit.map(row => ({
        id:'server-'+row.id,at:row.at,actor:emails.get(row.user_id)||row.user_id,action:row.action
      }))].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,500);
    }
    return scoped;
  }
  async function commit(state, actor, operation, expected, memberChange = null) {
    const revision = await db('rpc/hr_commit','POST',{expected_revision:expected,next_data:state,
      acting_user:actor.userId,operation,member_change:memberChange});
    state.revision = Number(revision); return state;
  }
  const requireAdmin = a => { if (a.role !== 'admin') throw Object.assign(new Error('Administrator access required'),{status:403}); };
  function requireRevision(input,state) {
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision !== state.revision)
      throw Object.assign(new Error('Refresh and review the latest records before saving / حدّث البيانات قبل الحفظ'),{status:409});
  }
  return async function handle(req) {
    const configured = env('APP_ORIGIN') || '';
    const origin = req.headers.get('Origin');
    const cors = {'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store',
      ...(origin && origin === configured ? {'Access-Control-Allow-Origin':origin} : {})};
    const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
    if (!/^https:\/\//.test(configured) || !dbUrl() || !env('SUPABASE_SERVICE_ROLE_KEY')) return json({error:'Service not configured'},503);
    if (origin && origin !== configured) return json({error:'Origin not allowed'},403);
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (req.method !== 'POST') return json({error:'Method not allowed'},405);
    try {
      const token = req.headers.get('Authorization');
      if (!token?.startsWith('Bearer ')) return json({error:'Sign in required'},401);
      const auth = await fetcher(dbUrl()+'/auth/v1/user',{headers:{
        apikey:env('SUPABASE_ANON_KEY') || env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:token},signal:AbortSignal.timeout(10000)});
      if (!auth.ok) return json({error:'Session expired. Sign in again.'},401);
      const user = await auth.json();
      if (Number(req.headers.get('Content-Length')) > 3000000) return json({error:'Request too large'},413);
      const text = await req.text(); if (text.length > 3000000) return json({error:'Request too large'},413);
      let input; try { input = JSON.parse(text); } catch { return json({error:'Invalid JSON'},400); }
      const action = input?.action, p = input?.payload || {};
      let state = await readWorkspace();
      const actor = actorFor(user,await member(user.id),state);
      if (action === 'bootstrap') return json({state:await view(state,actor),actor});
      if (action === 'getState') return json(await view(state,actor));
      if (action === 'admin.status') {
        requireAdmin(actor);
        let drive; try { drive = await services.driveCheck(); } catch { drive = {connected:false,error:'Drive connection check failed'}; }
        return json({connected:true,checkedAt:new Date().toISOString(),databaseName:'Supabase PostgreSQL',
          archiveName:drive.name || 'Google Drive not connected',driveConnected:!!drive.connected,
          emailConfigured:!!env('RESEND_API_KEY') && !!env('EMAIL_FROM'),
          lastBackupAt:state.settings.lastBackupAt || '',domain:new URL(configured).host});
      }
      if (action === 'getDocument') {
        const d = state.documents.find(d=>d.id===p.id);
        if (!d || !(['admin','hr'].includes(actor.role) || d.employeeId === actor.employeeId)) return json({error:'Document access denied'},403);
        return json({name:d.name,mime:d.mime,base64:await services.driveDownload(d.fileId)});
      }
      requireRevision(input,state);
      const expected = state.revision;
      if (action === 'mutate') {
        if (p.action === 'access.set') {
          requireAdmin(actor);
          const members = await db('hr_members?email=eq.'+encodeURIComponent(String(p.payload?.email||'').toLowerCase())+'&select=*');
          if (!members?.length) throw new Error('Create/invite the user in Supabase Auth, then link the account from Accounts');
          if (!ROLES.includes(p.payload.role)) throw new Error('Invalid role');
          const m = members[0];
          if (['employee','manager'].includes(p.payload.role) && !m.employee_id) throw new Error('Link an employee profile first');
          const change = {user_id:m.user_id,role:p.payload.role,active:p.payload.active !== false,employee_id:m.employee_id};
          state.audit.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),actor:actor.email,action:'access.set'});
          await commit(state,actor,'access.set',expected,change);
        } else {
          validateMutation(p.action,p.payload||{},actor,state);
          hrMutate(state,p.action,p.payload||{},actor);
          await commit(state,actor,p.action,expected);
        }
        return json(await view(state,actor));
      }
      if (action === 'admin.linkAccount') {
        requireAdmin(actor);
        if (!ROLES.includes(p.role)) throw new Error('Invalid role');
        await db('rpc/hr_link_member','POST',{acting_user:actor.userId,expected_revision:expected,
          target_email:String(p.email||'').toLowerCase().trim(),target_role:p.role,
          target_employee_id:p.employeeId||null});
        return json(await view(await readWorkspace(),actor));
      }
      if (action === 'uploadDocument') {
        const bytes = validateDocument(p,state,actor);
        if (p.expiresAt) hrDate(p.expiresAt);
        const name = String(p.name||'document').replace(/[\/\\\r\n]/g,'_').slice(0,180);
        const fileId = await services.driveUpload(crypto.randomUUID()+'-'+name,p.mime,bytes,p.employeeId);
        hrMutate(state,'document.register',{...p,base64:undefined,name,fileId,size:bytes.length},{...actor,demo:true});
        // A conflict leaves only a private orphan file. It never overwrites a colleague's work.
        await commit(state,actor,'document.upload',expected);
        return json(await view(state,actor));
      }
      if (action === 'admin.backup') {
        requireAdmin(actor);
        state.settings.lastBackupAt = await services.backup({state,members:await db('hr_members?select=*')});
        await commit(state,actor,'data.backup',expected);
        return json({connected:true,lastBackupAt:state.settings.lastBackupAt,checkedAt:new Date().toISOString(),
          databaseName:'Supabase PostgreSQL',archiveName:'Google Drive',driveConnected:true,domain:new URL(configured).host});
      }
      if (action === 'sendPayroll') {
        if (!['admin','finance'].includes(actor.role)) return json({error:'Finance access required'},403);
        if (!env('RESEND_API_KEY') || !env('EMAIL_FROM')) throw new Error('Configure Resend before sending payslip notices');
        const run = state.payroll.find(r=>r.id===p.id);
        if (!run || !['approved','sent'].includes(run.status) || !run.approvedBy) throw new Error('Finance approval required');
        // One explicit batch, at most 20. Durable claims prevent retries after ambiguous sends.
        let sent = 0;
        for (const row of run.rows.filter(r=>r.status==='queued').slice(0,20)) {
          const freshActor = actorFor(user,await member(user.id),await readWorkspace());
          if (!['admin','finance'].includes(freshActor.role)) throw new Error('Finance access revoked');
          const id = 'payslip:'+run.id+':'+row.employeeId;
          const old = await db('hr_deliveries?id=eq.'+encodeURIComponent(id)+'&select=*');
          if (old?.length) {
            row.status = old[0].status === 'sent' ? 'sent' : 'review_required'; continue;
          }
          // Validate the current profile and bound account; never mail a stale payroll address.
          const employee = state.employees.find(e=>e.id===row.employeeId && e.status!=='inactive');
          const recipients = await db('hr_members?employee_id=eq.'+encodeURIComponent(row.employeeId)+'&active=eq.true&select=email');
          if (!employee || employee.email !== row.email || !recipients.some(r=>r.email===row.email)) {
            row.status='review_required';continue;
          }
          await db('hr_deliveries','POST',{id,user_id:actor.userId,run_id:run.id,employee_id:row.employeeId,status:'sending'});
          try {
            const providerId = await services.sendPayslipNotice(row,run,state.settings.company,id);
            await db('hr_deliveries?id=eq.'+encodeURIComponent(id),'PATCH',{status:'sent',provider_id:providerId,updated_at:new Date().toISOString()});
            row.status='sent';row.sentAt=new Date().toISOString();sent++;
          } catch {
            row.status='review_required';
            await db('hr_deliveries?id=eq.'+encodeURIComponent(id),'PATCH',{status:'review_required',updated_at:new Date().toISOString()});
          }
        }
        run.status=run.rows.every(r=>r.status==='sent')?'sent':'approved';
        try { await commit(state,actor,'payroll.notice',expected); }
        catch { return json({message:sent+' notices accepted. Delivery receipts are preserved; refresh before reconciling payroll.'}); }
        return json({message:sent+' notices accepted by email provider. Each employee signs in to view and print their payslip.'});
      }
      return json({error:'Unknown operation'},400);
    } catch (error) {
      return json({error:error.message || 'Operation failed'},error.status || 400);
    }
  };
}
