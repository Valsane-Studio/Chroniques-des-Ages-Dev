/* DEV — Prototype "encre interactive" : prologue narratif + pages 000 à 020. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book) return;

  const INTERACTIVE_MIN_PAGE = 0;
  const INTERACTIVE_MAX_PAGE = 20;

  /* Page 020 : les directions sont déjà décrites dans le récit.
     On ne recrée donc pas un bloc de choix en dessous : les morceaux de phrase
     concernés deviennent eux-mêmes interactifs. */
  const scene20 = book.story?.c20;
  if (scene20 && !scene20.__interactiveInkPrototype) {
    const originalText20 = scene20.text;
    scene20.text = state => {
      let html = typeof originalText20 === 'function' ? originalText20(state) : originalText20;
      if (!html) return html;

      html = html.replace(
        '<p>L’un <strong>descend</strong> dans l’obscurité, et de ce passage monte une <strong>forte odeur de soufre</strong>.</p>',
        '<p><span class="inline-story-choice inline-story-choice-in-text inline-story-pill" data-choice-index="0" role="button" tabindex="0">L’un descend dans l’obscurité</span>, et de ce passage monte une forte odeur de soufre.</p>'
      );

      html = html.replace(
        '<p>L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</p>',
        '<p><span class="inline-story-choice inline-story-choice-in-text inline-story-pill" data-choice-index="1" role="button" tabindex="0">L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit</span>.</p>'
      );

      return html;
    };
    scene20.__interactiveInkPrototype = true;
  }

  function currentPageNumber() {
    const chapterNumber = document.getElementById('chapterNumber');
    const match = (chapterNumber?.textContent || '').match(/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function lowerFirst(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    return value.charAt(0).toLocaleLowerCase('fr-FR') + value.slice(1);
  }

  function stripMechanicalSuffix(text) {
    return String(text || '')
      .replace(/\s*[—-]\s*\d+\s+restante?s?.*$/i, '')
      .replace(/\s*\([^)]*(?:Dext[ée]rit[ée]|d[ée]g[âa]ts?|Protection|Vie)[^)]*\)\s*$/i, '')
      .trim();
  }

  /* Les libellés courts du moteur deviennent des fragments de prose.
     On garde volontairement l'infinitif : il s'insère naturellement dans les
     phrases qui entourent les choix, sans répéter "tu peux" à chaque fois. */
  function proseFragment(label) {
    const raw = stripMechanicalSuffix(String(label || '').trim().replace(/[.\s]+$/, ''));
    const exact = {
      'Rejoindre les écuries': 'rejoindre les écuries',
      'Fouiller la sacoche de Sir Aldren': 'fouiller la sacoche de Sir Aldren',
      'Aller au village demander de l’aide': 'retourner au village demander de l’aide',
      'Partir immédiatement vers la grotte': 'partir immédiatement vers la grotte',
      'Voir le marchand': 'passer voir le marchand',
      'Voir la forgeronne': 'aller voir la forgeronne',
      'Approcher la personne dans la ruelle': 'aller à la rencontre de la personne dans la ruelle',
      'Partir vers la grotte': 'quitter Valombre et prendre la route de la grotte'
    };
    return exact[raw] || lowerFirst(raw);
  }

  function isMechanicalChoice(btn, copy) {
    return btn.classList.contains('combat-roll-btn') ||
      /\b(jeter|lancer)\s+(?:les?|un|une)?\s*d[ée]\b/i.test(copy) ||
      /\b(jeter|lancer)\s+(?:les?|un|une)?\s*d[ée]s\b/i.test(copy) ||
      /\brappeler\b.*\br[èe]gles\b/i.test(copy) ||
      /\bvoir\b.*\br[èe]gles\b/i.test(copy) ||
      /\bboire\b.*\bpotion\b/i.test(copy) ||
      /\butiliser\b.*\b(objet|potion|lame|arme)\b/i.test(copy);
  }

  function inlineChoice(index, copy) {
    const span = document.createElement('span');
    span.className = 'inline-story-choice inline-story-pill inline-story-choice-generated';
    span.dataset.choiceIndex = String(index);
    span.setAttribute('role', 'button');
    span.setAttribute('tabindex', '0');
    span.textContent = proseFragment(copy);
    return span;
  }

  function appendWithSeparators(container, items, conjunction) {
    items.forEach((item, i) => {
      if (i > 0) {
        const last = i === items.length - 1;
        container.appendChild(document.createTextNode(last ? ` ${conjunction} ` : ', '));
      }
      container.appendChild(item.node);
    });
  }

  function buildDecisionParagraph(items, page) {
    if (!items.length) return null;
    const p = document.createElement('p');
    p.className = 'inline-story-decision-generated';

    if (items.length === 1) {
      const openings = [
        'Sans attendre davantage, tu décides de ',
        'La suite s’impose : ',
        'Tu poursuis en choisissant de ',
        'Il ne te reste plus qu’à '
      ];
      p.appendChild(document.createTextNode(openings[Math.abs(page || 0) % openings.length]));
      p.appendChild(items[0].node);
      p.appendChild(document.createTextNode('.'));
      return p;
    }

    if (items.length === 2) {
      const openings = [
        'Tu hésites encore entre ',
        'Deux possibilités restent devant toi : ',
        'À cet instant, deux voies te semblent possibles : '
      ];
      p.appendChild(document.createTextNode(openings[Math.abs(page || 0) % openings.length]));
      appendWithSeparators(p, items, 'ou');
      p.appendChild(document.createTextNode('.'));
      return p;
    }

    const openings = [
      'Avant d’aller plus loin, plusieurs possibilités s’offrent encore à toi : ',
      'Tu prends un instant pour décider : ',
      'Autour de toi, plusieurs pistes restent ouvertes : '
    ];
    p.appendChild(document.createTextNode(openings[Math.abs(page || 0) % openings.length]));
    appendWithSeparators(p, items, 'ou');
    p.appendChild(document.createTextNode('.'));
    return p;
  }

  function install() {
    const storyText = document.getElementById('storyText');
    const choices = document.getElementById('choices');
    const chapterNumber = document.getElementById('chapterNumber');
    if (!storyText || !choices) return;

    let scheduled = false;

    function sourceButtons() {
      return Array.from(choices.querySelectorAll('.choice-btn'));
    }

    function clearGenerated() {
      storyText.querySelectorAll('.inline-story-decision-generated').forEach(node => node.remove());
      sourceButtons().forEach(btn => btn.classList.remove('inline-choice-source-hidden'));
    }

    function buildInteractiveInk() {
      scheduled = false;
      const page = currentPageNumber();
      const inRange = Number.isInteger(page) && page >= INTERACTIVE_MIN_PAGE && page <= INTERACTIVE_MAX_PAGE;
      const existingInText = Array.from(storyText.querySelectorAll('.inline-story-choice-in-text[data-choice-index]'));

      clearGenerated();

      if (!inRange) return;

      const buttons = sourceButtons();
      if (!buttons.length) return;

      const narrative = [];
      buttons.forEach((btn, index) => {
        const copy = btn.querySelector('.choice-copy > span')?.textContent?.trim() || btn.textContent.trim();
        if (!isMechanicalChoice(btn, copy)) narrative.push({ index, copy, btn });
      });

      const alreadyInline = new Set(
        existingInText.map(el => Number(el.dataset.choiceIndex)).filter(Number.isFinite)
      );

      narrative.forEach(({ btn }) => btn.classList.add('inline-choice-source-hidden'));

      const toGenerate = narrative
        .filter(item => !alreadyInline.has(item.index))
        .map(item => ({ ...item, node: inlineChoice(item.index, item.copy) }));

      if (toGenerate.length) {
        const paragraph = buildDecisionParagraph(toGenerate, page);
        if (paragraph) storyText.appendChild(paragraph);
      }
    }

    function scheduleBuild() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(buildInteractiveInk);
    }

    function activateInlineChoice(target) {
      const index = Number(target?.dataset?.choiceIndex);
      if (!Number.isFinite(index)) return;
      const source = sourceButtons()[index];
      if (!source) return;
      target.classList.add('inline-story-choice-pressed');
      target.setAttribute('aria-disabled', 'true');
      source.click();
    }

    storyText.addEventListener('click', event => {
      const target = event.target.closest('.inline-story-choice[data-choice-index]');
      if (!target) return;
      activateInlineChoice(target);
    });

    storyText.addEventListener('keydown', event => {
      const target = event.target.closest('.inline-story-choice[data-choice-index]');
      if (!target || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      activateInlineChoice(target);
    });

    /* Le lecteur reconstruit #choices et le numéro de page à chaque navigation.
       On n'observe volontairement pas storyText : le prototype y écrit lui-même. */
    const observer = new MutationObserver(scheduleBuild);
    observer.observe(choices, { childList: true });
    if (chapterNumber) observer.observe(chapterNumber, { childList: true, characterData: true, subtree: true });

    scheduleBuild();
  }

  const style = document.createElement('style');
  style.id = 'interactive-ink-prototype-style';
  style.textContent = `
    #choices .inline-choice-source-hidden {
      display: none !important;
    }

    .inline-story-decision-generated {
      margin-top: 1.05em;
    }

    .inline-story-choice.inline-story-pill,
    .inline-story-choice-in-text {
      display: inline;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: #365f79;
      font: inherit;
      font-weight: inherit;
      line-height: inherit;
      text-align: inherit;
      vertical-align: baseline;
      box-shadow: none;
      cursor: pointer;
      -webkit-tap-highlight-color: rgba(54, 95, 121, .16);
      touch-action: manipulation;
    }

    .inline-story-choice.inline-story-pill:active,
    .inline-story-choice-in-text:active,
    .inline-story-choice-pressed {
      color: #203f55;
    }

    .inline-story-choice.inline-story-pill:focus-visible,
    .inline-story-choice-in-text:focus-visible {
      outline: 1px dotted rgba(54, 95, 121, .75);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
