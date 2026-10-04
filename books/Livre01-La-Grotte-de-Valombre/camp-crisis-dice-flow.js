/* DEV — Crise d’Anselme : le premier échange suit le flux normal des combats.
   On arrive sur la scène, on clique « Jeter les dés », le résultat s’affiche sur place,
   puis seulement les réactions tactiques deviennent disponibles. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const STORY = book?.story;
  if (!STORY?.campAidArrival || !STORY?.campAidTactics) return;

  const arrival = STORY.campAidArrival;
  const tactics = STORY.campAidTactics;
  const arrivalIntro = arrival.text;
  const tacticalChoices = tactics.choices;

  function d6() {
    const a = new Uint32Array(1);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(a);
      return (a[0] % 6) + 1;
    }
    return Math.floor(Math.random() * 6) + 1;
  }

  function hasItem(state, id) {
    const inv = state.inventory;
    if (Array.isArray(inv)) return inv.some(item => (typeof item === 'string' ? item === id : item?.id === id));
    if (inv && typeof inv === 'object') return Boolean(inv[id]);
    return false;
  }

  function currentForce(state) {
    return Math.max(3,
      Number(state.baseForce || 8) +
      Number(state.forceBonus || 0) +
      (hasItem(state, 'brassard_veilleurs') ? 1 : 0)
    );
  }

  function currentDexterity(state) {
    const weaponModifier = state.weapon === 'heavy' ? -4 :
      (state.weapon === 'light' || state.weapon === 'sorcerer_sword' ? -1 : 0);
    const itemBonus = (hasItem(state, 'anneau_veilleurs') ? 1 : 0) + (hasItem(state, 'bague_lueur') ? 2 : 0);
    const shieldRemaining = Number(state.protectionItems?.bouclier_chevalier?.remaining || 0);
    const shieldPenalty = hasItem(state, 'bouclier_chevalier') && shieldRemaining > 0 ? 1 : 0;
    return Math.max(3,
      Number(state.baseDexterity || 13) +
      Number(state.dexBonus || 0) +
      itemBonus -
      Number(state.dexPenalty || 0) -
      (state.flags?.collarEquipped ? 1 : 0) -
      shieldPenalty +
      weaponModifier
    );
  }

  function applyDamage(state, amount) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    let absorbed = 0;
    const broken = [];
    const defs = [
      ['bouclier_chevalier', 'Bouclier du chevalier'],
      ['casque_cabosse', 'Casque cabossé'],
      ['gantelet_veilleur', 'Gantelet de Veilleur']
    ];

    if (!state.protectionItems || typeof state.protectionItems !== 'object') state.protectionItems = {};
    for (const [id, name] of defs) {
      if (!hasItem(state, id) || remaining <= 0) continue;
      const source = state.protectionItems[id];
      if (!source) continue;
      const available = Math.max(0, Number(source.remaining || 0));
      const used = Math.min(available, remaining);
      if (!used) continue;
      source.remaining = available - used;
      remaining -= used;
      absorbed += used;
      if (available > 0 && source.remaining <= 0) broken.push(name);
    }

    const hpLost = remaining;
    state.hp = Math.max(0, Number(state.hp || 0) - hpLost);
    return { incoming: amount, absorbed, hpLost, broken };
  }

  function currentProtection(state) {
    const defs = ['bouclier_chevalier','casque_cabosse','gantelet_veilleur'];
    return defs.reduce((sum, id) => {
      if (!hasItem(state, id)) return sum;
      return sum + Math.max(0, Number(state.protectionItems?.[id]?.remaining || 0));
    }, 0);
  }

  function renderDie(value) {
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    return `<span class="die-visual">${faces[Math.max(1, Math.min(6, value)) - 1]}</span>`;
  }

  function resolveFirstRound(state) {
    if (state.flags.anselmeFirstRound) return;

    const heroDice = [d6(), d6()];
    const enemyDice = [d6(), d6()];
    const force = currentForce(state);
    const dexterity = currentDexterity(state);
    const enemyForce = 10;
    const enemyDexterity = 8;
    const heroAttack = force + dexterity + heroDice[0] + heroDice[1];
    const enemyAttack = enemyForce + enemyDexterity + enemyDice[0] + enemyDice[1];

    let outcome = 'tie';
    let damage = { incoming: 0, absorbed: 0, hpLost: 0, broken: [] };
    if (heroAttack > enemyAttack) outcome = 'hero';
    if (heroAttack < enemyAttack) {
      outcome = 'enemy';
      damage = applyDamage(state, 2);
    }

    state.flags.anselmeFirstRound = {
      heroDice,
      enemyDice,
      force,
      dexterity,
      enemyForce,
      enemyDexterity,
      heroAttack,
      enemyAttack,
      outcome,
      success: outcome === 'hero',
      damage
    };
  }

  function damageSentence(r) {
    const damage = r?.damage;
    if (!damage || r.outcome !== 'enemy') return '';
    if (damage.absorbed > 0 && damage.hpLost > 0) {
      return ` Ta protection absorbe <strong>${damage.absorbed}</strong> point${damage.absorbed > 1 ? 's' : ''} et tu perds <strong>${damage.hpLost}</strong> point${damage.hpLost > 1 ? 's' : ''} de Vie.`;
    }
    if (damage.absorbed > 0) {
      return ` Ta protection absorbe entièrement le choc.`;
    }
    return ` Tu perds <strong>${damage.hpLost}</strong> point${damage.hpLost > 1 ? 's' : ''} de Vie.`;
  }

  function firstRoundHtml(state) {
    const r = state.flags.anselmeFirstRound;
    if (!r) return '';

    const outcomeText = r.outcome === 'hero'
      ? '<strong>Tu remportes l’échange.</strong><br>Tu réussis à repousser les deux assaillants assez longtemps pour reprendre appui.'
      : r.outcome === 'enemy'
        ? `<strong>Les deux assaillants remportent l’échange.</strong><br>Ils te frappent presque ensemble.${damageSentence(r)}`
        : '<strong>Égalité.</strong><br>Tu contiens leur charge sans parvenir à les repousser.';

    const broken = r.damage?.broken?.length
      ? r.damage.broken.map(name => `<p><strong>${name} ne peut plus te protéger.</strong></p>`).join('')
      : '';

    return `
      <div class="combat-roll-result">
        <div class="combat-roll-title">Échange n° 1</div>
        <div class="combat-roll-grid">
          <div class="combat-side">
            <strong>TOI</strong>
            <div class="combat-dice">${renderDie(r.heroDice[0])}${renderDie(r.heroDice[1])}</div>
            <p>Dextérité ${r.dexterity} + Force ${r.force} + dés ${r.heroDice[0] + r.heroDice[1]}</p>
            <p class="combat-total">Attaque : <strong>${r.heroAttack}</strong></p>
          </div>
          <div class="combat-versus">VS</div>
          <div class="combat-side">
            <strong>DEUX ASSAILLANTS</strong>
            <div class="combat-dice">${renderDie(r.enemyDice[0])}${renderDie(r.enemyDice[1])}</div>
            <p>Dextérité ${r.enemyDexterity} + Force ${r.enemyForce} + dés ${r.enemyDice[0] + r.enemyDice[1]}</p>
            <p class="combat-total">Attaque : <strong>${r.enemyAttack}</strong></p>
          </div>
        </div>
        <div class="combat-outcome">${outcomeText}</div>
        <div class="combat-life-line">Ta Vie : <strong>${state.hp} / ${state.maxHp}</strong> · Protection : <strong>${currentProtection(state)}</strong></div>
      </div>
      ${broken}
      <p>Derrière eux, les deux autres abandonnent Anselme.</p>
      <p>Ils avancent maintenant vers toi.</p>
      <p>Quatre contre un. Si tu restes ici, ils vont t’encercler.</p>
      <p>À tes pieds, le feu d’Anselme brûle encore.</p>
    `;
  }

  arrival.text = state => {
    const intro = typeof arrivalIntro === 'function' ? arrivalIntro(state) : arrivalIntro;
    return `${intro || ''}${firstRoundHtml(state)}`;
  };

  arrival.choices = state => {
    if (!state.flags.anselmeFirstRound) {
      return [{
        label: 'Jeter les dés',
        stay: true,
        inlineCombat: true,
        effect: resolveFirstRound
      }];
    }
    if (state.hp <= 0) return [];
    return typeof tacticalChoices === 'function' ? tacticalChoices(state) : (tacticalChoices || []);
  };

  /* Compatibilité avec une sauvegarde créée pendant la toute première version du passage. */
  tactics.text = state => firstRoundHtml(state) || '<p>Les deux premières silhouettes fondent sur toi.</p>';
})();
