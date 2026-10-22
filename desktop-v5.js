/* MimiLab 5 — responsive desktop experience and original illustrated mouth chart */
(function(){
 'use strict';
 const v4=window.MimiV4;
 if(!v4||typeof v4.mouth!=='function')return;
 const oldMouth=v4.mouth;
 function guideHTML(){
  const isWide=typeof matchMedia==='function'&&matchMedia('(min-width:800px)').matches;
  return '<section id="desktopMouthGuide" aria-label="Guia ilustrado das vogais japonesas">'+
   '<details class="guidePosterBox" '+(isWide?'open':'')+'>'+
   '<summary>👄 Guia visual completo — あ・い・う・え・お <span class="mini">5 vogais</span></summary>'+
   '<div class="guidePosterViewport"><img class="guidePosterImage" src="./guia-boca-japonesa.webp" alt="Cartaz com ilustrações das posições aproximadas da boca para as vogais japonesas a, i, u, e, o; observações sobre ん e っ." loading="lazy" decoding="async" width="1050" height="591"></div>'+
   '<p class="guideCaption">Compare as formas visuais das vogais e depois use o microfone para treinar. <a href="./guia-boca-japonesa.webp" target="_blank" rel="noopener">Abrir cartaz ampliado ↗</a></p>'+
   '<div class="guideWarning"><span aria-hidden="true">ⓘ</span><span><strong>Atenção:</strong> estas são ilustrações didáticas. O う japonês costuma ter os lábios relaxados, sem o arredondamento forte do “u” português; o ん pode mudar de articulação conforme o próximo som; e o っ é uma duração consonantal, não um gesto fixo dos lábios. Confirme sempre pelo áudio.</span></div>'+
   '</details></section>';
 }
 v4.mouth=function(){return oldMouth()+guideHTML()};
})();