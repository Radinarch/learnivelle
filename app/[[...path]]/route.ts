import { api } from '../api-service';
import { pages } from '../site-pages';
export const dynamic='force-dynamic';
async function route(request:Request){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return api(request);if(request.method!=='GET')return new Response('Method not allowed',{status:405});const key=url.pathname.replace(/^\//,'').replace(/\.html$/,'')||'index';const html=pages[key];return new Response(html||pages.notfound,{status:html?200:404,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'private, no-store, must-revalidate'}})}
export const GET=route;export const POST=route;export const DELETE=route;
