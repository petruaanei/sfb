document.addEventListener("DOMContentLoaded", () => {
  initHeroSlideshow();
  initCatalog();
  initProductDetail();
  initCategoriiNav();
  initPachete();
  initCautareProduse();
});

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
        ${poza ? `<img src="${poza}" alt="">` : `<span class="cautare-item-fara-poza">🖼️</span>`}
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
        ${pachet.pret ? `<p class="pachet-pret">${pachet.pret}</p>` : ""}
        <ul class="pachet-lista">${itemi}</ul>
        ${pachet.descriere ? `<p class="pachet-descriere">${pachet.descriere}</p>` : ""}
        <a href="contact.html" class="btn-gold">Solicită detalii</a>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ===== EVIDENȚIERE CATEGORIE SELECTATĂ (pagina de produse) ===== */
function initCategoriiNav() {
  const linkuri = document.querySelectorAll(".categorii-nav a");
  if (!linkuri.length) return;

  function seteazaActiv(link) {
    linkuri.forEach((a) => a.classList.remove("active"));
    if (link) link.classList.add("active");
  }

  linkuri.forEach((link) => {
    link.addEventListener("click", () => seteazaActiv(link));
  });

  const dinHash = [...linkuri].find((a) => a.getAttribute("href") === window.location.hash);
  seteazaActiv(dinHash || linkuri[0]);
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

  let index = 0;

  const img = document.createElement("img");
  img.className = "galerie-img";
  img.src = imagini[0];
  img.alt = altText;
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
      img.src = imagini[index];
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
    img.src = lightboxImagini[lightboxIndex];
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

    function adaugaSectiune(titluText, produseSub) {
      if (!produseSub.length) return;
      auProduse = true;

      const sectiune = document.createElement("div");
      sectiune.className = "subcategorie";

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
      adaugaSectiune(sub.eticheta, produseCategorie.filter((p) => p.subcategorie === sub.id));
    });

    adaugaSectiune(
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

function creazaBadgeStoc(stoc) {
  const info = STOC_INFO[stoc] || STOC_INFO.in_stoc;
  const badge = document.createElement("span");
  badge.className = `stoc-badge ${info.clasa}`;
  badge.textContent = info.eticheta;
  return badge;
}

function createProductCard(produs) {
  const card = document.createElement("div");
  card.className = "produs-card";

  const link = document.createElement("a");
  link.href = `produs.html?id=${encodeURIComponent(produs.id)}`;
  link.className = "produs-link";

  const galerie = buildGallery(produs.imagini, produs.nume);
  galerie.appendChild(creazaBadgeStoc(produs.stoc));
  link.appendChild(galerie);

  const info = document.createElement("div");
  info.className = "produs-info";

  const titlu = document.createElement("h3");
  titlu.textContent = produs.nume;
  info.appendChild(titlu);

  if (produs.pret) {
    const pret = document.createElement("p");
    pret.className = "produs-pret";
    pret.textContent = produs.pret;
    info.appendChild(pret);
  }

  const btn = document.createElement("span");
  btn.className = "btn-gold";
  btn.textContent = "Vezi detalii";
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

  const galerie = buildGallery(produs.imagini, produs.nume, { zoom: true });
  galerie.classList.add("galerie-mare");
  container.appendChild(galerie);

  const info = document.createElement("div");
  info.className = "produs-detail-info";

  const stocInfo = STOC_INFO[produs.stoc] || STOC_INFO.in_stoc;

  info.innerHTML = `
    <a href="produse.html#${produs.categorie}" class="produs-detail-back">&#10094; Înapoi la ${produs.categorie}</a>
    <h1>${produs.nume}</h1>
    <span class="stoc-badge ${stocInfo.clasa}">${stocInfo.eticheta}</span>
    ${produs.pret ? `<p class="produs-detail-pret">${produs.pret}</p>` : ""}
    <ul class="produs-detail-specs">
      ${produs.material ? `<li><strong>Material:</strong> ${produs.material}</li>` : ""}
      ${produs.dimensiuni ? `<li><strong>Dimensiuni:</strong> ${produs.dimensiuni}</li>` : ""}
    </ul>
    ${produs.descriere ? `<p class="produs-detail-descriere">${produs.descriere}</p>` : ""}
  `;

  container.appendChild(info);
}
