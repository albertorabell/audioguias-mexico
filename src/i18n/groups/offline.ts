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
    audioSize: (files: number, mb: number) => `Incluye ${files} ${files === 1 ? 'audio' : 'audios'}${mb > 0 ? ` (unos ${mb} MB)` : ''}.`,
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
    audioSize: (files: number, mb: number) => `Includes ${files} audio ${files === 1 ? 'file' : 'files'}${mb > 0 ? ` (about ${mb} MB)` : ''}.`,
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
  },
  {
    readyTitle: 'Parcours prêt hors ligne',
    downloadTitle: 'Télécharger le parcours pour l’utiliser sans internet',
    offlineBadge: 'Hors ligne ✓',
    cachedDesc: (routeTitle?: string) =>
      routeTitle
        ? `Toutes les explications et les images de « ${routeTitle} » sont enregistrées sur votre appareil.`
        : 'Toutes les explications et les images sont enregistrées sur votre appareil.',
    notCachedDesc: 'Le signal mobile dans les salles du MNA est souvent faible. Enregistrez le parcours à l’avance pour l’utiliser sans données.',
    audioSize: (files: number, mb: number) => `Comprend ${files} ${files === 1 ? 'audio' : 'audios'}${mb > 0 ? ` (environ ${mb} Mo)` : ''}.`,
    update: 'Mettre à jour',
    downloading: 'Téléchargement…',
    download: 'Télécharger le parcours',
    clearTitle: 'Libérer l’espace de stockage hors ligne',
    savedLabel: 'Parcours enregistré sur l’appareil',
    failed: 'Le téléchargement hors ligne n’a pas pu être terminé.',
    unsupportedLabel: 'Ce navigateur ne prend pas en charge le stockage hors ligne',
    unsupportedMessage: 'Votre navigateur n’autorise pas le stockage hors ligne.',
    starting: 'Démarrage du téléchargement du parcours…',
    downloadingFile: (name: string) => `Téléchargement : ${name}`,
    done: 'Parcours téléchargé et prêt à l’emploi sans réseau !',
    errorLabel: 'Erreur lors du téléchargement des données hors ligne',
    networkError: 'Erreur réseau pendant le téléchargement.',
  }
);
