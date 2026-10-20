// Validate original bytes and actual browser decoding on the existing GNN article.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8080';
const article='/Wiki/20-数据科学/Algorithm/04-图学习/03_图深度学习/test.html';
(async()=>{
 const m=JSON.parse(await fs.readFile('assets/provenance/gnn-images.json','utf8'));
 assert.equal(m.files.length,38);
 for(const f of m.files){const r=await fetch(origin+'/'+f.path);assert.equal(r.status,200,f.path);const b=Buffer.from(await r.arrayBuffer());assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256,f.path);}
 const results=[];await fs.mkdir('rendering-evidence',{recursive:true});
 for(const [name,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  for(const width of [390,1366])for(const colorScheme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:900},colorScheme});const page=await context.newPage();
   await page.goto(origin+article);const imgs=page.locator('img[src^="/home/liuyuhang/"]');assert.equal(await imgs.count(),38);
   for(let i=0;i<await imgs.count();i++){const img=imgs.nth(i);await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.evaluate(e=>e.naturalWidth>0&&e.naturalHeight>0));}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow');
   await imgs.first().scrollIntoViewIfNeeded();await page.screenshot({path:`rendering-evidence/gnn-${name}-${width}-${colorScheme}.png`});
   results.push({browser:name,width,colorScheme,decoded:await imgs.count(),passed:true});await context.close();
  }await browser.close();
 }
 await fs.writeFile('rendering-evidence/gnn-results.json',JSON.stringify({origin,verifiedOriginalFiles:38,results},null,2));console.log('GNN_IMAGE_RESULTS '+JSON.stringify({origin,verifiedOriginalFiles:38,results}));
})().catch(e=>{console.error(e);process.exit(1);});
