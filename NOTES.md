# Notes de développement — PokéList

Ce fichier recense les features, les décisions techniques et les pièges connus
de l'app, pour ne rien perdre entre deux sessions de travail. À tenir à jour
à chaque changement notable (pas besoin de détailler chaque petit fix).

## Vue d'ensemble

- App web statique (HTML/CSS/JS vanilla, sans build ni dépendance), PWA
  installable et utilisable hors-ligne.
- 3 générations couvertes : Gen 1 Kanto (#001–151), Gen 2 Johto (#152–251),
  Gen 3 Hoenn (#252–386).
- i18n FR/EN/ES/DE (`i18n.js`), langue détectée depuis le navigateur au
  premier lancement, changeable dans le header.
- Aucun backend : tout est persisté en `localStorage`, par clé dédiée par
  feature (voir "Fichiers" ci-dessous). Rien n'est synchronisé entre appareils.
- Analytics : GoatCounter (script dans `<head>` de `index.html`), sans
  cookies, pas de bannière RGPD nécessaire.

## Fichiers et rôle de chacun

| Fichier | Rôle | Clé localStorage |
|---|---|---|
| `pokemon-data.js` | Données brutes des 386 Pokémon (id, gen, noms/types par langue) | — |
| `matching.js` | Normalisation de texte, distance de Levenshtein, helpers `pokemonName`/`pokemonTypes`/... | — |
| `i18n.js` | Dictionnaire de traductions + fonction `t()` | — |
| `settings.js` | Thème, taille des cartes, sprites animés, langue, reset global | `pokelist-settings` |
| `list.js` | Mode Liste (cocher les Pokémon vus, recherche, filtres par génération) | `pokelist-caught-gen1` |
| `quiz.js` | Mode Quiz (config, partie, récap, partage) | — (rien de persisté à part achievements/shiny) |
| `achievements.js` | 8 succès par génération, modale + bandeau d'accueil | `pokelist-achievements` |
| `shiny.js` | Déblocage aléatoire de variantes Shiny pendant le Quiz | `pokelist-shinies` |
| `shinydex.js` | Modale listant tous les Shiny débloqués/non | — (lit `shiny.js`) |
| `stats.js` | Stats entre parties (par mode × difficulté), modale 📊 | `pokelist-quiz-stats` |
| `app.js` | Navigation entre modes, confettis, offsets des barres sticky | — |
| `version.js` | Numéro de version affiché dans le header (`v42`, `v43`, ...) | — |
| `sw.js` | Service worker : cache app shell + cache sprites PokeAPI | — (Cache Storage, pas localStorage) |

## Features

### Mode Liste
- Cases à cocher par Pokémon, recherche par nom (tolérante aux fautes de
  frappe et à la saisie partielle, ex: "draco" trouve "Dracaufeu") ou par
  numéro.
- Onglets Gen 1/2/3 (état non persisté, revient à Gen 1 au rechargement).
- Boutons "Tout cocher"/"Tout décocher" (agissent sur les Pokémon visibles
  après filtre de recherche, pas sur toute la génération).
- Confettis quand une génération est complétée à 100%.

### Mode Quiz
- **Configuration** : génération, puis **3 modes de jeu**, chacun avec 4
  niveaux de difficulté (Facile/Normal/Difficile/Très difficile) sauf Custom :
  - **"📖 Remplir le Pokédex"** (`mode: "fill"`) : ordre libre, mort subite
    désactivée, temps infini. Facile = toutes les aides (grille+types+lettre) ;
    Normal = grille seule ; Difficile = aucune aide ; Très difficile = aucune
    aide + orthographe exacte (Hardcore).
  - **"🔢 Dans l'ordre"** (`mode: "ordered"`) : ordre croissant du Pokédex
    forcé, temps infini. Facile = pas de grille mais un widget affiche le
    type + la 1ère lettre du **prochain** Pokémon à trouver (`quizShowNextHint`,
    voir `renderNextHint()`) ; Normal = aucune aide ; Difficile = aucune aide +
    mort subite (1 erreur = Game Over) ; Très difficile = aucune aide + mort
    subite + orthographe exacte.
  - **"🛠️ Custom"** : panneau manuel complet (temps, aides, indice sur le
    prochain, ordre croissant, mort subite, orthographe exacte). Le panneau
    reste **toujours visible** (grisé + pré-rempli avec l'aperçu du niveau
    choisi tant qu'on n'est pas en Custom), même logique que l'ancien système
    de presets, portée sur le nouveau modèle mode+difficulté
    (`updateCustomPanelState()`). Descriptions en tooltip **custom** (pas le
    `title` natif, jugé trop lent) au survol d'une icône "(?)" dédiée
    (`.info-icon`) — placée en dehors du `<label>` pour ne pas déclencher
    l'interrupteur au clic. Uniquement sur les réglages Custom, pas sur les
    boutons de difficulté. Voir "Tooltip custom" plus bas.
  - Table des 2 modes nommés × 4 difficultés dans `GAME_MODES` (`quiz.js`) ;
    `effectiveQuizSettings()` calcule les réglages réels à appliquer selon le
    mode (table ou lecture directe du panneau Custom) ; `detectModeAndDifficulty()`
    fait l'inverse (utilisé pour restaurer un lien de partage).
  - Les succès liés à la difficulté (`easy`/`normal`/`hard`) ne sont attribués
    que via un mode nommé, jamais en Custom, même si ses réglages reproduisent
    exactement un niveau (comportement hérité de l'ancien système de presets).
- **Écran de configuration** : le bouton "▶️ Commencer" (`#quiz-start-btn`)
  est placé juste sous la bande de succès, **avant** tous les réglages
  (génération, mode, difficulté, panneau Custom) plutôt qu'en bas de la
  page — permet de lancer une partie sans avoir à scroller tout le panneau.
- **Cartes du Quiz** : taille fixe par palier (`small`/`medium`/`large`, cf.
  réglage "Taille des cartes"), sprite + nom en haut, badges de types en bas
  à gauche, numéro flottant en haut à droite. Animation de révélation
  (`reveal-pop` : flash vert + zoom) au moment où un Pokémon est trouvé, avec
  scroll automatique pour le montrer.
- **Champ de saisie** : bouton croix pour effacer (visible dès qu'il y a du
  texte), tremblement (`shake`) + bordure rouge (uniquement, pas d'outline
  bleu de focus superposé — cf. `.text-input.shake:focus`) sur une réponse
  invalide (Pokémon inexistant, ou hors-ordre en mode séquentiel). La classe
  `shake` est retirée sur `animationend`, sinon elle rejouait au réaffichage
  de l'input (ex: en rejouant juste après une défaite).
- **Barre du quiz** (`#quiz-sticky-bar`) : barre de progression + compteur
  "trouvés / total", timer, champ de saisie et boutons Valider/Abandonner.
  N'est **plus** collante (`position: sticky` retiré) : elle scrolle avec la
  page comme le reste, à la demande de l'utilisateur (surtout gênant sur
  mobile, le clavier virtuel + une barre fixe en plus de l'en-tête laissait
  trop peu d'espace pour voir la grille). Seul l'en-tête (`.app-header`) reste
  collant. Le calcul de `--quiz-sticky-offset` (scroll-margin-top des cartes
  pour ne pas les cacher sous l'en-tête lors du scroll auto vers un Pokémon
  trouvé, dans `app.js` `updateStickyOffsets()`) ne tient plus compte que de
  la hauteur de l'en-tête.
- **Partage de résultat** : copie le texte (avec le lien) dans le
  presse-papiers directement, sans passer par le menu de partage natif de la
  plateforme (`navigator.share` volontairement pas utilisé). Image PNG
  générée en Canvas séparément (aucune dépendance externe). L'URL de partage
  encode la config exacte de la partie (génération, temps, aides, hardcore,
  séquentiel, permadeath) pour que la personne qui l'ouvre parte sur un pied
  d'égalité.
- **Stats de fin de partie** : précision, rythme (Pokémon/min), trouvaille la
  plus rapide/lente, premier/dernier trouvé — seulement si au moins un
  Pokémon a été trouvé.
- **Boutons de l'écran de résultats** : "🔁 Rejouer" relance directement une
  partie avec la config actuelle (appelle `startQuiz()` sans repasser par le
  setup) ; "⚙️ Configuration" ramène à l'écran de réglages pour changer la
  config ; "🏠 Accueil" fait la même chose que "Configuration" (redondant en
  l'état, gardé tel quel car pas demandé de le changer).
- Commandes de debug dans la console : `debug.fillQuiz()`,
  `debug.unlockAchievement(gen, key)`,
  `debug.gameOver()` (simule une défaite "Un seul essai" sans y jouer),
  `debug.toast(tone)` (tone: "shiny" | "achv" | rien, aperçu du rendu),
  `debug.resetAll()` (reset complet sans la boîte de confirmation),
  `debug.shiny()` (le prochain Pokémon attrapé pour de vrai sera Shiny — passe
  par `tryUnlockShiny`, donc déclenche aussi la notif) et `debug.shiny(id)`
  (débloque directement le Shiny d'un id précis, avec la même notif).
- **Validation automatique** : pensée pour la dictée vocale du clavier mobile
  (aucune intégration Web Speech API — le micro du clavier natif tape déjà
  dans le champ, pas besoin de code dédié). Dès que la saisie correspond
  **exactement** (`guessMatchDistance(guess, p) === 0`, jamais la tolérance
  aux fautes de frappe) à un Pokémon valide, un debounce de 500ms
  (`scheduleAutoSubmitCheck`, écouteur `input` sur `quizInputEl`) déclenche
  `quizFormEl.requestSubmit()` — réutilise donc tout le handler `submit`
  existant (tirage Shiny, toast, succès, stats, permadeath/séquentiel) plutôt
  que de dupliquer la logique. Volontairement limité aux matchs exacts (pas
  de fuzzy) : un match approximatif pourrait valider prématurément pendant
  que l'utilisateur tape encore un nom plus long. Toujours actif, pas de
  réglage dédié (comportement jugé strictement additif et à faible risque).
- **Anti-triche** : pendant une partie (`quizPhase === "playing"`), les
  boutons "Liste" et "Shiny Dex" du header sont désactivés (`setQuizNavLock`
  dans `app.js`, appelé depuis `startQuiz`/`endQuiz` dans `quiz.js`) — les
  deux affichent le nom de tous les Pokémon, ce qui permettait de les
  utiliser comme antisèche pendant le Quiz. Un petit texte l'explique sous la
  barre sticky. Se relâche dès que la partie se termine (temps écoulé,
  complétion à 100%, ou abandon).

### Succès (`achievements.js`)
- 11 par génération : terminer le Quiz (une fois), sous 30/15/10 min, en
  Hardcore, avec une difficulté donnée (Facile/Normal/Difficile/**Très
  difficile**), en mode **Chronologique**, ou en **Un seul essai** (sans
  perdre). Les 3 derniers ont été ajoutés après coup pour combler des trous
  du système d'origine (aucun succès pour "Très difficile", et les modes
  Chronologique/permadeath n'avaient jamais eu de succès dédié bien que plus
  difficiles que les presets existants).
- `checkAchievements(gen, { elapsedMs, hardcore, preset, mode, permadeath })`
  — `preset` reste `null` en mode Custom (aucun succès de difficulté nommée
  n'est jamais attribué en Custom, même si ses réglages reproduisent
  exactement un niveau nommé).
- Persistés indépendamment de la partie en cours ; ne se réinitialisent
  jamais sauf "Tout réinitialiser" dans les Réglages.

### Stats entre parties (`stats.js`)
- Clé `pokelist-quiz-stats`. Découpées par **mode nommé × difficulté**
  uniquement (8 compartiments : Classique/Chronologique × 4 niveaux),
  agrégées toutes générations confondues (non demandé de les scinder par
  génération). Custom n'a qu'un compteur de parties jouées — pas de détail,
  ses réglages étant arbitraires.
- Par compartiment : `gamesPlayed`, `completions`, `bestTimeMs` (seulement
  sur les parties complétées à 100%, `null` tant qu'aucune ne l'a été),
  `bestPercent`, `totalFound` (cumul de captures toutes parties confondues
  dans ce compartiment).
- `pokemonFound` : compteur **global** (tous modes confondus, y compris
  Custom) du nombre de fois où chaque Pokémon a été découvert — pas encore
  affiché dans l'UI (prévu pour un futur mode "Révision"), mais déjà
  alimenté par `recordPokemonFound(id)` à chaque capture réussie (y compris
  via `debug.fillQuiz()`, pour rester cohérent en tests).
- Hooks dans `quiz.js` : `recordGameStart` (dans `startQuiz`, juste après
  `quizPhase = "playing"`), `recordPokemonFound` (dans le handler de
  soumission, juste après `quizFound.add`), `recordGameEnd` (dans `endQuiz`,
  à côté du calcul de `completedGen`).
- Modale calquée sur Succès/Shiny Dex (`#stats-overlay`, bouton header 📊),
  mais **sans** onglets par génération (non pertinent ici) et **sans**
  verrouillage anti-triche (aucune réponse n'est révélée, contrairement à
  Liste/Shiny Dex).

### Shiny (`shiny.js` / `shinydex.js`)
- 1% de chance de débloquer la variante Shiny d'un Pokémon à chaque bonne
  réponse en Quiz (peu importe génération/preset). Déblocage définitif.
- Le Shiny Dex liste tous les Pokémon d'une génération avec leur sprite
  Shiny, en couleur si débloqué, grisé sinon.
- L'étoile `.shiny-sparkle` flotte en haut à gauche de la **carte**
  (`.pokemon-card`, plus proche ancêtre `position:relative`), pas sur le
  sprite — elle est donc placée en enfant direct du `<li>` dans le HTML, pas
  nichée dans `.sprite-wrap`. Exception : les puces "trouvé" du Quiz
  (`.found-chip`, pas une vraie carte) gardent l'étoile sur le sprite via un
  override CSS dédié.

### Notifications toast (`app.js`)
- `showToast({ icon, title, message, tone })`, empilées en bas à droite,
  auto-dismiss après ~4.5s ou au clic. Déclenchées sur nouveau Shiny débloqué
  (immédiat, pendant la partie) et sur succès débloqué(s) (à la fin de la
  partie, un toast par succès). Indépendantes de la vue affichée (conteneur
  fixed en dehors de `#view-quiz`/`#view-list`).

### Tooltip custom (`app.js`)
- Un seul élément `.custom-tooltip` partagé, repositionné à chaque survol
  d'un `.info-icon` (délégation d'événements `pointerover`/`pointerout`/
  `focusin`/`focusout` sur `document`, pas d'écouteur par élément).
  Transition ~80ms (contre le délai natif du `title` du navigateur, jugé pas
  assez réactif). Texte lu dans `el.dataset.tooltip`, rempli à la traduction
  par `applyTranslations()` via `data-i18n-tooltip` (voir `i18n.js`) — on
  n'utilise **jamais** `title`/`data-i18n-title` sur un `.info-icon`, sinon
  le tooltip natif du navigateur s'affiche en plus du custom.

### Réglages (`settings.js`)
- Thème (auto/clair/sombre), taille des cartes (défaut : **medium**, pas
  large), sprites animés on/off, langue, "Tout réinitialiser" (efface tout
  le localStorage et recharge la page).

### PWA / Offline (`sw.js`)
- Deux caches : `pokelist-shell-vN` (HTML/CSS/JS/manifest/icônes) et
  `pokelist-sprites-v1` (sprites PokeAPI, mis en cache au fil de la
  navigation).
- Stratégie app shell : cache-first avec revalidation réseau en arrière-plan.
- ⚠️ **Voir "Pièges connus" ci-dessous — c'est la source d'un vrai bug déjà
  rencontré.**

## Décisions techniques importantes

- **Matching du Quiz** (`quiz.js`) : la validation d'une réponse choisit,
  parmi tous les Pokémon du roster dans la tolérance de faute de frappe
  (distance de Levenshtein ≤ 25% de la longueur du nom), celui dont la
  distance est **minimale** (`findClosestGuessMatch`), pas le premier trouvé
  dans l'ordre du Pokédex. Nécessaire car des noms proches (Nidoran/Nidorina/
  Nidorino) peuvent tous tomber dans la tolérance d'une même saisie.
- **Config Quiz toujours visible + désactivée hors Custom** : cf. section
  Features ci-dessus.
- **Numéro flottant plutôt qu'en colonne** sur les cartes Quiz : demande
  explicite, pour garder la carte à taille fixe sans dépendre du nombre de
  badges de types affichés.
- **Barre sticky unique** (`#quiz-sticky-bar`) englobant la barre de
  progression ET le formulaire, plutôt que juste le formulaire seul :
  permet d'avoir le compteur "X / Y trouvés" toujours visible au scroll.
- **GoatCounter** choisi comme solution d'analytics : gratuit, sans cookies,
  donc pas de bannière RGPD à gérer.

## Pièges connus / edge cases

- **Nidoran♀ / Nidoran♂** : une fois normalisés, les deux ont exactement le
  même texte (`normalize()` et `normalizeStrict()` suppriment ♀/♂ car ce ne
  sont pas des lettres/chiffres). C'est *voulu* de les laisser ambigus en
  tapant juste "Nidoran" (impossible de taper le symbole) — l'un ou l'autre,
  celui qui reste à trouver, sera accepté. Ce qui n'est **pas** voulu (et a
  été corrigé) c'est que ça matche aussi Nidorina/Nidorino : réglé par le
  choix du candidat à distance minimale plutôt que le premier trouvé.
- **`.pokemon-number` et `.text-input` sont des classes partagées** entre
  plusieurs vues (Liste, Quiz, récap, Shiny Dex / recherche Liste, input
  Quiz). Toute modification de leur style de base impacte plusieurs écrans à
  la fois — préférer des sélecteurs scopés (`.quiz-card .quiz-number`,
  `.input-clear-wrap .text-input`) pour les changements spécifiques au Quiz.
- **`body[data-card-size]`** pilote à la fois les cartes du mode Liste et
  celles du Quiz (règles CSS séparées mais déclenchées par le même attribut).
  Le défaut est `medium`, pas `large`.
- **`updateStickyOffsets()`** (`app.js`) mesure `quizStickyBarEl.offsetHeight`
  (pas `quizFormEl` seul) pour calculer le `scroll-margin-top` utilisé quand
  on scrolle jusqu'à un Pokémon révélé. Si la barre sticky est encore
  restructurée un jour, penser à vérifier cette fonction.
- **Service worker : bug déjà rencontré.** `SHELL_CACHE` dans `sw.js` doit
  être bumpé (`pokelist-shell-vN` → `vN+1`) **à chaque fois qu'un fichier de
  `SHELL_ASSETS` change** (HTML/CSS/JS de l'app shell). Sinon, les visiteurs
  qui ont déjà ouvert le site peuvent recevoir un mélange incohérent
  d'anciens et nouveaux fichiers (la stratégie est "cache d'abord, revalide
  en arrière-plan" par fichier individuel), ce qui peut casser des features
  au hasard sans erreur évidente. C'est déjà arrivé une fois (réglage taille
  des cartes qui semblait cassé).
- **`version.js`** (`APP_VERSION`, affiché dans le header) doit être bumpé à
  chaque commit fonctionnel — sert de repère visuel simple pour vérifier
  qu'une mise à jour est bien arrivée jusqu'à l'utilisateur.

## Convention à suivre pour la suite

1. Implémenter le changement.
2. Tester visuellement (voir méthode ci-dessous) avant de pousser.
3. Bumper `version.js`.
4. Si un fichier listé dans `SHELL_ASSETS` (`sw.js`) a changé : bumper aussi
   `SHELL_CACHE`.
5. Commit + push sur la branche de travail.

### Méthode de test visuel utilisée en session

Pas de suite de tests automatisés dans ce repo. Pour vérifier une feature
avant de pousser :

```bash
python3 -m http.server 8910   # sert le repo en local
```

Puis un script Node avec Playwright (Chromium pré-installé dans
l'environnement, pas besoin de `playwright install`) :

```js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
```

Utile pour naviguer/cliquer dans l'app, lire des valeurs calculées
(`page.evaluate(...)`) et prendre des captures d'écran de contrôle.

## Historique résumé des sessions

1. Ajout de GoatCounter (analytics).
2. Refonte des cartes Quiz (taille fixe, disposition), animation de
   découverte, mode "Ordre croissant", config toujours visible/désactivée.
3. Numéro de carte Quiz passé en flottant (haut-droite).
4. Tremblement de l'input sur mauvaise réponse, bouton croix, barre de
   progression rendue sticky avec compteur.
5. Fix : bump du cache du service worker (cause du bug "réglage de taille
   qui ne marche plus").
6. Fix : matching du Quiz (Nidoran/Nidorina/Nidorino se marchaient dessus).
7. Ajout de ce fichier de notes.
8. Anti-triche : verrouillage de "Liste" et "Shiny Dex" pendant une partie.
9. Nouveau mode Quiz "Un seul essai" (permadeath), combinable avec "Ordre
   croissant".
10. Partage = copie presse-papiers uniquement (plus de menu natif), fix
    tremblement de l'input au rejeu, fix bordure bleu+rouge, système de
    notifications toast (Shiny/succès), séparation Rejouer/Configuration,
    étoile Shiny repositionnée sur la carte (pas l'image).
11. Ajout de `debug.gameOver()`, `debug.toast()`, `debug.resetAll()`, et
    remplacement de `debug.unlockShiny` par `debug.shiny()` (force le prochain
    tirage + notif).
12. Refonte complète de la pré-configuration du Quiz : 2 modes nommés
    ("Remplir le Pokédex" / "Dans l'ordre") × 4 difficultés + mode Custom
    redessiné compact avec tooltips, nouveau widget "indice sur le prochain"
    (type + 1ère lettre) pour le mode "Dans l'ordre"/Facile.
13. Retour sur la disposition : panneau détaillé à nouveau toujours visible
    (grisé + aperçu) au lieu de caché hors Custom ; tooltips déplacés sur une
    icône "(?)" dédiée au lieu de toute la ligne/bouton ; au passage, fix
    d'un bug où 3 tooltips (grille/types/lettre) affichaient le libellé du
    toggle au lieu de sa description.
14. Tooltips retirés des boutons de difficulté (gardés seulement sur les
    réglages Custom) ; tooltip **custom** (`.custom-tooltip` dans `app.js` +
    `data-i18n-tooltip`/`data-tooltip` dans `i18n.js`) en remplacement du
    `title` natif du navigateur, jugé trop lent à s'afficher ; modes de jeu
    renommés "Classique"/"Chronologique" (au lieu de décrire le mécanisme) et
    disposés en une colonne centrée (`.settings-options-column`).
15. 3 nouveaux succès (Très difficile, Chronologique, Un seul essai) pour
    combler les trous du système existant, et ajout des Stats entre parties
    (`stats.js`, nouvelle modale 📊) découpées par mode × difficulté, à la
    demande de l'utilisateur.
16. Validation automatique de la réponse (Quiz) : dès qu'un match exact est
    tapé/dicté, soumission automatique après un court debounce — pensé pour
    la dictée vocale du clavier mobile (pas d'intégration Web Speech API).
17. Bouton "Commencer" déplacé au-dessus des réglages sur l'écran de
    configuration du Quiz (juste sous la bande de succès).
18. Barre du quiz (progression, timer, champ de saisie, boutons) n'est plus
    collante : elle scrolle avec la page au lieu de rester fixée en haut,
    surtout pour libérer de l'espace sur mobile avec le clavier virtuel.
