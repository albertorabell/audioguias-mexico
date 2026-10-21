"""Conecta el dominio al proyecto de Cloudflare Pages (y crea el registro DNS). Se puede repetir sin problema."""
import json
import os
import sys
import urllib.request

TOKEN = os.environ["CLOUDFLARE_API_TOKEN"]
CUENTA = os.environ["CLOUDFLARE_ACCOUNT_ID"]
PROYECTO = os.environ.get("PROYECTO", "audioguias")
DOMINIO = os.environ.get("DOMINIO", "xolotli.com")


def api(metodo, ruta, cuerpo=None):
    req = urllib.request.Request(
        "https://api.cloudflare.com/client/v4" + ruta,
        method=metodo,
        data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return json.load(e)
        except Exception:
            return {"success": False, "errors": [{"message": f"HTTP {e.code}"}]}


def aviso(txt):
    print("::notice::" + txt.replace("\n", " "))


r = api("POST", f"/accounts/{CUENTA}/pages/projects/{PROYECTO}/domains", {"name": DOMINIO})
aviso(f"dominio en Pages: {'ok' if r.get('success') else 'FALLA'} {[e.get('message') for e in r.get('errors', [])]}")

zonas = api("GET", f"/zones?name={DOMINIO}")
zid = (zonas.get("result") or [{}])[0].get("id")
if not zid:
    print("::error::No encontré la zona " + DOMINIO)
    sys.exit(1)
destino = f"{PROYECTO}.pages.dev"
existentes = api("GET", f"/zones/{zid}/dns_records?name={DOMINIO}")
if (existentes.get("result") or []):
    aviso("ya existe un registro DNS para " + DOMINIO + ": " + str([(x['type'], x['content']) for x in existentes['result']]))
else:
    c = api("POST", f"/zones/{zid}/dns_records", {"type": "CNAME", "name": DOMINIO, "content": destino, "proxied": True, "ttl": 1})
    aviso(f"registro DNS CNAME {DOMINIO} -> {destino}: {'ok' if c.get('success') else 'FALLA'} {[e.get('message') for e in c.get('errors', [])]}")

estado = api("GET", f"/accounts/{CUENTA}/pages/projects/{PROYECTO}/domains/{DOMINIO}")
res = estado.get("result") or {}
aviso(f"estado del dominio: {res.get('status')} (validación: {(res.get('validation_data') or {}).get('status')}, certificado: {(res.get('verification_data') or {}).get('status')})")
