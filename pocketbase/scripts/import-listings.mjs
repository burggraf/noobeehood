import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../../web/package.json',import.meta.url));
const PocketBase=require('pocketbase');
const root=new URL('../',import.meta.url);
const file=new URL('seeds/manta-manabi-listings.json',root);
const result=spawnSync('python3',[new URL('scripts/validate-seeds.py',root)],{encoding:'utf8'});
if(result.status) { process.stderr.write(result.stderr||result.stdout); process.exit(result.status||1); }
const data=JSON.parse(await readFile(file,'utf8'));
const url=process.env.PUBLIC_POCKETBASE_URL?.trim(); const email=process.env.PB_SUPERUSER_EMAIL?.trim(); const password=process.env.PB_SUPERUSER_PASSWORD;
if(!url||!email||!password) { console.error('PUBLIC_POCKETBASE_URL, PB_SUPERUSER_EMAIL, and PB_SUPERUSER_PASSWORD are required'); process.exit(1); }
const pb=new PocketBase(url); await pb.collection('_superusers').authWithPassword(email,password);
const esc=s=>`'${s.replaceAll('\\','\\\\').replaceAll("'","\\'")}'`;
const hive=await pb.collection('hives').getFirstListItem(`slug = ${esc(data.hive_slug)} && status = 'active'`);
for(const listing of data.listings){
 const payload={...listing,hive:hive.id,status:'published'}; delete payload.registration_url;
 const matches=await pb.collection('listings').getList(1,2,{filter:`hive = ${esc(hive.id)} && slug = ${esc(listing.slug)}`});
 if(matches.items.length>1) throw new Error(`duplicate existing slug ${listing.slug}`);
 if(matches.items.length===1){
  const current=matches.items[0]; const same=Object.keys(payload).every(k=>current[k]===payload[k]);
  if(same) console.log(`skip ${listing.slug}`); else { await pb.collection('listings').update(current.id,payload); console.log(`update ${listing.slug}`); }
 } else { await pb.collection('listings').create(payload); console.log(`create ${listing.slug}`); }
}
const publicClient=new PocketBase(url);
const visible=await publicClient.collection('listings').getList(1,100,{filter:`hive = ${esc(hive.id)} && status = 'published'`});
if(visible.items.length < data.listings.length) throw new Error('public acceptance check failed');
for(const c of data.search_cases){
 const terms=c.query.toLowerCase().split(/\\s+/).map(esc);
 const hits=visible.items.filter(x=>terms.every(t=>(`${x.name} ${x.search_terms||''}`).toLowerCase().includes(t.slice(1,-1)))).map(x=>x.slug);
 if(hits.join(',')!==c.expected_slugs.join(',')) throw new Error(`search acceptance failed: ${c.query}`);
}
console.log(`imported ${data.listings.length} listings; public acceptance passed`);
