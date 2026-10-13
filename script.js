document.documentElement.classList.add('js-motion');

const revealItems = [...document.querySelectorAll('.reveal')];

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        activeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -35px 0px' });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const progress = document.querySelector('.page-progress span');
let scrollFrame = 0;

function updateProgress() {
  if (!progress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  scrollFrame = 0;
}

window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateProgress);
}, { passive: true });
updateProgress();
