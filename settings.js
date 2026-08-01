const SETTINGS_KEY = "pokelist-settings";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SUPPORTED_LANGUAGES = ["fr", "en", "es"];

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
  shiny: false,
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

// Choisit l'URL du sprite selon les réglages courants (animé et/ou shiny).
function getSpriteUrl(id) {
  if (settings.animated) {
    return settings.shiny
      ? `${SPRITE_BASE}/versions/generation-v/black-white/animated/shiny/${id}.gif`
      : `${SPRITE_BASE}/versions/generation-v/black-white/animated/${id}.gif`;
  }
  return settings.shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`;
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

const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsCloseBtn = document.getElementById("settings-close");
// Scopé au panneau de réglages : le Quiz a ses propres boutons ".settings-option"
// (choix du temps) qui ne doivent pas être pilotés par cette logique.
const settingsOptionBtns = document.querySelectorAll("#settings-overlay .settings-option");
const animatedToggle = document.getElementById("setting-animated");
const shinyToggle = document.getElementById("setting-shiny");

function refreshSpriteDependentViews() {
  renderList();
  if (quizPhase === "playing" && quizShowGrid) renderQuizPlaying();
  if (quizPhase === "recap") renderRecap();
}

// Les noms/types des Pokémon et tout le texte de l'interface changent avec
// la langue : on retraduit le DOM statique et on redessine les vues dynamiques.
function refreshLanguageDependentViews() {
  applyTranslations();
  renderList();
  updateProgress();
  if (quizPhase === "playing") {
    if (quizShowGrid) renderQuizPlaying();
    updateQuizProgress();
  }
  if (quizPhase === "recap") renderRecap();
  updateHomeStats();
}

function updateSettingsUI() {
  settingsOptionBtns.forEach((btn) => {
    btn.classList.toggle("active", settings[btn.dataset.setting] === btn.dataset.value);
  });
  animatedToggle.checked = settings.animated;
  shinyToggle.checked = settings.shiny;
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
    if (btn.dataset.setting === "language") refreshLanguageDependentViews();
  });
});

animatedToggle.addEventListener("change", () => {
  settings.animated = animatedToggle.checked;
  saveSettings();
  refreshSpriteDependentViews();
});

shinyToggle.addEventListener("change", () => {
  settings.shiny = shinyToggle.checked;
  saveSettings();
  refreshSpriteDependentViews();
});

document.getElementById("settings-reset-list").addEventListener("click", () => {
  if (!confirm(t("settings.resetConfirm"))) return;
  caught = new Set();
  localStorage.removeItem(STORAGE_KEY);
  renderList();
  updateProgress();
  updateHomeStats();
});
