// Authorization is based on a verified Supabase user ID and a server-owned membership.
// Caller-supplied roles, email, employee ID and user_metadata are never trusted.
export const ROLES = ['admin', 'hr', 'finance', 'manager', 'employee'];
export function actorFor(user, membership, state) {
  if (!user?.id || !user.email_confirmed_at || !membership?.active ||
      membership.user_id !== user.id || !ROLES.includes(membership.role))
    throw Object.assign(new Error('Access denied / الحساب غير مصرح له'), {status:403});
  const employee = state.employees.find(e => e.id === membership.employee_id);
  if (membership.employee_id && (!employee || employee.status === 'inactive'))
    throw Object.assign(new Error('Employee access is inactive / حساب الموظف موقوف'), {status:403});
  if (['employee','manager'].includes(membership.role) && !employee)
    throw new Error('Link this account to an employee first / اربط الحساب بملف الموظف');
  return { userId: user.id, email: user.email, role: membership.role,
    employeeId: employee?.id || '', demo: false, identityProvider: 'supabase' };
}
export function scopeState(state, actor, members = []) {
  const s = structuredClone(state);
  const own = actor.employeeId;
  s.access = actor.role === 'admin' ? members.map(m => ({
    email: m.email, role: m.role, userId: m.user_id, employeeId: m.employee_id,
    active: m.active
  })) : [];
  const team = new Set(s.employees.filter(e => e.id === own ||
    actor.role === 'manager' && e.manager === own).map(e => e.id));
  s.requests = s.requests.filter(r => ['admin','hr'].includes(actor.role) ||
    r.employeeId === own || actor.role === 'manager' && team.has(r.employeeId) ||
    actor.role === 'finance' && r.workflow?.includes('finance'));
  if (['admin','hr'].includes(actor.role)) return s;
  s.audit = []; s.candidates = []; s.offboarding = []; s.contracts = [];
  if (actor.role === 'finance') {
    s.documents = []; s.reviews = []; s.policies = []; s.jobs = [];
    s.employees = s.employees.map(({id,name,email,department,job,status,joinDate,exitDate,
      salary,allowance,bonus,deduction,leaveBalance,usedLeave}) => ({id,name,email,department,
      job,status,joinDate,exitDate,salary,allowance,bonus,deduction,leaveBalance,usedLeave,
      onboarding:[],acknowledgments:[]}));
    return s;
  }
  s.employees = s.employees.filter(e => team.has(e.id)).map(e => e.id === own ? e : ({
    id:e.id,name:e.name,job:e.job,department:e.department,manager:e.manager,
    status:e.status,joinDate:e.joinDate,exitDate:e.exitDate,
    email:'',salary:0,allowance:0,bonus:0,deduction:0,
    leaveBalance:e.leaveBalance,usedLeave:e.usedLeave,onboarding:[],acknowledgments:[]
  }));
  s.attendance = s.attendance.filter(r => team.has(r.employeeId));
  s.shifts = s.shifts.filter(r => team.has(r.employeeId) &&
    (actor.role !== 'employee' || r.status === 'published'));
  s.leaves = s.leaves.filter(r => team.has(r.employeeId));
  s.reviews = s.reviews.filter(r => team.has(r.employeeId));
  // Do not return run-level adjustment details belonging to other employees.
  s.payroll = s.payroll.filter(r => ['approved','sent'].includes(r.status)).map(r => ({
    id:r.id,month:r.month,status:r.status,approvedAt:r.approvedAt,
    rows:r.rows.filter(row => row.employeeId === own)
  })).filter(r => r.rows.length);
  s.documents = s.documents.filter(d => d.employeeId === own).map(({fileId,...d}) => d);
  s.jobs = s.jobs.filter(j => j.status === 'published');
  return s;
}
export function validateMutation(action, payload, actor, state) {
  if (typeof action !== 'string' || !payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new Error('Invalid operation');
  if (['document.register','payroll.simulate','access.set'].includes(action))
    throw new Error('Use the dedicated server operation');
  if (action === 'settings.save' && payload.autoSend)
    throw new Error('Automatic email scheduling is not enabled in this edition');
  if (action === 'employee.edit' && state.employees.some(e => e.id === payload.id &&
      e.email.toLowerCase() !== String(payload.email).toLowerCase()))
    throw new Error('Change an account email through Supabase Auth before changing the HR profile');
  if (action === 'employee.add' || action === 'employee.edit') {
    if (!payload.department?.trim()) throw new Error('Department is required');
  }
  if (actor.role === 'employee' && payload.employeeId && payload.employeeId !== actor.employeeId)
    throw new Error('Employee record access denied');
}
export function validateDocument(p, state, actor) {
  const e = state.employees.find(e => e.id === p?.employeeId);
  if (!e || e.status === 'inactive' ||
      !(['admin','hr'].includes(actor.role) || actor.employeeId === e.id)) throw new Error('Document access denied');
  if (!state.settings.requiredDocuments.includes(p.type)) throw new Error('Unknown document requirement');
  if (typeof p.base64 !== 'string' || p.base64.length > 2800000) throw new Error('File exceeds 2 MB');
  let bytes;
  try { bytes = Uint8Array.from(atob(p.base64), c => c.charCodeAt(0)); } catch { throw new Error('Invalid file'); }
  if (!bytes.length || bytes.length > 2097152) throw new Error('File exceeds 2 MB');
  const sig = Array.from(bytes.slice(0,8));
  if (!(p.mime === 'application/pdf' && sig.slice(0,5).join(',') === '37,80,68,70,45' ||
      p.mime === 'image/png' && sig.join(',') === '137,80,78,71,13,10,26,10' ||
      p.mime === 'image/jpeg' && sig[0] === 255 && sig[1] === 216 && sig[2] === 255))
    throw new Error('File signature does not match its type');
  return bytes;
}
