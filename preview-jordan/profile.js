window.PORTFOLIO_PROFILE = {
  "name": "刘俊威",
  "role": "短视频内容策划与剪辑",
  "wechat": "a2004liujunwei2026"
};

document.addEventListener('click',event=>{
  const copy=event.target.closest('[data-copy-wechat]');if(!copy)return;
  const manual=()=>{copy.textContent='请手动复制微信号';};
  if(!navigator.clipboard?.writeText)return manual();
  navigator.clipboard.writeText(window.PORTFOLIO_PROFILE.wechat).then(()=>{copy.textContent='微信号已复制 ✓';}).catch(manual);
});
