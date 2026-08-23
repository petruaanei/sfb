# Servicii Funerare Băltătești — site + panou de administrare

Site static (HTML / CSS / JavaScript, fără framework) cu **două panouri de
administrare**, prin care proprietarul adaugă produse și pachete fără să atingă cod:

- **Panou online** (`site.ro/cms`) — de pe orice tabletă, telefon sau calculator,
  de oriunde, fără să fie pornit vreun calculator. *Varianta principală.*
- **Panou local** (`admin.bat`) — rulează pe un calculator Windows, ca variantă
  de rezervă și pentru dezvoltator.

Ambele scriu în aceleași fișiere (`products.json`, `packages.json`), deci pot fi
folosite alternativ fără probleme.

---

## Cuprins

- [Structura proiectului](#structura-proiectului)
- [Cum funcționează administrarea](#cum-funcționează-administrarea)
- [Punerea online (o singură dată)](#punerea-online-o-singură-dată) ← *de făcut primul*
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
| `products.json` | **Datele produselor** — sursa unică, citită direct de site |
| `packages.json` | **Datele pachetelor** — sursa unică, citită direct de site |
| `cms/` | Panoul de administrare online (Decap CMS) |
| `images/` | Toate pozele (logo, slideshow, produse, servicii) |
| `admin.bat` | **Pornește panoul de administrare** (dublu-click) |
| `test-pe-telefon.bat` | Pornește site-ul pentru testare, inclusiv de pe telefon |
| `test_server.py` | Serverul de testare (fără cache, accesibil în rețeaua locală) |
| `diagnostic.html` | Pagină de verificare: ce date și ce versiune de script a încărcat dispozitivul |
| `admin_server.py` | Serverul local al panoului (Python) |
| `admin.html` / `admin.css` / `admin.js` | Interfața panoului de administrare |

> `products.json` și `packages.json` sunt **sursa unică de adevăr**. Le scriu
> ambele panouri și le citește site-ul direct, la deschiderea paginii.

---

## Cum funcționează administrarea

Site-ul citește produsele direct din `products.json` și `packages.json`.
Cine modifică aceste fișiere schimbă site-ul — și există două căi.

### A. Panoul online — `site.ro/cms` *(varianta principală)*

Proprietarul intră de pe orice dispozitiv, se loghează cu email și parolă,
adaugă produse și urcă poze direct din galeria tabletei. La apăsarea pe
**Publish**, modificarea se salvează automat în GitHub, iar Netlify
republică site-ul în aproximativ un minut.

Nu are nevoie de calculator pornit, de Python, de Git și nici măcar de a fi acasă.

### B. Panoul local — `admin.bat` *(rezervă)*

Rulează pe un calculator Windows, pe `127.0.0.1` (inaccesibil din exterior).
Adaugă produse, urcă poze, apoi apasă **„Publică pe site"**, care face automat
`git add`, `commit` și `push`.

**Se publică doar conținutul**: `products.json`, `packages.json` și folderul
`images/`. Modificările la cod (HTML/CSS/JS) **nu** pot fi trimise din greșeală —
lista e definită în `admin_server.py`, la constanta `CAI_CONTINUT`.

---

## Punerea online (o singură dată)

> De făcut de către dezvoltator. Durează ~30 de minute. Totul este gratuit.

### Pasul 1 — Creează site-ul pe Netlify

1. Intră pe <https://app.netlify.com> și loghează-te cu contul de GitHub
2. **Add new site → Import an existing project → GitHub**
3. Alege repository-ul `sfb`
4. Lasă setările goale (nu există build):
   - *Branch to deploy*: `main`
   - *Build command*: **gol**
   - *Publish directory*: **gol** (sau `.`)
5. **Deploy site**

Site-ul primește o adresă de forma `nume-aleator.netlify.app`. O poți schimba din
*Site configuration → Change site name*, sau poți lega un domeniu propriu
(ex. `serviciifunerarebaltatesti.ro`) din *Domain management*.

### Pasul 2 — Pornește autentificarea

1. În Netlify: *Site configuration → Identity* → **Enable Identity**
2. La *Registration preferences*, alege **Invite only**
   (altfel oricine s-ar putea înregistra singur)
3. Tot acolo, la *Services → Git Gateway*, apasă **Enable Git Gateway**
   (asta îi permite panoului să salveze în GitHub, fără ca proprietarul să aibă cont)

### Pasul 3 — Invită proprietarul

1. Tab-ul **Identity → Invite users**
2. Scrie `adrianciudin9@gmail.com` → *Send*
3. El primește un email, apasă pe link, își alege singur o parolă

### Pasul 4 — Verifică

1. Intră pe `https://<NUMELE-SITE-ULUI-TAU>.netlify.app/cms/`

   > Adresa reală o vezi în Netlify, sus, pe pagina site-ului. Nu este
   > `adresa-site.netlify.app` — acela e doar un exemplu. Netlify generează
   > un nume aleatoriu (ex. `magical-tiramisu-a1b2c3.netlify.app`), pe care
   > îl poți schimba din *Site configuration → Change site name*.
2. Loghează-te
3. Modifică un produs de test → **Publish**
4. După ~1 minut, verifică pe site că modificarea a apărut

> **Atenție la regula de protecție a branch-ului `main`.**
> Dacă în GitHub există o regulă care cere Pull Request, Git Gateway nu va putea
> salva. Scoate regula din *GitHub → Settings → Rules*, sau adaugă o excepție.

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

Clona vine implicit pe `main`, care conține tot proiectul — site, panou de
administrare și datele curente. Nu mai e nimic de configurat în cod.

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

### Pasul 6 — Verifică branch-ul

Publicarea e deja configurată pe `main` (`BRANCH_PUBLICARE = "main"` în
`admin_server.py`), deci nu trebuie schimbat nimic. Asigură-te doar că folderul
lui este pe `main`:

```
git checkout main
git pull
```

> Panoul refuză publicarea dacă folderul e pe alt branch și afișează un mesaj clar.
> Așa nu se poate întâmpla ca modificările să ajungă unde nu trebuie.

**Important — protecția branch-ului `main`:**
Repository-ul are o regulă care cere ca modificările să treacă prin Pull Request.
Proprietarul repo-ului poate trece peste ea, dar un cont de **colaborator va fi
respins**, iar butonul „Publică pe site" nu va funcționa. Ai două variante:

- *GitHub → Settings → Rules / Branches* → scoate regula de pe `main`, **sau**
- adaugă contul proprietarului în lista de excepții (*bypass list*) a regulii

Verifică asta înainte să predai calculatorul, la Pasul 7.

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

> Poți printa secțiunea asta și să i-o lași.

### Ca să adaugi produse — de pe tabletă, telefon sau calculator

1. Deschide în browser adresa panoului, primită de la persoana care se ocupă de site.
   Arată așa: **`numele-site-ului.netlify.app/cms`**
   *(salveaz-o la favorite sau pune-o pe ecranul principal al tabletei)*
2. Loghează-te cu emailul și parola ta
3. Apasă **Produse** (sau **Pachete funerare**), apoi **Lista de produse**
4. Ca să adaugi ceva nou, apasă **Add produs** (sus, în dreapta listei).
   Panoul te duce automat la produsul nou și îți pune cursorul în câmpul de nume.
5. Completează câmpurile, în ordinea în care apar:
   - **Numele produsului** — cum vrei să apară pe site
   - **Poze** — apasă *Add Poză* și alege din galerie; poți pune mai multe.
     Prima poză este cea care apare în listă.
   - **Preț (RON)** — scrie doar cifra, de exemplu `150`.
     „RON" se adaugă automat pe site.
   - **Categorie** și **Stoc**
   - **Subcategorie** — doar la Sicrie, Prosoape, Lenjerii și Veselă;
     în rest lasă „— fără —"
   - **Material**, **Dimensiuni**, **Descriere** — opționale
6. Apasă **Publish → Publish now** (sus)
7. După aproximativ un minut, produsul apare pe site

### Sfaturi

- Pozele se **micșorează automat** înainte de a ajunge la vizitatori, deci poți
  urca liniștit poze făcute direct cu telefonul
- Cel mai bine arată pozele **pătrate**
- Poți pune mai multe poze pentru un produs — pe site apar săgeți de răsfoire
- Poza se vede întotdeauna întreagă, nu e tăiată
- Dacă greșești ceva, intri din nou pe produs, corectezi și apeși iar **Publish**

### Despre stoc

- **În stoc** / **Cantitate limitată** — produsul apare pe site
- **Stoc epuizat** — produsul **dispare de pe site**, dar rămâne salvat cu tot
  cu poze. Când îl pui la loc pe „În stoc", reapare instant, fără să reintroduci nimic.

---

### Varianta de rezervă — de pe calculatorul cu programul instalat

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

---

## Pentru dezvoltator

### Rulare locală + testare pe telefon

Dublu-click pe **`test-pe-telefon.bat`** (sau `py test_server.py`).

Fereastra afișează direct ambele adrese:
```
Pe acest calculator:  http://localhost:8010
Pe telefon:           http://192.168.x.x:8010
```
Telefonul trebuie să fie pe același Wi-Fi.

> Folosește acest server, **nu** `py -m http.server`. Cel simplu nu trimite
> instrucțiuni de cache, iar telefoanele rețin fișierele `.js` vechi — produsele
> nou adăugate par să nu apară, deși sunt salvate corect.

Dacă totuși un browser rămâne blocat pe o versiune veche, pornește pe alt port:
```
py test_server.py 8011
```
Fiind o adresă nouă, browserul o tratează ca pe un site nou și încarcă totul curat.

Pentru verificare rapidă, `diagnostic.html` arată ce a încărcat efectiv dispozitivul
(câte produse, ce versiune de `script.js`, eventuale erori JavaScript):
`http://192.168.x.x:8010/diagnostic.html`

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
| Redimensionarea automată a pozelor | `script.js`, constanta `REDIMENSIONARE_AUTOMATA` |
| Branch-ul de publicare | `admin_server.py`, constanta `BRANCH_PUBLICARE` |

### Dacă adaugi o categorie nouă

Trebuie modificate **trei** locuri:
1. `produse.html` — butonul de filtru + secțiunea categoriei
2. `script.js` — `SUBCATEGORII` (dacă are subcategorii)
3. `admin.js` — `CATEGORII`, `ETICHETE_CATEGORII`, `SUBCATEGORII`
4. `admin_server.py` — `CATEGORII`

---

## Poze și consum

Pozele urcate din telefon pot avea 2-4 MB. Site-ul **nu** le trimite așa
vizitatorilor: sunt redimensionate și comprimate la cerere de serviciul de
imagini Netlify, iar originalul rămâne neatins în arhivă.

| Unde apare poza | Lățime trimisă |
|---|---|
| Card în catalog | 600 px |
| Pagina produsului | 1100 px |
| Zoom pe toată pagina | 1600 px |
| Rezultat în căutare | 120 px |

În plus, pozele se încarcă doar când ajungi cu derularea la ele (`loading="lazy"`),
deci o vizită descarcă doar ce se vede efectiv.

Local (`localhost` sau adresă din rețea) serviciul Netlify nu există, așa că se
folosesc fișierele originale — comportamentul e identic vizual.

Ca să dezactivezi complet mecanismul (de exemplu dacă site-ul se mută de pe
Netlify), pune `REDIMENSIONARE_AUTOMATA = false` în `script.js`.

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

**Am editat manual un produs în fișier și nu se vede corect**
Editează din panoul online (`/cms`) sau din cel local — validează structura automat.
Dacă tot editezi manual, păstrează forma `{"produse": [ ... ]}`.

**Produsele noi nu apar pe site (mai ales pe telefon)**
Aproape sigur e cache-ul browserului, nu o problemă de salvare.
Verifică întâi în `products.json` că produsul chiar există.
La testare locală folosește `test-pe-telefon.bat` (trimite „no-cache").
Pe site-ul live nu apare problema: `products.json` e cerut cu marcaj de timp,
deci browserul ia mereu ultima versiune.
