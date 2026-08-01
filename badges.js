// Badges : un par génération entièrement trouvée en mode Quiz, peu importe le
// preset de difficulté utilisé. Contrairement au reste du Quiz, c'est bien
// persisté (c'est un trophée, pas une partie en cours).
const BADGES_KEY = "pokelist-badges";

function loadBadges() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BADGES_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveBadges(badgeSet) {
  localStorage.setItem(BADGES_KEY, JSON.stringify([...badgeSet]));
}

let earnedBadges = loadBadges();

// Vrais sprites d'arènes PokeAPI (le badge final de chaque région, symbole de
// la région entièrement complétée) : Terre (Kanto #8), Ascension (Johto #16),
// Pluie (Hoenn #24).
const BADGE_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges";
const GEN_BADGE_SPRITE_ID = { 1: 8, 2: 16, 3: 24 };

function badgeSpriteUrl(gen) {
  return `${BADGE_SPRITE_BASE}/${GEN_BADGE_SPRITE_ID[gen]}.png`;
}

function hasBadge(gen) {
  return earnedBadges.has(gen);
}

// Retourne true si ce badge vient d'être débloqué à l'instant (déjà obtenu ->
// false, pour ne pas re-célébrer un badge déjà en poche).
function awardBadge(gen) {
  if (earnedBadges.has(gen)) return false;
  earnedBadges.add(gen);
  saveBadges(earnedBadges);
  renderBadgesModal();
  return true;
}

const badgesBtn = document.getElementById("badges-btn");
const badgesOverlay = document.getElementById("badges-overlay");
const badgesCloseBtn = document.getElementById("badges-close");
const badgesListEl = document.getElementById("badges-list");

function renderBadgesModal() {
  badgesListEl.innerHTML = GENERATIONS.map((gen) => {
    const count = pokemonsByGeneration(gen).length;
    const earned = hasBadge(gen);
    return `
      <div class="badge-tile ${earned ? "badge-earned" : "badge-locked"}">
        <img class="badge-tile-icon" src="${badgeSpriteUrl(gen)}" alt="${t(`gen.label${gen}`)}" loading="lazy" />
        <span class="badge-tile-label">${t(`gen.label${gen}`)}</span>
        <span class="badge-tile-state">${earned ? t("badges.earned") : t("badges.locked")}</span>
        <span class="badge-tile-desc">${t("badges.desc", { count, gen })}</span>
      </div>
    `;
  }).join("");
}

function openBadges() {
  renderBadgesModal();
  badgesOverlay.hidden = false;
}

function closeBadges() {
  badgesOverlay.hidden = true;
}

badgesBtn.addEventListener("click", openBadges);
badgesCloseBtn.addEventListener("click", closeBadges);
badgesOverlay.addEventListener("click", (event) => {
  if (event.target === badgesOverlay) closeBadges();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !badgesOverlay.hidden) closeBadges();
});
