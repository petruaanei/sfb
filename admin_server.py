# Panoul de admin al site-ului.
# Pornește doar local, pe acest calculator (127.0.0.1) — nu e accesibil din exterior.
# Se deschide dând dublu-click pe admin.bat.

import base64
import json
import re
import shutil
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path

PORT = 8123
ROOT_DIR = Path(__file__).resolve().parent
PRODUCTS_JSON = ROOT_DIR / "products.json"
PRODUCTS_JS = ROOT_DIR / "products.js"
IMAGES_DIR = ROOT_DIR / "images" / "produse"

CATEGORII = ["accesorii", "coroane", "felinare", "imbracaminte", "lenjerii", "prosoape", "sicrie", "vesela"]

MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

DIACRITICE = str.maketrans({
    "ă": "a", "â": "a", "î": "i", "ș": "s", "ş": "s", "ț": "t", "ţ": "t",
    "Ă": "a", "Â": "a", "Î": "i", "Ș": "s", "Ş": "s", "Ț": "t", "Ţ": "t",
})


def slugify(text):
    text = text.translate(DIACRITICE).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "produs"


def load_products():
    if not PRODUCTS_JSON.exists():
        return []
    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def save_products(products):
    with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    js = (
        "// Fișier generat automat de panoul de admin (admin.bat).\n"
        "// Nu edita manual aici — deschide admin.bat și adaugă/editează produsele de acolo.\n\n"
        "const PRODUCTS = " + json.dumps(products, ensure_ascii=False, indent=2) + ";\n"
    )
    with open(PRODUCTS_JS, "w", encoding="utf-8") as f:
        f.write(js)


def unique_id(products, base):
    existing = {p["id"] for p in products}
    candidate = base
    n = 2
    while candidate in existing:
        candidate = f"{base}-{n}"
        n += 1
    return candidate


def next_image_number(folder: Path):
    nums = []
    if folder.exists():
        for f in folder.iterdir():
            m = re.match(r"^(\d+)\.", f.name)
            if m:
                nums.append(int(m.group(1)))
    return max(nums, default=0) + 1


class AdminHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/produse":
            self._send_json({"eroare": "Rută necunoscută"}, 404)
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self._send_json({"eroare": "JSON invalid"}, 400)
            return

        action = payload.get("action")
        products = load_products()

        try:
            if action == "create":
                self._create(products, payload)
            elif action == "update":
                self._update(products, payload)
            elif action == "add_imagine":
                self._add_imagine(products, payload)
            elif action == "delete_imagine":
                self._delete_imagine(products, payload)
            elif action == "delete_produs":
                self._delete_produs(products, payload)
            else:
                self._send_json({"eroare": "Acțiune necunoscută"}, 400)
        except ValueError as e:
            self._send_json({"eroare": str(e)}, 400)

    def _find(self, products, id_):
        for p in products:
            if p["id"] == id_:
                return p
        raise ValueError("Produsul nu a fost găsit")

    def _create(self, products, payload):
        categorie = payload.get("categorie", "")
        nume = (payload.get("nume") or "").strip()
        if categorie not in CATEGORII:
            raise ValueError("Categorie invalidă")
        if not nume:
            raise ValueError("Numele produsului lipsește")

        id_ = unique_id(products, slugify(nume))
        produs = {
            "id": id_,
            "categorie": categorie,
            "nume": nume,
            "pret": "",
            "material": "",
            "dimensiuni": "",
            "descriere": "",
            "imagini": [],
        }
        products.append(produs)
        (IMAGES_DIR / categorie / id_).mkdir(parents=True, exist_ok=True)
        save_products(products)
        self._send_json({"produs": produs})

    def _update(self, products, payload):
        produs = self._find(products, payload.get("id"))
        for camp in ("nume", "pret", "material", "dimensiuni", "descriere"):
            if camp in payload:
                produs[camp] = (payload[camp] or "").strip()
        save_products(products)
        self._send_json({"produs": produs})

    def _add_imagine(self, products, payload):
        produs = self._find(products, payload.get("id"))
        data_url = payload.get("data", "")

        match = re.match(r"^data:(image/[\w.+-]+);base64,(.+)$", data_url)
        if not match:
            raise ValueError("Imagine invalidă")
        ext = MIME_TO_EXT.get(match.group(1), ".jpg")
        continut = base64.b64decode(match.group(2))

        folder = IMAGES_DIR / produs["categorie"] / produs["id"]
        folder.mkdir(parents=True, exist_ok=True)
        numar = next_image_number(folder)
        nume_final = f"{numar}{ext}"
        (folder / nume_final).write_bytes(continut)

        cale = f"images/produse/{produs['categorie']}/{produs['id']}/{nume_final}"
        produs["imagini"].append(cale)
        save_products(products)
        self._send_json({"produs": produs})

    def _delete_imagine(self, products, payload):
        produs = self._find(products, payload.get("id"))
        cale = payload.get("imagine")
        if cale in produs["imagini"]:
            produs["imagini"].remove(cale)
            fisier = ROOT_DIR / cale
            if fisier.exists():
                fisier.unlink()
        save_products(products)
        self._send_json({"produs": produs})

    def _delete_produs(self, products, payload):
        produs = self._find(products, payload.get("id"))
        products.remove(produs)
        folder = IMAGES_DIR / produs["categorie"] / produs["id"]
        if folder.exists():
            shutil.rmtree(folder)
        save_products(products)
        self._send_json({"ok": True})


def deschide_browser():
    webbrowser.open(f"http://127.0.0.1:{PORT}/admin.html")


if __name__ == "__main__":
    if not PRODUCTS_JSON.exists():
        save_products([])

    handler = partial(AdminHandler, directory=str(ROOT_DIR))

    try:
        server = HTTPServer(("127.0.0.1", PORT), handler)
    except OSError:
        print(f"Panoul de admin pare să ruleze deja. Deschide manual: http://127.0.0.1:{PORT}/admin.html")
        deschide_browser()
        raise SystemExit

    print(f"Panou admin pornit -> http://127.0.0.1:{PORT}/admin.html")
    print("Lasă această fereastră deschisă cât timp lucrezi. O poți închide când termini.")

    threading.Timer(1.0, deschide_browser).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
