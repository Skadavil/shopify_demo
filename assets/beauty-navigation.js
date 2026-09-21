document.addEventListener('toggle', (event) => {
  const target = event.target;
  if (!target.matches('.beauty-nav__item') || !target.open) return;
  target.closest('nav').querySelectorAll('.beauty-nav__item[open]').forEach(item => { if (item !== target) item.open = false; });
}, true);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const item = document.activeElement.closest('.beauty-nav__item[open], .beauty-mobile__toggle[open]');
  if (item) { item.open = false; item.querySelector('summary').focus(); }
});
document.addEventListener('click', event => {
  document.querySelectorAll('.beauty-nav__item[open], .beauty-mobile__toggle[open]').forEach(item => {
    if (!item.contains(event.target)) item.open = false;
  });
});
