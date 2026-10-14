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

  document.querySelectorAll('.process-board').forEach(board => {
    const tabs = [...board.querySelectorAll('[role="tab"]')];
    const panels = [...board.querySelectorAll('[role="tabpanel"]')];
    function select(index, moveFocus = false) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      board.querySelectorAll('.edit-diagram.is-playing').forEach(resetTimeline);
      if (moveFocus) tabs[index].focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(next, true);
      });
    });
  });
  function resetTimeline(diagram) {
    diagram.classList.remove('is-playing');
    const button = diagram.querySelector('.timeline-toggle');
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '播放演示 ▷';
  }
  document.querySelectorAll('.timeline-toggle').forEach(button => {
    const diagram = button.closest('.edit-diagram');
    button.addEventListener('click', () => {
      if (reduce.matches) {
        button.textContent = '已显示剪辑顺序';
        return;
      }
      if (diagram.classList.contains('is-playing')) { resetTimeline(diagram); return; }
      diagram.classList.add('is-playing');
      button.setAttribute('aria-pressed', 'true');
      button.textContent = '停止演示 □';
    });
    diagram.querySelector('.timeline-playhead').addEventListener('animationend', () => {
      resetTimeline(diagram);
      button.textContent = '重播演示 ↻';
    });
  });

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
