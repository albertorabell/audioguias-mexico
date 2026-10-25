import { defineGroup } from '../define';

/** Plano del museo (ventana de mapa y dibujo del plano). */
export const map = defineGroup(
  {
    title: (siteName: string) => `Plano arquitectónico • ${siteName}`,
    subtitle: (routeName: string) => `${routeName} • Toca cualquier sala para ver sus obras`,
    closeAria: 'Cerrar mapa',
    zoomIn: 'Acercar mapa',
    zoomOut: 'Alejar mapa',
    center: 'Centrar plano',
    completed: 'Completada ✓',
    umbrella: 'EL PARAGUAS',
  },
  {
    title: (siteName: string) => `Floor plan • ${siteName}`,
    subtitle: (routeName: string) => `${routeName} • Tap any room to see its works`,
    closeAria: 'Close map',
    zoomIn: 'Zoom in on map',
    zoomOut: 'Zoom out of map',
    center: 'Center plan',
    completed: 'Completed ✓',
    umbrella: 'THE UMBRELLA',
  },
  {
    title: (siteName: string) => `Plan architectural • ${siteName}`,
    subtitle: (routeName: string) => `${routeName} • Touchez une salle pour voir ses œuvres`,
    closeAria: 'Fermer la carte',
    zoomIn: 'Zoomer sur la carte',
    zoomOut: 'Dézoomer la carte',
    center: 'Recentrer le plan',
    completed: 'Terminée ✓',
    umbrella: 'LE PARAPLUIE',
  }
);
