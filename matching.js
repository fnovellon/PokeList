// Utilitaires de comparaison de texte partagés entre le mode Liste (recherche)
// et le mode Quiz (validation des réponses).

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "")
    // "y" se prononce comme "i" en français (ex: "psi" ~ "Psykokwak")
    .replace(/y/g, "i");
}

// Normalisation "stricte" pour le mode Hardcore du Quiz : la casse et la
// ponctuation/espaces restent tolérées, mais les accents et lettres doivent
// être exacts (contrairement à normalize(), aucun repli phonétique ou
// suppression d'accent).
function normalizeStrict(str) {
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

// Distance d'édition classique entre deux chaînes entières (insertions,
// suppressions, substitutions). Utilisée pour valider une réponse complète.
function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );
    }
  }

  return dist[rows - 1][cols - 1];
}

// Distance d'édition entre `query` et le préfixe de `target` qui lui ressemble le
// plus (les caractères restants de `target` ne sont pas comptés), pour tolérer
// une saisie partielle en plus des fautes de frappe (ex: "draco" ~ "dracaufeu").
// Utilisée pour la recherche du mode Liste, pas pour la validation du Quiz.
function prefixEditDistance(query, target) {
  const rows = query.length + 1;
  const cols = target.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = query[i - 1] === target[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );
    }
  }

  return Math.min(...dist[rows - 1]);
}

// Pré-calcule la version normalisée du nom dans chacune des langues, pour ne
// pas refaire ce travail à chaque recherche/validation.
POKEMON_GEN1.forEach((p) => {
  p.normalizedNames = {
    fr: normalize(p.names.fr),
    en: normalize(p.names.en),
    es: normalize(p.names.es),
    de: normalize(p.names.de),
  };
  p.strictNormalizedNames = {
    fr: normalizeStrict(p.names.fr),
    en: normalizeStrict(p.names.en),
    es: normalizeStrict(p.names.es),
    de: normalizeStrict(p.names.de),
  };
});

const POKEMON_BY_ID = new Map(POKEMON_GEN1.map((p) => [p.id, p]));

// Les 3 générations couvertes par l'app, dans l'ordre d'affichage.
const GENERATIONS = [1, 2, 3];

function pokemonsByGeneration(gen) {
  return POKEMON_GEN1.filter((p) => p.gen === gen);
}

// Ces trois helpers lisent la langue courante (settings.language, défini dans
// settings.js) : à utiliser partout où l'on affiche/compare un nom ou un type.
function pokemonName(pokemon) {
  return pokemon.names[settings.language] || pokemon.names.fr;
}

function pokemonTypes(pokemon) {
  return pokemon.types[settings.language] || pokemon.types.fr;
}

function pokemonNormalizedName(pokemon) {
  return pokemon.normalizedNames[settings.language] || pokemon.normalizedNames.fr;
}

function pokemonStrictNormalizedName(pokemon) {
  return pokemon.strictNormalizedNames[settings.language] || pokemon.strictNormalizedNames.fr;
}

function formatNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}

// Couleurs officielles par type, pour les badges affichés en mode Liste et
// Quiz. Clés en anglais (langue-pivot stable) puisque le nom affiché dépend
// de la langue courante.
const TYPE_COLORS = {
  Normal: "#a8a878",
  Fire: "#f08030",
  Water: "#6890f0",
  Grass: "#78c850",
  Electric: "#f8d030",
  Ice: "#98d8d8",
  Fighting: "#c03028",
  Poison: "#a040a0",
  Ground: "#e0c068",
  Flying: "#a890f0",
  Psychic: "#f85888",
  Bug: "#a8b820",
  Rock: "#b8a038",
  Ghost: "#705898",
  Dragon: "#7038f8",
  Dark: "#705848",
  Steel: "#b8b8d0",
  Fairy: "#ee99ac",
};
const TYPE_DARK_TEXT = new Set(["Electric", "Ground", "Ice", "Steel", "Fairy", "Normal"]);

// Construit le HTML des badges de type d'un Pokémon (toujours affichés, sans
// condition) ; utilisé tel quel par le mode Liste, et enveloppé d'une
// condition d'affichage par le mode Quiz (voir typeBadgesHtml dans quiz.js).
function renderTypeBadges(pokemon) {
  const displayTypes = pokemonTypes(pokemon);
  const badges = pokemon.types.en
    .map((enType, i) => {
      const color = TYPE_COLORS[enType] || "#888";
      const textClass = TYPE_DARK_TEXT.has(enType) ? "type-badge-dark" : "";
      return `<span class="type-badge ${textClass}" style="background:${color}">${displayTypes[i]}</span>`;
    })
    .join("");
  return `<div class="type-badges">${badges}</div>`;
}
