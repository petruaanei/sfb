# Server pentru testarea site-ului (inclusiv de pe telefon).
#
# Spre deosebire de "py -m http.server", acesta:
#   - trimite instrucțiuni de "no-cache", deci vezi mereu ultima versiune
#     (altfel telefonul reține fișierele vechi și nu apar produsele noi)
#   - ascultă pe toate interfețele, deci e accesibil din rețeaua locală
#   - afișează adresa exactă pe care s-o deschizi pe telefon
#
# Pornire: dublu-click pe test-pe-telefon.bat  (sau: py test_server.py)

import socket
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# Se poate da alt port ca argument:  py test_server.py 8010
# (util dacă browserul de pe telefon a memorat fișiere vechi de pe portul obișnuit)
PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8000
ROOT_DIR = Path(__file__).resolve().parent


class HandlerFaraCache(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def ip_local():
    """Adresa calculatorului în rețeaua locală (pentru telefon)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == "__main__":
    handler = partial(HandlerFaraCache, directory=str(ROOT_DIR))
    server = ThreadingHTTPServer(("0.0.0.0", PORT), handler)

    print("=" * 58)
    print("  SITE PORNIT PENTRU TESTARE")
    print("=" * 58)
    print(f"  Pe acest calculator:  http://localhost:{PORT}")
    print(f"  Pe telefon:           http://{ip_local()}:{PORT}")
    print()
    print("  Telefonul trebuie sa fie pe ACELASI Wi-Fi.")
    print("  Inchide aceasta fereastra cand ai terminat.")
    print("=" * 58)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
