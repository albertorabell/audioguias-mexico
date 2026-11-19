import { registerBuildings } from '../buildings';
import { OUTLINES } from './outlines';

/**
 * Edificios sin plano interior todavía: en el mapa real se ve el edificio con sus paradas adentro y, al tocarlo,
 * la lista de esas paradas (así no se amontonan puntos inventados dentro de un edificio).
 * Cuando un edificio tenga su plano, se pasa a su archivo src/config/plans/<sitio>.ts con «Entrar».
 * Contornos: © colaboradores de OpenStreetMap (ODbL). Si OSM no tiene el contorno (Palacio de Cortés, Catedral de Cuernavaca,
 * museo de Xochicalco) se usa solo su punto.
 */
const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });

registerBuildings('museo_frida_kahlo', [
  { id: 'casa-azul', name: T('Casa Azul', 'Blue House', 'Maison bleue', 'Niebieski Dom', 'Blaues Haus', 'Casa Azul', 'Casa Azul'), outline: OUTLINES.casa_azul, pieces: ['fri_01_primeras_salas_retratos', 'fri_02_viva_la_vida', 'fri_03_marxismo_muletas', 'fri_04_comedor_mexicano', 'fri_05_cocina_barro', 'fri_06_recamara_diego', 'fri_07_escalera_exvotos', 'fri_08_estudio_caballete', 'fri_09_recamara_dia_espejo', 'fri_10_recamara_noche_cenizas', 'fri_11_jardin_flora_animales', 'fri_12_piramide_jardin', 'fri_13_secreto_banos_2004', 'fri_14_corses_pintados', 'fri_15_protesis_bota_roja', 'fri_16_trajes_tehuana', 'fri_17_cierre_legado'] },
]);

registerBuildings('cuernavaca_historica', [
  { id: 'palacio-cortes', name: T('Palacio de Cortés', 'Palace of Cortés', 'Palais de Cortés', 'Pałac Cortésa', 'Cortés-Palast', 'Palácio de Cortés', 'Palazzo di Cortés'), center: [-99.233335, 18.921251], pieces: ['cue_02_fortaleza_cortes', 'cue_03_palacio_que_fue_de_todo', 'cue_04_ventanas_arqueologicas', 'cue_05_sala_paisaje', 'cue_06_maiz_piedra_olmeca', 'cue_08_cuexcomate', 'cue_09_rivera_conquista', 'cue_10_rivera_zapata', 'cue_11_galeria_oriente_torreon'] },
  { id: 'catedral-cuernavaca', name: T('Catedral de Cuernavaca', 'Cuernavaca Cathedral', 'Cathédrale de Cuernavaca', 'Katedra w Cuernavace', 'Kathedrale von Cuernavaca', 'Catedral de Cuernavaca', 'Cattedrale di Cuernavaca'), center: [-99.236824, 18.920233], pieces: ['cue_14_capilla_abierta', 'cue_15_nave_sotocoro', 'cue_16_martires_hallazgo', 'cue_17_martires_lectura', 'cue_18_claustro'] },
]);

registerBuildings('xochicalco', [
  { id: 'museo-sitio', name: T('Museo de sitio', 'Site museum', 'Musée du site', 'Muzeum na miejscu', 'Museum vor Ort', 'Museu de sítio', 'Museo del sito'), center: [-99.290992, 18.802158], pieces: ['xoc_30_museo_estela_original', 'xoc_31_museo_marcadores_pelota', 'xoc_32_museo_arquitectura_vasijas'] },
]);

registerBuildings('basilica_guadalupe', [
  { id: 'nueva-basilica', name: T('Nueva Basílica', 'New Basilica', 'Nouvelle basilique', 'Nowa Bazylika', 'Neue Basilika', 'Nova Basílica', 'Nuova Basilica'), outline: OUTLINES.nueva_basilica, pieces: ['bas_12_cristo_atentado', 'bas_13_tilma_banda', 'bas_19_imagen_guadalupana'] },
  { id: 'museo-basilica', name: T('Museo de la Basílica', 'Basilica Museum', 'Musée de la basilique', 'Muzeum Bazyliki', 'Basilika-Museum', 'Museu da Basílica', 'Museo della Basilica'), outline: OUTLINES.museo_basilica, pieces: ['bas_09_museo_basilica', 'bas_10_exvotos'] },
]);
