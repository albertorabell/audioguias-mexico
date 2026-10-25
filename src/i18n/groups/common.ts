import { defineGroup } from '../define';
import type { SupportedLanguage } from '../languages';

export const common = defineGroup(
  {
    appName: 'Audioguía Xolo',
    editorialBadge: 'Contenido editorial de Audioguía Xolo',
    close: 'Cerrar',
    back: 'Atrás',
    loading: 'Cargando…',
    retry: 'Reintentar',
    understood: 'Entendido',
    free: 'Gratis',
    premium: 'Premium',
    museumName: 'Museo Nacional de Antropología',
    roomWord: 'Sala',
    languageNames: { es: 'español', en: 'inglés', fr: 'francés', pl: 'polaco', ru: 'ruso', ja: 'japonés' } as Record<SupportedLanguage, string>,
  },
  {
    appName: 'Audioguía Xolo',
    editorialBadge: 'Editorial content by Audioguía Xolo',
    close: 'Close',
    back: 'Back',
    loading: 'Loading…',
    retry: 'Try again',
    understood: 'Got it',
    free: 'Free',
    premium: 'Premium',
    museumName: 'National Museum of Anthropology',
    roomWord: 'Room',
    languageNames: { es: 'Spanish', en: 'English', fr: 'French', pl: 'Polish', ru: 'Russian', ja: 'Japanese' } as Record<SupportedLanguage, string>,
  },
  {
    appName: 'Audioguía Xolo',
    editorialBadge: 'Contenu éditorial d’Audioguía Xolo',
    close: 'Fermer',
    back: 'Retour',
    loading: 'Chargement…',
    retry: 'Réessayer',
    understood: 'Compris',
    free: 'Gratuit',
    premium: 'Premium',
    museumName: 'Musée national d’anthropologie',
    roomWord: 'Salle',
    languageNames: { es: 'espagnol', en: 'anglais', fr: 'français', pl: 'polonais', ru: 'russe', ja: 'japonais' } as Record<SupportedLanguage, string>,
  }
);
