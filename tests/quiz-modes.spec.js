const { test, expect, gotoFresh, startQuiz, submitGuess } = require("./fixtures");

test.describe("Mode Numéro", () => {
  test("deviner le nom de la cible active la fait avancer et en tire une nouvelle", async ({ page }) => {
    await gotoFresh(page);
    await startQuiz(page, { mode: "number", difficulty: "easy" });

    // quizCurrentTarget est directement l'objet Pokémon ciblé (pas un id).
    const targetName = await page.evaluate(() => quizCurrentTarget.names.fr);
    await submitGuess(page, targetName);

    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");
    // Une nouvelle cible doit avoir été tirée (le mode Numéro ne s'arrête pas à 1).
    const newTargetId = await page.evaluate(() => quizCurrentTarget);
    expect(newTargetId).toBeTruthy();
  });
});

test.describe("Mode Suite", () => {
  test("répondre hors ordre est refusé, répondre au bon prochain Pokémon compte", async ({ page }) => {
    await gotoFresh(page);
    // Difficulté "easy" du mode Suite donne 3 Pokémon gratuits au départ
    // (context: 3, cf. GAME_MODES dans quiz.js) : on part du compte réel
    // plutôt que de supposer 0.
    await startQuiz(page, { mode: "sequence", difficulty: "easy" });

    const { startCount, nextName, laterName } = await page.evaluate(() => {
      const next = quizSeqOrder[quizFound.size];
      const later = quizSeqOrder[quizFound.size + 1];
      return { startCount: quizFound.size, nextName: next.names.fr, laterName: later.names.fr };
    });

    // Un Pokémon valide de la séquence, mais pas le prochain attendu : refusé.
    await submitGuess(page, laterName);
    await expect(page.locator("#quiz-progress-text")).toHaveText(`${startCount} / 151 trouvés`);
    await expect(page.locator("#quiz-feedback")).toHaveClass(/error/);

    // Le bon prochain de la séquence : accepté.
    await submitGuess(page, nextName);
    await expect(page.locator("#quiz-progress-text")).toHaveText(`${startCount + 1} / 151 trouvés`);
  });
});

test.describe("Mode Hardcore (orthographe exacte)", () => {
  test("un nom sans accent est refusé en Hardcore mais accepté en Classique", async ({ page }) => {
    // #081 Magnéti (FR) : bon candidat, son nom porte un accent.
    await gotoFresh(page);
    await startQuiz(page, { mode: "fill", difficulty: "easy" }); // pas Hardcore
    await submitGuess(page, "magneti"); // sans accent
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");

    await gotoFresh(page);
    await startQuiz(page, { mode: "fill", difficulty: "veryHard" }); // Hardcore
    await submitGuess(page, "magneti"); // sans accent : refusé
    await expect(page.locator("#quiz-progress-text")).toHaveText("0 / 151 trouvés");

    await submitGuess(page, "Magnéti"); // orthographe exacte : accepté
    await expect(page.locator("#quiz-progress-text")).toHaveText("1 / 151 trouvés");
  });
});

test.describe("Mode Un seul essai (permadeath)", () => {
  test("une réponse hors ordre met immédiatement fin à la partie", async ({ page }) => {
    await gotoFresh(page);
    await startQuiz(page, { mode: "ordered", difficulty: "hard" }); // permadeath: true

    // #002 Herbizarre est un Pokémon valide du roster, mais le premier
    // attendu en mode Chronologique est #001 Bulbizarre : hors ordre.
    await submitGuess(page, "Herbizarre");

    await expect(page.locator("#quiz-recap")).toBeVisible();
    await expect(page.locator("#quiz-gameover-banner")).toBeVisible();
    await expect(page.locator("#quiz-recap-stat")).toHaveText("0%");
  });
});
