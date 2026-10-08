import { defineGroup } from '../define';

/** Descarga del recorrido para usar sin internet. */
export const offline = defineGroup(
  {
    readyTitle: 'Listo para usar sin internet',
    downloadTitle: 'Úsalo sin internet',
    offlineBadge: 'Offline ✓',
    cachedDesc: (routeTitle?: string) =>
      routeTitle
        ? `Todas las explicaciones e imágenes de «${routeTitle}» están guardadas en tu dispositivo.`
        : 'Todas las explicaciones e imágenes están guardadas en tu dispositivo.',
    notCachedDesc: 'Dentro de las salas la señal suele ser débil. Descarga las fotos y los audios antes de entrar.',
    audioSize: (files: number, mb: number) => `Incluye ${files} ${files === 1 ? 'audio' : 'audios'}${mb > 0 ? ` (unos ${mb} MB)` : ''}.`,
    update: 'Actualizar',
    downloading: 'Descargando…',
    download: 'Descargar',
    clearShort: 'Borrar',
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
    readyTitle: 'Ready to use without internet',
    downloadTitle: 'Use it without internet',
    offlineBadge: 'Offline ✓',
    cachedDesc: (routeTitle?: string) =>
      routeTitle
        ? `All the explanations and images of “${routeTitle}” are saved on your device.`
        : 'All the explanations and images are saved on your device.',
    notCachedDesc: 'The signal inside the rooms is often weak. Download the photos and audio before you go in.',
    audioSize: (files: number, mb: number) => `Includes ${files} audio ${files === 1 ? 'file' : 'files'}${mb > 0 ? ` (about ${mb} MB)` : ''}.`,
    update: 'Update',
    downloading: 'Downloading…',
    download: 'Download',
    clearShort: 'Remove',
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
    readyTitle: 'Prêt à utiliser sans internet',
    downloadTitle: 'Utilisez-le sans internet',
    offlineBadge: 'Hors ligne ✓',
    cachedDesc: (routeTitle?: string) =>
      routeTitle
        ? `Toutes les explications et les images de « ${routeTitle} » sont enregistrées sur votre appareil.`
        : 'Toutes les explications et les images sont enregistrées sur votre appareil.',
    notCachedDesc: 'Dans les salles, le signal est souvent faible. Téléchargez les photos et les audios avant d’entrer.',
    audioSize: (files: number, mb: number) => `Comprend ${files} ${files === 1 ? 'audio' : 'audios'}${mb > 0 ? ` (environ ${mb} Mo)` : ''}.`,
    update: 'Mettre à jour',
    downloading: 'Téléchargement…',
    download: 'Télécharger',
    clearShort: 'Supprimer',
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
