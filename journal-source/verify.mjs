import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import config from './site.config.mjs';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const errors=[];let pages=0,links=0;
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})) {const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(entry.name.endsWith('.html'))await inspect(full);}}
async function inspect(file){
  pages++;
  const html=await fs.readFile(file,'utf8');
  for(const [name,re] of [['title',/<title>.+?<\/title>/],['description',/<meta name="description" content="[^"]+"/],['canonical',/<link rel="canonical"/],['main',/<main id="main">/],['lang',/<html lang="ko">/]]) if(!re.test(html))errors.push(`${file}: missing ${name}`);
  if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: expected one h1`);
  const adScripts=[...html.matchAll(/<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=([^"]+)" crossorigin="anonymous"><\/script>/g)];
  if(adScripts.length!==1 || adScripts[0][1]!==config.adsense.publisher)errors.push(`${file}: expected one AdSense script with the configured publisher`);
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(#[^"]+)?"/g)){
    links++;const ref=match[1];const target=path.join(root,ref,ref.endsWith('/')?'index.html':'');
    try{await fs.access(target);}catch{errors.push(`${file}: broken local link ${ref}`);}
    if(match[2]){const body=await fs.readFile(target,'utf8').catch(()=> '');if(!body.includes(`id="${match[2].slice(1)}"`))errors.push(`Broken fragment: ${ref}${match[2]}`);}
  }
  for(const match of html.matchAll(/href="#([^"]+)"/g))if(!html.includes(`id="${match[1]}"`))errors.push(`Broken fragment: ${file}#${match[1]}`);
  for(const match of html.matchAll(/<a[^>]+target="_blank"[^>]*>/g)) if(!match[0].includes('noopener')) errors.push(`${file}: unsafe external link`);
}
await walk(root);
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
if(!sitemap.includes(config.origin))errors.push('Sitemap origin mismatch');
if((await fs.readFile(path.join(root,'CNAME'),'utf8')).trim()!==new URL(config.origin).hostname)errors.push('CNAME mismatch');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`PASS: ${pages} HTML documents, ${links} internal links/assets, headings, fragments, metadata, sitemap and AdSense script.`);
