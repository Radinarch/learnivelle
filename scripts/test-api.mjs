import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { getPlatformProxy } from 'wrangler';
const proxy=await getPlatformProxy({configPath:'dist/server/wrangler.json',persist:false});
const migration=await readFile('drizzle/0000_ambitious_infant_terrible.sql','utf8');
for(const statement of migration.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await proxy.env.DB.prepare(statement).run();
globalThis.__testEnv=proxy.env;
const source=(await readFile('app/api-service.ts','utf8')).replace("import {env} from 'cloudflare:workers';","const env=globalThis.__testEnv;");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {api}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const origin='https://test.yanyana.local';
async function call(path,user,body,method,expected=200){const headers={Origin:origin};if(user)headers['oai-authenticated-user-id']=user;let data;if(body instanceof FormData)data=body;else if(body){headers['Content-Type']='application/json';data=JSON.stringify(body)}const response=await api(new Request(origin+'/api/'+path,{method:method||(body?'POST':'GET'),headers,body:data}));assert.equal(response.status,expected,path+': '+(response.status!==expected?await response.clone().text():''));return response.headers.get('Content-Type')?.includes('json')?response.json():response}
const created=[];
try{
 const unauthorized=await call('entries',null,{title:'No auth'},'POST',401);assert.equal(unauthorized.error,'Sign in to post.');
 const invalid=await call('entries','qa-a',{type:'question',title:''},'POST',400);assert.equal(invalid.error,'A title is required.');
 const csrf=await api(new Request(origin+'/api/entries',{method:'POST',headers:{Origin:'https://elsewhere.test','oai-authenticated-user-id':'qa-a'},body:'{}'}));assert.equal(csrf.status,403);
 const file=new FormData();file.append('file',new File(['Çözüm: önce ortak paydayı bul.'],'cozum.txt',{type:'text/plain'}));const uploaded=await call('upload','qa-b',file);
 const q=await call('entries','qa-a',{type:'question',title:'Test sorusu',body:'Nasıl başlayayım?',subject:'Matematik',kind:'Ders desteği',name:'Örnek A'},'POST',201);created.push(q.id);
 const b=await call('entries/'+q.id,'qa-b');assert.equal(b.entry.title,'Test sorusu');assert.equal(b.entry.subject,'Mathematics');
 await call('entries/'+q.id,'qa-b',null,'DELETE',403);
 await call('entries/'+q.id+'/reply','qa-b',{body:'Önce bunu dene.',name:'Örnek B',files:[uploaded.id]});
 const detail=await call('entries/'+q.id,'qa-a');assert.equal(detail.replies.length,1);assert.equal(detail.replies[0].files[0].id,uploaded.id);
 const attachment=await call('files/'+uploaded.id,'qa-a');assert.match(await attachment.text(),/ortak paydayı/);
 await call('entries/'+q.id+'/claim','qa-b',{name:'Örnek B'});await call('entries/'+q.id+'/claim','qa-c',{name:'Örnek C'});assert.equal((await call('entries/'+q.id,'qa-a')).entry.helper_name,'Örnek B');
 await call('entries/'+q.id+'/resolve','qa-b',{reflection:'No'},'POST',403);await call('entries/'+q.id+'/resolve','qa-a',{reflection:'Paydaları eşitlemeyi anladım.'});await call('entries/'+q.id+'/reply','qa-b',{body:'Late'},'POST',400);
 const p=await call('entries','qa-a',{type:'post',kind:'note',title:'Test notu <script>',body:'Not içeriği',subject:'Science',exercise:'Soru?',answer:'Açıklama',name:'Örnek A'},'POST',201);created.push(p.id);
 await call('entries/'+p.id+'/vote','qa-a',{score:5},'POST',400);await call('entries/'+p.id+'/vote','qa-b',{score:5});await call('entries/'+p.id+'/vote','qa-b',{score:3});
 let state=await call('state','qa-b'),post=state.entries.find(x=>x.id===p.id);assert.equal(post.rating.count,1);assert.equal(post.rating.average,3);assert.equal(post.myVote,3);
 await call('entries/'+p.id+'/vote','qa-c',{score:5});state=await call('state','qa-b');assert.equal(state.entries.find(x=>x.id===p.id).rating.average,4);
 await call('entries/'+p.id+'/vote','qa-b',{score:0});assert.equal((await call('state','qa-b')).entries.find(x=>x.id===p.id).rating.count,1);
 await call('entries/'+p.id+'/report','qa-b',{reason:'wrong'});
 await call('entries','qa-b',{type:'post',kind:'video',title:'No transcript',files:[],body:''},'POST',400);
 await call('entries','qa-a',{type:'post',kind:'note',title:'Stolen attachment',body:'Test',files:[uploaded.id]},'POST',400);
 await call('entries/'+q.id,'qa-a',null,'DELETE');created.splice(created.indexOf(q.id),1);await call('files/'+uploaded.id,'qa-b',null,'GET',404);
 console.log('PASS: two identities, shared question/reply/file, claim race, owner-only resolve/delete, auth/CSRF, unique votes/update/remove, report, transcript validation, attachment ownership and delete cleanup.');
}finally{for(const id of created)await call('entries/'+id,'qa-a',null,'DELETE');await proxy.dispose();delete globalThis.__testEnv}
