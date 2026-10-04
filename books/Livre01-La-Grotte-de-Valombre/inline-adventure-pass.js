/* DEV — Passage de cohérence global :
   - choix déjà naturellement présent dans la prose => encre bleue, sans cadre ;
   - test / combat / décision non formulée dans le récit => bloc léger conservé.
   Ce fichier complète les prototypes des premières pages et sert aussi de filet de sécurité. */
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  if (!book?.story) return;

  const to = destination => choice => choice?.to === destination;

  function choicesFor(scene, state) {
    return typeof scene?.choices === 'function' ? scene.choices(state) : (scene?.choices || []);
  }

  function choiceIndex(scene, state, matcher) {
    const list = choicesFor(scene, state);
    if (typeof matcher === 'function') return list.findIndex(matcher);
    const labels = Array.isArray(matcher) ? matcher : [matcher];
    return list.findIndex(choice => labels.includes(choice?.label));
  }

  function ink(scene, state, matcher, copy) {
    const index = choiceIndex(scene, state, matcher);
    if (index < 0) return null;
    return {
      index,
      html: `<span class="inline-story-choice inline-story-choice-in-text inline-story-pill" data-choice-index="${index}" role="button" tabindex="0">${copy}</span>`
    };
  }

  function alreadyIntegrated(html, index) {
    return html.includes(`data-choice-index="${index}"`);
  }

  function mark(html, scene, state, matcher, needle, copy) {
    const token = ink(scene, state, matcher, copy);
    if (!token || alreadyIntegrated(html, token.index)) return html;
    if (typeof needle === 'string') {
      return html.includes(needle) ? html.replace(needle, token.html) : html;
    }
    if (needle instanceof RegExp) return html.replace(needle, token.html);
    return html;
  }

  function appendChoiceSentence(html, scene, state, matcher, copy, sentence) {
    const token = ink(scene, state, matcher, copy);
    if (!token || alreadyIntegrated(html, token.index)) return html;
    return `${html}${sentence(token.html)}`;
  }

  function wrap(id, transform) {
    const scene = book.story[id];
    if (!scene || scene.__globalInteractiveInkPass) return;
    const previous = scene.text;
    scene.text = state => {
      const html = typeof previous === 'function' ? previous(state) : previous;
      return html ? transform(html, state, scene) : html;
    };
    scene.__globalInteractiveInkPass = true;
  }

  /* Page 028 — filet de sécurité : cette scène doit toujours être entièrement
     interactive dans la description du camp. */
  wrap('c28', (html, state, scene) => {
    html = mark(html, scene, state, to('c30'), '<strong>ancien campement</strong>', 'ancien campement');
    html = mark(html, scene, state, to('c31'), 'une galerie est presque entièrement <strong>barrée par un énorme bloc de pierre</strong>', 'une galerie presque entièrement barrée par un énorme bloc de pierre');
    html = mark(html, scene, state, to('c34'), 'un <strong>tunnel étroit</strong> s’enfonce dans l’obscurité', 'un tunnel étroit qui s’enfonce dans l’obscurité');
    html = appendChoiceSentence(html, scene, state, to('c37'), 'un passage plus sombre qui poursuit la descente', token => `<p>Derrière le feu, ${token} disparaît sous la roche.</p>`);
    return html;
  });

  /* Trois voies déjà décrites dans le paysage. */
  wrap('c40', (html, state, scene) => {
    html = mark(html, scene, state, to('c41'), 'un sentier descend vers une étendue d’eau parfaitement noire', 'un sentier descend vers une étendue d’eau parfaitement noire');
    html = mark(html, scene, state, to('c44'), 'un ancien escalier de pierre grimpe le long de la falaise', 'un ancien escalier de pierre grimpe le long de la falaise');
    html = mark(html, scene, state, to('c58'), 'une corniche étroite rejoint un pont suspendu au-dessus d’un gouffre sans fond visible', 'une corniche étroite rejoint un pont suspendu au-dessus d’un gouffre sans fond visible');
    return html;
  });

  wrap('c48', (html, state, scene) =>
    mark(html, scene, state, to('c66'), 'les arches et les marches noyées', 'les arches et les marches noyées'));

  wrap('c55', (html, state, scene) => {
    html = mark(html, scene, state, to('c56'), 'entrer dans la fissure', 'entrer dans la fissure');
    html = mark(html, scene, state, to('c57'), 'continuer à monter', 'continuer à monter');
    return html;
  });

  wrap('c64', (html, state, scene) =>
    mark(html, scene, state, to('c69'), 'une place baignée de soleil', 'une place baignée de soleil'));

  wrap('c67', (html, state, scene) =>
    mark(html, scene, state, to('c69'), 'la grande rue centrale', 'la grande rue centrale'));

  wrap('c68', (html, state, scene) =>
    mark(html, scene, state, to('c69'), 'La place ensoleillée', 'La place ensoleillée'));

  wrap('c69', (html, state, scene) =>
    mark(html, scene, state, to('c70'), 'gravures monumentales', 'gravures monumentales'));

  wrap('c70', (html, state, scene) =>
    mark(html, scene, state, to('c71'), 'la scène suivante', 'la scène suivante'));

  wrap('c75', (html, state, scene) =>
    mark(html, scene, state, to('c76'), 'entres dans le réfectoire', 'entres dans le réfectoire'));

  wrap('c76', (html, state, scene) =>
    mark(html, scene, state, to('c77'), 'un passage conduit au poste de garde', 'un passage conduit au poste de garde'));

  wrap('c80', (html, state, scene) =>
    mark(html, scene, state, to('c81'), 'l’ancienne armurerie', 'l’ancienne armurerie'));

  wrap('c83', (html, state, scene) =>
    mark(html, scene, state, to('c84'), 'le passage des appartements', 'le passage des appartements'));

  wrap('c84', (html, state, scene) =>
    mark(html, scene, state, to('c85'), 'vers la sortie', 'vers la galerie de sortie'));

  wrap('c85', (html, state, scene) => {
    html = mark(html, scene, state, to('c86'), 'Une fissure étroite', 'Une fissure étroite');
    html = mark(html, scene, state, to('c91'), 'La sortie des quartiers', 'La sortie des quartiers');
    return html;
  });

  wrap('c98', (html, state, scene) =>
    mark(html, scene, state, to('c104'), 'une salle ronde', 'une salle ronde'));

  wrap('c99', (html, state, scene) =>
    mark(html, scene, state, to('c100'), 'Les premiers cahiers accessibles', 'Les premiers cahiers accessibles'));

  wrap('c101', (html, state, scene) =>
    mark(html, scene, state, to('c102'), 'la salle suivante', 'la salle suivante'));

  wrap('c102', (html, state, scene) => {
    html = mark(html, scene, state, to('c103'), 'Un vieux mécanisme grince', 'Un vieux mécanisme grince');
    html = mark(html, scene, state, to('c138'), 'Une armoire éventrée', 'Une armoire éventrée');
    html = mark(html, scene, state, to('c197'), 'Le couloir continue au-delà', 'Le couloir continue au-delà');
    return html;
  });

  wrap('c106', (html, state, scene) => {
    html = mark(html, scene, state, to('c107'), 'un poste de secours', 'un poste de secours');
    html = mark(html, scene, state, to('c108'), 'une petite réserve', 'une petite réserve');
    html = mark(html, scene, state, to('c109'), 'un escalier descendant', 'un escalier descendant');
    return html;
  });

  wrap('c107', (html, state, scene) => {
    html = mark(html, scene, state, to('c139'), 'Une haute armoire médicale', 'Une haute armoire médicale');
    html = mark(html, scene, state, to('c184'), 'quelques livres oubliés', 'quelques livres oubliés');
    html = mark(html, scene, state, to('c186'), 'la trappe secrète', 'la trappe secrète');
    return html;
  });

  wrap('c115', (html, state, scene) =>
    mark(html, scene, state, to('c116'), 'une galerie descendante', 'une galerie descendante'));

  wrap('c116', (html, state, scene) =>
    mark(html, scene, state, to('c172'), 'une toux rauque retentit dans un passage latéral', 'une toux rauque retentit dans un passage latéral'));

  wrap('c117', (html, state, scene) =>
    mark(html, scene, state, to('c152'), 's’enfonce sous la cité', 's’enfonce sous la cité'));

  wrap('c131', (html, state, scene) => {
    html = mark(html, scene, state, to('c65'), 'fouiller sa sacoche', 'fouiller sa sacoche');
    html = mark(html, scene, state, to('c64'), 'poursuivre vers la porte', 'poursuivre vers la porte');
    return html;
  });

  wrap('c138', (html, state, scene) =>
    mark(html, scene, state, to('c197'), 'Une traînée de poussière se prolonge vers le couloir', 'Une traînée de poussière se prolonge vers le couloir'));

  /* Dans le dédale, la créature reste une action de combat encadrée ;
     les deux échappatoires, elles, sont déjà physiquement présentes dans le texte. */
  wrap('c152', (html, state, scene) => {
    html = mark(html, scene, state, to('c155'), 'un renfoncement peut te dissimuler', 'un renfoncement peut te dissimuler');
    html = mark(html, scene, state, to('c157'), 'une fente étroite s’ouvre dans la roche', 'une fente étroite s’ouvre dans la roche');
    return html;
  });

  wrap('c157', (html, state, scene) =>
    mark(html, scene, state, to('c158'), 'Une arête rocheuse traverse le vide', 'Une arête rocheuse traverse le vide'));

  wrap('c163', (html, state, scene) => {
    html = mark(html, scene, state, to('c164'), 'Une sacoche reste prise sous la sangle d’un manteau', 'Une sacoche reste prise sous la sangle d’un manteau');
    html = mark(html, scene, state, to('c165'), 'Tu dois repartir', 'Tu dois repartir');
    return html;
  });

  wrap('c168', (html, state, scene) => {
    html = mark(html, scene, state, to('c169'), 'une ouverture à peine assez large pour ramper subsiste', 'une ouverture à peine assez large pour ramper subsiste');
    html = mark(html, scene, state, to('c170'), 'des dalles disjointes dessinent un passage plus direct au-dessus d’un gouffre', 'des dalles disjointes dessinent un passage plus direct au-dessus d’un gouffre');
    return html;
  });

  wrap('c179', (html, state, scene) =>
    mark(html, scene, state, to('c183'), 'passer la prochaine porte', 'passer la prochaine porte'));

  wrap('c183', (html, state, scene) =>
    mark(html, scene, state, to('c201'), 'Une immense ouverture se dessine devant toi', 'Une immense ouverture se dessine devant toi'));

  wrap('c186', (html, state, scene) => {
    html = mark(html, scene, state, to('c187'), 'un cahier couvert d’une écriture serrée', 'un cahier couvert d’une écriture serrée');
    html = mark(html, scene, state, to('c188'), 'Un grand coffre est ouvert', 'Un grand coffre est ouvert');
    return html;
  });

  wrap('c187', (html, state, scene) =>
    mark(html, scene, state, to('c188'), 'le coffre ouvert', 'le coffre ouvert'));

  wrap('c202', (html, state, scene) =>
    mark(html, scene, state, to('c203'), 'une porte gigantesque est sculptée à même la roche', 'une porte gigantesque est sculptée à même la roche'));

  /* La faille finale : les trois passages sont directement visibles. */
  wrap('c223', (html, state, scene) => {
    html = mark(html, scene, state, to('c224'), 'Une petite échelle de corde', 'Une petite échelle de corde');
    html = mark(html, scene, state, to('c226'), 'des prises irrégulières courent le long de la paroi', 'des prises irrégulières courent le long de la paroi');
    html = mark(html, scene, state, to('c230'), 'une fissure juste assez large pour t’y glisser', 'une fissure juste assez large pour t’y glisser');
    return html;
  });

  wrap('c228', (html, state, scene) =>
    mark(html, scene, state, to('c210'), 'une porte entrebâillée laisse passer une faible lumière', 'une porte entrebâillée laisse passer une faible lumière'));

  wrap('c234', (html, state, scene) => {
    html = mark(html, scene, state, to('c224'), 'L’échelle de corde', 'L’échelle de corde');
    html = mark(html, scene, state, to('c226'), 'les prises sur la gauche', 'les prises sur la gauche');
    return html;
  });

  /* Page 238 : les deux issues physiques passent dans le récit ;
     l'ampoule blanche reste un vrai bouton d'action/inventaire. */
  wrap('c238', (html, state, scene) => {
    html = mark(html, scene, state, to('c234'), 'l’étroit passage par lequel tu es entré', 'l’étroit passage par lequel tu es entré');
    html = mark(html, scene, state, to('c232'), 'La sortie est de l’autre côté de la salle', 'La sortie est de l’autre côté de la salle');
    return html;
  });
})();
