// Fixtures partagées par toute la suite : isolation du localStorage entre
// tests, blocage des requêtes réseau externes (sprites PokeAPI, GoatCounter)
// pour des tests rapides et utilisables hors-ligne (CI sans accès sortant),
// et petits helpers pour les parcours répétés (démarrer un Quiz, etc.).
const base = require("@playwright/test");

const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.route(/raw\.githubusercontent\.com/, (route) => route.abort());
    await page.route(/gc\.zgo\.at|goatcounter\.com/, (route) => route.abort());
    // Neutralise le tirage Shiny (1% de chance par bonne réponse, cf.
    // shiny.js) pour des tests déterministes : sans ça, une réponse correcte
    // peut de façon aléatoire déclencher le feedback "shiny" au lieu de
    // "success" et faire échouer une assertion sans lien avec un vrai bug.
    // 0.5 reste une valeur valide pour les autres tirages aléatoires de
    // l'app (cible du mode Numéro, point de départ du mode Suite).
    await page.addInitScript(() => {
      Math.random = () => 0.5;
    });
    await use(page);
  },
});

const { expect } = base;

// Charge l'app avec un localStorage garanti vide (progression, réglages,
// succès, Shiny) : aucun test ne doit dépendre d'un état laissé par un autre.
async function gotoFresh(page, path = "/index.html") {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

const DIFFICULTY_SECTION_BY_MODE = {
  fill: "quiz-difficulty-fill",
  ordered: "quiz-difficulty-ordered",
  number: "quiz-difficulty-number",
  sequence: "quiz-difficulty-sequence",
};

// Configure et démarre une partie de Quiz depuis l'écran d'accueil (déjà
// affiché par défaut). Les valeurs par défaut reproduisent le preset de
// base (Classique / Facile / Gen 1).
async function startQuiz(page, { gen = 1, mode = "fill", difficulty = "easy" } = {}) {
  await page.click(`#quiz-gen-options [data-gen="${gen}"]`);
  await page.click(`#quiz-mode-options [data-mode="${mode}"]`);
  const sectionId = DIFFICULTY_SECTION_BY_MODE[mode];
  if (sectionId) {
    await page.click(`#${sectionId} [data-difficulty="${difficulty}"]`);
  }
  await page.click("#quiz-start-btn");
  await expect(page.locator("#quiz-playing")).toBeVisible();
}

// Saisit une réponse et valide le formulaire (bouton "Valider"), plutôt que
// de compter sur la validation auto (réglage STT, testée séparément).
async function submitGuess(page, text) {
  await page.fill("#quiz-input", text);
  await page.locator('#quiz-form button[type="submit"]').click();
}

module.exports = { test, expect, gotoFresh, startQuiz, submitGuess };
