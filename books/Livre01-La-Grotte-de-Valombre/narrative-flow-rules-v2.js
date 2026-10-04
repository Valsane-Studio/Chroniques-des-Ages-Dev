/* DEV — Règles éditoriales finales du flux narratif.
   Convention :
   - choix unique de continuation = fin de scène, formulation « tu dois » ;
   - plusieurs chemins = peuvent être intégrés au moment où ils sont décrits ;
   - objets = peuvent être pris/interrogés au moment de leur découverte ;
   - choix tactiques de combat + lancers de dés gardent leurs cadres transparents.
   Ce fichier est chargé après les prototypes précédents et a le dernier mot. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const storyText = document.getElementById('storyText');
  const choicesRoot = document.getElementById('choices');
  if (!book?.story || !storyText || !choicesRoot) return;

  function ink(index, copy) {
    return `<span class="inline-story-choice inline-story-choice-in-text inline-story-pill narrative-v2-choice" data-choice-index="${index}" role="button" tabindex="0">${copy}</span>`;
  }

  function patch(id, transform) {
    const scene = book.story[id];
    if (!scene || scene.__narrativeFlowV2) return;
    const previous = scene.text;
    scene.text = state => {
      const html = typeof previous === 'function' ? previous(state) : previous;
      return html ? transform(String(html), state, scene) : html;
    };
    scene.__narrativeFlowV2 = true;
  }

  /* PAGE 050 — un seul prolongement : il devient nécessaire, pas facultatif. */
  patch('c50', html => html.replace(
    /Tu peux examiner la gravure suivante/g,
    'Tu dois examiner la gravure suivante'
  ));

  /* PAGE 051 — même règle pour la reprise de l'ascension. */
  patch('c51', html => html.replace(
    /Tu peux reprendre l’ascension/g,
    'Tu dois reprendre l’ascension'
  ));

  /* PAGE 057 — le gantelet appartient à la découverte ; la sortie par la porte
     reste le dernier choix de la scène. */
  patch('c57', html => {
    if (html.includes('Tu as déjà ajouté le gantelet à ton équipement.')) {
      html = html.replace(/\s*<span[^>]*data-choice-index="0"[^>]*>.*?<\/span>\.?/g, '');
      return html.replace(
        '<p>Tu as déjà ajouté le gantelet à ton équipement.</p>',
        `<p>Tu as déjà ajouté le gantelet à ton équipement.</p><p>Tu dois ${ink(0, 'franchir la porte et entrer dans les quartiers hauts')}.</p>`
      );
    }

    html = html.replace(/\s*<span[^>]*data-choice-index="0"[^>]*>.*?<\/span>\.?/g, '');
    html = html.replace(/\s*<span[^>]*data-choice-index="1"[^>]*>.*?<\/span>\.?/g, '');
    html = html.replace(
      '<p>Les plaques sont fines, mais intactes.</p>',
      `<p>Les plaques sont fines, mais intactes. ${ink(0, 'Tu peux prendre le gantelet')}.</p>`
    );
    return html.replace(
      '<p>Il pourrait encore encaisser un coup à ta place.</p>',
      `<p>Il pourrait encore encaisser un coup à ta place.</p><p>Tu peux aussi ${ink(1, 'le laisser et franchir la porte')}.</p>`
    );
  });

  /* PAGE 069 — la fresque n'est proposée qu'après toute la scène. */
  patch('c69', html => {
    html = html.replace(/\s*<span[^>]*data-choice-index="0"[^>]*>.*?<\/span>\.?/g, '');
    html = html.replace('<p>Tu traverses la place pour examiner ces scènes.</p>', '');
    return html.replace(
      '<p>La dernière figure visible depuis ici porte le symbole de l\'œil fermé.</p>',
      `<p>La dernière figure visible depuis ici porte le symbole de l'œil fermé.</p><p>Tu dois ${ink(0, 'traverser la place pour examiner les grandes gravures')}.</p>`
    );
  });

  /* PAGE 073 — le décor porte directement le choix. */
  patch('c73', html => {
    html = html.replace(/\s*<span[^>]*data-choice-index="0"[^>]*>.*?<\/span>\.?/g, '');
    return html.replace(
      '<p>Sur ta droite, un passage rejoint les anciennes salles habitées. Deux autres ouvertures s’enfoncent sous les bâtiments.</p>',
      `<p>Sur ta droite, un passage rejoint les anciennes salles habitées. Deux autres ouvertures s’enfoncent ${ink(0, 'sous les bâtiments')}.</p>`
    );
  });

  /* PAGE 078 — une seule réaction possible : « tu dois ». */
  patch('c78', html => {
    html = html.replace(/\s*<span[^>]*data-choice-index="0"[^>]*>.*?<\/span>\.?/g, '');
    return html.replace(
      '<p>La poignée s\'abaisse.</p>',
      `<p>La poignée s'abaisse. Tu dois ${ink(0, 'dégainer et faire face')}.</p>`
    );
  });

  /* PAGE 082 — ordre narratif explicite, aucun entrecroisement automatique. */
  patch('c82', html => {
    html = html.replace(/\s*<span[^>]*data-choice-index="[01]"[^>]*>.*?<\/span>\.?/g, '');
    html = html.replace(/<p>Tu peux tenter ta chance, ou poursuivre les recherches d'Aldren\.<\/p>/, '');
    return html.replace(
      '<p>Des marques de coups autour du verrou montrent que quelqu\'un a déjà essayé de forcer l\'entrée.</p>',
      `<p>Des marques de coups autour du verrou montrent que quelqu'un a déjà essayé de forcer l'entrée.</p><p>Tu peux tenter ta chance, ou poursuivre les recherches d'Aldren. Tu peux ${ink(0, 'tenter d’enfoncer la porte')}.</p><p>Tu peux aussi ${ink(1, 'laisser la porte et gagner les appartements')}.</p>`
    );
  });

  const OBJECT_RE = /^(prendre|ramasser|saisir|récupérer|recuperer|fouiller|boire|utiliser|équiper|equiper)\b/i;

  function sourceButtons() {
    return Array.from(choicesRoot.querySelectorAll('.choice-btn')).filter(btn => {
      return !btn.classList.contains('fluid-roll-control') && !btn.classList.contains('fluid-combat-interaction-control');
    });
  }

  function labelOf(btn) {
    return (btn.querySelector('.choice-copy')?.textContent || btn.textContent || '').trim();
  }

  function fixGeneratedSingleChoice() {
    const buttons = sourceButtons();
    if (buttons.length !== 1) return;

    const button = buttons[0];
    const label = labelOf(button);
    if (OBJECT_RE.test(label)) return;

    const holder = storyText.querySelector('.fluid-choice-sentence');
    if (!holder) return;

    const paragraphs = Array.from(storyText.querySelectorAll(':scope > p')).filter(p => p.textContent.trim());
    if (!paragraphs.length) return;

    const target = paragraphs[paragraphs.length - 1];
    const parent = holder.closest('p');

    if (parent !== target) {
      holder.remove();
      target.appendChild(document.createTextNode(' '));
      target.appendChild(holder);
    }

    const firstNode = holder.firstChild;
    if (firstNode?.nodeType === Node.TEXT_NODE) {
      firstNode.textContent = firstNode.textContent
        .replace(/^Tu peux aussi\s+/i, 'Tu dois ')
        .replace(/^Tu peux\s+/i, 'Tu dois ');
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fixGeneratedSingleChoice();
    });
  }

  new MutationObserver(schedule).observe(storyText, { childList: true, subtree: true });
  new MutationObserver(schedule).observe(choicesRoot, { childList: true, subtree: true });
  schedule();
})();
