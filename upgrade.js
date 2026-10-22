'use strict';
(function(){
const PAIRS={
oneesan:['お兄さん','おにいさん'],oniisan:['お姉さん','おねえさん'],otousan:['お母さん','おかあさん'],
obaasan:['おばさん','おばさん'],chiisai:['近い','ちかい'],kitte:['来て','きて'],gakkou:['外交','がいこう'],
akai:['あく','あく'],aku:['あか','あか'],haha:['はち','はち'],hachi:['はは','はは'],
ishi:['いち','いち'],ikaga:['いか','いか'],takai:['近い','ちかい'],heta:['部屋','へや'],
yoi:['夜','よる'],kuru:['切る','きる'],tani:['種','たね'],san:['さる','さる'],
konbanwa:['こんにちは','こんにちは'],odaijini:['お互いに','おたがいに'],okaneo:['お金を払います','おかねをはらいます']
};
const RUBY={
oneesan:'お<ruby>姉<rt>ねえ</rt></ruby>さん',oniisan:'お<ruby>兄<rt>にい</rt></ruby>さん',
otousan:'お<ruby>父<rt>とう</rt></ruby>さん',obaasan:'お<ruby>婆<rt>ばあ</rt></ruby>さん',
chiisai:'<ruby>小<rt>ちい</rt></ruby>さい',kitte:'<ruby>切手<rt>きって</rt></ruby>',
gakkou:'<ruby>学校<rt>がっこう</rt></ruby>',takai:'<ruby>高<rt>たか</rt></ruby>い',
heta:'<ruby>下手<rt>へた</rt></ruby>',yoi:'<ruby>良<rt>よ</rt></ruby>い',
kuru:'<ruby>来<rt>く</rt></ruby>る',tani:'<ruby>谷<rt>たに</rt></ruby>',
odaijini:'お<ruby>大事<rt>だいじ</rt></ruby>に',
okaneo:'お<ruby>金<rt>かね</rt></ruby>をおろします'
};
const EXTRA_RUBY={
'お母さん':'お<ruby>母<rt>かあ</rt></ruby>さん','近い':'<ruby>近<rt>ちか</rt></ruby>い',
'来て':'<ruby>来<rt>き</rt></ruby>て','外交':'<ruby>外交<rt>がいこう</rt></ruby>',
'部屋':'<ruby>部屋<rt>へや</rt></ruby>','夜':'<ruby>夜<rt>よる</rt></ruby>',
'切る':'<ruby>切<rt>き</rt></ruby>る','種':'<ruby>種<rt>たね</rt></ruby>',
'お互いに':'お<ruby>互<rt>たが</rt></ruby>いに',
'お金を払います':'お<ruby>金<rt>かね</rt></ruby>を<ruby>払<rt>はら</rt></ruby>います'
};
const originalRender=render,originalHome=home,originalGo=go;
const wordById=id=>WORDS.find(w=>w.id===id);
function wordHtml(w){return RUBY[w.id]||esc(w.text)}
function foilHtml(w){const p=PAIRS[w.id];return p?(EXTRA_RUBY[p[0]]||esc(p[0])):''}
window.optionsFor=function(w){const p=PAIRS[w.id];const a=[{id:w.id,text:w.text},{id:'foil:'+w.id,text:p[0]}];return Math.random()<.5?a:a.reverse()};
window.home=function(){return originalHome().replace('<div class="sectionbar"><h2>Seu progresso</h2>',
'<button class="card cardlink pitchBanner" type="button" data-navto="pitch"><span class="icon">🎙</span><span><b>Pitch Karaoke · Sua pronúncia</b><small>Grave sua voz e veja a curva de entonação</small></span><span aria-hidden="true">→</span></button><div class="sectionbar"><h2>Seu progresso</h2>')
.replace('Esta primeira versão ainda não analisa o tom da sua voz.','O modo de entonação usa o microfone, no próprio aparelho.');};
function decorate(){
document.querySelectorAll('.option[data-answer]').forEach(b=>{const id=b.dataset.answer,target=b.querySelector('span');if(!target)return;const w=id.startsWith('foil:')?wordById(id.slice(5)):wordById(id);if(w)target.innerHTML=id.startsWith('foil:')?foilHtml(w):wordHtml(w)});
document.querySelectorAll('.listitem [data-play]').forEach(b=>{const w=wordById(b.dataset.play),j=b.closest('.listitem')?.querySelector('.jpn');if(w&&j)j.innerHTML=wordHtml(w)});
document.querySelectorAll('.result[data-word]').forEach(e=>{const w=wordById(e.dataset.word),b=e.querySelector('b');if(w&&b)b.innerHTML=wordHtml(w)});
}
window.results=function(){
if(!session)return progressView();const s=session,n=s.answers.length,hit=s.answers.filter(a=>a.correct).length;
let html='<section class="view"><div class="eyebrow">Correção somente no final</div><div class="card featured" style="margin-top:15px;text-align:center"><div class="mini">Seu resultado</div><div class="score">'+hit+' <span style="font-size:25px;color:var(--sub)">/ '+n+'</span></div><p class="muted">'+(n?Math.round(100*hit/n)+'% de acertos':'Sem respostas')+'</p></div><div class="btnrow"><button class="btn" data-action="again">↻ Repetir</button><button class="btn ghost" data-navto="home">Início</button></div><div class="sectionbar"><h2>Revisar as questões</h2></div>';
s.answers.forEach((a,i)=>{const w=wordById(a.id);if(!w)return;const p=PAIRS[w.id],guess=a.pick.startsWith('foil:')?p[0]:wordById(a.pick)?.text||'—';html+='<div class="result '+(a.correct?'right':'wrong')+'" data-word="'+w.id+'"><div class="resulthead"><span>'+(a.correct?'✓ Acertou':'✕ Revise este som')+' · '+(i+1)+'ª</span><button class="roundplay" data-play="'+w.id+'">▶ Ouvir</button></div><b>'+esc(w.text)+'</b><div class="meaning">'+esc(w.kana)+' · '+esc(w.pt)+'</div>'+(a.correct?'':'<div class="meaning" style="color:var(--red)">Sua opção: '+esc(guess)+'</div>')+'<div class="meaning" style="margin-top:6px">'+esc(w.hint)+'</div></div>'});
return html+'<p class="footnote">As alternativas erradas incluem palavras próximas para treinar o ouvido, e não só a memória visual.</p></section>';
};
let pitchWord='takai',micStream=null,micCtx=null,micSource=null,micAnalyser=null,micTimer=null,micDeadline=null;
let mine=[],ref=[],refLoading=false,refError='',refCache={},micMessage='',micActive=false,lastComparison='';
const candidates=['takai','kitte','gakkou','oneesan','oniisan','otousan','obaasan','chiisai','kuru','tani','heta','yoi'];
function pitchView(){
const w=wordById(pitchWord);
return '<section class="view pitchView"><button class="back" data-navto="home">← Início</button><div class="eyebrow">Pitch Karaoke · Laboratório</div><h1 class="big">Veja o tom<br>da sua voz.</h1><p class="muted" style="font-size:13px">Escute uma gravação, fale a palavra e compare o desenho da altura da voz. O microfone é processado no seu iPhone.</p><div class="card featured" style="text-align:center"><div class="mini">Palavra para praticar</div><div class="pitchTarget">'+wordHtml(w)+'</div><div class="mini">'+esc(w.kana)+' · '+esc(w.pt)+'</div><div class="btnrow" style="margin-top:15px"><button class="btn ghost" data-play="'+w.id+'">▶ Ouvir referência</button></div><div id="audioState" class="mini" style="margin-top:10px" role="status">'+esc(audioStatus)+'</div></div><div class="sectionbar"><h2>Escolha outra palavra</h2></div><div class="pitchPick">'+candidates.map(id=>{const x=wordById(id);return '<button class="toggle '+(x.id===pitchWord?'active':'')+'" data-pitch-word="'+x.id+'">'+esc(x.text)+'</button>'}).join('')+'</div><div class="card" style="margin-top:18px"><div class="pitchLegend"><span><i class="pitchKey refKey"></i>Gravação humana</span><span><i class="pitchKey mineKey"></i>Sua voz</span></div><canvas id="pitchCanvas" width="580" height="260" role="img" aria-label="Gráfico da altura da voz no tempo"></canvas><p class="mini" id="pitchRefStatus">'+(refLoading?'Preparando referência…':esc(refError||'Preparando a referência…'))+'</p><div class="pitchFeedback" id="pitchFeedback" role="status">'+esc(lastComparison||'Ouça e depois toque em “Começar a falar”.')+'</div></div><div class="btnrow"><button class="btn" data-pitch-action="start" '+(micActive?'disabled':'')+'>🎙 '+(micActive?'Captando…':'Começar a falar')+'</button><button class="btn ghost" data-pitch-action="stop" '+(!micActive?'disabled':'')+'>■ Parar</button></div><p class="mini" id="micStatus" role="status" style="margin-top:13px">'+esc(micMessage||'Fale por até 4 segundos. É necessário autorizar o microfone.')+'</p><div class="info" style="margin-top:14px"><span class="icon">ⓘ</span><span>Isto é um treino experimental de <b>contorno de altura</b>. O gráfico não verifica se você pronunciou as consoantes e vogais corretamente, nem substitui uma avaliação humana. Se a gravação de referência não puder ser analisada, sua curva ainda aparecerá.</span></div><p class="footnote">Privacidade: o som do microfone é analisado localmente e não é enviado nem armazenado.</p></section>';
}
window.render=function(){if(page==='pitch'){el.innerHTML=pitchView();paintGraph();if(!refLoading&&!refCache[pitchWord])loadReference();}else{originalRender();decorate();}};
window.go=function(p){stopMic();originalGo(p)};
function estimate(samples,sr){
const factor=Math.max(1,Math.floor(sr/12000)),fs=sr/factor,n=Math.min(2048,Math.floor(samples.length/factor));if(n<540)return null;
const a=new Float32Array(n);let mean=0;for(let i=0;i<n;i++){a[i]=samples[i*factor];mean+=a[i]}mean/=n;
let energy=0;for(let i=0;i<n;i++){a[i]-=mean;energy+=a[i]*a[i]}if(Math.sqrt(energy/n)<.012)return null;
const minLag=Math.max(1,Math.floor(fs/460)),maxLag=Math.min(Math.floor(fs/76),Math.floor(n/2));let lagFound=0,peak=0;
for(let lag=minLag;lag<=maxLag;lag++){let dot=0,n1=0,n2=0;for(let j=0;j<n-lag;j+=2){const x=a[j],y=a[j+lag];dot+=x*y;n1+=x*x;n2+=y*y}const corr=dot/(Math.sqrt(n1*n2)+1e-9);if(corr>.84&&corr>peak){peak=corr;lagFound=lag}}
if(!lagFound)return null;const hz=fs/lagFound;return hz>=76&&hz<=460?hz:null;
}
function median(a){if(!a.length)return 0;const v=a.slice().sort((x,y)=>x-y);return v[Math.floor(v.length/2)]}
function scanReference(b){const ch=b.getChannelData(0),sr=b.sampleRate,step=Math.max(1,Math.round(sr*.05)),frames=[];
for(let pos=0;pos+Math.round(sr*.18)<ch.length;pos+=step){const clip=ch.subarray(pos,Math.min(ch.length,pos+Math.round(sr*.18))),hz=estimate(clip,sr);if(hz)frames.push({t:pos/sr,v:Math.log2(hz)*12})}return frames;}
async function loadReference(){const id=pitchWord;if(refCache[id]){ref=refCache[id];refError='';paintGraph();return}const w=wordById(id);if(!w)return;refLoading=true;refError='';updatePitchStatus('Analisando o contorno da gravação…');
try{const resp=await fetch(w.url,{mode:'cors'});if(!resp.ok)throw new Error('HTTP '+resp.status);const arr=await resp.arrayBuffer(),C=window.AudioContext||window.webkitAudioContext,ac=new C();
try{const buf=await ac.decodeAudioData(arr),frames=scanReference(buf);if(frames.length<4)throw new Error('Poucas amostras de tom');refCache[id]=frames;if(id===pitchWord){ref=frames;refError='';paintGraph()}}finally{await ac.close()}}
catch(e){if(id===pitchWord){ref=[];refError='Referência visual indisponível. Ouvir continua funcionando; a curva da sua voz funciona separadamente.';paintGraph()}}
finally{refLoading=false;if(id===pitchWord)updatePitchStatus(refError||'Curva da gravação preparada · não é um padrão tonal certificado.')}
}
function updatePitchStatus(v){const e=document.getElementById('pitchRefStatus');if(e)e.textContent=v}
function normalizedPoints(frames){if(frames.length<2)return [];const start=frames[0].t,end=frames[frames.length-1].t,center=median(frames.map(a=>a.v));return frames.map(a=>({x:(a.t-start)/Math.max(.01,end-start),y:Math.max(-6,Math.min(6,a.v-center))}))}
function paintGraph(){const c=document.getElementById('pitchCanvas');if(!c)return;const dpr=Math.min(devicePixelRatio||1,2),rect=c.getBoundingClientRect(),w=Math.max(200,rect.width),h=188;c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);const ctx=c.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);ctx.fillStyle='#101c2b';ctx.fillRect(0,0,w,h);
for(let i=1;i<5;i++){ctx.strokeStyle='#263b4b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,i*h/5);ctx.lineTo(w-12,i*h/5);ctx.stroke()}
function draw(frames,color){const pts=normalizedPoints(frames);if(!pts.length)return;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>{const x=18+p.x*(w-36),y=h/2-p.y*13;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
draw(ref,'#80e1c6');draw(mine,'#a6a9ff');if(!ref.length&&!mine.length){ctx.font='13px -apple-system,sans-serif';ctx.fillStyle='#99afc2';ctx.textAlign='center';ctx.fillText('As curvas aparecem aqui',w/2,h/2)}
}
function closeMic(){if(micTimer){clearInterval(micTimer);micTimer=null}if(micDeadline){clearTimeout(micDeadline);micDeadline=null}if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null}if(micSource){try{micSource.disconnect()}catch{}micSource=null}if(micAnalyser){try{micAnalyser.disconnect()}catch{}micAnalyser=null}if(micCtx){micCtx.close().catch(()=>{});micCtx=null}micActive=false}
function stopMic(){if(!micActive&&!micStream)return;closeMic();let msg=mine.length>3?'Captura encerrada. Compare as curvas e tente novamente.':'Não consegui medir altura suficiente. Fale perto do microfone, em ambiente silencioso.';const cmp=compareCurves(ref,mine);if(cmp)msg=cmp;lastComparison=msg;micMessage='Microfone desligado';const status=document.getElementById('micStatus'),fb=document.getElementById('pitchFeedback');if(status)status.textContent=micMessage;if(fb)fb.textContent=msg;const st=document.querySelector('[data-pitch-action="start"]'),sp=document.querySelector('[data-pitch-action="stop"]');if(st){st.disabled=false;st.textContent='🎙 Repetir minha voz'}if(sp)sp.disabled=true;paintGraph();}
function compareCurves(a,b){const aa=normalizedPoints(a),bb=normalizedPoints(b);if(aa.length<5||bb.length<5)return '';
function at(arr,x){for(let i=1;i<arr.length;i++){if(arr[i].x>=x){const l=arr[i-1],r=arr[i],t=(x-l.x)/Math.max(.00001,r.x-l.x);return l.y+(r.y-l.y)*t}}return arr[arr.length-1].y}
let err=0;for(let i=0;i<16;i++){const x=i/15;err+=Math.abs(at(aa,x)-at(bb,x))}err/=16;
return err<1.25?'Contornos relativamente próximos. Experimente repetir para conferir.':err<2.6?'Há diferenças na subida ou descida do tom. Ouça e tente mais uma vez.':'As curvas diferem bastante. Ouça novamente e reproduza o movimento do tom.';
}
async function startMic(){stopMic();mine=[];lastComparison='';micMessage='Solicitando permissão de microfone…';const fb=document.getElementById('pitchFeedback'),ms=document.getElementById('micStatus');if(fb)fb.textContent='Fale a palavra naturalmente.';if(ms)ms.textContent=micMessage;paintGraph();
if(!navigator.mediaDevices?.getUserMedia){micMessage='O Safari precisa abrir o site por HTTPS para usar o microfone.';if(ms)ms.textContent=micMessage;return}
let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}catch(e){micMessage=e.name==='NotAllowedError'?'Microfone bloqueado. Autorize nas configurações do Safari.':'Não foi possível abrir o microfone ('+e.name+').';if(ms)ms.textContent=micMessage;return}
if(page!=='pitch'){stream.getTracks().forEach(t=>t.stop());return}
try{const C=window.AudioContext||window.webkitAudioContext;micCtx=new C();await micCtx.resume();micStream=stream;micSource=micCtx.createMediaStreamSource(stream);micAnalyser=micCtx.createAnalyser();micAnalyser.fftSize=4096;micSource.connect(micAnalyser);micActive=true;const arr=new Float32Array(micAnalyser.fftSize),start=performance.now(),st=document.querySelector('[data-pitch-action="start"]'),sp=document.querySelector('[data-pitch-action="stop"]');if(st){st.disabled=true;st.textContent='🎙 Ouvindo sua voz…'}if(sp)sp.disabled=false;micMessage='Gravando somente a altura (até 4s)…';if(ms)ms.textContent=micMessage;
micTimer=setInterval(()=>{if(!micActive||!micAnalyser)return;micAnalyser.getFloatTimeDomainData(arr);const hz=estimate(arr,micCtx.sampleRate);if(hz)mine.push({t:(performance.now()-start)/1000,v:Math.log2(hz)*12});paintGraph()},65);micDeadline=setTimeout(()=>stopMic(),4200);
}catch(e){stream.getTracks().forEach(t=>t.stop());closeMic();micMessage='Falha ao iniciar medição de voz.';if(ms)ms.textContent=micMessage}
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.play&&page==='pitch'&&micActive)stopMic();
if(b.dataset.pitchWord){e.preventDefault();stopMic();pitchWord=b.dataset.pitchWord;mine=[];ref=refCache[pitchWord]||[];refError='';audioStatus='';lastComparison='';window.render();return}
const action=b.dataset.pitchAction;if(action==='start'){e.preventDefault();startMic()}if(action==='stop'){e.preventDefault();stopMic()}},true);
window.addEventListener('pagehide',closeMic);
const nav=document.querySelector('.nav');if(nav)nav.insertAdjacentHTML('beforeend','<button type="button" class="navbtn" data-nav="pitch"><span class="icon">♬</span>Pronúncia</button>');
window.render();
})();