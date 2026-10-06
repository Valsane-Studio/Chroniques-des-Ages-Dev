/* DEV uniquement — numéro de page technique hors du parchemin. */
(function () {
  'use strict';

  function install() {
    const chapterNumber = document.getElementById('chapterNumber');
    if (!chapterNumber) return;

    chapterNumber.classList.add('dev-page-number-badge');
    chapterNumber.setAttribute('aria-label', 'Numéro de page DEV');

    /* On sort réellement le numéro du footer du parchemin. Le lecteur garde
       sa référence DOM et continue donc à mettre le numéro à jour normalement. */
    if (chapterNumber.parentElement !== document.body) {
      document.body.appendChild(chapterNumber);
    }
  }

  const style = document.createElement('style');
  style.id = 'dev-page-number-style';
  style.textContent = `
    .dev-page-number-badge {
      position: fixed !important;
      top: 8px !important;
      right: 10px !important;
      z-index: 10050 !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 4px 7px !important;
      border: 1px solid rgba(255,255,255,.22) !important;
      border-radius: 3px !important;
      background: rgba(14, 20, 24, .78) !important;
      box-shadow: none !important;
      color: rgba(255,255,255,.88) !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      line-height: 1.2 !important;
      letter-spacing: .04em !important;
      text-transform: uppercase !important;
      pointer-events: none !important;
      user-select: none !important;
    }

    @media (max-width: 700px) {
      .dev-page-number-badge {
        top: 6px !important;
        right: 6px !important;
        font-size: 9px !important;
        padding: 3px 6px !important;
      }
    }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
