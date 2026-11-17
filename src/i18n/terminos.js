// Términos de venta y reembolsos, en los 7 idiomas. Lo leen la app (panel del pie) y scripts/generar-paginas-seo.mjs
// (páginas públicas /terminos/<idioma>/, que Stripe pide al activar el cobro real). Es JavaScript simple a propósito.
// DEBE decir siempre lo que el servidor de cobro realmente hace (pagos/src/index.js): pase de 30 días desde el primer
// audio de pago, 30 días para empezarlo, hasta 2 teléfonos, reembolso solo si no se ha usado.
// AVISO: borrador redactado sin abogado; conviene que lo revise una persona con conocimientos legales antes de cobrar.

export const CONTACT = 'contacto@xolotli.com';
export const SELLER = 'Alberto Rabell';
export const TERMS_UPDATED = '2026-11';

/** @type {Record<string, {label: string, title: string, intro: string, blocks: [string, string][], seller: string, updated: string}>} */
export const TERMS = {
  es: {
    label: 'Términos y reembolsos',
    title: 'Términos de venta y reembolsos',
    intro: 'Esto es lo que compras y cómo pedir tu dinero de vuelta. Lo escribimos sin letras chiquitas.',
    blocks: [
      ['Qué es y quién lo vende', `Xolotli es la marca de estas audioguías. Si tienes cualquier duda sobre una compra, escribe a ${CONTACT}.`],
      ['Qué compras', 'Un pase da acceso a todas las paradas de pago del sitio (o de los sitios) que indica al comprarlo, con texto y audio en los idiomas disponibles, en hasta 2 teléfonos. Las paradas marcadas como gratis no necesitan pase.'],
      ['Cuánto dura', 'El pase dura 30 días desde la primera vez que escuchas o lees una parada de pago. Tienes 30 días desde la compra para empezar a usarlo; si no lo empiezas en ese plazo, vence sin usarse.'],
      ['Cómo se paga', 'El pago lo procesa Stripe. Ves el precio completo antes de pagar, en pesos mexicanos (MXN) si la app está en español y en dólares (USD) en los demás idiomas. Nosotros no vemos ni guardamos los datos de tu tarjeta.'],
      ['Reembolsos', `Si todavía no has usado el pase, es decir, no has escuchado ni leído ninguna parada de pago, puedes pedir el reembolso completo dentro de los 30 días siguientes a la compra. Escribe a ${CONTACT} desde el correo con el que pagaste. El dinero vuelve al mismo medio de pago y puede tardar varios días hábiles en verse, según tu banco. Una vez usado el pase no hay reembolso, salvo que la guía no funcione y no podamos arreglarlo: en ese caso escríbenos.`],
      ['Sin internet', 'Para activar el pase y descargar el contenido necesitas conexión. Una vez descargado, puedes usarlo sin internet mientras el pase esté vigente.'],
      ['Sobre el contenido', 'Cuidamos que los datos tengan fuente, pero pueden quedar errores. Los horarios, precios y reglas de cada sitio cambian: confírmalos en el sitio oficial. Las audioguías son para tu uso personal; no se pueden copiar ni revender.'],
    ],
    seller: `Vendedor: ${SELLER}.`,
    updated: 'Última actualización: noviembre de 2026.',
  },
  en: {
    label: 'Terms and refunds',
    title: 'Terms of sale and refunds',
    intro: 'This is what you are buying and how to get your money back. No fine print.',
    blocks: [
      ['What this is and who sells it', `Xolotli is the brand of these audio guides. If you have any question about a purchase, write to ${CONTACT}.`],
      ['What you buy', 'A pass gives access to all the paid stops of the site (or sites) shown when you buy it, with text and audio in the available languages, on up to 2 phones. Stops marked as free need no pass.'],
      ['How long it lasts', 'The pass lasts 30 days from the first time you listen to or read a paid stop. You have 30 days from the purchase to start using it; if you do not start within that time, it expires unused.'],
      ['How you pay', 'Payment is processed by Stripe. You see the full price before paying, in Mexican pesos (MXN) if the app is in Spanish and in US dollars (USD) in the other languages. We never see or store your card details.'],
      ['Refunds', `If you have not used the pass yet, meaning you have not listened to or read any paid stop, you can ask for a full refund within 30 days of the purchase. Write to ${CONTACT} from the email you paid with. The money goes back to the same payment method and may take several business days to show, depending on your bank. Once the pass has been used there is no refund, unless the guide does not work and we cannot fix it: in that case, write to us.`],
      ['Without internet', 'You need a connection to activate the pass and download the content. Once downloaded, you can use it without internet while the pass is valid.'],
      ['About the content', 'We make sure facts have a source, but mistakes can remain. Opening hours, prices and rules at each site change: confirm them on the official site. The audio guides are for your personal use and may not be copied or resold.'],
    ],
    seller: `Seller: ${SELLER}.`,
    updated: 'Last updated: November 2026.',
  },
  fr: {
    label: 'Conditions et remboursements',
    title: 'Conditions de vente et remboursements',
    intro: 'Voici ce que vous achetez et comment être remboursé. Sans petites lignes.',
    blocks: [
      ['De quoi il s’agit et qui vend', `Xolotli est la marque de ces audioguides. Pour toute question sur un achat, écrivez à ${CONTACT}.`],
      ['Ce que vous achetez', 'Un pass donne accès à toutes les étapes payantes du site (ou des sites) indiqué à l’achat, avec texte et audio dans les langues disponibles, sur 2 téléphones au plus. Les étapes marquées gratuites n’exigent aucun pass.'],
      ['Sa durée', 'Le pass dure 30 jours à partir de la première fois où vous écoutez ou lisez une étape payante. Vous avez 30 jours après l’achat pour commencer à l’utiliser ; passé ce délai, il expire sans avoir servi.'],
      ['Comment payer', 'Le paiement est traité par Stripe. Vous voyez le prix complet avant de payer, en pesos mexicains (MXN) si l’application est en espagnol et en dollars (USD) dans les autres langues. Nous ne voyons ni ne conservons les données de votre carte.'],
      ['Remboursements', `Si vous n’avez pas encore utilisé le pass, c’est-à-dire n’avez écouté ni lu aucune étape payante, vous pouvez demander un remboursement complet dans les 30 jours suivant l’achat. Écrivez à ${CONTACT} depuis l’adresse e-mail utilisée pour payer. L’argent retourne vers le même moyen de paiement et peut mettre plusieurs jours ouvrés à apparaître, selon votre banque. Une fois le pass utilisé, il n’y a pas de remboursement, sauf si le guide ne fonctionne pas et que nous ne pouvons pas le réparer : dans ce cas, écrivez-nous.`],
      ['Sans internet', 'Il faut une connexion pour activer le pass et télécharger le contenu. Une fois téléchargé, vous pouvez l’utiliser sans internet tant que le pass est valide.'],
      ['À propos du contenu', 'Nous veillons à ce que les informations aient une source, mais des erreurs peuvent subsister. Les horaires, prix et règles de chaque site changent : vérifiez-les sur le site officiel. Les audioguides sont réservés à votre usage personnel, sans copie ni revente.'],
    ],
    seller: `Vendeur : ${SELLER}.`,
    updated: 'Dernière mise à jour : novembre 2026.',
  },
  pl: {
    label: 'Regulamin i zwroty',
    title: 'Regulamin sprzedaży i zwroty',
    intro: 'Tu jest to, co kupujesz, i jak odzyskać pieniądze. Bez drobnego druku.',
    blocks: [
      ['Co to jest i kto sprzedaje', `Xolotli to marka tych audioprzewodników. W razie pytań o zakup napisz na ${CONTACT}.`],
      ['Co kupujesz', 'Karnet daje dostęp do wszystkich płatnych przystanków miejsca (lub miejsc) wskazanych przy zakupie, z tekstem i nagraniem w dostępnych językach, na maksymalnie 2 telefonach. Przystanki oznaczone jako bezpłatne nie wymagają karnetu.'],
      ['Jak długo działa', 'Karnet działa 30 dni od pierwszego odsłuchania lub przeczytania płatnego przystanku. Masz 30 dni od zakupu, aby zacząć z niego korzystać; jeśli nie zaczniesz w tym czasie, wygasa niewykorzystany.'],
      ['Jak płacisz', 'Płatność obsługuje Stripe. Pełną cenę widzisz przed zapłatą, w pesos meksykańskich (MXN), gdy aplikacja jest po hiszpańsku, i w dolarach (USD) w pozostałych językach. Nie widzimy ani nie przechowujemy danych twojej karty.'],
      ['Zwroty', `Jeśli jeszcze nie korzystałeś z karnetu, czyli nie odsłuchałeś ani nie przeczytałeś żadnego płatnego przystanku, możesz poprosić o pełny zwrot w ciągu 30 dni od zakupu. Napisz na ${CONTACT} z adresu e-mail, którym płaciłeś. Pieniądze wracają tą samą metodą płatności i mogą pojawić się po kilku dniach roboczych, zależnie od banku. Po wykorzystaniu karnetu zwrot nie przysługuje, chyba że przewodnik nie działa, a nie możemy tego naprawić: wtedy napisz do nas.`],
      ['Bez internetu', 'Do aktywacji karnetu i pobrania treści potrzebujesz połączenia. Po pobraniu możesz korzystać bez internetu, dopóki karnet jest ważny.'],
      ['O treści', 'Dbamy o to, by dane miały źródło, ale mogą zdarzyć się błędy. Godziny, ceny i zasady w każdym miejscu się zmieniają: sprawdź je na oficjalnej stronie. Audioprzewodniki służą do użytku osobistego i nie wolno ich kopiować ani odsprzedawać.'],
    ],
    seller: `Sprzedawca: ${SELLER}.`,
    updated: 'Ostatnia aktualizacja: listopad 2026.',
  },
  de: {
    label: 'Bedingungen und Erstattungen',
    title: 'Verkaufsbedingungen und Erstattungen',
    intro: 'Hier steht, was du kaufst und wie du dein Geld zurückbekommst. Ohne Kleingedrucktes.',
    blocks: [
      ['Worum es geht und wer verkauft', `Xolotli ist die Marke dieser Audioguides. Bei Fragen zu einem Kauf schreib an ${CONTACT}.`],
      ['Was du kaufst', 'Ein Pass gibt Zugang zu allen kostenpflichtigen Stationen des Ortes (oder der Orte), die beim Kauf angezeigt werden, mit Text und Audio in den verfügbaren Sprachen, auf bis zu 2 Handys. Als kostenlos markierte Stationen brauchen keinen Pass.'],
      ['Wie lange er gilt', 'Der Pass gilt 30 Tage ab dem ersten Mal, an dem du eine kostenpflichtige Station anhörst oder liest. Du hast 30 Tage ab dem Kauf, um ihn zu starten; sonst verfällt er ungenutzt.'],
      ['Wie du bezahlst', 'Die Zahlung wickelt Stripe ab. Den vollen Preis siehst du vor dem Bezahlen, in mexikanischen Pesos (MXN), wenn die App auf Spanisch ist, und in US-Dollar (USD) in den anderen Sprachen. Wir sehen und speichern deine Kartendaten nicht.'],
      ['Erstattungen', `Wenn du den Pass noch nicht benutzt hast, also keine kostenpflichtige Station angehört oder gelesen hast, kannst du innerhalb von 30 Tagen nach dem Kauf die volle Erstattung verlangen. Schreib an ${CONTACT} von der E-Mail-Adresse, mit der du bezahlt hast. Das Geld geht auf dieselbe Zahlungsart zurück und kann je nach Bank mehrere Werktage brauchen. Nach der Nutzung des Passes gibt es keine Erstattung, außer der Guide funktioniert nicht und wir können es nicht beheben: Dann schreib uns.`],
      ['Ohne Internet', 'Zum Aktivieren des Passes und zum Herunterladen brauchst du eine Verbindung. Danach kannst du ihn ohne Internet nutzen, solange der Pass gültig ist.'],
      ['Zu den Inhalten', 'Wir achten darauf, dass Angaben eine Quelle haben, aber Fehler können vorkommen. Öffnungszeiten, Preise und Regeln der Orte ändern sich: Bitte prüfe sie auf der offiziellen Seite. Die Audioguides sind für den persönlichen Gebrauch und dürfen nicht kopiert oder weiterverkauft werden.'],
    ],
    seller: `Verkäufer: ${SELLER}.`,
    updated: 'Zuletzt aktualisiert: November 2026.',
  },
  pt: {
    label: 'Termos e reembolsos',
    title: 'Termos de venda e reembolsos',
    intro: 'Aqui está o que você compra e como pedir seu dinheiro de volta. Sem letras miúdas.',
    blocks: [
      ['O que é e quem vende', `Xolotli é a marca destes audioguias. Se tiver qualquer dúvida sobre uma compra, escreva para ${CONTACT}.`],
      ['O que você compra', 'Um passe dá acesso a todas as paradas pagas do local (ou dos locais) indicados na compra, com texto e áudio nos idiomas disponíveis, em até 2 celulares. As paradas marcadas como gratuitas não precisam de passe.'],
      ['Quanto dura', 'O passe dura 30 dias a partir da primeira vez que você ouve ou lê uma parada paga. Você tem 30 dias a partir da compra para começar a usá-lo; se não começar nesse prazo, ele expira sem uso.'],
      ['Como pagar', 'O pagamento é processado pela Stripe. Você vê o preço completo antes de pagar, em pesos mexicanos (MXN) se o app estiver em espanhol e em dólares (USD) nos outros idiomas. Nós não vemos nem guardamos os dados do seu cartão.'],
      ['Reembolsos', `Se você ainda não usou o passe, isto é, não ouviu nem leu nenhuma parada paga, pode pedir o reembolso total em até 30 dias após a compra. Escreva para ${CONTACT} a partir do e-mail com que pagou. O dinheiro volta para a mesma forma de pagamento e pode levar vários dias úteis para aparecer, conforme o seu banco. Depois de usado o passe não há reembolso, a menos que o guia não funcione e não consigamos consertar: nesse caso, escreva para nós.`],
      ['Sem internet', 'Você precisa de conexão para ativar o passe e baixar o conteúdo. Depois de baixado, pode usá-lo sem internet enquanto o passe estiver válido.'],
      ['Sobre o conteúdo', 'Cuidamos para que os dados tenham fonte, mas podem restar erros. Horários, preços e regras de cada local mudam: confirme no site oficial. Os audioguias são para uso pessoal e não podem ser copiados nem revendidos.'],
    ],
    seller: `Vendedor: ${SELLER}.`,
    updated: 'Última atualização: novembro de 2026.',
  },
  it: {
    label: 'Termini e rimborsi',
    title: 'Termini di vendita e rimborsi',
    intro: 'Ecco cosa acquisti e come riavere i tuoi soldi. Senza clausole in piccolo.',
    blocks: [
      ['Cos’è e chi vende', `Xolotli è il marchio di queste audioguide. Per qualsiasi dubbio su un acquisto, scrivi a ${CONTACT}.`],
      ['Cosa acquisti', 'Un pass dà accesso a tutte le tappe a pagamento del sito (o dei siti) indicati all’acquisto, con testo e audio nelle lingue disponibili, su un massimo di 2 telefoni. Le tappe contrassegnate come gratuite non richiedono il pass.'],
      ['Quanto dura', 'Il pass dura 30 giorni dalla prima volta che ascolti o leggi una tappa a pagamento. Hai 30 giorni dall’acquisto per iniziare a usarlo; se non inizi entro quel termine, scade inutilizzato.'],
      ['Come si paga', 'Il pagamento è gestito da Stripe. Vedi il prezzo completo prima di pagare, in pesos messicani (MXN) se l’app è in spagnolo e in dollari (USD) nelle altre lingue. Non vediamo né conserviamo i dati della tua carta.'],
      ['Rimborsi', `Se non hai ancora usato il pass, cioè non hai ascoltato né letto nessuna tappa a pagamento, puoi chiedere il rimborso completo entro 30 giorni dall’acquisto. Scrivi a ${CONTACT} dall’e-mail con cui hai pagato. Il denaro torna allo stesso metodo di pagamento e può impiegare diversi giorni lavorativi ad apparire, a seconda della banca. Dopo l’uso del pass non c’è rimborso, a meno che la guida non funzioni e non riusciamo a risolverlo: in quel caso scrivici.`],
      ['Senza internet', 'Serve una connessione per attivare il pass e scaricare i contenuti. Una volta scaricati, puoi usarli senza internet finché il pass è valido.'],
      ['Sui contenuti', 'Ci assicuriamo che i dati abbiano una fonte, ma possono restare errori. Orari, prezzi e regole di ogni sito cambiano: confermali sul sito ufficiale. Le audioguide sono per uso personale e non possono essere copiate né rivendute.'],
    ],
    seller: `Venditore: ${SELLER}.`,
    updated: 'Ultimo aggiornamento: novembre 2026.',
  },
};

export const termsText = (lang) => TERMS[lang] || TERMS.es;
