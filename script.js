// Marcaj de versiune — folosit de pagina de diagnostic ca să vedem
// dacă browserul a încărcat ultima variantă a fișierului.
const VERSIUNE_SCRIPT = "2026-08-22-b";

// Datele site-ului, citite din fișierele JSON la deschiderea paginii.
// Sursa unică de adevăr: products.json și packages.json — aceleași fișiere
// pe care le scriu atât panoul local (admin.bat), cât și panoul online.
let PRODUCTS = [];
let PACHETE = [];

async function incarcaDate() {
  const cuOraCurenta = (fisier) => `${fisier}?t=${Date.now()}`;

  async function ia(fisier, cheie) {
    try {
      const res = await fetch(cuOraCurenta(fisier), { cache: "no-store" });
      if (!res.ok) return [];
      const date = await res.json();
      // acceptă atât forma nouă {"cheie": [...]}, cât și o listă simplă
      return Array.isArray(date) ? date : date[cheie] || [];
    } catch (e) {
      return [];
    }
  }

  [PRODUCTS, PACHETE] = await Promise.all([
    ia("products.json", "produse"),
    ia("packages.json", "pachete"),
  ]);

  PRODUCTS = completeazaIdentificatori(PRODUCTS);
  PACHETE = completeazaIdentificatori(PACHETE);
}

/* ===== IMAGINI REDIMENSIONATE AUTOMAT =====
   Pozele urcate din telefon pot avea 2-4 MB. Nu are rost să fie trimise așa
   vizitatorilor: Netlify le redimensionează și le comprimă la cerere, iar
   originalul rămâne neatins în arhivă.

   Pune false dacă site-ul se mută de pe Netlify — atunci se folosesc
   pozele originale, ca înainte. */
const REDIMENSIONARE_AUTOMATA = true;

/* Local (localhost sau rețeaua de acasă) nu există serviciul Netlify,
   așa că folosim fișierele originale. */
const RULEAZA_LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\d+\.\d+\.\d+\.\d+)$/.test(
  window.location.hostname
);

function urlImagine(cale, latime) {
  if (!cale) return cale;
  if (!REDIMENSIONARE_AUTOMATA || RULEAZA_LOCAL) return cale;
  if (/^https?:/i.test(cale)) return cale;

  const caleAbsoluta = cale.startsWith("/") ? cale : `/${cale}`;
  return `/.netlify/images?url=${encodeURIComponent(caleAbsoluta)}&w=${latime}&fit=contain`;
}

/* Prețul e salvat ca număr (ex. 150), iar moneda se adaugă aici, la afișare.
   Acceptă și forma veche, scrisă ca text (ex. "150 RON"). */
function formateazaPret(valoare) {
  if (valoare === null || valoare === undefined || valoare === "") return "";

  if (typeof valoare === "number") {
    return `${valoare.toLocaleString("ro-RO")} RON`;
  }

  const text = String(valoare).trim();
  if (!text) return "";
  if (/ron|lei/i.test(text)) return text; // conține deja moneda

  const numar = parseFloat(text.replace(",", "."));
  return isNaN(numar) ? text : `${numar.toLocaleString("ro-RO")} RON`;
}

/* Transformă un nume în identificator: "Prosop Mare" -> "prosop-mare" */
function faIdentificator(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Produsele adăugate din panoul online nu au identificator — îl generăm aici,
   din nume, ca link-urile către pagina produsului să funcționeze. */
function completeazaIdentificatori(lista) {
  const folosite = new Set(lista.map((x) => x.id).filter(Boolean));

  return lista.map((element) => {
    if (element.id) return element;

    const baza = faIdentificator(element.nume) || "produs";
    let id = baza;
    let n = 2;
    while (folosite.has(id)) {
      id = `${baza}-${n}`;
      n++;
    }
    folosite.add(id);
    return { ...element, id };
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // partea vizuală pornește imediat, nu așteaptă datele
  initHeader();
  initMeniuMobil();
  initHeroSlideshow();

  await incarcaDate();

  initCatalog();
  initProductDetail();
  initCategoriiNav();
  initPachete();
  initCautareProduse();
  initHintDerulare();
});

/* ===== MENIU MOBIL (buton hamburger + panou) =====
   Ordinea este fixată aici, ca să fie identică pe toate paginile. */
const MENIU_ORDINE = [
  { href: "index.html", text: "Acasă" },
  { href: "servicii.html", text: "Servicii" },
  { href: "produse.html", text: "Produse" },
  { href: "pachete.html", text: "Pachete funerare" },
  { href: "despre.html", text: "Despre noi" },
  { href: "contact.html", text: "Contact" },
];

function initMeniuMobil() {
  const header = document.querySelector("header");
  const nav = header && header.querySelector("nav");
  if (!nav) return;

  const buton = document.createElement("button");
  buton.type = "button";
  buton.className = "meniu-toggle";
  buton.setAttribute("aria-label", "Deschide meniul");
  buton.setAttribute("aria-expanded", "false");
  buton.innerHTML = `
    <span class="meniu-linii"><span></span><span></span><span></span></span>
    <span class="meniu-eticheta">Meniu</span>
  `;
  nav.appendChild(buton);

  // pagina curentă (produs.html se consideră tot "Produse")
  let paginaCurenta = window.location.pathname.split("/").pop() || "index.html";
  if (paginaCurenta === "produs.html") paginaCurenta = "produse.html";

  const panou = document.createElement("div");
  panou.className = "meniu-mobil";

  const lista = document.createElement("ul");
  MENIU_ORDINE.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.text;
    if (item.href === paginaCurenta) link.classList.add("active");
    li.appendChild(link);
    lista.appendChild(li);
  });

  panou.appendChild(lista);
  document.body.appendChild(panou);

  const eticheta = buton.querySelector(".meniu-eticheta");

  function comuta(deschis) {
    document.documentElement.classList.toggle("meniu-deschis", deschis);
    buton.setAttribute("aria-expanded", String(deschis));
    buton.setAttribute("aria-label", deschis ? "Închide meniul" : "Deschide meniul");
    eticheta.textContent = deschis ? "Închide" : "Meniu";
  }

  buton.addEventListener("click", () => {
    comuta(!document.documentElement.classList.contains("meniu-deschis"));
  });

  panou.addEventListener("click", (e) => {
    if (e.target === panou || e.target.tagName === "A") comuta(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") comuta(false);
  });
}

/* ===== INDICIU: bara de categorii se trage lateral (doar pe telefon) ===== */
function initHintDerulare() {
  const bara = document.querySelector(".categorii-nav");
  if (!bara) return;

  // apare doar dacă bara chiar are conținut ascuns lateral
  if (bara.scrollWidth <= bara.clientWidth + 10) return;

  const hint = document.createElement("div");
  hint.className = "derulare-hint";
  hint.innerHTML = `<span class="hint-sageata">&#8592;</span> Trage lateral pentru toate categoriile <span class="hint-sageata">&#8594;</span>`;

  // se pune SUB rândul de filtre, nu în interiorul lui (acolo ar strica aranjarea)
  const rand = bara.closest(".filtre-rand") || bara;
  rand.insertAdjacentElement("afterend", hint);

  function ascunde() {
    hint.classList.add("ascuns");
  }

  bara.addEventListener("scroll", ascunde, { once: true, passive: true });
  setTimeout(ascunde, 9000);

  // mică mișcare inițială, ca să se vadă că bara se poate trage
  setTimeout(() => {
    if (hint.classList.contains("ascuns")) return;
    bara.scrollTo({ left: 46, behavior: "smooth" });
    setTimeout(() => bara.scrollTo({ left: 0, behavior: "smooth" }), 650);
  }, 900);
}

/* ===== HEADER: se strânge la derulare (înălțimile sunt fixe în CSS, ca să nu tremure) ===== */
function initHeader() {
  const radacina = document.documentElement;
  if (!document.querySelector("header")) return;

  // prag dublu (histerezis), ca să nu comute înainte și înapoi la limita exactă
  function actualizeaza() {
    const y = window.scrollY;
    if (y > 90) radacina.classList.add("pagina-derulata");
    else if (y < 40) radacina.classList.remove("pagina-derulata");
  }

  actualizeaza();
  window.addEventListener("scroll", actualizeaza, { passive: true });
}

/* ===== CĂUTARE PRODUSE ===== */
function normalizeazaText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "");
}

function initCautareProduse() {
  const wrap = document.getElementById("produseSearch");
  const toggle = document.getElementById("cautareToggle");
  const input = document.getElementById("cautareProdus");
  const rezultateBox = document.getElementById("cautareRezultate");
  if (!wrap || !toggle || !input || !rezultateBox || typeof PRODUCTS === "undefined") return;

  function deschideCautarea() {
    wrap.classList.add("deschisa");
    input.focus();
  }

  function inchideCautarea() {
    if (input.value.trim()) return;
    wrap.classList.remove("deschisa");
    rezultateBox.classList.remove("active");
  }

  toggle.addEventListener("click", deschideCautarea);

  function afiseazaRezultate() {
    const termen = normalizeazaText(input.value.trim());
    rezultateBox.innerHTML = "";

    if (!termen) {
      rezultateBox.classList.remove("active");
      return;
    }

    const potriviri = PRODUCTS.filter(
      (p) => p.stoc !== "epuizat" && normalizeazaText(p.nume).includes(termen)
    ).slice(0, 8);

    if (!potriviri.length) {
      rezultateBox.innerHTML = `<div class="cautare-gol">Niciun produs găsit.</div>`;
      rezultateBox.classList.add("active");
      return;
    }

    potriviri.forEach((p) => {
      const item = document.createElement("a");
      item.className = "cautare-item";
      item.href = `produs.html?id=${encodeURIComponent(p.id)}`;

      const poza = p.imagini && p.imagini.length ? p.imagini[0] : "";
      item.innerHTML = `
        ${poza ? `<img src="${urlImagine(poza, 120)}" alt="" loading="lazy">` : `<span class="cautare-item-fara-poza">🖼️</span>`}
        <span>${p.nume}</span>
      `;
      rezultateBox.appendChild(item);
    });

    rezultateBox.classList.add("active");
  }

  input.addEventListener("input", afiseazaRezultate);
  input.addEventListener("focus", afiseazaRezultate);

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      rezultateBox.classList.remove("active");
      inchideCautarea();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      input.blur();
      rezultateBox.classList.remove("active");
      inchideCautarea();
    }
    if (e.key === "Enter") {
      const prim = rezultateBox.querySelector(".cautare-item");
      if (prim) window.location.href = prim.getAttribute("href");
    }
  });
}

/* ===== PAGINA DE PACHETE FUNERARE ===== */
function initPachete() {
  const grid = document.getElementById("pacheteGrid");
  if (!grid || typeof PACHETE === "undefined") return;

  PACHETE.forEach((pachet) => {
    const card = document.createElement("div");
    card.className = "pachet-card" + (pachet.eticheta ? " pachet-recomandat" : "");

    const eticheta = pachet.eticheta
      ? `<div class="pachet-eticheta">${pachet.eticheta}</div>`
      : "";

    const itemi = (pachet.itemi || []).map((item) => `<li>${item}</li>`).join("");

    card.innerHTML = `
      ${eticheta}
      <div class="pachet-info">
        <h3>${pachet.nume}</h3>
        ${formateazaPret(pachet.pret) ? `<p class="pachet-pret">${formateazaPret(pachet.pret)}</p>` : ""}
        <ul class="pachet-lista">${itemi}</ul>
        ${pachet.descriere ? `<p class="pachet-descriere">${pachet.descriere}</p>` : ""}
        <a href="contact.html" class="btn-gold">Solicită detalii</a>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ===== FILTRARE PE CATEGORII ȘI SUBCATEGORII (pagina de produse) ===== */
function initCategoriiNav() {
  const butoane = document.querySelectorAll(".categorie-btn");
  const subNav = document.getElementById("subcategoriiNav");
  if (!butoane.length || !subNav) return;

  const sectiuni = document.querySelectorAll("section.categorie");

  function aplicaSubcategorie(categorie, subId) {
    const sectiune = document.getElementById(categorie);
    if (!sectiune) return;

    sectiune.querySelectorAll(".subcategorie").forEach((bloc) => {
      const potrivit = subId === "toate" || bloc.dataset.subcategorie === subId;
      bloc.style.display = potrivit ? "" : "none";
    });
  }

  function construiesteSubNav(categorie) {
    subNav.innerHTML = "";
    subNav.classList.remove("active");

    if (categorie === "toate") return;

    const sectiune = document.getElementById(categorie);
    if (!sectiune) return;

    const blocuri = [...sectiune.querySelectorAll(".subcategorie")];
    if (blocuri.length < 2) return;

    const optiuni = [
      { id: "toate", eticheta: "Toate" },
      ...blocuri.map((b) => ({ id: b.dataset.subcategorie, eticheta: b.dataset.eticheta })),
    ];

    optiuni.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subcategorie-btn" + (i === 0 ? " active" : "");
      btn.textContent = opt.eticheta;
      btn.addEventListener("click", () => {
        subNav.querySelectorAll(".subcategorie-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        aplicaSubcategorie(categorie, opt.id);
      });
      subNav.appendChild(btn);
    });

    subNav.classList.add("active");
  }

  function selecteaza(categorie, { deruleaza = true } = {}) {
    butoane.forEach((b) => b.classList.toggle("active", b.dataset.categorie === categorie));

    sectiuni.forEach((sec) => {
      sec.style.display = categorie === "toate" || sec.id === categorie ? "" : "none";
    });

    if (categorie !== "toate") aplicaSubcategorie(categorie, "toate");
    construiesteSubNav(categorie);

    if (categorie === "toate") {
      history.replaceState(null, "", window.location.pathname);
    } else {
      history.replaceState(null, "", `#${categorie}`);
      if (deruleaza) {
        const sectiune = document.getElementById(categorie);
        if (sectiune) sectiune.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  butoane.forEach((btn) => {
    btn.addEventListener("click", () => selecteaza(btn.dataset.categorie));
  });

  const dinHash = window.location.hash.replace("#", "");
  const existaInMeniu = [...butoane].some((b) => b.dataset.categorie === dinHash);
  selecteaza(existaInMeniu ? dinHash : "toate", { deruleaza: false });
}

/* ===== SLIDESHOW PAGINA DE ACASĂ ===== */
function initHeroSlideshow() {
  const slides = document.querySelectorAll(".slide");
  const dotsContainer = document.getElementById("slideDots");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!slides.length || !dotsContainer) return;

  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.classList.add("dot");
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll(".dot");

  function showSlide(index) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  function goToSlide(index) {
    showSlide(index);
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => showSlide(current + 1), 5000);
  }

  nextBtn.addEventListener("click", () => goToSlide(current + 1));
  prevBtn.addEventListener("click", () => goToSlide(current - 1));

  resetTimer();
}

/* ===== GALERIE DE IMAGINI REUTILIZABILĂ (card produs + pagina de detalii) ===== */
function buildGallery(imagini, altText, options = {}) {
  const wrap = document.createElement("div");
  wrap.className = "galerie";

  // cât de mare e nevoie să fie poza aici (dublu față de afișare, pentru ecrane fine)
  const latime = options.latime || 600;

  let index = 0;

  const img = document.createElement("img");
  img.className = "galerie-img";
  img.src = urlImagine(imagini[0], latime);
  img.alt = altText;
  img.loading = "lazy";
  img.decoding = "async";
  wrap.appendChild(img);

  if (options.zoom) {
    img.classList.add("zoomable");
    img.addEventListener("click", () => openLightbox(imagini, index, altText));
  }

  if (imagini.length > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "gallery-btn prev";
    prevBtn.innerHTML = "&#10094;";
    prevBtn.setAttribute("aria-label", "Poza anterioară");

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "gallery-btn next";
    nextBtn.innerHTML = "&#10095;";
    nextBtn.setAttribute("aria-label", "Poza următoare");

    const dots = document.createElement("div");
    dots.className = "gallery-dots";
    imagini.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "gallery-dot" + (i === 0 ? " active" : "");
      dots.appendChild(dot);
    });

    function update() {
      img.src = urlImagine(imagini[index], latime);
      dots.querySelectorAll(".gallery-dot").forEach((d, i) => {
        d.classList.toggle("active", i === index);
      });
    }

    function go(newIndex, e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      index = (newIndex + imagini.length) % imagini.length;
      update();
    }

    prevBtn.addEventListener("click", (e) => go(index - 1, e));
    nextBtn.addEventListener("click", (e) => go(index + 1, e));

    wrap.appendChild(prevBtn);
    wrap.appendChild(nextBtn);
    wrap.appendChild(dots);
  }

  return wrap;
}

/* ===== LIGHTBOX (zoom pe imagine, pagina de detalii) ===== */
let lightboxEl = null;
let lightboxImagini = [];
let lightboxIndex = 0;

function ensureLightbox() {
  if (lightboxEl) return lightboxEl;

  lightboxEl = document.createElement("div");
  lightboxEl.className = "lightbox";
  lightboxEl.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Închide">&times;</button>
    <button type="button" class="lightbox-btn prev" aria-label="Poza anterioară">&#10094;</button>
    <img class="lightbox-img" alt="">
    <button type="button" class="lightbox-btn next" aria-label="Poza următoare">&#10095;</button>
  `;
  document.body.appendChild(lightboxEl);

  const img = lightboxEl.querySelector(".lightbox-img");

  function updateLightbox() {
    // la zoom vrem calitate mare, dar tot sub dimensiunea originală
    img.src = urlImagine(lightboxImagini[lightboxIndex], 1600);
  }

  function showNav(show) {
    lightboxEl.querySelector(".prev").style.display = show ? "" : "none";
    lightboxEl.querySelector(".next").style.display = show ? "" : "none";
  }

  lightboxEl.querySelector(".prev").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxImagini.length) % lightboxImagini.length;
    updateLightbox();
  });

  lightboxEl.querySelector(".next").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxImagini.length;
    updateLightbox();
  });

  lightboxEl.querySelector(".lightbox-close").addEventListener("click", closeLightbox);

  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightboxEl.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxEl.querySelector(".prev").click();
    if (e.key === "ArrowRight") lightboxEl.querySelector(".next").click();
  });

  lightboxEl.updateLightbox = updateLightbox;
  lightboxEl.showNav = showNav;

  return lightboxEl;
}

function openLightbox(imagini, startIndex, altText) {
  const el = ensureLightbox();
  lightboxImagini = imagini;
  lightboxIndex = startIndex;
  el.querySelector(".lightbox-img").alt = altText;
  el.updateLightbox();
  el.showNav(imagini.length > 1);
  el.classList.add("active");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("active");
  document.body.classList.remove("lightbox-open");
}

/* ===== SUBCATEGORII (pentru sicrie, prosoape, lenjerii, veselă) ===== */
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

/* ===== PAGINA DE PRODUSE (catalog pe categorii) ===== */
function initCatalog() {
  const grids = document.querySelectorAll(".produse-grid[data-categorie]");
  const subWraps = document.querySelectorAll(".subcategorii-wrap[data-categorie]");
  if ((!grids.length && !subWraps.length) || typeof PRODUCTS === "undefined") return;

  grids.forEach((grid) => {
    const categorie = grid.dataset.categorie;
    const produse = PRODUCTS.filter((p) => p.categorie === categorie && p.stoc !== "epuizat");

    if (!produse.length) {
      const gol = document.createElement("p");
      gol.className = "categorie-goala";
      gol.textContent = "În curând, produse noi în această categorie.";
      grid.appendChild(gol);
      return;
    }

    produse.forEach((produs) => {
      grid.appendChild(createProductCard(produs));
    });
  });

  subWraps.forEach((wrap) => {
    const categorie = wrap.dataset.categorie;
    const subcategorii = SUBCATEGORII[categorie] || [];
    const produseCategorie = PRODUCTS.filter((p) => p.categorie === categorie && p.stoc !== "epuizat");
    let auProduse = false;

    function adaugaSectiune(subId, titluText, produseSub) {
      if (!produseSub.length) return;
      auProduse = true;

      const sectiune = document.createElement("div");
      sectiune.className = "subcategorie";
      sectiune.dataset.subcategorie = subId;
      sectiune.dataset.eticheta = titluText;

      const titlu = document.createElement("h3");
      titlu.className = "subcategorie-titlu";
      titlu.textContent = titluText;
      sectiune.appendChild(titlu);

      const grid = document.createElement("div");
      grid.className = "produse-grid";
      produseSub.forEach((p) => grid.appendChild(createProductCard(p)));
      sectiune.appendChild(grid);

      wrap.appendChild(sectiune);
    }

    subcategorii.forEach((sub) => {
      adaugaSectiune(sub.id, sub.eticheta, produseCategorie.filter((p) => p.subcategorie === sub.id));
    });

    adaugaSectiune(
      "altele",
      "Altele",
      produseCategorie.filter((p) => !subcategorii.some((s) => s.id === p.subcategorie))
    );

    if (!auProduse) {
      const gol = document.createElement("p");
      gol.className = "categorie-goala";
      gol.textContent = "În curând, produse noi în această categorie.";
      wrap.appendChild(gol);
    }
  });
}

const STOC_INFO = {
  in_stoc: { clasa: "stoc-in-stoc", eticheta: "În stoc" },
  limitat: { clasa: "stoc-limitat", eticheta: "Cantitate limitată" },
  epuizat: { clasa: "stoc-epuizat", eticheta: "Stoc epuizat" },
};

function createProductCard(produs) {
  const card = document.createElement("div");
  card.className = "produs-card";

  const link = document.createElement("a");
  link.href = `produs.html?id=${encodeURIComponent(produs.id)}`;
  link.className = "produs-link";

  const galerie = buildGallery(produs.imagini, produs.nume);
  link.appendChild(galerie);

  const info = document.createElement("div");
  info.className = "produs-info";

  const titlu = document.createElement("h3");
  titlu.textContent = produs.nume;
  info.appendChild(titlu);

  const pretAfisat = formateazaPret(produs.pret);
  if (pretAfisat) {
    const pret = document.createElement("p");
    pret.className = "produs-pret";
    pret.textContent = pretAfisat;
    info.appendChild(pret);
  }

  const btn = document.createElement("span");
  btn.className = "produs-actiune";
  btn.innerHTML = `Vezi detalii <span class="produs-actiune-sageata">&#8594;</span>`;
  info.appendChild(btn);

  link.appendChild(info);
  card.appendChild(link);

  return card;
}

/* ===== PAGINA DE DETALII PRODUS ===== */
function initProductDetail() {
  const container = document.getElementById("produsDetail");
  if (!container || typeof PRODUCTS === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const produs = PRODUCTS.find((p) => p.id === id);

  if (!produs || produs.stoc === "epuizat") {
    container.innerHTML = `
      <p class="produs-negasit">Acest produs nu este momentan disponibil.</p>
      <a href="produse.html" class="btn-gold">Înapoi la produse</a>
    `;
    return;
  }

  document.title = `${produs.nume} - Site Proiect`;

  const galerie = buildGallery(produs.imagini, produs.nume, { zoom: true, latime: 1100 });
  galerie.classList.add("galerie-mare");
  container.appendChild(galerie);

  const info = document.createElement("div");
  info.className = "produs-detail-info";

  const stocInfo = STOC_INFO[produs.stoc] || STOC_INFO.in_stoc;

  info.innerHTML = `
    <a href="produse.html#${produs.categorie}" class="produs-detail-back">&#10094; Înapoi la ${produs.categorie}</a>
    <h1>${produs.nume}</h1>
    ${produs.cod ? `<p class="produs-detail-cod">Cod produs: <strong>${produs.cod}</strong></p>` : ""}
    <span class="stoc-badge ${stocInfo.clasa}">${stocInfo.eticheta}</span>
    ${formateazaPret(produs.pret) ? `<p class="produs-detail-pret">${formateazaPret(produs.pret)}</p>` : ""}
    <ul class="produs-detail-specs">
      ${produs.material ? `<li><strong>Material:</strong> ${produs.material}</li>` : ""}
      ${produs.dimensiuni ? `<li><strong>Dimensiuni:</strong> ${produs.dimensiuni}</li>` : ""}
    </ul>
    ${produs.descriere ? `<p class="produs-detail-descriere">${produs.descriere}</p>` : ""}
  `;

  container.appendChild(info);
}
