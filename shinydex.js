// Shiny Dex : liste tous les Pokémon d'une génération, dans l'ordre, avec
// leur sprite Shiny — en couleur si débloqué (voir shiny.js), grisé sinon.

const shinydexBtn = document.getElementById("shinydex-btn");
const shinydexOverlay = document.getElementById("shinydex-overlay");
const shinydexCloseBtn = document.getElementById("shinydex-close");
const shinydexGenTabBtns = document.querySelectorAll("#shinydex-gen-tabs .gen-tab");
const shinydexListEl = document.getElementById("shinydex-list");
const shinydexProgressFillEl = document.getElementById("shinydex-progress-fill");
const shinydexProgressTextEl = document.getElementById("shinydex-progress-text");

let shinydexGen = 1;

function renderShinyDex() {
  const roster = pokemonsByGeneration(shinydexGen);
  const unlockedCount = roster.filter((p) => isShinyUnlocked(p.id)).length;

  shinydexProgressFillEl.style.width = `${(unlockedCount / roster.length) * 100}%`;
  shinydexProgressTextEl.textContent = t("shinydex.progress", { count: unlockedCount, total: roster.length });

  shinydexListEl.innerHTML = roster
    .map((p) => {
      const unlocked = isShinyUnlocked(p.id);
      const name = pokemonName(p);
      return `
        <li class="pokemon-card ${unlocked ? "shiny-unlocked" : "shiny-locked"}">
          <span class="pokemon-number">${formatNumber(p.id)}</span>
          <span class="sprite-wrap">
            <img class="pokemon-sprite shinydex-sprite" src="${getShinySpriteUrl(p.id)}" alt="${name}" loading="lazy" />
          </span>
          <span class="pokemon-name">${name}</span>
        </li>
      `;
    })
    .join("");
}

function openShinyDex() {
  renderShinyDex();
  shinydexOverlay.hidden = false;
}

function closeShinyDex() {
  shinydexOverlay.hidden = true;
}

shinydexBtn.addEventListener("click", openShinyDex);
shinydexCloseBtn.addEventListener("click", closeShinyDex);
shinydexOverlay.addEventListener("click", (event) => {
  if (event.target === shinydexOverlay) closeShinyDex();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !shinydexOverlay.hidden) closeShinyDex();
});

shinydexGenTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    shinydexGen = Number(btn.dataset.gen);
    shinydexGenTabBtns.forEach((b) => b.classList.toggle("active", b === btn));
    renderShinyDex();
  });
});
