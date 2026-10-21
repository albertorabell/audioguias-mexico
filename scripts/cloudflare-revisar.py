"""Solo LEE la API de Cloudflare para saber qué puede hacer la llave guardada en GitHub. No cambia nada."""
import json
import os
import urllib.request

TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN_DNS") or os.environ.get("CLOUDFLARE_API_TOKEN", "")
CUENTA = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")


def api(ruta):
    req = urllib.request.Request("https://api.cloudflare.com/client/v4" + ruta, headers={"Authorization": "Bearer " + TOKEN})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return json.load(e)
        except Exception:
            return {"success": False, "errors": [{"message": f"HTTP {e.code}"}]}
    except Exception as e:
        return {"success": False, "errors": [{"message": str(e)}]}


def resumen(d):
    ok = "ok" if d.get("success") else "FALLA"
    errs = [e.get("message") for e in d.get("errors", [])]
    r = d.get("result")
    extra = ""
    if isinstance(r, list):
        extra = f" resultados={len(r)} {[x.get('name') or x.get('id') for x in r][:10]}"
    elif isinstance(r, dict):
        extra = " " + str({k: r[k] for k in ("status", "name") if k in r})
    return f"{ok} {errs}{extra}"


def aviso(txt):
    print("::notice::" + txt.replace("\n", " "))


if not TOKEN:
    print("::error::No hay CLOUDFLARE_API_TOKEN")
    raise SystemExit(1)

v = api("/user/tokens/verify")
aviso("llave: " + resumen(v))
if v.get("success"):
    tid = v["result"].get("id")
    t = api(f"/user/tokens/{tid}")
    pol = []
    for p in (t.get("result") or {}).get("policies", []):
        pol.append([x.get("name") for x in p.get("permission_groups", [])])
    aviso("permisos de la llave: " + str(pol))
aviso("cuenta: " + resumen(api(f"/accounts/{CUENTA}")))
z = api("/zones?name=xolotli.com")
aviso("zona xolotli.com: " + resumen(z))
zid = (z.get("result") or [{}])[0].get("id") if z.get("success") else None
if zid:
    aviso("DNS de la zona: " + resumen(api(f"/zones/{zid}/dns_records")))
else:
    aviso("No encontré la zona xolotli.com con esta llave")
aviso("proyectos Pages: " + resumen(api(f"/accounts/{CUENTA}/pages/projects")))
aviso("Workers: " + resumen(api(f"/accounts/{CUENTA}/workers/scripts")))
