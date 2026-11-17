import { defineGroup } from '../define';

/**
 * Guía con flechas: señala los botones reales de la pantalla y dice qué hace cada uno.
 * `museum` son los pasos de la pantalla del museo (el orden va con IntroTour.tsx) y `piece` los de la ficha de una obra (PieceTour.tsx).
 */
export const intro = defineGroup(
  {
    openLabel: '¿Cómo se usa?',
    pieceOpenLabel: 'Ayuda: cómo se usa esta pantalla',
    dialogAria: 'Guía de uso',
    next: 'Siguiente',
    back: 'Anterior',
    skip: 'Omitir',
    close: 'Cerrar',
    done: 'Entendido',
    stepOf: (n: number, total: number) => `${n} de ${total}`,
    museum: [
      { title: 'Empieza aquí', text: 'Toca «Empezar recorrido» y la guía te lleva parada por parada, en el orden en que se camina.' },
      { title: 'Escucha o lee', text: 'En cada parada toca el botón verde para oír la historia. Lo que escuchas es lo mismo que lees.' },
      { title: 'Úsala sin internet', text: 'Donde casi no hay señal, descarga todo antes de entrar: toca aquí.' },
    ],
    piece: [
      { title: 'Toca aquí para escuchar', text: 'Este botón verde cuenta la historia de la obra. Tócalo otra vez para pausar. La barra se va llenando mientras suena.' },
      { title: 'Corta o completa', text: 'Elige aquí «Corta» para lo esencial o «Completa» para la historia entera. Puedes cambiar cuando quieras: lo que escuchas es lo mismo que lees.' },
      { title: 'Aquí puedes leer', text: 'Este es el texto de la obra. Si un nombre está subrayado, tócalo para ver esa otra obra sin perder tu lugar.' },
      { title: 'Siguiente obra', text: 'Esta flecha te lleva a la obra que sigue. La flecha de la izquierda regresa a la anterior.' },
      { title: 'Regresar', text: 'Toca esta flecha para volver a la sala.' },
      { title: 'Buscar', text: 'La lupa te deja buscar cualquier obra por su nombre, por la sala o por la cultura.' },
    ],
    configureRoute: 'Armar mi ruta ahora',
    explore: 'Explorar por mi cuenta',
  },
  {
    openLabel: 'How does it work?',
    pieceOpenLabel: 'Help: how to use this screen',
    dialogAria: 'How to use the guide',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    close: 'Close',
    done: 'Got it',
    stepOf: (n: number, total: number) => `${n} of ${total}`,
    museum: [
      { title: 'Start here', text: 'Tap “Start a tour” and the guide takes you stop by stop, in the order you walk.' },
      { title: 'Listen or read', text: 'At each stop, tap the green button to hear the story. What you hear is what you read.' },
      { title: 'Use it offline', text: 'Where there is almost no signal, download everything before you go in: tap here.' },
    ],
    piece: [
      { title: 'Tap here to listen', text: 'This green button tells the story of the work. Tap it again to pause. The bar fills up as it plays.' },
      { title: 'Short or full', text: 'Choose “Short” for the essentials or “Full” for the whole story. Switch whenever you like: what you hear is what you read.' },
      { title: 'Read it here', text: 'This is the text of the work. If a name is underlined, tap it to see that other work without losing your place.' },
      { title: 'Next work', text: 'This arrow takes you to the next work. The arrow on the left goes back to the previous one.' },
      { title: 'Go back', text: 'Tap this arrow to return to the room.' },
      { title: 'Search', text: 'The magnifier lets you search any work by name, room or culture.' },
    ],
    configureRoute: 'Build my route now',
    explore: 'Explore on my own',
  },
  {
    openLabel: 'Comment ça marche ?',
    pieceOpenLabel: 'Aide : comment utiliser cet écran',
    dialogAria: 'Comment utiliser le guide',
    next: 'Suivant',
    back: 'Précédent',
    skip: 'Passer',
    close: 'Fermer',
    done: 'Compris',
    stepOf: (n: number, total: number) => `${n} sur ${total}`,
    museum: [
      { title: 'Commencez ici', text: 'Touchez « Commencer un parcours » et le guide vous mène étape par étape, dans l’ordre de la marche.' },
      { title: 'Écoutez ou lisez', text: 'À chaque étape, touchez le bouton vert pour entendre l’histoire. Ce que vous entendez est ce que vous lisez.' },
      { title: 'Sans internet', text: 'Là où il n’y a presque pas de réseau, téléchargez tout avant d’entrer : touchez ici.' },
    ],
    piece: [
      { title: 'Touchez ici pour écouter', text: 'Ce bouton vert raconte l’histoire de l’œuvre. Touchez-le de nouveau pour mettre en pause. La barre se remplit pendant la lecture.' },
      { title: 'Courte ou complète', text: 'Choisissez « Courte » pour l’essentiel ou « Complète » pour toute l’histoire. Changez quand vous voulez : ce que vous entendez est ce que vous lisez.' },
      { title: 'Lisez ici', text: 'Voici le texte de l’œuvre. Si un nom est souligné, touchez-le pour voir cette autre œuvre sans perdre votre place.' },
      { title: 'Œuvre suivante', text: 'Cette flèche mène à l’œuvre suivante. La flèche de gauche revient à la précédente.' },
      { title: 'Revenir', text: 'Touchez cette flèche pour retourner à la salle.' },
      { title: 'Rechercher', text: 'La loupe permet de chercher une œuvre par son nom, sa salle ou sa culture.' },
    ],
    configureRoute: 'Composer mon parcours',
    explore: 'Explorer par moi-même',
  }
);
