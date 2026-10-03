/* DEV — Prototype 2 du labyrinthe final : vrai mini-labyrinthe spatial, carte révélée progressivement. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book?.story?.c209) return;

  const VERSION = 2;
  const EXIT_NODE = 'j';

  const NODES = {
    a: { x: 1, y: 3, name: 'Entrée', text: 'La porte aux dimensions inhumaines est derrière toi. Devant, la galerie monte vers les premières arches du dédale.' },
    b: { x: 1, y: 2, name: 'Premier carrefour', text: 'Trois passages se séparent ici. Les murs sont si semblables qu’aucun ne paraît plus sûr qu’un autre.' },
    c: { x: 0, y: 2, name: 'Galerie des traces', text: 'De vieilles empreintes de bottes couvrent la poussière. Certaines vont dans un sens, d’autres reviennent exactement sur leurs pas.' },
    d: { x: 0, y: 1, name: 'Arche brisée', text: 'Une arche fendue oblige à te courber. Au-delà, le couloir repart vers l’est entre des blocs noircis.' },
    e: { x: 1, y: 1, name: 'Pilier fendu', text: 'Un énorme pilier coupe la galerie. Une longue fissure blanche le traverse du sol au plafond.' },
    f: { x: 2, y: 2, name: 'Salle des quatre passages', text: 'Tu arrives dans une salle presque carrée. Quatre ouvertures percent les parois. Ici, il est très facile de perdre le sens de l’entrée.' },
    g: { x: 2, y: 1, name: 'Dalles creuses', text: 'Sous tes pas, certaines dalles rendent un son creux. Deux passages partent dans des directions différentes.' },
    h: { x: 2, y: 3, name: 'Passage bas', text: 'Le plafond descend si bas que tu avances presque courbé. Une odeur de poussière humide flotte dans l’air.' },
    i: { x: 3, y: 2, name: 'Couloir étroit', text: 'Les parois se rapprochent jusqu’à ne laisser qu’un étroit corridor. Plus loin, la roche semble changer de couleur.' },
    k: { x: 3, y: 1, name: 'Cul-de-sac', text: 'Le boyau se termine brutalement sur une paroi intacte. Quelqu’un a gravé trois traits verticaux dans la pierre avant de rebrousser chemin.' },
    l: { x: 3, y: 3, name: 'Renfoncement effondré', text: 'Des blocs écroulés ferment entièrement le passage. Il n’y a rien à faire ici sinon revenir sur tes pas.' },
    j: { x: 4, y: 2, name: 'Sortie', text: 'Une ouverture s’élargit devant toi. Un courant d’air remonte d’une faille immense : tu as trouvé la sortie du labyrinthe.' }
  };

  const EDGES = [
    ['a','b'],
    ['a','h'],
    ['b','c'],
    ['b','f'],
    ['c','d'],
    ['d','e'],
    ['e','g'],
    ['g','f'],
    ['g','k'],
    ['f','h'],
    ['h','l'],
    ['f','i'],
    ['i','j']
  ];

  const EDGE_HINTS = {
    'a-b': 'le passage montant',
    'a-h': 'le boyau bas',
    'b-c': 'la galerie marquée de traces',
    'b-f': 'l’arche large',
    'c-d': 'le couloir aux pierres fendues',
    'd-e': 'le passage sous l’arche',
    'e-g': 'le couloir sombre',
    'f-g': 'les dalles creuses',
    'g-k': 'le boyau étroit',
    'f-h': 'la pente descendante',
    'h-l': 'la fissure basse',
    'f-i': 'le corridor resserré',
    'i-j': 'l’ouverture au fond'
  };

  function edgeKey(a, b) {
    return [a, b].sort().join('-');
  }

  function neighbors(id) {
    const out = [];
    for (const [a,b] of EDGES) {
      if (a === id) out.push(b);
      else if (b === id) out.push(a);
    }
    return out;
  }

  function freshMaze() {
    return {
      version: VERSION,
      current: 'a',
      visited: ['a'],
      traversed: [],
      visits: { a: 1 },
      moves: 0,
      solved: false
    };
  }

  function maze(state) {
    state.flags = state.flags || {};
    const previous = state.flags.mazePrototype;
    if (!previous || previous.version !== VERSION) {
      state.flags.mazePrototype = freshMaze();
      // Neutralise totalement l’ancien labyrinthe aléatoire.
      state.flags.finalMazeTurns = 0;
      state.flags.finalMazeFound = false;
      state.flags.finalMazeLast = null;
    }
    return state.flags.mazePrototype;
  }

  function move(state, target) {
    const m = maze(state);
    if (!neighbors(m.current).includes(target)) return;
    const from = m.current;
    const key = edgeKey(from, target);
    if (!m.traversed.includes(key)) m.traversed.push(key);
    m.current = target;
    if (!m.visited.includes(target)) m.visited.push(target);
    m.visits[target] = (m.visits[target] || 0) + 1;
    m.moves += 1;
  }

  function exitMaze(state) {
    const m = maze(state);
    const from = m.current;
    const key = edgeKey(from, EXIT_NODE);
    if (!m.traversed.includes(key)) m.traversed.push(key);
    if (!m.visited.includes(EXIT_NODE)) m.visited.push(EXIT_NODE);
    m.current = EXIT_NODE;
    m.visits[EXIT_NODE] = (m.visits[EXIT_NODE] || 0) + 1;
    m.moves += 1;
    m.solved = true;
    state.flags.finalMazeFound = true;
  }

  function direction(from, to) {
    const a = NODES[from], b = NODES[to];
    if (!a || !b) return '';
    if (b.x > a.x) return 'Est';
    if (b.x < a.x) return 'Ouest';
    if (b.y > a.y) return 'Sud';
    return 'Nord';
  }

  function point(node) {
    return { x: 58 + node.x * 92, y: 48 + node.y * 82 };
  }

  function mapHtml(state) {
    const m = maze(state);
    const visited = new Set(m.visited);
    const traversed = new Set(m.traversed);
    const current = m.current;
    const currentNeighbors = new Set(neighbors(current));

    let lines = '';
    for (const [a,b] of EDGES) {
      const pa = point(NODES[a]), pb = point(NODES[b]);
      const key = edgeKey(a,b);
      if (traversed.has(key)) {
        lines += `<line class="maze-map-edge is-traversed" x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" />`;
        continue;
      }

      // Depuis la position actuelle, on voit qu’un passage existe, mais pas où il mène.
      if (a === current || b === current) {
        const from = point(NODES[current]);
        const otherId = a === current ? b : a;
        const to = point(NODES[otherId]);
        const ratio = .38;
        const sx = from.x + (to.x - from.x) * ratio;
        const sy = from.y + (to.y - from.y) * ratio;
        lines += `<line class="maze-map-edge is-visible" x1="${from.x}" y1="${from.y}" x2="${sx}" y2="${sy}" />`;
      }
    }

    let nodes = '';
    for (const [id,node] of Object.entries(NODES)) {
      if (!visited.has(id)) continue;
      const p = point(node);
      const cls = id === current ? ' is-current' : id === 'a' ? ' is-entry' : id === 'j' ? ' is-exit' : '';
      const label = id === current ? '●' : id === 'a' ? 'E' : id === 'j' ? 'S' : '';
      nodes += `<g class="maze-map-node${cls}" transform="translate(${p.x} ${p.y})">
        <circle r="11"></circle>
        ${label ? `<text text-anchor="middle" dominant-baseline="central">${label}</text>` : ''}
      </g>`;
    }

    return `<section class="maze-map-shell" aria-label="Carte du labyrinthe révélée au fur et à mesure">
      <div class="maze-map-head">
        <strong>Carte tracée au fur et à mesure</strong>
        <span>${m.moves} déplacement${m.moves > 1 ? 's' : ''}</span>
      </div>
      <svg class="maze-map" viewBox="0 0 500 390" role="img" aria-label="Carte des couloirs déjà parcourus">
        ${lines}
        ${nodes}
      </svg>
      <div class="maze-map-legend"><span><b class="legend-current">●</b> position</span><span><b class="legend-entry">E</b> entrée</span><span><i></i> parcouru</span><span><i class="is-dashed"></i> passage visible</span></div>
    </section>`;
  }

  function locationHtml(state) {
    const m = maze(state);
    const node = NODES[m.current];
    const repeat = (m.visits[m.current] || 0) > 1;
    let repeatText = '';

    if (repeat && m.current === 'a') {
      repeatText = '<p class="maze-return"><strong>Tu reconnais la porte.</strong> Le dédale vient de te ramener presque à ton point de départ.</p>';
    } else if (repeat) {
      repeatText = `<p class="maze-return"><strong>Tu reconnais cet endroit.</strong> Tu es déjà passé par ici.</p>`;
    }

    return `<p>${node.text}</p>${repeatText}`;
  }

  const scene = book.story.c209;
  scene.title = 'Le labyrinthe impossible';
  scene.text = state => {
    const m = maze(state);
    return `
      ${m.moves === 0 ? `<p>Tu pousses la porte aux dimensions inhumaines et entres dans le dédale.</p>
      <p>Cette fois, tu décides de ne plus te fier à ton intuition. À chaque intersection, tu mémorises les virages et reconstruis mentalement le chemin parcouru.</p>` : ''}
      ${locationHtml(state)}
      ${mapHtml(state)}
      <p class="maze-map-instruction">Les traits pleins correspondent uniquement aux couloirs que tu as réellement parcourus. Les pointillés montrent les directions visibles depuis ta position actuelle.</p>
    `;
  };

  scene.choices = state => {
    const m = maze(state);
    if (m.solved) return [{ label: 'Poursuivre vers la faille', to: 'c223' }];

    return neighbors(m.current).map(target => {
      if (target === EXIT_NODE) {
        return {
          label: `${direction(m.current, target)} — ${EDGE_HINTS[edgeKey(m.current,target)] || 'poursuivre'}`,
          to: 'c223',
          effect: exitMaze
        };
      }

      const known = m.visited.includes(target);
      const hint = EDGE_HINTS[edgeKey(m.current,target)] || 'le passage';
      const targetName = NODES[target].name.toLowerCase();
      return {
        label: known
          ? `${direction(m.current,target)} — revenir vers ${targetName}`
          : `${direction(m.current,target)} — ${hint}`,
        stay: true,
        effect: s => move(s, target)
      };
    });
  };

  const style = document.createElement('style');
  style.id = 'maze-prototype-dev-style';
  style.textContent = `
    .maze-map-shell {
      margin: 22px 0 14px;
      padding: 12px;
      border: 1px solid rgba(117, 84, 47, .55);
      background: rgba(75, 52, 29, .075);
      box-shadow: inset 0 0 24px rgba(66, 45, 25, .06);
    }
    .maze-map-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 12px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .maze-map-head span { opacity: .62; }
    .maze-map {
      width: 100%;
      max-height: 390px;
      display: block;
      background:
        radial-gradient(circle at center, rgba(91,65,37,.08), transparent 62%);
    }
    .maze-map-edge {
      fill: none;
      stroke-linecap: round;
    }
    .maze-map-edge.is-traversed {
      stroke: rgba(76, 55, 34, .9);
      stroke-width: 7;
    }
    .maze-map-edge.is-visible {
      stroke: rgba(94, 72, 47, .55);
      stroke-width: 5;
      stroke-dasharray: 8 9;
    }
    .maze-map-node circle {
      fill: #d5c39c;
      stroke: #503c27;
      stroke-width: 3;
    }
    .maze-map-node text {
      fill: #3b2b1c;
      font-size: 11px;
      font-weight: 700;
      font-family: Georgia, serif;
    }
    .maze-map-node.is-current circle {
      fill: #35291e;
      stroke-width: 4;
      r: 14;
    }
    .maze-map-node.is-current text { fill: #f2e5c7; font-size: 13px; }
    .maze-map-node.is-entry circle { fill: #bfa87d; }
    .maze-map-node.is-exit circle { fill: #efe0bd; }
    .maze-map-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 7px 14px;
      margin-top: 4px;
      font-size: 11px;
      opacity: .72;
    }
    .maze-map-legend span { display: inline-flex; align-items: center; gap: 5px; }
    .maze-map-legend b {
      width: 18px;
      height: 18px;
      display: inline-grid;
      place-items: center;
      border: 1px solid currentColor;
      border-radius: 50%;
      font-size: 9px;
    }
    .maze-map-legend i {
      width: 25px;
      height: 0;
      border-top: 4px solid currentColor;
      display: inline-block;
    }
    .maze-map-legend i.is-dashed { border-top-style: dashed; opacity: .6; }
    .maze-return {
      padding: 10px 12px;
      border-left: 3px solid rgba(108, 76, 42, .65);
      background: rgba(255,255,255,.12);
    }
    .maze-map-instruction {
      margin: 9px 0 0;
      font-size: .88em;
      opacity: .72;
      text-align: center;
    }
    @media (max-width: 560px) {
      .maze-map-shell { padding: 8px; }
      .maze-map { max-height: 310px; }
      .maze-map-head { font-size: 10px; }
      .maze-map-legend { font-size: 10px; gap: 5px 9px; }
    }
  `;
  document.head.appendChild(style);
})();
