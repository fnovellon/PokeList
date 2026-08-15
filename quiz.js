const quizSetupEl = document.getElementById("quiz-setup");
const quizPlayingEl = document.getElementById("quiz-playing");
const quizRecapEl = document.getElementById("quiz-recap");

const quizGenBtns = document.querySelectorAll("#quiz-gen-options .settings-option");
const quizModeBtns = document.querySelectorAll("#quiz-mode-options .settings-option");
const quizDifficultySections = {
  fill: document.getElementById("quiz-difficulty-fill"),
  ordered: document.getElementById("quiz-difficulty-ordered"),
  number: document.getElementById("quiz-difficulty-number"),
  sequence: document.getElementById("quiz-difficulty-sequence"),
};
const quizDifficultyBtns = document.querySelectorAll(
  "#quiz-difficulty-fill .settings-option, #quiz-difficulty-ordered .settings-option, #quiz-difficulty-number .settings-option, #quiz-difficulty-sequence .settings-option"
);
const quizTimeOptionBtns = document.querySelectorAll("#quiz-time-options .settings-option");
const quizOptTypesEl = document.getElementById("quiz-opt-types");
const quizOptGridEl = document.getElementById("quiz-opt-grid");
const quizOptHintsEl = document.getElementById("quiz-opt-hints");
const quizOptNextHintEl = document.getElementById("quiz-opt-nexthint");
const quizOptHardcoreEl = document.getElementById("quiz-opt-hardcore");
const quizOptSequentialEl = document.getElementById("quiz-opt-sequential");
const quizOptPermadeathEl = document.getElementById("quiz-opt-permadeath");
const quizStartBtn = document.getElementById("quiz-start-btn");
const quizNextHintEl = document.getElementById("quiz-next-hint");
const quizTargetCardEl = document.getElementById("quiz-target-card");
const quizSeqStripEl = document.getElementById("quiz-seq-strip");

// Les 4 modes nommés fixent temps + aides + règles en un clic via leurs 4
// niveaux de difficulté ; "Custom" (non listé ici) laisse tout éditable
// manuellement dans #quiz-custom-options.
// - "fill" : remplir le Pokédex dans l'ordre voulu.
// - "ordered" : dans l'ordre du Pokédex.
// - "number" : une seule cible aléatoire à la fois, on ne voit que son
//   numéro (+ aides éventuelles). Pas de grille, pas d'ordre imposé.
// - "sequence" : comme "ordered" (même mécanique "prochain non trouvé"),
//   mais avec un nombre de Pokémon donnés gratuitement au départ (`context`)
//   et une fenêtre glissante qui les montre en continu comme repère.
const GAME_MODES = {
  fill: {
    minutes: 0,
    sequential: false,
    difficulties: {
      easy: { grid: true, types: true, hints: true, hardcore: false, permadeath: false, nextHint: false },
      normal: { grid: true, types: false, hints: false, hardcore: false, permadeath: false, nextHint: false },
      hard: { grid: false, types: false, hints: false, hardcore: false, permadeath: false, nextHint: false },
      veryHard: { grid: false, types: false, hints: false, hardcore: true, permadeath: false, nextHint: false },
    },
  },
  ordered: {
    minutes: 0,
    sequential: true,
    difficulties: {
      easy: { grid: false, types: false, hints: false, hardcore: false, permadeath: false, nextHint: true },
      normal: { grid: false, types: false, hints: false, hardcore: false, permadeath: false, nextHint: false },
      hard: { grid: false, types: false, hints: false, hardcore: false, permadeath: true, nextHint: false },
      veryHard: { grid: false, types: false, hints: false, hardcore: true, permadeath: true, nextHint: false },
    },
  },
  number: {
    minutes: 0,
    sequential: false,
    difficulties: {
      easy: { grid: false, types: true, hints: true, hardcore: false, permadeath: false, nextHint: false },
      normal: { grid: false, types: false, hints: false, hardcore: false, permadeath: false, nextHint: false },
      hard: { grid: false, types: false, hints: false, hardcore: false, permadeath: true, nextHint: false },
      veryHard: { grid: false, types: false, hints: false, hardcore: true, permadeath: true, nextHint: false },
    },
  },
  sequence: {
    minutes: 0,
    sequential: true,
    difficulties: {
      easy: { grid: false, types: true, hints: true, hardcore: false, permadeath: false, nextHint: false, context: 3 },
      normal: { grid: false, types: false, hints: false, hardcore: false, permadeath: false, nextHint: false, context: 2 },
      hard: { grid: false, types: false, hints: false, hardcore: false, permadeath: true, nextHint: false, context: 1 },
      veryHard: { grid: false, types: false, hints: false, hardcore: true, permadeath: true, nextHint: false, context: 0 },
    },
  },
};

const quizListEl = document.getElementById("quiz-list");
const quizFoundChipsEl = document.getElementById("quiz-found-chips");
const quizFormEl = document.getElementById("quiz-form");
const quizInputEl = document.getElementById("quiz-input");
const quizInputClearBtn = document.getElementById("quiz-input-clear");
const quizEndBtn = document.getElementById("quiz-end-btn");
const quizProgressFillEl = document.getElementById("quiz-progress-fill");
const quizProgressTextEl = document.getElementById("quiz-progress-text");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const quizTimerEl = document.getElementById("quiz-timer");

const quizRecapStatEl = document.getElementById("quiz-recap-stat");
const quizRecapTextEl = document.getElementById("quiz-recap-text");
const quizRecapTimeEl = document.getElementById("quiz-recap-time");
const quizGameOverBannerEl = document.getElementById("quiz-gameover-banner");
const quizAchvBannerEl = document.getElementById("quiz-achv-banner");
const quizRecapStatsEl = document.getElementById("quiz-recap-stats");
const quizRecapListEl = document.getElementById("quiz-recap-list");
const quizReplayBtn = document.getElementById("quiz-replay-btn");
const quizConfigureBtn = document.getElementById("quiz-configure-btn");
const quizHomeBtn = document.getElementById("quiz-home-btn");
const quizShareBtn = document.getElementById("quiz-share-btn");
const quizDownloadBtn = document.getElementById("quiz-download-btn");
const quizShareFeedbackEl = document.getElementById("quiz-share-feedback");

// Rien n'est persisté pour le Quiz : tout vit en mémoire le temps de la partie.
let quizPhase = "setup"; // "setup" | "playing" | "recap"
let quizFound = new Set();
let quizDeadline = null; // timestamp ms, ou null si infini
let quizShowTypes = false;
let quizShowGrid = true;
let quizShowHints = false;
let quizShowNextHint = false;
let quizHardcore = false;
let quizSequential = false;
let quizPermadeath = false;
let quizGameOverByMistake = false;
let quizMode = "fill"; // "fill" | "ordered" | "number" | "sequence" | "custom"
let quizDifficulty = "easy"; // "easy" | "normal" | "hard" | "veryHard" ; sans effet si quizMode === "custom"
let quizCurrentTarget = null; // mode "number" : Pokémon actuellement à deviner
let quizSeqContext = 0; // mode "sequence" : nombre de Pokémon montrés comme repère
// mode "sequence" : ordre de jeu de la partie en cours — le roster de la
// génération, mais partant d'un point de départ tiré au hasard entre #1 et
// le dernier numéro, puis repris depuis le début (numéro le plus bas) une
// fois arrivé au bout, pour ne pas toujours commencer au tout premier
// Pokémon. `quizFound.size` sert d'index dans CE tableau, pas dans le
// roster brut.
let quizSeqOrder = [];
let quizGeneration = 1;
let quizMinutesUsed = 0;
let quizStartedAt = null;
let quizElapsedMs = 0;
let quizEndedByTimeout = false;
let quizTimerHandle = null;
let justFoundId = null;
let quizFindLog = []; // [{ id, elapsedMs }] dans l'ordre des trouvailles
let quizWrongGuessCount = 0;

// Pokémon en jeu pour la partie en cours : uniquement ceux de la génération
// choisie en config, jamais les 386 (sinon deviner "Dracaufeu" pendant un
// quiz Gen 2 marcherait, alors qu'il n'est pas dans le roster de la partie).
function quizRoster() {
  return pokemonsByGeneration(quizGeneration);
}

function updateQuizProgress() {
  const total = quizRoster().length;
  const count = quizFound.size;
  quizProgressFillEl.style.width = `${(count / total) * 100}%`;
  quizProgressTextEl.textContent = t("quiz.progress", { count, total });
}

// Distance entre la saisie et le nom d'un Pokémon (0 = exact), ou null si hors
// tolérance. Contrairement à la recherche du mode Liste, une simple saisie
// partielle (ex: "psi") ne doit pas suffire à trouver "Psykokwak" — il faut
// écrire (à peu de fautes de frappe près) le nom complet.
// En mode Hardcore, aucune tolérance aux fautes de frappe n'est appliquée :
// seules la casse et la ponctuation restent ignorées (normalizeStrict).
function guessMatchDistance(rawGuess, pokemon) {
  if (quizHardcore) {
    const strictGuess = normalizeStrict(rawGuess);
    if (!strictGuess) return null;
    return strictGuess === pokemonStrictNormalizedName(pokemon) ? 0 : null;
  }

  const guess = normalize(rawGuess);
  if (!guess) return null;
  const normalizedName = pokemonNormalizedName(pokemon);
  if (guess === normalizedName) return 0;

  const threshold = Math.max(1, Math.floor(normalizedName.length * 0.25));
  const distance = levenshtein(guess, normalizedName);
  return distance <= threshold ? distance : null;
}

// Parmi les candidats, retourne celui dont le nom est le plus proche de la
// saisie plutôt que le premier venu : deux Pokémon au nom très proche (ex:
// "Nidoran" est dans la tolérance de Nidoran♀/♂ ET de Nidorina/Nidorino)
// doivent se départager par la distance, sinon le mauvais gagne selon l'ordre
// du Pokédex.
function findClosestGuessMatch(rawGuess, candidates) {
  let best = null;
  let bestDistance = Infinity;
  for (const pokemon of candidates) {
    const distance = guessMatchDistance(rawGuess, pokemon);
    if (distance !== null && distance < bestDistance) {
      best = pokemon;
      bestDistance = distance;
    }
  }
  return best;
}

// Seule(s) bonne(s) réponse(s) valable(s) à l'instant T, selon le mode :
// - "number" : uniquement la cible aléatoire active (quizCurrentTarget).
// - "sequence" : uniquement le prochain de l'ordre de la partie
//   (quizSeqOrder), qui part d'un point aléatoire et boucle — pas
//   forcément le plus petit numéro non trouvé du roster.
// - "ordered" (ou Custom + "Ordre croissant") : uniquement le prochain non
//   trouvé (plus petit numéro du roster).
// - Sinon (fill/Custom libre) : n'importe quel Pokémon non trouvé.
// Utilisée à la fois par le handler `submit` et par la validation
// automatique (scheduleAutoSubmitCheck), pour ne jamais diverger entre les
// deux chemins de validation.
function quizActiveCandidates(unfound) {
  if (quizMode === "number") return quizCurrentTarget ? [quizCurrentTarget] : [];
  if (quizMode === "sequence") {
    const next = quizSeqOrder[quizFound.size];
    return next ? [next] : [];
  }
  if (quizSequential) return unfound[0] ? [unfound[0]] : [];
  return unfound;
}

function showQuizFeedback(message, tone) {
  quizFeedbackEl.textContent = message;
  quizFeedbackEl.className = "quiz-feedback";
  if (tone) quizFeedbackEl.classList.add(tone);
}

function typeBadgesHtml(pokemon) {
  if (!quizShowTypes) return "";
  return renderTypeBadges(pokemon);
}

// Affiche la première lettre du nom si l'aide est activée (jamais le nom
// entier, même pour les Pokémon les plus courts comme Mew ou Abo).
function hintedPlaceholder(pokemon) {
  if (!quizShowHints) return "?????";
  const name = pokemonName(pokemon);
  const revealed = name.slice(0, 1);
  const hidden = "?".repeat(Math.max(1, name.length - 1));
  return `<span class="hint-revealed">${revealed}</span>${hidden}`;
}

// Widget "prochain Pokémon" (mode "Dans l'ordre" / Facile, ou Custom avec
// l'option activée) : montre le(s) type(s) et la première lettre du prochain
// Pokémon non trouvé, sans afficher la grille ni son nom complet.
function renderNextHint() {
  if (!quizShowNextHint) {
    quizNextHintEl.hidden = true;
    return;
  }

  const next = quizRoster().find((p) => !quizFound.has(p.id));
  if (!next) {
    quizNextHintEl.hidden = true;
    return;
  }

  const name = pokemonName(next);
  const revealed = name.slice(0, 1);
  const hidden = "?".repeat(Math.max(1, name.length - 1));
  quizNextHintEl.hidden = false;
  quizNextHintEl.innerHTML = `
    <span class="quiz-next-hint-label">${t("quiz.nextHintLabel")}</span>
    ${renderTypeBadges(next)}
    <span class="quiz-next-hint-letter"><span class="hint-revealed">${revealed}</span>${hidden}</span>
  `;
}

// Mode "Numéro" : tire une cible aléatoire parmi les Pokémon non trouvés.
// Appelée au lancement de la partie et après chaque bonne réponse.
function pickNumberTarget() {
  const unfound = quizRoster().filter((p) => !quizFound.has(p.id));
  quizCurrentTarget = unfound.length > 0 ? unfound[Math.floor(Math.random() * unfound.length)] : null;
}

// Widget mode "Numéro" : affiche uniquement le numéro de la cible active,
// avec type/première lettre en aide optionnelle (mêmes réglages que la
// grille des autres modes, appliqués ici à cette seule cible).
function renderQuizTarget() {
  if (quizMode !== "number" || !quizCurrentTarget) {
    quizTargetCardEl.hidden = true;
    return;
  }

  quizTargetCardEl.hidden = false;
  quizTargetCardEl.innerHTML = `
    <span class="quiz-target-label">${t("quiz.targetLabel")}</span>
    <span class="quiz-target-number">${formatNumber(quizCurrentTarget.id)}</span>
    ${typeBadgesHtml(quizCurrentTarget)}
    ${quizShowHints ? `<span class="quiz-target-letter">${hintedPlaceholder(quizCurrentTarget)}</span>` : ""}
  `;
}

// Petite carte pour la fenêtre du mode "Suite" : révélée (confirmée) ou
// silhouette (prochaine cible à deviner, avec les mêmes aides que le mode
// "Numéro").
function seqCardHtml(pokemon, revealed) {
  const name = pokemonName(pokemon);
  return `
    <span class="quiz-seq-card ${revealed ? "quiz-seq-revealed" : "quiz-seq-pending"}">
      <img
        class="quiz-seq-sprite"
        src="${getSpriteUrl(pokemon.id)}"
        alt="${revealed ? name : t("quiz.altHidden")}"
        loading="lazy"
      />
      <span class="quiz-seq-number">${formatNumber(pokemon.id)}</span>
      <span class="quiz-seq-name">${
        revealed ? name : `${typeBadgesHtml(pokemon)}${quizShowHints ? hintedPlaceholder(pokemon) : ""}`
      }</span>
    </span>
  `;
}

// Widget mode "Suite" : les `quizSeqContext` derniers Pokémon confirmés
// (donnés au départ ou devinés) suivis de la prochaine cible à deviner.
// Comme ce mode réutilise la mécanique séquentielle (roster trié par
// numéro), `quizFound.size` sert directement d'index dans le roster.
function renderSeqStrip() {
  if (quizMode !== "sequence") {
    quizSeqStripEl.hidden = true;
    return;
  }

  const confirmedCount = quizFound.size;
  const shown = quizSeqOrder.slice(Math.max(0, confirmedCount - quizSeqContext), confirmedCount);
  const next = quizSeqOrder[confirmedCount];

  quizSeqStripEl.hidden = false;
  quizSeqStripEl.innerHTML = `
    ${shown.map((p) => seqCardHtml(p, true)).join("")}
    ${shown.length > 0 ? '<span class="quiz-seq-arrow">→</span>' : ""}
    ${next ? seqCardHtml(next, false) : ""}
  `;
}

function renderQuizPlaying() {
  quizListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const pokemon of quizRoster()) {
    const isFound = quizFound.has(pokemon.id);
    const name = pokemonName(pokemon);

    const li = document.createElement("li");
    li.className = "pokemon-card quiz-card";
    if (isFound) li.classList.add("caught");
    if (pokemon.id === justFoundId) li.classList.add("just-found");

    li.innerHTML = `
      ${shinySparkleHtml(pokemon.id)}
      <span class="pokemon-number quiz-number">${formatNumber(pokemon.id)}</span>
      <div class="quiz-card-top">
        <span class="sprite-wrap">
          <img
            class="pokemon-sprite quiz-sprite"
            src="${getSpriteUrl(pokemon.id)}"
            alt="${isFound ? name : t("quiz.altHidden")}"
            loading="lazy"
          />
        </span>
        <span class="pokemon-name quiz-name" ${isFound ? `title="${name}"` : ""}>${
          isFound ? name : hintedPlaceholder(pokemon)
        }</span>
      </div>
      <div class="quiz-card-bottom">
        <span class="quiz-card-types">${typeBadgesHtml(pokemon)}</span>
      </div>
    `;

    fragment.appendChild(li);
  }

  quizListEl.appendChild(fragment);

  if (justFoundId !== null) {
    quizListEl
      .querySelector(".just-found")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    justFoundId = null;
  }
}

// Insère la puce à sa place dans l'ordre numérique (Pokédex), pas dans
// l'ordre où les Pokémon ont été devinés.
function addFoundChip(pokemon) {
  const name = pokemonName(pokemon);
  const chip = document.createElement("span");
  chip.className = "found-chip";
  chip.dataset.id = pokemon.id;
  chip.innerHTML = `
    <span class="sprite-wrap">
      <img class="found-chip-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${name}" loading="lazy" />
      ${shinySparkleHtml(pokemon.id)}
    </span>
    <span>${formatNumber(pokemon.id)} ${name}</span>
  `;

  const nextChip = [...quizFoundChipsEl.children].find((c) => Number(c.dataset.id) > pokemon.id);
  quizFoundChipsEl.insertBefore(chip, nextChip || null);
}

// Reconstruit toutes les puces (ordre numérique déjà garanti par quizRoster) ;
// utile quand un réglage global qui affecte leur sprite change (animé, Shiny).
function renderQuizFoundChips() {
  quizFoundChipsEl.innerHTML = "";
  quizRoster()
    .filter((p) => quizFound.has(p.id))
    .forEach((p) => addFoundChip(p));
}

function renderRecap() {
  const roster = quizRoster();
  const total = roster.length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  quizRecapStatEl.textContent = `${percent}%`;
  quizRecapTextEl.textContent = t("quiz.recapCount", { count, total });

  quizGameOverBannerEl.hidden = !quizGameOverByMistake;
  if (quizGameOverByMistake) quizGameOverBannerEl.textContent = t("quiz.gameOverBanner");

  // Le temps n'est un résultat intéressant que si la partie ne s'est pas
  // arrêtée simplement parce que le temps imparti était écoulé.
  if (quizEndedByTimeout) {
    quizRecapTimeEl.hidden = true;
  } else {
    quizRecapTimeEl.hidden = false;
    quizRecapTimeEl.textContent = t("quiz.recapTime", { time: formatElapsed(quizElapsedMs) });
  }

  renderRecapStats();

  quizRecapListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const pokemon of roster) {
    const isFound = quizFound.has(pokemon.id);
    const name = pokemonName(pokemon);

    const li = document.createElement("li");
    li.className = `pokemon-card recap-card ${isFound ? "caught" : "missing"}`;

    li.innerHTML = `
      ${shinySparkleHtml(pokemon.id)}
      <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
      <span class="sprite-wrap">
        <img class="pokemon-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${name}" loading="lazy" />
      </span>
      <span class="pokemon-name">${name}</span>
    `;

    fragment.appendChild(li);
  }

  quizRecapListEl.appendChild(fragment);
}

// Distance (en temps) entre deux trouvailles consécutives, ou depuis le début
// pour la première : la plus courte et la plus longue font des stats amusantes.
function computeQuizStats() {
  const attempts = quizFound.size + quizWrongGuessCount;
  const accuracy = attempts > 0 ? Math.round((quizFound.size / attempts) * 100) : null;
  const pace = quizElapsedMs > 0 ? quizFound.size / (quizElapsedMs / 60000) : 0;

  let fastest = null;
  let slowest = null;
  let prevMs = 0;
  for (const entry of quizFindLog) {
    const delta = entry.elapsedMs - prevMs;
    if (!fastest || delta < fastest.delta) fastest = { id: entry.id, delta };
    if (!slowest || delta > slowest.delta) slowest = { id: entry.id, delta };
    prevMs = entry.elapsedMs;
  }

  return {
    attempts,
    accuracy,
    pace,
    fastest,
    slowest,
    first: quizFindLog[0] || null,
    last: quizFindLog.length > 0 ? quizFindLog[quizFindLog.length - 1] : null,
  };
}

function statTileHtml(icon, label, value, sub) {
  return `
    <div class="stat-tile">
      <span class="stat-tile-icon">${icon}</span>
      <span class="stat-tile-label">${label}</span>
      <span class="stat-tile-value">${value}</span>
      <span class="stat-tile-sub">${sub}</span>
    </div>
  `;
}

function renderRecapStats() {
  if (quizFound.size === 0) {
    quizRecapStatsEl.hidden = true;
    quizRecapStatsEl.innerHTML = "";
    return;
  }

  const stats = computeQuizStats();
  const tiles = [];

  if (stats.accuracy !== null) {
    tiles.push(
      statTileHtml(
        "🎯",
        t("stats.accuracy"),
        `${stats.accuracy}%`,
        t("stats.accuracySub", { count: quizFound.size, attempts: stats.attempts })
      )
    );
  }

  if (quizElapsedMs > 0) {
    tiles.push(statTileHtml("⚡", t("stats.pace"), `${stats.pace.toFixed(1)} /min`, t("stats.paceSub")));
  }

  if (stats.fastest) {
    const p = POKEMON_BY_ID.get(stats.fastest.id);
    tiles.push(
      statTileHtml("🏃", t("stats.fastest"), pokemonName(p), t("stats.foundIn", { time: formatDuration(stats.fastest.delta) }))
    );
  }

  if (stats.slowest && stats.slowest.id !== stats.fastest?.id) {
    const p = POKEMON_BY_ID.get(stats.slowest.id);
    tiles.push(
      statTileHtml("🐌", t("stats.slowest"), pokemonName(p), t("stats.foundIn", { time: formatDuration(stats.slowest.delta) }))
    );
  }

  if (stats.first) {
    const p = POKEMON_BY_ID.get(stats.first.id);
    tiles.push(
      statTileHtml("🥇", t("stats.first"), pokemonName(p), t("stats.foundAt", { time: formatDuration(stats.first.elapsedMs) }))
    );
  }

  if (stats.last && stats.last.id !== stats.first?.id) {
    const p = POKEMON_BY_ID.get(stats.last.id);
    tiles.push(
      statTileHtml("🏁", t("stats.last"), pokemonName(p), t("stats.foundAt", { time: formatDuration(stats.last.elapsedMs) }))
    );
  }

  quizRecapStatsEl.innerHTML = tiles.join("");
  quizRecapStatsEl.hidden = false;
}

function selectedMinutes() {
  const active = document.querySelector("#quiz-time-options .settings-option.active");
  return Number(active?.dataset.minutes ?? 0);
}

function padTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatCountdown(remainingMs) {
  return padTime(Math.max(0, Math.ceil(remainingMs / 1000)));
}

function formatElapsed(elapsedMs) {
  return padTime(Math.max(0, Math.floor(elapsedMs / 1000)));
}

// Format court pour les durées des stats (ex: "3s", ou "01:24" au-delà d'1 min).
function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return totalSeconds < 60 ? `${totalSeconds}s` : formatElapsed(ms);
}

// Le quiz a toujours un chrono : compte à rebours si un temps est imparti,
// sinon chronomètre qui compte le temps écoulé (mode Infini).
function tickTimer() {
  if (quizDeadline === null) {
    quizTimerEl.textContent = formatElapsed(Date.now() - quizStartedAt);
    quizTimerEl.classList.remove("warning");
    return;
  }

  const remainingMs = quizDeadline - Date.now();
  quizTimerEl.textContent = formatCountdown(remainingMs);
  quizTimerEl.classList.toggle("warning", remainingMs <= 30000);
  if (remainingMs <= 0) {
    quizEndedByTimeout = true;
    endQuiz();
  }
}

function startTimer() {
  clearInterval(quizTimerHandle);
  quizTimerHandle = null;
  tickTimer();
  quizTimerHandle = setInterval(tickTimer, 250);
}

function startQuiz() {
  quizFound = new Set();
  justFoundId = null;
  quizFindLog = [];
  quizWrongGuessCount = 0;

  const settings = effectiveQuizSettings();
  quizMinutesUsed = settings.minutes;
  quizStartedAt = Date.now();
  quizEndedByTimeout = false;
  quizDeadline = settings.minutes > 0 ? quizStartedAt + settings.minutes * 60000 : null;
  quizShowTypes = settings.types;
  quizShowGrid = settings.grid;
  quizShowHints = settings.hints;
  quizShowNextHint = settings.nextHint;
  quizHardcore = settings.hardcore;
  quizSequential = settings.sequential;
  quizPermadeath = settings.permadeath;
  quizSeqContext = settings.context || 0;
  quizGameOverByMistake = false;
  quizPhase = "playing";
  setQuizNavLock(true);
  recordGameStart(quizMode, quizMode === "custom" ? null : quizDifficulty);

  // Mode "Suite" : point de départ tiré au hasard (pas toujours Bulbasaur),
  // le reste de la partie continue en boucle jusqu'au bout du roster. Les
  // `quizSeqContext` premiers de cet ordre sont donnés gratuitement (pas de
  // recordPokemonFound/quizFindLog, ce n'est pas une trouvaille) pour amorcer
  // la fenêtre de contexte.
  if (quizMode === "sequence") {
    const roster = quizRoster();
    const start = Math.floor(Math.random() * roster.length);
    quizSeqOrder = roster.slice(start).concat(roster.slice(0, start));
    quizSeqOrder.slice(0, quizSeqContext).forEach((p) => quizFound.add(p.id));
  }
  // Mode "Numéro" : tire la première cible aléatoire de la partie.
  if (quizMode === "number") pickNumberTarget();

  quizSetupEl.hidden = true;
  quizRecapEl.hidden = true;
  quizPlayingEl.hidden = false;
  quizListEl.style.display = quizShowGrid ? "" : "none";
  quizFoundChipsEl.style.display = quizShowGrid ? "none" : "";
  quizFoundChipsEl.innerHTML = "";
  if (!quizShowGrid && quizFound.size > 0) renderQuizFoundChips();

  showQuizFeedback("", null);
  quizInputEl.classList.remove("shake");
  quizInputEl.value = "";
  updateClearButtonVisibility();
  if (quizShowGrid) renderQuizPlaying();
  renderNextHint();
  renderQuizTarget();
  renderSeqStrip();
  updateQuizProgress();
  updateStickyOffsets();
  quizInputEl.focus();
  startTimer();
}

function endQuiz() {
  quizElapsedMs = Date.now() - quizStartedAt;
  clearInterval(quizTimerHandle);
  quizTimerHandle = null;
  quizPhase = "recap";
  setQuizNavLock(false);
  quizPlayingEl.hidden = true;
  quizRecapEl.hidden = false;
  renderRecap();

  // Succès de génération : évalués dès que tous les Pokémon du roster sont
  // trouvés (complétion, temps, Hardcore, niveau de difficulté nommé utilisé
  // — jamais en mode Custom, même si ses réglages reproduisent un niveau).
  const completedGen = quizFound.size === quizRoster().length;
  const newlyEarned = completedGen
    ? checkAchievements(quizGeneration, {
        elapsedMs: quizElapsedMs,
        hardcore: quizHardcore,
        preset: quizMode === "custom" ? null : quizDifficulty,
        mode: quizMode,
        permadeath: quizPermadeath,
      })
    : [];

  recordGameEnd(quizMode, quizMode === "custom" ? null : quizDifficulty, {
    found: quizFound.size,
    total: quizRoster().length,
    elapsedMs: quizElapsedMs,
    completed: completedGen,
  });

  if (newlyEarned.length > 0) {
    const icons = newlyEarned.map((key) => ACHIEVEMENTS.find((a) => a.key === key).icon).join(" ");
    quizAchvBannerEl.hidden = false;
    quizAchvBannerEl.textContent = t("achv.earnedBanner", { gen: quizGeneration, icons });
    renderQuizAchvStrip();
    newlyEarned.forEach((key) => {
      const achv = ACHIEVEMENTS.find((a) => a.key === key);
      showToast({ icon: achv.icon, title: t("toast.achvTitle"), message: t(`achv.${key}`), tone: "toast-achv" });
    });
  } else {
    quizAchvBannerEl.hidden = true;
    quizAchvBannerEl.textContent = "";
  }
}

function backToSetup() {
  clearInterval(quizTimerHandle);
  quizTimerHandle = null;
  quizPhase = "setup";
  quizPlayingEl.hidden = true;
  quizRecapEl.hidden = true;
  quizSetupEl.hidden = false;
}

quizTimeOptionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    quizTimeOptionBtns.forEach((b) => b.classList.toggle("active", b === btn));
  });
});

// Le panneau détaillé reste toujours visible (même hors "Custom"), pour
// qu'on voie ce que chaque mode/difficulté applique : grisé et pré-rempli
// avec l'aperçu du niveau choisi, éditable seulement en "Custom". "Types" et
// "indice première lettre" n'ont en plus de sens que si la grille (qui les
// affiche) est elle-même activée.
function updateCustomPanelState() {
  const isCustom = quizMode === "custom";

  if (!isCustom) {
    const modeDef = GAME_MODES[quizMode];
    const diff = modeDef.difficulties[quizDifficulty];
    quizTimeOptionBtns.forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.minutes) === modeDef.minutes);
    });
    quizOptGridEl.checked = diff.grid;
    quizOptTypesEl.checked = diff.types;
    quizOptHintsEl.checked = diff.hints;
    quizOptNextHintEl.checked = diff.nextHint;
    quizOptSequentialEl.checked = modeDef.sequential;
    quizOptPermadeathEl.checked = diff.permadeath;
    quizOptHardcoreEl.checked = diff.hardcore;
  }

  quizTimeOptionBtns.forEach((btn) => {
    btn.disabled = !isCustom;
  });
  quizOptGridEl.disabled = !isCustom;
  quizOptSequentialEl.disabled = !isCustom;
  quizOptPermadeathEl.disabled = !isCustom;
  quizOptHardcoreEl.disabled = !isCustom;
  quizOptNextHintEl.disabled = !isCustom;
  quizOptTypesEl.disabled = !isCustom || !quizOptGridEl.checked;
  quizOptHintsEl.disabled = !isCustom || !quizOptGridEl.checked;

  if (isCustom && !quizOptGridEl.checked) {
    quizOptTypesEl.checked = false;
    quizOptHintsEl.checked = false;
  }
}

quizOptGridEl.addEventListener("change", updateCustomPanelState);

// Sélectionne le niveau de difficulté courant (parmi les 4 du mode "fill" ou
// "ordered") ; sans effet sur l'état de jeu tant que le mode reste "custom".
function applyDifficulty(difficulty) {
  quizDifficulty = difficulty;
  quizDifficultyBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.difficulty === difficulty));
  updateCustomPanelState();
}

// Bascule entre les modes de jeu : affiche la bonne rangée de difficultés
// (4 niveaux, propres à chaque mode) ; le panneau détaillé reste affiché dans
// tous les cas (cf. updateCustomPanelState).
function applyMode(mode) {
  quizMode = mode;
  quizModeBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));
  Object.entries(quizDifficultySections).forEach(([m, el]) => {
    el.hidden = mode !== m;
  });
  updateCustomPanelState();
}

quizModeBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyMode(btn.dataset.mode));
});
quizDifficultyBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyDifficulty(btn.dataset.difficulty));
});

applyMode(quizMode);
applyDifficulty(quizDifficulty);

// Réglages effectifs de la partie à lancer : ceux du niveau de difficulté du
// mode choisi, ou la lecture directe des champs du panneau Custom.
function effectiveQuizSettings() {
  if (quizMode === "custom") {
    return {
      minutes: selectedMinutes(),
      grid: quizOptGridEl.checked,
      types: quizOptTypesEl.checked,
      hints: quizOptHintsEl.checked,
      nextHint: quizOptNextHintEl.checked,
      hardcore: quizOptHardcoreEl.checked,
      sequential: quizOptSequentialEl.checked,
      permadeath: quizOptPermadeathEl.checked,
    };
  }

  const modeDef = GAME_MODES[quizMode];
  const diff = modeDef.difficulties[quizDifficulty];
  return {
    minutes: modeDef.minutes,
    sequential: modeDef.sequential,
    grid: diff.grid,
    types: diff.types,
    hints: diff.hints,
    nextHint: diff.nextHint,
    hardcore: diff.hardcore,
    permadeath: diff.permadeath,
    context: diff.context,
  };
}

// Devine (mode, difficulté) à partir d'une combinaison de réglages bruts —
// repli utilisé uniquement pour les anciens liens de partage qui n'encodent
// pas encore `mode`/`difficulty` explicitement (voir buildQuizShareUrl) ;
// retourne null si aucun des niveaux nommés ne correspond exactement
// (repli sur "Custom"). `context` est absent (undefined) pour fill/ordered
// mais vaut explicitement 0 pour "sequence"/veryHard : la comparaison
// stricte évite donc toute collision entre ces deux cas.
function detectModeAndDifficulty(settings) {
  for (const [mode, modeDef] of Object.entries(GAME_MODES)) {
    if (modeDef.minutes !== settings.minutes || modeDef.sequential !== settings.sequential) continue;
    for (const [difficulty, diff] of Object.entries(modeDef.difficulties)) {
      if (
        diff.grid === settings.grid &&
        diff.types === settings.types &&
        diff.hints === settings.hints &&
        diff.nextHint === settings.nextHint &&
        diff.hardcore === settings.hardcore &&
        diff.permadeath === settings.permadeath &&
        diff.context === settings.context
      ) {
        return { mode, difficulty };
      }
    }
  }
  return null;
}

function applyGeneration(gen) {
  quizGeneration = gen;
  quizGenBtns.forEach((btn) => btn.classList.toggle("active", Number(btn.dataset.gen) === gen));
}

quizGenBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyGeneration(Number(btn.dataset.gen)));
});
applyGeneration(quizGeneration);

quizStartBtn.addEventListener("click", startQuiz);
quizEndBtn.addEventListener("click", () => {
  quizEndedByTimeout = false;
  endQuiz();
});
// "Rejouer" relance directement une partie avec la configuration actuelle
// (les champs du setup, restés en l'état, sont relus tels quels par
// startQuiz) ; "Configuration" seul ramène à l'écran de réglages.
quizReplayBtn.addEventListener("click", startQuiz);
quizConfigureBtn.addEventListener("click", backToSetup);
quizHomeBtn.addEventListener("click", () => {
  backToSetup();
  goToMode("quiz");
});

function vibrate(pattern) {
  navigator.vibrate?.(pattern);
}

// Retire puis réapplique la classe (avec un reflow forcé entre les deux) pour
// que l'animation puisse rejouer sur des essais invalides consécutifs.
function shakeInput() {
  quizInputEl.classList.remove("shake");
  void quizInputEl.offsetWidth;
  quizInputEl.classList.add("shake");
}

// Sans ce nettoyage, la classe "shake" restait posée après l'animation ; en
// rejouant juste après une défaite, l'input (recréé caché puis réaffiché)
// rejouait l'animation CSS comme si une nouvelle erreur venait d'être faite.
quizInputEl.addEventListener("animationend", (event) => {
  if (event.animationName === "input-shake") quizInputEl.classList.remove("shake");
});

function updateClearButtonVisibility() {
  quizInputClearBtn.hidden = quizInputEl.value.length === 0;
}

quizInputEl.addEventListener("input", updateClearButtonVisibility);

// Validation automatique (réglage "Validation STT", désactivé par défaut) :
// pratique avec la dictée vocale du clavier (mobile), qui ne déclenche pas
// d'événement "submit". Dès que la saisie correspond EXACTEMENT (distance 0,
// jamais la tolérance aux fautes de frappe) à un Pokémon valide, on soumet
// le formulaire après une courte pause — le temps de laisser la dictée finir
// d'écrire, plutôt que de valider au premier caractère qui complète
// accidentellement un nom plus court (ex: "Ossatueur" ne doit pas déclencher
// "Osselait" en cours de frappe).
let quizAutoSubmitTimer = null;

function scheduleAutoSubmitCheck() {
  if (quizAutoSubmitTimer) clearTimeout(quizAutoSubmitTimer);
  if (!settings.sttAutoSubmit) return;
  quizAutoSubmitTimer = setTimeout(() => {
    quizAutoSubmitTimer = null;
    if (!settings.sttAutoSubmit) return;
    if (quizPhase !== "playing") return;

    const guess = quizInputEl.value.trim();
    if (!guess) return;

    const roster = quizRoster();
    const unfound = roster.filter((p) => !quizFound.has(p.id));
    const candidates = quizActiveCandidates(unfound);
    const isExactMatch = candidates.some((p) => guessMatchDistance(guess, p) === 0);

    if (isExactMatch) quizFormEl.requestSubmit();
  }, 500);
}

quizInputEl.addEventListener("input", scheduleAutoSubmitCheck);

quizInputClearBtn.addEventListener("click", () => {
  quizInputEl.value = "";
  updateClearButtonVisibility();
  quizInputEl.focus();
});

// Mode "un seul essai" : n'importe quelle réponse invalide (mauvais nom, ou
// hors d'ordre en mode séquentiel) met immédiatement fin à la partie.
function triggerGameOver() {
  quizGameOverByMistake = true;
  quizEndedByTimeout = false;
  vibrate([80, 40, 80, 40, 160]);
  endQuiz();
}

quizFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (quizPhase !== "playing") return;

  const guess = quizInputEl.value.trim();
  if (!guess) return;

  const roster = quizRoster();
  const unfound = roster.filter((p) => !quizFound.has(p.id));
  // En mode "ordre croissant" (Chronologique/Suite), seul le prochain
  // Pokémon non trouvé (plus petit numéro de Pokédex) peut être validé :
  // deviner un autre Pokémon valide mais pas encore "d'actualité" est
  // traité comme hors d'ordre. En mode "Numéro", seule la cible active
  // compte (voir quizActiveCandidates).
  const nextRequired = quizMode === "sequence"
    ? quizSeqOrder[quizFound.size] ?? null
    : quizSequential ? unfound[0] ?? null : null;
  const match = findClosestGuessMatch(guess, quizActiveCandidates(unfound));

  if (match) {
    quizFound.add(match.id);
    recordPokemonFound(match.id);
    quizFindLog.push({ id: match.id, elapsedMs: Date.now() - quizStartedAt });
    justFoundId = match.id;
    // Le tirage Shiny doit avoir lieu avant le rendu, sinon l'étoile
    // n'apparaîtrait qu'à la prochaine mise à jour de la grille/des puces.
    const wonShiny = tryUnlockShiny(match.id);
    if (quizShowGrid) {
      renderQuizPlaying();
    } else {
      addFoundChip(match);
    }
    // Mode "Numéro" : une nouvelle cible aléatoire remplace celle trouvée.
    if (quizMode === "number") pickNumberTarget();
    renderNextHint();
    renderQuizTarget();
    renderSeqStrip();
    updateQuizProgress();
    quizInputEl.value = "";
    updateClearButtonVisibility();

    if (wonShiny) {
      showQuizFeedback(t("quiz.shinyUnlocked", { name: pokemonName(match) }), "shiny");
      vibrate([20, 30, 20, 30, 80]);
      showToast({ icon: "✨", title: t("toast.shinyTitle"), message: pokemonName(match), tone: "toast-shiny" });
    } else {
      showQuizFeedback(t("quiz.feedbackCorrect", { name: pokemonName(match) }), "success");
      vibrate(25);
    }

    if (quizFound.size === roster.length) {
      quizEndedByTimeout = false;
      vibrate([60, 40, 60, 40, 120]);
      endQuiz();
      celebrateConfetti();
      return;
    }
  } else {
    const alreadyFound = findClosestGuessMatch(guess, roster.filter((p) => quizFound.has(p.id)));
    const outOfOrder = quizSequential && findClosestGuessMatch(guess, unfound);
    if (alreadyFound) {
      showQuizFeedback(t("quiz.feedbackAlreadyFound", { name: pokemonName(alreadyFound) }), null);
    } else if (outOfOrder) {
      showQuizFeedback(t("quiz.feedbackOutOfOrder", { number: formatNumber(nextRequired.id) }), "error");
      shakeInput();
      vibrate([30, 30, 30]);
      if (quizPermadeath) {
        triggerGameOver();
        return;
      }
    } else {
      quizWrongGuessCount += 1;
      showQuizFeedback(t("quiz.feedbackWrong"), "error");
      shakeInput();
      vibrate([30, 30, 30]);
      if (quizPermadeath) {
        triggerGameOver();
        return;
      }
    }
  }

  quizInputEl.focus();
});

// Construit un lien qui reproduit exactement la configuration de cette partie
// (temps imparti, aides), pour que la personne qui l'ouvre parte sur un pied
// d'égalité. `mode`/`difficulty` sont encodés explicitement (en plus des
// réglages bruts, gardés pour le panneau Custom) : avec 4 modes nommés,
// certains niveaux ont exactement la même "forme" de réglages (ex:
// Classique/Difficile et Numéro/Normal), la déduction par réglages seule
// (detectModeAndDifficulty) deviendrait ambiguë.
function buildQuizShareUrl() {
  const params = new URLSearchParams();
  params.set("gen", String(quizGeneration));
  params.set("minutes", String(quizMinutesUsed));
  params.set("types", quizShowTypes ? "1" : "0");
  params.set("grid", quizShowGrid ? "1" : "0");
  params.set("hints", quizShowHints ? "1" : "0");
  params.set("hardcore", quizHardcore ? "1" : "0");
  params.set("sequential", quizSequential ? "1" : "0");
  params.set("permadeath", quizPermadeath ? "1" : "0");
  params.set("nexthint", quizShowNextHint ? "1" : "0");
  params.set("context", String(quizSeqContext));
  params.set("mode", quizMode);
  if (quizMode !== "custom") params.set("difficulty", quizDifficulty);

  const url = new URL(location.href);
  url.search = params.toString();
  url.hash = "";
  return url.toString();
}

function showShareFeedback(message) {
  quizShareFeedbackEl.textContent = message;
  clearTimeout(showShareFeedback.timeoutId);
  showShareFeedback.timeoutId = setTimeout(() => {
    quizShareFeedbackEl.textContent = "";
  }, 3000);
}

// Une pique ou un compliment selon le score, pour donner un peu de caractère
// au message partagé.
function scorePhraseFor(percent) {
  if (percent === 100) return t("score.100");
  if (percent >= 90) return t("score.90");
  if (percent >= 75) return t("score.75");
  if (percent >= 50) return t("score.50");
  if (percent >= 25) return t("score.25");
  if (percent > 0) return t("score.low");
  return t("score.zero");
}

function elapsedMinutesLabel(ms) {
  const minutes = Math.round(ms / 60000);
  return minutes < 1 ? "< 1" : String(minutes);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapCenteredText(ctx, text, centerX, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, centerX, y + i * lineHeight));
}

// Génère une image "carte de résultat" (façon aperçu de partage social).
// Purement synchrone (aucune image externe à charger), pour rester rapide et
// fiable même hors-ligne.
function buildResultCardBlob({ percent, count, total, minutesLabel, gen, phrase }) {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#3b6ce0");
  bgGrad.addColorStop(1, "#ef5350");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const pad = 44;
  roundRectPath(ctx, pad, pad, width - pad * 2, height - pad * 2, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const centerX = width / 2;
  const centerY = height / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#1c1f2a";
  ctx.font = "700 32px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(t("card.title", { gen }), centerX, pad + 70);

  ctx.fillStyle = "#3b6ce0";
  ctx.font = "800 168px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${percent}%`, centerX, centerY + 30);

  ctx.fillStyle = "#676c7c";
  ctx.font = "600 36px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(t("quiz.recapCount", { count, total }), centerX, centerY + 90);

  ctx.fillStyle = "#3b6ce0";
  ctx.font = "700 30px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(t("card.time", { minutes: minutesLabel }), centerX, centerY + 140);

  ctx.fillStyle = "#1c1f2a";
  ctx.font = "500 27px 'Segoe UI', Arial, sans-serif";
  wrapCenteredText(ctx, phrase, centerX, centerY + 195, width - pad * 2 - 100, 36);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// Résume le score courant (utilisé par le partage texte et le téléchargement
// d'image, pour rester cohérents).
function currentQuizSummary() {
  const total = quizRoster().length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  // Le temps affiché reflète la performance réelle, sauf si la partie s'est
  // arrêtée simplement parce que le temps imparti était écoulé (auquel cas
  // c'est juste la durée configurée).
  const minutesLabel = quizEndedByTimeout ? String(quizMinutesUsed) : elapsedMinutesLabel(quizElapsedMs);
  return { total, count, percent, minutesLabel, gen: quizGeneration, phrase: scorePhraseFor(percent) };
}

// Copie uniquement le texte (avec le lien) dans le presse-papiers, sans passer
// par le menu de partage natif de la plateforme : plus rapide, et évite que
// certaines cibles de partage ignorent le texte dès qu'une image est jointe.
quizShareBtn.addEventListener("click", async () => {
  const { count, total, percent, minutesLabel, gen, phrase } = currentQuizSummary();
  const url = buildQuizShareUrl();

  const text = [
    phrase,
    t("share.line2", { count, total, gen, percent }),
    t("share.line3", { minutes: minutesLabel }),
    t("share.line4", { url }),
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showShareFeedback(t("share.copied"));
  } catch {
    showShareFeedback(t("share.copyFailed"));
  }
});

// Télécharge la carte de résultat en image, complètement indépendamment du
// partage natif (ce couplage causait des bugs selon les cibles de partage).
quizDownloadBtn.addEventListener("click", async () => {
  const { total, count, percent, minutesLabel, gen, phrase } = currentQuizSummary();

  const originalLabel = quizDownloadBtn.textContent;
  quizDownloadBtn.disabled = true;
  quizDownloadBtn.textContent = t("quiz.generating");

  try {
    const blob = await buildResultCardBlob({ percent, count, total, minutesLabel, gen, phrase });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokelist-quiz-resultat.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showShareFeedback(t("share.imageDownloaded"));
  } catch {
    showShareFeedback(t("share.imageFailed"));
  } finally {
    quizDownloadBtn.disabled = false;
    quizDownloadBtn.textContent = originalLabel;
  }
});

// Reprend les réglages (temps, aides) d'une partie partagée via l'URL ; appelée
// depuis app.js une fois la navigation entre modes disponible.
function applySharedQuizSettings(params) {
  const gen = Number(params.get("gen") ?? 1);
  applyGeneration(GENERATIONS.includes(gen) ? gen : 1);

  const settings = {
    minutes: Number(params.get("minutes") ?? 0),
    types: params.get("types") === "1",
    grid: params.get("grid") === "1",
    hints: params.get("hints") === "1",
    nextHint: params.get("nexthint") === "1",
    hardcore: params.get("hardcore") === "1",
    sequential: params.get("sequential") === "1",
    permadeath: params.get("permadeath") === "1",
    // undefined (pas "0") si absent, pour ne pas être pris pour un "context: 0"
    // explicite lors du repli sur detectModeAndDifficulty (voir plus bas).
    context: params.has("context") ? Number(params.get("context")) : undefined,
  };

  // Renseigne le panneau Custom dans tous les cas : c'est lui qui sera utilisé
  // si aucun des niveaux nommés ne correspond (mode "custom" ou lien trop
  // ancien pour préciser mode/difficulty).
  quizTimeOptionBtns.forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.minutes) === settings.minutes);
  });
  quizOptTypesEl.checked = settings.types;
  quizOptGridEl.checked = settings.grid;
  quizOptHintsEl.checked = settings.hints;
  quizOptNextHintEl.checked = settings.nextHint;
  quizOptHardcoreEl.checked = settings.hardcore;
  quizOptSequentialEl.checked = settings.sequential;
  quizOptPermadeathEl.checked = settings.permadeath;

  // Depuis l'ajout des modes "Numéro"/"Suite", plusieurs niveaux nommés
  // partagent parfois exactement la même "forme" de réglages bruts (ex:
  // Classique/Difficile et Numéro/Normal) : le lien encode donc mode et
  // difficulté explicitement, lus en priorité. Repli sur la déduction par
  // réglages (detectModeAndDifficulty) uniquement pour les anciens liens
  // qui n'ont pas ces paramètres.
  const sharedMode = params.get("mode");
  const sharedDifficulty = params.get("difficulty");
  if (sharedMode === "custom") {
    applyMode("custom");
  } else if (sharedMode && GAME_MODES[sharedMode]?.difficulties[sharedDifficulty]) {
    applyMode(sharedMode);
    applyDifficulty(sharedDifficulty);
  } else {
    const detected = detectModeAndDifficulty(settings);
    if (detected) {
      applyMode(detected.mode);
      applyDifficulty(detected.difficulty);
    } else {
      applyMode("custom");
    }
  }
}

// Commandes de debug (à taper dans la console), namespacées sous `debug`.
window.debug = window.debug || {};

// debug.fillQuiz() : débloque instantanément tout le roster de la partie en
// cours sauf son premier Pokémon, pour tester la fin de partie (et
// l'obtention des succès) sans avoir à tout retaper à la main.
window.debug.fillQuiz = function () {
  if (quizPhase !== "playing") {
    console.warn("[debug.fillQuiz] Aucun quiz en cours.");
    return;
  }

  const roster = quizRoster();
  const stillUnfound = roster.filter((p) => !quizFound.has(p.id));
  // En mode séquentiel, impossible de "sauter" un Pokémon au milieu : seul
  // le tout dernier de l'ordre requis peut rester retenu — le dernier de
  // quizSeqOrder en mode "Suite" (qui part d'un point aléatoire et boucle),
  // sinon le plus grand numéro du roster en mode "Chronologique". Sinon
  // (Classique/Numéro/Custom libre), n'importe quel non-trouvé convient — le
  // premier disponible, qui peut différer de roster[0] si celui-ci est déjà
  // acquis (ex: Suite avec un contexte de départ non nul).
  const keepHidden = quizMode === "sequence"
    ? quizSeqOrder[quizSeqOrder.length - 1]?.id
    : (quizSequential ? stillUnfound[stillUnfound.length - 1] : stillUnfound[0])?.id;
  roster.forEach((p) => {
    if (p.id === keepHidden || quizFound.has(p.id)) return;
    quizFound.add(p.id);
    recordPokemonFound(p.id);
    quizFindLog.push({ id: p.id, elapsedMs: Date.now() - quizStartedAt });
    if (!quizShowGrid) addFoundChip(p);
  });

  // Mode "Numéro" : resynchronise la cible active sur le seul Pokémon
  // restant (elle pointait potentiellement vers un Pokémon qui vient
  // d'être ajouté directement à quizFound ci-dessus).
  if (quizMode === "number") pickNumberTarget();

  if (quizShowGrid) renderQuizPlaying();
  renderNextHint();
  renderQuizTarget();
  renderSeqStrip();
  updateQuizProgress();
  console.log(`[debug.fillQuiz] ${quizFound.size} / ${roster.length} débloqués (#${keepHidden} exclu).`);
};

// debug.shiny() : arme le tirage pour que le prochain Pokémon attrapé pour de
// vrai (via une réponse correcte en Quiz) soit garanti Shiny — passe par le
// flux normal (texte, vibration, toast). debug.shiny(id) : débloque
// directement le Shiny d'un Pokémon précis sans attendre de le retrouver, et
// affiche quand même la notification.
window.debug.shiny = function (id) {
  if (id === undefined) {
    debugForceNextShiny = true;
    console.log("[debug.shiny] Le prochain Pokémon attrapé sera Shiny.");
    return;
  }

  if (!POKEMON_BY_ID.has(id)) {
    console.warn(`[debug.shiny] Pokémon #${id} inconnu.`);
    return;
  }
  const alreadyUnlocked = unlockedShinies.has(id);
  unlockedShinies.add(id);
  saveShinies(unlockedShinies);
  if (quizPhase === "playing" && quizShowGrid) renderQuizPlaying();
  if (quizPhase === "recap") renderRecap();
  if (!shinydexOverlay.hidden) renderShinyDex();
  if (!alreadyUnlocked) {
    const pokemon = POKEMON_BY_ID.get(id);
    showToast({ icon: "✨", title: t("toast.shinyTitle"), message: pokemonName(pokemon), tone: "toast-shiny" });
  }
  console.log(`[debug.shiny] Shiny débloqué pour #${id}.`);
};

// debug.unlockAchievement(gen, key) : débloque directement un succès (clés
// valides : complete, under30, under15, under10, hardcore, easy, normal, hard).
window.debug.unlockAchievement = function (gen, key) {
  if (!ACHIEVEMENTS.some((a) => a.key === key)) {
    console.warn(`[debug.unlockAchievement] Clé inconnue : ${key}. Valides : ${ACHIEVEMENTS.map((a) => a.key).join(", ")}`);
    return;
  }
  const isNew = awardAchievement(gen, key);
  renderQuizAchvStrip();
  if (!achievementsOverlay.hidden) renderAchievementsModal();
  console.log(`[debug.unlockAchievement] Gen ${gen} / ${key} : ${isNew ? "débloqué" : "déjà obtenu"}.`);
};

// debug.gameOver() : simule une défaite façon mode "Un seul essai" (bannière
// 💀 sur le récap), sans avoir à activer le mode et taper une mauvaise
// réponse pour de vrai.
window.debug.gameOver = function () {
  if (quizPhase !== "playing") {
    console.warn("[debug.gameOver] Aucun quiz en cours.");
    return;
  }
  triggerGameOver();
  console.log(`[debug.gameOver] Partie terminée (${quizFound.size} / ${quizRoster().length} trouvés).`);
};

// debug.toast(tone) : affiche un toast d'exemple pour vérifier son rendu sans
// attendre un vrai Shiny/succès. `tone` : "shiny" | "achv" | tout le reste
// (générique).
window.debug.toast = function (tone) {
  const presets = {
    shiny: { icon: "✨", title: t("toast.shinyTitle"), message: "Pikachu", cssTone: "toast-shiny" },
    achv: { icon: "🏆", title: t("toast.achvTitle"), message: t("achv.complete"), cssTone: "toast-achv" },
  };
  const preset = presets[tone] || { icon: "🔔", title: "Debug", message: "Toast de test", cssTone: "" };
  showToast({ icon: preset.icon, title: preset.title, message: preset.message, tone: preset.cssTone });
  console.log(`[debug.toast] Toast "${tone || "générique"}" affiché.`);
};

// debug.resetAll() : équivalent de "Tout réinitialiser" dans les Réglages,
// sans la boîte de confirmation — pratique pour repartir d'un état propre
// pendant les tests.
window.debug.resetAll = function () {
  localStorage.clear();
  console.log("[debug.resetAll] localStorage vidé, rechargement...");
  location.reload();
};
