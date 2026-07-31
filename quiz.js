const QUIZ_STORAGE_KEY = "pokelist-found-gen1";

const quizListEl = document.getElementById("quiz-list");
const quizFormEl = document.getElementById("quiz-form");
const quizInputEl = document.getElementById("quiz-input");
const quizProgressFillEl = document.getElementById("quiz-progress-fill");
const quizProgressTextEl = document.getElementById("quiz-progress-text");
const quizFeedbackEl = document.getElementById("quiz-feedback");

function loadFound() {
  try {
    return new Set(JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveFound(foundSet) {
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify([...foundSet]));
}

let found = loadFound();
let justFoundId = null;

function updateQuizProgress() {
  const total = POKEMON_GEN1.length;
  const count = found.size;
  quizProgressFillEl.style.width = `${(count / total) * 100}%`;
  quizProgressTextEl.textContent = `${count} / ${total} trouvés`;
}

// Validation stricte : contrairement à la recherche du mode Liste, une simple
// saisie partielle (ex: "psi") ne doit pas suffire à trouver "Psykokwak" — il
// faut écrire (à peu de fautes de frappe près) le nom complet.
function isCorrectGuess(rawGuess, pokemon) {
  const guess = normalize(rawGuess);
  if (!guess) return false;
  if (guess === pokemon.normalizedName) return true;

  const threshold = Math.max(1, Math.floor(pokemon.normalizedName.length * 0.25));
  return levenshtein(guess, pokemon.normalizedName) <= threshold;
}

function showQuizFeedback(message, tone) {
  quizFeedbackEl.textContent = message;
  quizFeedbackEl.className = "quiz-feedback";
  if (tone) quizFeedbackEl.classList.add(tone);
}

function renderQuizList() {
  quizListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const pokemon of POKEMON_GEN1) {
    const isFound = found.has(pokemon.id);

    const li = document.createElement("li");
    li.className = "pokemon-card quiz-card";
    if (isFound) li.classList.add("caught");
    if (pokemon.id === justFoundId) li.classList.add("just-found");

    li.innerHTML = `
      <span class="pokemon-number">${formatNumber(pokemon.id)}</span>
      <img
        class="pokemon-sprite quiz-sprite"
        src="${getSpriteUrl(pokemon.id)}"
        alt="${isFound ? pokemon.name : "Pokémon non découvert"}"
        loading="lazy"
      />
      <span class="pokemon-name quiz-name">${isFound ? pokemon.name : "?????"}</span>
    `;

    fragment.appendChild(li);
  }

  quizListEl.appendChild(fragment);

  if (justFoundId !== null) {
    quizListEl
      .querySelector(".just-found")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    justFoundId = null;
  }
}

quizFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const guess = quizInputEl.value.trim();
  if (!guess) return;

  const match = POKEMON_GEN1.find((p) => !found.has(p.id) && isCorrectGuess(guess, p));

  if (match) {
    found.add(match.id);
    saveFound(found);
    justFoundId = match.id;
    renderQuizList();
    updateQuizProgress();
    quizInputEl.value = "";
    showQuizFeedback(`Bravo, c'était ${match.name} !`, "success");
  } else {
    const alreadyFound = POKEMON_GEN1.find((p) => found.has(p.id) && isCorrectGuess(guess, p));
    if (alreadyFound) {
      showQuizFeedback(`${alreadyFound.name} a déjà été trouvé.`, null);
    } else {
      showQuizFeedback("Aucun Pokémon ne correspond, réessaie.", "error");
    }
  }

  quizInputEl.focus();
});

renderQuizList();
updateQuizProgress();
