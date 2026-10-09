import { defineGroup } from '../define';

/** Introducción que se muestra la primera vez que se entra a un museo (y se puede volver a ver). */
export const intro = defineGroup(
  {
    openLabel: '¿Cómo se usa?',
    dialogAria: 'Cómo usar la guía',
    next: 'Siguiente',
    skip: 'Omitir',
    close: 'Cerrar',
    stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
    steps: [
      { title: 'Bienvenido a tu guía de bolsillo', text: 'Párate frente a una obra, ábrela y escucha su historia. Te enseñamos en 30 segundos cómo moverte.' },
      { title: 'Elige por dónde empezar', text: 'Puedes seguir un recorrido ya armado o abrir las salas, piso por piso. Cada sala te muestra sus obras en el orden en que se recorren.' },
      { title: 'Escucha o lee', text: 'En cada obra toca «Escuchar». Hay una versión corta y una completa, y también puedes leer el texto. Los nombres subrayados abren otra obra sin perder tu lugar.' },
      { title: 'Cuatro pestañas abajo', text: 'Siempre las tienes a la mano para cambiar de sección.' },
      { title: 'Úsala sin internet', text: 'Dentro de las salas la señal suele ser débil. Al final de la pantalla del museo puedes descargar todo antes de entrar.' },
      { title: 'Arma tu ruta', text: 'Dinos cuánto tiempo tienes y qué te interesa, y te armamos el recorrido.' },
    ],
    configureRoute: 'Configurar mi ruta',
    explore: 'Explorar por mi cuenta',
  },
  {
    openLabel: 'How does it work?',
    dialogAria: 'How to use the guide',
    next: 'Next',
    skip: 'Skip',
    close: 'Close',
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    steps: [
      { title: 'Welcome to your pocket guide', text: 'Stand in front of a work, open it and listen to its story. Here is how to get around in 30 seconds.' },
      { title: 'Pick where to start', text: 'Follow a ready-made tour or open the rooms, floor by floor. Each room shows its works in the order you walk them.' },
      { title: 'Listen or read', text: 'On each work, tap “Listen”. There is a short and a full version, and you can read the text too. Underlined names open another work without losing your place.' },
      { title: 'Four tabs at the bottom', text: 'They are always within reach to switch sections.' },
      { title: 'Use it offline', text: 'Signal is often weak inside the rooms. At the bottom of the museum screen you can download everything before you go in.' },
      { title: 'Build your route', text: 'Tell us how much time you have and what interests you, and we will build your tour.' },
    ],
    configureRoute: 'Set up my route',
    explore: 'Explore on my own',
  },
  {
    openLabel: 'Comment ça marche ?',
    dialogAria: 'Comment utiliser le guide',
    next: 'Suivant',
    skip: 'Passer',
    close: 'Fermer',
    stepOf: (n: number, total: number) => `Étape ${n} sur ${total}`,
    steps: [
      { title: 'Bienvenue dans votre guide de poche', text: 'Placez-vous devant une œuvre, ouvrez-la et écoutez son histoire. Voici comment vous repérer en 30 secondes.' },
      { title: 'Choisissez par où commencer', text: 'Suivez un parcours tout prêt ou ouvrez les salles, étage par étage. Chaque salle présente ses œuvres dans l’ordre de la visite.' },
      { title: 'Écoutez ou lisez', text: 'Sur chaque œuvre, touchez « Écouter ». Il y a une version courte et une version complète, et vous pouvez aussi lire le texte. Les noms soulignés ouvrent une autre œuvre sans perdre votre place.' },
      { title: 'Quatre onglets en bas', text: 'Ils sont toujours à portée de main pour changer de section.' },
      { title: 'Utilisez-la sans internet', text: 'Le réseau est souvent faible dans les salles. En bas de l’écran du musée, vous pouvez tout télécharger avant d’entrer.' },
      { title: 'Composez votre parcours', text: 'Dites-nous combien de temps vous avez et ce qui vous intéresse, et nous composons la visite.' },
    ],
    configureRoute: 'Configurer mon parcours',
    explore: 'Explorer par moi-même',
  }
);
