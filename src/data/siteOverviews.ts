export interface SitePhoto {
  url: string;
  title: string;
  caption: string;
}

export interface SiteKeyFact {
  label: string;
  value: string;
  subtext?: string;
}

export interface SiteOverviewData {
  siteId: string;
  officialTitle: string;
  shortName: string;
  tagline: string;
  location: string;
  schedule: string;
  admissionInfo: string;
  keyFacts: SiteKeyFact[];
  photos: SitePhoto[];
  narrativeParagraphs: string[];
  architecturalHighlights: {
    title: string;
    description: string;
  }[];
}

export const SITE_OVERVIEWS: Record<string, SiteOverviewData> = {
  MNA: {
    siteId: 'MNA',
    officialTitle: 'Museo Nacional de Antropología',
    shortName: 'MNA',
    tagline: 'Custodio del legado mesoamericano y cumbre de la arquitectura moderna mexicana',
    location: 'Av. Paseo de la Reforma s/n y Calzada Gandhi, Bosque de Chapultepec, Miguel Hidalgo, CDMX',
    schedule: 'Martes a Domingo de 9:00 a 18:00 hrs (Lunes cerrado)',
    admissionInfo: 'Entrada general: $95 MXN • Domingos entrada libre a nacionales y residentes',
    keyFacts: [
      { label: 'Época Histórica', value: '2500 a.C. – 1521 d.C.', subtext: 'Preclásico al Posclásico Tardío' },
      { label: 'Acervo y Salas', value: '+120,000 piezas', subtext: '22 salas temáticas en 44,000 m²' },
      { label: 'Tiempo Sugerido', value: '2 a 3.5 horas', subtext: 'Visita completa o por salas clave' },
      { label: 'Reconocimiento', value: 'Top 10 Mundial', subtext: 'Monumento Artístico de la Nación' },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Museo_Nacional_de_Antropolog%C3%ADa_-_MNA_01.jpg/1200px-Museo_Nacional_de_Antropolog%C3%ADa_-_MNA_01.jpg',
        title: 'Patio Central y Fuente "El Paraguas"',
        caption: 'La monumental columna cilíndrica de bronce esculpida por los hermanos Chávez Morado sostiene una cubierta volada de 4,500 m².',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Piedra_del_Sol_en_el_MNA.jpg/1200px-Piedra_del_Sol_en_el_MNA.jpg',
        title: 'Sala Mexica: Piedra del Sol',
        caption: 'El monolito basáltico de 24 toneladas que sintetiza la cosmogonía mexica de los Cinco Soles y la devoción cósmica a Tonatiuh.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/M%C3%A1scara_de_Calakmul.jpg/800px-M%C3%A1scara_de_Calakmul.jpg',
        title: 'Sala Maya: Máscara Funeraria de Calakmul',
        caption: 'Obra maestra de mosaico de jadeíta verde, concha nácar y obsidiana gris que cubría el rostro divinizado del gobernante maya.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Coatlicue_de_frente.jpg/900px-Coatlicue_de_frente.jpg',
        title: 'Monolito de Coatlicue',
        caption: 'La imponente deidad de falda de serpientes decapitada, cuyas dos corrientes de sangre brotan como dos cabezas ofidias.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Cabeza_Colosal_n.%C2%BA_6_de_San_Lorenzo.jpg/1200px-Cabeza_Colosal_n.%C2%BA_6_de_San_Lorenzo.jpg',
        title: 'Sala de Orígenes: Cabeza Olmeca',
        caption: 'Monumento labrado en basalto volcánico transportado desde la Sierra de los Tuxtlas por la cultura madre mesoamericana.',
      },
    ],
    narrativeParagraphs: [
      'Inaugurado en septiembre de 1964 bajo el trazo genial del arquitecto Pedro Ramírez Vázquez, el Museo Nacional de Antropología representa uno de los logros culturales y arquitectónicos más trascendentales de América Latina. Concebido como una reinterpretación contemporánea del cuadrángulo cívico-religioso mesoamericano, el recinto organiza sus 22 salas alrededor de un amplio patio central al aire libre donde la naturaleza del Bosque de Chapultepec penetra a través de canceles de cristal, dialogando perpetuamente con las piedras ancestrales.',
      'En la planta baja se custodian las obras cumbre de tres milenios de esplendor prehispánico: desde las cabezas colosales talladas por los olmecas hasta la monumental Sala Mexica coronada por la Piedra del Sol y el altar de Coatlicue, pasando por las refinadas estelas mayas y las urnas funerarias zapotecas. Cada sala funciona como un santuario temático dotado de techos altos, nichos ceremoniales y dioramas escénicos que sumergen al visitante en la cosmovisión donde la vida, la muerte y el orden cósmico estaban indisolublemente entrelazados.',
      'Recorrer el Museo Nacional de Antropología no es un mero paseo turístico, sino una inmersión conmovedora en el corazón de la identidad mexicana. Diseñar un itinerario a tu medida te permitirá descubrir los matices estilísticos, las anécdotas curaduriales y los misterios escultóricos de cada sala a tu propio ritmo, evitando la fatiga de sus colosales distancias.',
    ],
    architecturalHighlights: [
      {
        title: 'El Paraguas Central',
        description: 'Columna con relieves escultóricos en bronce que recrean la integración del México indígena y virreinal, rodeada por una cortina de agua artificial en cascada invertida.',
      },
      {
        title: 'Celosía de Aluminio de Felguérez',
        description: 'Diseño geométrico que tamiza la luz solar sobre los pasillos superiores, inspirado en las grecas prehispánicas de Mitla y Uxmal.',
      },
      {
        title: 'Ventilaciones y Jardines Etnobotánicos',
        description: 'Cada sala se expande visualmente hacia jardines exteriores que albergan réplicas de templos, estelas y vegetación autóctona.',
      },
    ],
  },

  TEOTIHUACAN: {
    siteId: 'TEOTIHUACAN',
    officialTitle: 'Zona Arqueológica de Teotihuacán',
    shortName: 'Teotihuacán',
    tagline: 'La legendaria Ciudad de los Dioses y metrópoli sagrada del Altiplano Central',
    location: 'Valle de Teotihuacán, Estado de México (a 48 km al noreste del centro de la CDMX)',
    schedule: 'Lunes a Domingo de 8:00 a 17:00 hrs',
    admissionInfo: 'Boleto general INAH: $95 MXN • Estacionamiento y museos de sitio incluidos',
    keyFacts: [
      { label: 'Cronología', value: '100 a.C. – 650 d.C.', subtext: 'Época Clásica de Mesoamérica' },
      { label: 'Superficie', value: '~20 km² originales', subtext: 'Calzada de 4 km y cientos de conjuntos' },
      { label: 'Tiempo Sugerido', value: '2.5 a 4.5 horas', subtext: 'Caminata extensa a cielo abierto' },
      { label: 'Declaratoria', value: 'Patrimonio UNESCO', subtext: 'Inscrito en 1987' },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Teotihuacan_pyramids.jpg/1280px-Teotihuacan_pyramids.jpg',
        title: 'Panorámica de la Calzada de los Muertos',
        caption: 'El imponente eje axial de casi 4 kilómetros orientado a 15° 30′ al este del norte astronómico.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Pir%C3%A1mide_del_Sol%2C_Teotihuac%C3%A1n%2C_M%C3%A9xico%2C_2013-10-12%2C_DD_14.JPG/1280px-Pir%C3%A1mide_del_Sol%2C_Teotihuac%C3%A1n%2C_M%C3%A9xico%2C_2013-10-12%2C_DD_14.JPG',
        title: 'Pirámide del Sol',
        caption: 'Con 65 metros de altura y un volumen de un millón de metros cúbicos, erigida sobre un laberinto de cuevas sagradas.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Piramide_de_la_luna_2016.jpg/1280px-Piramide_de_la_luna_2016.jpg',
        title: 'Pirámide de la Luna y Plaza Ceremonial',
        caption: 'Remate visual de la Calzada alineado con la silueta sagrada del volcán Cerro Gordo o Tenan.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Temple_of_the_Feathered_Serpent%2C_Teotihuacan_2.jpg/1280px-Temple_of_the_Feathered_Serpent%2C_Teotihuacan_2.jpg',
        title: 'Templo de la Serpiente Emplumada (Quetzalcóatl)',
        caption: 'Fascinantes cabezas de serpiente emergiendo entre caracoles marinos y la criatura del tiempo Cipactli/Tláloc.',
      },
    ],
    narrativeParagraphs: [
      'Bautizada por los mexicas siglos después de su colapso como Teotihuacán —"el lugar donde los hombres se convierten en dioses"—, esta urbe representó la cúspide de la planificación urbana, el comercio y la devoción religiosa en la América precolombina. Con una población que superó los 125,000 habitantes en su cenit, la ciudad constituyó un crisol multiétnico donde coexistían barrios de orfebres zapotecas, alfareros mayas y sacerdotes de la Gran Diosa.',
      'Su traza urbana obedece a un cosmos rigurosamente medido. A lo largo de la Calzada de los Muertos se despliega la Pirámide del Sol, montaña artificial erigida sobre cavernas subterráneas asociadas con el origen de la humanidad; la Pirámide de la Luna, cuya explanada contaba con una acústica ritual magistral; y La Ciudadela, macrocomplejo ceremonial presidido por el Templo de la Serpiente Emplumada con sus relieves policromados de animales marinos.',
      'Caminar bajo el cielo del valle teotihuacano requiere una planificación inteligente de distancias, hidratación y descansos a la sombra. La audioguía personalizada te brindará el contexto astronómico, los secretos de la pintura mural y los hallazgos funerarios recientes en cada punto neurálgico sin desviarte innecesariamente.',
    ],
    architecturalHighlights: [
      {
        title: 'Sistema Talud-Tablero',
        description: 'Fórmula constructiva distintiva que alternaba planos inclinados (talud) con paneles verticales enmarcados (tablero) para conferir ligereza visual.',
      },
      {
        title: 'Drenaje Pluvial y Acústica',
        description: 'Red subterránea de canales pulidos en estuco que desalojaban tormentas torrenciales y plazas con reverberación ceremonial.',
      },
      {
        title: 'Palacio de Quetzalpapálotl',
        description: 'Residencia sacerdotal de patios porticados con pilares tallados con el mítico "pájaro-mariposa" e incrustaciones de obsidiana.',
      },
    ],
  },

  CHAPULTEPEC: {
    siteId: 'CHAPULTEPEC',
    officialTitle: 'Museo Nacional de Historia Castillo de Chapultepec',
    shortName: 'Castillo Chapultepec',
    tagline: 'Único alcázar real en América y bastión panorámico de la memoria nacional',
    location: 'Primera Sección del Bosque de Chapultepec s/n, Miguel Hidalgo, Ciudad de México',
    schedule: 'Martes a Domingo de 9:00 a 17:00 hrs (Lunes cerrado)',
    admissionInfo: 'Boleto general INAH: $95 MXN • Entrada libre domingos a nacionales',
    keyFacts: [
      { label: 'Periodo Histórico', value: 'Siglos XVIII – XX', subtext: 'Virreinato, Imperio, Porfiriato' },
      { label: 'Inmueble Singular', value: 'Único Castillo Real', subtext: 'Residencia palaciega en América' },
      { label: 'Tiempo Sugerido', value: '1.5 a 2.5 horas', subtext: 'Incluye subida y jardines del cerro' },
      { label: 'Altitud y Vistas', value: '2,325 msnm', subtext: 'Mirador 360° sobre Reforma y el Valle' },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Castillo_de_Chapultepec%2C_Ciudad_de_M%C3%A9xico%2C_M%C3%A9xico%2C_2013-10-16%2C_DD_02.JPG/1280px-Castillo_de_Chapultepec%2C_Ciudad_de_M%C3%A9xico%2C_M%C3%A9xico%2C_2013-10-16%2C_DD_02.JPG',
        title: 'Fachada del Castillo sobre el Cerro del Chapulín',
        caption: 'Monumento neoclásico y barroco erigido como casa de recreo virreinal sobre un antiguo sitio sagrado prehispánico.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Recamara_de_Carlota_Castillo_de_Chapultepec.jpg/1280px-Recamara_de_Carlota_Castillo_de_Chapultepec.jpg',
        title: 'Habitaciones Imperiales: Alcoba de Carlota',
        caption: 'Mobiliario de maderas preciosas, seda azul y accesorios de estilo Luis XVI enviados desde las cortes europeas.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Carruaje_de_Benito_Ju%C3%A1rez_-_Castillo_de_Chapultepec.jpg/1280px-Carruaje_de_Benito_Ju%C3%A1rez_-_Castillo_de_Chapultepec.jpg',
        title: 'Carruaje de Gala de Benito Juárez',
        caption: 'El sobrio carruaje cerrado que trasladó la República itinerante defendiendo la soberanía mexicana.',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Carruaje_de_gala_de_Maximiliano.JPG/1280px-Carruaje_de_gala_de_Maximiliano.JPG',
        title: 'Carroza de Gala de Maximiliano y Carlota',
        caption: 'Vehículo triunfal tallado en Milán en madera dorada a la hoja con querubines y motivos imperiales.',
      },
    ],
    narrativeParagraphs: [
      'Encaramado sobre la cima boscosa del Cerro del Chapulín —sitio sagrado de retiro para los tlatoanis mexicas como Moctezuma Ilhuicamina—, el Castillo de Chapultepec es el único palacio real y residencial erigido en todo el continente americano. Comenzado en 1785 bajo el mandato del virrey Bernardo de Gálvez, el edificio sufrió asedios bélicos, bombardeos y reformas neoclásicas antes de alcanzar su mayor protagonismo como sede del Heroico Colegio Militar en la guerra de 1847.',
      'Durante la intervención francesa, el archiduque Maximiliano de Habsburgo y la emperatriz Carlota de Bélgica transformaron la fortaleza en su residencia imperial oficial. Mandaron remodelar el Alcázar con pórticos corintios, terrazas ajardinadas al estilo europeo, salones de música de estilo victoriano y el trazado original del Paseo de la Emperatriz (hoy Paseo de la Reforma) para conectar directamente la cima del cerro con el Palacio Nacional.',
      'Hoy, el Museo Nacional de Historia resguarda más de cinco siglos de contradicciones y triunfos nacionales: desde las armaduras de la Conquista y los retratos virreinales hasta los portentosos murales de Siqueiros, O\'Gorman y González Camarena. Visitarlo con una ruta seleccionada te permite apreciar el contraste entre la opulencia imperial de sus alcobas y el fervor épico de la Independencia y la Revolución.',
    ],
    architecturalHighlights: [
      {
        title: 'Terraza del Alcázar y Jardines de Azotea',
        description: 'Diseño paisajístico suspendido sobre el cerro con rosales, balaustradas de cantera y vista frontal ininterrumpida al Paseo de la Reforma.',
      },
      {
        title: 'Torre del Caballero Alto',
        description: 'Vigía cilíndrico construido en el siglo XIX que servía como observatorio astronómico y mirador militar de la fortaleza.',
      },
      {
        title: 'Galería de los Vitrales',
        description: 'Impresionantes vitrales alegóricos franceses que representan a las diosas romanas Pomona, Flora, Hebe y Ceres.',
      },
    ],
  },
};
