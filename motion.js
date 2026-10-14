(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const sequence = document.querySelector('.motion-sequence');
  const screen = sequence.querySelector('.motion-screen');
  const pause = document.querySelector('#motion-toggle');
  const driftImages = [...document.querySelectorAll('.project-preview .preview-image')];
  const reading = document.querySelector('.method-section h2');
  let frame = 0;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  function drawScroll() {
    frame = 0;
    if (reduce.matches) return;
    const rect = sequence.getBoundingClientRect();
    const progress = clamp((16 - rect.top) / Math.max(1, sequence.offsetHeight - innerHeight));
    screen.style.setProperty('--showcase-scale', String(1 - progress * .43));
    sequence.style.setProperty('--outro-opacity', String(clamp((progress - .48) / .35)));
    if (innerWidth > 700) driftImages.forEach((image, index) => {
      const box = image.getBoundingClientRect();
      if (box.top < innerHeight && box.bottom > 0) {
        const amount = clamp((innerHeight * .5 - (box.top + box.height * .5)) / innerHeight, -.5, .5);
        image.style.setProperty('--image-drift', `${amount * (index === 1 ? -32 : 24)}px`);
      }
    });
    const heading = reading.getBoundingClientRect();
    reading.style.setProperty('--reading-progress', `${clamp((innerHeight * .8 - heading.top) / (innerHeight * .55)) * 100}%`);
  }
  function scheduleScroll() { if (!frame) frame = requestAnimationFrame(drawScroll); }
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', scheduleScroll, { passive: true });
  drawScroll();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      sequence.classList.toggle('is-inview', entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sequence);
  } else sequence.classList.add('is-inview');
  pause.addEventListener('click', () => {
    const paused = sequence.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.innerHTML = paused ? '继续动态 <span aria-hidden="true">▷</span>' : '暂停动态 <span aria-hidden="true">Ⅱ</span>';
  });
  function setMotionPreference() {
    pause.disabled = reduce.matches;
    if (reduce.matches) {
      screen.style.setProperty('--showcase-scale', '1');
      pause.textContent = '静态展示';
    } else {
      pause.innerHTML = sequence.classList.contains('is-paused') ? '继续动态 <span aria-hidden="true">▷</span>' : '暂停动态 <span aria-hidden="true">Ⅱ</span>';
      scheduleScroll();
    }
  }
  reduce.addEventListener('change', setMotionPreference);
  setMotionPreference();
  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('document-hidden', document.hidden));

  document.querySelectorAll('.project-preview, .tool-preview').forEach(card => {
    const target = card.querySelector('.preview-image') || card;
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduce.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      target.style.setProperty('--tilt-x', `${y * -3}deg`);
      target.style.setProperty('--tilt-y', `${x * 4}deg`);
    });
    card.addEventListener('pointerleave', () => {
      target.style.setProperty('--tilt-x', '0deg');
      target.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.querySelectorAll('.video-poster').forEach(poster => {
    poster.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduce.matches) return;
      const rect = poster.getBoundingClientRect();
      poster.style.setProperty('--pointer-x', `${clamp(event.clientX - rect.left, 48, rect.width - 48)}px`);
      poster.style.setProperty('--pointer-y', `${clamp(event.clientY - rect.top, 48, rect.height - 48)}px`);
    });
    poster.addEventListener('pointerleave', () => {
      poster.style.removeProperty('--pointer-x');
      poster.style.removeProperty('--pointer-y');
    });
  });
})();
