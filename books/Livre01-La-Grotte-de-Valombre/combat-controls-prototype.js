/* DEV — Contrôles de combat allégés : intégrés au flux de lecture. */
(function () {
  'use strict';

  const style = document.createElement('style');
  style.id = 'combat-controls-light-dev-style';
  style.textContent = `
    #choices .choice-btn.combat-roll-btn,
    #choices .choice-btn.combat-roll-btn:hover,
    #choices .choice-btn.combat-roll-btn:focus,
    #choices .choice-btn.combat-roll-btn:focus-visible,
    #choices .choice-btn.combat-roll-btn:active {
      width: 100% !important;
      min-height: 44px !important;
      margin: 5px 0 !important;
      padding: 10px 14px !important;
      border: 1px solid rgba(58, 46, 32, .72) !important;
      border-radius: 3px !important;
      outline: none !important;
      outline-offset: 0 !important;
      background: transparent !important;
      background-image: none !important;
      background-color: transparent !important;
      background-blend-mode: normal !important;
      box-shadow: none !important;
      filter: none !important;
      color: #2b2117 !important;
      -webkit-text-fill-color: #2b2117 !important;
      text-shadow: none !important;
      font-family: var(--body-font, Georgia, 'Times New Roman', serif) !important;
      font-size: inherit !important;
      font-weight: 400 !important;
      font-style: normal !important;
      font-variant: normal !important;
      text-transform: none !important;
      line-height: 1.45 !important;
      letter-spacing: normal !important;
      text-align: left !important;
      transform: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    #choices .choice-btn.combat-roll-btn::before,
    #choices .choice-btn.combat-roll-btn::after {
      content: none !important;
      display: none !important;
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
    }

    #choices .choice-btn.combat-roll-btn .choice-arrow,
    #choices .choice-btn.combat-roll-btn .choice-dest {
      display: none !important;
    }

    #choices .choice-btn.combat-roll-btn .choice-copy,
    #choices .choice-btn.combat-roll-btn .choice-copy > span,
    #choices .choice-btn.combat-roll-btn .choice-copy * {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      transform: none !important;
      display: block !important;
      justify-content: flex-start !important;
      text-align: left !important;
      color: #2b2117 !important;
      -webkit-text-fill-color: #2b2117 !important;
      text-shadow: none !important;
      opacity: 1 !important;
      filter: none !important;
      font-family: var(--body-font, Georgia, 'Times New Roman', serif) !important;
      font-size: inherit !important;
      font-weight: 400 !important;
      font-style: normal !important;
      font-variant: normal !important;
      text-transform: none !important;
      line-height: 1.45 !important;
      letter-spacing: normal !important;
    }

    #choices .choice-btn.combat-roll-btn:hover,
    #choices .choice-btn.combat-roll-btn:focus-visible {
      background: rgba(58, 46, 32, .03) !important;
      border-color: rgba(58, 46, 32, .84) !important;
    }

    #choices .choice-btn.combat-roll-btn:active {
      background: rgba(58, 46, 32, .055) !important;
      border-color: rgba(58, 46, 32, .9) !important;
    }

    #choices .choice-btn.combat-roll-btn:disabled {
      opacity: .48 !important;
    }

    @media (max-width: 700px) {
      #choices .choice-btn.combat-roll-btn {
        min-height: 44px !important;
        padding: 9px 11px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();
