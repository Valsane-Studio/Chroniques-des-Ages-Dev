/* DEV — Prototype de choix narratifs intégrés au récit : pages 001 à 022. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book) return;

  /* Page 020 est un cas particulier : les deux directions sont déjà décrites
     dans le corps du récit. On transforme donc directement ces phrases au lieu
     d'ajouter une seconde formulation en dessous. */
  const scene20 = book.story?.c20;
  if (scene20 && !scene20.__inlineNarrativePrototype) {
    const originalText20 = scene20.text;
    scene20.text = state => {
      let html = typeof originalText20 === 'function' ? originalText20(state) : originalText20;
      if (!html) return html;

      html = html.replace(
        '<p>L’un <strong>descend</strong> dans l’obscurité, et de ce passage monte une <strong>forte odeur de soufre</strong>.</p>',
        '<button type="button" class="inline-story-choice inline-story-choice-in-text" data-choice-index="0"><span class="inline-story-choice-mark" aria-hidden="true">›</span><span class="inline-story-choice-copy">L’un descend dans l’obscurité, et de ce passage monte une forte odeur de soufre.</span></button>'
      );

      html = html.replace(
        '<p>L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</p>',
        '<button type="button" class="inline-story-choice inline-story-choice-in-text" data-choice-index="1"><span class="inline-story-choice-mark" aria-hidden="true">›</span><span class="inline-story-choice-copy">L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</span></button>'
      );

      return html;
    };
    scene20.__inlineNarrativePrototype = true;
  }

  function currentPageNumber() {
    const chapterNumber = document.getElementById('chapterNumber');
    const match = (chapterNumber?.textContent || '').match(/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function lowerFirst(text) {
    if (!text) return '';
    return text.charAt(0).toLocaleLowerCase('fr-FR') + text.slice(1);
  }

  function deInfinitive(text) {
    const lower = lowerFirst(text.trim());
    return /^[aeiouyhàâäéèêëîïôöùûüœ]/i.test(lower) ? `d’${lower}` : `de ${lower}`;
  }

  /* Le libellé d'origine reste la source fonctionnelle. Ici on ne change que
     sa formulation visible : chaque choix doit pouvoir se lire comme la phrase
     suivante du récit, et non comme une commande de menu. */
  function narrativeChoiceText(label) {
    const raw = String(label || '').trim().replace(/[.\s]+$/, '');
    if (!raw) return '';

    const exact = {
      'Fouiller la sacoche de Sir Aldren': 'Tu t’approches de la selle et décides de fouiller la sacoche de Sir Aldren.',
      'Aller au village demander de l’aide': 'Avant de partir, tu peux retourner au village et demander de l’aide.',
      'Partir immédiatement vers la grotte': 'Tu peux aussi partir immédiatement vers la grotte, sans attendre davantage.',
      'Rejoindre les écuries': 'Tu quittes ce que tu étais en train de faire et te diriges vers les écuries.'
    };
    if (exact[raw]) return exact[raw];

    let m;
    if ((m = raw.match(/^Se\s+(.+)/i))) return `Tu peux décider de te ${lowerFirst(m[1])}.`;
    if ((m = raw.match(/^S['’](.+)/i))) return `Tu peux décider de t’${lowerFirst(m[1])}.`;

    if (/^(Examiner|Inspecter|Fouiller|Observer|Chercher)\b/i.test(raw)) {
      return `Tu peux prendre le temps ${deInfinitive(raw)}.`;
    }
    if (/^(Accepter|Refuser|Suivre|Choisir|Répondre)\b/i.test(raw)) {
      return `Tu peux choisir ${deInfinitive(raw)}.`;
    }
    if (/^(Retourner|Revenir|Faire demi-tour|Fuir)\b/i.test(raw)) {
      return `Tu peux décider ${deInfinitive(raw)}.`;
    }
    if (/^(Tenter|Essayer)\b/i.test(raw)) {
      return `Tu peux ${lowerFirst(raw)}.`;
    }
    if (/^(Continuer|Poursuivre|Avancer|Descendre|Monter|Entrer|Traverser|Prendre|Rejoindre|Partir|Quitter|Aller|Ouvrir|Passer|Emprunter|S’approcher|S'approcher)\b/i.test(raw)) {
      return `Tu peux ${lowerFirst(raw)}.`;
    }

    return `Tu peux choisir ${deInfinitive(raw)}.`;
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

    function removeGeneratedChoices() {
      storyText.querySelectorAll('.inline-story-choices-generated').forEach(node => node.remove());
      sourceButtons().forEach(btn => btn.classList.remove('inline-choice-source-hidden'));
    }

    function buildGeneratedChoices() {
      scheduled = false;
      const page = currentPageNumber();
      const inRange = Number.isInteger(page) && page >= 1 && page <= 22;
      const existingInText = storyText.querySelectorAll('.inline-story-choice-in-text');

      removeGeneratedChoices();

      if (!inRange) {
        document.body.classList.remove('has-inline-story-choices');
        return;
      }

      const buttons = sourceButtons();
      if (!buttons.length) {
        document.body.classList.toggle('has-inline-story-choices', existingInText.length > 0);
        return;
      }

      /* Les actions mécaniques gardent leur vrai bouton. Les déplacements,
         décisions et réactions narratives deviennent des phrases du récit. */
      const narrativeIndexes = [];
      buttons.forEach((btn, index) => {
        const copy = btn.querySelector('.choice-copy > span')?.textContent?.trim() || btn.textContent.trim();
        const mechanical = btn.classList.contains('combat-roll-btn') ||
          /\b(jeter|lancer)\s+(?:les?|un|une)?\s*d[ée]s\b/i.test(copy) ||
          /\bboire\b.*\bpotion\b/i.test(copy) ||
          /\butiliser\b.*\b(objet|potion|lame|arme)\b/i.test(copy);
        if (!mechanical) narrativeIndexes.push({ index, copy, btn });
      });

      /* Sur la page 020, les deux choix sont déjà insérés exactement à
         l'endroit où les chemins sont décrits. */
      const alreadyInline = new Set(
        Array.from(existingInText).map(el => Number(el.dataset.choiceIndex)).filter(Number.isFinite)
      );

      const toGenerate = narrativeIndexes.filter(item => !alreadyInline.has(item.index));
      if (toGenerate.length) {
        const group = document.createElement('div');
        group.className = 'inline-story-choices-generated';
        group.setAttribute('aria-label', 'Choix possibles');

        toGenerate.forEach(({ index, copy }) => {
          const inline = document.createElement('button');
          inline.type = 'button';
          inline.className = 'inline-story-choice';
          inline.dataset.choiceIndex = String(index);
          inline.innerHTML = '<span class="inline-story-choice-mark" aria-hidden="true">›</span><span class="inline-story-choice-copy"></span>';
          inline.querySelector('.inline-story-choice-copy').textContent = narrativeChoiceText(copy);
          group.appendChild(inline);
        });

        storyText.appendChild(group);
      }

      narrativeIndexes.forEach(({ btn }) => btn.classList.add('inline-choice-source-hidden'));
      document.body.classList.toggle('has-inline-story-choices', narrativeIndexes.length > 0 || existingInText.length > 0);
    }

    function scheduleBuild() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(buildGeneratedChoices);
    }

    storyText.addEventListener('click', event => {
      const inlineChoice = event.target.closest('.inline-story-choice[data-choice-index]');
      if (!inlineChoice) return;

      const index = Number(inlineChoice.dataset.choiceIndex);
      const source = sourceButtons()[index];
      if (!source) return;

      inlineChoice.disabled = true;
      source.click();
    });

    /* Important : ne pas observer storyText ici. Le prototype y ajoute lui-même
       ses choix, ce qui créerait une boucle de MutationObserver. Les choix et le
       numéro de page sont reconstruits par le lecteur à chaque navigation et
       suffisent donc à déclencher la mise à jour. */
    const observer = new MutationObserver(scheduleBuild);
    observer.observe(choices, { childList: true });
    if (chapterNumber) observer.observe(chapterNumber, { childList: true, characterData: true, subtree: true });

    scheduleBuild();
  }

  const style = document.createElement('style');
  style.id = 'inline-story-choice-prototype-style';
  style.textContent = `
    #choices .inline-choice-source-hidden {
      display: none !important;
    }

    .inline-story-choices-generated {
      display: grid;
      gap: 12px;
      margin: 22px 0 4px;
    }

    .inline-story-choice {
      -webkit-appearance: none;
      appearance: none;
      display: grid;
      grid-template-columns: 30px minmax(0, 1fr);
      align-items: start;
      gap: 10px;
      width: 100%;
      margin: 14px 0;
      padding: 12px 14px 12px 10px;
      border: 1px solid rgba(91, 64, 36, .22);
      border-left: 3px solid rgba(91, 64, 36, .62);
      border-radius: 3px;
      background: rgba(91, 64, 36, .055);
      color: inherit;
      font: inherit;
      font-weight: inherit;
      line-height: 1.45;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: rgba(91, 64, 36, .18);
      touch-action: manipulation;
    }

    .inline-story-choices-generated .inline-story-choice {
      margin: 0;
    }

    .inline-story-choice-mark {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      margin-top: .08em;
      border: 1px solid rgba(91, 64, 36, .48);
      border-radius: 50%;
      font-size: .95em;
      line-height: 1;
      opacity: .86;
    }

    .inline-story-choice-copy {
      display: block;
      min-width: 0;
    }

    .inline-story-choice:active {
      background: rgba(91, 64, 36, .14);
      border-color: rgba(91, 64, 36, .42);
      border-left-color: rgba(91, 64, 36, .9);
      transform: translateY(1px);
    }

    .inline-story-choice:focus-visible {
      outline: 2px solid rgba(91, 64, 36, .58);
      outline-offset: 3px;
    }

    .inline-story-choice:disabled {
      opacity: .62;
    }

    @media (max-width: 700px) {
      .inline-story-choices-generated {
        gap: 10px;
        margin-top: 18px;
      }

      .inline-story-choice {
        grid-template-columns: 28px minmax(0, 1fr);
        gap: 9px;
        min-height: 52px;
        margin: 13px 0;
        padding: 11px 12px 11px 9px;
        line-height: 1.48;
      }

      .inline-story-choice-mark {
        width: 23px;
        height: 23px;
      }
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
