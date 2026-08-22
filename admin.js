const CATEGORII = ["accesorii", "coroane", "felinare", "imbracaminte", "lenjerii", "prosoape", "sicrie", "vesela"];
const ETICHETE_CATEGORII = {
  accesorii: "Accesorii",
  coroane: "Coroane",
  felinare: "Felinare",
  imbracaminte: "Îmbrăcăminte",
  lenjerii: "Lenjerii",
  prosoape: "Prosoape",
  sicrie: "Sicrie",
  vesela: "Veselă",
};

const SUBCATEGORII = {
  sicrie: [
    { id: "premium", eticheta: "Premium" },
    { id: "clasic", eticheta: "Clasic" },
  ],
  prosoape: [
    { id: "mici", eticheta: "Mici" },
    { id: "medii", eticheta: "Medii" },
    { id: "mari", eticheta: "Mari" },
  ],
  lenjerii: [
    { id: "lenjerii-pat", eticheta: "Lenjerii de pat" },
    { id: "plapumi", eticheta: "Plăpumi" },
  ],
  vesela: [
    { id: "pahare", eticheta: "Pahare" },
    { id: "cani", eticheta: "Căni" },
    { id: "farfurii", eticheta: "Farfurii" },
    { id: "boluri", eticheta: "Boluri" },
    { id: "vas-iena", eticheta: "Vas Iena" },
    { id: "oale", eticheta: "Oale" },
  ],
};

let PRODUSE = [];
let PACHETE = [];
let stare = { view: "acasa" };

const app = document.getElementById("app");

document.addEventListener("DOMContentLoaded", () => {
  incarcaSiRandeaza();
  initPublicare();
});

/* ===== PUBLICARE PE SITE ===== */
function initPublicare() {
  const buton = document.getElementById("butonPublica");
  const text = document.getElementById("publicaText");
  const bara = document.getElementById("publicaBara");
  const stare = document.getElementById("publicaStare");
  if (!buton) return;

  async function verificaStarea() {
    try {
      const res = await fetch("/api/publica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });
      const data = await res.json();
      const n = data.nepublicate;

      if (n === null || n === undefined) {
        bara.className = "publica-bara";
        stare.textContent = "";
        return;
      }

      if (n > 0) {
        bara.className = "publica-bara are-modificari";
        stare.textContent =
          n === 1
            ? "Ai 1 modificare care nu este încă pe site. Apasă „Publică pe site”."
            : `Ai ${n} modificări care nu sunt încă pe site. Apasă „Publică pe site”.`;
        buton.classList.add("evidentiat");
      } else {
        bara.className = "publica-bara la-zi";
        stare.textContent = "Site-ul este la zi.";
        buton.classList.remove("evidentiat");
      }
    } catch (e) {
      bara.className = "publica-bara";
      stare.textContent = "";
    }
  }

  buton.addEventListener("click", async () => {
    buton.disabled = true;
    text.textContent = "Se publică...";
    bara.className = "publica-bara in-lucru";
    stare.textContent = "Se trimit modificările către site, așteaptă puțin...";

    try {
      const res = await fetch("/api/publica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publica" }),
      });
      const data = await res.json();

      if (res.ok) {
        bara.className = "publica-bara la-zi";
        stare.textContent = data.mesaj;
        alert(data.mesaj);
      } else {
        bara.className = "publica-bara eroare";
        stare.textContent = data.mesaj || data.eroare || "Publicarea nu a reușit.";
        alert(stare.textContent);
      }
    } catch (e) {
      bara.className = "publica-bara eroare";
      stare.textContent = "Publicarea nu a reușit. Verifică internetul și încearcă din nou.";
      alert(stare.textContent);
    }

    buton.disabled = false;
    text.textContent = "Publică pe site";
    verificaStarea();
  });

  // e apelată și după fiecare modificare de produs/pachet
  window.verificaStareaPublicare = verificaStarea;

  verificaStarea();
  // reverifică periodic, ca bara să reflecte modificările făcute între timp
  setInterval(verificaStarea, 15000);
}

async function incarcaSiRandeaza() {
  PRODUSE = await fetch("products.json?t=" + Date.now()).then((r) => r.json());
  PACHETE = await fetch("packages.json?t=" + Date.now()).then((r) => r.json());
  randeaza();
  if (window.verificaStareaPublicare) window.verificaStareaPublicare();
}

async function apiCall(payload, ruta = "/api/produse") {
  const res = await fetch(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.eroare || "A apărut o eroare.");
  return data;
}

function mergiLa(view, extra = {}) {
  stare = { view, ...extra };
  randeaza();
}

function randeaza() {
  if (stare.view === "acasa") return randeazaAcasa();
  if (stare.view === "categorii") return randeazaCategorii();
  if (stare.view === "categorie") return randeazaCategorie(stare.categorie);
  if (stare.view === "produs") return randeazaProdus(stare.categorie, stare.id);
  if (stare.view === "pachete") return randeazaPachete();
  if (stare.view === "pachet") return randeazaPachet(stare.id);
}

/* ===== ICONIȚE (linii subțiri, în ton cu site-ul) ===== */
const ICONITE = {
  cutie: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>`,
  pachet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="8" width="18" height="13"/><path d="M3 12h18M12 8v13"/><path d="M12 8s-1-5-4-5-2 5 4 5zM12 8s1-5 4-5 2 5-4 5z"/></svg>`,
  dosar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 6h6l2 2.5h10V19H3z"/></svg>`,
  imagine: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="5" width="18" height="14"/><circle cx="8.5" cy="10" r="1.4"/><path d="m3 17 5-4.5 4 3.5 3-2.5 6 4.5"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 5v14M5 12h14"/></svg>`,
};

/* ===== ECRAN 0: ACASĂ (alegere Produse / Pachete) ===== */
function randeazaAcasa() {
  app.innerHTML = `
    <h2 class="admin-titlu">Ce vrei să administrezi?</h2>
    <div class="tile-grid">
      <div class="tile" id="mergiProduse">
        <div class="tile-marcaj">${ICONITE.cutie}</div>
        <div class="tile-nume">Produse</div>
        <div class="tile-count">${PRODUSE.length} produse</div>
      </div>
      <div class="tile" id="mergiPachete">
        <div class="tile-marcaj">${ICONITE.pachet}</div>
        <div class="tile-nume">Pachete funerare</div>
        <div class="tile-count">${PACHETE.length} pachete</div>
      </div>
    </div>
  `;

  document.getElementById("mergiProduse").addEventListener("click", () => mergiLa("categorii"));
  document.getElementById("mergiPachete").addEventListener("click", () => mergiLa("pachete"));
}

/* ===== ECRAN 1: CATEGORII ===== */
function randeazaCategorii() {
  const tiles = CATEGORII.map((cat) => {
    const produseCategorie = PRODUSE.filter((p) => p.categorie === cat);
    const poza = produseCategorie.find((p) => p.imagini.length)?.imagini[0];
    return `
      <div class="tile" data-cat="${cat}">
        ${poza ? `<img class="tile-img" src="${poza}" alt="">` : `<div class="tile-marcaj">${ICONITE.dosar}</div>`}
        <div class="tile-nume">${ETICHETE_CATEGORII[cat]}</div>
        <div class="tile-count">${produseCategorie.length} produse</div>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <a class="admin-inapoi" id="inapoi">‹ Înapoi</a>
    <h2 class="admin-titlu">Alege o categorie</h2>
    <div class="tile-grid">${tiles}</div>
  `;

  document.getElementById("inapoi").addEventListener("click", () => mergiLa("acasa"));

  app.querySelectorAll(".tile[data-cat]").forEach((el) => {
    el.addEventListener("click", () => mergiLa("categorie", { categorie: el.dataset.cat }));
  });
}

/* ===== ECRAN 2: PRODUSELE DINTR-O CATEGORIE ===== */
function randeazaCategorie(categorie) {
  const produseCategorie = PRODUSE.filter((p) => p.categorie === categorie);

  const tiles = produseCategorie
    .map(
      (p) => `
      <div class="tile ${p.stoc === "epuizat" ? "tile-arhivat" : ""}" data-id="${p.id}">
        ${
          p.imagini.length
            ? `<img class="tile-img" src="${p.imagini[0]}" alt="">`
            : `<div class="tile-marcaj">${ICONITE.imagine}</div>`
        }
        <div class="tile-nume">${p.nume}</div>
        <div class="tile-count">${p.stoc === "epuizat" ? "Arhivat — nu apare pe site" : `${p.imagini.length} poze`}</div>
      </div>
    `
    )
    .join("");

  app.innerHTML = `
    <a class="admin-inapoi" id="inapoi">‹ Înapoi la categorii</a>
    <h2 class="admin-titlu">${ETICHETE_CATEGORII[categorie]}</h2>
    <div class="tile-grid">
      ${tiles}
      <div class="form-nou" id="formNou">
        <div class="form-nou-titlu">Produs nou</div>
        <input type="text" id="numeProdusNou" placeholder="Numele produsului">
        <button class="buton buton-salveaza" id="creeazaProdus">Creează</button>
      </div>
    </div>
  `;

  document.getElementById("inapoi").addEventListener("click", () => mergiLa("categorii"));

  app.querySelectorAll(".tile[data-id]").forEach((el) => {
    el.addEventListener("click", () => mergiLa("produs", { categorie, id: el.dataset.id }));
  });

  document.getElementById("creeazaProdus").addEventListener("click", async () => {
    const nume = document.getElementById("numeProdusNou").value.trim();
    if (!nume) return;
    try {
      const { produs } = await apiCall({ action: "create", categorie, nume });
      await incarcaSiRandeaza();
      mergiLa("produs", { categorie, id: produs.id });
    } catch (e) {
      alert(e.message);
    }
  });
}

/* ===== ECRAN 3: DETALII PRODUS (poze + informații) ===== */
function randeazaProdus(categorie, id) {
  const produs = PRODUSE.find((p) => p.id === id);
  if (!produs) return mergiLa("categorie", { categorie });

  const poze = produs.imagini
    .map(
      (cale) => `
      <div class="imagine-card">
        <img src="${cale}" alt="">
        <button class="imagine-sterge" data-cale="${cale}" title="Șterge poza">×</button>
      </div>
    `
    )
    .join("");

  app.innerHTML = `
    <a class="admin-inapoi" id="inapoi">‹ Înapoi la ${ETICHETE_CATEGORII[categorie]}</a>
    <h2 class="admin-titlu">${produs.nume}</h2>

    <div class="sectiune-titlu">Poze produs</div>
    <div class="imagini-grid">
      ${poze}
      <div class="drop-zone" id="dropZone">
        ${ICONITE.plus}
        <span id="dropZoneText">Trage poze aici<br>sau apasă ca să alegi</span>
        <input type="file" id="fileInput" accept="image/*" multiple hidden>
      </div>
    </div>

    <div class="sectiune-titlu">Detalii</div>
    <div class="detalii-form">
      <label>Nume produs
        <input type="text" id="campNume" value="${escapeAttr(produs.nume)}">
      </label>
      <label>Preț
        <div class="input-cu-sufix">
          <input type="number" id="campPret" min="0" step="0.01" value="${escapeAttr(extrageNumarPret(produs.pret))}" placeholder="ex: 50">
          <span>RON</span>
        </div>
      </label>
      <label>Material
        <input type="text" id="campMaterial" value="${escapeAttr(produs.material)}" placeholder="ex: Bumbac 100%">
      </label>
      <label>Dimensiuni
        <input type="text" id="campDimensiuni" value="${escapeAttr(produs.dimensiuni)}" placeholder="ex: 70x140 cm">
      </label>
      ${
        SUBCATEGORII[categorie]
          ? `<label>Subcategorie
        <select id="campSubcategorie">
          <option value="">Alege...</option>
          ${SUBCATEGORII[categorie]
            .map(
              (sub) =>
                `<option value="${sub.id}" ${produs.subcategorie === sub.id ? "selected" : ""}>${sub.eticheta}</option>`
            )
            .join("")}
        </select>
      </label>`
          : ""
      }
      <label>Stoc
        <select id="campStoc">
          <option value="in_stoc" ${produs.stoc === "in_stoc" || !produs.stoc ? "selected" : ""}>În stoc</option>
          <option value="limitat" ${produs.stoc === "limitat" ? "selected" : ""}>Cantitate limitată</option>
          <option value="epuizat" ${produs.stoc === "epuizat" ? "selected" : ""}>Stoc epuizat (sold out)</option>
        </select>
      </label>
      <label>Descriere
        <textarea id="campDescriere" placeholder="Descriere scurtă">${escapeHtml(produs.descriere)}</textarea>
      </label>
      <button class="buton buton-salveaza" id="salveazaProdus">Salvează modificările</button>
      <a class="produs-vezi-site" href="produs.html?id=${encodeURIComponent(produs.id)}" target="_blank">Vezi produsul pe site ↗</a>
      <button class="buton buton-sterge" id="stergeProdus">Șterge produsul</button>
    </div>
  `;

  document.getElementById("inapoi").addEventListener("click", () => mergiLa("categorie", { categorie }));

  // ștergere poză
  app.querySelectorAll(".imagine-sterge").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Ștergi această poză?")) return;
      try {
        await apiCall({ action: "delete_imagine", id: produs.id, imagine: btn.dataset.cale });
        await incarcaSiRandeaza();
      } catch (e) {
        alert(e.message);
      }
    });
  });

  // adăugare poze (drag & drop + click)
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => incarcaImagini(produs.id, e.target.files));

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag");
    incarcaImagini(produs.id, e.dataTransfer.files);
  });

  // salvare detalii
  document.getElementById("salveazaProdus").addEventListener("click", async () => {
    try {
      const numarPret = document.getElementById("campPret").value.trim();
      await apiCall({
        action: "update",
        id: produs.id,
        nume: document.getElementById("campNume").value,
        pret: numarPret ? `${numarPret} RON` : "",
        material: document.getElementById("campMaterial").value,
        dimensiuni: document.getElementById("campDimensiuni").value,
        subcategorie: document.getElementById("campSubcategorie")?.value || "",
        stoc: document.getElementById("campStoc").value,
        descriere: document.getElementById("campDescriere").value,
      });
      await incarcaSiRandeaza();
      alert("Modificările au fost salvate!");
    } catch (e) {
      alert(e.message);
    }
  });

  // ștergere produs
  document.getElementById("stergeProdus").addEventListener("click", async () => {
    if (!confirm(`Ștergi produsul "${produs.nume}" și toate pozele lui?`)) return;
    try {
      await apiCall({ action: "delete_produs", id: produs.id });
      await incarcaSiRandeaza();
      mergiLa("categorie", { categorie });
    } catch (e) {
      alert(e.message);
    }
  });
}

/* ===== ECRAN: LISTA DE PACHETE ===== */
function randeazaPachete() {
  const tiles = PACHETE.map(
    (p) => `
      <div class="tile" data-id="${p.id}">
        <div class="tile-marcaj">${ICONITE.pachet}</div>
        <div>${p.nume}</div>
        <div class="tile-count">${p.pret || "fără preț"}</div>
      </div>
    `
  ).join("");

  app.innerHTML = `
    <a class="admin-inapoi" id="inapoi">‹ Înapoi</a>
    <h2 class="admin-titlu">Pachete funerare</h2>
    <div class="tile-grid">
      ${tiles}
      <div class="form-nou" id="formNou">
        <div style="font-size:1.4rem; color: var(--gold); text-align:center;">+ Pachet nou</div>
        <input type="text" id="numePachetNou" placeholder="Numele pachetului">
        <button class="buton buton-salveaza" id="creeazaPachet">Creează</button>
      </div>
    </div>
  `;

  document.getElementById("inapoi").addEventListener("click", () => mergiLa("acasa"));

  app.querySelectorAll(".tile[data-id]").forEach((el) => {
    el.addEventListener("click", () => mergiLa("pachet", { id: el.dataset.id }));
  });

  document.getElementById("creeazaPachet").addEventListener("click", async () => {
    const nume = document.getElementById("numePachetNou").value.trim();
    if (!nume) return;
    try {
      const { pachet } = await apiCall({ action: "create", nume }, "/api/pachete");
      await incarcaSiRandeaza();
      mergiLa("pachet", { id: pachet.id });
    } catch (e) {
      alert(e.message);
    }
  });
}

/* ===== ECRAN: DETALII PACHET ===== */
function randeazaPachet(id) {
  const pachet = PACHETE.find((p) => p.id === id);
  if (!pachet) return mergiLa("pachete");

  app.innerHTML = `
    <a class="admin-inapoi" id="inapoi">‹ Înapoi la pachete</a>
    <h2 class="admin-titlu">${pachet.nume}</h2>

    <div class="detalii-form">
      <label>Nume pachet
        <input type="text" id="campNume" value="${escapeAttr(pachet.nume)}">
      </label>
      <label>Preț
        <div class="input-cu-sufix">
          <input type="number" id="campPret" min="0" step="1" value="${escapeAttr(extrageNumarPret(pachet.pret))}" placeholder="ex: 10000">
          <span>RON</span>
        </div>
      </label>
      <label>Etichetă (opțional, ex: "Cel mai complet")
        <input type="text" id="campEticheta" value="${escapeAttr(pachet.eticheta)}" placeholder="lasă gol dacă nu vrei etichetă">
      </label>
      <label>Ce conține (un element pe fiecare linie)
        <textarea id="campItemi" placeholder="Sicriu, cruce...&#10;Transport funerar&#10;...">${escapeHtml((pachet.itemi || []).join("\n"))}</textarea>
      </label>
      <label>Descriere
        <textarea id="campDescriere" placeholder="Descriere scurtă">${escapeHtml(pachet.descriere)}</textarea>
      </label>
      <button class="buton buton-salveaza" id="salveazaPachet">Salvează modificările</button>
      <a class="produs-vezi-site" href="pachete.html" target="_blank">Vezi pachetele pe site ↗</a>
      <button class="buton buton-sterge" id="stergePachet">Șterge pachetul</button>
    </div>
  `;

  document.getElementById("inapoi").addEventListener("click", () => mergiLa("pachete"));

  document.getElementById("salveazaPachet").addEventListener("click", async () => {
    try {
      const numarPret = document.getElementById("campPret").value.trim();
      const itemi = document
        .getElementById("campItemi")
        .value.split("\n")
        .map((linie) => linie.trim())
        .filter(Boolean);

      await apiCall(
        {
          action: "update",
          id: pachet.id,
          nume: document.getElementById("campNume").value,
          pret: numarPret ? `${numarPret} RON` : "",
          eticheta: document.getElementById("campEticheta").value,
          itemi,
          descriere: document.getElementById("campDescriere").value,
        },
        "/api/pachete"
      );
      await incarcaSiRandeaza();
      alert("Modificările au fost salvate!");
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById("stergePachet").addEventListener("click", async () => {
    if (!confirm(`Ștergi pachetul "${pachet.nume}"?`)) return;
    try {
      await apiCall({ action: "delete_pachet", id: pachet.id }, "/api/pachete");
      await incarcaSiRandeaza();
      mergiLa("pachete");
    } catch (e) {
      alert(e.message);
    }
  });
}

async function incarcaImagini(produsId, fileList) {
  const dropZone = document.getElementById("dropZone");
  const dropZoneText = document.getElementById("dropZoneText");
  dropZone.classList.add("loading");
  dropZoneText.textContent = "Se încarcă...";

  try {
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fisierToDataURL(file);
      await apiCall({ action: "add_imagine", id: produsId, data: dataUrl });
    }
    await incarcaSiRandeaza();
  } catch (e) {
    alert(e.message);
  }
}

function fisierToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extrageNumarPret(pret) {
  const m = (pret || "").match(/[\d.,]+/);
  return m ? m[0].replace(",", ".") : "";
}

function escapeAttr(text) {
  return (text || "").replace(/"/g, "&quot;");
}

function escapeHtml(text) {
  return (text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
