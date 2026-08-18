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

let PRODUSE = [];
let stare = { view: "categorii" };

const app = document.getElementById("app");

document.addEventListener("DOMContentLoaded", incarcaSiRandeaza);

async function incarcaSiRandeaza() {
  PRODUSE = await fetch("products.json?t=" + Date.now()).then((r) => r.json());
  randeaza();
}

async function apiCall(payload) {
  const res = await fetch("/api/produse", {
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
  if (stare.view === "categorii") return randeazaCategorii();
  if (stare.view === "categorie") return randeazaCategorie(stare.categorie);
  if (stare.view === "produs") return randeazaProdus(stare.categorie, stare.id);
}

/* ===== ECRAN 1: CATEGORII ===== */
function randeazaCategorii() {
  const tiles = CATEGORII.map((cat) => {
    const produseCategorie = PRODUSE.filter((p) => p.categorie === cat);
    const poza = produseCategorie.find((p) => p.imagini.length)?.imagini[0];
    return `
      <div class="tile" data-cat="${cat}">
        ${poza ? `<img class="tile-img" src="${poza}" alt="">` : `<div class="tile-icon">🗂️</div>`}
        <div>${ETICHETE_CATEGORII[cat]}</div>
        <div class="tile-count">${produseCategorie.length} produse</div>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <h2 class="admin-titlu">Alege o categorie</h2>
    <div class="tile-grid">${tiles}</div>
  `;

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
      <div class="tile" data-id="${p.id}">
        ${
          p.imagini.length
            ? `<img class="tile-img" src="${p.imagini[0]}" alt="">`
            : `<div class="tile-icon">🖼️</div>`
        }
        <div>${p.nume}</div>
        <div class="tile-count">${p.imagini.length} poze</div>
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
        <div style="font-size:1.4rem; color: var(--gold); text-align:center;">+ Produs nou</div>
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
        <span id="dropZoneText">➕ Trage poze aici<br>sau apasă ca să alegi</span>
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
      <label>Descriere
        <textarea id="campDescriere" placeholder="Descriere scurtă">${escapeHtml(produs.descriere)}</textarea>
      </label>
      <button class="buton buton-salveaza" id="salveazaProdus">💾 Salvează modificările</button>
      <a class="produs-vezi-site" href="produs.html?id=${encodeURIComponent(produs.id)}" target="_blank">Vezi produsul pe site ↗</a>
      <button class="buton buton-sterge" id="stergeProdus">🗑 Șterge produsul</button>
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
