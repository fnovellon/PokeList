const STORAGE_KEY = "pokelist-caught-gen1";

const listEl = document.getElementById("pokemon-list");
const searchEl = document.getElementById("search");
const progressFillEl = document.getElementById("progress-fill");
const progressTextEl = document.getElementById("progress-text");
const checkAllBtn = document.getElementById("check-all");
const uncheckAllBtn = document.getElementById("uncheck-all");
const versionEl = document.getElementById("app-version");

if (versionEl) versionEl.textContent = APP_VERSION;

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );
    }
  }

  return dist[rows - 1][cols - 1];
}

POKEMON_GEN1.forEach((p) => {
  p.normalizedName = normalize(p.name);
});

function matchesQuery(pokemon, rawQuery) {
  if (!rawQuery) return true;

  if (String(pokemon.id).includes(rawQuery)) return true;
  if (formatNumber(pokemon.id).toLowerCase().includes(rawQuery.toLowerCase())) return true;

  const normQuery = normalize(rawQuery);
  if (!normQuery) return false;
  if (pokemon.normalizedName.includes(normQuery)) return true;

  // Tolère les fautes de frappe / sonorités proches (ex: "bulbizare" -> Bulbizarre)
  if (normQuery.length >= 4) {
    const threshold = Math.max(1, Math.floor(normQuery.length * 0.3));
    return levenshtein(normQuery, pokemon.normalizedName) <= threshold;
  }

  return false;
}

function getVisiblePokemon(rawQuery) {
  return POKEMON_GEN1.filter((p) => matchesQuery(p, rawQuery));
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

function updateProgress() {
  const total = POKEMON_GEN1.length;
  const count = caught.size;
  progressFillEl.style.width = `${(count / total) * 100}%`;
  progressTextEl.textContent = `${count} / ${total} attrapés`;
}

function formatNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
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

    li.innerHTML = `
      <label for="${checkboxId}" class="pokemon-label">
        <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
        <img class="pokemon-sprite" src="${pokemon.sprite}" alt="${pokemon.name}" loading="lazy" />
        <span class="pokemon-name">${pokemon.name}</span>
        <span class="check-badge" aria-hidden="true">✓</span>
      </label>
      <input type="checkbox" class="pokemon-checkbox" id="${checkboxId}" ${caught.has(pokemon.id) ? "checked" : ""} />
    `;

    const checkbox = li.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        caught.add(pokemon.id);
        li.classList.add("caught");
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
