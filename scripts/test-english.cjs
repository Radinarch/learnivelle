const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const errors=[],doms=[];
const question={id:'q1',type:'question',owner:'other',name:'Sample learner',title:'Comparing fractions',body:'Which numerator should I compare?',subject:'Matematik',kind:'',created:Date.UTC(2026,9,26),files:[{id:'f1',name:'attempt.pdf',size:1024,type:'application/pdf'}],resolved:0,helper:null,reflection:''};
const post={...question,id:'p1',type:'post',kind:'note',title:'Equal denominators',body:'Compare the numerators.',exercise:'Which is larger: 3/7 or 5/7?',answer:'5/7 because five parts is more than three.',rating:{average:4,count:1},myVote:0,source:'My own notes'};
async function open(page,{entry=question,me='me',storage={},fail=false}={}){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation \(except hash/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('public/'+page+'.html','utf8'),{url:'https://test.local/'+page+(page==='request'?'?id='+entry.id:''),runScripts:'outside-only',virtualConsole:vc});doms.push(dom);
 const w=dom.window;w.confirm=()=>false;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);
 w.fetch=async url=>{if(fail)throw Error('Network unavailable.');return{ok:true,json:async()=>url.endsWith('/state')?{me,entries:[question,post]}:url.includes('/entries/')?{me,entry,replies:[]}:{ok:true}}};
 for(const file of ['app.js','shared.js','interface.js',...(page==='focus'?['quotes.js','focus-room.js']:page==='demo'?['demo.js']:[])])w.eval(fs.readFileSync('public/'+file,'utf8'));
 await new Promise(r=>setTimeout(r,25));return {w,d:w.document};
}
function check(d){assert.equal(d.documentElement.lang,'en');const copy=[d.title,d.body.textContent,...[...d.querySelectorAll('[aria-label],[placeholder]')].flatMap(e=>[e.getAttribute('aria-label')||'',e.getAttribute('placeholder')||''])].join('\n');assert.doesNotMatch(copy,/[çğıöşüÇĞİÖŞÜ]|\b(?:Matematik|Tümü|Hazır|Dersler)\b/);assert(d.querySelector('.release-label').textContent.includes('English edition'));}
(async()=>{
 try{
  for(const page of ['index','help','share','library','my','about','focus','demo']){const {w,d}=await open(page);check(d);
   if(page==='help'||page==='share'){d.getElementById('openEntry').click();assert(!d.getElementById('entryForm').hidden);check(d);const subjects=[...d.querySelector('[name="subject"]').options].map(o=>o.text);assert(subjects.includes('Mathematics'));assert(subjects.includes('English'));const filter=d.getElementById('subjectCloud');filter.value='Mathematics';filter.dispatchEvent(new w.Event('change'));assert.match(d.getElementById('cloudFeed').textContent,/fractions|denominators/);
    if(page==='share'){const kind=d.getElementById('kind');kind.value='video';kind.dispatchEvent(new w.Event('change'));assert.equal(d.getElementById('bodyLabel').textContent,'Video explanation as text (required)');assert(d.getElementById('entryForm').elements.body.required);check(d);}}
   if(page==='focus'){d.getElementById('startTimer').click();assert.equal(d.getElementById('timerStatus').textContent,'In focus');assert.equal(d.getElementById('startTimer').textContent,'Pause');const started=w.Date.now();w.Date.now=()=>started+2000;d.getElementById('startTimer').click();assert.equal(d.getElementById('startTimer').textContent,'Resume');d.querySelector('[data-mode="break"]').click();assert.equal(d.getElementById('phaseLabel').textContent,'Short break');d.getElementById('nextQuote').click();d.getElementById('authorFilter').value='Epictetus';d.getElementById('authorFilter').dispatchEvent(new w.Event('change'));assert.equal(d.getElementById('quoteAuthor').textContent,'Epictetus');check(d);}
   if(page==='demo'){for(let n=0;n<5;n++){check(d);d.getElementById('demoNext').click();}}
  }
  for(const options of [{},{me:question.owner},{entry:{...question,resolved:1}},{entry:post},{me:null}]){const {d}=await open('request',options);check(d);assert.match(d.querySelector('#main').textContent,/Mathematics/);}
  const {d:failure}=await open('help',{fail:true});check(failure);assert.match(failure.querySelector('#main').textContent,/Could not connect/);
  const {d:guest}=await open('share',{me:null});check(guest);assert.match(guest.body.textContent,/sign in/);
  const saved=[{...post,id:'yanyana-example-fractions',title:'Ancien exemple',subject:'Matematik'}];
  const {d:library}=await open('library',{storage:{'yy-offline-notes':JSON.stringify(saved)}});check(library);assert.match(library.querySelector('#main').textContent,/Comparing fractions/);
  assert.deepEqual(errors,[]);console.log('PASS: English across all nine pages, guest/error states, forms, video transcript, legacy subject filters, saved example, timer controls and all walkthrough steps.');
 }finally{doms.forEach(dom=>dom.window.close())}
})().catch(e=>{console.error(e);process.exit(1)});
