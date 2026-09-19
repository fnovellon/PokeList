// Tests unitaires des fonctions pures de matching.js, exécutées directement
// dans le contexte du navigateur (page.evaluate) : ce sont de simples
// scripts globaux, pas des modules exportables côté Node, et ça permet de
// tester exactement le code qui tourne réellement dans l'app.
const { test, expect, gotoFresh } = require("./fixtures");

test.describe("matching.js (fonctions pures)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFresh(page);
  });

  test("normalize() ignore accents, casse, ponctuation, et traite 'y' comme 'i'", async ({ page }) => {
    const result = await page.evaluate(() => ({
      accents: normalize("Évoli") === normalize("evoli"),
      case: normalize("PIKACHU") === normalize("pikachu"),
      punctuation: normalize("Ho-Oh") === normalize("HoOh"),
      yAsI: normalize("Psykokwak") === normalize("Psikokwak"),
    }));
    expect(result).toEqual({ accents: true, case: true, punctuation: true, yAsI: true });
  });

  test("normalizeStrict() exige les accents exacts (utilisé par le mode Hardcore)", async ({ page }) => {
    const result = await page.evaluate(() => ({
      sameAccent: normalizeStrict("Magnéti") === normalizeStrict("magnéti"),
      missingAccent: normalizeStrict("Magneti") === normalizeStrict("Magnéti"),
    }));
    expect(result).toEqual({ sameAccent: true, missingAccent: false });
  });

  test("levenshtein() calcule une distance d'édition correcte", async ({ page }) => {
    const result = await page.evaluate(() => ({
      identical: levenshtein("pikachu", "pikachu"),
      oneSwap: levenshtein("pikachu", "pikachi"),
      empty: levenshtein("", "abc"),
    }));
    expect(result).toEqual({ identical: 0, oneSwap: 1, empty: 3 });
  });

  test("guessMatchDistance() accepte une faute de frappe dans la tolérance, refuse au-delà", async ({ page }) => {
    const result = await page.evaluate(() => {
      quizHardcore = false;
      const pikachu = POKEMON_BY_ID.get(25);
      return {
        exact: guessMatchDistance("Pikachu", pikachu),
        oneTypo: guessMatchDistance("Pikachy", pikachu), // y->i, distance 1, tolérance = floor(7*0.25) = 1
        tooFar: guessMatchDistance("Zzzzzzz", pikachu),
      };
    });
    expect(result).toEqual({ exact: 0, oneTypo: 1, tooFar: null });
  });

  test("findClosestGuessMatch() départage Nidoran(f/m) de Nidorina/Nidorino par distance minimale", async ({ page }) => {
    // Régression (cf. NOTES.md) : "Nidoran" (sans le symbole ♀/♂, impossible à
    // taper) doit toujours matcher un des deux Nidoran, jamais Nidorina/Nidorino,
    // même quand les 4 sont candidats (roster non trouvé).
    const matchedId = await page.evaluate(() => {
      quizHardcore = false;
      const candidates = [29, 30, 32, 33].map((id) => POKEMON_BY_ID.get(id));
      return findClosestGuessMatch("Nidoran", candidates).id;
    });
    expect([29, 32]).toContain(matchedId);
  });

  test("prefixEditDistance() tolère une saisie partielle (recherche du mode Liste)", async ({ page }) => {
    const result = await page.evaluate(() => ({
      prefix: prefixEditDistance("draco", normalize("Dracaufeu")),
      unrelated: prefixEditDistance("xyz", normalize("Dracaufeu")),
    }));
    expect(result.prefix).toBeLessThanOrEqual(1);
    expect(result.unrelated).toBeGreaterThan(2);
  });
});
