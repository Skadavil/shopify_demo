document.addEventListener('click', event => {
 const button = event.target.closest('[data-bh-direction]');
 if (!button) return;
 const track = button.closest('.bh-products').querySelector('.bh-track');
 track.scrollBy({left: Number(button.dataset.bhDirection) * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
});
