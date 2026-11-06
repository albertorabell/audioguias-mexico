import type { SupportedLanguage } from './languages';

/**
 * Textos del formulario de contacto, del reporte de errores y de «¿Te gustó esta parada?».
 * El bloque `privacy` se agrega al aviso de privacidad: debe decir siempre lo que el formulario realmente guarda
 * (mensaje, y el correo solo si la persona lo escribe; 90 días; ver pagos/src/index.js, handleContact).
 */
export interface ContactoText {
  messageLabel: string;
  messagePlaceholder: string;
  emailLabel: string;
  emailHint: string;
  send: string;
  sending: string;
  sent: string;
  failed: string;
  badEmail: string;
  busy: string;
  orWrite: string;
  attached: (what: string) => string;
  reportBtn: string;
  reportTitle: string;
  reportPlaceholder: string;
  likeAsk: string;
  likeYes: string;
  likeNo: string;
  likeThanks: string;
  likeNoMore: string;
  privacy: [string, string];
}

const es: ContactoText = {
  messageLabel: 'Tu mensaje',
  messagePlaceholder: '¿Una duda, una idea, algo que corregir?',
  emailLabel: 'Tu correo (opcional)',
  emailHint: 'Solo si quieres que te respondamos. No lo usamos para nada más.',
  send: 'Enviar',
  sending: 'Enviando…',
  sent: 'Gracias, lo recibimos.',
  failed: 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.',
  badEmail: 'Ese correo no parece válido.',
  busy: 'Hoy recibimos muchos mensajes. Inténtalo mañana o escríbenos por correo.',
  orWrite: 'O escribe a',
  attached: (w) => `Se enviará con: ${w}`,
  reportBtn: 'Reportar un error',
  reportTitle: 'Reportar un error',
  reportPlaceholder: '¿Qué falló? Por ejemplo: el audio se corta, el texto dice algo distinto o la foto no es de esta parada.',
  likeAsk: '¿Te gustó esta parada?',
  likeYes: 'Sí',
  likeNo: 'No',
  likeThanks: 'Gracias por tu respuesta.',
  likeNoMore: '¿Quieres contarnos qué mejorar?',
  privacy: ['Si nos escribes', 'El formulario de «Contacto» y «Reportar un error» guarda el mensaje que escribes, el sitio, la parada y el idioma que veías y, solo si tú lo escribes, tu correo para responderte. Se borra a los 90 días. Las respuestas de «¿Te gustó esta parada?» son un conteo anónimo por parada, sin nada que te identifique.'],
};

const en: ContactoText = {
  messageLabel: 'Your message',
  messagePlaceholder: 'A question, an idea, something to fix?',
  emailLabel: 'Your email (optional)',
  emailHint: 'Only if you want a reply. We use it for nothing else.',
  send: 'Send',
  sending: 'Sending…',
  sent: 'Thank you, we got it.',
  failed: 'Could not send. Check your connection and try again.',
  badEmail: 'That email does not look valid.',
  busy: 'We got a lot of messages today. Try again tomorrow or email us.',
  orWrite: 'Or write to',
  attached: (w) => `Will be sent with: ${w}`,
  reportBtn: 'Report a problem',
  reportTitle: 'Report a problem',
  reportPlaceholder: 'What went wrong? For example: the audio cuts off, the text says something different, or the photo is not of this stop.',
  likeAsk: 'Did you like this stop?',
  likeYes: 'Yes',
  likeNo: 'No',
  likeThanks: 'Thanks for your answer.',
  likeNoMore: 'Want to tell us what to improve?',
  privacy: ['If you write to us', 'The “Contact” and “Report a problem” forms save the message you write, the site, stop and language you were viewing and, only if you type it, your email so we can reply. It is deleted after 90 days. The answers to “Did you like this stop?” are an anonymous count per stop, with nothing that identifies you.'],
};

const fr: ContactoText = {
  messageLabel: 'Votre message',
  messagePlaceholder: 'Une question, une idée, quelque chose à corriger ?',
  emailLabel: 'Votre e-mail (facultatif)',
  emailHint: 'Seulement si vous souhaitez une réponse. Nous ne l’utilisons pour rien d’autre.',
  send: 'Envoyer',
  sending: 'Envoi…',
  sent: 'Merci, nous l’avons reçu.',
  failed: 'Envoi impossible. Vérifiez votre connexion et réessayez.',
  badEmail: 'Cet e-mail ne semble pas valide.',
  busy: 'Nous avons reçu beaucoup de messages aujourd’hui. Réessayez demain ou écrivez-nous par e-mail.',
  orWrite: 'Ou écrivez à',
  attached: (w) => `Sera envoyé avec : ${w}`,
  reportBtn: 'Signaler un problème',
  reportTitle: 'Signaler un problème',
  reportPlaceholder: 'Qu’est-ce qui ne va pas ? Par exemple : l’audio se coupe, le texte dit autre chose ou la photo n’est pas celle de cette étape.',
  likeAsk: 'Cette étape vous a plu ?',
  likeYes: 'Oui',
  likeNo: 'Non',
  likeThanks: 'Merci pour votre réponse.',
  likeNoMore: 'Voulez-vous nous dire quoi améliorer ?',
  privacy: ['Si vous nous écrivez', 'Les formulaires « Contact » et « Signaler un problème » enregistrent le message que vous écrivez, le site, l’étape et la langue affichés et, seulement si vous le saisissez, votre e-mail pour vous répondre. Ils sont supprimés après 90 jours. Les réponses à « Cette étape vous a plu ? » sont un comptage anonyme par étape, sans rien qui vous identifie.'],
};

const pl: ContactoText = {
  messageLabel: 'Twoja wiadomość',
  messagePlaceholder: 'Pytanie, pomysł, coś do poprawienia?',
  emailLabel: 'Twój e-mail (opcjonalnie)',
  emailHint: 'Tylko jeśli chcesz otrzymać odpowiedź. Nie używamy go do niczego innego.',
  send: 'Wyślij',
  sending: 'Wysyłanie…',
  sent: 'Dziękujemy, wiadomość dotarła.',
  failed: 'Nie udało się wysłać. Sprawdź połączenie i spróbuj ponownie.',
  badEmail: 'Ten adres e-mail wygląda na nieprawidłowy.',
  busy: 'Dziś dostaliśmy bardzo dużo wiadomości. Spróbuj jutro lub napisz do nas e-mailem.',
  orWrite: 'Albo napisz na',
  attached: (w) => `Zostanie wysłane razem z: ${w}`,
  reportBtn: 'Zgłoś błąd',
  reportTitle: 'Zgłoś błąd',
  reportPlaceholder: 'Co poszło nie tak? Na przykład: audio się urywa, tekst mówi co innego albo zdjęcie nie przedstawia tego przystanku.',
  likeAsk: 'Czy ten przystanek ci się podobał?',
  likeYes: 'Tak',
  likeNo: 'Nie',
  likeThanks: 'Dziękujemy za odpowiedź.',
  likeNoMore: 'Chcesz napisać, co poprawić?',
  privacy: ['Jeśli do nas piszesz', 'Formularze „Kontakt” i „Zgłoś błąd” zapisują wiadomość, którą piszesz, miejsce, przystanek i język, który widziałeś, oraz — tylko jeśli go wpiszesz — twój e-mail, aby odpowiedzieć. Są usuwane po 90 dniach. Odpowiedzi na „Czy ten przystanek ci się podobał?” to anonimowy licznik dla każdego przystanku, bez niczego, co by cię identyfikowało.'],
};

const de: ContactoText = {
  messageLabel: 'Deine Nachricht',
  messagePlaceholder: 'Eine Frage, eine Idee, etwas zu korrigieren?',
  emailLabel: 'Deine E-Mail (optional)',
  emailHint: 'Nur, wenn du eine Antwort möchtest. Wir verwenden sie für nichts anderes.',
  send: 'Senden',
  sending: 'Wird gesendet…',
  sent: 'Danke, wir haben es erhalten.',
  failed: 'Senden nicht möglich. Prüfe deine Verbindung und versuche es erneut.',
  badEmail: 'Diese E-Mail-Adresse scheint ungültig.',
  busy: 'Heute haben wir viele Nachrichten bekommen. Versuche es morgen erneut oder schreibe uns eine E-Mail.',
  orWrite: 'Oder schreibe an',
  attached: (w) => `Wird gesendet mit: ${w}`,
  reportBtn: 'Fehler melden',
  reportTitle: 'Fehler melden',
  reportPlaceholder: 'Was ist schiefgelaufen? Zum Beispiel: Das Audio bricht ab, der Text sagt etwas anderes oder das Foto gehört nicht zu dieser Station.',
  likeAsk: 'Hat dir diese Station gefallen?',
  likeYes: 'Ja',
  likeNo: 'Nein',
  likeThanks: 'Danke für deine Antwort.',
  likeNoMore: 'Möchtest du uns sagen, was wir verbessern können?',
  privacy: ['Wenn du uns schreibst', 'Die Formulare „Kontakt“ und „Fehler melden“ speichern deine Nachricht, den angezeigten Ort, die Station und die Sprache und – nur wenn du sie eingibst – deine E-Mail-Adresse für die Antwort. Sie werden nach 90 Tagen gelöscht. Die Antworten auf „Hat dir diese Station gefallen?“ sind eine anonyme Zählung pro Station, ohne etwas, das dich identifiziert.'],
};

const pt: ContactoText = {
  messageLabel: 'Sua mensagem',
  messagePlaceholder: 'Uma dúvida, uma ideia, algo a corrigir?',
  emailLabel: 'Seu e-mail (opcional)',
  emailHint: 'Só se quiser uma resposta. Não usamos para mais nada.',
  send: 'Enviar',
  sending: 'Enviando…',
  sent: 'Obrigado, recebemos.',
  failed: 'Não foi possível enviar. Verifique sua conexão e tente de novo.',
  badEmail: 'Esse e-mail não parece válido.',
  busy: 'Hoje recebemos muitas mensagens. Tente amanhã ou escreva por e-mail.',
  orWrite: 'Ou escreva para',
  attached: (w) => `Será enviado com: ${w}`,
  reportBtn: 'Informar um erro',
  reportTitle: 'Informar um erro',
  reportPlaceholder: 'O que deu errado? Por exemplo: o áudio corta, o texto diz algo diferente ou a foto não é desta parada.',
  likeAsk: 'Você gostou desta parada?',
  likeYes: 'Sim',
  likeNo: 'Não',
  likeThanks: 'Obrigado pela resposta.',
  likeNoMore: 'Quer contar o que melhorar?',
  privacy: ['Se você nos escreve', 'Os formulários “Contato” e “Informar um erro” guardam a mensagem que você escreve, o local, a parada e o idioma que estava vendo e, só se você digitar, seu e-mail para responder. São apagados após 90 dias. As respostas de “Você gostou desta parada?” são uma contagem anônima por parada, sem nada que identifique você.'],
};

const it: ContactoText = {
  messageLabel: 'Il tuo messaggio',
  messagePlaceholder: 'Una domanda, un’idea, qualcosa da correggere?',
  emailLabel: 'La tua e-mail (facoltativa)',
  emailHint: 'Solo se vuoi una risposta. Non la usiamo per nient’altro.',
  send: 'Invia',
  sending: 'Invio…',
  sent: 'Grazie, l’abbiamo ricevuto.',
  failed: 'Invio non riuscito. Controlla la connessione e riprova.',
  badEmail: 'Questa e-mail non sembra valida.',
  busy: 'Oggi abbiamo ricevuto molti messaggi. Riprova domani o scrivici per e-mail.',
  orWrite: 'Oppure scrivi a',
  attached: (w) => `Verrà inviato con: ${w}`,
  reportBtn: 'Segnala un errore',
  reportTitle: 'Segnala un errore',
  reportPlaceholder: 'Cosa non va? Per esempio: l’audio si interrompe, il testo dice qualcosa di diverso o la foto non è di questa tappa.',
  likeAsk: 'Ti è piaciuta questa tappa?',
  likeYes: 'Sì',
  likeNo: 'No',
  likeThanks: 'Grazie per la risposta.',
  likeNoMore: 'Vuoi dirci cosa migliorare?',
  privacy: ['Se ci scrivi', 'I moduli «Contatto» e «Segnala un errore» salvano il messaggio che scrivi, il sito, la tappa e la lingua che stavi vedendo e, solo se lo digiti, la tua e-mail per risponderti. Vengono cancellati dopo 90 giorni. Le risposte a «Ti è piaciuta questa tappa?» sono un conteggio anonimo per tappa, senza nulla che ti identifichi.'],
};

const TEXTS: Partial<Record<SupportedLanguage, ContactoText>> = { es, en, fr, pl, de, pt, it };

export const contactoText = (lang: SupportedLanguage): ContactoText => TEXTS[lang] ?? en;
