const STORAGE_KEY = "pokelist-caught-gen1";

const listEl = document.getElementById("pokemon-list");
const searchEl = document.getElementById("search");
const progressFillEl = document.getElementById("progress-fill");
const progressTextEl = document.getElementById("progress-text");
const checkAllBtn = document.getElementById("check-all");
const uncheckAllBtn = document.getElementById("uncheck-all");
const versionEl = document.getElementById("app-version");

if (versionEl) versionEl.textContent = APP_VERSION;

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
  const query = searchEl.value.trim().toLowerCase();

  const filtered = POKEMON_GEN1.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      String(p.id).includes(query) ||
      formatNumber(p.id).toLowerCase().includes(query)
    );
  });

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
  const query = searchEl.value.trim().toLowerCase();
  const visible = query
    ? POKEMON_GEN1.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          String(p.id).includes(query) ||
          formatNumber(p.id).toLowerCase().includes(query)
      )
    : POKEMON_GEN1;
  visible.forEach((p) => caught.add(p.id));
  saveCaught(caught);
  renderList();
  updateProgress();
});

uncheckAllBtn.addEventListener("click", () => {
  const query = searchEl.value.trim().toLowerCase();
  const visible = query
    ? POKEMON_GEN1.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          String(p.id).includes(query) ||
          formatNumber(p.id).toLowerCase().includes(query)
      )
    : POKEMON_GEN1;
  visible.forEach((p) => caught.delete(p.id));
  saveCaught(caught);
  renderList();
  updateProgress();
});

renderList();
updateProgress();
