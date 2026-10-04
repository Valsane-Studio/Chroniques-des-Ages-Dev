/* DEV — Nettoyage éditorial du flux narratif.
   Les choix explicites sont intégrés au moment où le récit les rend possibles.
   Ce fichier corrige aussi les répétitions créées par une action déjà racontée
   puis proposée une seconde fois comme choix. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book?.story) return;

  function ink(index, copy) {
    return `<span class="inline-story-choice inline-story-choice-in-text inline-story-pill narrative-cleanup-choice" data-choice-index="${index}" role="button" tabindex="0">${copy}</span>`;
  }

  function wrap(id, transform) {
    const scene = book.story[id];
    if (!scene || scene.__narrativeFlowCleanup) return;
    const previous = scene.text;
    scene.text = state => {
      const html = typeof previous === 'function' ? previous(state) : previous;
      return html ? transform(String(html), state, scene) : html;
    };
    scene.__narrativeFlowCleanup = true;
  }

  /* PAGE 040 — supprimer l'explication de la pulsion à continuer. */
  wrap('c40', html => html.replace(
    '<p>Tu éprouves le besoin de continuer, de t’enfoncer plus profondément. Cette envie te surprend : tu étais venu pour retrouver Aldren, pas pour obéir à une direction que tu ne comprends pas.</p>',
    ''
  ));

  /* PAGE 044 — ne pas répéter le choix qui vient d’être fait. */
  wrap('c44', html => {
    html = html.replace('<p>Tu choisis l’escalier.</p>', '');
    if (!html.includes('data-choice-index="0"')) {
      html += `<p>Pour continuer, tu dois ${ink(0, 'traverser la portion glissante')}.</p>`;
    }
    return html;
  });

  /* PAGE 049 — l’ascension est déjà racontée : le geste devient lui-même le lien. */
  wrap('c49', html => {
    if (html.includes('data-choice-index="0"')) return html;
    html = html.replace(
      '<p>Tu continues.</p>',
      `<p>${ink(0, 'Tu continues l’ascension')}.</p>`
    );
    html = html.replace(
      '<p>Puis tu trouves une nouvelle prise et reprends l’ascension, beaucoup plus lentement.</p>',
      `<p>Puis tu trouves une nouvelle prise et ${ink(0, 'reprends l’ascension, beaucoup plus lentement')}.</p>`
    );
    return html;
  });

  /* PAGE 050 — toute la fresque doit être lue avant de proposer la suivante. */
  wrap('c50', html => {
    if (html.includes('data-choice-index="0"')) return html;
    return html.replace(
      '<p>Tu ignores ce qui les attirait, et ce qu’ils ont trouvé au bout du chemin.</p>',
      `<p>Tu ignores ce qui les attirait, et ce qu’ils ont trouvé au bout du chemin.</p><p>${ink(0, 'Tu peux examiner la gravure suivante')}.</p>`
    );
  });

  /* PAGE 051 — même logique : terminer la lecture avant de repartir. */
  wrap('c51', html => {
    if (html.includes('data-choice-index="0"')) return html;
    return html.replace(
      '<p>Mais la fresque ne montre ni ce qu’il en a fait, ni ce qui l’attendait derrière la porte.</p>',
      `<p>Mais la fresque ne montre ni ce qu’il en a fait, ni ce qui l’attendait derrière la porte.</p><p>${ink(0, 'Tu peux reprendre l’ascension')}.</p>`
    );
  });

  /* PAGE 052 — les deux réactions n’existent qu’une fois la silhouette décrite. */
  wrap('c52', html => {
    if (html.includes('data-choice-index="0"') || html.includes('data-choice-index="1"')) return html;
    return html.replace(
      '<p>L’homme ne semble pas t’avoir remarqué.</p>',
      `<p>L’homme ne semble pas t’avoir remarqué.</p><p>Tu peux ${ink(0, 'appeler la silhouette')} — ou ${ink(1, 'te rapprocher discrètement')}.</p>`
    );
  });

  /* PAGE 058 — commencer directement par la corniche et ne pas raconter deux fois l’avancée. */
  wrap('c58', html => {
    html = html.replace('<p>Tu choisis la corniche.</p>', '');
    html = html.replace(
      '<p>Elle ne fait parfois pas plus de deux pieds de large.</p>',
      '<p>La corniche ne fait parfois pas plus de deux pieds de large.</p>'
    );
    if (!html.includes('data-choice-index="0"')) {
      html = html.replace(
        '<p>Tu commences la traversée.</p>',
        `<p>${ink(0, 'Tu avances sur le pont')}.</p>`
      );
    }
    return html;
  });

  /* Répétitions évidentes repérées ailleurs dans le parcours : l’action déjà
     racontée devient directement le choix, au lieu d’être répétée après coup. */
  wrap('c70', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu avances vers la scène suivante.</p>',
    `<p>${ink(0, 'Tu avances vers la scène suivante')}.</p>`
  ));

  wrap('c75', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu entres dans le réfectoire.</p>',
    `<p>${ink(0, 'Tu entres dans le réfectoire')}.</p>`
  ));

  wrap('c84', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu traverses les appartements vers la sortie.</p>',
    `<p>${ink(0, 'Tu gagnes la galerie de sortie')}.</p>`
  ));

  wrap('c118', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu rejoins la place du village.</p>',
    `<p>${ink(0, 'Tu rejoins la place du village')}.</p>`
  ));

  wrap('c121', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu la remercies et ressors sur la place.</p>',
    `<p>Tu la remercies et ${ink(0, 'retournes sur la place')}.</p>`
  ));

  wrap('c127', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu regagnes la barque.</p>',
    `<p>${ink(0, 'Tu regagnes la barque')}.</p>`
  ));

  wrap('c128', html => {
    if (html.includes('data-choice-index="0"')) return html;
    return html.replace(
      'tu l’ajustes à ton bras avant de franchir la porte du quartier haut.',
      `tu l’ajustes à ton bras.</p><p>${ink(0, 'Tu franchis la porte du quartier haut')}.`
    );
  });

  wrap('c136', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu enveloppes les cinq lames dans un morceau de tissu et les glisses dans ton équipement. Tu repars vers les bureaux.</p>',
    `<p>Tu enveloppes les cinq lames dans un morceau de tissu et les glisses dans ton équipement. ${ink(0, 'Tu repars vers les bureaux')}.</p>`
  ));

  wrap('c137', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu t’écartes et reprends le couloir vers l’arche.</p>',
    `<p>${ink(0, 'Tu t’éloignes de la cellule et reprends le couloir vers l’arche')}.</p>`
  ));

  wrap('c144', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu retrouves l’arche au bout du couloir.</p>',
    `<p>Au bout du couloir, ${ink(0, 'tu quittes le quartier d’observation par l’arche')}.</p>`
  ));

  wrap('c165', html => html.includes('data-choice-index="0"') ? html : html.replace(
    'et regagnes la galerie principale.</p>',
    `et ${ink(0, 'regagnes la galerie principale')}.</p>`
  ));

  wrap('c177', html => html.includes('data-choice-index="0"') ? html : html.replace(
    '<p>Tu reprends la galerie. Derrière toi, la flamme ne vacille pas.</p>',
    `<p>${ink(0, 'Tu reprends la descente')}. Derrière toi, la flamme ne vacille pas.</p>`
  ));

  wrap('c239', html => {
    if (html.includes('data-choice-index="0"')) return html;
    return html.replace(
      '<p>Alors que tu viens de blesser le deuxième chevalier, tu entends un grincement sur le côté.</p>',
      `<p>Alors que tu viens de blesser le deuxième chevalier, un grincement retentit sur le côté.</p><p>${ink(0, 'Tu te retournes vers le bruit')}.</p>`
    );
  });

  /* Garde-fou pour les choix encore générés automatiquement par fluid-choice-flow :
     un lien de secours ne doit pas interrompre prématurément une scène. Si le
     générateur l’a placé dans les 2/3 premiers du récit, on le déplace dans la
     partie finale. Les intégrations écrites à la main ci-dessus ne sont jamais touchées. */
  const storyText = document.getElementById('storyText');
  if (!storyText) return;

  let scheduled = false;
  function guardGeneratedPlacement() {
    scheduled = false;
    const paragraphs = Array.from(storyText.querySelectorAll(':scope > p')).filter(p => p.textContent.trim());
    if (paragraphs.length < 3) return;

    const generated = Array.from(storyText.querySelectorAll('.fluid-choice-sentence')).filter(el => !el.dataset.flowGuarded);
    if (!generated.length) return;

    const minIndex = Math.floor((paragraphs.length - 1) * 0.68);
    const fallbackTargets = paragraphs.slice(minIndex);
    if (!fallbackTargets.length) return;

    generated.forEach((holder, order) => {
      const parent = holder.closest('p');
      const currentIndex = paragraphs.indexOf(parent);
      holder.dataset.flowGuarded = 'true';
      if (currentIndex < 0 || currentIndex >= minIndex) return;

      const targetIndex = Math.min(fallbackTargets.length - 1,
        Math.round((order / Math.max(1, generated.length - 1)) * (fallbackTargets.length - 1)));
      const target = fallbackTargets[targetIndex] || paragraphs[paragraphs.length - 1];
      if (target === parent) return;

      holder.remove();
      target.appendChild(document.createTextNode(' '));
      target.appendChild(holder);
    });
  }

  function scheduleGuard() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(guardGeneratedPlacement);
  }

  new MutationObserver(scheduleGuard).observe(storyText, { childList: true, subtree: true });
  scheduleGuard();
})();
