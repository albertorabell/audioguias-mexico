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

const OFFICIAL_PA_ROOMS = [
  {
    room_id: 'sala-12-introduccion-etnografia',
    numero_oficial: '12',
    nombre_oficial: 'Introducción a la Etnografía',
    piso: 'PA',
    ala: 'Norte',
    frase_gancho: 'Mosaico vivo de lenguas, cosmovisiones y tradiciones que laten con fuerza en el México contemporáneo.',
    introduccion_narrativa: 'Bienvenido a la puerta de entrada del piso etnográfico, un portal dedicado a la diversidad vibrante de las comunidades originarias que habitan nuestro país. Esta galería introductoria ofrece una visión de conjunto sobre la pluralidad lingüística, los patrones de asentamiento y la herencia cultural compartida por más de sesenta pueblos indígenas.',
    svg_id: 'room_pa_12',
    aliases: ['sala-12', 'sala-12-pueblos-indios', 'pueblos-indios', 'etnografia-intro']
  },
  {
    room_id: 'sala-13-otopames',
    numero_oficial: '13',
    nombre_oficial: 'Otopames',
    piso: 'PA',
    ala: 'Norte',
    frase_gancho: 'Herederos del maguey y la fibra viva que sostienen la fe en la meseta.',
    introduccion_narrativa: 'Esta galería está dedicada a la gran familia lingüística otopame, integrada por otomíes, mazahuas, matlatzincas, tlahuicas, pames y chichimecas jonaces. Repartidos en los valles y serranías del Altiplano Central, estos pueblos han demostrado una extraordinaria adaptabilidad frente a entornos semiáridos.',
    svg_id: 'room_pa_13',
    aliases: ['sala-13', 'sala-15-otopames', 'otopames', 'otomi']
  },
  {
    room_id: 'sala-14-sierra-de-puebla',
    numero_oficial: '14',
    nombre_oficial: 'Sierra de Puebla',
    piso: 'PA',
    ala: 'Norte',
    frase_gancho: 'Danzas aladas entre la niebla montañosa que celebran la armonía con la tierra.',
    introduccion_narrativa: 'Ubicada en el ala norte del piso superior, esta sala explora el dinámico microcosmos de la Sierra Norte de Puebla, donde conviven nahuas, totonacos, otomíes y tepehuas. A pesar de sus diferencias lingüísticas, estas comunidades comparten un territorio escarpado y una profunda devoción articulada en torno al cultivo del maíz y del café.',
    svg_id: 'room_pa_14',
    aliases: ['sala-14', 'sala-16-sierra-de-puebla', 'sierra-puebla', 'totonacos']
  },
  {
    room_id: 'sala-15-costa-del-golfo',
    numero_oficial: '15',
    nombre_oficial: 'Costa del Golfo: Huasteca y Totonacapan',
    piso: 'PA',
    ala: 'Norte',
    frase_gancho: 'Aromas de vainilla y sones huastecos que alegran las llanuras fértiles del Golfo.',
    introduccion_narrativa: 'Esta sala celebra la herencia viva de las culturas costeras del Golfo de México, representadas por los pueblos huasteco y totonaco. Ubicados entre ríos acaudalados, cultivos de vainilla y cálidas llanuras, estos grupos conservan un valioso legado artesanal y espiritual expresado en su indumentaria blanca y sus danzas ancestrales.',
    svg_id: 'room_pa_15',
    aliases: ['sala-15', 'sala-18-huastecos-y-totonacos', 'huastecos-y-totonacos', 'golfo-etnografia']
  },
  {
    room_id: 'sala-16-mayas-selva-montana',
    numero_oficial: '16',
    nombre_oficial: 'Pueblos Mayas de la Selva y Montaña',
    piso: 'PA',
    ala: 'Cabecera',
    frase_gancho: 'Guardián de la niebla y la selva chiapaneca donde los rezos protegen el alma comunitaria.',
    introduccion_narrativa: 'Esta sala se adentra en el corazón de las montañas y selvas de Chiapas, territorio de los pueblos tsotsil, tseltal, tojolabal, chol y lacandón. A través de sus templos domésticos, sus pesados gabanes de lana de Chamula y los incensarios ceremoniales de barro de los lacandones, el visitante experimenta una espiritualidad viva ligada a las cuevas y cerros sagrados.',
    svg_id: 'room_pa_16',
    aliases: ['sala-16', 'sala-19-pueblos-mayas', 'mayas-selva', 'mayas-montana', 'pueblos-mayas']
  },
  {
    room_id: 'sala-17-mayas-tierras-bajas',
    numero_oficial: '17',
    nombre_oficial: 'Pueblos Mayas de las Tierras Bajas',
    piso: 'PA',
    ala: 'Cabecera',
    frase_gancho: 'Hijos de la milpa peninsular que custodian la palabra sagrada y el ciclo de las lluvias.',
    introduccion_narrativa: 'Continuando en la cabecera del piso superior, este espacio explora la vida cotidiana y cosmogonía de los mayas peninsulares de Yucatán, Campeche y Quintana Roo. Destacan la recreación de la casa maya tradicional con techumbre de palma de guano, el solar doméstico y la exquisita indumentaria de ternos mestizos bordados en punto de cruz.',
    svg_id: 'room_pa_17',
    aliases: ['sala-17', 'mayas-tierras-bajas', 'mayas-peninsula', 'tierras-bajas']
  },
  {
    room_id: 'sala-18-oaxaca-sur',
    numero_oficial: '18',
    nombre_oficial: 'Oaxaca: Pueblos Indios del Sur',
    piso: 'PA',
    ala: 'Sur',
    frase_gancho: 'Mosaico pluriétnico donde el tequio, la fiesta mayordoma y el color honran la vida.',
    introduccion_narrativa: 'Adéntrese en la colosal riqueza etnográfica de Oaxaca, territorio donde conviven más de dieciséis grupos étnicos como zapotecos, mixtecos, mixes, chinantecos y mazatecos. La exhibición revela la fuerza comunitaria del tequio, el esplendor de los trajes de tehuana y la milenaria cerámica de barro negro.',
    svg_id: 'room_pa_18',
    aliases: ['sala-18', 'sala-17-oaxaca', 'oaxaca-etnografia', 'pueblos-oaxaca']
  },
  {
    room_id: 'sala-19-costa-pacifico-nahuas',
    numero_oficial: '19',
    nombre_oficial: 'Costa del Pacífico: Nahuas y Mixtecos',
    piso: 'PA',
    ala: 'Sur',
    frase_gancho: 'La palabra florida y los vientos costeros que unen sierras y mares en rituales festivos.',
    introduccion_narrativa: 'Esta galería expone la presencia vibrante de los pueblos nahuas y mixtecos que habitan las costas y cuencas del Pacífico en Guerrero, Michoacán y Oaxaca. Destacan las pinturas tradicionales sobre papel amate de Xalitla, los telares teñidos con caracol púrpura y las ofrendas ceremoniales del tlamanaliztli para bendecir las cosechas.',
    svg_id: 'room_pa_19',
    aliases: ['sala-19', 'sala-21-nahuas', 'nahuas-pacifico', 'costa-pacifico']
  },
  {
    room_id: 'sala-20-purecherio',
    numero_oficial: '20',
    nombre_oficial: 'Puréecherio (Tarascos)',
    piso: 'PA',
    ala: 'Sur',
    frase_gancho: 'Manos artesanas que moldean el cobre, el barro y la madera junto al lago sagrado.',
    introduccion_narrativa: 'Ingrese al territorio purépecha de Michoacán, definido por sus lagos serenos y mesetas volcánicas. Esta sala rinde homenaje a la maestría técnica de sus artesanos: la troje de madera ensamblada, las bateas y pailas de cobre martillado de Santa Clara del Cobre y las tradicionales máscaras de la Danza de los Viejitos.',
    svg_id: 'room_pa_20',
    aliases: ['sala-20', 'sala-14-purecherio', 'purecherio', 'purepecha', 'tarascos']
  },
  {
    room_id: 'sala-21-gran-nayar',
    numero_oficial: '21',
    nombre_oficial: 'El Gran Nayar: Coras y Huicholes',
    piso: 'PA',
    ala: 'Sur',
    frase_gancho: 'Sierras sagradas donde los cantos rituales y el peyote tejen el equilibrio cósmico.',
    introduccion_narrativa: 'Adéntrese en la geografía sagrada de la Sierra Madre Occidental, morada de los pueblos wixárika (huichol), náayari (cora), o’dam (tepehuán) y mexicanero. Se exhiben las minuciosas tablas de estambre nierika, trajes bordados con venados sagrados y las máscaras de la Judea cora.',
    svg_id: 'room_pa_21',
    aliases: ['sala-21', 'sala-13-gran-nayar', 'gran-nayar', 'huichol', 'cora']
  },
  {
    room_id: 'sala-22-norte-noroeste',
    numero_oficial: '22',
    nombre_oficial: 'Pueblos del Norte y Noroeste',
    piso: 'PA',
    ala: 'Sur',
    frase_gancho: 'Voces del desierto, sierra y costa que afirman su libertad y sabiduría ancestral.',
    introduccion_narrativa: 'Concluya la travesía etnográfica en los inmensos horizontes del norte y noroeste mexicano: tarahumaras de las barrancas, yaquis y mayos de los valles fluviales, y seris del Golfo de California. Destacan las máscaras de fariseo chapayeka, la parafernalia de la Danza del Venado y las finas esculturas de palo fierro.',
    svg_id: 'room_pa_22',
    aliases: ['sala-22', 'sala-20-noroeste', 'noroeste', 'norte-etnografia']
  }
];

const PIECE_TO_PA_ROOM = {
  'mna_s12_mapa_lenguas': 'sala-12-introduccion-etnografia',
  'mna_s12_ciclo_milpa': 'sala-12-introduccion-etnografia',
  'mna_s12_acervo_textil': 'sala-12-introduccion-etnografia',
  'mna_s15_quechquemitl_otomi': 'sala-13-otopames',
  'mna_s15_oratorio_familiar': 'sala-13-otopames',
  'mna_s15_cesteria_ixtle': 'sala-13-otopames',
  'mna_s15_traje_mazahua': 'sala-13-otopames',
  'mna_s16_corona_quetzales': 'sala-14-sierra-de-puebla',
  'mna_s16_papel_amate_sanpablito': 'sala-14-sierra-de-puebla',
  'mna_s16_traje_volador': 'sala-14-sierra-de-puebla',
  'mna_s16_huipil_cuetzalan': 'sala-14-sierra-de-puebla',
  'mna_s18_dhubem_huasteco': 'sala-15-costa-del-golfo',
  'mna_s18_altar_xantolo': 'sala-15-costa-del-golfo',
  'mna_s18_traje_papantla': 'sala-15-costa-del-golfo',
  'mna_s18_mascara_negritos': 'sala-15-costa-del-golfo',
  'mna_s19_gaban_chamula': 'sala-16-mayas-selva-montana',
  'mna_s19_incensario_lacandon': 'sala-16-mayas-selva-montana',
  'mna_s19_terno_yucateco': 'sala-17-mayas-tierras-bajas',
  'mna_s19_solar_maya': 'sala-17-mayas-tierras-bajas',
  'mna_s17_traje_tehuana': 'sala-18-oaxaca-sur',
  'mna_s17_huipil_triqui': 'sala-18-oaxaca-sur',
  'mna_s17_barro_negro': 'sala-18-oaxaca-sur',
  'mna_s17_mascara_diablos_costa': 'sala-18-oaxaca-sur',
  'mna_s21_penacho_moctezuma': 'sala-19-costa-pacifico-nahuas',
  'mna_s21_huipil_nahua': 'sala-19-costa-pacifico-nahuas',
  'mna_s21_pintura_xalitla': 'sala-19-costa-pacifico-nahuas',
  'mna_s21_altar_tlamanaliztli': 'sala-19-costa-pacifico-nahuas',
  'mna_s14_troje_purepecha': 'sala-20-purecherio',
  'mna_s14_mascara_viejitos': 'sala-20-purecherio',
  'mna_s14_cobre_martillado': 'sala-20-purecherio',
  'mna_s14_rebozo_patakua': 'sala-20-purecherio',
  'mna_s13_nierika_estambre': 'sala-21-gran-nayar',
  'mna_s13_traje_wixarika': 'sala-21-gran-nayar',
  'mna_s13_mascara_cora': 'sala-21-gran-nayar',
  'mna_s20_mascara_chapayeka': 'sala-22-norte-noroeste',
  'mna_s20_violin_raramuri': 'sala-22-norte-noroeste',
  'mna_s20_corita_seri': 'sala-22-norte-noroeste',
  'mna_s20_palo_fierro': 'sala-22-norte-noroeste',
};

async function sync() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('🔄 Descargando salas de Google Sheets...');
  const salasCsv = await fetchCsv('📝 TRABAJO_SALAS');
  const rawSalas = parseCsv(salasCsv);

  const pbRooms = rawSalas
    .filter(r => r.piso === 'PB' || parseInt(r.numero_oficial, 10) < 12)
    .map(r => ({
      room_id: r.room_id,
      numero_oficial: r.numero_oficial,
      nombre_oficial: r.nombre_oficial,
      piso: r.piso || 'PB',
      ala: r.ala,
      frase_gancho: r.frase_gancho,
      introduccion_narrativa: r.introduccion_narrativa,
      svg_id: r.svg_id,
      aliases: [r.room_id, `sala-${String(r.numero_oficial).padStart(2, '0')}`]
    }));

  const rooms = [...pbRooms, ...OFFICIAL_PA_ROOMS];

  console.log('🔄 Descargando piezas de Google Sheets...');
  const piezasCsv = await fetchCsv('📝 TRABAJO_PIEZAS');
  const rawPiezas = parseCsv(piezasCsv);

  const pieces = rawPiezas.map(p => {
    // Normalización de room_id y enlace de piezas PA
    const rawPieceId = p.piece_id?.trim();
    const rawRoom = p.room_id?.trim();
    let finalRoomId = ROOM_ALIAS[rawRoom] || rawRoom;
    let finalPiso = p.piso;

    if (PIECE_TO_PA_ROOM[rawPieceId]) {
      finalRoomId = PIECE_TO_PA_ROOM[rawPieceId];
      finalPiso = 'PA';
    }

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
      image_filename: p.image_filename ? p.image_filename.trim().replace(/^.*[\\\/]/, '') : '',
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
