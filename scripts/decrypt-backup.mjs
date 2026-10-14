import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export async function decryptBackup(bytes, hex) {
  if (!/^[a-f0-9]{64}$/i.test(hex || '')) throw new Error('A 32-byte hexadecimal backup key is required');
  if (new TextDecoder().decode(bytes.subarray(0,9)) !== 'ZPBACKUP1' || bytes.length < 37)
    throw new Error('Unsupported or incomplete backup');
  const key = await crypto.subtle.importKey('raw',Uint8Array.from(hex.match(/../g),x=>parseInt(x,16)),
    {name:'AES-GCM'},false,['decrypt']);
  const plaintext = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.subarray(9,21)},key,bytes.subarray(21));
  return JSON.parse(new TextDecoder().decode(plaintext));
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const [input,output] = process.argv.slice(2);
    if (!input || !output) throw new Error('Usage: node scripts/decrypt-backup.mjs INPUT.enc NEW-PRIVATE-OUTPUT.json');
    const data = await decryptBackup(await fs.readFile(input),process.env.BACKUP_ENCRYPTION_KEY);
    await fs.writeFile(output,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
    console.log('Backup decrypted. Keep the output private; it contains HR records.');
  } catch {
    console.error('Unable to decrypt or save backup. Check the key, input and a new output path. No existing file was replaced.');
    process.exitCode = 1;
  }
}
