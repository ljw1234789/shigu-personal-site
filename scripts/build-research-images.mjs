import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('/Users/ljw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const work='/Users/ljw/Documents/Codex/个人网站预览/20261103-research';
const tasks=JSON.parse(await fs.readFile(work+'/image-tasks.json','utf8'));
sharp.concurrency(1);
let next=0,done=0,bytes=0;const errors=[];
async function worker(){
  for(;;){
    const index=next++;if(index>=tasks.length)return;const t=tasks[index];
    try{try{await fs.access(t.target);}catch{await sharp(t.source).webp({quality:82,effort:2}).toFile(t.target);}bytes+=(await fs.stat(t.target)).size;}
    catch(error){errors.push({source:t.source,message:error.message});}
    done++;if(done%1000===0)process.stdout.write(JSON.stringify({done,total:tasks.length})+'\n');
  }
}
await Promise.all(Array.from({length:4},worker));
await fs.writeFile(work+'/image-build.json',JSON.stringify({done,total:tasks.length,bytes,errors}));
if(errors.length)throw Error(errors.length+' research images failed to build');
