/* DEV — Prototype de choix narratifs intégrés au texte : page 020 uniquement. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const scene = book?.story?.c20;
  if (!scene) return;

  const originalText = scene.text;

  scene.text = state => {
    let html = typeof originalText === 'function' ? originalText(state) : originalText;
    if (!html) return html;

    html = html.replace(
      '<p>L’un <strong>descend</strong> dans l’obscurité, et de ce passage monte une <strong>forte odeur de soufre</strong>.</p>',
      '<p><button type="button" class="inline-story-choice" data-choice-index="0">L’un descend dans l’obscurité</button>, et de ce passage monte une forte odeur de soufre.</p>'
    );

    html = html.replace(
      '<p>L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</p>',
      '<p><button type="button" class="inline-story-choice" data-choice-index="1">L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</button></p>'
    );

    return html;
  };

  function install() {
    const storyText = document.getElementById('storyText');
    const choices = document.getElementById('choices');
    if (!storyText || !choices) return;

    const syncInlineMode = () => {
      document.body.classList.toggle('has-inline-story-choices', !!storyText.querySelector('.inline-story-choice'));
    };

    storyText.addEventListener('click', event => {
      const inlineChoice = event.target.closest('.inline-story-choice[data-choice-index]');
      if (!inlineChoice) return;

      const index = Number(inlineChoice.dataset.choiceIndex);
      const sourceButtons = choices.querySelectorAll('.choice-btn');
      const source = sourceButtons[index];
      if (!source) return;

      inlineChoice.disabled = true;
      source.click();
    });

    new MutationObserver(syncInlineMode).observe(storyText, { childList: true, subtree: true });
    syncInlineMode();
  }

  const style = document.createElement('style');
  style.id = 'inline-story-choice-prototype-style';
  style.textContent = `
    body.has-inline-story-choices #choices {
      display: none !important;
    }

    .inline-story-choice {
      -webkit-appearance: none;
      appearance: none;
      display: inline-block;
      max-width: 100%;
      margin: -4px 0;
      padding: 7px 2px 6px;
      border: 0;
      border-bottom: 1px solid rgba(91, 64, 36, .62);
      border-radius: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: inherit;
      line-height: 1.45;
      text-align: left;
      vertical-align: baseline;
      cursor: pointer;
      -webkit-tap-highlight-color: rgba(91, 64, 36, .16);
      touch-action: manipulation;
    }

    .inline-story-choice::after {
      content: '  ›';
      display: inline;
      font-size: .92em;
      opacity: .68;
      white-space: nowrap;
    }

    .inline-story-choice:active {
      background: rgba(91, 64, 36, .10);
      border-bottom-color: rgba(91, 64, 36, .95);
    }

    .inline-story-choice:focus-visible {
      outline: 2px solid rgba(91, 64, 36, .58);
      outline-offset: 3px;
    }

    .inline-story-choice:disabled {
      opacity: .62;
    }

    @media (max-width: 700px) {
      .inline-story-choice {
        padding-top: 9px;
        padding-bottom: 8px;
        line-height: 1.5;
      }
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
