// Statistiques entre parties : un compteur par (mode nommé × difficulté) —
// 8 compartiments (Classique/Chronologique × 4 niveaux), agrégés toutes
// générations confondues (pas demandé de les scinder par génération). Le
// mode Custom n'a pas de compartiment détaillé, juste un nombre de parties.
// `pokemonFound` est un compteur global (toutes parties, tous modes) du
// nombre de fois où chaque Pokémon a été découvert.
const STATS_KEY = "pokelist-quiz-stats";
const STATS_DIFFICULTIES = ["easy", "normal", "hard", "veryHard"];
const STATS_DIFFICULTY_LABEL_KEYS = {
  easy: "quiz.presetEasy",
  normal: "quiz.presetNormal",
  hard: "quiz.presetHard",
  veryHard: "quiz.presetVeryHard",
};

function emptyStatsBucket() {
  return { gamesPlayed: 0, completions: 0, bestTimeMs: null, bestPercent: 0, totalFound: 0 };
}

function defaultStats() {
  const modes = {};
  for (const mode of ["fill", "ordered"]) {
    for (const difficulty of STATS_DIFFICULTIES) {
      modes[`${mode}:${difficulty}`] = emptyStatsBucket();
    }
  }
  return { modes, custom: { gamesPlayed: 0 }, pokemonFound: {} };
}

// Fusion défensive avec les valeurs par défaut : garantit que les 8
// compartiments existent même si des données plus anciennes en manquaient.
function loadStats() {
  const defaults = defaultStats();
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY));
    if (!raw) return defaults;
    return {
      modes: { ...defaults.modes, ...raw.modes },
      custom: { ...defaults.custom, ...raw.custom },
      pokemonFound: raw.pokemonFound || {},
    };
  } catch {
    return defaults;
  }
}

function saveStats() {
  localStorage.setItem(STATS_KEY, JSON.stringify(quizStats));
}

let quizStats = loadStats();

function recordGameStart(mode, difficulty) {
  if (mode === "custom") {
    quizStats.custom.gamesPlayed += 1;
  } else {
    quizStats.modes[`${mode}:${difficulty}`].gamesPlayed += 1;
  }
  saveStats();
}

function recordGameEnd(mode, difficulty, { found, total, elapsedMs, completed }) {
  if (mode === "custom") return;
  const bucket = quizStats.modes[`${mode}:${difficulty}`];
  const percent = total > 0 ? Math.round((found / total) * 100) : 0;
  bucket.bestPercent = Math.max(bucket.bestPercent, percent);
  bucket.totalFound += found;
  if (completed) {
    bucket.completions += 1;
    bucket.bestTimeMs = bucket.bestTimeMs === null ? elapsedMs : Math.min(bucket.bestTimeMs, elapsedMs);
  }
  saveStats();
}

function recordPokemonFound(id) {
  quizStats.pokemonFound[id] = (quizStats.pokemonFound[id] || 0) + 1;
  saveStats();
}

const statsBtn = document.getElementById("stats-btn");
const statsOverlay = document.getElementById("stats-overlay");
const statsCloseBtn = document.getElementById("stats-close");
const statsContentEl = document.getElementById("stats-content");

function statsRowHtml(mode, difficulty) {
  const bucket = quizStats.modes[`${mode}:${difficulty}`];
  const bestTime = bucket.bestTimeMs === null ? "—" : formatElapsed(bucket.bestTimeMs);
  return `
    <tr>
      <td>${t(STATS_DIFFICULTY_LABEL_KEYS[difficulty])}</td>
      <td>${bucket.gamesPlayed}</td>
      <td>${bucket.completions}</td>
      <td>${bestTime}</td>
      <td>${bucket.bestPercent}%</td>
    </tr>
  `;
}

function statsSectionHtml(mode, modeLabelKey) {
  const rows = STATS_DIFFICULTIES.map((difficulty) => statsRowHtml(mode, difficulty)).join("");
  return `
    <div class="settings-section">
      <h3>${t(modeLabelKey)}</h3>
      <div class="stats-table-wrap">
        <table class="stats-table">
          <thead>
            <tr>
              <th></th>
              <th>${t("statsModal.colGames")}</th>
              <th>${t("statsModal.colCompletions")}</th>
              <th>${t("statsModal.colBestTime")}</th>
              <th>${t("statsModal.colBestPercent")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStatsModal() {
  statsContentEl.innerHTML = `
    ${statsSectionHtml("fill", "quiz.modeFill")}
    ${statsSectionHtml("ordered", "quiz.modeOrdered")}
    <div class="settings-section">
      <h3>${t("quiz.presetCustom")}</h3>
      <p class="stats-custom-line">${t("statsModal.customGamesPlayed", { count: quizStats.custom.gamesPlayed })}</p>
    </div>
  `;
}

function openStats() {
  renderStatsModal();
  statsOverlay.hidden = false;
}

function closeStats() {
  statsOverlay.hidden = true;
}

statsBtn.addEventListener("click", openStats);
statsCloseBtn.addEventListener("click", closeStats);
statsOverlay.addEventListener("click", (event) => {
  if (event.target === statsOverlay) closeStats();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !statsOverlay.hidden) closeStats();
});
