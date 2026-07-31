// Couleurs officielles par type, pour les badges d'aide.
const TYPE_COLORS = {
  Normal: "#a8a878",
  Feu: "#f08030",
  Eau: "#6890f0",
  Plante: "#78c850",
  Électrik: "#f8d030",
  Glace: "#98d8d8",
  Combat: "#c03028",
  Poison: "#a040a0",
  Sol: "#e0c068",
  Vol: "#a890f0",
  Psy: "#f85888",
  Insecte: "#a8b820",
  Roche: "#b8a038",
  Spectre: "#705898",
  Dragon: "#7038f8",
  Acier: "#b8b8d0",
  Fée: "#ee99ac",
};
const TYPE_DARK_TEXT = new Set(["Électrik", "Sol", "Glace", "Acier", "Fée", "Normal"]);

const quizSetupEl = document.getElementById("quiz-setup");
const quizPlayingEl = document.getElementById("quiz-playing");
const quizRecapEl = document.getElementById("quiz-recap");

const quizTimeOptionBtns = document.querySelectorAll("#quiz-time-options .settings-option");
const quizOptTypesEl = document.getElementById("quiz-opt-types");
const quizOptGridEl = document.getElementById("quiz-opt-grid");
const quizStartBtn = document.getElementById("quiz-start-btn");

const quizListEl = document.getElementById("quiz-list");
const quizFoundChipsEl = document.getElementById("quiz-found-chips");
const quizFormEl = document.getElementById("quiz-form");
const quizInputEl = document.getElementById("quiz-input");
const quizEndBtn = document.getElementById("quiz-end-btn");
const quizProgressFillEl = document.getElementById("quiz-progress-fill");
const quizProgressTextEl = document.getElementById("quiz-progress-text");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const quizTimerEl = document.getElementById("quiz-timer");

const quizRecapStatEl = document.getElementById("quiz-recap-stat");
const quizRecapTextEl = document.getElementById("quiz-recap-text");
const quizRecapTimeEl = document.getElementById("quiz-recap-time");
const quizRecapListEl = document.getElementById("quiz-recap-list");
const quizReplayBtn = document.getElementById("quiz-replay-btn");
const quizHomeBtn = document.getElementById("quiz-home-btn");
const quizShareBtn = document.getElementById("quiz-share-btn");
const quizShareFeedbackEl = document.getElementById("quiz-share-feedback");

// Rien n'est persisté pour le Quiz : tout vit en mémoire le temps de la partie.
let quizPhase = "setup"; // "setup" | "playing" | "recap"
let quizFound = new Set();
let quizDeadline = null; // timestamp ms, ou null si infini
let quizShowTypes = false;
let quizShowGrid = true;
let quizMinutesUsed = 15;
let quizStartedAt = null;
let quizElapsedMs = 0;
let quizEndedByTimeout = false;
let quizTimerHandle = null;
let justFoundId = null;

function updateQuizProgress() {
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  quizProgressFillEl.style.width = `${(count / total) * 100}%`;
  quizProgressTextEl.textContent = `${count} / ${total} trouvés`;
}

// Validation stricte : contrairement à la recherche du mode Liste, une simple
// saisie partielle (ex: "psi") ne doit pas suffire à trouver "Psykokwak" — il
// faut écrire (à peu de fautes de frappe près) le nom complet.
function isCorrectGuess(rawGuess, pokemon) {
  const guess = normalize(rawGuess);
  if (!guess) return false;
  if (guess === pokemon.normalizedName) return true;

  const threshold = Math.max(1, Math.floor(pokemon.normalizedName.length * 0.25));
  return levenshtein(guess, pokemon.normalizedName) <= threshold;
}

function showQuizFeedback(message, tone) {
  quizFeedbackEl.textContent = message;
  quizFeedbackEl.className = "quiz-feedback";
  if (tone) quizFeedbackEl.classList.add(tone);
}

function typeBadgesHtml(pokemon) {
  if (!quizShowTypes) return "";
  const badges = pokemon.types
    .map((type) => {
      const color = TYPE_COLORS[type] || "#888";
      const textClass = TYPE_DARK_TEXT.has(type) ? "type-badge-dark" : "";
      return `<span class="type-badge ${textClass}" style="background:${color}">${type}</span>`;
    })
    .join("");
  return `<div class="type-badges">${badges}</div>`;
}

function renderQuizPlaying() {
  quizListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const pokemon of POKEMON_GEN1) {
    const isFound = quizFound.has(pokemon.id);

    const li = document.createElement("li");
    li.className = "pokemon-card quiz-card";
    if (isFound) li.classList.add("caught");
    if (pokemon.id === justFoundId) li.classList.add("just-found");

    li.innerHTML = `
      <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
      <img
        class="pokemon-sprite quiz-sprite"
        src="${getSpriteUrl(pokemon.id)}"
        alt="${isFound ? pokemon.name : "Pokémon non découvert"}"
        loading="lazy"
      />
      <div class="quiz-info">
        <span class="pokemon-name quiz-name" ${isFound ? `title="${pokemon.name}"` : ""}>${
          isFound ? pokemon.name : "?????"
        }</span>
        ${typeBadgesHtml(pokemon)}
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

function addFoundChip(pokemon) {
  const chip = document.createElement("span");
  chip.className = "found-chip";
  chip.innerHTML = `
    <img class="found-chip-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${pokemon.name}" loading="lazy" />
    <span>${formatNumber(pokemon.id)} ${pokemon.name}</span>
  `;
  quizFoundChipsEl.appendChild(chip);
}

function renderRecap() {
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  quizRecapStatEl.textContent = `${percent}%`;
  quizRecapTextEl.textContent = `${count} / ${total} Pokémon trouvés`;

  // Le temps n'est un résultat intéressant que si la partie ne s'est pas
  // arrêtée simplement parce que le temps imparti était écoulé.
  if (quizEndedByTimeout) {
    quizRecapTimeEl.hidden = true;
  } else {
    quizRecapTimeEl.hidden = false;
    quizRecapTimeEl.textContent = `⏱️ Temps : ${formatElapsed(quizElapsedMs)}`;
  }

  quizRecapListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const pokemon of POKEMON_GEN1) {
    const isFound = quizFound.has(pokemon.id);

    const li = document.createElement("li");
    li.className = `pokemon-card recap-card ${isFound ? "caught" : "missing"}`;

    li.innerHTML = `
      <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
      <img class="pokemon-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${pokemon.name}" loading="lazy" />
      <span class="pokemon-name">${pokemon.name}</span>
    `;

    fragment.appendChild(li);
  }

  quizRecapListEl.appendChild(fragment);
}

function selectedMinutes() {
  const active = document.querySelector("#quiz-time-options .settings-option.active");
  return Number(active?.dataset.minutes ?? 15);
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
  const minutes = selectedMinutes();
  quizMinutesUsed = minutes;
  quizStartedAt = Date.now();
  quizEndedByTimeout = false;
  quizDeadline = minutes > 0 ? quizStartedAt + minutes * 60000 : null;
  quizShowTypes = quizOptTypesEl.checked;
  quizShowGrid = quizOptGridEl.checked;
  quizPhase = "playing";

  quizSetupEl.hidden = true;
  quizRecapEl.hidden = true;
  quizPlayingEl.hidden = false;
  quizListEl.style.display = quizShowGrid ? "" : "none";
  quizFoundChipsEl.style.display = quizShowGrid ? "none" : "";
  quizFoundChipsEl.innerHTML = "";

  showQuizFeedback("", null);
  quizInputEl.value = "";
  if (quizShowGrid) renderQuizPlaying();
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
  quizPlayingEl.hidden = true;
  quizRecapEl.hidden = false;
  renderRecap();
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

// L'aide "types" n'a de sens que si la grille (qui affiche les badges) est
// elle-même activée.
function syncTypesAvailability() {
  const gridOn = quizOptGridEl.checked;
  quizOptTypesEl.disabled = !gridOn;
  if (!gridOn) quizOptTypesEl.checked = false;
}

quizOptGridEl.addEventListener("change", syncTypesAvailability);
syncTypesAvailability();

quizStartBtn.addEventListener("click", startQuiz);
quizEndBtn.addEventListener("click", () => {
  quizEndedByTimeout = false;
  endQuiz();
});
quizReplayBtn.addEventListener("click", backToSetup);
quizHomeBtn.addEventListener("click", () => {
  backToSetup();
  goToMode("home");
});

quizFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (quizPhase !== "playing") return;

  const guess = quizInputEl.value.trim();
  if (!guess) return;

  const match = POKEMON_GEN1.find((p) => !quizFound.has(p.id) && isCorrectGuess(guess, p));

  if (match) {
    quizFound.add(match.id);
    justFoundId = match.id;
    if (quizShowGrid) {
      renderQuizPlaying();
    } else {
      addFoundChip(match);
    }
    updateQuizProgress();
    quizInputEl.value = "";
    showQuizFeedback(`Bravo, c'était ${match.name} !`, "success");

    if (quizFound.size === POKEMON_GEN1.length) {
      quizEndedByTimeout = false;
      endQuiz();
      return;
    }
  } else {
    const alreadyFound = POKEMON_GEN1.find((p) => quizFound.has(p.id) && isCorrectGuess(guess, p));
    if (alreadyFound) {
      showQuizFeedback(`${alreadyFound.name} a déjà été trouvé.`, null);
    } else {
      showQuizFeedback("Aucun Pokémon ne correspond, réessaie.", "error");
    }
  }

  quizInputEl.focus();
});

// Construit un lien qui reproduit exactement la configuration de cette partie
// (temps imparti, aides), pour que la personne qui l'ouvre parte sur un pied
// d'égalité.
function buildQuizShareUrl() {
  const params = new URLSearchParams();
  params.set("minutes", String(quizMinutesUsed));
  params.set("types", quizShowTypes ? "1" : "0");
  params.set("grid", quizShowGrid ? "1" : "0");

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

quizShareBtn.addEventListener("click", async () => {
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  // Le temps écoulé n'est intéressant à partager que si la partie ne s'est pas
  // arrêtée simplement parce que le temps imparti était écoulé.
  const timeLabel = quizEndedByTimeout
    ? `en ${quizMinutesUsed} min`
    : `en ${formatElapsed(quizElapsedMs)}`;
  const text = `J'ai trouvé ${percent}% des 151 Pokémon Génération 1 (${count}/${total}) ${timeLabel} sur PokéList ! Bats mon score :`;
  const url = buildQuizShareUrl();

  if (navigator.share) {
    try {
      await navigator.share({ title: "PokéList - Quiz Génération 1", text, url });
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    showShareFeedback("Lien copié dans le presse-papiers !");
  } catch {
    showShareFeedback("Impossible de copier le lien.");
  }
});

// Reprend les réglages (temps, aides) d'une partie partagée via l'URL ; appelée
// depuis app.js une fois la navigation entre modes disponible.
function applySharedQuizSettings(params) {
  const minutes = params.get("minutes");
  quizTimeOptionBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.minutes === minutes);
  });
  quizOptTypesEl.checked = params.get("types") === "1";
  quizOptGridEl.checked = params.get("grid") === "1";
}
