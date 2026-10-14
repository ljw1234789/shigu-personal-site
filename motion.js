(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reading = document.querySelector('.method-section h2');
  let frame = 0;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  function drawScroll() {
    frame = 0;
    if (reduce.matches) return;
    const heading = reading.getBoundingClientRect();
    reading.style.setProperty('--reading-progress', `${clamp((innerHeight * .8 - heading.top) / (innerHeight * .55)) * 100}%`);
  }
  function scheduleScroll() { if (!frame) frame = requestAnimationFrame(drawScroll); }
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', scheduleScroll, { passive: true });
  drawScroll();
  reduce.addEventListener('change', scheduleScroll);

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
