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
      line-height: 1.9;
    }

    .inline-story-choice.inline-story-pill {
      display: inline-flex;
      align-items: center;
      width: auto;
      max-width: 100%;
      min-height: 34px;
      margin: 2px 2px;
      padding: 4px 9px 5px;
      border: 1px solid rgba(91, 64, 36, .32);
      border-left: 1px solid rgba(91, 64, 36, .32);
      border-radius: 999px;
      background: rgba(91, 64, 36, .075);
      color: inherit;
      font: inherit;
      font-weight: 600;
      line-height: 1.25;
      text-align: left;
      vertical-align: middle;
      white-space: normal;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);
    }

    .inline-story-choice.inline-story-pill::after {
      content: '›';
      margin-left: 7px;
      font-size: .92em;
      line-height: 1;
      opacity: .58;
      flex: 0 0 auto;
    }

    .inline-story-choice.inline-story-pill .inline-story-choice-copy {
      display: inline;
    }

    .inline-story-choice.inline-story-pill:active {
      background: rgba(91, 64, 36, .16);
      border-color: rgba(91, 64, 36, .52);
      transform: translateY(1px);
    }

    @media (max-width: 700px) {
      .inline-story-sentence {
        line-height: 2.05;
      }

      .inline-story-choice.inline-story-pill {
        min-height: 38px;
        margin: 3px 1px;
        padding: 5px 9px 6px;
        line-height: 1.28;
      }
    }
  `;
  document.head.appendChild(style);
})();
