const { test, expect, gotoFresh } = require("./fixtures");

test.describe("Configuration du Quiz", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFresh(page);
  });

  test("l'accueil affiche l'écran de configuration avec Classique/Facile/Gen1 par défaut", async ({ page }) => {
    await expect(page.locator("#quiz-setup")).toBeVisible();
    await expect(page.locator('#quiz-gen-options [data-gen="1"]')).toHaveClass(/active/);
    await expect(page.locator('#quiz-mode-options [data-mode="fill"]')).toHaveClass(/active/);
    await expect(page.locator('#quiz-difficulty-fill [data-difficulty="easy"]')).toHaveClass(/active/);
  });

  test("changer de mode affiche la bonne section de difficulté", async ({ page }) => {
    await expect(page.locator("#quiz-difficulty-fill")).toBeVisible();
    await expect(page.locator("#quiz-difficulty-ordered")).toBeHidden();

    await page.click('#quiz-mode-options [data-mode="ordered"]');
    await expect(page.locator("#quiz-difficulty-fill")).toBeHidden();
    await expect(page.locator("#quiz-difficulty-ordered")).toBeVisible();

    await page.click('#quiz-mode-options [data-mode="number"]');
    await expect(page.locator("#quiz-difficulty-ordered")).toBeHidden();
    await expect(page.locator("#quiz-difficulty-number")).toBeVisible();

    await page.click('#quiz-mode-options [data-mode="sequence"]');
    await expect(page.locator("#quiz-difficulty-number")).toBeHidden();
    await expect(page.locator("#quiz-difficulty-sequence")).toBeVisible();
  });

  test("démarrer le Quiz masque la config et affiche l'écran de jeu", async ({ page }) => {
    await page.click("#quiz-start-btn");
    await expect(page.locator("#quiz-setup")).toBeHidden();
    await expect(page.locator("#quiz-playing")).toBeVisible();
    await expect(page.locator("#quiz-progress-text")).toHaveText("0 / 151 trouvés");
  });

  test("Liste et Shiny Dex sont verrouillés pendant une partie", async ({ page }) => {
    await page.click("#quiz-start-btn");
    await expect(page.locator('.mode-btn[data-mode="list"]')).toBeDisabled();
  });
});
