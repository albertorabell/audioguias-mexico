// Números en dígitos SOLO para la pantalla.
//
// Los guiones se escriben con los números en letras («mil novecientos treinta y cuatro») porque así los lee bien la voz,
// y el MP3 se genera con ese texto. En pantalla se leen mejor como cifras («1934»). Esta función convierte el texto
// que se MUESTRA; el texto de voz (y su huella) no se toca nunca: nadie que genere audio debe llamarla.
//
// Reglas (español):
//  - del uno al nueve se dejan en letra («dos cerros», «una vez»): solo se convierten si forman parte de un número mayor;
//  - del diez en adelante, a cifras («dieciocho» → 18, «dos mil quinientos» → 2500, «mil novecientos treinta y cuatro» → 1934);
//  - años y cifras de cuatro dígitos sin separador; de cinco en adelante con espacio fino («12 500»);
//  - «millón/millones» se quedan en letra tras la cifra («dos millones» → 2 millones);
//  - «siglo quince» → «siglo XV»;
//  - «un metro ochenta» → «1,80 m»;
//  - los destinos de los enlaces [texto](id) no se tocan.

const UNIDADES = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9 };
const ESPECIALES = {
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const DECENAS = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const CIENTOS = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
  cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600,
  setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};

const plano = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ROMANOS = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
function romano(n) {
  let out = '';
  for (const [v, s] of ROMANOS) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Lee un número en letras desde la posición i. Devuelve { valor, hasta (índice de palabra exclusivo), palabras } o null. */
function leerNumero(palabras, i, unidas) {
  let total = 0; // lo ya cerrado por «mil»
  let grupo = 0; // el grupo actual (menos de mil)
  let n = 0; // palabras consumidas
  let vistoCientos = false, vistoDecena = false, vistoUnidad = false, vistoMil = false, algo = false;
  let j = i;
  const w = (k) => (palabras[k] ? plano(palabras[k]) : '');
  while (j < palabras.length) {
    if (j > i && !unidas[j - 1]) break; // puntuación entre dos palabras: el número termina
    const p = w(j);
    if (p in CIENTOS && !vistoCientos && !vistoDecena && !vistoUnidad) { grupo += CIENTOS[p]; vistoCientos = true; algo = true; j++; n++; continue; }
    if (p in ESPECIALES && !vistoDecena && !vistoUnidad) { grupo += ESPECIALES[p]; vistoDecena = true; vistoUnidad = true; algo = true; j++; n++; continue; }
    if (p in DECENAS && !vistoDecena && !vistoUnidad) { grupo += DECENAS[p]; vistoDecena = true; algo = true; j++; n++; continue; }
    if (p === 'y' && vistoDecena && !vistoUnidad && grupo % 10 === 0 && grupo % 100 >= 30 && w(j + 1) in UNIDADES && w(j + 1) !== 'cero') { j++; n++; continue; }
    if (p in UNIDADES && !vistoUnidad && (p !== 'cero')) {
      // «y» ya consumida o unidad suelta
      grupo += UNIDADES[p]; vistoUnidad = true; algo = true; j++; n++; continue;
    }
    if (p === 'mil' && !vistoMil) {
      if (!algo) { grupo = 1; } // «mil» a secas = 1000
      total += grupo * 1000; grupo = 0; vistoMil = true; vistoCientos = vistoDecena = vistoUnidad = false; algo = true; j++; n++; continue;
    }
    break;
  }
  if (!algo) return null;
  // Una «y» colgada al final (no consumida) no cuenta: j ya apunta antes de ella porque solo se consume si sigue unidad
  return { valor: total + grupo, hasta: j, palabras: n };
}

function formato(n) {
  const s = String(n);
  if (s.length <= 4) return s;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Convierte los números en letras de un texto en español a cifras (solo para mostrar). */
export function aDigitos(texto, lang = 'es') {
  if (lang !== 'es' || typeof texto !== 'string' || !texto) return texto;
  // Se parte en trozos: destinos de enlace «](id)» intactos; el resto se procesa.
  return texto
    .split(/(\]\([^)]*\))/g)
    .map((trozo, k) => (k % 2 === 1 ? trozo : convertir(trozo)))
    .join('');
}

// Tras estas palabras, el número va en cifra aunque sea de una sola (Monumento 9, Estructura 4)
const OBRAS = new Set(['monumento', 'monumentos', 'estructura', 'terraza', 'edificio', 'sala', 'altar', 'tumba', 'entierro', 'puerta', 'ofrenda', 'numero', 'num', 'cuadro', 'fase', 'etapa']);

const PALABRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

function convertir(txt) {
  // Tokens: palabras con su posición, para conservar puntuación y espacios.
  const toks = [];
  let m;
  PALABRA.lastIndex = 0;
  while ((m = PALABRA.exec(txt))) toks.push({ w: m[0], ini: m.index, fin: m.index + m[0].length });
  const palabras = toks.map((t) => t.w);
  // unidas[k]: entre la palabra k y la k+1 solo hay espacios
  const unidas = toks.map((t, k) => k + 1 < toks.length && /^\s+$/.test(txt.slice(t.fin, toks[k + 1].ini)));
  let out = '';
  let pos = 0;
  let i = 0;
  while (i < toks.length) {
    const num = leerNumero(palabras, i, unidas);
    if (!num) { i++; continue; }
    const ult = toks[i + num.palabras - 1];
    const previa = i > 0 && unidas[i - 1] ? plano(palabras[i - 1]) : '';
    const siguiente = i + num.palabras < toks.length ? plano(palabras[i + num.palabras]) : '';
    const entreSiguiente = i + num.palabras < toks.length ? txt.slice(ult.fin, toks[i + num.palabras].ini) : '';
    const pegada = /^\s+$/.test(entreSiguiente);
    const v = num.valor;
    let reemplazo = null;
    let finReemplazo = ult.fin;
    let saltoTokens = num.palabras;

    if (previa === 'siglo' && v >= 1 && v <= 21 && /^\s+$/.test(txt.slice(toks[i - 1].fin, toks[i].ini))) {
      reemplazo = romano(v);
    } else if (v >= 2 && v < 10 && OBRAS.has(previa)) {
      reemplazo = String(v);
    } else if (v < 10 && !(siguiente === 'millon' || siguiente === 'millones')) {
      // del 1 al 9 se quedan en letra
      reemplazo = null;
    } else if (siguiente === 'millon' || siguiente === 'millones') {
      reemplazo = pegada ? `${formato(v)}` : null;
    } else {
      reemplazo = formato(v);
    }

    if (reemplazo === null) { i += num.palabras; continue; }
    // «un metro ochenta» → «1,80 m»
    out += txt.slice(pos, toks[i].ini) + reemplazo;
    pos = finReemplazo;
    i += saltoTokens;
  }
  out += txt.slice(pos);
  return medidas(out);
}

/** «un metro 80» → «1,80 m» (el número ya viene en cifras). */
function medidas(t) {
  return t.replace(/\b(?:un|1) metros? (\d{1,2})\b/gi, (_, cm) => `1,${cm.padStart(2, '0')} m`);
}
