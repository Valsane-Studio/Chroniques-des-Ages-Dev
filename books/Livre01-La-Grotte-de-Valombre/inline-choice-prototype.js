/* DEV — Prototype "encre interactive" : uniquement des choix intégrés dans la prose. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book) return;

  /* Page 020 : les directions sont déjà décrites dans le récit.
     Elles deviennent directement interactives, sans bloc de choix ajouté ensuite. */
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

  function install() {
    const storyText = document.getElementById('storyText');
    const choices = document.getElementById('choices');
    const chapterNumber = document.getElementById('chapterNumber');
    if (!storyText || !choices) return;

    let scheduled = false;

    function sourceButtons() {
      return Array.from(choices.querySelectorAll('.choice-btn'));
    }

    function syncInlineChoices() {
      scheduled = false;
      const buttons = sourceButtons();
      buttons.forEach(btn => btn.classList.remove('inline-choice-source-hidden'));

      /* Règle : on ne masque un bouton source que si son équivalent est déjà
         explicitement présent dans la prose. Aucun choix n'est généré ici. */
      const inlineIndexes = new Set(
        Array.from(storyText.querySelectorAll('.inline-story-choice[data-choice-index]'))
          .map(el => Number(el.dataset.choiceIndex))
          .filter(Number.isFinite)
      );

      inlineIndexes.forEach(index => {
        const source = buttons[index];
        if (source) source.classList.add('inline-choice-source-hidden');
      });
    }

    function scheduleSync() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(syncInlineChoices);
    }

    function activateInlineChoice(target) {
      if (!target || target.getAttribute('aria-disabled') === 'true') return;
      const index = Number(target.dataset.choiceIndex);
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

    /* Le lecteur reconstruit les choix et le contenu à chaque navigation. */
    const observer = new MutationObserver(scheduleSync);
    observer.observe(choices, { childList: true, subtree: true });
    if (chapterNumber) observer.observe(chapterNumber, { childList: true, characterData: true, subtree: true });

    scheduleSync();
  }

  const style = document.createElement('style');
  style.id = 'interactive-ink-prototype-style';
  style.textContent = `
    #choices .inline-choice-source-hidden {
      display: none !important;
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
