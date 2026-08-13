const SHELL_CACHE = "pokelist-shell-v14";
const SPRITE_CACHE = "pokelist-sprites-v1";

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./version.js",
  "./pokemon-data.js",
  "./i18n.js",
  "./matching.js",
  "./shiny.js",
  "./settings.js",
  "./achievements.js",
  "./shinydex.js",
  "./list.js",
  "./quiz.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== SHELL_CACHE && key !== SPRITE_CACHE).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Sprites PokeAPI : cache-first, mis en cache au fil de la navigation pour un
  // usage hors-ligne progressif (un Pokémon déjà vu reste visible sans réseau).
  if (url.hostname === "raw.githubusercontent.com" && url.pathname.includes("/sprites/pokemon/")) {
    event.respondWith(
      caches.open(SPRITE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch (err) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // App shell : sert le cache immédiatement si présent, puis revalide en arrière-plan.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
