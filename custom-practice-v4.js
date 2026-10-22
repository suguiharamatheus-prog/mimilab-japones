/* MimiLab 4 — personalized Japanese practice and approximate articulation guide */
(function(){
'use strict';
const key='mimilab_practice_words_v4';
const words=[];const recordings=new Map();let mouthIndex=0,notice='';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))for(const w of saved.slice(0,50)){if(w&&typeof w.id==='string'&&typeof w.text==='string'&&typeof w.kana==='string')words.push({...w,cat:'custom',url:'',hint:'Palavra escolhida pelo estudante'});}}catch(e){}
function persist(){try{localStorage.setItem(key,JSON.stringify(words.map(({id,text,kana,pt})=>({id,text,kana,pt}))))}catch(e){}}
function current(){return window.MimiPractice?.selected?.()||'takai';}
function builtin(id){return typeof WORDS!=='undefined'?WORDS.find(w=>w.id===id):null;}
function word(){return words.find(w=>w.id===current())||builtin(current());}
function refUrl(id){return recordings.get(id)?.url||null;}
function panel(){
 const w=word(),id=current(),own=w?.cat==='custom',hasAudio=!!(refUrl(id)||w?.url);
 const chips=words.map(x=>'<button type="button" class="toggle '+(id===x.id?'active':'')+'" data-practice-word="'+esc(x.id)+'">'+esc(x.text)+'</button>').join('');
 return '<div class="card customPractice"><div class="sectionbar" style="margin:0"><h2>✍ Minhas palavras</h2><span class="mini">até 50</span></div>'+
 '<p class="mini">Digite uma palavra, sua leitura em kana e, se quiser comparar o tom, escolha uma gravação humana de referência.</p>'+
 '<form id="customWordForm" class="customForm">'+
 '<label>Palavra ou frase<input name="word" lang="ja" maxlength="42" required placeholder="例: 図書館"></label>'+
 '<label>Leitura em hiragana / katakana<input name="kana" lang="ja" maxlength="60" required placeholder="例: としょかん"></label>'+
 '<label>Significado (opcional)<input name="meaning" maxlength="70" placeholder="biblioteca"></label>'+
 '<button class="btn" type="submit">+ Adicionar para treinar</button></form>'+
 (chips?'<div class="pitchPick" style="margin:14px 0">'+chips+'</div>':'')+
 (own?'<div class="customSelected"><span>Selecionada: <b>'+esc(w.text)+'</b></span><button type="button" data-delete-word="'+esc(id)+'">Excluir</button></div>':'')+
 '<label class="customFile">🎧 Gravação de referência (opcional)<input id="referenceUploadV4" type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm"></label>'+
 '<div class="mini">'+(recordings.has(id)?'Arquivo temporário: '+esc(recordings.get(id).name):hasAudio?'Esta palavra já tem uma gravação japonesa.':'Ainda sem gravação: seu gráfico funciona, mas não há modelo para comparar.')+'</div>'+
 '<div class="microStatus" id="customNotice" role="status">'+esc(notice)+'</div></div>';
}
const vowels={a:['あ · A','Abra bem a boca, com os lábios relaxados.',108,64],i:['い · I','Abra pouco e estenda levemente os cantos da boca.',118,19],u:['う · U','Lábios mais relaxados e pouco arredondados; evite um bico forte.',78,19],e:['え · E','Abertura média, com língua elevada na região anterior.',105,39],o:['お · O','Arredonde suavemente os lábios com abertura intermediária.',80,43],stop:['っ','Prepare e segure a articulação da consoante seguinte por uma mora.',94,11],nasal:['ん','Som nasal: sua posição muda conforme o som seguinte.',92,11]};
function parts(s){const k=Array.from(String(s||'').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/\s/g,'')),a=[];for(const v of k){if('ゃゅょぁぃぅぇぉ'.includes(v)&&a.length&&a[a.length-1]!=='っ')a[a.length-1]+=v;else a.push(v)}return a.slice(0,36);}
function vowel(s,prev){if(s==='っ')return 'stop';if(s==='ん')return 'nasal';if(s==='ー')return prev||'u';const map={a:'あかがさざただなはばぱまやらわぁゃ',i:'いきぎしじちぢにひびぴみりぃ',u:'うくぐすずつづぬふぶぷむゆるぅゅ',e:'えけげせぜてでねへべぺめれぇ',o:'おこごそぞとどのほぼぽもよろをぉょ'};const last=Array.from(s).pop();for(const [v,chars] of Object.entries(map))if(chars.includes(last))return v;return 'a';}
function mouth(){
 const w=word(),arr=parts(w?.kana),i=Math.max(0,Math.min(mouthIndex,arr.length-1)),symbol=arr[i]||'あ';let prev=null;
 for(let j=0;j<i;j++){const v=vowel(arr[j],prev);if(v!=='stop'&&v!=='nasal')prev=v;}
 const v=vowel(symbol,prev),info=vowels[v],sw=info[2],sh=info[3];
 const svg='<svg class="mouthPicture" viewBox="0 0 240 150" aria-label="Ilustração frontal simplificada dos lábios" role="img">'+
 '<ellipse cx="120" cy="76" rx="'+(sw+28)/2+'" ry="'+(sh+21)/2+'" fill="#df929f" stroke="#f8b3ba" stroke-width="3"/>'+
 '<ellipse cx="120" cy="76" rx="'+sw/2+'" ry="'+sh/2+'" fill="#251726" stroke="#bd7382" stroke-width="2"/>'+
 ((v==='stop'||v==='nasal')?'':'<ellipse cx="120" cy="'+(81+sh*.23)+'" rx="'+Math.max(12,sw*.31)+'" ry="'+Math.max(4,sh*.12)+'" fill="#df8692"/>')+'</svg>';
 return '<div class="card mouthGuide"><div class="sectionbar" style="margin:0"><h2>👄 Posição da boca</h2><span class="mini">guia visual</span></div>'+
 '<p class="mini">Toque numa parte da palavra para ver a posição aproximada dos lábios.</p>'+
 '<div class="moraStrip">'+arr.map((s,j)=>'<button class="moraBtn '+(i===j?'selected':'')+'" type="button" data-mouth-index="'+j+'" aria-pressed="'+(i===j)+'">'+esc(s)+'</button>').join('')+'</div>'+
 '<div class="mouthBody">'+svg+'<div><b>'+esc(info[0])+'</b><p>'+esc(info[1])+'</p><span class="mini">Parte '+(i+1)+' / '+arr.length+'</span></div></div>'+
 '<p class="mini">A ilustração é apenas um guia das vogais, não simula todos os movimentos da língua e das consoantes.</p></div>';
}
window.MimiV4={words,refUrl,panel,mouth};
const style=document.createElement('style');
style.textContent='.customPractice,.mouthGuide{padding:17px;margin-top:16px}.customForm{display:grid;gap:11px;margin-top:13px}.customForm label,.customFile{display:grid;gap:6px;font-size:12px;font-weight:700;color:#bed1db}.customForm input,.customFile input{display:block;box-sizing:border-box;width:100%;border:1px solid #355063;border-radius:11px;background:#111d2a;color:#f2fbfd;font:inherit;font-size:16px;padding:11px}.customFile{border:1px dashed #486575;padding:13px;border-radius:12px;margin:15px 0 7px}.customFile input{font-size:12px}.customSelected{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#cbdde3;font-size:12px;padding:10px 0}.customSelected button{background:#372435;color:#ffc0ce;border:1px solid #705063;border-radius:9px;padding:8px}.moraStrip{display:flex;flex-wrap:wrap;gap:7px;margin:13px 0}.moraBtn{background:#172a3a;border:1px solid #395364;color:#c5d7dc;font-size:17px;padding:8px 10px;min-width:36px;border-radius:10px}.moraBtn.selected{background:#83dcc4;color:#122c31;border-color:#83dcc4;font-weight:800}.mouthBody{display:flex;align-items:center;gap:11px;border-radius:14px;background:#101d2d;padding:12px 6px}.mouthBody svg{width:49%;max-width:190px;flex-shrink:0}.mouthBody b{color:#83dcc4;font-size:18px}.mouthBody p{font-size:12px;color:#dce9ef;line-height:1.6}.mouthGuide .mini{line-height:1.6}';
document.head.appendChild(style);
document.addEventListener('submit',e=>{
 if(e.target?.id!=='customWordForm')return;e.preventDefault();e.stopPropagation();const f=e.target;
 const text=String(f.elements.namedItem('word')?.value||'').trim(),kana=String(f.elements.namedItem('kana')?.value||'').trim(),pt=String(f.elements.namedItem('meaning')?.value||'').trim();
 if(!text||!kana||!/^[\u3040-\u30ffー・\s]+$/.test(kana)){notice='Digite a palavra e sua leitura em kana.';document.getElementById('customNotice').textContent=notice;return}
 if(words.length>=50){notice='Limite de 50 palavras. Exclua uma antes de adicionar.';document.getElementById('customNotice').textContent=notice;return}
 const id='own-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 words.push({id,text,kana,pt:pt||'Sem tradução',cat:'custom',hint:'Treino personalizado',url:''});persist();mouthIndex=0;
 window.MimiPractice.select(id);notice='Palavra salva. Você pode escolher um áudio de referência para comparar a entonação.';
 const x=document.getElementById('customNotice');if(x)x.textContent=notice;
},true);
document.addEventListener('change',e=>{
 if(e.target?.id!=='referenceUploadV4')return;const f=e.target.files?.[0];if(!f)return;
 if(!f.type.startsWith('audio/')&&!/\.(wav|mp3|m4a|aac|ogg|webm)$/i.test(f.name)){notice='Escolha um arquivo de áudio.';document.getElementById('customNotice').textContent=notice;return}
 if(f.size>18*1024*1024){notice='Escolha um áudio menor que 18 MB.';document.getElementById('customNotice').textContent=notice;return}
 const id=current(),old=recordings.get(id);if(old)URL.revokeObjectURL(old.url);
 recordings.set(id,{url:URL.createObjectURL(f),name:f.name});
 notice='Gravação temporária ativada. Não fica salva ao fechar o navegador.';
 window.MimiPractice.invalidate(id);
 const x=document.getElementById('customNotice');if(x)x.textContent=notice;
},true);
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||typeof page==='undefined'||page!=='pitch')return;
 if(b.dataset.mouthIndex!==undefined){e.preventDefault();e.stopPropagation();mouthIndex=Number(b.dataset.mouthIndex)||0;window.MimiPractice.refresh();}
 if(b.dataset.deleteWord){e.preventDefault();e.stopPropagation();const id=b.dataset.deleteWord;const old=recordings.get(id);if(old)URL.revokeObjectURL(old.url);recordings.delete(id);words.splice(words.findIndex(w=>w.id===id),1);persist();mouthIndex=0;window.MimiPractice.select('takai');}
 if(b.dataset.practiceWord)mouthIndex=0;
},true);
window.addEventListener('pagehide',()=>{for(const f of recordings.values())URL.revokeObjectURL(f.url);recordings.clear();});
})();