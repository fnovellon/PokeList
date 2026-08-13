// Succès : 11 par génération, obtenus en terminant le Quiz de différentes
// façons (au moins une fois, sous un certain temps, en Hardcore, avec tel
// niveau de difficulté, en mode Chronologique, ou en Un seul essai).
// Persisté comme les Shiny (contrairement au reste du Quiz), peu importe
// combien de fois on rejoue.
const ACHIEVEMENTS_KEY = "pokelist-achievements";

const ACHIEVEMENTS = [
  { key: "complete", icon: "🏆" },
  { key: "under30", icon: "⏱️" },
  { key: "under15", icon: "⚡" },
  { key: "under10", icon: "🔥" },
  { key: "hardcore", icon: "🎯" },
  { key: "easy", icon: "😌" },
  { key: "normal", icon: "🙂" },
  { key: "hard", icon: "😰" },
  { key: "veryHard", icon: "💀" },
  { key: "ordered", icon: "🔢" },
  { key: "permadeath", icon: "☠️" },
];

function loadAchievements() {
  try {
    return new Set(JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveAchievements(achvSet) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...achvSet]));
}

let earnedAchievements = loadAchievements();

function achvId(gen, key) {
  return `${gen}:${key}`;
}

function hasAchievement(gen, key) {
  return earnedAchievements.has(achvId(gen, key));
}

function awardAchievement(gen, key) {
  const id = achvId(gen, key);
  if (earnedAchievements.has(id)) return false;
  earnedAchievements.add(id);
  saveAchievements(earnedAchievements);
  return true;
}

// Évalue tous les succès applicables à une partie qui vient d'être terminée
// à 100% ; retourne la liste des clés nouvellement débloquées (peut être
// vide si tout était déjà en poche).
function checkAchievements(gen, { elapsedMs, hardcore, preset, mode, permadeath }) {
  const newly = [];
  const tryAward = (key) => {
    if (awardAchievement(gen, key)) newly.push(key);
  };

  tryAward("complete");
  if (elapsedMs < 30 * 60000) tryAward("under30");
  if (elapsedMs < 15 * 60000) tryAward("under15");
  if (elapsedMs < 10 * 60000) tryAward("under10");
  if (hardcore) tryAward("hardcore");
  if (preset === "easy") tryAward("easy");
  if (preset === "normal") tryAward("normal");
  if (preset === "hard") tryAward("hard");
  if (preset === "veryHard") tryAward("veryHard");
  if (mode === "ordered") tryAward("ordered");
  if (permadeath) tryAward("permadeath");

  return newly;
}

const achievementsBtn = document.getElementById("achievements-btn");
const achievementsOverlay = document.getElementById("achievements-overlay");
const achievementsCloseBtn = document.getElementById("achievements-close");
const achievementsListEl = document.getElementById("achievements-list");
const achvGenTabBtns = document.querySelectorAll("#achv-gen-tabs .gen-tab");
const quizAchvStripEl = document.getElementById("quiz-achv-strip");

let achvModalGen = 1;

function renderAchievementsModal() {
  achievementsListEl.innerHTML = ACHIEVEMENTS.map((a) => {
    const earned = hasAchievement(achvModalGen, a.key);
    return `
      <div class="achv-tile ${earned ? "achv-earned" : "achv-locked"}">
        <span class="achv-tile-icon">${a.icon}</span>
        <span class="achv-tile-label">${t(`achv.${a.key}`)}</span>
      </div>
    `;
  }).join("");
}

function openAchievements(gen) {
  achvModalGen = gen || achvModalGen;
  achvGenTabBtns.forEach((btn) => btn.classList.toggle("active", Number(btn.dataset.gen) === achvModalGen));
  renderAchievementsModal();
  achievementsOverlay.hidden = false;
}

function closeAchievements() {
  achievementsOverlay.hidden = true;
}

achievementsBtn.addEventListener("click", () => openAchievements());
achievementsCloseBtn.addEventListener("click", closeAchievements);
achievementsOverlay.addEventListener("click", (event) => {
  if (event.target === achievementsOverlay) closeAchievements();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !achievementsOverlay.hidden) closeAchievements();
});

achvGenTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    achvModalGen = Number(btn.dataset.gen);
    achvGenTabBtns.forEach((b) => b.classList.toggle("active", b === btn));
    renderAchievementsModal();
  });
});

// Bandeau compact affiché en haut de l'écran d'accueil (= config du Quiz) :
// une tuile par génération avec le nombre de succès obtenus, cliquable pour
// ouvrir la modale sur cette génération.
function renderQuizAchvStrip() {
  quizAchvStripEl.innerHTML = GENERATIONS.map((gen) => {
    const earnedCount = ACHIEVEMENTS.filter((a) => hasAchievement(gen, a.key)).length;
    const state = earnedCount === 0 ? "achv-locked" : earnedCount === ACHIEVEMENTS.length ? "achv-complete" : "achv-partial";
    return `
      <button class="quiz-achv-strip-tile ${state}" data-gen="${gen}" title="${t(`gen.label${gen}`)}">
        <span class="quiz-achv-strip-gen">${t(`gen.label${gen}`)}</span>
        <span class="quiz-achv-strip-icon">🏆</span>
        <span class="quiz-achv-strip-count">${earnedCount}/${ACHIEVEMENTS.length}</span>
      </button>
    `;
  }).join("");

  quizAchvStripEl.querySelectorAll(".quiz-achv-strip-tile").forEach((btn) => {
    btn.addEventListener("click", () => openAchievements(Number(btn.dataset.gen)));
  });
}

renderQuizAchvStrip();
