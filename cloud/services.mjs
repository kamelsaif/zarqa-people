export function cloudServices(env, fetcher = fetch) {
  const required = key => { const value = env(key); if (!value) throw new Error('Service configuration missing: '+key); return value; };
  const safeResponse = async (response, message) => {
    if (!response.ok) throw new Error(message);
    return response;
  };
  async function driveToken() {
    const response = await fetcher('https://oauth2.googleapis.com/token', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({client_id:required('GOOGLE_CLIENT_ID'),
        client_secret:required('GOOGLE_CLIENT_SECRET'),refresh_token:required('GOOGLE_REFRESH_TOKEN'),
        grant_type:'refresh_token'}), signal:AbortSignal.timeout(15000)
    });
    const data = await (await safeResponse(response,'Google Drive connection failed')).json();
    if (!data.access_token) throw new Error('Google Drive connection failed');
    return data.access_token;
  }
  async function driveCheck() {
    if (!env('GOOGLE_REFRESH_TOKEN') || !env('GOOGLE_DRIVE_FOLDER_ID')) return {connected:false};
    const token = await driveToken(), id = required('GOOGLE_DRIVE_FOLDER_ID');
    const response = await fetcher('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+
      '?fields=id,name,mimeType,trashed,capabilities(canAddChildren)',
      {headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    const folder = await (await safeResponse(response,'Drive folder unavailable')).json();
    if (folder.trashed || folder.mimeType !== 'application/vnd.google-apps.folder' || !folder.capabilities?.canAddChildren)
      throw new Error('Configured Drive folder is not writable');
    return {connected:true,name:folder.name};
  }
  async function driveUpload(name, mime, bytes, employeeId = '') {
    const token = await driveToken();
    let parent = required('GOOGLE_DRIVE_FOLDER_ID');
    if (employeeId) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(employeeId)) throw new Error('Invalid employee ID');
      const params = new URLSearchParams({q:"'"+parent.replace(/'/g,"\\'")+"' in parents and trashed=false and mimeType='application/vnd.google-apps.folder' and name='"+employeeId+"'",fields:'files(id)',pageSize:'1'});
      const result = await fetcher('https://www.googleapis.com/drive/v3/files?'+params,
        {headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
      const folders = await (await safeResponse(result,'Drive folder lookup failed')).json();
      if (folders.files?.length) parent = folders.files[0].id;
      else {
        const created = await fetcher('https://www.googleapis.com/drive/v3/files?fields=id',{
          method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({name:employeeId,mimeType:'application/vnd.google-apps.folder',parents:[parent]}),
          signal:AbortSignal.timeout(15000)});
        parent = (await (await safeResponse(created,'Drive folder creation failed')).json()).id;
      }
    }
    const boundary = 'zarqa-'+crypto.randomUUID();
    const metadata = JSON.stringify({name,mimeType:mime,parents:[parent]});
    const body = new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+metadata+
      '\r\n--'+boundary+'\r\nContent-Type: '+mime+'\r\n\r\n',bytes,'\r\n--'+boundary+'--']);
    const response = await fetcher('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{
      method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/related; boundary='+boundary},
      body,signal:AbortSignal.timeout(30000)});
    return (await (await safeResponse(response,'Drive upload failed')).json()).id;
  }
  async function driveDownload(id) {
    const token = await driveToken();
    const response = await fetcher('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{
      headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    await safeResponse(response,'Document unavailable');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 2097152) throw new Error('Document exceeds allowed size');
    let binary = ''; for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(binary);
  }
  async function backup(state) {
    const hex = required('BACKUP_ENCRYPTION_KEY');
    if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error('Backup encryption key must be 32 bytes in hex');
    const key = await crypto.subtle.importKey('raw',Uint8Array.from(hex.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(state))));
    const envelope = new Blob([new TextEncoder().encode('ZPBACKUP1'),iv,ciphertext]);
    await driveUpload('zarqa-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.enc',
      'application/octet-stream',new Uint8Array(await envelope.arrayBuffer()));
    return new Date().toISOString();
  }
  async function sendPayslipNotice(row, run, company, deliveryId) {
    const origin = required('APP_ORIGIN');
    const response = await fetcher('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+required('RESEND_API_KEY'),
        'Content-Type':'application/json','Idempotency-Key':deliveryId},
      body:JSON.stringify({from:required('EMAIL_FROM'),to:[row.email],
        subject:company+' | Payslip '+run.month,
        text:'Your approved payslip for '+run.month+' is ready. Sign in to view it and save a PDF:\n'+origin+'/#selfservice'+
          '\n\nكشف راتبك المعتمد متاح في بوابة الموظف. سجّل الدخول للاطلاع عليه وحفظ PDF.\nThis notice is not proof of bank payment.'}),
      signal:AbortSignal.timeout(20000)});
    const result = await (await safeResponse(response,'Email delivery requires manual review')).json();
    if (!result.id) throw new Error('Email delivery requires manual review');
    return result.id;
  }
  return {driveCheck,driveUpload,driveDownload,backup,sendPayslipNotice};
}
