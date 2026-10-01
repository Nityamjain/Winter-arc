const {JSDOM}=require('jsdom'),fs=require('fs'),R='/home/claude/winter-arc/';
const html=fs.readFileSync(R+'index.html','utf8').replace(/<script src="[^"]+"><\/script>/g,'');
const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost/',pretendToBeVisual:true});
const w=dom.window; w.matchMedia=()=>({matches:true,addEventListener(){}});
for(const f of ['core.js','data/quotes.js','app.js']) w.eval(fs.readFileSync(R+f,'utf8'));
const $=s=>w.document.querySelector(s),ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
ok($('#main').textContent.includes('Start my Winter Arc'),'setup shown first');
$('#as').value='2026-09-28';$('#as').dispatchEvent(new w.Event('input',{bubbles:true}));
ok($('#ae').value==='2026-12-26','end auto = start+89');
$('#ae').value='2026-09-01';$('#arcForm').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
ok($('#arcErr').textContent.includes('after'),'invalid dates rejected');
$('#ae').value='2026-12-26';$('#arcForm').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
ok($('#main').textContent.includes('/90'),'home after setup');
const card=()=>$('.card');card().click();
ok(card().classList.contains('done')&&$('.ringTxt b').textContent==='25%','toggle -> 25%');
const saved=JSON.parse(w.localStorage.getItem('winterArc.v1'));
const d=Object.keys(saved.completions)[0];ok(Object.keys(saved.completions[d]).length===1,'persisted');
const bk=JSON.stringify(saved);
w.document.querySelector('[data-act=reset]')||w.document.querySelector('[data-v=settings]').click();
$('[data-act=reset]').click();$('[data-act=yes]').click();
setTimeout(()=>{
ok(!w.localStorage.getItem('winterArc.v1')&&$('#main').textContent.includes('Start my'),'reset -> setup');
// import via file
const file=new w.File([bk],'b.json',{type:'application/json'});
const inp=$('#file');Object.defineProperty(inp,'files',{value:[file],configurable:true});inp.dispatchEvent(new w.Event('change',{bubbles:true}));
setTimeout(()=>{$('[data-act=yes]').click();setTimeout(()=>{
 ok(JSON.parse(w.localStorage.getItem('winterArc.v1')).completions[d],'import restored data');
 const bad=new w.File(['{nope'],'x.json');Object.defineProperty(inp,'files',{value:[bad],configurable:true});inp.dispatchEvent(new w.Event('change',{bubbles:true}));
 setTimeout(()=>{ok($('#toast').textContent.includes('not valid JSON')&&JSON.parse(w.localStorage.getItem('winterArc.v1')).completions[d],'bad import keeps data');process.exit(0)},100);},10);},100);
},20);
