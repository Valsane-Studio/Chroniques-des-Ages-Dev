/* DEV — Flux de choix intégral.
   Règle de DA :
   - toute décision / action / direction = encre bleue directement dans le récit ;
   - le lancer de dés lui-même reste un contrôle encadré transparent ;
   - exception : pendant une phase d'interaction tactique de combat, les réactions
     proposées restent elles aussi dans des cadres transparents.
   Les intégrations manuelles existantes (pages 003, 008, etc.) sont prioritaires.
   Ce filet de sécurité place tous les autres choix dans la prose, de 000 à la fin. */
(function () {
  'use strict';

  const storyText = document.getElementById('storyText');
  const choicesRoot = document.getElementById('choices');
  const storyCard = document.querySelector('.story-card');
  if (!storyText || !choicesRoot) return;

  const DIRECT_ROLL_RE = /^(?:jeter|relancer)\s+(?:les?|trois)\s+d[ée]s?\b|^lancer\s+(?:le|un|les|trois)\s+(?:trois\s+)?d[ée]s?\b/i;

  const STOP_WORDS = new Set([
    'a','au','aux','avec','ce','ces','cette','dans','de','des','du','et','en','la','le','les','leur','leurs',
    'lui','ne','pas','par','pour','que','qui','sa','sans','se','ses','son','sur','ta','te','tes','ton','tu','un','une',
    'vers','y','d','l','t','s','plus','encore','autre','autres','avant','apres','puis'
  ]);

  function buttonLabel(button) {
    return (button.querySelector('.choice-copy')?.textContent || button.textContent || '').trim();
  }

  function isDirectRollButton(button) {
    const label = buttonLabel(button);
    if (storyText.querySelector('.dice-test-waiting')) return true;
    return DIRECT_ROLL_RE.test(label);
  }

  /* Convention commune pour les combats actuels et futurs :
     une scène qui affiche .combat-interaction-prompt est une phase tactique où
     le monstre annonce son comportement et où les réactions restent encadrées.
     .shadow-tech-event maintient la compatibilité avec le prototype de la Masse. */
  function isCombatInteractionPhase() {
    return Boolean(storyText.querySelector('.combat-interaction-prompt, .shadow-tech-event'));
  }

  function cleanInlineLabel(label) {
    let text = String(label || '').trim().replace(/[.!?]+$/, '');

    /* Le choix narratif reste littéraire ; l'étape de lancer de dés sera affichée
       juste après, dans son propre cadre transparent. */
    text = text
      .replace(/\s+—\s+[^—]*(?:lancer|tester|test\s+de|épreuve\s+de|jet\s+de|dés?)\b.*$/i, '')
      .replace(/\s+—\s+\d+\s+restante?s?\b.*$/i, '')
      .replace(/\s*\((?=[^)]*(?:jet\s+de|test\s+de|dégâts?|riposte|dés?))[^)]*\)\s*$/i, '')
      .trim();

    if (!text) text = String(label || '').trim();
    return text.charAt(0).toLocaleLowerCase('fr-FR') + text.slice(1);
  }

  function normalize(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function stem(word) {
    let w = word;
    if (w.length > 8) w = w.replace(/(ements?|ations?|itions?)$/, '');
    if (w.length > 6) w = w.replace(/(iques?|euses?|eurs?|eaux)$/, '');
    if (w.length > 5) w = w.replace(/(ées?|es|s)$/, '');
    return w;
  }

  function tokens(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
      .map(stem);
  }

  function paragraphCandidates() {
    return Array.from(storyText.querySelectorAll('p')).filter(p => {
      if (!p.textContent.trim()) return false;
      if (p.closest('.dice-result, .combat-roll-result, .enemy-card, .adventure-conclusion, .ending-journal-recap')) return false;
      return true;
    });
  }

  function paragraphScore(paragraph, labelTokens) {
    const pTokens = tokens(paragraph.textContent);
    if (!pTokens.length || !labelTokens.length) return 0;
    let score = 0;
    labelTokens.forEach(token => {
      const exact = pTokens.includes(token);
      const close = !exact && pTokens.some(p => token.length >= 4 && p.length >= 4 && (p.startsWith(token) || token.startsWith(p)));
      if (exact) score += token.length >= 6 ? 3 : 2;
      else if (close) score += 1;
    });
    if (paragraph.querySelector('.inline-story-choice')) score -= 1.5;
    return score;
  }

  function nearestUnused(index, paragraphs, used) {
    if (!paragraphs.length) return null;
    if (!used.has(paragraphs[index])) return paragraphs[index];
    for (let radius = 1; radius < paragraphs.length; radius++) {
      const before = index - radius;
      const after = index + radius;
      if (before >= 0 && !used.has(paragraphs[before])) return paragraphs[before];
      if (after < paragraphs.length && !used.has(paragraphs[after])) return paragraphs[after];
    }
    return paragraphs[index];
  }

  function chooseParagraph(paragraphs, label, order, count, used) {
    const labelTokens = tokens(label);
    let best = null;
    let bestScore = -Infinity;

    paragraphs.forEach(p => {
      const score = paragraphScore(p, labelTokens) - (used.has(p) ? 3 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    });

    /* Si le récit contient réellement les mots du choix, on s'y accroche.
       Sinon on répartit les décisions dans la seconde moitié de la scène :
       jamais une grappe de liens ajoutée à la fin. */
    if (best && bestScore >= 2) return best;

    if (count <= 1) return paragraphs[paragraphs.length - 1] || best;
    const progress = order / Math.max(1, count - 1);
    const ratio = 0.55 + (0.43 * progress);
    const index = Math.max(0, Math.min(paragraphs.length - 1, Math.round((paragraphs.length - 1) * ratio)));
    return nearestUnused(index, paragraphs, used) || best || paragraphs[paragraphs.length - 1];
  }

  function sentenceLead(label, order) {
    const n = normalize(label);
    const combat = /^(frapper|attaquer|affronter|degainer|te defendre|lancer une lame|tuer|achever|charger|surgir)/.test(n);
    const dialogue = /^(lui |parler|demander|annoncer|dire|repondre|garder le silence|ne rien)/.test(n);

    if (combat) return order % 2 ? 'Tu peux aussi ' : 'Tu peux ';
    if (dialogue) return order % 2 ? 'Tu peux aussi ' : 'Tu peux ';
    return order % 3 === 1 ? 'Tu peux aussi ' : 'Tu peux ';
  }

  function appendInlineChoice(paragraph, index, label, order) {
    if (!paragraph) return;

    const holder = document.createElement('span');
    holder.className = 'fluid-choice-sentence';

    const link = document.createElement('span');
    link.className = 'inline-story-choice inline-story-choice-in-text inline-story-pill fluid-choice-generated';
    link.dataset.choiceIndex = String(index);
    link.setAttribute('role', 'button');
    link.setAttribute('tabindex', '0');
    link.textContent = cleanInlineLabel(label);

    holder.appendChild(document.createTextNode(sentenceLead(label, order)));
    holder.appendChild(link);
    holder.appendChild(document.createTextNode('.'));

    paragraph.appendChild(document.createTextNode(' '));
    paragraph.appendChild(holder);
  }

  function syncChoices() {
    /* Les deux pages de prologue / fiche gardent leurs contrôles propres.
       La règle demandée commence à la page 000. */
    if (storyCard?.classList.contains('sheet-page')) return;

    const buttons = Array.from(choicesRoot.querySelectorAll('.choice-btn'));
    if (!buttons.length) return;

    const interactionPhase = isCombatInteractionPhase();

    const existingIndexes = new Set(
      Array.from(storyText.querySelectorAll('.inline-story-choice[data-choice-index]'))
        .map(el => Number(el.dataset.choiceIndex))
        .filter(Number.isFinite)
    );

    const narrative = [];

    buttons.forEach((button, index) => {
      button.classList.remove('fluid-choice-source-hidden', 'fluid-roll-control', 'fluid-combat-interaction-control');

      if (isDirectRollButton(button)) {
        button.classList.add('fluid-roll-control');
        return;
      }

      /* Pendant un moment tactique de combat, le comportement adverse est annoncé
         dans le récit et les réactions du joueur restent volontairement séparées,
         dans leurs cadres transparents. */
      if (interactionPhase) {
        button.classList.add('fluid-combat-interaction-control');
        return;
      }

      /* Tout le reste appartient au récit : direction, interaction, action de
         combat ordinaire, lame de jet, décision morale, objet, reprise, etc. */
      button.classList.add('fluid-choice-source-hidden');

      if (!existingIndexes.has(index)) {
        narrative.push({ index, button, label: buttonLabel(button) });
      }
    });

    if (!narrative.length) return;

    let paragraphs = paragraphCandidates();
    if (!paragraphs.length) {
      const p = document.createElement('p');
      storyText.appendChild(p);
      paragraphs = [p];
    }

    const used = new Set();
    narrative.forEach((entry, order) => {
      const target = chooseParagraph(paragraphs, cleanInlineLabel(entry.label), order, narrative.length, used);
      appendInlineChoice(target, entry.index, entry.label, order);
      if (target) used.add(target);
    });
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncChoices();
    });
  }

  new MutationObserver(schedule).observe(choicesRoot, { childList: true, subtree: true });
  schedule();

  const style = document.createElement('style');
  style.id = 'fluid-choice-flow-style';
  style.textContent = `
    /* Une décision n'existe plus comme bouton séparé. Le bouton source reste
       dans le DOM uniquement pour conserver toute la logique du moteur. */
    #choices .choice-btn.fluid-choice-source-hidden {
      display: none !important;
    }

    /* ENCRE INTERACTIVE — référence pages 003 / 008. */
    .story-text .inline-story-choice,
    .story-text .inline-story-choice.inline-story-pill,
    .story-text .inline-story-choice-in-text,
    .story-text .fluid-choice-generated {
      display: inline !important;
      width: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      outline: none !important;
      background: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
      filter: none !important;
      color: #365f79 !important;
      -webkit-text-fill-color: #365f79 !important;
      text-shadow: none !important;
      font: inherit !important;
      font-weight: inherit !important;
      font-style: inherit !important;
      font-variant: inherit !important;
      text-transform: inherit !important;
      line-height: inherit !important;
      letter-spacing: inherit !important;
      text-align: inherit !important;
      vertical-align: baseline !important;
      cursor: pointer !important;
      white-space: normal !important;
      -webkit-tap-highlight-color: rgba(54,95,121,.16) !important;
      touch-action: manipulation;
    }

    .story-text .inline-story-choice:hover,
    .story-text .inline-story-choice:focus,
    .story-text .inline-story-choice:focus-visible {
      border: 0 !important;
      background: transparent !important;
      color: #294f68 !important;
      -webkit-text-fill-color: #294f68 !important;
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: .12em;
    }

    .story-text .inline-story-choice:active,
    .story-text .inline-story-choice-pressed {
      border: 0 !important;
      background: transparent !important;
      color: #203f55 !important;
      -webkit-text-fill-color: #203f55 !important;
    }

    .fluid-choice-sentence {
      display: inline;
      font: inherit;
      color: inherit;
    }

    /* LANCER DE DÉS + INTERACTION TACTIQUE DE COMBAT : cadres transparents. */
    #choices .choice-btn.fluid-roll-control,
    #choices .choice-btn.fluid-roll-control:hover,
    #choices .choice-btn.fluid-roll-control:focus,
    #choices .choice-btn.fluid-roll-control:focus-visible,
    #choices .choice-btn.fluid-roll-control:active,
    #choices .choice-btn.fluid-combat-interaction-control,
    #choices .choice-btn.fluid-combat-interaction-control:hover,
    #choices .choice-btn.fluid-combat-interaction-control:focus,
    #choices .choice-btn.fluid-combat-interaction-control:focus-visible,
    #choices .choice-btn.fluid-combat-interaction-control:active {
      display: block !important;
      width: 100% !important;
      min-height: 44px !important;
      margin: 7px 0 !important;
      padding: 10px 14px !important;
      border: 1px solid rgba(58,46,32,.72) !important;
      border-radius: 3px !important;
      outline: none !important;
      outline-offset: 0 !important;
      background: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
      color: #2b2117 !important;
      -webkit-text-fill-color: #2b2117 !important;
      text-shadow: none !important;
      font-family: var(--body-font, Georgia, 'Times New Roman', serif) !important;
      font-size: inherit !important;
      font-weight: 400 !important;
      text-transform: none !important;
      letter-spacing: normal !important;
      line-height: 1.45 !important;
      text-align: left !important;
      transform: none !important;
    }

    #choices .choice-btn.fluid-roll-control .choice-copy,
    #choices .choice-btn.fluid-roll-control .choice-copy *,
    #choices .choice-btn.fluid-roll-control .choice-dest,
    #choices .choice-btn.fluid-combat-interaction-control .choice-copy,
    #choices .choice-btn.fluid-combat-interaction-control .choice-copy *,
    #choices .choice-btn.fluid-combat-interaction-control .choice-dest {
      color: #2b2117 !important;
      -webkit-text-fill-color: #2b2117 !important;
      text-shadow: none !important;
      font: inherit !important;
      text-transform: none !important;
      letter-spacing: normal !important;
      text-align: left !important;
    }

    #choices .choice-btn.fluid-roll-control .choice-arrow,
    #choices .choice-btn.fluid-roll-control .choice-dest,
    #choices .choice-btn.fluid-combat-interaction-control .choice-arrow,
    #choices .choice-btn.fluid-combat-interaction-control .choice-dest {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
})();
