// Shiny : chaque bonne réponse en mode Quiz a 1% de chance de débloquer la
// version Shiny du Pokémon trouvé, définitivement. Persisté comme les
// succès (contrairement au reste du Quiz), peu importe la génération ou le
// preset de difficulté utilisé.
const SHINY_KEY = "pokelist-shinies";
const SHINY_UNLOCK_CHANCE = 0.01;

function loadShinies() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SHINY_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveShinies(shinySet) {
  localStorage.setItem(SHINY_KEY, JSON.stringify([...shinySet]));
}

let unlockedShinies = loadShinies();

function isShinyUnlocked(id) {
  return unlockedShinies.has(id);
}

// Tente sa chance sur ce Pokémon ; retourne true seulement si le Shiny vient
// d'être débloqué à l'instant (pour ne célébrer qu'une fois par Pokémon).
function tryUnlockShiny(id) {
  if (unlockedShinies.has(id)) return false;
  if (Math.random() >= SHINY_UNLOCK_CHANCE) return false;
  unlockedShinies.add(id);
  saveShinies(unlockedShinies);
  return true;
}

// Petite étoile flottante affichée à côté du sprite d'un Pokémon dont le
// Shiny a été débloqué, quel que soit le réglage global "Variante Shiny".
function shinySparkleHtml(id) {
  return isShinyUnlocked(id) ? `<span class="shiny-sparkle" aria-hidden="true">✨</span>` : "";
}
