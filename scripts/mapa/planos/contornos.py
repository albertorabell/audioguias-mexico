# Genera src/config/plans/outlines.ts con los contornos de edificios de OpenStreetMap.
# Uso: python3 scripts/mapa/planos/contornos.py <carpeta osm-datos> '<json extra {clave:[sitio,id osm]}>'
import json,sys
SRC={'catedral':('templo_mayor_catedral','way/862852010'),'museo_templo_mayor':('templo_mayor_catedral','way/1421957023'),
     'mna':('mna','way/433756023'),'castillo_chapultepec':('chapultepec',None)}
DATOS=sys.argv[1]
extra=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
SRC.update({k:tuple(v) for k,v in extra.items()})
out={}
for k,(site,oid) in SRC.items():
    try: d=json.load(open(f'{DATOS}/{site}.json'))
    except Exception: continue
    for e in d['edificios']:
        if e['id']==oid:
            g=e['geom']
            if g and not isinstance(g[0][0],(int,float)): g=max((m['geom'] for m in g if m['role']!='inner'),key=len)
            if g: out[k]=[[round(p[1],6),round(p[0],6)] for p in g]
lines=['// Contornos de edificios tomados de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL). [longitud, latitud].',
       '// Se generan con scripts/mapa/planos/contornos.py a partir de la rama osm-datos; no editar a mano.',
       'export const OUTLINES: Record<string, [number, number][]> = {']
for k,v in out.items(): lines.append(f'  {k}: {json.dumps(v)},')
lines.append('};')
open('src/config/plans/outlines.ts','w').write('\n'.join(lines)+'\n')
print({k:len(v) for k,v in out.items()})
