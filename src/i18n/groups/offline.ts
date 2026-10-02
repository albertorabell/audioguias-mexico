import { defineGroup } from '../define';

/** Descarga del recorrido para usar sin internet. */
export const offline = defineGroup(
  {
    readyTitle: 'Ruta lista sin conexión',
    downloadTitle: 'Descargar recorrido para uso sin internet',
    offlineBadge: 'Offline ✓',
    cachedDesc: (routeTitle?: string) =>
      routeTitle
        ? `Todas las explicaciones e imágenes de «${routeTitle}» están guardadas en tu dispositivo.`
        : 'Todas las explicaciones e imágenes están guardadas en tu dispositivo.',
    notCachedDesc: 'La señal móvil en las salas del MNA suele ser débil. Guarda la ruta con anticipación para usarla sin datos.',
    update: 'Actualizar',
    downloading: 'Descargando…',
    download: 'Descargar recorrido',
    clearTitle: 'Liberar almacenamiento sin conexión',
    savedLabel: 'Ruta guardada localmente',
    failed: 'No se pudo completar la descarga sin conexión.',
    unsupportedLabel: 'Este navegador no soporta el almacenamiento sin conexión',
    unsupportedMessage: 'Tu navegador no permite almacenamiento sin conexión.',
    starting: 'Iniciando descarga del recorrido…',
    downloadingFile: (name: string) => `Descargando: ${name}`,
    done: '¡Recorrido descargado y listo para usar sin señal!',
    errorLabel: 'Error al descargar los datos sin conexión',
    networkError: 'Error de red durante la descarga.',
  },
  {
    readyTitle: 'Route ready offline',
    downloadTitle: 'Download tour for use without internet',
    offlineBadge: 'Offline ✓',
    cachedDesc: (routeTitle?: string) =>
      routeTitle
        ? `All the explanations and images of “${routeTitle}” are saved on your device.`
        : 'All the explanations and images are saved on your device.',
    notCachedDesc: 'Mobile signal inside the museum rooms is often weak. Save the route ahead of time to use it without data.',
    update: 'Update',
    downloading: 'Downloading…',
    download: 'Download tour',
    clearTitle: 'Free up offline storage',
    savedLabel: 'Route saved locally',
    failed: 'The offline download could not be completed.',
    unsupportedLabel: 'This browser does not support offline storage',
    unsupportedMessage: 'Your browser does not allow offline storage.',
    starting: 'Starting tour download…',
    downloadingFile: (name: string) => `Downloading: ${name}`,
    done: 'Tour downloaded and ready to use without signal!',
    errorLabel: 'Error downloading offline data',
    networkError: 'Network error during the download.',
  }
);
