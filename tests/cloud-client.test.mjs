import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../cloud/client.js', import.meta.url), 'utf8')
  .replace(/^import[^\n]+\n/, '');

for (const language of ['ar', 'en']) for (const fails of [false, true]) {
  test(`password recovery reports ${fails ? 'failure' : 'success'} in ${language}`, async () => {
    const elements = new Map(), requests = [];
    const element = id => {
      if (!elements.has(id)) elements.set(id, {innerHTML:'', textContent:'', value:'', listeners:{},
        addEventListener(name, listener) { this.listeners[name] = listener; }});
      return elements.get(id);
    };
    const auth = {
      onAuthStateChange() {}, getSession: async () => ({data:{session:null}}),
      resetPasswordForEmail: async (...args) => {
        requests.push(args);
        return {data:null, error:fails ? {message:'private provider details'} : null};
      }
    };
    const context = vm.createContext({console, URL, AbortSignal,
      createClient: () => ({auth}),
      window:{ZARQA_CONFIG:{supabaseUrl:'https://example.supabase.co', publishableKey:'sb_publishable_public_test_key'}},
      localStorage:{getItem:()=>language}, sessionStorage:{},
      location:{origin:'https://hr.example.com', pathname:'/'},
      document:{getElementById:element, body:{classList:{add(){}, remove(){}}}}
    });
    vm.runInContext(source, context);
    void context.window.ZarqaCloud.call('bootstrap');
    await new Promise(resolve => setImmediate(resolve));
    element('cloudAuthToggle').listeners.click();
    element('cloudEmail').value=' owner@example.com ';
    const button={disabled:false};
    await element('cloudAuthForm').listeners.submit({preventDefault(){}, target:{querySelector:()=>button}});
    assert.equal(requests.length, 1);
    assert.equal(requests[0][0], 'owner@example.com');
    assert.equal(requests[0][1].redirectTo, 'https://hr.example.com/');
    assert.equal(button.disabled, false, 'the user can retry');
    assert.match(element('cloudAuthMessage').textContent, fails ? /Unable to send|تعذر إرسال/ : /If the account|لو الحساب/);
    assert.doesNotMatch(element('cloudAuthMessage').textContent, /private provider details/);
  });
}
