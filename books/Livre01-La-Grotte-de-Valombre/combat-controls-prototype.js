/* DEV — Contrôles de combat allégés : fond transparent, filet discret, zone tactile conservée. */
(function () {
  'use strict';

  const style = document.createElement('style');
  style.id = 'combat-controls-light-dev-style';
  style.textContent = `
    #choices .choice-btn.combat-roll-btn {
      width: 100% !important;
      min-height: 44px !important;
      margin: 5px 0 !important;
      padding: 9px 14px !important;
      border: 1px solid rgba(54, 95, 121, .34) !important;
      border-radius: 3px !important;
      background: transparent !important;
      background-image: none !important;
      background-color: transparent !important;
      background-blend-mode: normal !important;
      box-shadow: none !important;
      filter: none !important;
      color: #314f61 !important;
      text-shadow: none !important;
      font-size: .98rem !important;
      font-weight: 500 !important;
      line-height: 1.32 !important;
      letter-spacing: .005em !important;
      -webkit-tap-highlight-color: rgba(54, 95, 121, .12);
    }

    #choices .choice-btn.combat-roll-btn .choice-arrow {
      display: none !important;
    }

    #choices .choice-btn.combat-roll-btn .choice-copy {
      width: 100% !important;
      justify-content: center !important;
      text-align: center !important;
      color: inherit !important;
    }

    #choices .choice-btn.combat-roll-btn .choice-copy > span {
      color: inherit !important;
      font: inherit !important;
    }

    #choices .choice-btn.combat-roll-btn:active {
      border-color: rgba(41, 72, 90, .62) !important;
      background: rgba(54, 95, 121, .055) !important;
      color: #203f55 !important;
      transform: none !important;
    }

    #choices .choice-btn.combat-roll-btn:focus-visible {
      outline: 1px solid rgba(54, 95, 121, .72) !important;
      outline-offset: 2px !important;
    }

    #choices .choice-btn.combat-roll-btn:disabled {
      opacity: .48 !important;
    }

    @media (max-width: 700px) {
      #choices .choice-btn.combat-roll-btn {
        min-height: 44px !important;
        padding: 8px 11px !important;
        font-size: .95rem !important;
      }
    }
  `;

  document.head.appendChild(style);
})();
