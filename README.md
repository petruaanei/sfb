# Servicii Funerare Băltătești — site + panou de administrare

Site static (HTML / CSS / JavaScript, fără framework) plus un panou de administrare
local prin care proprietarul adaugă produse și pachete **fără să atingă cod sau Git**.

---

## Cuprins

- [Structura proiectului](#structura-proiectului)
- [Cum funcționează administrarea](#cum-funcționează-administrarea)
- [Instalare pe calculatorul proprietarului](#instalare-pe-calculatorul-proprietarului) ← *partea importantă*
- [Instrucțiuni de lăsat proprietarului](#instrucțiuni-de-lăsat-proprietarului)
- [Pentru dezvoltator](#pentru-dezvoltator)
- [Probleme frecvente](#probleme-frecvente)

---

## Structura proiectului

| Fișier / folder | Ce conține |
|---|---|
| `index.html` | Pagina de acasă (slideshow + descriere firmă) |
| `produse.html` | Catalogul de produse, cu filtrare pe categorii și subcategorii |
| `produs.html` | Pagina unui produs (galerie cu zoom, preț, material, stoc) |
| `pachete.html` | Pachetele funerare |
| `servicii.html`, `despre.html`, `contact.html` | Pagini de prezentare |
| `style.css` | Stilul întregului site |
| `script.js` | Logica site-ului (slideshow, galerii, filtre, căutare, meniu mobil) |
| `products.json` / `products.js` | **Datele produselor** — generate de panoul de admin |
| `packages.json` / `packages.js` | **Datele pachetelor** — generate de panoul de admin |
| `images/` | Toate pozele (logo, slideshow, produse, servicii) |
| `admin.bat` | **Pornește panoul de administrare** (dublu-click) |
| `test-pe-telefon.bat` | Pornește site-ul pentru testare, inclusiv de pe telefon |
| `test_server.py` | Serverul de testare (fără cache, accesibil în rețeaua locală) |
| `admin_server.py` | Serverul local al panoului (Python) |
| `admin.html` / `admin.css` / `admin.js` | Interfața panoului de administrare |

> **Nu edita manual** `products.js` și `packages.js` — sunt regenerate automat
> de panoul de admin la fiecare salvare și modificările manuale se pierd.

---

## Cum funcționează administrarea

1. Proprietarul deschide `admin.bat` → pornește un server local (doar pe `127.0.0.1`,
   nu e accesibil din exterior) și se deschide singur panoul în browser.
2. Adaugă/editează produse și pachete, urcă poze prin drag & drop.
   Serverul scrie pozele în `images/produse/<categorie>/<id-produs>/` și
   actualizează `products.json` + `products.js`.
3. Apasă butonul **„Publică pe site"** → se face automat `git add`, `commit` și `push`.
   Proprietarul nu vede și nu trebuie să știe nimic despre Git.

**Se publică doar conținutul**: `products.json`, `products.js`, `packages.json`,
`packages.js` și folderul `images/`. Modificările la cod (HTML/CSS/JS) **nu** sunt
trimise de proprietar din greșeală — lista e definită în `admin_server.py`, la
constanta `CAI_CONTINUT`.

---

## Instalare pe calculatorul proprietarului

> De făcut **o singură dată**, de către dezvoltator, direct pe calculatorul lui.
> Durează ~20 de minute.

### Pasul 1 — Instalează Python

1. Descarcă de la <https://www.python.org/downloads/>
2. La instalare, **bifează „Add Python to PATH"** (obligatoriu, altfel `admin.bat` nu pornește)
3. Verifică în Command Prompt:
   ```
   py --version
   ```

### Pasul 2 — Instalează Git

1. Descarcă de la <https://git-scm.com/download/win>
2. Instalează cu opțiunile implicite
3. Verifică:
   ```
   git --version
   ```

### Pasul 3 — Descarcă site-ul pe calculatorul lui

Alege un folder simplu, de exemplu `C:\Site`:

```
mkdir C:\Site
cd C:\Site
git clone https://github.com/petruaanei/sfb.git
cd sfb
```

### Pasul 4 — Configurează identitatea Git

```
git config user.name "Servicii Funerare Baltatesti"
git config user.email "adrianciudin9@gmail.com"
```

### Pasul 5 — Configurează autentificarea (ca să nu-i mai ceară niciodată parola)

**Varianta recomandată — GitHub CLI:**

1. Instalează de la <https://cli.github.com/>
2. Rulează și urmează pașii în browser:
   ```
   gh auth login
   ```
   Alege: `GitHub.com` → `HTTPS` → `Y` (autentificare Git) → `Login with a web browser`

**Varianta alternativă — Personal Access Token:**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token, cu permisiunea `repo`, fără dată de expirare
3. Rulează `git push` o dată; la cererea parolei, lipește token-ul.
   Windows îl memorează permanent (Credential Manager).

> Contul folosit trebuie să aibă **drept de scriere** pe repository.
> Dacă e contul altcuiva decât proprietarul repo-ului, adaugă-l la
> *Settings → Collaborators*.

### Pasul 6 — Stabilește branch-ul de publicare

Deschide `admin_server.py` și setează branch-ul pe care se publică site-ul live:

```python
BRANCH_PUBLICARE = "main"   # sau branch-ul din care se face deploy
```

Dacă rămâne `None`, publică pe branch-ul curent din folder — riscant dacă folderul
lui rămâne pe alt branch. **Setează-l explicit.**

Asigură-te că folderul lui e pe acel branch:

```
git checkout main
```

### Pasul 7 — Testează publicarea

1. Dublu-click pe `admin.bat`
2. Adaugă un produs de test, cu o poză
3. Apasă **„Publică pe site"**
4. Trebuie să apară: *„Site-ul a fost actualizat cu succes!"*
5. Verifică pe GitHub că a apărut commit-ul
6. Șterge produsul de test și publică din nou

### Pasul 8 — Scurtătură pe desktop

Click dreapta pe `admin.bat` → *Send to* → *Desktop (create shortcut)*.
Redenumește scurtătura în **„Administrare site"**.

---

## Instrucțiuni de lăsat proprietarului

> Poți printa secțiunea asta și să i-o lași lângă calculator.

### Ca să adaugi produse

1. Dublu-click pe **„Administrare site"** de pe desktop
2. Se deschide singur în browser. Lasă fereastra neagră deschisă cât timp lucrezi.
3. Alege **Produse** sau **Pachete funerare**
4. Alege categoria, apoi un produs existent sau **„Produs nou"**
5. Trage pozele în chenarul punctat (sau apasă pe el ca să le alegi)
6. Completează Preț, Material, Dimensiuni, Stoc, Descriere
7. Apasă **„Salvează modificările"**
8. La final, apasă butonul auriu **„Publică pe site"** — gata, apare pe site

### Ce înseamnă bara de sus

- **Galben** — ai modificări care nu sunt încă pe site → apasă „Publică pe site"
- **Verde** — site-ul este la zi, nu ai nimic de făcut
- **Roșu** — ceva nu a mers; citește mesajul sau sună persoana care se ocupă de site

### Despre stoc

- **În stoc** / **Cantitate limitată** — produsul apare pe site
- **Stoc epuizat** — produsul **dispare de pe site**, dar pozele și detaliile rămân salvate.
  Când îl pui la loc pe „În stoc", reapare instant, fără să reintroduci nimic.

### Sfaturi pentru poze

- Cel mai bine arată pozele **pătrate** (ex. 1024x1024 px)
- Poți pune mai multe poze pentru un produs — apar săgeți de răsfoire
- Poza se vede întotdeauna întreagă, nu e tăiată

---

## Pentru dezvoltator

### Rulare locală + testare pe telefon

Dublu-click pe **`test-pe-telefon.bat`** (sau `py test_server.py`).

Fereastra afișează direct ambele adrese:
```
Pe acest calculator:  http://localhost:8000
Pe telefon:           http://192.168.x.x:8000
```
Telefonul trebuie să fie pe același Wi-Fi.

> Folosește acest server, **nu** `py -m http.server`. Cel simplu nu trimite
> instrucțiuni de cache, iar telefoanele rețin fișierele `.js` vechi — produsele
> nou adăugate par să nu apară, deși sunt salvate corect.

### Panoul de admin

```
py admin_server.py
```
Rulează pe <http://127.0.0.1:8123/admin.html> (doar local).

### Unde se modifică lucrurile

| Vrei să schimbi | Fișier |
|---|---|
| Culori, fonturi, aspect | `style.css` (variabilele din `:root`, sus) |
| Categorii de produse | `script.js` + `admin.js` (`CATEGORII`, `SUBCATEGORII`) și `produse.html` |
| Ordinea meniului | `script.js`, constanta `MENIU_ORDINE` |
| Ce se publică la apăsarea butonului | `admin_server.py`, constanta `CAI_CONTINUT` |
| Branch-ul de publicare | `admin_server.py`, constanta `BRANCH_PUBLICARE` |

### Dacă adaugi o categorie nouă

Trebuie modificate **trei** locuri:
1. `produse.html` — butonul de filtru + secțiunea categoriei
2. `script.js` — `SUBCATEGORII` (dacă are subcategorii)
3. `admin.js` — `CATEGORII`, `ETICHETE_CATEGORII`, `SUBCATEGORII`
4. `admin_server.py` — `CATEGORII`

---

## Probleme frecvente

**`admin.bat` nu pornește (fereastra apare și dispare)**
Python nu e instalat sau nu e în PATH. Reinstalează Python bifând „Add Python to PATH".

**Nu se deschide pagina de admin**
Deschide manual <http://127.0.0.1:8123/admin.html>.
Dacă scrie că panoul rulează deja, închide ferestrele negre deschise și încearcă din nou.

**„Publică pe site" dă eroare de trimitere**
- Verifică internetul
- Verifică autentificarea: `git push` manual în folderul site-ului
- Dacă cere parolă, refă Pasul 5

**Proprietarul nu vede butonul „Publică pe site"**
Închide panoul, redeschide `admin.bat`, apoi `Ctrl+F5` în browser.

**Modificările nu apar pe site după publicare**
Publicarea trimite pe branch-ul din `BRANCH_PUBLICARE`. Verifică să fie exact
branch-ul din care se face deploy-ul (`main`, `gh-pages` etc.).

**Am editat manual `products.js` și s-au pierdut modificările**
Normal — e generat automat. Editează din panoul de admin.

**Produsele noi nu apar pe site (mai ales pe telefon)**
Aproape sigur e cache-ul browserului, nu o problemă de salvare.
Verifică întâi în `products.json` că produsul chiar există.
La testare locală folosește `test-pe-telefon.bat` (trimite „no-cache").
Pe site-ul live, ai grijă ca găzduirea să nu cache-uiască `products.js` mult timp —
Netlify și Vercel sunt corecte implicit; pe GitHub Pages pot trece ~10 minute.
