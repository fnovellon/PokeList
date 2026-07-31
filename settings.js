const SETTINGS_KEY = "pokelist-settings";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const DEFAULT_SETTINGS = {
  theme: "auto", // auto | light | dark
  cardSize: "medium", // small | medium | large
  animated: false,
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

const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsCloseBtn = document.getElementById("settings-close");
const settingsOptionBtns = document.querySelectorAll(".settings-option");
const animatedToggle = document.getElementById("setting-animated");
const shinyToggle = document.getElementById("setting-shiny");

function refreshSpriteDependentViews() {
  renderList();
  renderQuizList();
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
  if (!confirm("Réinitialiser la progression du mode Liste ?")) return;
  caught = new Set();
  localStorage.removeItem(STORAGE_KEY);
  renderList();
  updateProgress();
  updateHomeStats();
});

document.getElementById("settings-reset-quiz").addEventListener("click", () => {
  if (!confirm("Réinitialiser la progression du mode Quiz ?")) return;
  found = new Set();
  localStorage.removeItem(QUIZ_STORAGE_KEY);
  renderQuizList();
  updateQuizProgress();
  updateHomeStats();
});

document.getElementById("settings-reset-all").addEventListener("click", () => {
  if (!confirm("Tout réinitialiser (Liste + Quiz) ?")) return;
  caught = new Set();
  found = new Set();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(QUIZ_STORAGE_KEY);
  renderList();
  updateProgress();
  renderQuizList();
  updateQuizProgress();
  updateHomeStats();
});
