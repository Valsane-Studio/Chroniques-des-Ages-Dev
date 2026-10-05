/* DEV — PAGE 28 : les alentours d'Anselme offrent deux détours seulement.
   Le passage descendant devient ensuite la progression principale, après la crise. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const STORY = book?.story;
  if (!STORY?.c28 || STORY.c28.__campPage28EntryV2) return;

  function choicesOf(source, state) {
    return typeof source === 'function' ? (source(state) || []) : (source || []);
  }

  function rerouteDepthChoice(choice) {
    if (!choice) return choice;
    if (choice.to !== 'c37') return choice;
    if (!/profondeur|descente|poursuivre/i.test(choice.label || '')) return choice;
    return { ...choice, to: 'c34' };
  }

  /* PAGE 28 : le tunnel n'est plus un troisième détour. */
  const previousC28Text = STORY.c28.text;
  const previousC28Choices = STORY.c28.choices;

  STORY.c28.text = state => {
    let html = typeof previousC28Text === 'function' ? previousC28Text(state) : previousC28Text;
    html = String(html || '')
      .replace(
        'Plus loin, un <strong>tunnel étroit</strong> s’enfonce dans l’obscurité.',
        'Au-delà du camp, le <strong>passage principal</strong> continue de descendre dans l’obscurité.'
      );
    return html;
  };

  STORY.c28.choices = state => {
    const source = choicesOf(previousC28Choices, state).map(rerouteDepthChoice);

    if (state.flags?.campBranchesLocked || state.flags?.campCrisisStarted || state.flags?.campCrisisResolved) {
      return source;
    }

    /* Premier passage : uniquement vieux campement OU galerie condamnée. */
    return source.filter(choice => choice && choice.to !== 'c34' && choice.to !== 'c37');
  };

  /* Dès que la crise a eu lieu, « poursuivre vers les profondeurs » mène
     obligatoirement au passage descendant avant les fissures. */
  ['campCrisis', 'campEscapeResult', 'c30'].forEach(id => {
    const scene = STORY[id];
    if (!scene || scene.__depthReroutedV2) return;
    const oldChoices = scene.choices;
    scene.choices = state => choicesOf(oldChoices, state).map(rerouteDepthChoice);
    scene.__depthReroutedV2 = true;
  });

  /* PAGE 34 devient la suite principale. */
  if (STORY.c34) {
    STORY.c34.title = 'Le passage descendant';
    const oldText = STORY.c34.text;
    const oldChoices = STORY.c34.choices;

    STORY.c34.text = state => {
      let html = typeof oldText === 'function' ? oldText(state) : oldText;
      return String(html || '')
        .replace('t’engages dans le tunnel voisin', 't’engages dans le passage descendant')
        .replace('Le passage descend doucement.', 'Le passage s’enfonce doucement vers les profondeurs.');
    };

    STORY.c34.choices = state => choicesOf(oldChoices, state)
      .filter(choice => choice && choice.to !== 'c30');
  }

  /* Parler sans approcher permet désormais de poursuivre : le disparu se tasse
     contre la paroi et laisse le héros passer. */
  if (STORY.c35) {
    const oldText = STORY.c35.text;
    STORY.c35.text = state => {
      let html = typeof oldText === 'function' ? oldText(state) : oldText;
      return String(html || '').replace(
        `<p>Tu recules sans la quitter des yeux, puis reprends le tunnel en sens inverse.</p>\n\n      <p>Lorsque tu retrouves le croisement, les sanglots continuent encore derrière toi. Tu n'as aucune envie de retourner dans ce tunnel.</p>`,
        `<p>La silhouette se tasse lentement contre la paroi, comme si elle avait compris que tu voulais passer.</p>\n\n      <p>Tu avances sans la toucher, l’arme basse mais prête. Elle ne relève pas la tête.</p>\n\n      <p>Lorsque tu t’éloignes, ses sanglots reprennent derrière toi. Tu continues vers les profondeurs sans te retourner.</p>`
      );
    };
    STORY.c35.choices = [{ label: 'Poursuivre la descente', to: 'c37' }];
  }

  /* Après le combat éventuel contre le disparu, on ne remonte plus au camp. */
  if (STORY.c38) {
    const oldChoices = STORY.c38.choices;
    STORY.c38.choices = state => choicesOf(oldChoices, state).map(choice => {
      if (!choice || choice.to !== 'c30') return choice;
      return { ...choice, label: 'Poursuivre dans le passage descendant', to: 'c37' };
    });
  }

  STORY.c28.__campPage28EntryV2 = true;
})();
