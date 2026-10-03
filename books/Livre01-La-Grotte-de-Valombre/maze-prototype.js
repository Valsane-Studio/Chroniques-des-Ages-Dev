/* DEV — Prototype du labyrinthe final : exploration, indices et mémoire au lieu d'une boucle aléatoire. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book?.story?.c209) return;

  const VERSION = 1;

  function contamination(state) {
    return Math.max(0, Math.min(13,
      Number.isFinite(state?.contamination)
        ? Math.floor(state.contamination)
        : (state?.flags?.blackEarthContamination ? 2 : 0)
    ));
  }

  function freshMaze() {
    return {
      version: VERSION,
      stage: 'hub',
      explored: { draft: false, tracks: false, echo: false },
      last: null,
      finalFails: { draft: false, tracks: false },
      solved: false
    };
  }

  function maze(state) {
    state.flags = state.flags || {};
    if (!state.flags.mazePrototype || state.flags.mazePrototype.version !== VERSION) {
      state.flags.mazePrototype = freshMaze();
      // Neutralise la mécanique aléatoire historique pour les sauvegardes déjà arrivées ici.
      state.flags.finalMazeTurns = 0;
      state.flags.finalMazeFound = false;
      state.flags.finalMazeLast = null;
    }
    return state.flags.mazePrototype;
  }

  function resetMaze(state) {
    state.flags.mazePrototype = freshMaze();
    state.flags.finalMazeTurns = 0;
    state.flags.finalMazeFound = false;
    state.flags.finalMazeLast = null;
  }

  function clueCount(m) {
    return Object.values(m.explored).filter(Boolean).length;
  }

  function clueCard(label, known, text) {
    return `<div class="maze-proto-clue ${known ? 'is-known' : 'is-unknown'}">
      <span class="maze-proto-clue-mark">${known ? '✓' : '?'}</span>
      <div><strong>${label}</strong><span>${known ? text : 'Repère encore incompris.'}</span></div>
    </div>`;
  }

  function cluesHtml(state) {
    const m = maze(state);
    return `<section class="maze-proto-notes" aria-label="Repères du labyrinthe">
      <div class="maze-proto-title">Tes repères</div>
      ${clueCard('Le courant d’air', m.explored.draft, 'Un souffle froid peut simplement venir d’une fissure dans la roche. Ce n’est pas forcément une sortie.')}
      ${clueCard('Les traces', m.explored.tracks, 'Les empreintes et marques laissées par les hommes peuvent tourner en boucle et ramener au même endroit.')}
      ${clueCard('L’écho', m.explored.echo, 'Un écho métallique sous les pas trahit une dalle creuse et un vide sous le passage.')}
    </section>`;
  }

  function voiceHint(state, final = false) {
    const level = contamination(state);
    if (level <= 3) {
      return final
        ? '<p class="maze-proto-voice">La voix revient, nette : <em>« Ne suis ni le souffle, ni les pas. Cherche l’endroit qui ne te répond pas. »</em></p>'
        : '<p class="maze-proto-voice">Une pression familière retient un instant ta nuque. La voix n’emploie presque plus de mots, seulement des refus, des directions qu’elle t’empêche de prendre.</p>';
    }
    if (level <= 8) {
      return final
        ? '<p class="maze-proto-voice">Très loin dans ton crâne, quelque chose murmure : <em>« Pas… souffle… silence… »</em> Puis plus rien.</p>'
        : '<p class="maze-proto-voice">La voix existe encore, mais elle se brise en syllabes incomplètes. Tu n’es plus certain de comprendre ce qu’elle essaie de t’éviter.</p>';
    }
    return '<p class="maze-proto-voice is-silent">La voix ne répond plus. Tu dois compter uniquement sur ce que tu as observé.</p>';
  }

  function lastDiscoveryHtml(m) {
    if (m.last === 'draft') {
      return `<div class="maze-proto-discovery"><strong>Le souffle froid</strong>
        <p>Tu suis le courant d’air jusqu’à ce qu’il devienne presque glacial. Pourtant la galerie se termine contre une paroi fendue. En approchant la main, tu comprends : l’air vient d’une fissure verticale, trop étroite pour y passer.</p>
        <p>En revenant, un couloir secondaire te ramène au même carrefour. <strong>Le courant d’air t’a menti.</strong></p></div>`;
    }
    if (m.last === 'tracks') {
      return `<div class="maze-proto-discovery"><strong>Les traces de bottes</strong>
        <p>Tu suis des empreintes anciennes dans la poussière. Elles semblent d’abord former une piste claire, puis se croisent, repartent en sens inverse et finissent devant une entaille fraîche que tu reconnais : celle que tu viens toi-même de faire sur la pierre.</p>
        <p>Quelques minutes plus tard, tu reviens au carrefour par une autre arche. <strong>Les traces tournent en boucle.</strong></p></div>`;
    }
    if (m.last === 'echo') {
      return `<div class="maze-proto-discovery"><strong>Le bruit sous la pierre</strong>
        <p>Le tintement revient à chacun de tes pas. Tu t’accroupis et frappes doucement la dalle avec le pommeau de ton arme. La pierre répond comme une plaque posée sur du vide.</p>
        <p>Plus loin, une cassure révèle un gouffre sous le sol. Tu rebrousses chemin. <strong>Ce son métallique signale les passages creux.</strong></p></div>`;
    }
    return '';
  }

  function finalFailureHtml(m) {
    if (m.last === 'final-draft') {
      return `<div class="maze-proto-discovery is-warning"><strong>Une fausse sortie</strong>
        <p>Tu suis le souffle froid. Il se renforce, puis disparaît brutalement lorsque le passage rejoint une immense fissure verticale. Aucun chemin ne continue au-delà.</p>
        <p>Tu retrouves l’intersection par une ouverture latérale. Cette fois, tu sais que <strong>ce passage ne mène nulle part</strong>.</p></div>`;
    }
    if (m.last === 'final-tracks') {
      return `<div class="maze-proto-discovery is-warning"><strong>La boucle se referme</strong>
        <p>Les traces paraissent rassurantes jusqu’à ce que tu reconnaisses deux marques superposées sur le même pilier. Les hommes qui sont passés ici ont eux aussi suivi cette piste… encore et encore.</p>
        <p>Le couloir te ramène derrière l’intersection. <strong>Tu peux éliminer cette route.</strong></p></div>`;
    }
    return '';
  }

  function hubText(state) {
    const m = maze(state);
    const count = clueCount(m);
    return `
      <p>Tu pousses la porte aux dimensions inhumaines et te glisses dans l’ouverture.</p>
      <p>Le labyrinthe ne ressemble pas à un ouvrage construit pour des hommes. Les parois montent trop haut, les angles se répètent et certaines arches semblent identiques jusque dans leurs fissures.</p>
      <p>Au premier grand carrefour, trois détails attirent pourtant ton attention : <strong>un souffle froid</strong> dans une galerie, <strong>des traces de bottes</strong> dans une autre, et un <strong>léger tintement métallique</strong> provenant du troisième passage.</p>
      ${voiceHint(state, false)}
      ${lastDiscoveryHtml(m)}
      ${cluesHtml(state)}
      ${count >= 2 ? '<p class="maze-proto-ready"><strong>Tu commences à comprendre la logique du lieu.</strong> Tu peux continuer à vérifier tes repères, ou les utiliser maintenant pour t’enfoncer plus loin.</p>' : '<p>Choisir au hasard ne te mènera nulle part. Il faut d’abord comprendre ce que ces signes signifient.</p>'}
    `;
  }

  function finalText(state) {
    const m = maze(state);
    const draftGone = m.finalFails.draft;
    const tracksGone = m.finalFails.tracks;
    return `
      <p>Tu quittes le premier carrefour et avances en t’appuyant sur les repères que tu as compris. Les galeries se resserrent jusqu’à une nouvelle intersection.</p>
      <p>Trois passages s’ouvrent devant toi.</p>
      <p>${draftGone ? '<s>À gauche, un souffle froid glisse entre les pierres.</s> <strong>Tu as vérifié cette route : c’est une fausse sortie.</strong>' : 'À gauche, un souffle froid glisse entre les pierres.'}</p>
      <p>${tracksGone ? '<s>En face, plusieurs empreintes de bottes disparaissent dans la poussière.</s> <strong>Tu as vérifié cette route : elle forme une boucle.</strong>' : 'En face, plusieurs empreintes de bottes disparaissent dans la poussière.'}</p>
      <p>À droite, le passage paraît presque mort : <strong>pas de courant d’air, pas de traces, aucun écho sous tes pas.</strong></p>
      ${voiceHint(state, true)}
      ${finalFailureHtml(m)}
      ${cluesHtml(state)}
      <p class="maze-proto-ready"><strong>Cette fois, le choix peut être raisonné.</strong></p>
    `;
  }

  function explore(state, key) {
    const m = maze(state);
    m.explored[key] = true;
    m.last = key;
  }

  function finalFail(state, key) {
    const m = maze(state);
    m.finalFails[key] = true;
    m.last = `final-${key}`;
  }

  const scene = book.story.c209;
  scene.title = 'Le labyrinthe impossible';
  scene.text = state => {
    const m = maze(state);
    return m.stage === 'final' ? finalText(state) : hubText(state);
  };
  scene.choices = state => {
    const m = maze(state);

    if (m.solved) {
      return [
        { label: 'Poursuivre vers la faille', to: 'c223' },
        { label: 'Rejouer le prototype du labyrinthe', stay: true, effect: resetMaze }
      ];
    }

    if (m.stage === 'final') {
      const choices = [];
      if (!m.finalFails.draft) {
        choices.push({
          label: m.explored.draft
            ? 'Suivre le courant d’air — malgré ce que tu as appris'
            : 'Suivre le courant d’air',
          stay: true,
          effect: s => finalFail(s, 'draft')
        });
      }
      if (!m.finalFails.tracks) {
        choices.push({
          label: m.explored.tracks
            ? 'Suivre les traces de bottes — malgré ce que tu as appris'
            : 'Suivre les traces de bottes',
          stay: true,
          effect: s => finalFail(s, 'tracks')
        });
      }
      choices.push({
        label: 'Prendre le passage silencieux, sans traces',
        to: 'c223',
        effect: s => {
          const data = maze(s);
          data.solved = true;
          data.last = 'solved';
          s.flags.finalMazeFound = true;
        }
      });
      return choices;
    }

    const choices = [];
    if (!m.explored.draft) {
      choices.push({ label: 'Suivre le souffle froid', stay: true, effect: s => explore(s, 'draft') });
    }
    if (!m.explored.tracks) {
      choices.push({ label: 'Suivre les traces de bottes', stay: true, effect: s => explore(s, 'tracks') });
    }
    if (!m.explored.echo) {
      choices.push({ label: 'Suivre le tintement métallique', stay: true, effect: s => explore(s, 'echo') });
    }
    if (clueCount(m) >= 2) {
      choices.push({
        label: 'Croiser tes repères et t’enfoncer plus loin',
        stay: true,
        effect: s => {
          const data = maze(s);
          data.stage = 'final';
          data.last = null;
        }
      });
    }
    return choices;
  };

  const style = document.createElement('style');
  style.id = 'maze-prototype-dev-style';
  style.textContent = `
    .maze-proto-notes {
      margin: 20px 0;
      padding: 14px;
      border: 1px solid rgba(132, 96, 51, .55);
      background: rgba(77, 55, 31, .07);
    }
    .maze-proto-title {
      margin-bottom: 10px;
      font-size: 12px;
      letter-spacing: .13em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .maze-proto-clue {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 9px;
      align-items: start;
      padding: 9px 0;
      border-top: 1px solid rgba(93, 70, 43, .16);
    }
    .maze-proto-clue:first-of-type { border-top: 0; }
    .maze-proto-clue-mark {
      width: 24px;
      height: 24px;
      display: grid;
      place-items: center;
      border: 1px solid currentColor;
      border-radius: 50%;
      font-weight: 700;
    }
    .maze-proto-clue strong,
    .maze-proto-clue span { display: block; }
    .maze-proto-clue span { margin-top: 3px; font-size: .93em; line-height: 1.35; }
    .maze-proto-clue.is-unknown { opacity: .48; }
    .maze-proto-discovery {
      margin: 18px 0;
      padding: 14px 16px;
      border-left: 3px solid #7f633f;
      background: rgba(255,255,255,.16);
    }
    .maze-proto-discovery p:last-child { margin-bottom: 0; }
    .maze-proto-discovery.is-warning { border-left-color: #815145; }
    .maze-proto-voice {
      margin: 18px 0;
      padding-left: 14px;
      border-left: 2px solid rgba(92, 88, 77, .6);
    }
    .maze-proto-voice.is-silent { opacity: .75; }
    .maze-proto-ready {
      margin-top: 20px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
})();
