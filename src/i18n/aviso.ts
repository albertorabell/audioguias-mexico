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
  privacyTitle: 'Aviso de privacidad',
  privacyIntro: 'Xolo no usa cookies, no te pide crear una cuenta y no te sigue. Esto es lo único que medimos y por qué.',
  privacyBlocks: [
    ['Qué contamos', 'Conteos anónimos para mejorar la app: qué pantallas se abren, qué audios se escuchan y hasta dónde, en qué idioma, desde qué país y de qué tipo de enlace llegaste (buscador, QR, redes). El país lo deduce el servidor sin guardar tu dirección IP. Al cerrar la app se envía un resumen de la visita, por ejemplo «inicio, sala, ficha; 2 audios; 6 minutos». Ese resumen no lleva número de usuario ni nada que te identifique, y se borra a los 60 días.'],
    ['Qué no hacemos', 'No guardamos tu IP, tu nombre ni tu ubicación: el mapa usa el GPS solo dentro de tu teléfono y nunca lo envía. No usamos cookies, no te seguimos entre visitas ni entre sitios web, y no vendemos ni compartimos datos con anunciantes.'],
    ['Lo que guarda tu teléfono', 'Solo lo necesario para que la app funcione: tu idioma y tema, los audios que descargas para oírlos sin internet y, si compras un pase, un código de la compra y un código técnico de tu teléfono para reconocer el pase en hasta 2 teléfonos. No sirven para rastrearte.'],
    ['Pagos y tu correo', 'Los pagos los procesa Stripe, que tiene su propia política de privacidad y puede usar cookies en su página de pago. Nosotros no vemos ni guardamos los datos de tu tarjeta. Sí recibimos de Stripe el correo que escribes al pagar y lo guardamos junto a tu pase, solo para que puedas recuperarlo y para atender un reembolso. Se borra unos cuatro meses después de tu compra. Para enviarte el correo de recuperación usamos un servicio de envío de correos (Resend).'],
    ['Si nos escribes', 'Si nos escribes o dejas una opinión al terminar una ruta, guardamos lo que escribes, las estrellas, el sitio, la parada y el idioma que veías y, solo si tú lo escribes, tu correo para responderte. Se borra a los 90 días. Una opinión solo se publica si marcas el permiso, y siempre sin tu nombre.'],
    ['Tus derechos', 'Para saber qué guardamos de ti (el correo de tu compra o un mensaje tuyo), corregirlo, pedir que lo borremos u oponerte a su uso, escríbenos a contacto@xolotli.com. Los conteos anónimos no se pueden asociar a ti, así que no hay nada que consultar en ellos.'],
  ],
  privacyUpdated: 'Última actualización: noviembre de 2026.',
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
  privacyTitle: 'Privacy notice',
  privacyIntro: 'Xolo uses no cookies, asks you for no account and does not follow you around. This is all we measure, and why.',
  privacyBlocks: [
    ['What we count', 'Anonymous counts to improve the app: which screens are opened, which audios are played and how far, in which language, from which country and what kind of link brought you here (search engine, QR code, social media). The server works out the country without storing your IP address. When you close the app, a summary of the visit is sent, for example “home, room, stop; 2 audios; 6 minutes”. It carries no user number or anything that identifies you, and it is deleted after 60 days.'],
    ['What we do not do', 'We do not store your IP address, name or location: the map uses GPS only inside your phone and never sends it. We use no cookies, we do not follow you across visits or websites, and we do not sell or share data with advertisers.'],
    ['What your phone keeps', 'Only what the app needs to work: your language and theme, the audios you download to hear offline and, if you buy a pass, a purchase code and a technical code for your phone so the pass is recognised on up to 2 phones. They cannot be used to track you.'],
    ['Payments and your email', 'Payments are processed by Stripe, which has its own privacy policy and may use cookies on its payment page. We never see or store your card details. We do receive from Stripe the email you enter when you pay and keep it with your pass, only so you can recover it and so we can handle a refund. It is deleted about four months after your purchase. To send you the recovery email we use an email delivery service (Resend).'],
    ['If you write to us', 'If you write to us or leave a review after a route, we save what you write, the stars, the site, stop and language you were viewing and, only if you type it, your email so we can reply. It is deleted after 90 days. A review is only published if you tick the permission box, and always without your name.'],
    ['Your rights', 'To find out what we keep about you (your purchase email or a message of yours), correct it, ask us to delete it or object to its use, write to contacto@xolotli.com. The anonymous counts cannot be linked to you, so there is nothing to look up in them.'],
  ],
  privacyUpdated: 'Last updated: November 2026.',
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
  privacyTitle: 'Avis de confidentialité',
  privacyIntro: "Xolo n'utilise pas de cookies, ne demande pas de compte et ne vous suit pas. Voici ce que nous mesurons, et pourquoi.",
  privacyBlocks: [
    ['Ce que nous comptons', "Des comptages anonymes pour améliorer l'appli : quels écrans sont ouverts, quels audios sont écoutés et jusqu'où, dans quelle langue, depuis quel pays et par quel type de lien vous êtes arrivé (moteur de recherche, QR code, réseaux sociaux). Le serveur déduit le pays sans enregistrer votre adresse IP. À la fermeture de l'appli, un résumé de la visite est envoyé, par exemple « accueil, salle, fiche ; 2 audios ; 6 minutes ». Il ne contient aucun numéro d'utilisateur ni rien qui vous identifie, et il est supprimé après 60 jours."],
    ['Ce que nous ne faisons pas', "Nous n'enregistrons ni votre adresse IP, ni votre nom, ni votre position : la carte utilise le GPS uniquement dans votre téléphone et ne l'envoie jamais. Pas de cookies, pas de suivi entre les visites ou entre les sites, et nous ne vendons ni ne partageons de données avec des annonceurs."],
    ['Ce que garde votre téléphone', "Seulement ce qui est nécessaire au fonctionnement : votre langue et votre thème, les audios téléchargés pour l'écoute hors ligne et, si vous achetez un pass, un code d'achat et un code technique de votre téléphone pour reconnaître le pass sur 2 téléphones au maximum. Ils ne servent pas à vous suivre."],
    ['Paiements et votre e-mail', 'Les paiements sont traités par Stripe, qui a sa propre politique de confidentialité et peut utiliser des cookies sur sa page de paiement. Nous ne voyons ni ne conservons les données de votre carte. En revanche, nous recevons de Stripe l’e-mail saisi au paiement et le conservons avec votre pass, uniquement pour que vous puissiez le récupérer et pour traiter un remboursement. Il est supprimé environ quatre mois après votre achat. Pour vous envoyer l’e-mail de récupération, nous utilisons un service d’envoi d’e-mails (Resend).'],
    ['Si vous nous écrivez', 'Si vous nous écrivez ou laissez un avis à la fin d’un parcours, nous enregistrons ce que vous écrivez, les étoiles, le site, l’étape et la langue affichés et, seulement si vous le saisissez, votre e-mail pour vous répondre. Ces données sont supprimées après 90 jours. Un avis n’est publié que si vous cochez l’autorisation, et toujours sans votre nom.'],
    ['Vos droits', 'Pour savoir ce que nous conservons sur vous (l’e-mail de votre achat ou un message), le corriger, demander sa suppression ou vous opposer à son usage, écrivez à contacto@xolotli.com. Les comptages anonymes ne peuvent pas vous être associés : il n’y a donc rien à consulter.'],
  ],
  privacyUpdated: 'Dernière mise à jour : novembre 2026.',
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
  privacyTitle: 'Informacja o prywatności',
  privacyIntro: 'Xolo nie używa plików cookie, nie wymaga konta i cię nie śledzi. Oto wszystko, co mierzymy, i dlaczego.',
  privacyBlocks: [
    ['Co liczymy', 'Anonimowe liczniki, które pomagają ulepszać aplikację: jakie ekrany są otwierane, jakie nagrania są odtwarzane i do którego momentu, w jakim języku, z jakiego kraju i jakim rodzajem linku tu trafiłeś (wyszukiwarka, kod QR, media społecznościowe). Kraj ustala serwer, bez zapisywania twojego adresu IP. Po zamknięciu aplikacji wysyłane jest podsumowanie wizyty, np. „start, sala, karta; 2 nagrania; 6 minut”. Nie zawiera numeru użytkownika ani niczego, co cię identyfikuje, i jest usuwane po 60 dniach.'],
    ['Czego nie robimy', 'Nie zapisujemy adresu IP, imienia ani lokalizacji: mapa używa GPS tylko w twoim telefonie i nigdy go nie wysyła. Nie używamy plików cookie, nie śledzimy cię między wizytami ani stronami i nie sprzedajemy ani nie udostępniamy danych reklamodawcom.'],
    ['Co zapamiętuje telefon', 'Tylko to, co potrzebne do działania aplikacji: język i motyw, nagrania pobrane do słuchania offline oraz, jeśli kupisz karnet, kod zakupu i techniczny kod telefonu, aby rozpoznać karnet na maksymalnie 2 telefonach. Nie służą do śledzenia.'],
    ['Płatności i twój e-mail', 'Płatności obsługuje Stripe, który ma własną politykę prywatności i może używać plików cookie na swojej stronie płatności. Nie widzimy ani nie przechowujemy danych twojej karty. Otrzymujemy natomiast od Stripe e-mail wpisany przy płatności i przechowujemy go razem z karnetem, wyłącznie po to, byś mógł go odzyskać, i by obsłużyć zwrot. Jest usuwany około czterech miesięcy po zakupie. Do wysłania e-maila z odzyskiwaniem używamy usługi wysyłki poczty (Resend).'],
    ['Jeśli do nas piszesz', 'Jeśli do nas piszesz lub zostawiasz opinię po zakończeniu trasy, zapisujemy to, co napiszesz, gwiazdki, miejsce, przystanek i język, który widziałeś, oraz — tylko jeśli go wpiszesz — twój e-mail, aby odpowiedzieć. Dane są usuwane po 90 dniach. Opinia jest publikowana tylko wtedy, gdy zaznaczysz zgodę, i zawsze bez twojego imienia.'],
    ['Twoje prawa', 'Aby dowiedzieć się, co o tobie przechowujemy (e-mail z zakupu lub twoją wiadomość), poprawić to, poprosić o usunięcie albo sprzeciwić się wykorzystaniu, napisz na contacto@xolotli.com. Anonimowych liczników nie da się z tobą powiązać, więc nie ma w nich nic do sprawdzenia.'],
  ],
  privacyUpdated: 'Ostatnia aktualizacja: listopad 2026.',
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
  privacyTitle: 'Datenschutzhinweis',
  privacyIntro: 'Xolo verwendet keine Cookies, verlangt kein Konto und verfolgt dich nicht. Das ist alles, was wir messen, und warum.',
  privacyBlocks: [
    ['Was wir zählen', 'Anonyme Zählungen zur Verbesserung der App: welche Bildschirme geöffnet werden, welche Audios abgespielt werden und wie weit, in welcher Sprache, aus welchem Land und über welche Art von Link du gekommen bist (Suchmaschine, QR-Code, soziale Netzwerke). Das Land ermittelt der Server, ohne deine IP-Adresse zu speichern. Beim Schließen der App wird eine Zusammenfassung des Besuchs gesendet, z. B. „Start, Raum, Station; 2 Audios; 6 Minuten“. Sie enthält keine Nutzernummer und nichts, was dich identifiziert, und wird nach 60 Tagen gelöscht.'],
    ['Was wir nicht tun', 'Wir speichern weder deine IP-Adresse noch Namen oder Standort: Die Karte nutzt GPS nur auf deinem Telefon und sendet es nie. Wir verwenden keine Cookies, verfolgen dich nicht über Besuche oder Websites hinweg und verkaufen oder teilen keine Daten mit Werbetreibenden.'],
    ['Was dein Telefon speichert', 'Nur, was die App zum Funktionieren braucht: Sprache und Design, heruntergeladene Audios für den Offline-Betrieb und, wenn du einen Pass kaufst, ein Kaufcode und ein technischer Code deines Telefons, damit der Pass auf bis zu 2 Telefonen erkannt wird. Sie dienen nicht der Verfolgung.'],
    ['Zahlungen und deine E-Mail', 'Zahlungen wickelt Stripe ab, das eine eigene Datenschutzerklärung hat und auf seiner Bezahlseite Cookies verwenden kann. Wir sehen und speichern deine Kartendaten nicht. Wir erhalten von Stripe aber die E-Mail-Adresse, die du beim Bezahlen eingibst, und speichern sie zusammen mit deinem Pass, nur damit du ihn wiederherstellen kannst und wir eine Erstattung bearbeiten können. Sie wird etwa vier Monate nach dem Kauf gelöscht. Für die Wiederherstellungs-E-Mail nutzen wir einen E-Mail-Versanddienst (Resend).'],
    ['Wenn du uns schreibst', 'Wenn du uns schreibst oder nach einer Route eine Bewertung hinterlässt, speichern wir, was du schreibst, die Sterne, den angezeigten Ort, die Station und die Sprache und – nur wenn du sie eingibst – deine E-Mail-Adresse für die Antwort. Die Daten werden nach 90 Tagen gelöscht. Eine Bewertung wird nur veröffentlicht, wenn du das Häkchen setzt, und immer ohne deinen Namen.'],
    ['Deine Rechte', 'Um zu erfahren, was wir über dich speichern (die E-Mail deines Kaufs oder eine Nachricht von dir), es zu berichtigen, die Löschung zu verlangen oder der Nutzung zu widersprechen, schreib an contacto@xolotli.com. Die anonymen Zählungen lassen sich dir nicht zuordnen, es gibt dort also nichts nachzuschlagen.'],
  ],
  privacyUpdated: 'Zuletzt aktualisiert: November 2026.',
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
  privacyTitle: 'Aviso de privacidade',
  privacyIntro: 'O Xolo não usa cookies, não pede cadastro e não segue você. Isto é tudo o que medimos e por quê.',
  privacyBlocks: [
    ['O que contamos', 'Contagens anônimas para melhorar o app: quais telas são abertas, quais áudios são ouvidos e até onde, em que idioma, de que país e por que tipo de link você chegou (buscador, QR code, redes sociais). O servidor deduz o país sem guardar seu endereço IP. Ao fechar o app, é enviado um resumo da visita, por exemplo “início, sala, ficha; 2 áudios; 6 minutos”. Ele não leva número de usuário nem nada que identifique você e é apagado após 60 dias.'],
    ['O que não fazemos', 'Não guardamos seu IP, nome nem localização: o mapa usa o GPS só dentro do seu celular e nunca o envia. Não usamos cookies, não seguimos você entre visitas ou sites e não vendemos nem compartilhamos dados com anunciantes.'],
    ['O que seu celular guarda', 'Apenas o necessário para o app funcionar: idioma e tema, os áudios que você baixa para ouvir sem internet e, se comprar um passe, um código da compra e um código técnico do seu celular para reconhecer o passe em até 2 celulares. Eles não servem para rastrear você.'],
    ['Pagamentos e o seu e-mail', 'Os pagamentos são processados pela Stripe, que tem a sua própria política de privacidade e pode usar cookies na sua página de pagamento. Nós não vemos nem guardamos os dados do seu cartão. Recebemos da Stripe o e-mail que você digita ao pagar e o guardamos junto ao seu passe, só para que você possa recuperá-lo e para tratar um reembolso. Ele é apagado cerca de quatro meses após a compra. Para enviar o e-mail de recuperação usamos um serviço de envio de e-mails (Resend).'],
    ['Se você nos escreve', 'Se você nos escreve ou deixa uma opinião ao terminar uma rota, guardamos o que você escreve, as estrelas, o local, a parada e o idioma que estava vendo e, só se você digitar, seu e-mail para responder. Os dados são apagados após 90 dias. Uma opinião só é publicada se você marcar a permissão, e sempre sem o seu nome.'],
    ['Seus direitos', 'Para saber o que guardamos sobre você (o e-mail da compra ou uma mensagem sua), corrigir, pedir que apaguemos ou se opor ao uso, escreva para contacto@xolotli.com. As contagens anônimas não podem ser associadas a você, então não há nada para consultar nelas.'],
  ],
  privacyUpdated: 'Última atualização: novembro de 2026.',
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
  privacyTitle: 'Informativa sulla privacy',
  privacyIntro: 'Xolo non usa cookie, non ti chiede di creare un account e non ti segue. Questo è tutto ciò che misuriamo e perché.',
  privacyBlocks: [
    ['Cosa contiamo', 'Conteggi anonimi per migliorare l’app: quali schermate si aprono, quali audio si ascoltano e fino a che punto, in quale lingua, da quale paese e da che tipo di link sei arrivato (motore di ricerca, QR, social). Il paese lo deduce il server senza salvare il tuo indirizzo IP. Alla chiusura dell’app viene inviato un riepilogo della visita, per esempio «inizio, sala, scheda; 2 audio; 6 minuti». Quel riepilogo non contiene alcun numero utente né nulla che ti identifichi, e viene cancellato dopo 60 giorni.'],
    ['Cosa non facciamo', 'Non salviamo il tuo IP, il tuo nome né la tua posizione: la mappa usa il GPS solo dentro il tuo telefono e non lo invia mai. Non usiamo cookie, non ti seguiamo tra una visita e l’altra né tra siti web, e non vendiamo né condividiamo dati con gli inserzionisti.'],
    ['Cosa conserva il tuo telefono', 'Solo ciò che serve al funzionamento dell’app: la lingua e il tema, gli audio che scarichi per ascoltarli senza internet e, se acquisti un pass, un codice dell’acquisto e un codice tecnico del telefono per riconoscere il pass su un massimo di 2 telefoni. Non servono a rintracciarti.'],
    ['Pagamenti e la tua e-mail', 'I pagamenti sono gestiti da Stripe, che ha una propria informativa sulla privacy e può usare cookie sulla sua pagina di pagamento. Non vediamo né conserviamo i dati della tua carta. Riceviamo però da Stripe l’e-mail che inserisci al pagamento e la conserviamo insieme al tuo pass, solo perché tu possa recuperarlo e per gestire un rimborso. Viene cancellata circa quattro mesi dopo l’acquisto. Per inviarti l’e-mail di recupero usiamo un servizio di invio e-mail (Resend).'],
    ['Se ci scrivi', 'Se ci scrivi o lasci un’opinione al termine di un percorso, salviamo ciò che scrivi, le stelle, il sito, la tappa e la lingua che stavi vedendo e, solo se lo digiti, la tua e-mail per risponderti. I dati vengono cancellati dopo 90 giorni. Un’opinione viene pubblicata solo se spunti il permesso, e sempre senza il tuo nome.'],
    ['I tuoi diritti', 'Per sapere cosa conserviamo su di te (l’e-mail dell’acquisto o un tuo messaggio), correggerlo, chiederne la cancellazione o opporti al suo uso, scrivi a contacto@xolotli.com. I conteggi anonimi non possono essere associati a te, quindi non c’è nulla da consultare.'],
  ],
  privacyUpdated: 'Ultimo aggiornamento: novembre 2026.',
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
