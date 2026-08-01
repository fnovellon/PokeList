// ==UserScript==
// @name         Copier le contenu de l'article
// @namespace    https://github.com/fnovellon/pokelist
// @version      2.0.0
// @description  Ajoute un bouton flottant qui copie uniquement le texte de l'article (sans menus, pub, commentaires...), y compris quand le contenu est dans une iframe (même cross-origin)
// @author       fnovellon
// @match        *://*/*
// @grant        GM_setClipboard
// @require      https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'tm-copy-article-btn';
  const REQUEST_TYPE = 'TM_COPY_ARTICLE_REQUEST';
  const RESPONSE_TYPE = 'TM_COPY_ARTICLE_RESPONSE';
  const FRAME_TIMEOUT_MS = 1500;
  const isTopFrame = window.top === window;

  function extractLocalText() {
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

  function requestChildFrameText(frameWindow) {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      let settled = false;

      function onMessage(event) {
        if (event.source !== frameWindow) return;
        const data = event.data;
        if (!data || data.type !== RESPONSE_TYPE || data.requestId !== requestId) return;
        settled = true;
        window.removeEventListener('message', onMessage);
        resolve(data.text || '');
      }

      window.addEventListener('message', onMessage);
      frameWindow.postMessage({ type: REQUEST_TYPE, requestId }, '*');
      setTimeout(() => {
        if (!settled) {
          window.removeEventListener('message', onMessage);
          resolve('');
        }
      }, FRAME_TIMEOUT_MS);
    });
  }

  async function collectAllText() {
    const localText = extractLocalText();
    const frameWindows = Array.from(document.querySelectorAll('iframe'))
      .map((f) => f.contentWindow)
      .filter(Boolean);

    const frameTexts = await Promise.all(frameWindows.map(requestChildFrameText));
    const candidates = [localText, ...frameTexts].map((t) => (t || '').trim()).filter(Boolean);

    if (candidates.length === 0) return '';
    return candidates.reduce((longest, current) => (current.length > longest.length ? current : longest));
  }

  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || data.type !== REQUEST_TYPE || !event.source) return;
    const text = await collectAllText();
    event.source.postMessage({ type: RESPONSE_TYPE, requestId: data.requestId, text }, '*');
  });

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
      button.textContent = '⏳ Recherche...';
      const text = await collectAllText();
      const ok = text.length > 0 ? await copyToClipboard(text) : false;
      button.textContent = ok ? '✅ Copié !' : '❌ Échec de la copie';
      setTimeout(() => {
        button.textContent = defaultLabel;
      }, 1500);
    });

    document.body.appendChild(button);
  }

  if (isTopFrame) {
    createButton();
  }
})();
