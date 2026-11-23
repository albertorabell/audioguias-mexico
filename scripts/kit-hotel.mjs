// Kit impreso para un hotel, Airbnb o tour: PDF bilingüe (español/inglés) con su QR propio.
// Uso:  node scripts/kit-hotel.mjs --slug presidente --nombre "Hotel Presidente" --descuento 15 [--gratis] [--salida carpeta]
// El slug debe existir (activo) en la pestaña ALIADOS de CONTROL; el QR lleva a xolotli.com/h/<slug>.
// Con --gratis (o mientras PROMO_GRATIS esté activo en seo-lib.mjs) el kit promete acceso gratis en vez de un porcentaje.
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PROMO_GRATIS } from './seo-lib.mjs';

const VERDE = '#1f6f5c';
const ORO = '#c28a2c';
const TINTA = '#1d2421';
const GRIS = '#5b6560';

/** Textos del kit. `oferta` es la línea destacada. */
export function textosKit({ nombre, descuento, gratis }) {
  return {
    es: {
      titulo: 'México se escucha mejor con Xolo',
      sub: `Tu audioguía de bolsillo para museos y zonas arqueológicas de México. Cortesía de ${nombre}.`,
      oferta: gratis ? 'Acceso gratis para huéspedes' : `${descuento}% de descuento para huéspedes`,
      pasos: ['Escanea el código QR con la cámara de tu teléfono.', 'Elige el museo o sitio que vas a visitar.', 'Ponte los audífonos y escucha las historias donde ocurrieron.'],
      bullets: ['Más de 400 historias cuidadosamente documentadas', 'Funciona sin internet una vez descargado', 'En español, inglés, francés, polaco, alemán, portugués e italiano', 'Sin instalar nada: se abre desde el navegador'],
      pie: 'La entrada al recinto no está incluida. xolotli.com',
      tarjeta: 'Escanea y escucha',
    },
    en: {
      titulo: 'Mexico sounds better with Xolo',
      sub: `Your pocket audio guide for museums and archaeological sites in Mexico. Courtesy of ${nombre}.`,
      oferta: gratis ? 'Free access for guests' : `${descuento}% off for guests`,
      pasos: ["Scan the QR code with your phone's camera.", "Pick the museum or site you're visiting.", 'Put on your headphones and hear the stories where they happened.'],
      bullets: ['400+ carefully researched stories', 'Works offline once downloaded', 'In Spanish, English, French, Polish, German, Portuguese and Italian', 'Nothing to install: opens in your browser'],
      pie: 'Site admission is not included. xolotli.com',
      tarjeta: 'Scan and listen',
    },
  };
}

export const urlAliado = (slug) => `https://xolotli.com/h/${slug}`;

async function armar({ slug, nombre, descuento, gratis, destino }) {
  const t = textosKit({ nombre, descuento, gratis });
  const qr = await QRCode.toBuffer(urlAliado(slug), { width: 900, margin: 1, errorCorrectionLevel: 'M' });
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, info: { Title: `Kit Xolo · ${nombre}`, Author: 'Xolo' } });
  doc.pipe(createWriteStream(destino));
  const W = doc.page.width;
  const H = doc.page.height;

  // Página 1: cartel de recepción (español arriba, inglés abajo, un QR al centro)
  doc.rect(0, 0, W, 120).fill(VERDE);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(34).text('Xolo', 48, 38);
  doc.font('Helvetica').fontSize(13).text('xolotli.com', 48, 80);
  const bloque = (idioma, y) => {
    const x = t[idioma];
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(22).text(x.titulo, 48, y, { width: W - 96 });
    doc.fillColor(GRIS).font('Helvetica').fontSize(11.5).text(x.sub, 48, y + 30, { width: W - 96 });
    doc.roundedRect(48, y + 62, W - 96, 28, 6).fill(ORO);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14).text(x.oferta, 48, y + 69, { width: W - 96, align: 'center' });
    doc.fillColor(TINTA).font('Helvetica').fontSize(11);
    x.bullets.forEach((b, i) => doc.text(`•  ${b}`, 48, y + 104 + i * 16, { width: W - 96 }));
  };
  bloque('es', 146);
  bloque('en', 146 + 190);
  // QR al centro, entre los dos idiomas
  const q = 150;
  doc.roundedRect((W - q) / 2 - 10, 540, q + 20, q + 20, 10).lineWidth(3).stroke(VERDE);
  doc.image(qr, (W - q) / 2, 550, { width: q });
  doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(12).text(`${t.es.tarjeta} · ${t.en.tarjeta}`, 0, 550 + q + 16, { width: W, align: 'center' });
  doc.fillColor(GRIS).font('Helvetica').fontSize(9).text(`${t.es.pie}  ·  ${t.en.pie}`, 48, H - 40, { width: W - 96, align: 'center' });

  // Página 2: cuatro tarjetas para recortar (habitaciones, mostrador, folleto)
  doc.addPage();
  const cw = W / 2;
  const ch = H / 2;
  for (let i = 0; i < 4; i++) {
    const cx = (i % 2) * cw;
    const cy = Math.floor(i / 2) * ch;
    doc.save().dash(4, { space: 4 }).lineWidth(0.6).strokeColor('#999').rect(cx + 14, cy + 14, cw - 28, ch - 28).stroke().undash().restore();
    doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(20).text('Xolo', cx + 30, cy + 30, { width: cw - 60, align: 'center' });
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(11).text(t.es.oferta, cx + 30, cy + 58, { width: cw - 60, align: 'center' });
    doc.fillColor(GRIS).font('Helvetica').fontSize(9.5).text(t.en.oferta, cx + 30, cy + 74, { width: cw - 60, align: 'center' });
    doc.image(qr, cx + (cw - 120) / 2, cy + 98, { width: 120 });
    doc.fillColor(TINTA).font('Helvetica').fontSize(9).text(t.es.pasos[0], cx + 34, cy + 228, { width: cw - 68, align: 'center' });
    doc.fillColor(GRIS).fontSize(8.5).text(t.en.pasos[0], cx + 34, cy + 252, { width: cw - 68, align: 'center' });
    doc.fillColor(GRIS).fontSize(8).text(`${nombre} · xolotli.com/h/${slug}`, cx + 34, cy + ch - 52, { width: cw - 68, align: 'center' });
  }

  // Página 3: guía para el personal
  doc.addPage();
  doc.rect(0, 0, W, 90).fill(VERDE);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(24).text('Xolo · Guía rápida para el personal', 48, 34);
  doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(13).text('Cómo explicarlo en 20 segundos', 48, 120);
  doc.font('Helvetica').fontSize(12).fillColor(TINTA);
  const guia = [
    `“Tenemos una audioguía gratuita para huéspedes de ${nombre}: escanea este código y escucha las historias de los museos y zonas arqueológicas de México, en tu idioma.”`,
    gratis ? 'Por ahora el acceso es gratis para todos nuestros huéspedes.' : `Los huéspedes reciben ${descuento}% de descuento: se aplica solo al escanear este QR, no hay que dar ningún código.`,
    'Funciona en cualquier teléfono, sin instalar nada. Si quieren usarla sin internet, que descarguen el sitio con el Wi-Fi del hotel antes de salir.',
    'Un pase sirve en 2 teléfonos (pareja o familia): en el primero aparece un QR para activar el segundo.',
    'La entrada al museo o zona arqueológica no está incluida.',
  ];
  guia.forEach((g) => doc.text(`•  ${g}`, 56, doc.y + 8, { width: W - 112 }));
  doc.moveDown(1.5).font('Helvetica-Bold').fontSize(13).text('Dónde colocarlo', 48);
  doc.font('Helvetica').fontSize(12);
  ['Mostrador de recepción (cartel de la página 1)', 'Habitaciones y área de desayuno (tarjetas de la página 2)', 'Mensaje de bienvenida o correo de confirmación: xolotli.com/h/' + slug].forEach((g) => doc.text(`•  ${g}`, 56, doc.y + 6, { width: W - 112 }));
  doc.moveDown(1.5).font('Helvetica-Bold').fontSize(13).text('Contacto', 48);
  doc.font('Helvetica').fontSize(12).text('xolotli.com · soporte desde el formulario «Contacto» de la app', 56, doc.y + 6);
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
