/* DEV — PAGE 28 : au premier passage, le joueur doit d'abord explorer une branche.
   La sortie vers les profondeurs n'apparaît qu'après le déclenchement de la crise d'Anselme. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const STORY = book?.story;
  if (!STORY?.c28 || STORY.c28.__campPage28Entry) return;

  const previousChoices = STORY.c28.choices;

  STORY.c28.choices = state => {
    const source = typeof previousChoices === 'function'
      ? (previousChoices(state) || [])
      : (previousChoices || []);

    /* Dès que la crise a commencé ou a été résolue, on laisse le flux de
       camp-crisis-pass.js décider entre aider Anselme et poursuivre. */
    if (state.flags?.campBranchesLocked || state.flags?.campCrisisStarted || state.flags?.campCrisisResolved) {
      return source;
    }

    /* Premier passage : uniquement les trois détours d'exploration. */
    return source.filter(choice => choice && choice.to !== 'c37');
  };

  STORY.c28.__campPage28Entry = true;
})();
