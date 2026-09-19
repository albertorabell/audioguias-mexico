// scripts/sync-sheets.js
import fs from 'fs';
import path from 'path';
import https from 'https';

const SPREADSHEET_ID = '1D6Tu8qLVchpsKqFLDF1poEvxOOJO600DLHv05-weOcY';
const DATA_DIR = path.resolve(process.cwd(), 'public/data');

// Diccionario de normalización para asegurar enlace 100% sala-pieza
const ROOM_ALIAS = {
  'sala-01-intro-antropologia': 'sala-01-introduccion-antropologia',
  'sala-02-poblamiento-america': 'sala-02-poblamiento-de-america',
  'sala-03-preclasico': 'sala-03-preclasico-altiplano-central',
  'sala-05-tolteca': 'sala-05-los-toltecas-y-su-epoca',
  'sala-08-costa-golfo': 'sala-08-costa-del-golfo',
  'sala-14-pureecherio': 'sala-14-purecherio',
  'sala-16-sierra-puebla': 'sala-16-sierra-de-puebla',
  'sala-17-oaxaca-etnografia': 'sala-17-oaxaca',
  'sala-18-huastecos-totonacos': 'sala-18-huastecos-y-totonacos'
};

function fetchCsv(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', (chunk) => data += chunk);
          redirectRes.on('end', () => resolve(data));
        }).on('error', reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parseo respetando comillas y saltos de línea escapados
  const parseLine = (line) => {
    const row = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    rows.push(obj);
  }
  return rows;
}

async function sync() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('🔄 Descargando salas de Google Sheets...');
  const salasCsv = await fetchCsv('📝 TRABAJO_SALAS');
  const rawSalas = parseCsv(salasCsv);

  const rooms = rawSalas.map(r => ({
    room_id: r.room_id,
    numero_oficial: r.numero_oficial,
    nombre_oficial: r.nombre_oficial,
    piso: r.piso,
    ala: r.ala,
    frase_gancho: r.frase_gancho,
    introduccion_narrativa: r.introduccion_narrativa,
    svg_id: r.svg_id
  }));

  console.log('🔄 Descargando piezas de Google Sheets...');
  const piezasCsv = await fetchCsv('📝 TRABAJO_PIEZAS');
  const rawPiezas = parseCsv(piezasCsv);

  const pieces = rawPiezas.map(p => {
    // Normalización de room_id
    const rawRoom = p.room_id?.trim();
    const finalRoomId = ROOM_ALIAS[rawRoom] || rawRoom;

    // Retos de observación (separados por '|')
    const retos = p.retos_observacion
      ? p.retos_observacion.split('|').map(x => x.trim()).filter(Boolean)
      : [];

    // Especificaciones (Clave: Valor | Clave: Valor)
    const especificaciones = {};
    if (p.especificaciones) {
      p.especificaciones.split('|').forEach(item => {
        const [k, ...v] = item.split(':');
        if (k && v.length) {
          especificaciones[k.trim()] = v.join(':').trim();
        }
      });
    }

    // FAQ / Mito (? | Respuesta)
    let faq = null;
    if (p.faq_mito && p.faq_mito.includes('|')) {
      const [pregunta, respuesta] = p.faq_mito.split('|');
      faq = {
        pregunta: pregunta.trim(),
        respuesta: respuesta.trim()
      };
    }

    const pieceId = p.piece_id?.trim();
    return {
      id: pieceId,
      piece_id: pieceId,
      poi_id: pieceId,
      room_id: finalRoomId,
      roomId: finalRoomId,
      piso: p.piso,
      orden_sugerido: parseInt(p.orden_sugerido, 10) || 1,
      titulo: p.titulo,
      title: p.titulo,
      frase_gancho: p.frase_gancho,
      puente_narrativo: p.puente_narrativo,
      guion_corto: p.guion_corto,
      guion_largo: p.guion_largo,
      retos_observacion: retos,
      especificaciones,
      faq_mito: faq,
      map_x: parseFloat(p.map_x) || 50,
      map_y: parseFloat(p.map_y) || 50,
      image_filename: p.image_filename,
      is_free: p.is_free?.trim().toUpperCase() === 'TRUE',
      is_premium: p.is_free?.trim().toUpperCase() !== 'TRUE'
    };
  });

  // Guardar en public/data/
  fs.writeFileSync(path.join(DATA_DIR, 'rooms.json'), JSON.stringify(rooms, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'pieces.json'), JSON.stringify(pieces, null, 2));

  // Actualizar también public/data/mna/pieces.json y rooms.json
  const mnaDir = path.join(DATA_DIR, 'mna');
  if (!fs.existsSync(mnaDir)) {
    fs.mkdirSync(mnaDir, { recursive: true });
  }
  fs.writeFileSync(path.join(mnaDir, 'rooms.json'), JSON.stringify(rooms, null, 2));
  fs.writeFileSync(path.join(mnaDir, 'pieces.json'), JSON.stringify(pieces, null, 2));

  // Actualizar rutas sugeridas en site.json y mna.json con los piece_id reales
  const siteJsonPath = path.join(mnaDir, 'site.json');
  const mnaJsonPath = path.join(mnaDir, 'mna.json');
  if (fs.existsSync(siteJsonPath)) {
    try {
      const siteManifest = JSON.parse(fs.readFileSync(siteJsonPath, 'utf-8'));
      
      const findPieceStop = (pId, fallbackTitle, roomZone, roomId) => {
        const found = pieces.find(p => p.piece_id === pId || p.id === pId);
        if (found) {
          return {
            id: found.piece_id,
            piece_id: found.piece_id,
            poi_id: found.piece_id,
            title: found.titulo,
            is_premium: !found.is_free,
            estimated_minutes: 5,
            thumbnail: found.image_filename,
            file: 'data/pieces.json',
            ranking: found.is_free ? 1 : 2,
            room_zone: roomZone,
            room_id: found.room_id || roomId,
            map_coords: { x: found.map_x, y: found.map_y },
            tags: ['arqueologia', 'mna']
          };
        }
        return {
          id: pId,
          piece_id: pId,
          poi_id: pId,
          title: fallbackTitle,
          is_premium: false,
          estimated_minutes: 5,
          thumbnail: '',
          file: 'data/pieces.json',
          ranking: 1,
          room_zone: roomZone,
          room_id: roomId,
          map_coords: { x: 50, y: 50 },
          tags: ['arqueologia', 'mna']
        };
      };

      siteManifest.routes = [
        {
          id: 'ruta-monumental',
          name: 'Obras Maestras del MNA',
          duration: '45 min',
          description: 'Recorrido curado por los grandes monolitos e iconos de la cosmovisión mesoamericana.',
          stops: [
            findPieceStop('mna_s06_piedra_sol', 'Piedra del Sol', 'Sala Mexica', 'sala-06-mexica'),
            findPieceStop('mna_s06_coatlicue', 'Coatlicue', 'Sala Mexica', 'sala-06-mexica'),
            findPieceStop('mna_s04_chalchiuhtlicue', 'Diosa del Agua (Chalchiuhtlicue)', 'Sala Teotihuacán', 'sala-04-teotihuacan'),
            findPieceStop('mna_s04_disco_muerte', 'Disco de la Muerte', 'Sala Teotihuacán', 'sala-04-teotihuacan'),
            findPieceStop('mna_s09_mascara_pakal', 'Máscara de Pakal', 'Sala Maya', 'sala-09-maya'),
            findPieceStop('mna_s06_coyolxauhqui', 'Cabeza de Coyolxauhqui', 'Sala Mexica', 'sala-06-mexica'),
            findPieceStop('mna_s08_cabeza_colosal_6', 'Cabeza Colosal 6 de San Lorenzo', 'Culturas de la Costa del Golfo', 'sala-08-costa-del-golfo'),
            findPieceStop('mna_s05_atlante_tula', 'Atlante de Tula', 'Los Toltecas y su época', 'sala-05-los-toltecas-y-su-epoca')
          ]
        },
        {
          id: 'visita-relampago',
          name: 'Visita Relámpago (Top Highlights)',
          duration: '25 min',
          description: 'Itinerario exprés con los tesoros indispensables que todo visitante debe contemplar.',
          stops: [
            findPieceStop('mna_s06_piedra_sol', 'Piedra del Sol', 'Sala Mexica', 'sala-06-mexica'),
            findPieceStop('mna_s06_coatlicue', 'Coatlicue', 'Sala Mexica', 'sala-06-mexica'),
            findPieceStop('mna_s04_disco_muerte', 'Disco de la Muerte', 'Sala Teotihuacán', 'sala-04-teotihuacan'),
            findPieceStop('mna_s09_mascara_pakal', 'Máscara de Pakal', 'Sala Maya', 'sala-09-maya')
          ]
        }
      ];

      fs.writeFileSync(siteJsonPath, JSON.stringify(siteManifest, null, 2), 'utf-8');
      fs.writeFileSync(mnaJsonPath, JSON.stringify(siteManifest, null, 2), 'utf-8');
      console.log('✅ Rutas sugeridas de site.json y mna.json actualizadas con los piece_id reales.');
    } catch (e) {
      console.warn('Advertencia al actualizar site.json:', e);
    }
  }

  console.log(`✅ Sincronización exitosa: ${rooms.length} salas y ${pieces.length} piezas guardadas en public/data/`);
}

sync().catch(err => {
  console.error('❌ Error sincronizando con Google Sheets:', err);
  process.exit(1);
});
