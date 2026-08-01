const STORAGE_KEY = "pokelist-caught-gen1";

const listEl = document.getElementById("pokemon-list");
const searchEl = document.getElementById("search");
const progressFillEl = document.getElementById("progress-fill");
const progressTextEl = document.getElementById("progress-text");
const checkAllBtn = document.getElementById("check-all");
const uncheckAllBtn = document.getElementById("uncheck-all");
const listGenTabBtns = document.querySelectorAll("#list-gen-tabs .gen-tab");

// Onglet de génération affiché dans le mode Liste (indépendant de la
// génération choisie dans le Quiz) ; non persisté, revient à Gen 1 au rechargement.
let listGeneration = 1;

function matchesQuery(pokemon, rawQuery) {
  if (!rawQuery) return true;

  if (String(pokemon.id).includes(rawQuery)) return true;
  if (formatNumber(pokemon.id).toLowerCase().includes(rawQuery.toLowerCase())) return true;

  const normQuery = normalize(rawQuery);
  if (!normQuery) return false;
  const normalizedName = pokemonNormalizedName(pokemon);
  if (normalizedName.includes(normQuery)) return true;

  // Tolère les fautes de frappe / saisies partielles (ex: "bulbizare" -> Bulbizarre,
  // "draco" -> Dracaufeu)
  if (normQuery.length >= 4) {
    const threshold = Math.max(1, Math.floor(normQuery.length * 0.3));
    return prefixEditDistance(normQuery, normalizedName) <= threshold;
  }

  return false;
}

function getVisiblePokemon(rawQuery) {
  return pokemonsByGeneration(listGeneration).filter((p) => matchesQuery(p, rawQuery));
}

function loadCaught() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveCaught(caughtSet) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...caughtSet]));
}

let caught = loadCaught();

// La barre de progression porte sur la génération affichée (onglet actif),
// pas sur l'ensemble des 386 Pokémon.
function updateProgress() {
  const genPokemon = pokemonsByGeneration(listGeneration);
  const total = genPokemon.length;
  const count = genPokemon.filter((p) => caught.has(p.id)).length;
  progressFillEl.style.width = `${(count / total) * 100}%`;
  progressTextEl.textContent = t("list.progress", { count, total });
}

function renderList() {
  listEl.innerHTML = "";
  const filtered = getVisiblePokemon(searchEl.value.trim());

  const fragment = document.createDocumentFragment();

  for (const pokemon of filtered) {
    const li = document.createElement("li");
    li.className = "pokemon-card";
    if (caught.has(pokemon.id)) li.classList.add("caught");

    const checkboxId = `pokemon-${pokemon.id}`;
    const name = pokemonName(pokemon);

    li.innerHTML = `
      <label for="${checkboxId}" class="pokemon-label">
        <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
        <img class="pokemon-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${name}" loading="lazy" />
        <div class="pokemon-info">
          <span class="pokemon-name" title="${name}">${name}</span>
          ${renderTypeBadges(pokemon)}
        </div>
        <span class="check-badge" aria-hidden="true">✓</span>
      </label>
      <input type="checkbox" class="pokemon-checkbox" id="${checkboxId}" ${caught.has(pokemon.id) ? "checked" : ""} />
    `;

    const checkbox = li.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        caught.add(pokemon.id);
        li.classList.add("caught");
        const genPokemon = pokemonsByGeneration(listGeneration);
        if (genPokemon.every((p) => caught.has(p.id))) celebrateConfetti();
      } else {
        caught.delete(pokemon.id);
        li.classList.remove("caught");
      }
      saveCaught(caught);
      updateProgress();
    });

    fragment.appendChild(li);
  }

  listEl.appendChild(fragment);
}

listGenTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    listGeneration = Number(btn.dataset.gen);
    listGenTabBtns.forEach((b) => b.classList.toggle("active", b === btn));
    renderList();
    updateProgress();
  });
});

searchEl.addEventListener("input", renderList);

checkAllBtn.addEventListener("click", () => {
  getVisiblePokemon(searchEl.value.trim()).forEach((p) => caught.add(p.id));
  saveCaught(caught);
  renderList();
  updateProgress();
});

uncheckAllBtn.addEventListener("click", () => {
  getVisiblePokemon(searchEl.value.trim()).forEach((p) => caught.delete(p.id));
  saveCaught(caught);
  renderList();
  updateProgress();
});

renderList();
updateProgress();
