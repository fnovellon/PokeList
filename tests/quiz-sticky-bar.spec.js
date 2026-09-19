const { test, expect, gotoFresh, startQuiz } = require("./fixtures");

// Régression : la barre du Quiz (progression, timer, input, boutons) a déjà
// basculé deux fois entre "collante" et "scrolle avec la page" au fil des
// sessions (cf. NOTES.md, points 8a82a17 et 22). Ce test fige le comportement
// actuellement voulu : collante, épinglée sous l'en-tête pendant le scroll.
test.describe("Barre collante du Quiz", () => {
  test("reste épinglée sous l'en-tête pendant le scroll de la grille", async ({ page }) => {
    await gotoFresh(page);
    await startQuiz(page, { mode: "fill", difficulty: "easy" }); // grid: true -> grille scrollable

    const bar = page.locator("#quiz-sticky-bar");
    await expect(bar).toHaveCSS("position", "sticky");

    const headerHeight = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--header-height").trim()
    );

    await page.evaluate(() => window.scrollBy(0, 1000));
    await expect
      .poll(async () => {
        const box = await bar.boundingBox();
        return box ? `${Math.round(box.y)}px` : null;
      })
      .toBe(headerHeight);
  });
});
