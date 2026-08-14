const SETTINGS_KEY = "pokelist-settings";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SUPPORTED_LANGUAGES = ["fr", "en", "es", "de"];

// Langue du navigateur si elle est supportée, sinon anglais par défaut.
function detectDefaultLanguage() {
  const browserLang = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "en";
}

const DEFAULT_SETTINGS = {
  language: detectDefaultLanguage(), // fr | en | es
  theme: "auto", // auto | light | dark
  cardSize: "medium", // small | medium | large
  animated: true,
  sttAutoSubmit: false,
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

let settings = loadSettings();

function spriteUrlFor(id, shiny) {
  if (settings.animated) {
    return shiny
      ? `${SPRITE_BASE}/versions/generation-v/black-white/animated/shiny/${id}.gif`
      : `${SPRITE_BASE}/versions/generation-v/black-white/animated/${id}.gif`;
  }
  return shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`;
}

// Choisit l'URL du sprite selon les réglages courants (animé) ; un Pokémon
// dont le Shiny a été débloqué (voir shiny.js) s'affiche en Shiny, seul
// moyen d'obtenir la variante depuis que le réglage global a été retiré.
function getSpriteUrl(id) {
  return spriteUrlFor(id, isShinyUnlocked(id));
}

// Toujours la variante Shiny, peu importe si elle a été débloquée : utilisé
// par le Shiny Dex pour prévisualiser (en grisé) les Shiny pas encore obtenus.
function getShinySpriteUrl(id) {
  return spriteUrlFor(id, true);
}

function applyTheme() {
  if (settings.theme === "auto") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = settings.theme;
  }
}

function applyCardSize() {
  document.body.dataset.cardSize = settings.cardSize;
}

applyTheme();
applyCardSize();
applyTranslations();

const languageSelect = document.getElementById("language-select");
languageSelect.value = settings.language;

const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsCloseBtn = document.getElementById("settings-close");
// Scopé au panneau de réglages : le Quiz a ses propres boutons ".settings-option"
// (choix du temps) qui ne doivent pas être pilotés par cette logique.
const settingsOptionBtns = document.querySelectorAll("#settings-overlay .settings-option");
const animatedToggle = document.getElementById("setting-animated");
const sttAutoSubmitToggle = document.getElementById("setting-stt-autosubmit");

function refreshSpriteDependentViews() {
  renderList();
  if (quizPhase === "playing") {
    if (quizShowGrid) renderQuizPlaying();
    else renderQuizFoundChips();
  }
  if (quizPhase === "recap") renderRecap();
  if (!shinydexOverlay.hidden) renderShinyDex();
}

// Les noms/types des Pokémon et tout le texte de l'interface changent avec
// la langue : on retraduit le DOM statique et on redessine les vues dynamiques.
function refreshLanguageDependentViews() {
  applyTranslations();
  renderList();
  updateProgress();
  if (quizPhase === "playing") {
    if (quizShowGrid) renderQuizPlaying();
    renderNextHint();
    renderQuizTarget();
    renderSeqStrip();
    updateQuizProgress();
  }
  if (quizPhase === "recap") renderRecap();
  if (!achievementsOverlay.hidden) renderAchievementsModal();
  if (!shinydexOverlay.hidden) renderShinyDex();
  renderQuizAchvStrip();
}

function updateSettingsUI() {
  settingsOptionBtns.forEach((btn) => {
    btn.classList.toggle("active", settings[btn.dataset.setting] === btn.dataset.value);
  });
  animatedToggle.checked = settings.animated;
  sttAutoSubmitToggle.checked = settings.sttAutoSubmit;
}

function openSettings() {
  updateSettingsUI();
  settingsOverlay.hidden = false;
}

function closeSettings() {
  settingsOverlay.hidden = true;
}

settingsBtn.addEventListener("click", openSettings);
settingsCloseBtn.addEventListener("click", closeSettings);

settingsOverlay.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) closeSettings();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !settingsOverlay.hidden) closeSettings();
});

settingsOptionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    settings[btn.dataset.setting] = btn.dataset.value;
    saveSettings();
    updateSettingsUI();
    if (btn.dataset.setting === "theme") applyTheme();
    if (btn.dataset.setting === "cardSize") applyCardSize();
  });
});

languageSelect.addEventListener("change", () => {
  settings.language = languageSelect.value;
  saveSettings();
  refreshLanguageDependentViews();
});

animatedToggle.addEventListener("change", () => {
  settings.animated = animatedToggle.checked;
  saveSettings();
  refreshSpriteDependentViews();
});

sttAutoSubmitToggle.addEventListener("change", () => {
  settings.sttAutoSubmit = sttAutoSubmitToggle.checked;
  saveSettings();
});

// Efface tout le stockage local de l'app (progression, réglages, succès,
// Shiny débloqués) et recharge la page pour repartir d'un état neuf.
document.getElementById("settings-reset-all").addEventListener("click", () => {
  if (!confirm(t("settings.resetAllConfirm"))) return;
  localStorage.clear();
  location.reload();
});
