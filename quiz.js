// Couleurs officielles par type, pour les badges d'aide. Clés en anglais
// (langue-pivot stable) puisque le nom affiché dépend de la langue courante.
const TYPE_COLORS = {
  Normal: "#a8a878",
  Fire: "#f08030",
  Water: "#6890f0",
  Grass: "#78c850",
  Electric: "#f8d030",
  Ice: "#98d8d8",
  Fighting: "#c03028",
  Poison: "#a040a0",
  Ground: "#e0c068",
  Flying: "#a890f0",
  Psychic: "#f85888",
  Bug: "#a8b820",
  Rock: "#b8a038",
  Ghost: "#705898",
  Dragon: "#7038f8",
  Steel: "#b8b8d0",
  Fairy: "#ee99ac",
};
const TYPE_DARK_TEXT = new Set(["Electric", "Ground", "Ice", "Steel", "Fairy", "Normal"]);

const quizSetupEl = document.getElementById("quiz-setup");
const quizPlayingEl = document.getElementById("quiz-playing");
const quizRecapEl = document.getElementById("quiz-recap");

const quizTimeOptionBtns = document.querySelectorAll("#quiz-time-options .settings-option");
const quizOptTypesEl = document.getElementById("quiz-opt-types");
const quizOptGridEl = document.getElementById("quiz-opt-grid");
const quizOptHintsEl = document.getElementById("quiz-opt-hints");
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
const quizRecapStatsEl = document.getElementById("quiz-recap-stats");
const quizRecapListEl = document.getElementById("quiz-recap-list");
const quizReplayBtn = document.getElementById("quiz-replay-btn");
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
let quizMinutesUsed = 0;
let quizStartedAt = null;
let quizElapsedMs = 0;
let quizEndedByTimeout = false;
let quizTimerHandle = null;
let justFoundId = null;
let quizFindLog = []; // [{ id, elapsedMs }] dans l'ordre des trouvailles
let quizWrongGuessCount = 0;

function updateQuizProgress() {
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  quizProgressFillEl.style.width = `${(count / total) * 100}%`;
  quizProgressTextEl.textContent = t("quiz.progress", { count, total });
}

// Validation stricte : contrairement à la recherche du mode Liste, une simple
// saisie partielle (ex: "psi") ne doit pas suffire à trouver "Psykokwak" — il
// faut écrire (à peu de fautes de frappe près) le nom complet.
function isCorrectGuess(rawGuess, pokemon) {
  const guess = normalize(rawGuess);
  if (!guess) return false;
  const normalizedName = pokemonNormalizedName(pokemon);
  if (guess === normalizedName) return true;

  const threshold = Math.max(1, Math.floor(normalizedName.length * 0.25));
  return levenshtein(guess, normalizedName) <= threshold;
}

function showQuizFeedback(message, tone) {
  quizFeedbackEl.textContent = message;
  quizFeedbackEl.className = "quiz-feedback";
  if (tone) quizFeedbackEl.classList.add(tone);
}

function typeBadgesHtml(pokemon) {
  if (!quizShowTypes) return "";
  // Couleur/contraste basés sur le type anglais (stable), libellé dans la
  // langue courante : les deux tableaux sont alignés par index.
  const displayTypes = pokemonTypes(pokemon);
  const badges = pokemon.types.en
    .map((enType, i) => {
      const color = TYPE_COLORS[enType] || "#888";
      const textClass = TYPE_DARK_TEXT.has(enType) ? "type-badge-dark" : "";
      return `<span class="type-badge ${textClass}" style="background:${color}">${displayTypes[i]}</span>`;
    })
    .join("");
  return `<div class="type-badges">${badges}</div>`;
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

function renderQuizPlaying() {
  quizListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const pokemon of POKEMON_GEN1) {
    const isFound = quizFound.has(pokemon.id);
    const name = pokemonName(pokemon);

    const li = document.createElement("li");
    li.className = "pokemon-card quiz-card";
    if (isFound) li.classList.add("caught");
    if (pokemon.id === justFoundId) li.classList.add("just-found");

    li.innerHTML = `
      <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
      <img
        class="pokemon-sprite quiz-sprite"
        src="${getSpriteUrl(pokemon.id)}"
        alt="${isFound ? name : t("quiz.altHidden")}"
        loading="lazy"
      />
      <div class="quiz-info">
        <span class="pokemon-name quiz-name" ${isFound ? `title="${name}"` : ""}>${
          isFound ? name : hintedPlaceholder(pokemon)
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
  const name = pokemonName(pokemon);
  const chip = document.createElement("span");
  chip.className = "found-chip";
  chip.innerHTML = `
    <img class="found-chip-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${name}" loading="lazy" />
    <span>${formatNumber(pokemon.id)} ${name}</span>
  `;
  quizFoundChipsEl.appendChild(chip);
}

function renderRecap() {
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  quizRecapStatEl.textContent = `${percent}%`;
  quizRecapTextEl.textContent = t("quiz.recapCount", { count, total });

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

  for (const pokemon of POKEMON_GEN1) {
    const isFound = quizFound.has(pokemon.id);
    const name = pokemonName(pokemon);

    const li = document.createElement("li");
    li.className = `pokemon-card recap-card ${isFound ? "caught" : "missing"}`;

    li.innerHTML = `
      <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
      <img class="pokemon-sprite" src="${getSpriteUrl(pokemon.id)}" alt="${name}" loading="lazy" />
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
  const minutes = selectedMinutes();
  quizMinutesUsed = minutes;
  quizStartedAt = Date.now();
  quizEndedByTimeout = false;
  quizDeadline = minutes > 0 ? quizStartedAt + minutes * 60000 : null;
  quizShowTypes = quizOptTypesEl.checked;
  quizShowGrid = quizOptGridEl.checked;
  quizShowHints = quizOptHintsEl.checked;
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

// Les aides "types" et "indice" n'ont de sens que si la grille (qui les
// affiche) est elle-même activée.
function syncGridDependentOptions() {
  const gridOn = quizOptGridEl.checked;
  [quizOptTypesEl, quizOptHintsEl].forEach((el) => {
    el.disabled = !gridOn;
    if (!gridOn) el.checked = false;
  });
}

quizOptGridEl.addEventListener("change", syncGridDependentOptions);
syncGridDependentOptions();

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

function vibrate(pattern) {
  navigator.vibrate?.(pattern);
}

quizFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (quizPhase !== "playing") return;

  const guess = quizInputEl.value.trim();
  if (!guess) return;

  const match = POKEMON_GEN1.find((p) => !quizFound.has(p.id) && isCorrectGuess(guess, p));

  if (match) {
    quizFound.add(match.id);
    quizFindLog.push({ id: match.id, elapsedMs: Date.now() - quizStartedAt });
    justFoundId = match.id;
    if (quizShowGrid) {
      renderQuizPlaying();
    } else {
      addFoundChip(match);
    }
    updateQuizProgress();
    quizInputEl.value = "";
    showQuizFeedback(t("quiz.feedbackCorrect", { name: pokemonName(match) }), "success");
    vibrate(25);

    if (quizFound.size === POKEMON_GEN1.length) {
      quizEndedByTimeout = false;
      vibrate([60, 40, 60, 40, 120]);
      endQuiz();
      celebrateConfetti();
      return;
    }
  } else {
    const alreadyFound = POKEMON_GEN1.find((p) => quizFound.has(p.id) && isCorrectGuess(guess, p));
    if (alreadyFound) {
      showQuizFeedback(t("quiz.feedbackAlreadyFound", { name: pokemonName(alreadyFound) }), null);
    } else {
      quizWrongGuessCount += 1;
      showQuizFeedback(t("quiz.feedbackWrong"), "error");
      vibrate([30, 30, 30]);
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
  params.set("hints", quizShowHints ? "1" : "0");

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
function buildResultCardBlob({ percent, count, total, minutesLabel, phrase }) {
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
  ctx.fillText(t("card.title"), centerX, pad + 70);

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
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  // Le temps affiché reflète la performance réelle, sauf si la partie s'est
  // arrêtée simplement parce que le temps imparti était écoulé (auquel cas
  // c'est juste la durée configurée).
  const minutesLabel = quizEndedByTimeout ? String(quizMinutesUsed) : elapsedMinutesLabel(quizElapsedMs);
  return { total, count, percent, minutesLabel, phrase: scorePhraseFor(percent) };
}

// Partage uniquement le texte (avec le lien) : c'est la voie la plus fiable,
// certaines cibles de partage natif ignorent le texte dès qu'une image est
// jointe, ce qui faisait auparavant disparaître le lien.
quizShareBtn.addEventListener("click", async () => {
  const { count, percent, minutesLabel, phrase } = currentQuizSummary();
  const url = buildQuizShareUrl();

  const text = [
    phrase,
    t("share.line2", { count, percent }),
    t("share.line3", { minutes: minutesLabel }),
    t("share.line4", { url }),
  ].join("\n");

  if (navigator.share) {
    try {
      await navigator.share({ title: t("share.title"), text });
      return;
    } catch {
      // Partage annulé : on retente une copie presse-papiers ci-dessous.
    }
  }

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
  const { total, count, percent, minutesLabel, phrase } = currentQuizSummary();

  const originalLabel = quizDownloadBtn.textContent;
  quizDownloadBtn.disabled = true;
  quizDownloadBtn.textContent = t("quiz.generating");

  try {
    const blob = await buildResultCardBlob({ percent, count, total, minutesLabel, phrase });
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
  const minutes = params.get("minutes");
  quizTimeOptionBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.minutes === minutes);
  });
  quizOptTypesEl.checked = params.get("types") === "1";
  quizOptGridEl.checked = params.get("grid") === "1";
  quizOptHintsEl.checked = params.get("hints") === "1";
}

// Commandes de debug (à taper dans la console), namespacées sous `debug`.
window.debug = window.debug || {};

// debug.fillQuiz() : débloque instantanément tous les Pokémon sauf Bulbizarre
// (#1), pour tester la fin de partie sans avoir à tout retaper à la main.
// Sans effet hors d'une partie en cours.
window.debug.fillQuiz = function () {
  if (quizPhase !== "playing") {
    console.warn("[debug.fillQuiz] Aucun quiz en cours.");
    return;
  }

  POKEMON_GEN1.forEach((p) => {
    if (p.id === 1 || quizFound.has(p.id)) return;
    quizFound.add(p.id);
    quizFindLog.push({ id: p.id, elapsedMs: Date.now() - quizStartedAt });
  });

  if (quizShowGrid) renderQuizPlaying();
  updateQuizProgress();
  console.log(`[debug.fillQuiz] ${quizFound.size} / ${POKEMON_GEN1.length} débloqués (Bulbizarre exclu).`);
};
