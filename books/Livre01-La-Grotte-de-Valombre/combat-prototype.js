/* DEV — Prototype combat interactif : Masse dans l’ombre, page 26 uniquement. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const scene = book?.story?.c26;
  if (!scene) return;

  const VERSION = 1;
  const KEY = 'shadowMass';

  const originalText = scene.text;
  const originalChoices = scene.choices;

  const INTENTS = {
    charge: {
      name: 'Elle va charger',
      text: 'La masse s’abaisse brutalement. Tout son poids passe vers l’avant et son épaule se tourne vers toi. Si elle part maintenant, elle frappera de tout son élan — mais son flanc restera découvert.',
      good: 'quick'
    },
    guard: {
      name: 'Elle se referme',
      text: 'La créature ralentit et ramène ses bras contre son torse. Elle ne cherche plus à avancer. Elle paraît vouloir encaisser ton prochain coup avant de répondre.',
      good: 'power'
    },
    grab: {
      name: 'Elle cherche à t’agripper',
      text: 'La masse se redresse et avance les bras ouverts. Elle ne prépare pas un coup franc : elle cherche plutôt à réduire la distance et à t’enfermer dans son allonge.',
      good: 'counter'
    }
  };

  const ACTIONS = {
    quick: {
      name: 'Attaque rapide',
      label: 'Attaque rapide — privilégier la Dextérité, mais frapper moins fort',
      description: 'Tu restes mobile et cherches à toucher avant que la masse puisse refermer la distance.',
      force: 0,
      dex: 1,
      dexPenalty: 0,
      damage: -1
    },
    power: {
      name: 'Frappe puissante',
      label: 'Frappe puissante — privilégier la Force, au prix d’un peu de Dextérité',
      description: 'Tu plantes tes appuis et engages tout ton poids dans le coup.',
      force: 1,
      dex: 0,
      dexPenalty: 1,
      damage: 1
    },
    counter: {
      name: 'Attendre et contrer',
      label: 'Attendre et contrer — aucun bonus fixe, mais très efficace si tu lis bien son mouvement',
      description: 'Tu refuses de partir le premier et attends que la créature s’engage pour exploiter son ouverture.',
      force: 0,
      dex: 0,
      dexPenalty: 0,
      damage: 0
    }
  };

  function randomIntent(except) {
    const ids = Object.keys(INTENTS).filter(id => id !== except);
    let index = 0;
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      index = a[0] % ids.length;
    } catch (e) {
      index = Math.floor(Math.random() * ids.length);
    }
    return ids[index];
  }

  function combat(state) {
    // Appeler les choix d’origine initialise le combat via le moteur normal si nécessaire.
    if (!state.combats?.[KEY]) {
      try { if (typeof originalChoices === 'function') originalChoices(state); } catch (e) {}
    }
    if (!state.combats) state.combats = {};
    if (!state.combats[KEY]) state.combats[KEY] = { hp: 8, round: 0, last: null, lastBlade: null };
    return state.combats[KEY];
  }

  function proto(state) {
    const c = combat(state);
    if (!c.interactivePrototype || c.interactivePrototype.version !== VERSION) {
      c.interactivePrototype = {
        version: VERSION,
        intent: randomIntent(null),
        lastIntent: null,
        lastAction: null,
        lastMatched: null
      };
    }
    return c.interactivePrototype;
  }

  function saveProp(obj, key) {
    return { exists: Object.prototype.hasOwnProperty.call(obj, key), value: obj[key] };
  }

  function restoreProp(obj, key, saved) {
    if (saved.exists) obj[key] = saved.value;
    else delete obj[key];
  }

  function executeAction(state, actionId, originalEffect) {
    const c = combat(state);
    const p = proto(state);
    const intentId = p.intent;
    const intent = INTENTS[intentId];
    const action = ACTIONS[actionId];
    const matched = intent.good === actionId;

    const savedForce = saveProp(state, 'forceBonus');
    const savedDex = saveProp(state, 'dexBonus');
    const savedPenalty = saveProp(state, 'dexPenalty');

    state.forceBonus = Number(state.forceBonus || 0) + action.force;
    state.dexBonus = Number(state.dexBonus || 0) + action.dex;
    state.dexPenalty = Number(state.dexPenalty || 0) + action.dexPenalty;

    // Lire correctement la posture donne un avantage supplémentaire sans changer les règles de base.
    if (matched) {
      if (actionId === 'quick') state.dexBonus += 2;
      if (actionId === 'power') state.forceBonus += 2;
      if (actionId === 'counter') {
        state.forceBonus += 1;
        state.dexBonus += 2;
      }
    }

    const beforeEnemyHp = Number(c.hp || 0);

    try {
      originalEffect(state);
    } finally {
      restoreProp(state, 'forceBonus', savedForce);
      restoreProp(state, 'dexBonus', savedDex);
      restoreProp(state, 'dexPenalty', savedPenalty);
    }

    const after = combat(state);

    // Les styles modifient légèrement les dégâts seulement si le héros a gagné l’échange.
    if (after.last?.outcome === 'hero' && action.damage !== 0) {
      if (action.damage > 0) {
        const extra = Math.min(action.damage, after.hp);
        after.hp = Math.max(0, after.hp - extra);
        after.last.damage += extra;
      } else {
        const dealt = Math.max(0, beforeEnemyHp - after.hp);
        const reduction = Math.min(Math.abs(action.damage), Math.max(0, dealt - 1));
        after.hp = Math.min(8, after.hp + reduction);
        after.last.damage = Math.max(1, after.last.damage - reduction);
      }
      after.last.enemyHp = after.hp;
    }

    p.lastIntent = intentId;
    p.lastAction = actionId;
    p.lastMatched = matched;
    p.intent = randomIntent(intentId);
  }

  function resultStrategyHtml(state) {
    const p = proto(state);
    if (!p.lastAction || !p.lastIntent) return '';
    const action = ACTIONS[p.lastAction];
    const intent = INTENTS[p.lastIntent];
    return `
      <div class="interactive-combat-recap ${p.lastMatched ? 'is-read' : 'is-missed'}">
        <strong>${action.name}</strong>
        <span>${p.lastMatched
          ? `Tu as correctement lu son mouvement : ${intent.name.toLowerCase()}. Ton choix t’a donné un avantage sur cet échange.`
          : `Ton choix ne répondait pas directement à ce qu’elle préparait (${intent.name.toLowerCase()}). L’échange s’est joué sans avantage particulier.`}</span>
      </div>`;
  }

  function intentHtml(state) {
    const c = combat(state);
    if (state.hp <= 0 || c.hp <= 0) return '';
    const p = proto(state);
    const intent = INTENTS[p.intent];
    return `
      <section class="interactive-combat-intent" aria-label="Mouvement de l’adversaire">
        <div class="interactive-combat-kicker">Observe ton adversaire</div>
        <strong>${intent.name}</strong>
        <p>${intent.text}</p>
      </section>
      <p class="interactive-combat-help">Choisis ta manière d’engager l’échange, puis les dés départagent les deux combattants comme d’habitude. Une posture peut rendre l’une de tes réponses particulièrement efficace.</p>`;
  }

  scene.text = state => {
    const base = typeof originalText === 'function' ? originalText(state) : originalText;
    return `${base}${resultStrategyHtml(state)}${intentHtml(state)}`;
  };

  scene.choices = state => {
    const c = combat(state);
    const base = typeof originalChoices === 'function' ? originalChoices(state) : (originalChoices || []);

    if (state.hp <= 0 || c.hp <= 0) return base;

    proto(state);

    const normalRoll = base.find(choice => choice && choice.inlineCombat && typeof choice.effect === 'function' && /Jeter les dés/i.test(choice.label || ''));
    if (!normalRoll) return base;

    const choices = Object.entries(ACTIONS).map(([id, action]) => ({
      label: action.label,
      stay: true,
      inlineCombat: true,
      effect: s => executeAction(s, id, normalRoll.effect)
    }));

    // Les lames de jet gardent leur comportement actuel : ressource consommable, jet de Dextérité, aucune riposte.
    const blade = base.find(choice => choice && /lame de jet/i.test(choice.label || ''));
    if (blade) choices.push(blade);

    return choices;
  };

  const style = document.createElement('style');
  style.id = 'interactive-combat-shadowmass-dev-style';
  style.textContent = `
    .interactive-combat-intent {
      margin: 18px 0 10px;
      padding: 14px 16px;
      border-left: 3px solid rgba(92, 62, 34, .72);
      background: rgba(73, 48, 27, .075);
    }
    .interactive-combat-intent .interactive-combat-kicker {
      margin-bottom: 5px;
      font-size: 11px;
      letter-spacing: .11em;
      text-transform: uppercase;
      opacity: .62;
    }
    .interactive-combat-intent > strong {
      display: block;
      margin-bottom: 5px;
      font-size: 1.02em;
    }
    .interactive-combat-intent p { margin: 0; }
    .interactive-combat-help {
      margin: 7px 0 15px;
      font-size: .9em;
      opacity: .72;
    }
    .interactive-combat-recap {
      margin: 14px 0;
      padding: 10px 13px;
      border: 1px solid rgba(94, 70, 42, .32);
      background: rgba(86, 60, 35, .055);
    }
    .interactive-combat-recap strong,
    .interactive-combat-recap span { display: block; }
    .interactive-combat-recap span { margin-top: 4px; font-size: .92em; }
    .interactive-combat-recap.is-read { border-left: 3px solid rgba(71, 91, 52, .65); }
    .interactive-combat-recap.is-missed { border-left: 3px solid rgba(108, 70, 43, .52); }
  `;
  document.head.appendChild(style);
})();
