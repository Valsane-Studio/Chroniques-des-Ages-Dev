/* DEV — Prototype page 003 : choix tactiles directement intégrés dans la prose. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const scene = book?.story?.c3;
  if (!scene || scene.__inlinePillsPrototype) return;

  const originalText = scene.text;
  const originalChoices = scene.choices;

  function availableChoices(state) {
    return typeof originalChoices === 'function' ? originalChoices(state) : (originalChoices || []);
  }

  function choiceIndex(state, label) {
    return availableChoices(state).findIndex(choice => choice?.label === label);
  }

  function pill(state, label, copy) {
    const index = choiceIndex(state, label);
    if (index < 0) return '';
    return `<button type="button" class="inline-story-choice inline-story-choice-in-text inline-story-pill" data-choice-index="${index}"><span class="inline-story-choice-copy">${copy}</span></button>`;
  }

  scene.text = state => {
    let html = typeof originalText === 'function' ? originalText(state) : originalText;
    if (!html) return html;

    const actions = [
      pill(state, 'Voir la forgeronne', 'aller voir la forgeronne'),
      pill(state, 'Voir le marchand', 'passer voir le marchand'),
      pill(state, 'Approcher la personne dans la ruelle', 'prendre le risque d’aller à la rencontre de la personne dans la ruelle')
    ].filter(Boolean);

    const leave = pill(state, 'Partir vers la grotte', 'quitter le village et prendre la route de la grotte');
    if (!leave) return html;

    const sentence = actions.length
      ? `<p class="inline-story-sentence">Tu peux encore prendre le temps de faire ce qui te semble utile : ${actions.join(', ')} — ou ${leave}.</p>`
      : `<p class="inline-story-sentence">Tu décides finalement de ${leave}.</p>`;

    return html.replace(
      '<p>Tu peux encore prendre le temps de faire ce qui te semble utile — ou quitter le village.</p>',
      sentence
    );
  };

  scene.__inlinePillsPrototype = true;

  const style = document.createElement('style');
  style.id = 'inline-page3-prototype-style';
  style.textContent = `
    .inline-story-sentence {
      line-height: 1.65;
    }

    .inline-story-choice.inline-story-pill {
      -webkit-appearance: none;
      appearance: none;
      display: inline-block;
      width: auto;
      max-width: 100%;
      min-height: 0;
      margin: 0 1px;
      padding: 0 .28em .04em;
      border: 1px solid rgba(91, 64, 36, .24);
      border-radius: 2px;
      background: rgba(91, 64, 36, .018);
      color: inherit;
      font: inherit;
      font-weight: inherit;
      line-height: 1.18;
      text-align: left;
      vertical-align: baseline;
      white-space: normal;
      box-shadow: none;
      cursor: pointer;
      -webkit-tap-highlight-color: rgba(91, 64, 36, .12);
      touch-action: manipulation;
    }

    .inline-story-choice.inline-story-pill::after {
      content: none;
    }

    .inline-story-choice.inline-story-pill .inline-story-choice-copy {
      display: inline;
    }

    .inline-story-choice.inline-story-pill:active {
      background: rgba(91, 64, 36, .10);
      border-color: rgba(91, 64, 36, .42);
      transform: none;
    }

    .inline-story-choice.inline-story-pill:focus-visible {
      outline: 1px solid rgba(91, 64, 36, .58);
      outline-offset: 2px;
    }

    @media (max-width: 700px) {
      .inline-story-sentence {
        line-height: 1.7;
      }

      .inline-story-choice.inline-story-pill {
        min-height: 0;
        margin: 0 1px;
        padding: 0 .26em .04em;
        line-height: 1.18;
      }
    }
  `;
  document.head.appendChild(style);
})();
