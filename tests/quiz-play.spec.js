const { test, expect, gotoFresh, startQuiz, submitGuess } = require("./fixtures");

test.describe("Déroulé d'une partie (mode Classique)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFresh(page);
    await startQuiz(page, { mode: "fill", difficulty: "easy" }); // grille + types + indices
  });

  test("une réponse correcte marque le Pokémon comme trouvé", async ({ page }) => {
    await submitGuess(page, "Bulbizarre");
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");
    const card = page.locator("#quiz-list li").first();
    await expect(card).toHaveClass(/caught/);
    await expect(card.locator(".quiz-name")).toHaveText("Bulbizarre");
    await expect(page.locator("#quiz-feedback")).toHaveClass(/success/);
  });

  test("une réponse avec une faute de frappe tolérée est acceptée", async ({ page }) => {
    // "Pikachy" ~ "Pikachu" (normalize() convertit "y" -> "i", distance 1 dans la tolérance).
    await submitGuess(page, "Pikachy");
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");
    await expect(page.locator("#quiz-feedback")).toHaveClass(/success/);
  });

  test("une réponse fausse affiche une erreur sans faire avancer le score", async ({ page }) => {
    await submitGuess(page, "PasUnPokemon");
    await expect(page.locator("#quiz-progress-text")).toHaveText("0 / 151 trouvés");
    await expect(page.locator("#quiz-feedback")).toHaveClass(/error/);
  });

  test("retrouver un Pokémon déjà trouvé prévient sans le recompter", async ({ page }) => {
    await submitGuess(page, "Bulbizarre");
    await submitGuess(page, "Bulbizarre");
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");
    await expect(page.locator("#quiz-feedback")).not.toHaveClass(/error/);
  });

  test("terminer le roster affiche le récap à 100%", async ({ page }) => {
    // debug.fillQuiz() débloque tout sauf un Pokémon (cf. quiz.js) ; on tape
    // le dernier pour déclencher la fin de partie sans retaper 151 noms.
    await page.evaluate(() => window.debug.fillQuiz());
    await submitGuess(page, "Bulbizarre");

    await expect(page.locator("#quiz-recap")).toBeVisible();
    await expect(page.locator("#quiz-recap-stat")).toHaveText("100%");
    await expect(page.locator("#quiz-gameover-banner")).toBeHidden();
  });
});

test.describe("Nidoran / Nidorina / Nidorino (régression matching)", () => {
  test("taper 'Nidoran' ne valide jamais Nidorina ou Nidorino", async ({ page }) => {
    await gotoFresh(page);
    await startQuiz(page, { mode: "fill", difficulty: "easy" });

    await submitGuess(page, "Nidoran");
    const card30 = page.locator("#quiz-list li").nth(29); // #030 Nidorina
    const card33 = page.locator("#quiz-list li").nth(32); // #033 Nidorino
    await expect(card30).not.toHaveClass(/caught/);
    await expect(card33).not.toHaveClass(/caught/);
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");
  });
});
