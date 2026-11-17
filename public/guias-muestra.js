// Botón «Escuchar 30 s» de las páginas de guía. Nunca arranca solo: solo suena cuando la persona lo toca.
(function () {
  var audio = null;
  var activo = null;
  function reposo(b) {
    if (!b) return;
    b.textContent = b.getAttribute('data-play');
    b.setAttribute('aria-pressed', 'false');
  }
  // Cuenta el toque en el servidor (solo un contador anónimo por día: sitio, pieza e idioma; sin IP ni identificador)
  function contar(b) {
    var api = b.getAttribute('data-api');
    if (!api || navigator.webdriver) return;
    try {
      var cuerpo = { e: 'guide_sample', l: b.getAttribute('data-lang') || undefined, s: b.getAttribute('data-site') || undefined, p: b.getAttribute('data-piece') || undefined };
      fetch(api + '/evento', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }).catch(function () {});
    } catch (e) {}
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
    contar(b);
    audio = new Audio(b.getAttribute('data-src'));
    activo = b;
    audio.addEventListener('ended', function () { reposo(b); });
    audio.addEventListener('error', function () { reposo(b); });
    b.textContent = b.getAttribute('data-pause');
    b.setAttribute('aria-pressed', 'true');
    audio.play().catch(function () { reposo(b); });
  });
})();
