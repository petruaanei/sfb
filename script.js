document.addEventListener("DOMContentLoaded", () => {
  initHeroSlideshow();
  initCatalog();
  initProductDetail();
});

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

/* ===== PAGINA DE PRODUSE (catalog pe categorii) ===== */
function initCatalog() {
  const grids = document.querySelectorAll(".produse-grid[data-categorie]");
  if (!grids.length || typeof PRODUCTS === "undefined") return;

  grids.forEach((grid) => {
    const categorie = grid.dataset.categorie;
    const produse = PRODUCTS.filter((p) => p.categorie === categorie);

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
}

function createProductCard(produs) {
  const card = document.createElement("div");
  card.className = "produs-card";

  const link = document.createElement("a");
  link.href = `produs.html?id=${encodeURIComponent(produs.id)}`;
  link.className = "produs-link";

  link.appendChild(buildGallery(produs.imagini, produs.nume));

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

  if (!produs) {
    container.innerHTML = `
      <p class="produs-negasit">Produsul nu a fost găsit.</p>
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

  info.innerHTML = `
    <a href="produse.html#${produs.categorie}" class="produs-detail-back">&#10094; Înapoi la ${produs.categorie}</a>
    <h1>${produs.nume}</h1>
    ${produs.pret ? `<p class="produs-detail-pret">${produs.pret}</p>` : ""}
    <ul class="produs-detail-specs">
      ${produs.material ? `<li><strong>Material:</strong> ${produs.material}</li>` : ""}
      ${produs.dimensiuni ? `<li><strong>Dimensiuni:</strong> ${produs.dimensiuni}</li>` : ""}
    </ul>
    ${produs.descriere ? `<p class="produs-detail-descriere">${produs.descriere}</p>` : ""}
  `;

  container.appendChild(info);
}
