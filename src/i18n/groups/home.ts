import { defineGroup } from '../define';

export const home = defineGroup(
  {
    langSelectAria: 'Selector de idioma',
    themeToMuseumTitle: 'Cambiar a Modo Museo (Salas)',
    themeToSunTitle: 'Cambiar a Modo Sol (Exterior)',
    heroTitle: 'Tu curador personal de bolsillo',
    comingSoon: 'Próximamente',
    explore: 'Explorar',
    siteSoonToast: (name: string) => `Próximamente: ${name} se encuentra en desarrollo.`,
  },
  {
    langSelectAria: 'Language selector',
    themeToMuseumTitle: 'Switch to Museum mode (rooms)',
    themeToSunTitle: 'Switch to Sun mode (outdoors)',
    heroTitle: 'Your personal pocket curator',
    comingSoon: 'Coming soon',
    explore: 'Explore',
    siteSoonToast: (name: string) => `Coming soon: ${name} is still in development.`,
  },
  {
    langSelectAria: 'Sélecteur de langue',
    themeToMuseumTitle: 'Passer en mode Musée (salles)',
    themeToSunTitle: 'Passer en mode Soleil (extérieur)',
    heroTitle: 'Votre conservateur personnel de poche',
    comingSoon: 'Bientôt',
    explore: 'Explorer',
    siteSoonToast: (name: string) => `Bientôt : ${name} est en cours de développement.`,
  }
);
