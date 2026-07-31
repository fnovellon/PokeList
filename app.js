const versionEl = document.getElementById("app-version");
if (versionEl) versionEl.textContent = APP_VERSION;

const modeButtons = document.querySelectorAll(".mode-btn");
const views = {
  list: document.getElementById("view-list"),
  quiz: document.getElementById("view-quiz"),
};

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;

    modeButtons.forEach((b) => b.classList.toggle("active", b === btn));
    Object.entries(views).forEach(([key, view]) => {
      view.hidden = key !== mode;
    });

    if (mode === "quiz") quizInputEl.focus();
  });
});
