/* MimiLab 4 — saved manual words and articulatory mouth guide */
(function(){
'use strict';
const KEY='mimilab_v4_words';
const MAX_WORDS=50,MAX_AUDIO=16*1024*1024;
const safe=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
let words=[],fileRefs=new Map(),mouthStep=0,lastWord=null,notice='';
try{
 const stored=JSON.parse(localStorage.getItem(KEY)||'[]');
 if(Array.isArray(stored))words=stored.filter(w=>w&&/^manual-[a-z0-9-]+$/.test(w.id)&&typeof w.text==='string'&&typeof w.kana==='string')
 .slice(0,MAX_WORDS).map(w=>({id:w.id,text:w.text.slice(0,50),kana:w.kana.slice(0,70),pt:String(w.pt||'Sem tradução').slice(0,80),cat:'custom',hint:'Gravação de referência opcional.',url:''}));
}catch{}
const current=()=>window.MimiPractice?.selected?.()||'takai';
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(words.map(w=>({id:w.id,text:w.text,kana:w.kana,pt:w.pt}))))}
 catch(e){notice='Armazenamento cheio. Não foi possível guardar as palavras neste aparelho.';}
}
function refUrl(id){
 const r=fileRefs.get(id);
 if(r)return r.url;
 const word=words.find(w=>w.id===id);
 if(word)return '';
 const base=typeof WORDS!=='undefined'?WORDS.find(w=>w.id===id):null;
 return base?.url||'';
}
function customPanel(){
 const id=current(),isCustom=words.some(w=>w.id===id),hasReference=!!refUrl(id);
 const chips=words.length?'<div class="myWords">'+words.map(w=>
 '<button class="toggle '+(id===w.id?'active':'')+'" type="button" data-v4-select="'+safe(w.id)+'">'+safe(w.text)+'</button>').join('')+'</div>':'';
 return '<div class="card v4Card">'+
 '<div class="sectionbar" style="margin:0 0 6px"><h2>✍ Minha lista de palavras</h2><span class="mini">'+words.length+'/'+MAX_WORDS+'</span></div>'+
 '<p class="mini" style="line-height:1.6">Escolha uma palavra ou adicione a sua. Para analisar a entonação de uma palavra nova, adicione também uma gravação humana de referência.</p>'+
 '<form id="v4-add" class="v4Form">'+
 '<label>Palavra em japonês<input name="word" lang="ja" type="text" maxlength="50" placeholder="例：図書館" required autocomplete="off"></label>'+
 '<label>Leitura em kana<input name="reading" lang="ja" type="text" maxlength="70" placeholder="例：としょかん" required autocomplete="off"></label>'+
 '<label>Tradução (opcional)<input name="meaning" type="text" maxlength="80" placeholder="biblioteca" autocomplete="off"></label>'+
 '<button type="submit" class="btn">+ Adicionar para treinar</button></form>'+
 chips+
 (isCustom?'<div class="v4Selected">Sua palavra: <b>'+safe(words.find(w=>w.id===id)?.text)+'</b> <button type="button" data-v4-remove="'+safe(id)+'">Excluir</button></div>':'')+
 '<label class="v4FileLabel">🎧 Arquivo de áudio japonês (opcional)<input id="v4-ref-file" type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm"></label>'+
 '<div class="microStatus" id="v4-audio-message">'+
 (fileRefs.has(id)?'Áudio selecionado: '+safe(fileRefs.get(id).name)+'. Válido apenas até fechar/atualizar a página.':
 hasReference?'Esta palavra usa a gravação humana da biblioteca. Você pode substituí-la aqui.':
 'Sem áudio de referência: pode gravar sua própria voz, mas não há modelo para comparar a entonação.')+'</div>'+
 '<div class="mini" id="v4-message" role="status">'+safe(notice)+'</div></div>';
}
function kanaUnits(str){
 const hir=Array.from(String(str||'').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[\s　・]/g,''));
 const units=[];
 for(const c of hir){if('ゃゅょぁぃぅぇぉ'.includes(c)&&units.length&&!['っ','ん','ー'].includes(units[units.length-1]))units[units.length-1]+=c;
 else units.push(c);}
 return units.slice(0,40);
}
const vowelTable={
 a:'あかがさざただなはばぱまやらわぁゃ',
 i:'いきぎしじちぢにひびぴみりぃ',
 u:'うくぐすずつづぬふぶぷむゆるぅゅ',
 e:'えけげせぜてでねへべぺめれぇ',
 o:'おこごそぞとどのほぼぽもよろをぉょ'
};
function vowelOf(unit,previous,id){
 if(unit==='っ')return 'pause';
 if(unit==='ん')return 'nasal';
 if(unit==='ー')return previous||'a';
 const last=Array.from(unit).pop();
 let found='a';for(const [v,row] of Object.entries(vowelTable))if(row.includes(last)){found=v;break;}
 if(unit==='う'&&previous==='o'&&['otousan','gakkou'].includes(id))return 'o';
 return found;
}
const articulation={
 a:['あ — a',116,68,'Abra bem a boca. Lábios relaxados; não aperte o maxilar.'],
 i:['い — i',132,18,'Abertura pequena, com os cantos ligeiramente estendidos. A língua fica alta na frente.'],
 u:['う — u',91,16,'Lábios relaxados ou discretamente comprimidos, sem o bico forte do “u” português.'],
 e:['え — e',120,36,'Abertura média; língua posicionada mais à frente.'],
 o:['お — o',92,44,'Abertura intermediária e arredondamento suave dos lábios.'],
 nasal:['ん — nasal',110,18,'A posição muda conforme o som seguinte; deixe o ar passar pelo nariz.'],
 pause:['っ — pausa consonantal',110,12,'Prepare a consoante seguinte e sustente a articulação por uma mora. Não significa fechar os lábios em todos os casos.']
};
function mouthSvg(info){
 const outerW=info[1]+23,outerH=Math.max(18,info[2]+20),insideW=info[1],insideH=Math.max(5,info[2]);
 const tongue=info===articulation.pause?'':'<ellipse cx="130" cy="'+(99+insideH*.20)+'" rx="'+(insideW*.32)+'" ry="'+Math.max(4,insideH*.15)+'" fill="#d98799" opacity=".85"/>';
 return '<svg viewBox="0 0 260 177" class="v4MouthSvg" role="img" aria-label="Desenho ilustrativo da boca, visão frontal: '+safe(info[0])+'">'+
 '<path d="M93 62 Q130 74 167 62" fill="none" stroke="#728aa2" stroke-width="2" opacity=".75"/>'+
 '<circle cx="61" cy="82" r="4" fill="#728aa2" opacity=".22"/><circle cx="199" cy="82" r="4" fill="#728aa2" opacity=".22"/>'+
 '<ellipse cx="130" cy="100" rx="'+outerW/2+'" ry="'+outerH/2+'" fill="#d38b99" stroke="#e6abb2" stroke-width="2.8"/>'+
 '<ellipse cx="130" cy="100" rx="'+insideW/2+'" ry="'+insideH/2+'" fill="#2d1729" stroke="#b96779" stroke-width="2"/>'+tongue+
 '<path d="M72 153 Q130 162 188 153" fill="none" stroke="#728aa2" stroke-width="1" opacity=".28"/></svg>';
}
function mouth(){
 const id=current(),w=(typeof WORDS!=='undefined'?WORDS.find(w=>w.id===id):null)||words.find(w=>w.id===id);
 if(!w)return '';
 if(lastWord!==id){mouthStep=0;lastWord=id;}
 const units=kanaUnits(w.kana),idx=Math.min(mouthStep,Math.max(0,units.length-1));
 const unit=units[idx]||'あ';
 let prev=null;for(let i=0;i<idx;i++){const a=vowelOf(units[i],prev,id);if(a!=='pause'&&a!=='nasal')prev=a;}
 const v=vowelOf(unit,prev,id),info=articulation[v];
 const moras=units.map((m,i)=>'<button type="button" class="v4Mora '+(i===idx?'active':'')+'" data-v4-mora="'+i+'" aria-pressed="'+(i===idx)+'">'+safe(m)+'</button>').join('');
 const special=id==='gakkou'&&unit==='う'?' Aqui o う prolonga o som お.':id==='otousan'&&unit==='う'?' Nesta palavra, おう forma uma vogal longa.':'';
 return '<div class="card v4MouthCard"><div class="sectionbar" style="margin:0"><h2>👄 Como posicionar a boca</h2><span class="mini">guia visual</span></div>'+
 '<p class="mini">Toque em cada parte da palavra. Este desenho representa apenas a abertura aproximada dos lábios, não a posição completa da língua ou de todas as consoantes.</p>'+
 '<div class="v4Moras">'+moras+'</div><div class="v4MouthLayout">'+mouthSvg(info)+
 '<div class="v4MouthText"><b>'+safe(info[0])+'</b><p>'+safe(info[3]+special)+'</p><span class="mini">'+safe(unit)+' · parte '+(idx+1)+'/'+units.length+'</span></div></div>'+
 '<p class="mini">A leitura escrita nem sempre revela todos os detalhes da articulação. Use a gravação como referência principal.</p></div>';
}
window.MimiV4={words,panel:customPanel,mouth,refUrl};
function showNotice(txt){notice=txt;const el=document.getElementById('v4-message');if(el)el.textContent=txt;}
document.addEventListener('submit',e=>{
 if(e.target?.id!=='v4-add')return;
 e.preventDefault();e.stopPropagation();
 const f=e.target;
 const text=String(f.elements.namedItem('word')?.value||'').trim();
 const reading=String(f.elements.namedItem('reading')?.value||'').trim();
 const pt=String(f.elements.namedItem('meaning')?.value||'').trim()||'Sem tradução';
 if(!text||!reading||! /^[\u3040-\u30ffー・\s　]+$/.test(reading)){showNotice('Use uma palavra japonesa e informe a leitura em hiragana ou katakana.');return;}
 if(words.length>=MAX_WORDS){showNotice('Limite de 50 palavras. Exclua uma antes de adicionar outra.');return;}
 const id='manual-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 const w={id,text,kana:reading,pt,cat:'custom',hint:'Você adicionou esta palavra. Para comparar o contorno, anexe uma gravação de referência.',url:''};
 words.push(w);save();notice='Palavra adicionada. Você já pode gravar sua voz; para comparar curvas, anexe um áudio.';
 if(window.MimiPractice)window.MimiPractice.select(id);
 else showNotice(notice);
},true);
window.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v4Select){e.preventDefault();e.stopPropagation();window.MimiPractice?.select?.(b.dataset.v4Select);}
 else if(b.dataset.v4Remove){e.preventDefault();e.stopPropagation();const id=b.dataset.v4Remove;
 if(!confirm('Excluir esta palavra da sua lista pessoal?'))return;
 const old=fileRefs.get(id);if(old){URL.revokeObjectURL(old.url);fileRefs.delete(id);}
 words=words.filter(w=>w.id!==id);window.MimiV4.words=words;save();notice='Palavra excluída.';
 if(current()===id)window.MimiPractice?.select?.('takai');else window.MimiPractice?.refresh?.();
 }else if(b.dataset.v4Mora!==undefined){e.preventDefault();e.stopPropagation();mouthStep=Number(b.dataset.v4Mora)||0;window.MimiPractice?.refresh?.();}
},true);
document.addEventListener('change',e=>{
 if(e.target?.id!=='v4-ref-file')return;
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>MAX_AUDIO){showNotice('Arquivo muito grande. Use áudio de até 16 MB.');return;}
 if(!f.type.startsWith('audio/')&&!/\.(wav|mp3|m4a|aac|ogg|webm)$/i.test(f.name)){showNotice('Escolha um arquivo de áudio.');return;}
 const id=current(),old=fileRefs.get(id);if(old)URL.revokeObjectURL(old.url);
 fileRefs.set(id,{url:URL.createObjectURL(f),name:f.name});
 notice='Áudio temporário carregado. Não será salvo junto com a palavra; após recarregar, selecione novamente.';
 if(window.MimiPractice?.invalidate)window.MimiPractice.invalidate(id);
 else window.MimiPractice?.refresh?.();
},true);
window.addEventListener('pagehide',()=>{for(const r of fileRefs.values())URL.revokeObjectURL(r.url);fileRefs.clear();});
const base=window.MimiPitchEngine?.normalize;
if(base&&window.MimiPitchEngine){
 window.MimiPitchEngine.normalize=function(data){
  const out=base(data);
  if(!out?.pitch||out.pitch.length<4)return out;
  const pitch=out.pitch.map((p,i,a)=>{
   if(p.y==null)return p;
   // Median of nearby voiced frames; never draw through voiceless gaps.
   const values=[];for(let j=Math.max(0,i-1);j<=Math.min(a.length-1,i+1);j++)if(a[j].y!=null)values.push(a[j].y);
   values.sort((x,y)=>x-y);
   return {...p,y:values[Math.floor(values.length/2)]};
  });
  return {...out,pitch};
 };
}
})();