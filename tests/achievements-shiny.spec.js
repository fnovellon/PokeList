const { test, expect, gotoFresh } = require("./fixtures");

test.describe("Succès", () => {
  test("un succès débloqué apparaît comme obtenu dans la modale", async ({ page }) => {
    await gotoFresh(page);
    await page.evaluate(() => window.debug.unlockAchievement(1, "complete"));

    await page.click("#achievements-btn");
    await expect(page.locator("#achievements-overlay")).toBeVisible();
    // "complete" est le premier succès listé (cf. achievements.js).
    await expect(page.locator("#achievements-list .achv-tile").first()).toHaveClass(/achv-earned/);
  });

  test("persiste après rechargement", async ({ page }) => {
    await gotoFresh(page);
    await page.evaluate(() => window.debug.unlockAchievement(1, "hardcore"));
    await page.reload();

    await page.click("#achievements-btn");
    const earned = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pokelist-achievements"))
    );
    expect(earned).toContain("1:hardcore");
  });
});

test.describe("Shiny Dex", () => {
  test("un Shiny débloqué via debug apparaît en couleur dans le Shiny Dex", async ({ page }) => {
    await gotoFresh(page);
    await page.evaluate(() => window.debug.shiny(1)); // #001 Bulbizarre

    await page.click("#shinydex-btn");
    await expect(page.locator("#shinydex-overlay")).toBeVisible();
    const firstCard = page.locator("#shinydex-list .pokemon-card").first();
    await expect(firstCard).toHaveClass(/shiny-unlocked/);
    await expect(page.locator("#shinydex-progress-text")).toHaveText("1 / 151 débloqués");
  });
});
