(()=>{
'use strict';
const flag='yy-demo-active',key='yy-demo-board-v1';let active=false;
try{const query=new URLSearchParams(location.search).get('demo');if(query==='0')sessionStorage.removeItem(flag);else if(query==='1'||document.body.dataset.page==='demo')sessionStorage.setItem(flag,'1');active=sessionStorage.getItem(flag)==='1'}catch{active=new URLSearchParams(location.search).get('demo')==='1'}
if(!active){window.YYDemo={active:false};return}
const me='demo-you',now=Date.now(),hour=3600000;let memory={};
const read=(k,f)=>{try{const s=sessionStorage.getItem(k);return s===null?f:JSON.parse(s)}catch{return memory[k]??f}};
const write=(k,v)=>{memory[k]=v;try{sessionStorage.setItem(k,JSON.stringify(v))}catch{}};
function seed(){
 const people=['Maya','Leo','Amara','Noah','Sofia','You'];
 const lessons=[
 ['Mathematics','How do I compare fractions with different denominators?','I tried comparing 2/3 and 3/5, but the pieces are different sizes. What should I do first?','Use a common denominator: 2/3 = 10/15 and 3/5 = 9/15. Now the pieces match, so 2/3 is larger.'],
 ['Science','Why do seasons change?','Is summer warmer because Earth is closer to the Sun? My diagram seems to disagree.','Earth’s tilted axis changes the angle and length of sunlight during the year. Distance is not the main cause of seasons.'],
 ['English','When should I use the present perfect?','I understand “I finished”, but when would I say “I have finished”?','Use the present perfect to connect a past event to the present: “I have finished, so I can help now.” A finished past time usually calls for the past simple.'],
 ['Mathematics','Where did my negative sign go?','In 3(x − 2) = 12, I wrote 3x − 2 = 12. Which step is wrong?','Distribute the 3 to both terms: 3x − 6 = 12. Then 3x = 18 and x = 6. Check by substituting 6 into the original equation.'],
 ['Science','Can someone check my food-chain explanation?','I wrote that energy cycles through a food chain. Is that the right word?','Matter cycles, but energy flows through a food chain. Some energy is transferred to the surroundings as heat at each step.'],
 ['Social studies','How can I tell whether a source is reliable?','I found two different accounts of the same event. How should I compare them?','Check who created each source, when it was written, what evidence it uses, and its purpose. Compare it with independent accounts.'],
 ['Mathematics','Why is 0.25 the same as one quarter?','I can convert 25/100, but I want to understand the simplification.','Divide numerator and denominator by 25. Both fractions describe the same amount: 25 small hundredths make one quarter.'],
 ['English','A quick way to structure an explanation?','My paragraph has examples but no clear main idea. What could I change?','Start with one clear point, give evidence or an example, and then explain how it supports the point.']
 ];
 const entries=lessons.map(([subject,title,body],i)=>({id:'demo-q'+i,type:'question',owner:i===5?me:'demo-person-'+i,name:people[i%people.length],title,body,subject,kind:'',created:now-(i+1)*hour,resolved:i===1||i===6?1:0,helper:i===0?me:i===1?'demo-peer':null,helper_name:i===0?'You':i===1?'Leo':null,reflection:i===1?'I understand now: the tilt changes how sunlight reaches each hemisphere. Thank you!':i===6?'Simplifying changes the numbers, not the amount. That finally clicked.':'',files:[],rating:{average:0,count:0},myVote:0}));
 const notes=[
 ['Mathematics','Fractions: make the pieces match','For unlike denominators, find a common denominator before comparing. For 2/3 and 3/5, use fifteenths: 10/15 is greater than 9/15.','Which is larger: 3/4 or 2/3?','3/4 = 9/12; 2/3 = 8/12. Therefore 3/4 is larger.','note'],
 ['Science','Seasons in three sentences','Earth’s axis is tilted. Each hemisphere receives different angles and durations of sunlight as Earth orbits the Sun. This explains why their seasons are opposite.','When it is summer in the northern hemisphere, what season is it in the southern hemisphere?','Winter. The southern hemisphere is tilted away from the Sun.','note'],
 ['English','A paragraph that explains, not just lists','Try point → example → explanation. Read your final sentence and ask: did I explain why the example matters?','','','tip'],
 ['Mathematics','Distribute before you simplify','Multiply every term inside the brackets. Example: 4(x + 3) = 4x + 12. Use a substitution to check your work.','Expand 2(3x − 4).','6x − 8. Both terms are multiplied by 2.','note'],
 ['Science','Matter cycles. Energy flows.','Follow one food chain and draw arrows for the energy transfers. At each stage, some energy moves to the surroundings as heat.','','','note'],
 ['Other','My 25-minute study routine','Choose one small goal. Keep a question list beside you. Work for 25 minutes, then take a real break. Share the question you could not answer.','','','tip']
 ];
 notes.forEach(([subject,title,body,exercise,answer,kind],i)=>entries.push({id:'demo-p'+i,type:'post',owner:i===4?me:'demo-writer-'+i,name:i===4?'You':people[i%5],title,body,subject,kind,exercise,answer,source:'Original sample study note',created:now-(i+2)*hour,files:[],resolved:0,baseAverage:[4.8,4.6,4.9,4.5,4.7,4.4][i],baseCount:[12,8,16,6,10,7][i],rating:{average:[4.8,4.6,4.9,4.5,4.7,4.4][i],count:[12,8,16,6,10,7][i]},myVote:0}));
 const files={};const file={id:'demo-fractions-file',name:'fractions-worked-example.txt',size:174,type:'text/plain',url:'data:text/plain;charset=utf-8,'+encodeURIComponent('Worked example: compare 2/3 and 3/5.\n2/3 = 10/15\n3/5 = 9/15\n10/15 > 9/15, so 2/3 > 3/5.\nTry 3/4 and 2/3 next.\nSample learning material.')};files[file.id]=file;
 const replies={};lessons.forEach((lesson,i)=>{replies['demo-q'+i]=[{id:'demo-r'+i,owner:i===0?me:'demo-peer',name:i===0?'You':people[(i+1)%5],body:lesson[3],created:now-i*hour,files:i===0?[file]:[]}];if(i===0)replies['demo-q0'].push({id:'demo-r-followup',name:'Maya',body:'That makes sense. I was comparing pieces with different sizes. I will try the practice question.',created:now-hour/3,files:[]})});
 return {me,entries,replies,files};
}
let state=read(key,null);if(!state||!Array.isArray(state.entries)){state=seed();write(key,state)}
const initial={ 'yy-name':'You','yy-offline-notes':state.entries.filter(e=>e.type==='post').slice(0,3),'yy-goal':'Understand fractions with different denominators','yy-focus-history':[25,25,15].map((minutes,i)=>({id:'demo-session-'+i,minutes,time:now-(i+1)*hour,goal:['Compare fractions','Review science notes','Practice one paragraph'][i]}))};
for(const[k,v]of Object.entries(initial))if(read('sandbox:'+k,null)===null)write('sandbox:'+k,v);
const save=()=>write(key,state),reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
 const path=url.pathname.slice(5).split('/'),method=options.method||'GET';let body={};try{if(typeof options.body==='string')body=JSON.parse(options.body)}catch{return reply({error:'Invalid demo request.'},400)}
 if(path[0]==='state')return reply({me,entries:state.entries});
 if(path[0]==='upload'&&method==='POST'){const f=options.body.get('file');if(!f||f.size>25*1024*1024)return reply({error:'Choose a file up to 25 MB.'},400);const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f)});const meta={id:crypto.randomUUID(),name:f.name,type:f.type||'application/octet-stream',size:f.size,url:data};state.files[meta.id]=meta;save();return reply(meta)}
 if(path[0]==='files'){const f=state.files[path[1]];if(method==='DELETE'){delete state.files[path[1]];save();return reply({ok:true})}return f?nativeFetch(f.url):reply({error:'Sample file not found.'},404)}
 if(path[0]!=='entries')return reply({error:'Demo action not available.'},404);
 if(!path[1]&&method==='POST'){if(!body.title?.trim())return reply({error:'A title is required.'},400);if(!body.body?.trim()&&!body.files?.length)return reply({error:'Add an explanation or document.'},400);const entry={...body,id:crypto.randomUUID(),owner:me,name:body.name||'You',created:Date.now(),files:(body.files||[]).map(id=>state.files[id]).filter(Boolean),resolved:0,rating:{average:0,count:0},myVote:0};state.entries.unshift(entry);save();return reply({id:entry.id},201)}
 const entry=state.entries.find(e=>e.id===path[1]);if(!entry)return reply({error:'Sample post not found.'},404);
 const action=path[2];if(method==='GET')return reply({me,entry,replies:state.replies[entry.id]||[]});
 if(method==='DELETE'){if(entry.owner!==me)return reply({error:'You can only delete your own demo post.'},403);state.entries=state.entries.filter(e=>e.id!==entry.id);delete state.replies[entry.id];save();return reply({ok:true})}
 if(action==='reply'){if(entry.resolved)return reply({error:'This question is resolved.'},400);if(!body.body?.trim()&&!body.files?.length)return reply({error:'Add an explanation or document.'},400);(state.replies[entry.id]??=[]).push({id:crypto.randomUUID(),owner:me,name:body.name||'You',body:body.body,created:Date.now(),files:(body.files||[]).map(id=>state.files[id]).filter(Boolean)})}
 else if(action==='claim'){if(body.release&&entry.helper===me){entry.helper=null;entry.helper_name=null}else if(!entry.helper&&!entry.resolved){entry.helper=me;entry.helper_name=body.name||'You'}}
 else if(action==='resolve'){if(entry.owner!==me)return reply({error:'Only the question author can resolve it.'},403);entry.resolved=body.reopen?0:1;entry.reflection=body.reflection||''}
 else if(action==='vote'){if(entry.owner===me)return reply({error:'You cannot rate your own post.'},400);const score=Number(body.score);if(!Number.isInteger(score)||score<0||score>5)return reply({error:'Choose a rating from 1 to 5.'},400);entry.myVote=score;const count=entry.baseCount||0;entry.rating={count:count+(score?1:0),average:(count*(entry.baseAverage||0)+score)/(count+(score?1:0)||1)}}
 else if(action!=='report')return reply({error:'Demo action not available.'},404);
 save();return reply({ok:true});
};
window.YYDemo={active:true,read:(k,f)=>read('sandbox:'+k,f),write:(k,v)=>{write('sandbox:'+k,v);return true},fileUrl:f=>state.files[f.id]?.url||'#',reset:()=>{try{for(const k of Object.keys(sessionStorage))if(k===key||k.startsWith('sandbox:'))sessionStorage.removeItem(k)}catch{}location.href='/?demo=1'}};
if(document.body.dataset.page==='demo')location.replace('/?demo=1');
})();
