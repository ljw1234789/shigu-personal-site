(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('js-motion');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -16px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  const progress = document.querySelector('.nav-progress');
  const navigation = [...document.querySelectorAll('.floating-nav a')];
  const sections = navigation.map(link => document.querySelector(link.getAttribute('href')));
  let scrollFrame = 0;
  function updateScroll() {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, window.scrollY / distance) : 0})`;
    let current = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.4) current = index;
    });
    navigation.forEach((link, index) => {
      link.classList.toggle('active', index === current && current !== 0);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollFrame = 0;
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  const dialog = document.querySelector('.video-dialog');
  const player = dialog.querySelector('.video-player');
  const playerTitle = dialog.querySelector('#video-dialog-title');
  const originalLink = dialog.querySelector('.dialog-original');
  let lastTrigger = null;
  function sizePlayer() {
    player.style.setProperty('--player-scale', String(player.clientWidth / 1280));
  }
  document.querySelectorAll('[data-video]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.video;
      const title = button.dataset.title;
      if (!dialog.showModal) {
        window.open(`https://www.douyin.com/video/${id}`, '_blank', 'noopener');
        return;
      }
      lastTrigger = button;
      playerTitle.textContent = title;
      originalLink.href = `https://www.douyin.com/video/${id}`;
      const iframe = document.createElement('iframe');
      iframe.title = `毕导团队视频：${title}`;
      iframe.src = `https://open.douyin.com/player/video?vid=${id}&autoplay=0`;
      iframe.allow = 'fullscreen; autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'unsafe-url';
      player.replaceChildren(iframe);
      dialog.showModal();
      document.body.classList.add('dialog-open');
      sizePlayer();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    player.replaceChildren();
    document.body.classList.remove('dialog-open');
    lastTrigger?.focus({ preventScroll: true });
  });
  window.addEventListener('resize', () => {
    if (dialog.open) sizePlayer();
    updateScroll();
  }, { passive: true });
})();
