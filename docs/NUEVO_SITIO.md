# Cómo se agrega un sitio nuevo (leer primero en una conversación nueva)

Este archivo es la memoria compartida entre conversaciones. No contiene secretos ni textos privados.
Quien lo lea (persona o Claude) debe tratar lo marcado «sin verificar» como pendiente de confirmar.

## Reglas fijas del proyecto
- Alberto no es programador: pasos simples, «con palitos», en español.
- Nada de inventar información: lo que no esté verificado se dice y se anota como duda.
- Fotos solo con licencia de dominio público, CC0, CC BY o CC BY-SA, con crédito anotado.
- Una sola voz para todos los idiomas: `es-MX-JorgeMultilingualNeural`. Idiomas: es, en, fr, pl.
- Los textos nuevos viven en la hoja de Google Sheets, no en este repositorio público. Los textos de pago se suben a R2 al desplegar.
- Gastos pequeños y por lotes; los flujos de traducir y de audio tienen un modo «plan» gratis para ver el costo antes.
- El cobro (Stripe + Worker `pagos/`) sigue en pruebas: aún no se cobra a usuarios reales.

## Estado de los sitios
- MNA (Museo Nacional de Antropología): activo, 22 salas, 178 piezas. Falta la visita al museo para corregir dudas.
- Teotihuacán: ya existe una ficha inicial en `public/data/teotihuacan/` (5 zonas, 2 rutas, 4 archivos de zona, mapa SVG) y está como `coming_soon` en `public/data/sites.json`. Su contenido se escribió antes de la limpieza que se hizo para el MNA: no confiar en él sin verificar.

## Pasos para un sitio nuevo
1. Definir alcance con Alberto: zonas, piezas/paradas, recorridos sugeridos, idioma base.
2. Investigar con fuentes citables (INAH, publicaciones académicas, Wikimedia para fotos). Anotar dudas aparte, nunca afirmarlas.
3. Redactar en la hoja de Google Sheets (pestañas de trabajo de salas/zonas y piezas, como en el MNA): título, gancho, corto (105–150 palabras), largo (470–720), puente a la siguiente parada, retos, mito/realidad.
4. Fotos: buscar con licencia permitida, anotar autor y licencia.
5. Mapa y posiciones: mapa SVG del sitio y posición de cada parada.
6. Visita en campo: lista de verificación con las dudas concretas; Alberto corrige en sitio.
7. Sincronizar la hoja (`scripts/sync-sheets.js`), revisar el plan, y correr la CI de la rama (`verificar-rama.yml`).
8. Traducir (`traducir.yml`): primero modo plan, luego con tope de gasto.
9. Pronunciación: glosario en `glosario/pronunciacion.csv`; probar voces (`muestras-voz.yml`) antes de generar todo.
10. Generar audio (`generar-audio.yml`): primero plan, luego generar; solo se regeneran textos que cambiaron.
11. Publicar: cambiar el sitio a `active` en `sites.json`, crear el precio del sitio en Stripe si aplica, y desplegar.

## Cosas que cambian por sitio
- Ficha en `public/data/<sitio>/` y entrada en `public/data/sites.json`.
- Precio del pase (hoy: MXN 79 / USD 4.99 como valor inicial en la ficha; el real viene de Stripe).
- Los códigos de descuento sirven en cualquier sitio; se limitan a uno con el metadato `sitios` en Stripe.
