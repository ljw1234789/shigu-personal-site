(() => {
 const root=document.documentElement,curtain=document.getElementById('site-entrance');if(!curtain)return;
 if(!root.classList.contains('intro-pending')){curtain.remove();return}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),surfaces=[...document.querySelectorAll('.desktop-bar,[data-intro-surface]')];let finished=false;
 surfaces.forEach(el=>{el.inert=true;el.setAttribute('data-intro-inert','')});
 const finish=()=>{if(finished)return;finished=true;surfaces.forEach(el=>{el.inert=false;el.removeAttribute('data-intro-inert')});root.classList.remove('intro-pending','intro-running');curtain.remove();try{sessionStorage.setItem('ljw-intro-craft-20261029-final','seen')}catch{}document.removeEventListener('keydown',onKey);reduced.removeEventListener('change',finish)};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();finish()}};
 curtain.querySelector('button').addEventListener('click',finish);document.addEventListener('keydown',onKey);reduced.addEventListener('change',finish);addEventListener('pagehide',finish,{once:true});
 root.classList.add('intro-running');
 setTimeout(()=>{if(finished)return;const tiles=curtain.querySelector('.entrance-tiles');for(let i=0;i<160;i++){const tile=document.createElement('i');const col=i%16,row=Math.floor(i/16);tile.style.setProperty('--delay',`${(col*.016+row*.018+((i*7)%11)*.014).toFixed(3)}s`);tiles.append(tile)}curtain.classList.add('dissolving')},700);
 setTimeout(finish,1550);if(reduced.matches)finish();
})();
