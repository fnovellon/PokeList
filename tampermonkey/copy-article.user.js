// ==UserScript==
// @name         Copier le contenu de l'article
// @namespace    https://github.com/fnovellon/pokelist
// @version      1.0.0
// @description  Ajoute un bouton flottant qui copie uniquement le texte de l'article (sans menus, pub, commentaires, etc.)
// @author       fnovellon
// @match        *://*/*
// @noframes
// @grant        GM_setClipboard
// @require      https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'tm-copy-article-btn';

  function extractArticleText() {
    try {
      const clone = document.cloneNode(true);
      const article = new Readability(clone).parse();
      if (article && article.textContent.trim().length > 0) {
        return article.textContent.trim().replace(/\n{3,}/g, '\n\n');
      }
    } catch (e) {
      console.warn('[copy-article] Readability a échoué, fallback utilisé', e);
    }
    return fallbackExtract();
  }

  function fallbackExtract() {
    const selectors = ['article', '[role="article"]', 'main', '#content', '.post-content', '.article-content'];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 200) {
        return el.innerText.trim();
      }
    }
    return document.body.innerText.trim();
  }

  async function copyToClipboard(text) {
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(text, 'text');
      return true;
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  function createButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    const defaultLabel = "📋 Copier l'article";
    button.textContent = defaultLabel;

    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '2147483647',
      padding: '10px 16px',
      backgroundColor: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'sans-serif',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    });

    button.addEventListener('click', async () => {
      const text = extractArticleText();
      const ok = await copyToClipboard(text);
      button.textContent = ok ? '✅ Copié !' : '❌ Échec de la copie';
      setTimeout(() => {
        button.textContent = defaultLabel;
      }, 1500);
    });

    document.body.appendChild(button);
  }

  createButton();
})();
