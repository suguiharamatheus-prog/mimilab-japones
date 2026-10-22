/* MimiLab 3: guided, private A/B pronunciation practice. */
(function(){
'use strict';
const eng=window.MimiPitchEngine;if(!eng)return;
const olderRender=window.render,olderGo=window.go;
const getWord=id=>WORDS.find(w=>w.id===id)||(window.MimiV4?.words?.find(w=>w.id===id));
const available=['takai','kitte','gakkou','oneesan','oniisan','otousan','obaasan','chiisai','kuru','tani','heta','yoi','san','odaijini'];
const ruby={
 takai:'<ruby>高<rt>たか</rt></ruby>い',kitte:'<ruby>切手<rt>きって</rt></ruby>',gakkou:'<ruby>学校<rt>がっこう</rt></ruby>',
 oneesan:'お<ruby>姉<rt>ねえ</rt></ruby>さん',oniisan:'お<ruby>兄<rt>にい</rt></ruby>さん',otousan:'お<ruby>父<rt>とう</rt></ruby>さん',
 obaasan:'お<ruby>婆<rt>ばあ</rt></ruby>さん',chiisai:'<ruby>小<rt>ちい</rt></ruby>さい',kuru:'<ruby>来<rt>く</rt></ruby>る',
 tani:'<ruby>谷<rt>たに</rt></ruby>',heta:'<ruby>下手<rt>へた</rt></ruby>',yoi:'<ruby>良<rt>よ</rt></ruby>い',san:'さん',odaijini:'お<ruby>大事<rt>だいじ</rt></ruby>に'
};
let selected='takai',viewMode='tone',reference=null,userAnalysis=null,refNotice='',recordNotice='',pitchEpoch=0,live=false,recordedURL=null,refBusy=false;
let inputStream=null,audioContext=null,source=null,processor=null,muter=null,analyser=null,mediaTimer=null,paintRequest=null,packets=[],recordStart=0,sampleRate=48000;
let activeAudio=null,recordBusy=false,stopBusy=false;
const safe=s=>esc(String(s??''));
const msg=id=>document.getElementById(id);
function labelFor(w){return w.cat==='custom'&&/[一-龯々]/.test(w.text)?'<ruby>'+safe(w.text)+'<rt>'+safe(w.kana)+'</rt></ruby>':ruby[w.id]||safe(w.text)}
function topicText(w){return w.cat==='sokuon'?'Observe a duração da interrupção antes da consoante (っ).':w.cat==='longas'?'Observe a duração da vogal longa; não basta acertar a altura da voz.':'Observe a sequência dos sons e a subida ou descida da voz.';}
function status(id,value){const e=msg(id);if(e)e.textContent=value;}
function practiceHtml(){const w=getWord(selected);const hasVoice=!!recordedURL;return `<section class="view practiceV3"><button class="back" type="button" data-navto="home">← Início</button>
<div class="eyebrow">Laboratório de pronúncia · MimiLab 3.0</div><h1 class="big">Ouça. Grave.<br><span class="mintWord">Compare.</span></h1>
<p class="muted practiceIntro">Treino de <b>altura, ritmo e duração</b>. A curva mostra uma gravação específica, não o padrão ideal de acento tonal. Desvios na medição não significam que sua fala está errada. Use fones para ouvir a referência e grave em um ambiente silencioso.</p>
<div class="card featured practiceTarget"><div class="mini">Palavra escolhida</div><div class="pitchTarget">${labelFor(w)}</div><div class="mini">${safe(w.kana)} · ${safe(w.pt)}</div><p class="mini" style="margin-top:9px">${safe(topicText(w))}</p>
<div class="practiceControls"><button class="btn ghost" type="button" data-practice-audio="ref">▶ Ouvir japonês</button><button class="btn ghost" type="button" data-practice-audio="slow">▶ Japonês 0,8×</button></div>
<div class="microStatus" id="practiceRef" role="status">${safe(refNotice||'Carregando referência para análise…')}</div></div>
<div class="sectionbar"><h2>Escolha uma palavra</h2></div><div class="pitchPick">${available.map(id=>{const q=getWord(id);return `<button type="button" class="toggle ${id===selected?'active':''}" data-practice-word="${id}">${safe(q.text)}</button>`}).join('')}</div>
${window.MimiV4?.panel?.()||''}
<div class="card practiceRecorder"><div class="sectionbar" style="margin:0 0 8px"><h2>🎙 Grave sua voz</h2><span class="mini">até 5 segundos</span></div>
<p class="mini">Toque em Gravar e diga a palavra uma vez. Depois você poderá ouvir sua voz e a gravação japonesa lado a lado.</p>
<div class="micLevel"><div id="micLevelFill"></div></div><div class="practiceControls"><button class="btn" type="button" data-practice-action="record" ${live||recordBusy?'disabled':''}>${live?'● Gravando…':'🎙 Gravar minha voz'}</button><button class="btn ghost" type="button" data-practice-action="stop" ${live?'':'disabled'}>■ Parar</button></div>
<div class="microStatus" id="practiceStatus" role="status">${safe(recordNotice||'Seu áudio fica somente neste aparelho e é descartado ao sair do treino.')}</div>
<div class="practiceControls"><button class="btn ghost" type="button" data-practice-audio="mine" ${hasVoice?'':'disabled'}>▶ Ouvir minha voz</button><button class="btn ghost" type="button" data-practice-audio="mine-slow" ${hasVoice?'':'disabled'}>▶ Minha voz 0,8×</button></div></div>
<div class="card practicePlots"><div class="sectionbar" style="margin:0 0 10px"><h2>Visualização</h2></div>
<div class="practiceTabs"><button type="button" class="toggle ${viewMode==='tone'?'active':''}" data-practice-view="tone">↗ Entonação</button><button type="button" class="toggle ${viewMode==='rhythm'?'active':''}" data-practice-view="rhythm">〜 Ritmo e pausas</button></div>
<div class="pitchLegend"><span><i class="pitchKey refKey"></i>Gravação japonesa</span><span><i class="pitchKey mineKey"></i>Sua voz</span></div>
<canvas id="practiceCanvas" aria-label="${viewMode==='tone'?'Comparação da altura relativa da voz':'Comparação visual de intensidade, duração e pausas'}" width="640" height="250"></canvas>
<div class="practiceValues" id="practiceValues"></div><div class="pitchFeedback" id="practiceFeedback" role="status"></div>
</div>
${window.MimiV4?.mouth?.()||''}
<div class="info"><span class="icon">ⓘ</span><span><b>Importante:</b> o gráfico mostra pistas acústicas, não se suas palavras estão corretas. Diferenças de voz, velocidade e gravação podem mudar as curvas. Silêncios também ocorrem em consoantes e vogais desvozeadas. Não dá para determinar se um っ ou uma vogal está correto apenas pela curva.</span></div>
<p class="footnote">Privacidade: microfone e análise processados localmente. A gravação temporária não é enviada ao site, nem salva em sua conta. Os áudios de referência são baixados do Wikimedia Commons.</p>
</section>`;}
function graph(){const canvas=msg('practiceCanvas');if(!canvas)return;const width=Math.max(245,canvas.getBoundingClientRect().width||320),height=194,dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#101c2b';ctx.fillRect(0,0,width,height);
 const left=13,right=width-13,top=12,bottom=height-13;
 for(let i=0;i<5;i++){const y=top+(bottom-top)*i/4;ctx.strokeStyle='#2a4050';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();}
 const datasets=[{a:reference,c:'#80e1c6'},{a:userAnalysis,c:'#aaa8ff'}];
 for(const ds of datasets){if(!ds.a||!ds.a.duration)continue;const points=eng.normalize(ds.a)[viewMode==='tone'?'pitch':'energy'];if(points.length<2)continue;ctx.strokeStyle=ds.c;ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();let drawing=false,previous=null;
 for(const p of points){if(p.y==null){drawing=false;previous=null;continue;}
 const x=left+p.x*(right-left),y=viewMode==='tone'?(top+bottom)/2-p.y*12:bottom-(p.y*.92)*(bottom-top);
 if(!drawing||previous!==null&&p.x-previous>.12)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 drawing=true;previous=p.x;
 }ctx.stroke();}
 if(!reference&&!userAnalysis){ctx.fillStyle='#9caebb';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText('Ouça, grave e veja sua comparação',width/2,height/2);}
 else if(viewMode==='tone'){ctx.font='10px system-ui';ctx.fillStyle='#90a3b2';ctx.textAlign='left';ctx.fillText('↑ mais agudo',15,11);ctx.fillText('↓ mais grave',15,height-5);}
 else {ctx.fillStyle='#90a3b2';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('↑ maior intensidade',15,11);ctx.fillText('Pausas e partes fracas aparecem perto da base',15,height-5);}
 updateAnalysis();
}
function updateAnalysis(){const target=msg('practiceValues'),feedback=msg('practiceFeedback');if(!target)return;
 const f=reference,u=userAnalysis;
 target.innerHTML=`<span>Japonês: <b>${f&&f.duration?f.duration.toFixed(2)+' s':'—'}</b></span><span>Sua gravação: <b>${u&&u.duration?u.duration.toFixed(2)+' s':'—'}</b></span>`;
 let out='';
 if(!u)out='Grave sua voz para visualizar e comparar. Você também poderá ouvir o resultado.';
 else if(!u.duration||u.signal<.004)out='Voz muito baixa ou nenhum som detectado. Tente de novo perto do microfone.';
 else if(!f)out='Sua voz foi analisada, mas não foi possível analisar a referência. Ouça os dois áudios para comparar.';
 else if(viewMode==='rhythm'){
  const diff=u.duration-f.duration;
  out=Math.abs(diff)<.13?'As durações medidas são semelhantes. Compare as pausas e as vogais pelo ouvido.':diff>.13?'Sua fala ficou mais longa que a gravação japonesa. Ouça a diferença de ritmo.':'Sua fala ficou mais curta que a gravação japonesa. Ouça se alguma vogal ou pausa ficou breve demais.';
 }else{
  const fq=eng.pitchQuality(f),uq=eng.pitchQuality(u);
  out=fq==='insufficient'||uq==='insufficient'?'Não há dados de voz tonal suficientes para avaliar a curva. Isso é comum em sons desvozeados ou microfone com ruído.':'As curvas mostram alturas relativas e podem oscilar na passagem por consoantes e sons sem voz. Compare pelo ouvido antes de interpretar a linha. A curva não comprova o padrão lexical correto.';
 }
 if(feedback)feedback.textContent=out;
}
function releaseAudio(){if(activeAudio){activeAudio.pause();activeAudio.src='';activeAudio=null}}
function clearRecording(){releaseAudio();if(recordedURL){URL.revokeObjectURL(recordedURL);recordedURL=null}userAnalysis=null;recordNotice='';}
function closeMic(){if(mediaTimer){clearTimeout(mediaTimer);mediaTimer=null}if(paintRequest){cancelAnimationFrame(paintRequest);paintRequest=null}
 try{source&&source.disconnect()}catch{}try{processor&&processor.disconnect()}catch{}try{muter&&muter.disconnect()}catch{}try{analyser&&analyser.disconnect()}catch{}
 if(processor&&'onaudioprocess'in processor)processor.onaudioprocess=null;
 if(inputStream){inputStream.getTracks().forEach(x=>x.stop())}if(audioContext){audioContext.close().catch(()=>{})}
 source=null;processor=null;muter=null;analyser=null;inputStream=null;audioContext=null;live=false;
}
function dispose(){pitchEpoch++;closeMic();packets=[];clearRecording();reference=null;refBusy=false;refNotice='';recordBusy=false;stopBusy=false;}
function renderPractice(){el.innerHTML=practiceHtml();graph();}
window.render=function(){if(page==='pitch'){renderPractice();if(!refBusy&&!reference){void loadRef(selected)}}else olderRender();};
window.go=function(p){if(page==='pitch'&&p!=='pitch')dispose();olderGo(p);};
window.addEventListener('pagehide',dispose);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&live)void stopMic();});
const refs=new Map();
async function loadRef(id){const stamp=++pitchEpoch;const target=getWord(id);const url=window.MimiV4?.refUrl?.(id)||target?.url;if(!url){reference=null;refBusy=false;refNotice='Sem modelo gravado para esta palavra. Anexe um áudio japonês para comparar a curva ou grave apenas sua voz.';status('practiceRef',refNotice);graph();return;}const cached=refs.get(id);if(cached){reference=cached;refNotice='Referência humana analisada. A gravação não é um padrão tonal certificado.';status('practiceRef',refNotice);graph();return;}
 refBusy=true;refNotice='Analisando gravação japonesa…';status('practiceRef',refNotice);
 let ctx=null;
 try{const res=await fetch(url,{mode:'cors'});if(!res.ok)throw new Error('HTTP '+res.status);const bytes=await res.arrayBuffer();const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('AudioContext indisponível');ctx=new C();const decoded=await ctx.decodeAudioData(bytes);
 let mono=decoded.getChannelData(0);if(decoded.numberOfChannels>1){const second=decoded.getChannelData(1),m=new Float32Array(mono.length);for(let i=0;i<mono.length;i++)m[i]=(mono[i]+second[i])/2;mono=m;}
 const r=eng.analyze(mono,decoded.sampleRate);if(stamp!==pitchEpoch||id!==selected||page!=='pitch')return;if(r.duration<.15)throw new Error('Áudio curto');refs.set(id,r);reference=r;refNotice='Gravação humana analisada. O contorno não é um padrão tonal certificado.';
 }catch(e){if(stamp!==pitchEpoch||id!==selected)return;reference=null;refNotice='Não foi possível desenhar o áudio original. Você ainda pode ouvi-lo e gravar sua voz.';}
 finally{if(ctx)ctx.close().catch(()=>{});if(stamp===pitchEpoch){refBusy=false;status('practiceRef',refNotice);graph();}}
}
function play(which){releaseAudio();let url='',rate=.99;
 if(which==='ref'||which==='slow'){url=window.MimiV4?.refUrl?.(selected)||getWord(selected)?.url;rate=which==='slow'?.8:1;if(!url){status('practiceRef','Sem áudio de referência. Escolha um arquivo abaixo.');return}}
 else {if(!recordedURL){status('practiceStatus','Grave sua voz antes de tentar ouvi-la.');return}url=recordedURL;rate=which==='mine-slow'?.8:1;}
 const a=new Audio();activeAudio=a;a.preload='auto';a.src=url;a.playbackRate=rate;
 // Playback-rate changes should not shift pitch; browsers generally preserve pitch by default.
 if('preservesPitch'in a)a.preservesPitch=true;
 a.onended=()=>{if(activeAudio===a)activeAudio=null};a.onerror=()=>status(which.startsWith('mine')?'practiceStatus':'practiceRef','Não foi possível reproduzir o áudio. Tente novamente com a internet ativa.');
 a.play().catch(()=>status(which.startsWith('mine')?'practiceStatus':'practiceRef','Toque novamente no botão ▶ para permitir o áudio no Safari.'));
}
function wavData(data,sr){const len=data.length,buffer=new ArrayBuffer(44+len*2),view=new DataView(buffer);function four(at,text){for(let i=0;i<4;i++)view.setUint8(at+i,text.charCodeAt(i))}
 four(0,'RIFF');view.setUint32(4,36+len*2,true);four(8,'WAVE');four(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sr,true);view.setUint32(28,sr*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);four(36,'data');view.setUint32(40,len*2,true);
 for(let i=0;i<len;i++){let x=Math.max(-1,Math.min(1,data[i]));view.setInt16(44+i*2,x<0?Math.round(x*32768):Math.round(x*32767),true)}return new Blob([buffer],{type:'audio/wav'});
}
function updateLevel(){if(!live||!analyser)return;const arr=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(arr);let rms=0;for(let x of arr)rms+=x*x;rms=Math.sqrt(rms/arr.length);
 const fill=msg('micLevelFill');if(fill)fill.style.width=Math.min(100,Math.round(rms*290))+'%';paintRequest=requestAnimationFrame(updateLevel);
}
async function startMic(){if(recordBusy||live)return;recordBusy=true;closeMic();clearRecording();packets=[];recordNotice='Pedindo acesso ao microfone…';renderPractice();const stamp=pitchEpoch;
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){recordNotice='Microfone indisponível: abra o site no Safari via HTTPS.';recordBusy=false;renderPractice();return;}
 try{inputStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
 if(stamp!==pitchEpoch||page!=='pitch'){inputStream.getTracks().forEach(t=>t.stop());inputStream=null;return;}
 const C=window.AudioContext||window.webkitAudioContext;audioContext=new C();await audioContext.resume();
 sampleRate=audioContext.sampleRate;source=audioContext.createMediaStreamSource(inputStream);analyser=audioContext.createAnalyser();analyser.fftSize=2048;source.connect(analyser);
 muter=audioContext.createGain();muter.gain.value=0;
 let workletReady=false;
 if(audioContext.audioWorklet&&window.AudioWorkletNode){
  const code=`class MimiPCM3 extends AudioWorkletProcessor {constructor(){super();this.data=new Float32Array(2048);this.used=0;}process(inputs,outputs){const input=inputs[0]&&inputs[0][0];if(input){for(let i=0;i<input.length;i++){this.data[this.used++]=input[i];if(this.used===this.data.length){this.port.postMessage(this.data);this.data=new Float32Array(2048);this.used=0;}}}for(const o of outputs){for(const channel of o)channel.fill(0)}return true}}registerProcessor('mimi-pcm-v3',MimiPCM3)`;
  const u=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  try{await audioContext.audioWorklet.addModule(u);processor=new AudioWorkletNode(audioContext,'mimi-pcm-v3',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});processor.port.onmessage=e=>{if(live&&e.data instanceof Float32Array)packets.push(e.data);};workletReady=true;}catch(e){processor=null}finally{URL.revokeObjectURL(u)}
 }
 if(!workletReady){if(!audioContext.createScriptProcessor)throw new Error('Processamento de áudio indisponível');processor=audioContext.createScriptProcessor(2048,1,1);processor.onaudioprocess=e=>{if(live)packets.push(new Float32Array(e.inputBuffer.getChannelData(0)));e.outputBuffer.getChannelData(0).fill(0)}}
 source.connect(processor);processor.connect(muter);muter.connect(audioContext.destination);live=true;recordBusy=false;recordStart=Date.now();recordNotice='● Gravando… diga a palavra uma vez.';renderPractice();updateLevel();mediaTimer=setTimeout(()=>{void stopMic()},5100);
 }catch(err){const message=err?.name==='NotAllowedError'?'Você bloqueou o microfone. Autorize o acesso nas configurações do Safari.':err?.name==='NotFoundError'?'Nenhum microfone encontrado.':'Não consegui abrir o microfone: '+(err?.name||err?.message||'erro desconhecido');closeMic();recordBusy=false;recordNotice=message;renderPractice();}
}
async function stopMic(){if(stopBusy||!live)return;stopBusy=true;const duration=Math.min((Date.now()-recordStart)/1000,5.2),samples=packets.slice(),sr=sampleRate;
 closeMic();recordNotice='Processando gravação local…';renderPractice();
 // Give the worklet's already-posted buffers time to arrive before finalizing.
 await new Promise(resolve=>setTimeout(resolve,110));
 const blocks=packets.length>samples.length?packets:samples;let n=blocks.reduce((s,x)=>s+x.length,0);
 if(!n){recordNotice='O microfone abriu, mas nenhum áudio chegou. Tente de novo no Safari.';stopBusy=false;renderPractice();return;}
 const maxSamples=Math.min(n,Math.round(sr*5.25)),out=new Float32Array(maxSamples);let at=0;
 for(const b of blocks){const count=Math.min(b.length,maxSamples-at);if(count<=0)break;out.set(b.subarray(0,count),at);at+=count;}
 recordedURL=URL.createObjectURL(wavData(out,sr));userAnalysis=eng.analyze(out,sr);
 const q=eng.pitchQuality(userAnalysis);
 recordNotice=q==='insufficient'?'Gravado. A altura da voz não pôde ser medida com confiança; ouça e tente novamente.':q==='partial'?'Gravado. Parte da entonação foi captada. Você pode ouvir e comparar.':'Gravado! Ouça sua voz e compare as curvas.';
 stopBusy=false;renderPractice();
}
function selectWord(id){if(!getWord(id))return;dispose();selected=id;viewMode='tone';renderPractice();void loadRef(id);}
window.MimiPractice={selected:()=>selected,select:selectWord,refresh:renderPractice,invalidate(id){refs.delete(id);if(id===selected){reference=null;void loadRef(id);renderPractice()}}};
window.addEventListener('click',event=>{if(page!=='pitch')return;
 const btn=event.target.closest('button');if(!btn)return;
 if(btn.dataset.practiceWord){event.preventDefault();event.stopPropagation();selectWord(btn.dataset.practiceWord);}
 else if(btn.dataset.practiceAudio){event.preventDefault();event.stopPropagation();play(btn.dataset.practiceAudio);}
 else if(btn.dataset.practiceAction){event.preventDefault();event.stopPropagation();if(btn.dataset.practiceAction==='record')void startMic();else void stopMic();}
 else if(btn.dataset.practiceView){event.preventDefault();event.stopPropagation();viewMode=btn.dataset.practiceView;renderPractice();}
},true);
})();