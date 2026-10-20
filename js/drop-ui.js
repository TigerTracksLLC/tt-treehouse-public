// /drop: mobile quick dock. Shows once the hero is off screen, highlights the section you're in,
// and steps aside while you're on the upload card, the personals card or the footer.
(function () {
  var dock = document.getElementById('dock');
  if (!dock || !('IntersectionObserver' in window)) return;
  var links = dock.querySelectorAll('a[data-go]');
  var hero = document.getElementById('top');
  var hidden = new Set([hero]);
  function sync() { dock.classList.toggle('show', hidden.size === 0); }
  var hideObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) hidden.add(e.target); else hidden.delete(e.target); });
    sync();
  }, { threshold: 0.25 });
  [hero, document.getElementById('card'), document.querySelector('.slip'), document.querySelector('.foot')]
    .forEach(function (el) { if (el) hideObs.observe(el); });
  var secObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('on', a.dataset.go === e.target.id); });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  ['send', 'connect'].forEach(function (id) { var el = document.getElementById(id); if (el) secObs.observe(el); });
})();
