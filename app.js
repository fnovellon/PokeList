const versionEl = document.getElementById("app-version");
if (versionEl) versionEl.textContent = APP_VERSION;

// Petite célébration en confettis, déclenchée à 100% de complétion (Liste ou
// Quiz). Pur canvas, pas de dépendance externe.
function celebrateConfetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const colors = ["#ef5350", "#3b6ce0", "#59b06b", "#f8d030", "#a040a0", "#ffffff"];
  const particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2 + Math.random() * 3,
    speedX: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: -6 + Math.random() * 12,
  }));

  const duration = 2600;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

const headerEl = document.querySelector(".app-header");

// Hauteur cumulée des barres collantes (en-tête + barre du quiz), utilisée pour
// que le scroll automatique vers un Pokémon révélé ne le cache pas derrière elles.
function updateStickyOffsets() {
  const headerHeight = headerEl.offsetHeight;
  document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
  document.documentElement.style.setProperty(
    "--quiz-sticky-offset",
    `${headerHeight + quizFormEl.offsetHeight}px`
  );
}

updateStickyOffsets();
window.addEventListener("resize", updateStickyOffsets);

const modeButtons = document.querySelectorAll(".mode-btn");
const homeCards = document.querySelectorAll(".home-card");
const homeListStatEl = document.getElementById("home-list-stat");
const views = {
  home: document.getElementById("view-home"),
  list: document.getElementById("view-list"),
  quiz: document.getElementById("view-quiz"),
};

function updateHomeStats() {
  homeListStatEl.textContent = `${caught.size} / ${POKEMON_GEN1.length} attrapés`;
}

function goToMode(mode) {
  modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  Object.entries(views).forEach(([key, view]) => {
    view.hidden = key !== mode;
  });

  if (mode === "home") updateHomeStats();

  if (mode === "quiz") {
    // La barre du quiz était masquée (hauteur nulle) jusqu'ici, on peut
    // désormais mesurer sa vraie hauteur.
    updateStickyOffsets();
    quizInputEl.focus();
  }
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => goToMode(btn.dataset.mode));
});

homeCards.forEach((card) => {
  card.addEventListener("click", () => goToMode(card.dataset.mode));
});

updateHomeStats();

// Un lien de partage (bouton "Partager" du récap Quiz) atterrit ici avec des
// paramètres d'URL : on reprend directement ces réglages sur l'écran Quiz.
const sharedQuizParams = new URLSearchParams(location.search);
if (sharedQuizParams.has("minutes")) {
  applySharedQuizSettings(sharedQuizParams);
  syncGridDependentOptions();
  goToMode("quiz");
  history.replaceState(null, "", location.pathname);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
