// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: "http://127.0.0.1:4173",
    // Fige la langue détectée par l'app (settings.js -> detectDefaultLanguage)
    // sur le français, pour que les assertions sur les textes/noms de
    // Pokémon soient stables quel que soit l'environnement d'exécution.
    locale: "fr-FR",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },

  // Sert le repo statique tel quel (pas de build) : voir tests/server.js.
  webServer: {
    command: "node tests/server.js",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
