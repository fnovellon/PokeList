const versionEl = document.getElementById("app-version");
if (versionEl) versionEl.textContent = APP_VERSION;

const headerEl = document.querySelector(".app-header");

// Hauteur cumulée des barres collantes (en-tête + barre du quiz), utilisée pour
// que le scroll automatique vers un Pokémon révélé ne le cache pas derrière elles.
function updateStickyOffsets() {
  const headerHeight = headerEl.offsetHeight;
  document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
  document.documentElement.style.setProperty(
    "--quiz-sticky-offset",
    `${headerHeight + quizFormEl.offsetHeight}px`
  );
}

updateStickyOffsets();
window.addEventListener("resize", updateStickyOffsets);

const modeButtons = document.querySelectorAll(".mode-btn");
const homeCards = document.querySelectorAll(".home-card");
const homeListStatEl = document.getElementById("home-list-stat");
const views = {
  home: document.getElementById("view-home"),
  list: document.getElementById("view-list"),
  quiz: document.getElementById("view-quiz"),
};

function updateHomeStats() {
  homeListStatEl.textContent = `${caught.size} / ${POKEMON_GEN1.length} attrapés`;
}

function goToMode(mode) {
  modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  Object.entries(views).forEach(([key, view]) => {
    view.hidden = key !== mode;
  });

  if (mode === "home") updateHomeStats();

  if (mode === "quiz") {
    // La barre du quiz était masquée (hauteur nulle) jusqu'ici, on peut
    // désormais mesurer sa vraie hauteur.
    updateStickyOffsets();
    quizInputEl.focus();
  }
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => goToMode(btn.dataset.mode));
});

homeCards.forEach((card) => {
  card.addEventListener("click", () => goToMode(card.dataset.mode));
});

updateHomeStats();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
