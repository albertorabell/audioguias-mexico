// Prueba gratuita de voces de Google Cloud Text-to-Speech (Chirp 3 HD).
// Lista las voces disponibles por idioma y genera una muestra corta por voz.
// Uso: GOOGLE_TTS_API_KEY=... node scripts/probar-google-tts.mjs [--generar] [--voces=Charon,Orus]
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.GOOGLE_TTS_API_KEY;
if (!KEY) { console.error('Falta GOOGLE_TTS_API_KEY'); process.exit(1); }
const GENERAR = process.argv.includes('--generar');
const vArg = process.argv.find((a) => a.startsWith('--voces='));
const VOCES = (vArg ? vArg.slice(8) : 'Charon,Orus,Fenrir').split(',').map((s) => s.trim());
const OUT = 'muestras-google';

// Mismo fragmento (Piedra del Sol) en cada idioma; el español incluye nombres nahuas y mayas a propósito.
const TEXTOS = {
  'es-US': 'Estás frente a la Piedra del Sol, un disco de basalto de más de tres metros y medio de diámetro que pesa casi veinticinco toneladas. Se le llama «calendario azteca», pero los mexicas, que fundaron Tenochtitlan en 1325, nunca lo usaron para saber la fecha. En el centro está el rostro de Tonatiuh, el Sol, con la lengua en forma de cuchillo de pedernal. Cerca de aquí, en Chichén Itzá y en Xochicalco, otros pueblos como los mayas y los tlahuicas contaron el tiempo a su manera.',
  'es-MX': null, // se rellena con el de es-US si Google lo ofrece
  'en-US': 'You are standing in front of the Sun Stone, a basalt disc more than three and a half meters in diameter that weighs nearly twenty-five metric tons. It is called the “Aztec calendar,” but it was not used to tell the date: it is a sacred monument that tells how the world we live in was born. At the center is the face of Tonatiuh, the Sun, with his tongue shaped like a flint knife. It was carved toward the end of the empire and was found in 1790.',
  'fr-FR': 'Vous êtes face à la Pierre du Soleil, un disque de basalte de plus de trois mètres et demi de diamètre, qui pèse près de vingt-cinq tonnes. On l’appelle « calendrier aztèque », mais elle ne servait pas à connaître la date : c’est un monument sacré qui raconte comment est né le monde dans lequel nous vivons. Au centre se trouve le visage de Tonatiuh, le Soleil, dont la langue a la forme d’un couteau de silex. Elle a été sculptée vers la fin de l’empire et a été retrouvée en 1790.',
  'pl-PL': 'Stoisz przed Kamieniem Słońca, bazaltowym dyskiem o średnicy ponad trzech i pół metra, który waży blisko dwadzieścia pięć ton. Nazywa się go „kalendarzem azteckim”, ale nie służył do sprawdzania daty: to święty pomnik, który opowiada, jak narodził się świat, w którym żyjemy. W centrum widać twarz Tonatiuh, Słońca, z językiem w kształcie krzemiennego noża. Wyrzeźbiono go pod koniec imperium, a odnaleziono w 1790 roku.',
  'de-DE': 'Du stehst vor dem Sonnenstein, einer Basaltscheibe von mehr als dreieinhalb Metern Durchmesser, die etwa fünfundzwanzig Tonnen wiegt. Man nennt ihn „aztekischen Kalender“, doch er diente nicht dazu, das Datum zu erfahren: Er ist ein heiliges Monument, das erzählt, wie die Welt entstand, in der wir leben. In der Mitte befindet sich das Gesicht von Tonatiuh, der Sonne, mit einer Zunge in Form eines Feuersteinmessers. Der Stein wurde gegen Ende des Reiches gemeißelt und 1790 gefunden.',
  'pt-BR': 'Você está diante da Pedra do Sol, um disco de basalto com mais de três metros e meio de diâmetro e cerca de vinte e cinco toneladas. Ela é chamada de “calendário asteca”, mas não servia para saber a data: é um monumento sagrado que conta como nasceu o mundo em que vivemos. No centro está o rosto de Tonatiuh, o Sol, com a língua em forma de faca de sílex. Ela foi esculpida perto do fim do império e encontrada em 1790.',
  'it-IT': 'Sei davanti alla Pietra del Sole, un disco di basalto di oltre tre metri e mezzo di diametro che pesa circa venticinque tonnellate. Viene chiamata «calendario azteco», ma non serviva a sapere la data: è un monumento sacro che racconta come nacque il mondo in cui viviamo. Al centro c’è il volto di Tonatiuh, il Sole, con la lingua a forma di coltello di selce. Fu scolpita verso la fine dell’impero e fu ritrovata nel 1790.',
};
TEXTOS['es-MX'] = TEXTOS['es-US'];
TEXTOS['es-ES'] = TEXTOS['es-US'];

const base = 'https://texttospeech.googleapis.com/v1';
const r = await fetch(`${base}/voices?key=${KEY}`);
if (!r.ok) { console.error('voices', r.status, (await r.text()).slice(0, 400)); process.exit(1); }
const todas = (await r.json()).voices || [];
const chirp = todas.filter((v) => /Chirp3-HD/.test(v.name));
console.log(`Voces totales: ${todas.length} · Chirp 3 HD: ${chirp.length}`);
const porLoc = {};
for (const v of chirp) for (const l of v.languageCodes) (porLoc[l] ||= []).push(v.name.split('-').pop() + '(' + v.ssmlGender[0] + ')');
const interes = ['es-MX', 'es-US', 'es-ES', 'en-US', 'fr-FR', 'pl-PL', 'de-DE', 'pt-BR', 'pt-PT', 'it-IT', 'ru-RU', 'ja-JP'];
for (const l of interes) console.log(l.padEnd(6), porLoc[l] ? `${porLoc[l].length} voces: ${porLoc[l].join(' ')}` : 'SIN Chirp 3 HD');
const otras = {};
for (const v of todas) if (interes.includes(v.languageCodes[0]) && !/Chirp3-HD/.test(v.name)) { const t = v.name.split('-')[2]; (otras[v.languageCodes[0]] ||= new Set()).add(t); }
for (const l of interes) if (otras[l]) console.log(l.padEnd(6), 'otros tipos:', [...otras[l]].join(', '));

if (!GENERAR) process.exit(0);
fs.mkdirSync(OUT, { recursive: true });
const indice = ['# Muestras Google Chirp 3 HD', ''];
for (const [loc, texto] of Object.entries(TEXTOS)) {
  for (const nombre of VOCES) {
    const voz = `${loc}-Chirp3-HD-${nombre}`;
    if (!chirp.find((v) => v.name === voz)) { console.log('no existe', voz); continue; }
    const res = await fetch(`${base}/text:synthesize?key=${KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: { text: texto }, voice: { languageCode: loc, name: voz }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 } }),
    });
    if (!res.ok) { console.log('error', voz, res.status, (await res.text()).slice(0, 300)); continue; }
    const { audioContent } = await res.json();
    const f = `${loc}_${nombre}.mp3`;
    fs.writeFileSync(path.join(OUT, f), Buffer.from(audioContent, 'base64'));
    indice.push(`- ${f} (${texto.length} caracteres)`);
    console.log('ok', f);
  }
}
fs.writeFileSync(path.join(OUT, 'indice.md'), indice.join('\n') + '\n');
