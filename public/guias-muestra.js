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
  // guide_sample = el audio de verdad empezó a sonar; sample_tap = solo se tocó; sample_half = llegó a la mitad
  function contar(b, evento) {
    var api = b.getAttribute('data-api');
    if (!api || navigator.webdriver) return;
    try {
      var cuerpo = { e: evento || 'guide_sample', k: 'guia', l: b.getAttribute('data-lang') || undefined, s: b.getAttribute('data-site') || undefined, p: b.getAttribute('data-piece') || undefined };
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
    contar(b, 'sample_tap');
    audio = new Audio(b.getAttribute('data-src'));
    activo = b;
    var sono = false, mitad = false;
    audio.addEventListener('playing', function () { if (!sono) { sono = true; contar(b, 'guide_sample'); } });
    audio.addEventListener('timeupdate', function () {
      if (!mitad && audio.duration && audio.currentTime / audio.duration >= 0.5) { mitad = true; contar(b, 'sample_half'); }
    });
    audio.addEventListener('ended', function () { reposo(b); });
    audio.addEventListener('error', function () { reposo(b); });
    b.textContent = b.getAttribute('data-pause');
    b.setAttribute('aria-pressed', 'true');
    audio.play().catch(function () { reposo(b); });
  });
})();
