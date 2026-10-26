import {env} from 'cloudflare:workers';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message:string,status=400)=>{throw Object.assign(new Error(message),{status})};
const clean=(s:unknown,max:number)=>typeof s==='string'?s.trim().slice(0,max):'';
const subjects=['Mathematics','Science','Turkish','English','Social studies','Other'];
const subjectAliases:Record<string,string>={'Matematik':'Mathematics','Fen':'Science','T\u00fcrk\u00e7e':'Turkish','\u0130ngilizce':'English','Sosyal':'Social studies','Di\u011fer':'Other'};
const subjectLabel=(s:string)=>subjectAliases[s]||s||'Other';
const uid=()=>crypto.randomUUID();
async function identity(request:Request){const raw=request.headers.get('oai-authenticated-user-id');if(!raw)return null;const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
export async function api(request:Request){try{
 const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean).slice(1),method=request.method,db=env.DB,bucket=env.BUCKET;
 if(!db||!bucket)return json({error:'The shared board is unavailable. Please try again shortly.'},503);
 const me=await identity(request);
 if(method!=='GET'){
  if(!me)return json({error:'Sign in to post.'},401);
  if(request.headers.get('Origin')!==url.origin)return json({error:'Could not verify the request.'},403);
 }
 if(parts[0]==='state'&&method==='GET'){
  const rows=await db.prepare('SELECT * FROM entries ORDER BY created DESC LIMIT 250').all();
  const scores=await db.prepare('SELECT entry_id, AVG(score) average, COUNT(*) count FROM votes GROUP BY entry_id').all();
  const myVotes=me?(await db.prepare('SELECT entry_id,score FROM votes WHERE owner=?').bind(me).all()).results:[];
  return json({me,entries:rows.results.map((r:any)=>({...r,subject:subjectLabel(r.subject),files:JSON.parse(r.files),rating:scores.results.find((s:any)=>s.entry_id===r.id)||{average:0,count:0},myVote:myVotes.find((s:any)=>s.entry_id===r.id)?.score||0}))});
 }
 if(parts[0]==='upload'&&method==='POST'){
  const recent:any=await db.prepare('SELECT COUNT(*) n FROM uploads WHERE owner=? AND created>?').bind(me,Date.now()-86400000).first();if(recent.n>=60)fail('You have reached today’s upload limit. Please try again tomorrow.',429);
  const length=Number(request.headers.get('Content-Length'));if(length>26*1024*1024)fail('Files can be up to 25 MB.',413);
  const form=await request.formData(),file=form.get('file');if(!file||typeof file==='string')fail('Choose a file.');
  const f=file as File,ext=f.name.split('.').pop()?.toLowerCase(),video=['mp4','webm'].includes(ext||'');
  const mimes:Record<string,string>={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',txt:'text/plain',csv:'text/csv',mp4:'video/mp4',webm:'video/webm'};
  if(!ext||!(/^(pdf|png|jpe?g|webp|gif|txt|csv|docx?|pptx?|xlsx?|odt|mp4|webm)$/).test(ext))fail('Choose a PDF, image, text file, Office document or MP4/WebM.');
  if(!f.size||f.size>(video?25:10)*1024*1024)fail(video?'Videos can be up to 25 MB.':'Documents can be up to 10 MB.');
  const id=uid(),mime=mimes[ext]||'application/octet-stream',name=clean(f.name,180),created=Date.now();
  await bucket.put(id,await f.arrayBuffer(),{httpMetadata:{contentType:mime}});
  try{await db.prepare('INSERT INTO uploads(id,owner,name,mime,size,created) VALUES(?,?,?,?,?,?)').bind(id,me,name,mime,f.size,created).run()}catch(e){await bucket.delete(id);throw e}
  return json({id,name,size:f.size,type:mime});
 }
 if(parts[0]==='files'&&parts[1]){
  const f:any=await db.prepare('SELECT * FROM uploads WHERE id=?').bind(parts[1]).first();if(!f)fail('File not found.',404);
  if(method==='DELETE'){if(f.owner!==me||f.entry_id)fail('This file cannot be deleted.',403);await bucket.delete(f.id);await db.prepare('DELETE FROM uploads WHERE id=?').bind(f.id).run();return json({ok:true})}
  if(method==='GET'){
   if(!f.entry_id&&f.owner!==me)fail('File not found.',404);
   const object=await bucket.get(f.id);if(!object)fail('File not found.',404);
   const inline=/^(image\/|video\/|application\/pdf|text\/plain)/.test(f.mime)&&url.searchParams.get('download')!=='1';
   const headers=new Headers({'Content-Type':f.mime,'Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=300'});
   return new Response(object.body,{headers});
  }
 }
 if(parts[0]!=='entries')fail('Page not found.',404);
 async function parse(){if(Number(request.headers.get('Content-Length'))>20000)fail('The content is too long.',413);return await request.json() as any}
 async function attachments(ids:unknown){if(!Array.isArray(ids)||ids.length>3)fail('Choose up to 3 attachments.');const result=[];for(const id of ids){if(typeof id!=='string')fail('Invalid attachment.');const f:any=await db.prepare('SELECT * FROM uploads WHERE id=? AND owner=? AND entry_id IS NULL').bind(id,me).first();if(!f)fail('This file belongs to another account or is already attached.');result.push({id:f.id,name:f.name,size:f.size,type:f.mime})}return result}
 if(!parts[1]&&method==='POST'){
  const b=await parse(),type=b.type==='question'?'question':b.type==='post'?'post':null,title=clean(b.title,100),body=clean(b.body,3000),name=clean(b.name,24)||'Student',kind=clean(b.kind,30),subject=subjects.includes(subjectLabel(b.subject))?subjectLabel(b.subject):'Other';if(!type||!title)fail('A title is required.');
  if(type==='post'&&!['note','tip','video'].includes(kind))fail('Choose a content type.');
  const files=await attachments(b.files||[]);if(!body&&!files.length)fail('Add an explanation or a document.');
  if(type==='post'&&kind==='video'&&(!body||files.length!==1||!files[0].type.startsWith('video/')))fail('Add one video and a readable text explanation.');
  if(kind!=='video'&&files.some(f=>f.type.startsWith('video/')))fail('Choose the video post type to share a video.');
  const count:any=await db.prepare('SELECT COUNT(*) n FROM entries WHERE owner=? AND created>?').bind(me,Date.now()-86400000).first();if(count.n>=40)fail('You have reached today’s posting limit.',429);
  const id=uid(),now=Date.now(),source=clean(b.source,300),exercise=clean(b.exercise,500),answer=clean(b.answer,1000);
  if(!!exercise!==!!answer)fail('Add both the practice prompt and its answer.');
  await db.batch([db.prepare('INSERT INTO entries(id,type,owner,name,title,body,subject,kind,files,source,exercise,answer,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,type,me,name,title,body,subject,kind,JSON.stringify(files),source,exercise,answer,now),...files.map(f=>db.prepare('UPDATE uploads SET entry_id=? WHERE id=? AND owner=? AND entry_id IS NULL').bind(id,f.id,me))]);return json({id},201);
 }
 const id=parts[1],entry:any=await db.prepare('SELECT * FROM entries WHERE id=?').bind(id).first();if(!entry)fail('Post not found.',404);
 if(method==='GET'&&!parts[2]){const replies=await db.prepare('SELECT * FROM replies WHERE entry_id=? ORDER BY created').bind(id).all();return json({entry:{...entry,subject:subjectLabel(entry.subject),files:JSON.parse(entry.files)},replies:replies.results.map((r:any)=>({...r,files:JSON.parse(r.files)})),me})}
 if(method==='DELETE'&&!parts[2]){
  if(entry.owner!==me)fail('You can only delete your own post.',403);
  const files=await db.prepare('SELECT id FROM uploads WHERE entry_id=?').bind(id).all();
  await db.batch([db.prepare('DELETE FROM replies WHERE entry_id=?').bind(id),db.prepare('DELETE FROM votes WHERE entry_id=?').bind(id),db.prepare('DELETE FROM reports WHERE entry_id=?').bind(id),db.prepare('DELETE FROM uploads WHERE entry_id=?').bind(id),db.prepare('DELETE FROM entries WHERE id=? AND owner=?').bind(id,me)]);
  if(files.results.length)await bucket.delete(files.results.map((f:any)=>f.id));return json({ok:true});
 }
 const action=parts[2];
 if(action==='vote'&&method==='POST'){
  if(entry.type!=='post'||entry.owner===me)fail('You cannot rate your own post.');const b=await parse();if(b.score===0)await db.prepare('DELETE FROM votes WHERE entry_id=? AND owner=?').bind(id,me).run();else{if(!Number.isInteger(b.score)||b.score<1||b.score>5)fail('Choose a rating from 1 to 5.');await db.prepare('INSERT INTO votes(entry_id,owner,score) VALUES(?,?,?) ON CONFLICT(entry_id,owner) DO UPDATE SET score=excluded.score').bind(id,me,b.score).run()}return json({ok:true});
 }
 if(action==='reply'&&method==='POST'){
  if(entry.resolved)fail('This question is resolved.');const b=await parse(),body=clean(b.body,3000),files=await attachments(b.files||[]);if(!body&&!files.length)fail('Add an explanation or a document.');if(files.some(f=>f.type.startsWith('video/')))fail('Attach a document or image to your reply.');
  await db.batch([db.prepare('INSERT INTO replies(id,entry_id,owner,name,body,files,created) VALUES(?,?,?,?,?,?,?)').bind(uid(),id,me,clean(b.name,24)||'Student',body,JSON.stringify(files),Date.now()),...files.map(f=>db.prepare('UPDATE uploads SET entry_id=? WHERE id=? AND owner=?').bind(id,f.id,me))]);return json({ok:true});
 }
 if(action==='claim'&&method==='POST'){const b=await parse();if(b.release)await db.prepare('UPDATE entries SET helper=NULL,helper_name=NULL WHERE id=? AND helper=?').bind(id,me).run();else await db.prepare('UPDATE entries SET helper=?,helper_name=? WHERE id=? AND helper IS NULL AND resolved=0').bind(me,clean(b.name,24)||'Student',id).run();return json({ok:true})}
 if(action==='resolve'&&method==='POST'){if(entry.owner!==me)fail('Only the question author can resolve it.',403);const b=await parse();await db.prepare('UPDATE entries SET resolved=?,reflection=? WHERE id=? AND owner=?').bind(b.reopen?0:1,clean(b.reflection,500),id,me).run();return json({ok:true})}
 if(action==='report'&&method==='POST'){const b=await parse();if(!['wrong','unsafe','copyright'].includes(b.reason))fail('Choose a reason.');await db.prepare('INSERT INTO reports(entry_id,owner,reason,created) VALUES(?,?,?,?) ON CONFLICT(entry_id,owner) DO UPDATE SET reason=excluded.reason,created=excluded.created').bind(id,me,b.reason,Date.now()).run();return json({ok:true})}
 fail('Action not found.',404);
 }catch(e:any){if(!e.status)console.error('YanYana API',e.message);return json({error:e.status?e.message:'Could not complete that action. Please try again shortly.'},e.status||500)}}
