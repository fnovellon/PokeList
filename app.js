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
const views = {
  list: document.getElementById("view-list"),
  quiz: document.getElementById("view-quiz"),
};

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;

    modeButtons.forEach((b) => b.classList.toggle("active", b === btn));
    Object.entries(views).forEach(([key, view]) => {
      view.hidden = key !== mode;
    });

    if (mode === "quiz") {
      // La barre du quiz était masquée (hauteur nulle) jusqu'ici, on peut
      // désormais mesurer sa vraie hauteur.
      updateStickyOffsets();
      quizInputEl.focus();
    }
  });
});
