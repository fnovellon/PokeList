const { test, expect, gotoFresh, startQuiz } = require("./fixtures");

test.describe("Réglages", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFresh(page);
  });

  test("le toggle Validation STT persiste après rechargement", async ({ page }) => {
    await page.click("#settings-btn");
    await expect(page.locator("#setting-stt-autosubmit")).not.toBeChecked();
    // Le switch visuel recouvre la checkbox : on clique le <label> qui l'enveloppe.
    await page.click('label:has(#setting-stt-autosubmit)');

    await page.reload();
    await page.click("#settings-btn");
    await expect(page.locator("#setting-stt-autosubmit")).toBeChecked();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pokelist-settings")));
    expect(stored.sttAutoSubmit).toBe(true);
  });

  test("Validation STT désactivée (défaut) : une saisie exacte ne se valide jamais seule", async ({ page }) => {
    await startQuiz(page, { mode: "fill", difficulty: "easy" });
    await page.fill("#quiz-input", "Bulbizarre");
    await page.waitForTimeout(700); // > 500ms de debounce de l'auto-validation
    await expect(page.locator("#quiz-progress-text")).toHaveText("0 / 151 trouvés");
  });

  test("Validation STT activée : une saisie exacte se valide automatiquement", async ({ page }) => {
    await page.click("#settings-btn");
    await page.click('label:has(#setting-stt-autosubmit)');
    await page.click("#settings-close");

    await startQuiz(page, { mode: "fill", difficulty: "easy" });
    await page.fill("#quiz-input", "Bulbizarre");
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés", { timeout: 2000 });
  });

  test("changer de langue retraduit l'interface", async ({ page }) => {
    await page.click("#settings-btn");
    await page.selectOption("#language-select", "en");
    await expect(page.locator("#quiz-start-btn")).toContainText("Start");
    await expect(page.locator("#search")).toHaveAttribute("placeholder", /Search/);
  });

  test("Tout réinitialiser efface la progression après confirmation", async ({ page }) => {
    await page.click('.mode-btn[data-mode="list"]');
    await page.click('label[for="pokemon-1"]');
    await expect(page.locator("#progress-text")).toHaveText("1 / 151 attrapés");

    page.once("dialog", (dialog) => dialog.accept());
    await page.click("#settings-btn");
    await page.click("#settings-reset-all");

    await page.click('.mode-btn[data-mode="list"]');
    await expect(page.locator("#progress-text")).toHaveText("0 / 151 attrapés");
  });
});

test.describe("Régression : icônes des gestionnaires de mots de passe", () => {
  test("les champs de saisie portent les attributs anti-overlay", async ({ page }) => {
    await gotoFresh(page);

    const search = page.locator("#search");
    await expect(search).toHaveAttribute("data-form-type", "other");
    await expect(search).toHaveAttribute("data-lpignore", "true");
    await expect(search).toHaveAttribute("autocomplete", "off");

    await startQuiz(page, { mode: "fill", difficulty: "easy" });
    const quizInput = page.locator("#quiz-input");
    await expect(quizInput).toHaveAttribute("data-form-type", "other");
    await expect(quizInput).toHaveAttribute("data-lpignore", "true");
    await expect(page.locator("#quiz-form")).toHaveAttribute("data-form-type", "other");
  });
});
