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

POKEMON_GEN1.forEach((p) => {
  p.normalizedName = normalize(p.name);
});

const POKEMON_BY_ID = new Map(POKEMON_GEN1.map((p) => [p.id, p]));

function formatNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}
