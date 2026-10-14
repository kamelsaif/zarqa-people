import {createClient} from '@supabase/supabase-js';

const config = window.ZARQA_CONFIG || {};
let client, revision = 0, recovery = false;
const valid = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || '') &&
  typeof config.publishableKey === 'string' && config.publishableKey.length > 20 &&
  !/^(sb_secret_|eyJ.*service_role)/.test(config.publishableKey);
const main = () => document.getElementById('main');
const english = () => localStorage.getItem('zarqa-ui-language') === 'en';
const text = (ar,en) => english() ? en : ar;
const esc = value => String(value || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loginScreen(message = '', mode = 'login') {
  document.body.classList.add('cloud-locked');
  const reset = mode === 'reset', update = mode === 'update';
  main().innerHTML = '<div class="cloud-auth"><div class="cloud-auth-intro"><span class="eyebrow">ZARQA PEOPLE</span><h1>'+text('كل ما يخص شغلك.\nفي مكان واحد.','Your work.\nIn one place.')+'</h1><p>'+text('طلباتك، إجازاتك، وكشوف مرتبك. مساحة خاصة لفريقك.','Requests, leave and payslips. A private workspace for your team.')+'</p></div><section class="card cloud-auth-card"><h2>'+text(update?'اختار كلمة مرور جديدة':reset?'استرجاع الحساب':'أهلًا بيك من جديد',update?'Choose a new password':reset?'Recover your account':'Welcome back')+'</h2><p>'+text('استخدم البريد المسجل لك عند مسؤول الشركة.','Use the email registered by your company administrator.')+'</p><form id="cloudAuthForm">'+(!update?'<div class="field"><label for="cloudEmail">'+text('البريد الإلكتروني','Email')+'</label><input id="cloudEmail" type="email" autocomplete="username" required></div>':'')+(!reset?'<div class="field"><label for="cloudPassword">'+text('كلمة المرور','Password')+'</label><input id="cloudPassword" type="password" autocomplete="'+(update?'new-password':'current-password')+'" '+(update?'minlength="12"':'')+' required></div>':'')+(update?'<div class="field"><label for="cloudConfirm">'+text('تأكيد كلمة المرور','Confirm password')+'</label><input id="cloudConfirm" type="password" autocomplete="new-password" minlength="12" required></div>':'')+'<p id="cloudAuthMessage" role="status">'+esc(message)+'</p><button class="btn primary" type="submit">'+text(update?'حفظ كلمة المرور':reset?'إرسال رابط الاسترجاع':'تسجيل الدخول',update?'Save password':reset?'Send recovery link':'Sign in')+'</button></form>'+(!update?'<button class="btn ghost" id="cloudAuthToggle">'+text(reset?'الرجوع للدخول':'نسيت كلمة المرور؟',reset?'Back to sign in':'Forgot password?')+'</button>':'')+'<p class="cloud-auth-note">'+text('الحسابات يحددها مسؤول الشركة. لا يشترط Gmail أو Google Workspace.','Accounts are assigned by your administrator. Gmail or Google Workspace is not required.')+'</p></section></div>';
  document.getElementById('cloudAuthToggle')?.addEventListener('click',()=>loginScreen('',reset?'login':'reset'));
  document.getElementById('cloudAuthForm').addEventListener('submit',async event=>{
    event.preventDefault(); const button=event.target.querySelector('button[type="submit"]');button.disabled=true;
    const msg=document.getElementById('cloudAuthMessage');
    try {
      if (reset) {
        const {error}=await client.auth.resetPasswordForEmail(document.getElementById('cloudEmail').value.trim(),{redirectTo:location.origin+location.pathname});
        if(error)throw new Error(text('تعذر إرسال رابط الاسترجاع حاليًا. حاول مرة أخرى أو تواصل مع مسؤول الشركة.','Unable to send a recovery link right now. Try again or contact your administrator.'));
        msg.textContent=text('لو الحساب متاح، هيوصلك رابط استرجاع.','If the account is available, a recovery link will be sent.'); return;
      }
      if (update) {
        const password=document.getElementById('cloudPassword').value;
        if(password!==document.getElementById('cloudConfirm').value)throw new Error(text('كلمتا المرور مختلفتان','Passwords do not match'));
        const {error}=await client.auth.updateUser({password});if(error)throw error;
        recovery=false; await client.auth.signOut(); location.reload(); return;
      }
      const {data,error}=await client.auth.signInWithPassword({email:document.getElementById('cloudEmail').value.trim(),password:document.getElementById('cloudPassword').value});
      document.getElementById('cloudPassword').value='';
      if(error||!data.session)throw new Error(text('تعذر الدخول. راجع البريد وكلمة المرور.','Unable to sign in. Check your email and password.'));
      // A fresh bootstrap is required after every sign-in, including denied/revoked accounts.
      location.reload();
    } catch(error) { msg.textContent=error.message || text('تعذر إكمال العملية','Could not complete the request'); }
    finally {button.disabled=false;}
  });
}
async function initialize() {
  if (!valid) {
    document.body.classList.add('cloud-locked');
    main().innerHTML='<section class="card cloud-config-error"><h1>إعداد الاتصال مطلوب / Connection setup required</h1><p>هذه نسخة التشغيل السحابي. يلزم ضبط عنوان Supabase والمفتاح العام في cloud-config.js قبل الدخول.</p><p>The cloud edition is locked until its public connection settings are configured.</p></section>';
    throw new Error('Cloud configuration required');
  }
  // Reject JWT service-role keys as well as the newer secret-key prefix.
  if (config.publishableKey.startsWith('eyJ')) {
    let claims;try{claims=JSON.parse(atob(config.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{throw new Error('Invalid public key');}
    if (claims.role !== 'anon') throw new Error('Use only the publishable or anon key');
  }
  client=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,storage:sessionStorage,
    autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange(event=>{
    if(event==='PASSWORD_RECOVERY'){recovery=true;loginScreen('','update');}
    if(event==='SIGNED_OUT'){document.body.classList.add('cloud-locked');main().innerHTML='';}
  });
  const {data}=await client.auth.getSession();
  if(recovery)return new Promise(()=>{});
  if(data.session)return data.session;
  loginScreen();
  return new Promise(()=>{});
}
let ready;
async function call(action,payload={}) {
  ready ||= initialize(); await ready;
  const {data,error}=await client.auth.getSession();
  if(error||!data.session)throw new Error('Sign in again / سجّل الدخول من جديد');
  let response;
  try {response=await fetch(config.supabaseUrl+'/functions/v1/'+(config.functionName||'hr-api'),{
    method:'POST',headers:{'Content-Type':'application/json',apikey:config.publishableKey,
      Authorization:'Bearer '+data.session.access_token},
    body:JSON.stringify({action,payload,expectedRevision:revision}),signal:AbortSignal.timeout(60000)});}
  catch{throw new Error(text('تعذر الاتصال. لم نؤكد حفظ العملية؛ حدّث البيانات قبل المحاولة.','Connection failed. Save status is unknown; refresh before retrying.'));}
  const result=await response.json();
  if(!response.ok){
    if(response.status===401||response.status===403){await client.auth.signOut();loginScreen(result.error);ready=new Promise(()=>{});}
    throw new Error(result.error||'Request failed');
  }
  const returnedState=result.state||result;
  if(Number.isSafeInteger(returnedState.revision))revision=returnedState.revision;
  if(action==='bootstrap')document.body.classList.remove('cloud-locked');
  return result;
}
window.ZarqaCloud={call,logout:async()=>{if(client)await client.auth.signOut();location.reload();}};
