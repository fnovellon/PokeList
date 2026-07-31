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
let quizShowHints = false;
let quizMinutesUsed = 0;
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

// Affiche la première lettre du nom si l'aide est activée (jamais le nom
// entier, même pour les Pokémon les plus courts comme Mew ou Abo).
function hintedPlaceholder(pokemon) {
  if (!quizShowHints) return "?????";
  const revealed = pokemon.name.slice(0, 1);
  const hidden = "?".repeat(Math.max(1, pokemon.name.length - 1));
  return `<span class="hint-revealed">${revealed}</span>${hidden}`;
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
          isFound ? pokemon.name : hintedPlaceholder(pokemon)
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
    justFoundId = match.id;
    if (quizShowGrid) {
      renderQuizPlaying();
    } else {
      addFoundChip(match);
    }
    updateQuizProgress();
    quizInputEl.value = "";
    showQuizFeedback(`Bravo, c'était ${match.name} !`, "success");
    vibrate(25);

    if (quizFound.size === POKEMON_GEN1.length) {
      quizEndedByTimeout = false;
      vibrate([60, 40, 60, 40, 120]);
      endQuiz();
      return;
    }
  } else {
    const alreadyFound = POKEMON_GEN1.find((p) => quizFound.has(p.id) && isCorrectGuess(guess, p));
    if (alreadyFound) {
      showQuizFeedback(`${alreadyFound.name} a déjà été trouvé.`, null);
    } else {
      showQuizFeedback("Aucun Pokémon ne correspond, réessaie.", "error");
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
  if (percent === 100) return "🏆 151/151 : le Prof. Chen peut fermer le labo, j'ai tout vu !";
  if (percent >= 90) return "🔥 Quasi Maître Pokémon, il ne me manque presque rien !";
  if (percent >= 75) return "😎 Un sacré Dresseur, Team Rocket ferait mieux de fuir.";
  if (percent >= 50) return "🎯 Pas mal, mais la Ligue Pokémon peut encore attendre.";
  if (percent >= 25) return "🐢 Un Ramoloss aurait fait presque aussi bien que moi...";
  if (percent > 0) return "🙈 Le Prof. Chen me regarde avec déception.";
  return "🥚 Même un Œuf s'en serait mieux sorti.";
}

function elapsedMinutesLabel(ms) {
  const minutes = Math.round(ms / 60000);
  return minutes < 1 ? "< 1" : String(minutes);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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

// Génère une image "carte de résultat" (façon aperçu de partage social),
// avec quelques sprites des Pokémon trouvés en bas si le chargement réussit.
async function buildResultCardBlob({ percent, count, total, minutesLabel, phrase }) {
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
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#1c1f2a";
  ctx.font = "700 30px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("🎮 PokéList — Quiz Génération 1", centerX, pad + 58);

  ctx.fillStyle = "#3b6ce0";
  ctx.font = "800 148px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${percent}%`, centerX, pad + 230);

  ctx.fillStyle = "#676c7c";
  ctx.font = "600 32px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${count} / ${total} Pokémon trouvés`, centerX, pad + 278);

  ctx.fillStyle = "#3b6ce0";
  ctx.font = "700 28px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`⏱️ En seulement ${minutesLabel} min`, centerX, pad + 322);

  ctx.fillStyle = "#1c1f2a";
  ctx.font = "500 26px 'Segoe UI', Arial, sans-serif";
  wrapCenteredText(ctx, phrase, centerX, pad + 372, width - pad * 2 - 100, 34);

  const foundIds = [...quizFound].sort((a, b) => a - b);
  if (foundIds.length > 0) {
    const n = Math.min(8, foundIds.length);
    const picks = [...new Set(Array.from({ length: n }, (_, i) => foundIds[Math.floor((i / n) * foundIds.length)]))];

    try {
      const images = await Promise.all(picks.map((id) => loadImage(getSpriteUrl(id))));
      const spriteSize = 64;
      const gap = 18;
      const rowWidth = images.length * spriteSize + (images.length - 1) * gap;
      let sx = centerX - rowWidth / 2;
      const sy = height - pad - spriteSize - 26;

      images.forEach((img) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx + spriteSize / 2, sy + spriteSize / 2, spriteSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "#f4f6fb";
        ctx.fill();
        ctx.clip();
        ctx.drawImage(img, sx, sy, spriteSize, spriteSize);
        ctx.restore();
        sx += spriteSize + gap;
      });
    } catch {
      // Le chargement d'un sprite a échoué (ex: hors-ligne) : on partage la
      // carte sans la bande d'images plutôt que d'échouer tout le partage.
    }
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

quizShareBtn.addEventListener("click", async () => {
  const total = POKEMON_GEN1.length;
  const count = quizFound.size;
  const percent = Math.round((count / total) * 100);
  // Le temps affiché reflète la performance réelle, sauf si la partie s'est
  // arrêtée simplement parce que le temps imparti était écoulé (auquel cas
  // c'est juste la durée configurée).
  const minutesLabel = quizEndedByTimeout
    ? String(quizMinutesUsed)
    : elapsedMinutesLabel(quizElapsedMs);
  const phrase = scorePhraseFor(percent);
  const url = buildQuizShareUrl();

  const text = [
    phrase,
    `${count}/151 Pokémon de Gen1 (${percent}%)`,
    `En seulement ${minutesLabel} min`,
    `Tente de me battre sur ${url}`,
  ].join("\n");

  const originalLabel = quizShareBtn.textContent;
  quizShareBtn.disabled = true;
  quizShareBtn.textContent = "⏳ Génération...";

  try {
    const blob = await buildResultCardBlob({ percent, count, total, minutesLabel, phrase });
    const file = blob && new File([blob], "pokelist-quiz.png", { type: "image/png" });

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: "PokéList - Quiz Génération 1", text, files: [file] });
        return;
      } catch {
        // Partage (avec image) annulé : on retente sans image ci-dessous.
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "PokéList - Quiz Génération 1", text });
        return;
      } catch {
        // Partage annulé par l'utilisateur : rien à faire.
        return;
      }
    }

    await navigator.clipboard.writeText(text);
    showShareFeedback("Message copié dans le presse-papiers !");
  } catch {
    showShareFeedback("Impossible de partager le résultat.");
  } finally {
    quizShareBtn.disabled = false;
    quizShareBtn.textContent = originalLabel;
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
