// Botón «Escuchar 30 s» de las páginas de guía. Nunca arranca solo: solo suena cuando la persona lo toca.
(function () {
  var audio = null;
  var activo = null;
  function reposo(b) {
    if (!b) return;
    b.textContent = b.getAttribute('data-play');
    b.setAttribute('aria-pressed', 'false');
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.muestra-btn') : null;
    if (!b) return;
    if (audio && activo === b && !audio.paused) {
      audio.pause();
      reposo(b);
      return;
    }
    if (audio) {
      audio.pause();
      reposo(activo);
    }
    audio = new Audio(b.getAttribute('data-src'));
    activo = b;
    audio.addEventListener('ended', function () { reposo(b); });
    audio.addEventListener('error', function () { reposo(b); });
    b.textContent = b.getAttribute('data-pause');
    b.setAttribute('aria-pressed', 'true');
    audio.play().catch(function () { reposo(b); });
  });
})();
