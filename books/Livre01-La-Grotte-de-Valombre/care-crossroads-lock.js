/* DEV — PAGE 113 : le carrefour des soins devient un vrai choix de route.
   Le joueur peut explorer le poste de secours OU la réserve, ou descendre
   immédiatement. Après une première exploration, un éboulement condamne
   l'autre porte et force la poursuite vers les niveaux inférieurs. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const STORY = book?.story;
  if (!STORY?.c106) return;

  function choicesOf(source, state) {
    return typeof source === 'function' ? (source(state) || []) : (source || []);
  }

  function chosenBranch(state) {
    const explicit = state.flags?.careCrossroadsChoice;
    if (explicit) return explicit;

    const aid = !!state.visited?.c107;
    const reserve = !!state.visited?.c108;
    if (aid && !reserve) return 'aid';
    if (reserve && !aid) return 'reserve';
    if (aid && reserve) return 'legacy-both';
    return null;
  }

  function markBranch(state, branch) {
    state.flags = state.flags || {};
    if (!state.flags.careCrossroadsChoice) state.flags.careCrossroadsChoice = branch;
  }

  function wrapEffect(choice, branch) {
    const oldEffect = choice?.effect;
    return {
      ...choice,
      effect: state => {
        if (typeof oldEffect === 'function') oldEffect(state);
        markBranch(state, branch);
      }
    };
  }

  const COLLAPSE_AID = `
    <p>À peine revenu au carrefour, un grondement sourd traverse la voûte. Des pierres se détachent du plafond et s’abattent devant la porte de la réserve.</p>
    <p>En quelques secondes, l’accès disparaît sous un amas de blocs. L’escalier, lui, est encore libre. Mieux vaut descendre avant que la voûte ne cède davantage.</p>`;

  const COLLAPSE_RESERVE = `
    <p>À peine revenu au carrefour, un grondement sourd traverse la voûte. Des pierres se détachent du plafond et s’abattent devant la porte du poste de secours.</p>
    <p>En quelques secondes, l’accès disparaît sous un amas de blocs. L’escalier, lui, est encore libre. Mieux vaut descendre avant que la voûte ne cède davantage.</p>`;

  const scene = STORY.c106;
  const originalText = scene.text;
  const originalChoices = scene.choices;

  scene.text = state => {
    const html = typeof originalText === 'function' ? originalText(state) : originalText;
    const branch = chosenBranch(state);
    if (branch === 'aid') return `${html || ''}${COLLAPSE_AID}`;
    if (branch === 'reserve') return `${html || ''}${COLLAPSE_RESERVE}`;
    return html;
  };

  scene.choices = state => {
    const branch = chosenBranch(state);
    const source = choicesOf(originalChoices, state);

    if (branch) {
      const descend = source.find(choice => choice?.to === 'c109');
      return [{
        ...(descend || {to:'c109'}),
        label:'Descendre vers les niveaux inférieurs',
        effect: descend?.effect
      }];
    }

    return source.map(choice => {
      if (!choice) return choice;
      if (choice.to === 'c107') return wrapEffect(choice, 'aid');
      if (choice.to === 'c108') return wrapEffect(choice, 'reserve');
      if (choice.to === 'c109') return wrapEffect(choice, 'stairs');
      return choice;
    });
  };
})();
