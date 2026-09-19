const { test, expect, gotoFresh } = require("./fixtures");

test.describe("Mode Liste", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFresh(page);
    await page.click('.mode-btn[data-mode="list"]');
  });

  test("affiche les 151 Pokémon de Gen 1 avec une progression à 0", async ({ page }) => {
    await expect(page.locator("#pokemon-list .pokemon-card")).toHaveCount(151);
    await expect(page.locator("#progress-text")).toHaveText("0 / 151 attrapés");
  });

  test("la recherche par nom filtre la liste", async ({ page }) => {
    await page.fill("#search", "Pikachu");
    await expect(page.locator("#pokemon-list .pokemon-card")).toHaveCount(1);
    await expect(page.locator("#pokemon-list .pokemon-name")).toHaveText("Pikachu");
  });

  test("la recherche par numéro filtre la liste", async ({ page }) => {
    await page.fill("#search", "#025");
    await expect(page.locator("#pokemon-list .pokemon-card")).toHaveCount(1);
    await expect(page.locator("#pokemon-list .pokemon-name")).toHaveText("Pikachu");
  });

  test("la recherche tolère une faute de frappe / saisie partielle", async ({ page }) => {
    // cf. NOTES.md : "draco" doit retrouver "Dracaufeu" (distance de préfixe),
    // parmi d'autres résultats valides (Minidraco, Draco, Dracolosse).
    await page.fill("#search", "draco");
    await expect(page.locator("#pokemon-list")).toContainText("Dracaufeu");
  });

  test("cocher un Pokémon met à jour la progression et persiste après rechargement", async ({ page }) => {
    // La checkbox est visuellement masquée derrière la carte ; on clique sur
    // son <label> associé, comme le ferait un vrai clic utilisateur.
    await page.click('label[for="pokemon-1"]');
    await expect(page.locator("#progress-text")).toHaveText("1 / 151 attrapés");
    await expect(page.locator("li:has(#pokemon-1)")).toHaveClass(/caught/);

    await page.reload();
    await page.click('.mode-btn[data-mode="list"]');
    await expect(page.locator("#pokemon-1")).toBeChecked();
    await expect(page.locator("#progress-text")).toHaveText("1 / 151 attrapés");
  });

  test("Tout cocher / Tout décocher n'affectent que les résultats visibles (filtrés)", async ({ page }) => {
    await page.fill("#search", "Pikachu");
    await page.click("#check-all");

    await page.fill("#search", "");
    await expect(page.locator("#progress-text")).toHaveText("1 / 151 attrapés");
    await expect(page.locator("#pokemon-25")).toBeChecked();
    await expect(page.locator("#pokemon-1")).not.toBeChecked();

    await page.fill("#search", "Pikachu");
    await page.click("#uncheck-all");
    await page.fill("#search", "");
    await expect(page.locator("#progress-text")).toHaveText("0 / 151 attrapés");
  });

  test("changer d'onglet de génération affiche le roster correspondant", async ({ page }) => {
    await page.click('#list-gen-tabs .gen-tab[data-gen="2"]');
    await expect(page.locator("#pokemon-list .pokemon-card")).toHaveCount(100); // #152-251
    await expect(page.locator("#progress-text")).toHaveText("0 / 100 attrapés");
  });
});
