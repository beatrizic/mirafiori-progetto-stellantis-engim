const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const elementi = document.querySelectorAll('.reveal');
  if (!elementi.length) return;
  if (prefersReducedMotion) {
    elementi.forEach((el) => el.classList.add('visibile'));
    return;
  }
  const osservatore = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visibile');
        osservatore.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  elementi.forEach((el) => osservatore.observe(el));
}

document.addEventListener('DOMContentLoaded', initReveal);

// Parallax leggero per gli elementi con data-parallax (usato nel banner quiz della home)
function initParallax() {
  const elementi = document.querySelectorAll('[data-parallax]');
  if (!elementi.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function aggiorna() {
    const scrollY = window.scrollY;
    elementi.forEach((el) => {
      const intensita = parseFloat(el.dataset.parallax) || 0.15;
      el.style.transform = `translateY(${scrollY * intensita * -0.3}px)`;
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(aggiorna);
      ticking = true;
    }
  }, { passive: true });
  aggiorna();
}

document.addEventListener('DOMContentLoaded', initParallax);
