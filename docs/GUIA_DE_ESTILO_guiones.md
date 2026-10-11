# Guía de estilo de los guiones

> **Metas vigentes (mandan sobre la sección 2 de abajo):** guion corto de 105 a 150 palabras, que se entienda solo; guion largo de 470 a 720 palabras en párrafos separados por línea en blanco, sin repetir frases del corto (descubrimiento, significado, dato curioso, conexión). El puente son una o dos frases hacia la siguiente pieza, con un verbo de movimiento. Números y siglos en letras, «antes de Cristo» completo, sin decimales con punto. Tuteo, voz cálida de locutor, español de México. Nombres mayas sin apóstrofos para que la voz los lea bien (la pronunciación va en `glosario/pronunciacion.csv`).
>
> El resto del texto es la guía original; los números de la sección 1 son el diagnóstico de los textos antiguos del MNA.

GUÍA DE ESTILO PARA LOS GUIONES — Audioguías México
(Para reescribir los textos de las piezas de forma variada, correcta y que suene bien al oído.)
=====================================================================

1) QUÉ ENCONTRÉ EN LOS 133 GUIONES ACTUALES (medido, no a ojo)
- 122 de 133 guiones cortos (9 de cada 10) empiezan con la misma fórmula: "Al situarse ante…" (29), "Al aproximarse a…" (20), "Al detenerse ante…" (18), "Al pararse frente…" (9) y variantes.
- "de inmediato" aparece en 80 de 133 piezas; "contempla" en 100; "observa" en 76; "monumental" en 55; "testimonio" en 52; "cosmovisión" en 39.
- Largo promedio: guion corto ≈ 1,200 caracteres (unos 85–90 segundos hablados; la app dice "60 s"); guion largo ≈ 2,970 caracteres (unos 3.5 min).

2) METAS DE LARGO
- Guion corto: 130 a 160 palabras (≈ 60 a 70 s). Se lee entero de corrido, sin subtítulos.
- Guion largo: 380 a 470 palabras (≈ 3 min). Puede tener 3 o 4 "movimientos": qué es y quién lo hizo, cómo se hizo, qué significaba, qué le pasó a la pieza.
- El corto NO es el inicio del largo: cada uno tiene que funcionar solo.

3) PALABRAS Y FRASES PROHIBIDAS O LIMITADAS
- PROHIBIDAS como arranque: "Al situarse / aproximarse / detenerse / pararse / acercarse ante…", "Al contemplar esta…", "Frente a esta…".
- PROHIBIDAS en todo el texto: "de inmediato", "sin duda", "fascinante", "impresionante", "único en su género".
- MÁXIMO 1 vez por guion: "monumental", "cosmovisión", "testimonio", "poderoso", "se erige", "contempla", "observa".
- Prohibido dirigirse al cuerpo del visitante en cada texto ("gira la cabeza", "agáchate"). Solo cuando ayuda de verdad a ver un detalle.

4) LOS 8 TIPOS DE ARRANQUE (rotarlos; no usar el mismo tipo en dos piezas seguidas de una sala)
  a) Un dato concreto y sorprendente ("Pesa más de 24 toneladas y estuvo enterrada casi tres siglos.")
  b) Una pregunta que el visitante puede contestar mirando la pieza.
  c) Un detalle pequeño que casi nadie ve.
  d) Una escena humana (quién la usó, quién la hizo, qué pasó cuando la encontraron).
  e) Un contraste ("Parece una vasija; en realidad era un instrumento…").
  f) Un mito o creencia, contado con una frase y luego lo que se sabe de verdad.
  g) Un número (fecha, medida, cantidad) que sitúa la pieza en el tiempo.
  h) El nombre de la pieza en su lengua original, con su significado.

5) REGLAS DE CONTENIDO (para que no haya información errónea)
- Solo se puede escribir un dato duro (fecha, medida, material, procedencia, cultura, nombre) si aparece en la TABLA VERIFICADA de esa pieza (la que sale del Notebook con fuente y página). Si dice NO ENCONTRADO o CONFLICTO, se escribe sin ese dato o de forma general ("hacia el Posclásico tardío").
- No convertir unidades. Se dice tal cual la fuente ("mide 3.40 m de alto").
- Distinguir siempre: lo que se sabe / lo que se supone / lo que cuenta la tradición ("según los cronistas…", "los arqueólogos proponen…").
- Nada de cifras redondeadas "porque suena bien".
- El dato curioso debe ser comprobable. Si no, no va.

6) ESCRIBIR PARA EL OÍDO (la app lee el texto con voz sintética)
- Frases de máximo 25 palabras. Una idea por frase.
- Evitar paréntesis, rayas largas, comillas anidadas y listas: la voz los lee mal.
- Números: escribir "tres mil doscientos" solo si es corto; fechas como "año 800 después de Cristo" o "siglo XV" en letra ("siglo quince").
- Nombres difíciles (Coyolxauhqui, Tlaltecuhtli, Xochipilli, Chalchiuhtlicue): más adelante agregaremos una columna "pronunciacion" con la escritura fonética para la voz; por ahora se escriben normal.
- Español neutro de México. Tuteo ("tú"), cálido pero sin exclamaciones.

7) ESTRUCTURA FIJA DE CADA GUION CORTO
  1. Arranque (tipo a–h de arriba).
  2. Qué es y de qué cultura, en una sola frase.
  3. La idea que hace especial a la pieza (una sola).
  4. Cierre que abre a la siguiente pieza (esto ya lo hace el campo "puente_narrativo"; no repetirlo).

8) CÓMO SE REESCRIBE (flujo de trabajo)
  a) Se toma la TABLA VERIFICADA de un lote (5 a 8 piezas).
  b) Se le pasa a Claude junto con esta guía y los guiones actuales de esas piezas.
  c) Claude devuelve, por pieza: guion corto nuevo, guion largo nuevo y una lista de "datos que usé y de dónde salen".
  d) Se revisan 2 piezas al azar a mano antes de pegar todo el lote en el Sheets.
  e) Se pega en las columnas guion_corto y guion_largo, y se marca en la columna "verificado" = TRUE.
