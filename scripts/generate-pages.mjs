import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const names=['index','focus','help','request','my','share','library','about','demo'];
const assets=['demo-mode.js','app.js','shared.js','interface.js','quotes.js','focus-room.js','demo.js','style.css','focus.css'];
const target=new URL('../public/assets/',import.meta.url);
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
const versions=new Map();
for(const name of assets){const content=await readFile(new URL('../public/'+name,import.meta.url));const hash=createHash('sha256').update(content).digest('hex').slice(0,12);const dot=name.lastIndexOf('.');const versioned=name.slice(0,dot)+'.'+hash+name.slice(dot);await writeFile(new URL(versioned,target),content);versions.set(name,'/assets/'+versioned)}
const pages=Object.fromEntries(await Promise.all(names.map(async name=>{
 const path=new URL('../public/'+name+'.html',import.meta.url);let html=await readFile(path,'utf8');
 html=html.replace(/(src|href)="(?:\/assets\/)?([\w-]+)(?:\.[a-f0-9]{12})?\.(js|css)"/g,(match,attr,base,ext)=>versions.has(base+'.'+ext)?attr+'="'+versions.get(base+'.'+ext)+'"':match);
 await writeFile(path,html);return[name,html];
})));
pages.notfound='<!doctype html><html lang="en"><meta charset="utf-8"><title>Learnivelle</title><h1>This page could not be found.</h1><a href="/">Back to home</a></html>';
await writeFile(new URL('../app/site-pages.ts',import.meta.url),'export const pages:Record<string,string>='+JSON.stringify(pages)+';\n');
