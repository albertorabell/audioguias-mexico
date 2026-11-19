/**
 * Ubicaciones corregidas en la revisión del 19-nov-2026. Mandan sobre lat/lng del Sheet mientras se revisan en la vista previa;
 * cuando se aprueben se pasan a las columnas lat/lng de cada Sheet y este archivo se vacía.
 */
export const COORD_FIXES: Record<string, [number, number]> = {
  // Castillo de Chapultepec: las paradas interiores salen del plano del Castillo (chap-pb/chap-pa) ajustado al contorno de OSM; antes estaban en dos filas fuera del edificio
  chap_02_fachada_puerta: [19.420252, -99.181871],
  chap_03_patio_canones: [19.42025, -99.18208],
  chap_04_encuentro_conquista: [19.420516, -99.181775],
  chap_31_fusion_dos_culturas: [19.420434, -99.181861],
  chap_05_nueva_espana_plata: [19.420605, -99.181759],
  chap_04_retablo_independencia: [19.420636, -99.181972],
  chap_27_estandarte_hidalgo: [19.420623, -99.182014],
  chap_06_morelos_iturbide: [19.420596, -99.182104],
  chap_08_intervencion_1847: [19.42056, -99.182202],
  chap_29_mural_ninos_heroes: [19.420399, -99.181936],
  chap_09_batalla_puebla_orozco: [19.42051, -99.182339],
  chap_07_carruaje_juarez: [19.420592, -99.181667],
  chap_09_mural_siqueiros: [19.420362, -99.182072],
  chap_10_mural_madero: [19.420192, -99.182485],
  chap_11_constitucion_1917: [19.420358, -99.182232],
  chap_12_sala_carruajes: [19.420567, -99.181621],
  chap_13_escalera_leones: [19.420423, -99.181266],
  chap_15_comedor_imperial: [19.420859, -99.181237],
  chap_16_sala_lectura_goces: [19.420776, -99.181511],
  chap_17_salon_embajadores: [19.420684, -99.181278],
  chap_28_salon_gobelinos: [19.420756, -99.181116],
  chap_14_vitrales_emplomados: [19.420706, -99.180984],
  chap_18_recamara_carlota: [19.42066, -99.181099],
  chap_19_bano_carlota: [19.420699, -99.181096],
  chap_20_recamara_maximiliano: [19.420691, -99.181057],
  chap_21_recamara_porfirio_carmen: [19.420734, -99.18108],
  chap_22_despacho_presidencial: [19.420716, -99.181166],
  chap_23_jardin_alcazar: [19.420617, -99.181284],
  chap_24_caballero_alto: [19.420639, -99.181318],
  chap_30_salon_malaquitas: [19.4205, -99.181804],
  chap_26_terraza_oriente_reforma: [19.420774, -99.180952],
  // Xochicalco: plano del INAH georreferenciado
  xoc_03_camino_entrada: [18.803829, -99.293951],
  xoc_08_juego_pelota_sur: [18.802374, -99.297659],
  xoc_12_plaza_principal_accesos: [18.80453, -99.296755],
  xoc_18_observatorio: [18.805354, -99.297458],
  xoc_25_rampa_animales: [18.803635, -99.295596],
  xoc_14_serpientes_emplumadas_2: [18.80433, -99.29642],
  // Basílica
  bas_01_calzada_misterios: [19.48449, -99.118398],
  bas_08_capuchinas: [19.484918, -99.116519],
  bas_14_pocito_exterior: [19.485407, -99.115152],
  // Coyoacán
  coy_02_puerta_de_piedra_atrio: [19.349324, -99.162427],
  coy_15_esquina_casa_azul: [19.35528, -99.16256],
  coy_18_trotsky_despacho: [19.357513, -99.159552],
  coy_20_anahuacalli_por_dentro: [19.322905, -99.144362],
  // Museo Frida Kahlo
  fri_00_fachada_azul: [19.355333, -99.162386],
  // Centro Histórico
  cdmx_39_culturas_mundo: [19.432947, -99.130618],
  // Chichén Itzá
  chi_39_final_memoria: [20.68271, -88.57147],
};

/** Aplica las ubicaciones corregidas (lat, lng) a una lista de paradas. */
export function withCoordFixes<T extends { piece_id?: string; lat?: number; lng?: number }>(list: T[]): T[] {
  return list.map((p) => {
    const f = p.piece_id ? COORD_FIXES[p.piece_id] : undefined;
    return f ? { ...p, lat: f[0], lng: f[1] } : p;
  });
}
