// Kit impreso para un hotel, Airbnb o tour: PDF bilingüe (español/inglés) con su QR propio.
// Uso:  node scripts/kit-hotel.mjs --slug presidente --nombre "Hotel Presidente" --descuento 15 [--gratis] [--salida carpeta]
// El slug debe existir (activo) en la pestaña ALIADOS de CONTROL; el QR lleva a xolotli.com/h/<slug>.
// Con --gratis (o mientras PROMO_GRATIS esté activo en seo-lib.mjs) el kit promete acceso gratis en vez de un porcentaje.
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PROMO_GRATIS } from './seo-lib.mjs';


/** Textos del kit. `oferta` es la línea destacada. */
export function textosKit({ nombre, descuento, gratis }) {
  return {
    es: {
      titulo: 'México se escucha mejor con Xolo',
      sub: `Tu audioguía de bolsillo para museos y zonas arqueológicas de México. Cortesía de ${nombre}.`,
      oferta: gratis ? 'Acceso gratis para huéspedes' : `${descuento}% de descuento para huéspedes`,
      pasos: ['Escanea el código QR con la cámara de tu teléfono.', 'Elige el museo o sitio que vas a visitar.', 'Ponte los audífonos y escucha las historias donde ocurrieron.'],
      bullets: ['Más de 400 historias explicadas por expertos', 'Funciona sin internet una vez descargado', 'En español, inglés, francés, polaco, alemán, portugués e italiano', 'Sin instalar nada: se abre desde el navegador'],
      sitios: 'Audioguías disponibles hoy',
      pie: 'La entrada al recinto no está incluida. · xolotli.com',
      tarjeta: 'Escanea y escucha',
    },
    en: {
      titulo: 'Mexico sounds better with Xolo',
      sub: `Your pocket audio guide for museums and archaeological sites in Mexico. Courtesy of ${nombre}.`,
      oferta: gratis ? 'Free access for guests' : `${descuento}% off for guests`,
      pasos: ["Scan the QR code with your phone's camera.", "Pick the museum or site you're visiting.", 'Put on your headphones and hear the stories where they happened.'],
      bullets: ['400+ stories explained by experts', 'Works offline once downloaded', 'In Spanish, English, French, Polish, German, Portuguese and Italian', 'Nothing to install: opens in your browser'],
      sitios: 'Audio guides available today',
      pie: 'Site admission is not included. · xolotli.com',
      tarjeta: 'Scan and listen',
    },
  };
}

export const urlAliado = (slug) => `https://xolotli.com/h/${slug}`;

const NAVY = '#191C2E'; // el fondo del logo oscuro
const MAGENTA = '#e5195f';
const AMBAR = '#f59e0b';
const CREMA = '#fef7ed';
const LILA = '#c9c6d1';

/** Sitios con audioguía publicada (nombre en español e inglés). Actualiza esta lista cuando se sume uno. */
export const SITIOS_KIT = [
  ['Museo Nacional de Antropología', 'National Museum of Anthropology'],
  ['Zona Arqueológica de Teotihuacán', 'Teotihuacan Archaeological Zone'],
  ['Castillo de Chapultepec', 'Chapultepec Castle'],
  ['Centro Histórico de la Ciudad de México', 'Historic Center of Mexico City'],
  ['Templo Mayor y Catedral Metropolitana', 'Templo Mayor & Metropolitan Cathedral'],
  ['Basílica de Guadalupe', 'Basilica of Guadalupe'],
  ['Museo Frida Kahlo (La Casa Azul)', 'Frida Kahlo Museum (La Casa Azul)'],
  ['Centro de Coyoacán', 'Coyoacán Center'],
  ['Zona Arqueológica de Chichén Itzá', 'Chichén Itzá Archaeological Zone'],
  ['Cuernavaca Histórica', 'Historic Cuernavaca'],
  ['Xochicalco', 'Xochicalco'],
  ['Zona Arqueológica de Chalcatzingo', 'Chalcatzingo Archaeological Zone'],
];

async function armar({ slug, nombre, descuento, gratis, destino }) {
  const t = textosKit({ nombre, descuento, gratis });
  const qr = await QRCode.toBuffer(urlAliado(slug), { width: 900, margin: 1, errorCorrectionLevel: 'M' });
  const sharp = (await import('sharp')).default;
  const logo = await sharp(new URL('../public/logo-xolo-oscuro.svg', import.meta.url).pathname, { density: 110 }).resize({ width: 900 }).png().toBuffer();
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, info: { Title: `Kit Xolo · ${nombre}`, Author: 'Xolo' } });
  doc.pipe(createWriteStream(destino));
  const W = doc.page.width;
  const H = doc.page.height;
  const fondo = () => doc.rect(0, 0, W, H).fill(NAVY);
  const cinta = (y, h = 4) => {
    doc.rect(0, y, W / 3, h).fill(MAGENTA);
    doc.rect(W / 3, y, W / 3, h).fill(AMBAR);
    doc.rect((2 * W) / 3, y, W / 3, h).fill('#2a9db5');
  };

  // Cartel (una página por idioma)
  const cartel = (idioma) => {
    const x = t[idioma];
    const sitios = SITIOS_KIT.map((s) => (idioma === 'es' ? s[0] : s[1]));
    fondo();
    doc.image(logo, (W - 250) / 2, 26, { width: 250 });
    doc.fillColor(CREMA).font('Helvetica-Bold').fontSize(27).text(x.titulo, 50, 142, { width: W - 100, align: 'center' });
    doc.fillColor(LILA).font('Helvetica').fontSize(12).text(x.sub, 70, 180, { width: W - 140, align: 'center' });
    doc.roundedRect(90, 214, W - 180, 34, 17).fill(MAGENTA);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text(x.oferta, 90, 224, { width: W - 180, align: 'center' });
    // QR en tarjeta blanca
    const q = 170;
    doc.roundedRect((W - q) / 2 - 14, 268, q + 28, q + 28, 14).fill('#fff');
    doc.image(qr, (W - q) / 2, 282, { width: q });
    doc.fillColor(AMBAR).font('Helvetica-Bold').fontSize(13).text(x.tarjeta, 0, 268 + q + 38, { width: W, align: 'center' });
    // Sitios
    cinta(500, 3);
    doc.fillColor(CREMA).font('Helvetica-Bold').fontSize(13).text(x.sitios, 50, 516, { width: W - 100, align: 'center' });
    doc.font('Helvetica').fontSize(10.5).fillColor(LILA);
    sitios.forEach((n, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      doc.fillColor(AMBAR).text('•', 64 + col * 262, 540 + row * 17, { continued: true }).fillColor(CREMA).text(`  ${n}`, { width: 240 });
    });
    doc.fillColor(LILA).font('Helvetica').fontSize(10).text(x.bullets.join('  ·  '), 40, 656, { width: W - 80, align: 'center' });
    doc.fillColor(LILA).fontSize(8.5).text(x.pie, 40, H - 38, { width: W - 80, align: 'center' });
    cinta(H - 6, 6);
  };
  cartel('es');
  doc.addPage();
  cartel('en');

  // Tarjetas para recortar
  doc.addPage();
  doc.rect(0, 0, W, H).fill('#ffffff');
  const cw = W / 2;
  const ch = H / 2;
  for (let i = 0; i < 4; i++) {
    const cx = (i % 2) * cw;
    const cy = Math.floor(i / 2) * ch;
    doc.roundedRect(cx + 16, cy + 16, cw - 32, ch - 32, 14).fill(NAVY);
    doc.image(logo, cx + (cw - 120) / 2, cy + 26, { width: 120 });
    doc.fillColor(CREMA).font('Helvetica-Bold').fontSize(12).text(t.es.oferta, cx + 30, cy + 80, { width: cw - 60, align: 'center' });
    doc.fillColor(LILA).font('Helvetica').fontSize(10).text(t.en.oferta, cx + 30, cy + 98, { width: cw - 60, align: 'center' });
    doc.roundedRect(cx + (cw - 128) / 2 - 6, cy + 120, 140, 140, 8).fill('#fff');
    doc.image(qr, cx + (cw - 128) / 2, cy + 126, { width: 128 });
    doc.fillColor(CREMA).font('Helvetica-Bold').fontSize(10).text(`${t.es.tarjeta} · ${t.en.tarjeta}`, cx + 30, cy + 272, { width: cw - 60, align: 'center' });
    doc.fillColor(LILA).font('Helvetica').fontSize(8).text(`${nombre} · xolotli.com/h/${slug}`, cx + 30, cy + ch - 56, { width: cw - 60, align: 'center' });
    doc.rect(cx + 16, cy + ch - 20, cw - 32, 4).fill(MAGENTA);
  }
  doc.save().dash(3, { space: 3 }).lineWidth(0.4).strokeColor('#bbb').moveTo(cw, 0).lineTo(cw, H).moveTo(0, ch).lineTo(W, ch).stroke().restore();

  // Guía para el personal
  doc.addPage();
  doc.rect(0, 0, W, H).fill('#fbf6ee');
  doc.rect(0, 0, W, 110).fill(NAVY);
  doc.image(logo, 40, 14, { width: 180 });
  doc.fillColor(CREMA).font('Helvetica-Bold').fontSize(20).text('Guía rápida para el personal', 250, 46, { width: W - 290 });
  cinta(110, 4);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text('Cómo explicarlo en 20 segundos', 48, 142);
  doc.font('Helvetica').fontSize(12).fillColor('#1a1a1a');
  const guia = [
    `“Tenemos una audioguía para huéspedes de ${nombre}: escanea este código y escucha las historias de los museos y zonas arqueológicas de México, en tu idioma.”`,
    gratis ? 'Por ahora el acceso es gratis para todos nuestros huéspedes.' : `Los huéspedes reciben ${descuento}% de descuento: se aplica solo al escanear este QR, no hay que dar ningún código.`,
    'Funciona en cualquier teléfono, sin instalar nada. Para usarla sin internet, que descarguen el sitio con el Wi-Fi del hotel antes de salir.',
    'Un pase sirve en 2 teléfonos (pareja o familia): en el primero aparece un QR para activar el segundo.',
    'La entrada al museo o zona arqueológica no está incluida.',
  ];
  guia.forEach((g) => doc.text(`•  ${g}`, 56, doc.y + 8, { width: W - 112 }));
  doc.moveDown(1.5).fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text('Dónde colocarlo', 48);
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(12);
  ['Mostrador de recepción (cartel, páginas 1 y 2)', 'Habitaciones y área de desayuno (tarjetas, página 3)', `Mensaje de bienvenida o correo de confirmación: xolotli.com/h/${slug}`].forEach((g) => doc.text(`•  ${g}`, 56, doc.y + 6, { width: W - 112 }));
  doc.moveDown(1.5).fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text('Contacto', 48);
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(12).text('xolotli.com · soporte desde el formulario «Contacto» de la app', 56, doc.y + 6);
  doc.end();
  await new Promise((res) => doc.on('end', res));
}

async function main() {
  const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
  const slug = arg('slug').toLowerCase();
  const nombre = arg('nombre');
  if (!/^[a-z0-9_-]{2,20}$/.test(slug) || !nombre) {
    console.error('Uso: node scripts/kit-hotel.mjs --slug presidente --nombre "Hotel Presidente" --descuento 15 [--gratis] [--salida carpeta]');
    process.exit(1);
  }
  const descuento = Number(arg('descuento', '15'));
  const gratis = process.argv.includes('--gratis') || PROMO_GRATIS;
  const salida = arg('salida', '.');
  mkdirSync(salida, { recursive: true });
  const destino = join(salida, `kit-xolo-${slug}.pdf`);
  await armar({ slug, nombre, descuento, gratis, destino });
  console.log(`✅ ${destino} (QR → ${urlAliado(slug)}${gratis ? ' · versión «acceso gratis»' : ` · ${descuento}% de descuento`})`);
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
