// Prueba: nombres mexicanos dentro de texto en otros idiomas con Google Chirp 3 HD (voz Fenrir).
// A = texto tal cual · C = SSML con <phoneme ipa> · D = respeltado "a lo español" dentro del idioma
import fs from 'node:fs';
const KEY = process.env.GOOGLE_TTS_API_KEY;
if (!KEY) { console.error('Falta GOOGLE_TTS_API_KEY'); process.exit(1); }
const OUT = 'muestras-google/glosario';
fs.mkdirSync(OUT, { recursive: true });
const IPA = {
  'Teotihuacán': 'te.o.ti.wa.ˈkan', 'Chichén Itzá': 'tʃi.ˈtʃen i.ˈtsa', 'Monte Albán': 'ˈmon.te al.ˈβan',
  'Xipe Tótec': 'ˈʃi.pe ˈto.tek', 'Mexica': 'me.ˈʃi.ka', 'Tlatelolco': 'tla.te.ˈlol.ko', 'Tenochtitlan': 'te.notʃ.ˈtit.lan', 'Chalcatzingo': 'tʃal.ka.ˈtsin.go',
};
const T = {
  'en-US': 'In Mexico, visit Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco and Chalcatzingo, and meet the Mexica, who founded Tenochtitlan. Xipe Tótec was their god of spring.',
  'fr-FR': 'Au Mexique, visitez Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco et Chalcatzingo, et rencontrez les Mexica, qui fondèrent Tenochtitlan. Xipe Tótec était leur dieu du printemps.',
  'pl-PL': 'W Meksyku odwiedź Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco i Chalcatzingo oraz poznaj Mexica, którzy założyli Tenochtitlan. Xipe Tótec był ich bogiem wiosny.',
  'de-DE': 'Besuche in Mexiko Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco und Chalcatzingo und lerne die Mexica kennen, die Tenochtitlan gründeten. Xipe Tótec war ihr Frühlingsgott.',
  'it-IT': 'In Messico visita Teotihuacán, Chichén Itzá, Monte Albán, Tlatelolco e Chalcatzingo, e incontra i Mexica, che fondarono Tenochtitlan. Xipe Tótec era il loro dio della primavera.',
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ssml = (t) => { let o = esc(t); for (const [w, p] of Object.entries(IPA).sort((a, b) => b[0].length - a[0].length)) o = o.split(w).join(`<phoneme alphabet="ipa" ph="${p}">${w}</phoneme>`); return `<speak>${o}</speak>`; };
// Nombres escritos para que cualquier idioma los lea casi como en español
for (const [loc, texto] of Object.entries(T)) {
  const variants = [['A_normal', { text: texto }], ['C_ssml_ipa', { ssml: ssml(texto) }]];
  for (const [tag, input] of variants) {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input, voice: { languageCode: loc, name: `${loc}-Chirp3-HD-Fenrir` }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 } }),
    });
    if (!res.ok) { console.log('error', loc, tag, res.status, (await res.text()).slice(0, 300).replace(/\s+/g, ' ')); continue; }
    fs.writeFileSync(`${OUT}/${loc}_${tag}.mp3`, Buffer.from((await res.json()).audioContent, 'base64'));
    console.log('ok', loc, tag);
  }
}
