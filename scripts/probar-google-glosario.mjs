// Prueba: nombres mexicanos dentro de texto en otros idiomas con Google Chirp 3 HD (voz Fenrir).
// A = texto tal cual · B = con pronunciaciones personalizadas IPA (customPronunciations).
import fs from 'node:fs';
const KEY = process.env.GOOGLE_TTS_API_KEY;
if (!KEY) { console.error('Falta GOOGLE_TTS_API_KEY'); process.exit(1); }
const OUT = 'muestras-google/glosario';
fs.mkdirSync(OUT, { recursive: true });

const IPA = {
  'Teotihuacán': 'te.o.ti.wa.ˈkan', 'Chichén Itzá': 'tʃi.ˈtʃen i.ˈt͡sa', 'Monte Albán': 'ˈmon.te al.ˈβan',
  'Xipe Tótec': 'ˈʃi.pe ˈto.tek', 'Mexica': 'me.ˈʃi.ka', 'Tlatelolco': 'tla.te.ˈlol.ko', 'Tenochtitlan': 'te.notʃ.ˈtit.lan', 'Chalcatzingo': 'tʃal.ka.ˈt͡sin.go',
};
const T = {
  'es-US': 'En México visita Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco y Chalcatzingo, y conoce a los Mexica, que fundaron Tenochtitlan. Xipe Tótec era su dios de la primavera.',
  'en-US': 'In Mexico, visit Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco and Chalcatzingo, and meet the Mexica, who founded Tenochtitlan. Xipe Tótec was their god of spring.',
  'fr-FR': 'Au Mexique, visitez Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco et Chalcatzingo, et rencontrez les Mexica, qui fondèrent Tenochtitlan. Xipe Tótec était leur dieu du printemps.',
  'pl-PL': 'W Meksyku odwiedź Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco i Chalcatzingo oraz poznaj Mexica, którzy założyli Tenochtitlan. Xipe Tótec był ich bogiem wiosny.',
  'de-DE': 'Besuche in Mexiko Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco und Chalcatzingo und lerne die Mexica kennen, die Tenochtitlan gründeten. Xipe Tótec war ihr Frühlingsgott.',
  'pt-BR': 'No México, visite Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco e Chalcatzingo, e conheça os Mexica, que fundaram Tenochtitlan. Xipe Tótec era o deus da primavera.',
  'it-IT': 'In Messico visita Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco e Chalcatzingo, e incontra i Mexica, che fondarono Tenochtitlan. Xipe Tótec era il loro dio della primavera.',
};
const prons = Object.entries(IPA).map(([phrase, pronunciation]) => ({ phrase, phoneticEncoding: 'PHONETIC_ENCODING_IPA', pronunciation }));
for (const [loc, texto] of Object.entries(T)) {
  for (const [tag, input] of [['A_normal', { text: texto }], ['B_ipa', { text: texto, customPronunciations: { pronunciations: prons } }]]) {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input, voice: { languageCode: loc, name: `${loc}-Chirp3-HD-Fenrir` }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 } }),
    });
    if (!res.ok) { console.log('error', loc, tag, res.status, (await res.text()).slice(0, 300).replace(/\s+/g, ' ')); continue; }
    fs.writeFileSync(`${OUT}/${loc}_${tag}.mp3`, Buffer.from((await res.json()).audioContent, 'base64'));
    console.log('ok', loc, tag);
  }
}
