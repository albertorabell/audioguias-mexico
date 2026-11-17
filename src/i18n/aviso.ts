import { PRIVACY } from './privacidad.js';
import type { SupportedLanguage } from './languages';

/**
 * Textos del pie de la pantalla principal: privacidad, quiénes somos y contacto.
 * Van aparte de los textos del resto de la app para poder cambiarlos sin tocar nada más.
 * IMPORTANTE: el aviso de privacidad debe decir siempre lo que la app realmente hace (ver src/utils/analytics.ts).
 */
export interface AvisoText {
  privacy: string;
  about: string;
  contact: string;
  share: string;
  shared: string;
  close: string;
  tagline: string;
  privacyTitle: string;
  privacyIntro: string;
  /** [título, texto] */
  privacyBlocks: [string, string][];
  privacyUpdated: string;
  aboutTitle: string;
  aboutBody: string[];
  contactTitle: string;
  contactBody: string;
  contactCta: string;
  shareText: string;
}

const es: AvisoText = {
  privacy: 'Privacidad',
  about: 'Quién hizo esta guía',
  contact: 'Contacto',
  share: 'Compartir la app',
  shared: 'Enlace copiado',
  close: 'Cerrar',
  tagline: 'Xolo · El camino de la historia',
  privacyTitle: PRIVACY.es.title,
  privacyIntro: PRIVACY.es.intro,
  privacyBlocks: PRIVACY.es.blocks as [string, string][],
  privacyUpdated: PRIVACY.es.updated,
  aboutTitle: 'Quién hizo esta guía',
  aboutBody: [
    'Esta guía la hizo un chilango (nacido a una pedrada del Ángel de la Independencia), decidido a presumir y mostrar todo lo que mi bello país tiene para ofrecer.',
    'Me ayudó mi maravillosa esposa y nos acompañan nuestra perrita y nuestra gatita. Soy amante incondicional de todos los tacos y salsas, y viajero de México y del mundo: entiendo lo que uno quiere ver y aprender sin gastar tanto.',
    'Gracias por apoyar mi pequeño proyecto. Si quieres sugerir un cambio o un sitio nuevo, reportar una falla, agradecer o solo saludar (o mentar la madre), escríbeme a contacto@xolotli.com. Toda la retroalimentación es bienvenida.',
    'Ojalá te guste. ¡Gracias! Xolo, el perro xoloitzcuintle del logo, es tu compañero de camino.',
  ],
  contactTitle: 'Contacto',
  contactBody: '¿Una duda, un dato que corregir o una idea para mejorar la app? Escríbenos y cuéntanos qué sitio y qué parada viste, y en qué teléfono.',
  contactCta: 'Escribir un correo',
  shareText: 'Xolo: tu audioguía de bolsillo para museos y zonas arqueológicas de México.',
};

const en: AvisoText = {
  privacy: 'Privacy',
  about: 'Who made this guide',
  contact: 'Contact',
  share: 'Share the app',
  shared: 'Link copied',
  close: 'Close',
  tagline: 'Xolo · The road through history',
  privacyTitle: PRIVACY.en.title,
  privacyIntro: PRIVACY.en.intro,
  privacyBlocks: PRIVACY.en.blocks as [string, string][],
  privacyUpdated: PRIVACY.en.updated,
  aboutTitle: 'Who made this guide',
  aboutBody: [
    'This guide was made by a chilango (what we call people from Mexico City), born a stone’s throw from the Angel of Independence, determined to show off everything my beautiful country has to offer.',
    'My wonderful wife helped me, and our little dog and little cat keep us company. I’m an unconditional lover of tacos and salsas, and a traveller of Mexico and the world: I know what you want to see and learn without spending too much.',
    'Thank you for supporting my small project. If you want to suggest a change or a new site, report a problem, say thanks or just say hello (or give me a piece of your mind), write to me at contacto@xolotli.com. All feedback is welcome.',
    'I hope you enjoy it. Thank you! Xolo, the xoloitzcuintle dog in the logo, is your travel companion.',
  ],
  contactTitle: 'Contact',
  contactBody: 'A question, a fact to correct or an idea to improve the app? Write to us and tell us which site and stop you saw, and on which phone.',
  contactCta: 'Write an email',
  shareText: 'Xolo: your pocket audio guide for museums and archaeological sites in Mexico.',
};

const fr: AvisoText = {
  privacy: 'Confidentialité',
  about: 'Qui a fait ce guide',
  contact: 'Contact',
  share: "Partager l'appli",
  shared: 'Lien copié',
  close: 'Fermer',
  tagline: "Xolo · Le chemin de l'histoire",
  privacyTitle: PRIVACY.fr.title,
  privacyIntro: PRIVACY.fr.intro,
  privacyBlocks: PRIVACY.fr.blocks as [string, string][],
  privacyUpdated: PRIVACY.fr.updated,
  aboutTitle: 'Qui a fait ce guide',
  aboutBody: [
    'Ce guide a été fait par un chilango (c’est ainsi qu’on appelle les habitants de Mexico), né à un jet de pierre de l’Ange de l’Indépendance, bien décidé à faire découvrir et à montrer fièrement tout ce que mon beau pays a à offrir.',
    'Ma merveilleuse épouse m’a aidé, et notre petite chienne et notre petite chatte nous tiennent compagnie. Je suis un amoureux inconditionnel des tacos et des salsas, et un voyageur du Mexique et du monde : je comprends ce qu’on veut voir et apprendre sans trop dépenser.',
    'Merci de soutenir mon petit projet. Pour suggérer un changement ou un nouveau site, signaler un problème, remercier, dire bonjour ou même m’envoyer promener, écrivez-moi à contacto@xolotli.com. Tous les retours sont les bienvenus.',
    'J’espère que vous l’aimerez. Merci ! Xolo, le chien xoloitzcuintle du logo, est votre compagnon de route.',
  ],
  contactTitle: 'Contact',
  contactBody: "Une question, une information à corriger ou une idée pour améliorer l'appli ? Écrivez-nous en indiquant le site, l'étape et le téléphone utilisé.",
  contactCta: 'Écrire un e-mail',
  shareText: "Xolo : votre audioguide de poche pour les musées et sites archéologiques du Mexique.",
};

const pl: AvisoText = {
  privacy: 'Prywatność',
  about: 'Kto stworzył ten przewodnik',
  contact: 'Kontakt',
  share: 'Udostępnij aplikację',
  shared: 'Skopiowano link',
  close: 'Zamknij',
  tagline: 'Xolo · Droga przez historię',
  privacyTitle: PRIVACY.pl.title,
  privacyIntro: PRIVACY.pl.intro,
  privacyBlocks: PRIVACY.pl.blocks as [string, string][],
  privacyUpdated: PRIVACY.pl.updated,
  aboutTitle: 'Kto stworzył ten przewodnik',
  aboutBody: [
    'Ten przewodnik stworzył chilango (tak nazywa się mieszkańców miasta Meksyk), urodzony o rzut kamieniem od Anioła Niepodległości, zdecydowany pochwalić się wszystkim, co moja piękna ojczyzna ma do zaoferowania.',
    'Pomagała mi moja cudowna żona, a towarzyszą nam nasza suczka i kotka. Jestem bezgranicznym miłośnikiem tacos i salsy oraz podróżnikiem po Meksyku i świecie: wiem, co chce się zobaczyć i czego dowiedzieć, nie wydając zbyt wiele.',
    'Dziękuję, że wspierasz mój mały projekt. Jeśli chcesz zaproponować zmianę lub nowe miejsce, zgłosić usterkę, podziękować, po prostu się przywitać (albo mnie zrugać), napisz do mnie: contacto@xolotli.com. Każda opinia jest mile widziana.',
    'Mam nadzieję, że ci się spodoba. Dziękuję! Xolo, pies xoloitzcuintle z logo, jest twoim towarzyszem w drodze.',
  ],
  contactTitle: 'Kontakt',
  contactBody: 'Pytanie, błąd w danych albo pomysł na ulepszenie aplikacji? Napisz i podaj, jakie miejsce i jaki przystanek oglądałeś oraz na jakim telefonie.',
  contactCta: 'Napisz e-mail',
  shareText: 'Xolo: kieszonkowy audioprzewodnik po muzeach i stanowiskach archeologicznych Meksyku.',
};

const de: AvisoText = {
  privacy: 'Datenschutz',
  about: 'Wer diesen Guide gemacht hat',
  contact: 'Kontakt',
  share: 'App teilen',
  shared: 'Link kopiert',
  close: 'Schließen',
  tagline: 'Xolo · Der Weg durch die Geschichte',
  privacyTitle: PRIVACY.de.title,
  privacyIntro: PRIVACY.de.intro,
  privacyBlocks: PRIVACY.de.blocks as [string, string][],
  privacyUpdated: PRIVACY.de.updated,
  aboutTitle: 'Wer diesen Guide gemacht hat',
  aboutBody: [
    'Diesen Guide hat ein Chilango gemacht (so nennt man die Leute aus Mexiko-Stadt), geboren keinen Steinwurf vom Engel der Unabhängigkeit entfernt, fest entschlossen, all das zu zeigen, was mein schönes Land zu bieten hat.',
    'Meine wunderbare Frau hat mir geholfen, und unsere kleine Hündin und unsere kleine Katze begleiten uns. Ich bin ein bedingungsloser Liebhaber von Tacos und Salsas und reise durch Mexiko und die Welt: Ich weiß, was man sehen und lernen möchte, ohne viel Geld auszugeben.',
    'Danke, dass du mein kleines Projekt unterstützt. Wenn du eine Änderung oder einen neuen Ort vorschlagen, einen Fehler melden, danke sagen oder einfach hallo sagen (oder mich zusammenstauchen) willst, schreib mir an contacto@xolotli.com. Jede Rückmeldung ist willkommen.',
    'Ich hoffe, es gefällt dir. Danke! Xolo, der Xoloitzcuintle-Hund im Logo, ist dein Begleiter unterwegs.',
  ],
  contactTitle: 'Kontakt',
  contactBody: 'Eine Frage, eine Korrektur oder eine Idee zur Verbesserung der App? Schreib uns und nenne den Ort, die Station und dein Telefon.',
  contactCta: 'E-Mail schreiben',
  shareText: 'Xolo: dein Audioguide für die Hosentasche für Museen und archäologische Stätten in Mexiko.',
};

const pt: AvisoText = {
  privacy: 'Privacidade',
  about: 'Quem fez este guia',
  contact: 'Contato',
  share: 'Compartilhar o app',
  shared: 'Link copiado',
  close: 'Fechar',
  tagline: 'Xolo · O caminho da história',
  privacyTitle: PRIVACY.pt.title,
  privacyIntro: PRIVACY.pt.intro,
  privacyBlocks: PRIVACY.pt.blocks as [string, string][],
  privacyUpdated: PRIVACY.pt.updated,
  aboutTitle: 'Quem fez este guia',
  aboutBody: [
    'Este guia foi feito por um chilango (como chamamos quem nasce na Cidade do México), nascido a uma pedrada do Anjo da Independência, decidido a mostrar com orgulho tudo o que o meu belo país tem a oferecer.',
    'Minha maravilhosa esposa me ajudou, e nossa cachorrinha e nossa gatinha nos fazem companhia. Sou apaixonado por todos os tacos e molhos, e viajante do México e do mundo: entendo o que a gente quer ver e aprender sem gastar muito.',
    'Obrigado por apoiar o meu pequeno projeto. Se você quiser sugerir uma mudança ou um lugar novo, relatar uma falha, agradecer ou só dar um oi (ou me xingar), escreva para contacto@xolotli.com. Todo retorno é bem-vindo.',
    'Espero que você goste. Obrigado! Xolo, o cachorro xoloitzcuintle do logotipo, é o seu companheiro de caminho.',
  ],
  contactTitle: 'Contato',
  contactBody: 'Uma dúvida, um dado a corrigir ou uma ideia para melhorar o app? Escreva e conte qual local e qual parada você viu, e em que celular.',
  contactCta: 'Escrever um e-mail',
  shareText: 'Xolo: seu audioguia de bolso para museus e zonas arqueológicas do México.',
};

const it: AvisoText = {
  privacy: 'Privacy',
  about: 'Chi ha fatto questa guida',
  contact: 'Contatto',
  share: 'Condividi l’app',
  shared: 'Link copiato',
  close: 'Chiudi',
  tagline: 'Xolo · Il cammino della storia',
  privacyTitle: PRIVACY.it.title,
  privacyIntro: PRIVACY.it.intro,
  privacyBlocks: PRIVACY.it.blocks as [string, string][],
  privacyUpdated: PRIVACY.it.updated,
  aboutTitle: 'Chi ha fatto questa guida',
  aboutBody: [
    'Questa guida l’ha fatta un chilango (così si chiamano gli abitanti di Città del Messico), nato a un tiro di schioppo dall’Angelo dell’Indipendenza, deciso a mostrare con orgoglio tutto ciò che il mio bel paese ha da offrire.',
    'Mi ha aiutato mia moglie, meravigliosa, e ci fanno compagnia la nostra cagnolina e la nostra gattina. Sono un amante incondizionato di tutti i tacos e le salse, e viaggiatore del Messico e del mondo: so cosa si vuole vedere e imparare senza spendere troppo.',
    'Grazie per sostenere il mio piccolo progetto. Se vuoi suggerire una modifica o un nuovo sito, segnalare un problema, ringraziare o solo salutare (o mandarmi a quel paese), scrivimi a contacto@xolotli.com. Ogni commento è benvenuto.',
    'Spero che ti piaccia. Grazie! Xolo, il cane xoloitzcuintle del logo, è il tuo compagno di viaggio.',
  ],
  contactTitle: 'Contatto',
  contactBody: 'Un dubbio, un dato da correggere o un’idea per migliorare l’app? Scrivici e raccontaci quale sito e quale tappa hai visto, e con quale telefono.',
  contactCta: 'Scrivi un’e-mail',
  shareText: 'Xolo: la tua audioguida tascabile per i musei e le zone archeologiche del Messico.',
};

const TEXTS: Partial<Record<SupportedLanguage, AvisoText>> = { es, en, fr, pl, de, pt, it };

/** Idiomas sin texto propio usan inglés. */
export const avisoText = (lang: SupportedLanguage): AvisoText => TEXTS[lang] ?? en;
