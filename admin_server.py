# Panoul de admin al site-ului.
# Pornește doar local, pe acest calculator (127.0.0.1) — nu e accesibil din exterior.
# Se deschide dând dublu-click pe admin.bat.

import base64
import json
import re
import shutil
import subprocess
import threading
import webbrowser
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path

PORT = 8123
ROOT_DIR = Path(__file__).resolve().parent
PRODUCTS_JSON = ROOT_DIR / "products.json"
PACKAGES_JSON = ROOT_DIR / "packages.json"
IMAGES_DIR = ROOT_DIR / "images" / "produse"

# ---- PUBLICARE PE SITE (pentru dezvoltator) -------------------------------
# Doar aceste căi sunt trimise pe site când se apasă butonul "Publică".
# Astfel, lucrul neterminat la cod NU ajunge niciodată publicat din greșeală.
CAI_CONTINUT = [
    "products.json",
    "packages.json",
    "images",
]

# Branch-ul pe care se publică site-ul.
# Butonul "Publică pe site" trimite mereu acolo, indiferent pe ce branch
# se află folderul — astfel proprietarul nu poate publica din greșeală altundeva.
BRANCH_PUBLICARE = "main"
# --------------------------------------------------------------------------

CATEGORII = ["accesorii", "coroane", "felinare", "imbracaminte", "lenjerii", "prosoape", "sicrie", "vesela"]
STOC_VALORI = ["in_stoc", "limitat", "epuizat"]

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


def _citeste(cale, cheie):
    """Citește lista dintr-un fișier de forma {"cheie": [...]}."""
    if not cale.exists():
        return []
    with open(cale, "r", encoding="utf-8") as f:
        date = json.load(f)
    # acceptă și forma veche (listă simplă), ca să nu se piardă date
    lista = date if isinstance(date, list) else date.get(cheie, [])
    return _completeaza_identificatori(lista)


def _pret_numeric(valoare):
    """Prețul se păstrează ca număr; moneda o adaugă site-ul la afișare.
    Acceptă și text vechi, de forma „150 RON”."""
    if valoare is None or valoare == "":
        return None
    if isinstance(valoare, (int, float)):
        return valoare
    gasit = re.search(r"[\d.,]+", str(valoare))
    if not gasit:
        return None
    try:
        numar = float(gasit.group(0).replace(",", "."))
    except ValueError:
        return None
    return int(numar) if numar == int(numar) else numar


def _completeaza_identificatori(lista):
    """Produsele adăugate din panoul online nu au identificator — îl generăm
    din nume, ca restul aplicației să poată lucra cu ele."""
    folosite = {x["id"] for x in lista if x.get("id")}

    for element in lista:
        if element.get("id"):
            continue
        baza = slugify(element.get("nume", ""))
        id_ = baza
        n = 2
        while id_ in folosite:
            id_ = f"{baza}-{n}"
            n += 1
        element["id"] = id_
        folosite.add(id_)

    return lista


def _scrie(cale, cheie, lista):
    with open(cale, "w", encoding="utf-8") as f:
        json.dump({cheie: lista}, f, ensure_ascii=False, indent=2)


def load_products():
    return _citeste(PRODUCTS_JSON, "produse")


def save_products(products):
    _scrie(PRODUCTS_JSON, "produse", products)


def load_packages():
    return _citeste(PACKAGES_JSON, "pachete")


def save_packages(packages):
    _scrie(PACKAGES_JSON, "pachete", packages)


def ruleaza_git(*argumente, timeout=180):
    """Rulează o comandă git în folderul site-ului și întoarce rezultatul."""
    return subprocess.run(
        ["git", *argumente],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )


def modificari_nepublicate():
    """Câte fișiere de conținut sunt modificate față de site-ul publicat."""
    rezultat = ruleaza_git("status", "--porcelain", "--", *CAI_CONTINUT)
    if rezultat.returncode != 0:
        return None
    return len([linie for linie in rezultat.stdout.splitlines() if linie.strip()])


def _explica_esec_push(push, branch):
    """Traduce eroarea lui `git push` într-un mesaj pe înțelesul proprietarului."""
    detalii = "\n".join(p for p in (push.stderr.strip(), push.stdout.strip()) if p)
    # eroarea brută rămâne și în fereastra neagră a panoului, pentru diagnostic
    print(f"[publicare] `git push origin {branch}` a eșuat:\n{detalii}\n")
    motiv = detalii.lower()
    inceput = "Modificările au fost salvate local, dar nu au putut fi trimise pe site.\n"

    if any(s in motiv for s in ("protected branch", "pull request", "gh006", "hook declined")):
        return inceput + (
            f"Pe GitHub, branch-ul „{branch}” are o regulă care cere Pull Request, "
            "iar contul de pe acest calculator nu poate trece peste ea.\n"
            "Roagă proprietarul repo-ului să scoată regula din Settings → Rules "
            "sau să adauge acest cont în lista de excepții (bypass list)."
        )

    if any(s in motiv for s in ("authentication failed", "could not read username",
                                "invalid username or password", "403", "permission denied",
                                "does not appear to be a git repository")):
        return inceput + (
            "Contul GitHub de pe acest calculator nu are drept de publicare, "
            "sau parola/token-ul nu mai este valabil.\n"
            "Roagă persoana care se ocupă de site să reconfigureze accesul."
        )

    if any(s in motiv for s in ("could not resolve host", "failed to connect",
                                "unable to access", "timed out", "timeout",
                                "network is unreachable", "connection was reset")):
        return inceput + "Verifică dacă ai internet, apoi încearcă din nou."

    return inceput + (
        "Motivul exact, așa cum l-a dat GitHub:\n"
        + "\n".join(detalii.splitlines()[:4]) + "\n"
        "Roagă persoana care se ocupă de site să verifice."
    )


def publica_pe_site():
    """Trimite modificările de conținut pe site. Întoarce (reusit, mesaj)."""
    try:
        verificare = ruleaza_git("rev-parse", "--is-inside-work-tree")
    except FileNotFoundError:
        return False, (
            "Git nu este instalat pe acest calculator. "
            "Roagă persoana care se ocupă de site să îl instaleze și să îl configureze."
        )
    except subprocess.TimeoutExpired:
        return False, "Operațiunea a durat prea mult. Verifică conexiunea la internet."

    if verificare.returncode != 0:
        return False, "Folderul site-ului nu este pregătit pentru publicare."

    if ruleaza_git("remote", "get-url", "origin").returncode != 0:
        return False, (
            "Nu este configurată destinația site-ului. "
            "Roagă persoana care se ocupă de site să o configureze o singură dată."
        )

    # Ne asigurăm că publicăm de pe branch-ul corect. Dacă folderul ar fi pe alt
    # branch, commit-ul ar ajunge acolo, iar pe site nu s-ar vedea nimic.
    ramura_curenta = ruleaza_git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    if BRANCH_PUBLICARE and ramura_curenta != BRANCH_PUBLICARE:
        return False, (
            f"Folderul site-ului nu este pregătit corect "
            f"(este pe „{ramura_curenta}” în loc de „{BRANCH_PUBLICARE}”).\n"
            "Roagă persoana care se ocupă de site să verifice."
        )

    adaugare = ruleaza_git("add", "--", *CAI_CONTINUT)
    if adaugare.returncode != 0:
        return False, f"Nu s-au putut pregăti modificările:\n{adaugare.stderr.strip()}"

    # dacă nu e nimic nou pregătit, nu are rost să continuăm
    if ruleaza_git("diff", "--cached", "--quiet", "--", *CAI_CONTINUT).returncode == 0:
        return True, "Nu sunt modificări noi de publicat — site-ul este deja la zi."

    acum = datetime.now().strftime("%d.%m.%Y %H:%M")
    commit = ruleaza_git("commit", "-m", f"Actualizare produse ({acum})")
    if commit.returncode != 0:
        return False, f"Nu s-au putut salva modificările:\n{commit.stderr.strip() or commit.stdout.strip()}"

    branch = BRANCH_PUBLICARE
    if not branch:
        ramura = ruleaza_git("rev-parse", "--abbrev-ref", "HEAD")
        branch = ramura.stdout.strip() or "HEAD"

    push = ruleaza_git("push", "origin", branch)
    if push.returncode == 0:
        return True, "Site-ul a fost actualizat cu succes!"

    # Reîncercarea cu sincronizare are rost doar dacă altcineva a publicat între
    # timp. Pentru orice altă cauză (regulă de protecție, cont fără drepturi,
    # internet) un rebase nu schimbă nimic, așa că spunem direct ce s-a întâmplat.
    motiv = (push.stderr + push.stdout).lower()
    if not any(s in motiv for s in ("fetch first", "non-fast-forward", "stale info")):
        return False, _explica_esec_push(push, branch)

    sincronizare = ruleaza_git("pull", "--rebase", "origin", branch)
    if sincronizare.returncode != 0:
        ruleaza_git("rebase", "--abort")
        print("[publicare] sincronizarea a eșuat:\n"
              + (sincronizare.stderr.strip() or sincronizare.stdout.strip()))
        return False, (
            "Modificările au fost salvate local, dar nu au putut fi trimise pe site.\n"
            "Altcineva a publicat între timp, iar modificările nu s-au putut îmbina automat.\n"
            "Roagă persoana care se ocupă de site să verifice."
        )

    push = ruleaza_git("push", "origin", branch)
    if push.returncode == 0:
        return True, "Site-ul a fost actualizat cu succes!"

    return False, _explica_esec_push(push, branch)


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

    def end_headers(self):
        # fără cache: browserul afișează mereu ultima versiune a paginilor,
        # ca să nu fie nevoie de reîmprospătare forțată după modificări
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path not in ("/api/produse", "/api/pachete", "/api/publica"):
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

        if self.path == "/api/publica":
            self._handle_publicare(action)
            return

        if self.path == "/api/pachete":
            self._handle_pachete(action, payload)
            return

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

    def _handle_publicare(self, action):
        if action == "status":
            try:
                numar = modificari_nepublicate()
            except FileNotFoundError:
                numar = None
            except subprocess.TimeoutExpired:
                numar = None
            self._send_json({"nepublicate": numar})
            return

        if action == "publica":
            try:
                reusit, mesaj = publica_pe_site()
            except subprocess.TimeoutExpired:
                reusit, mesaj = False, "Operațiunea a durat prea mult. Verifică internetul și încearcă din nou."
            except Exception as e:
                reusit, mesaj = False, f"A apărut o problemă neașteptată: {e}"
            self._send_json({"ok": reusit, "mesaj": mesaj}, 200 if reusit else 400)
            return

        self._send_json({"eroare": "Acțiune necunoscută"}, 400)

    def _handle_pachete(self, action, payload):
        packages = load_packages()
        try:
            if action == "create":
                self._create_pachet(packages, payload)
            elif action == "update":
                self._update_pachet(packages, payload)
            elif action == "delete_pachet":
                self._delete_pachet(packages, payload)
            else:
                self._send_json({"eroare": "Acțiune necunoscută"}, 400)
        except ValueError as e:
            self._send_json({"eroare": str(e)}, 400)

    def _find(self, products, id_):
        for p in products:
            if p["id"] == id_:
                return p
        raise ValueError("Produsul nu a fost găsit")

    def _create_pachet(self, packages, payload):
        nume = (payload.get("nume") or "").strip()
        if not nume:
            raise ValueError("Numele pachetului lipsește")

        pachet = {
            "id": unique_id(packages, slugify(nume)),
            "nume": nume,
            "pret": "",
            "eticheta": "",
            "itemi": [],
            "descriere": "",
        }
        packages.append(pachet)
        save_packages(packages)
        self._send_json({"pachet": pachet})

    def _update_pachet(self, packages, payload):
        pachet = self._find(packages, payload.get("id"))
        for camp in ("nume", "eticheta", "descriere"):
            if camp in payload:
                pachet[camp] = (payload[camp] or "").strip()
        if "pret" in payload:
            pachet["pret"] = _pret_numeric(payload["pret"])
        if "itemi" in payload and isinstance(payload["itemi"], list):
            pachet["itemi"] = [str(x).strip() for x in payload["itemi"] if str(x).strip()]
        save_packages(packages)
        self._send_json({"pachet": pachet})

    def _delete_pachet(self, packages, payload):
        pachet = self._find(packages, payload.get("id"))
        packages.remove(pachet)
        save_packages(packages)
        self._send_json({"ok": True})

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
            "stoc": "in_stoc",
            "subcategorie": "",
            "imagini": [],
        }
        products.append(produs)
        (IMAGES_DIR / categorie / id_).mkdir(parents=True, exist_ok=True)
        save_products(products)
        self._send_json({"produs": produs})

    def _update(self, products, payload):
        produs = self._find(products, payload.get("id"))
        for camp in ("nume", "material", "dimensiuni", "descriere", "subcategorie"):
            if camp in payload:
                produs[camp] = (payload[camp] or "").strip()
        if "pret" in payload:
            produs["pret"] = _pret_numeric(payload["pret"])
        if "stoc" in payload and payload["stoc"] in STOC_VALORI:
            produs["stoc"] = payload["stoc"]
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
    if not PACKAGES_JSON.exists():
        save_packages([])

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
