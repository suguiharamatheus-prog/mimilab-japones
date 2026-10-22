/* MimiLab v3 — YIN-based local pitch and timing analysis */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const median=values=>{if(!values.length)return 0;const z=values.slice().sort((a,b)=>a-b),m=z.length>>1;return z.length%2?z[m]:(z[m-1]+z[m])/2;};
function yin(frame,fs){
 const n=frame.length,maxTau=Math.min(Math.floor(fs/72),Math.floor(n/3)),minTau=Math.max(2,Math.floor(fs/480));if(maxTau<=minTau)return null;
 let mean=0,rms=0;for(let i=0;i<n;i++)mean+=frame[i];mean/=n;
 for(let i=0;i<n;i++){const v=frame[i]-mean;rms+=v*v;}
 rms=Math.sqrt(rms/n);if(rms<.004)return null;
 const size=n-maxTau,d=new Float64Array(maxTau+2),cmnd=new Float64Array(maxTau+2);
 for(let tau=1;tau<=maxTau;tau++){let s=0;for(let j=0;j<size;j++){const e=frame[j]-frame[j+tau];s+=e*e;}d[tau]=s;}
 let total=0;cmnd[0]=1;for(let tau=1;tau<=maxTau;tau++){total+=d[tau];cmnd[tau]=total>1e-10?d[tau]*tau/total:1;}
 let best=-1;for(let tau=minTau;tau<maxTau;tau++){if(cmnd[tau]<.16){while(tau+1<=maxTau&&cmnd[tau+1]<cmnd[tau])tau++;best=tau;break;}}
 if(best<0){let min=1;for(let tau=minTau;tau<=maxTau;tau++){if(cmnd[tau]<min){min=cmnd[tau];best=tau;}}if(min>.24)return null;}
 if(best<0)return null;
 const before=cmnd[best-1]??cmnd[best],mid=cmnd[best],after=cmnd[best+1]??mid,denom=before-2*mid+after;
 const offset=Math.abs(denom)>1e-10?clamp(.5*(before-after)/denom,-1,1):0,hz=fs/(best+offset);
 return Number.isFinite(hz)&&hz>=72&&hz<=480?{hz,confidence:clamp(1-mid,0,1)}:null;
}
function resample(data,sr){const f=Math.max(1,Math.round(sr/12000));if(f===1)return {data,fs:sr};const n=Math.floor(data.length/f),out=new Float32Array(n);for(let i=0;i<n;i++){let sum=0;for(let k=0;k<f;k++)sum+=data[i*f+k];out[i]=sum/f;}return {data:out,fs:sr/f};}
function analyze(data,sampleRate){
 if(!data||!sampleRate||data.length<sampleRate*.12)return {pitch:[],energy:[],duration:0,span:[0,0],voiced:0,signal:0};
 const {data:s,fs}=resample(data,sampleRate),hop=Math.max(1,Math.floor(fs*.03)),windowSize=Math.min(s.length,Math.floor(fs*.12)),energy=[],pitch=[];let peak=0;
 for(let pos=0;pos+windowSize<=s.length;pos+=hop){const f=s.subarray(pos,pos+windowSize);let power=0;for(let i=0;i<f.length;i++)power+=f[i]*f[i];const amp=Math.sqrt(power/f.length),t=(pos+windowSize/2)/fs;peak=Math.max(amp,peak);energy.push({t,amp});}
 if(!energy.length)return {pitch:[],energy:[],duration:0,span:[0,0],voiced:0,signal:0};
 const cutoff=Math.max(.004,peak*.10),active=energy.filter(p=>p.amp>=cutoff);
 if(!active.length)return {pitch:[],energy:[],duration:0,span:[0,0],voiced:0,signal:peak};
 const start=Math.max(0,active[0].t-.09),end=Math.min(s.length/fs,active[active.length-1].t+.09),duration=Math.max(0,end-start);
 let lastHz=null;
 for(let k=0;k<energy.length;k++){
  const e=energy[k];if(e.t<start||e.t>end)continue;const pos=k*hop,f=s.subarray(pos,pos+windowSize);
  if(e.amp<cutoff){pitch.push({t:e.t,hz:null});continue;}
  const detection=yin(f,fs);
  if(!detection||detection.confidence<.77){pitch.push({t:e.t,hz:null});continue;}
  let hz=detection.hz;if(lastHz){const ratio=hz/lastHz;if(ratio>1.85&&ratio<2.2)hz/=2;else if(ratio>.45&&ratio<.54)hz*=2;}lastHz=hz;
  pitch.push({t:e.t,hz,confidence:detection.confidence});
 }
 for(let i=1;i<pitch.length-1;i++){const a=pitch[i-1].hz,b=pitch[i].hz,c=pitch[i+1].hz;if(a&&b&&c&&Math.abs(12*Math.log2(b/Math.sqrt(a*c)))>4&&Math.abs(12*Math.log2(a/c))<2)pitch[i].hz=null;}
 const voiced=pitch.filter(p=>p.hz).length;
 return {energy:energy.filter(p=>p.t>=start&&p.t<=end),pitch,duration,span:[start,end],voiced,signal:peak,sampleRate:fs};
}
function pitchQuality(a){if(!a||a.duration<.16||a.voiced<5||a.signal<.004)return 'insufficient';const coverage=a.voiced/Math.max(1,a.pitch.length);return coverage<.2?'partial':'good';}
function normalize(a){
 if(!a||!a.duration)return {pitch:[],energy:[]};const heights=a.pitch.filter(p=>p.hz).map(p=>12*Math.log2(p.hz)),center=median(heights),span=a.span[1]-a.span[0]||1;
 return {pitch:a.pitch.map(p=>({x:clamp((p.t-a.span[0])/span,0,1),y:p.hz?clamp(12*Math.log2(p.hz)-center,-7,7):null})),energy:a.energy.map(p=>({x:clamp((p.t-a.span[0])/span,0,1),y:clamp(p.amp/Math.max(a.signal,.001),0,1)}))};
}
root.MimiPitchEngine={yin,analyze,pitchQuality,normalize,median};
})(typeof window!=='undefined'?window:globalThis);