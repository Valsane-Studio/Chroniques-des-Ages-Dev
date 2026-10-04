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
      '<button type="button" class="inline-story-choice" data-choice-index="0"><span class="inline-story-choice-mark" aria-hidden="true">›</span><span class="inline-story-choice-copy">L’un descend dans l’obscurité, et de ce passage monte une forte odeur de soufre.</span></button>'
    );

    html = html.replace(
      '<p>L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</p>',
      '<button type="button" class="inline-story-choice" data-choice-index="1"><span class="inline-story-choice-mark" aria-hidden="true">›</span><span class="inline-story-choice-copy">L’autre continue tout droit et semble s’enfoncer dans un passage beaucoup plus étroit.</span></button>'
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
