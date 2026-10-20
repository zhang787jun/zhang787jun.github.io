const {chromium,webkit}=require('playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8080';
const article='/Wiki/10-计算机科学/02-Programming_Language/Python/python高性能编程/03-并行运算策略.html';
const results=[];const out='rendering-evidence';
async function overflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow');}
async function shot(page,name){await page.screenshot({path:`${out}/${name}.png`,fullPage:true});}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 for(const [name,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch(name==='chromium'?{args:['--enable-unsafe-webgpu','--use-angle=swiftshader','--enable-features=Vulkan','--use-vulkan=swiftshader','--disable-vulkan-surface']}:{});
  for(const width of [320,390,768,1366])for(const scheme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:900},colorScheme:scheme});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const c={browser:name,width,scheme,modes:[]};results.push(c);
   try{
    await page.goto(origin);await page.locator('.rendering-note').scrollIntoViewIfNeeded();
    const stage=page.locator('.rendering-stage');
    for(const mode of ['map','paper','light']){
     await page.locator(`[data-render-mode="${mode}"]`).click();
     await page.waitForFunction(()=>{const s=document.querySelector('.rendering-stage');return s.dataset.ready||document.querySelector('.rendering-status').textContent.includes('暂不可用');},{},{timeout:60000});
     const backend=await stage.getAttribute('data-backend');
     if(mode==='map')assert.equal(backend,'canvas2d');
     // WebKit in Linux CI may not expose GPU; record fallback explicitly.
     if(name==='chromium')assert(backend,`${mode} failed: ${await page.locator('.rendering-status').textContent()}`);
     if(backend){const pixels=await page.locator('.rendering-stage canvas').screenshot();assert(pixels.length>1200,'empty canvas screenshot');}
     c.modes.push({mode,backend:backend||'static-fallback'});await overflow(page);await shot(page,`${name}-${width}-${scheme}-${mode}`);
    }
    await page.locator('[data-render-mode="map"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.rendering-stage').dataset.backend==='canvas2d');
    await page.locator('[data-theme-toggle]').click();await overflow(page);
    await page.goto(origin+article);await page.waitForSelector('.pele-diagram[data-renderer="pele"] svg');await page.locator('.pele-diagram').scrollIntoViewIfNeeded();
    assert((await page.locator('.pele-chart').textContent()).includes('主进程'));await overflow(page);
    const summary=page.locator('.pele-diagram summary');await summary.focus();await page.keyboard.press('Enter');assert(await page.locator('.pele-diagram details').evaluate(e=>e.open));assert((await page.locator('.pele-diagram pre').textContent()).includes('A-->B'));
    await shot(page,`${name}-${width}-${scheme}-pele`);assert.deepEqual(errors,[]);c.passed=true;
   }catch(e){c.error=e.stack;await shot(page,`${name}-${width}-${scheme}-failure`);}
   await context.close();
  }
  // Failed optional modules must leave the source/static content usable.
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await context.newPage();
  await p.route('**/paper.js',r=>r.abort());await p.goto(origin);await p.locator('[data-render-mode="paper"]').click();await p.waitForFunction(()=>document.querySelector('.rendering-status').textContent.includes('暂不可用'));
  assert(await p.locator('.rendering-fallback').isVisible());await p.locator('[data-render-mode="map"]').click();await p.waitForFunction(()=>document.querySelector('.rendering-stage').dataset.backend==='canvas2d');
  await p.route('**/vendor/pele/pele.js',r=>r.abort());await p.goto(origin+article);assert((await p.locator('body').innerText()).includes('A-->B'));assert.equal(await p.locator('.pele-diagram').count(),0);results.push({browser:name,failureRecovery:true,reducedMotion:true,passed:true});
  await context.close();
  if(name==='chromium'){
   const fallback=await browser.newContext();await fallback.addInitScript(()=>Object.defineProperty(navigator,'gpu',{value:undefined}));const p=await fallback.newPage();await p.goto(origin);await p.locator('[data-render-mode="paper"]').click();await p.waitForFunction(()=>document.querySelector('.rendering-stage').dataset.ready);const backend=await p.locator('.rendering-stage').getAttribute('data-backend');assert.equal(backend,'webgl2-tsl');results.push({forcedFallback:backend,passed:true});await fallback.close();
  }
  await browser.close();
 }
 await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log('RESULTS',JSON.stringify(results));if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(async e=>{await fs.writeFile(`${out}/results.json`,JSON.stringify({results,fatal:e.stack},null,2));console.error(e);process.exitCode=1;});
