(()=>{
 const video=document.querySelector('video'),label=document.querySelector('#transcript-label');if(!video||!label)return;
 const bar=document.createElement('div');bar.className='tools';const toggle=document.createElement('button'),source=document.createElement('a');
 toggle.type='button';source.textContent='完整机器转写记录 ↗';source.target='_blank';source.rel='noopener';bar.append(toggle,source);label.after(bar);
 let show=false;
 const selected=()=>window.YINGJUN_REVIEW_DATA.items.find(r=>new URL(r.media,location.href).href===video.src);
 function draw(){
  const r=selected();if(!r)return;
  toggle.textContent=show?'回到原声区间定位':'显示机器转写（未听审）';toggle.setAttribute('aria-pressed',String(show));
  source.href=r.machine_source;source.hidden=!r.machine_source;
  label.textContent=show?'以下为机器识别原文，尚未逐句原声听审，可能包含错字；不能作为已核实口述。':r.transcript_label;
  document.querySelectorAll('#transcript .line').forEach((line,i)=>{
   const segment=r.segments[i],text=line.querySelector('span:last-child');
   if(text)text.textContent=show?(r.machine_segments?.[i]?.text||segment.text):segment.text;
  });
 }
 toggle.addEventListener('click',()=>{show=!show;draw();});
 new MutationObserver(()=>{show=false;draw();}).observe(video,{attributes:true,attributeFilter:['src']});draw();
})();
