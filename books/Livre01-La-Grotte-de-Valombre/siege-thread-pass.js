/* DEV — Fil rouge de siège / poursuite.
   Objectif : donner à la Grotte de Valombre une pression active et progressive,
   sans transformer chaque embranchement en accident opportun.

   Progression :
   - les frottements du passage des fissures existent déjà dans book.js ;
   - un premier choc métallique se fait entendre derrière le joueur ;
   - une trace fraîche apparaît dans la Cité morte ;
   - PAGE 113 rend la poursuite explicite et limite le temps d'exploration ;
   - plus bas, le joueur se sent pris entre une menace devant et une autre derrière ;
   - il aperçoit enfin brièvement la silhouette qui le suit ;
   - la caverne des condamnés referme l'étau et donne un payoff visuel au motif métallique.
*/
(function () {
  'use strict';

  const book = window.BookRegistry?.get?.('ecuyer-01');
  const STORY = book?.story;
  if (!STORY) return;

  function wrapText(id, transform) {
    const scene = STORY[id];
    if (!scene || scene.__siegeThreadWrapped) return;
    const previous = scene.text;
    scene.text = state => {
      const html = typeof previous === 'function' ? previous(state) : previous;
      return transform(String(html || ''), state, scene);
    };
    scene.__siegeThreadWrapped = true;
  }

  /* PAGE 40 — juste après les fissures. Les petits bruits dans la pierre cessent,
     mais un autre son, différent, apparaît pour la première fois. */
  wrapText('c40', html => html.replace(
    '<p>Trois voies s’enfoncent dans ce monde impossible.</p>',
    `<p>Très loin derrière toi, dans le passage que tu viens de quitter, quelque chose heurte la pierre avec un bruit de métal.</p>
     <p>Une seule fois.</p>
     <p>L’écho se perd dans l’immensité avant que tu puisses savoir ce qui l’a produit.</p>
     <p>Trois voies s’enfoncent dans ce monde impossible.</p>`
  ));

  /* PAGE 69 — pas de nouveau bruit : une preuve physique. La poursuite ne doit
     pas devenir un simple refrain sonore. */
  wrapText('c69', html => html.replace(
    '<p>Une chaise est restée près d’un seuil. Tu pourrais presque croire que quelqu’un va sortir pour la rentrer.</p>',
    `<p>Près d’une arcade, une longue rainure coupe la poussière du sol. Elle est irrégulière, comme si une pièce de métal avait été traînée sur la pierre.</p>
     <p>La poussière n’a pas encore eu le temps de retomber dans la marque.</p>
     <p>Une chaise est restée près d’un seuil. Tu pourrais presque croire que quelqu’un va sortir pour la rentrer.</p>`
  ));

  /* PAGE 113 est gérée par care-crossroads-lock.js : le bruit derrière le joueur
     devient alors une vraie contrainte de temps. On ne duplique rien ici. */

  /* PAGE 138 — le joueur comprend que le danger n'est plus seulement derrière lui.
     Le coup sourd déjà présent en contrebas reste intact et le raclement revient au-dessus. */
  wrapText('c117', html => html.replace(
    '<p>L’air se réchauffe. Un coup sourd résonne plus bas. Tu resserres ta prise sur ton arme.</p>',
    `<p>L’air se réchauffe. Un coup sourd résonne plus bas. Tu resserres ta prise sur ton arme.</p>
     <p>Puis, très loin au-dessus de toi, un raclement métallique descend à son tour dans la cage d’escalier.</p>
     <p>Un bruit plus bas. Un autre derrière.</p>
     <p>Pour la première fois, tu as réellement la sensation d’être pris entre deux présences.</p>`
  ));

  /* PAGE 169 — la masse du dédale est déjà devant. Le fil rouge derrière transforme
     le choix existant en véritable décision sous pression, sans ajouter de nouveau combat. */
  wrapText('c152', html => html.replace(
    '<p>À gauche, une fente étroite s’ouvre dans la roche. À droite, un renfoncement peut te dissimuler. La chose approche.</p>',
    `<p>À gauche, une fente étroite s’ouvre dans la roche. À droite, un renfoncement peut te dissimuler. La chose approche.</p>
     <p>Derrière toi, beaucoup plus loin dans le dédale, le raclement métallique retentit de nouveau.</p>
     <p>Il n’y a plus seulement quelque chose devant toi.</p>`
  ));

  /* PAGE 196 — première confirmation visuelle. On reste volontairement vague :
     ni visage, ni identité, seulement une silhouette et le métal qui frotte. */
  wrapText('c179', html => html.replace(
    '<p>La dernière galerie s’incline vers une porte entrouverte. Au-delà, aucun bruit.</p>',
    `<p>La dernière galerie s’incline vers une porte entrouverte. Au-delà, aucun bruit.</p>
     <p>Tu jettes un regard derrière toi.</p>
     <p>Au dernier coude, une forme se tient une fraction de seconde dans la pénombre. Elle paraît humaine, mais voûtée de côté. Quelque chose de métallique pend à son épaule et touche le sol.</p>
     <p>La forme s’immobilise dès que tu la regardes. Puis elle recule derrière la pierre.</p>
     <p>Pour la première fois, tu sais que le bruit avait un corps.</p>`
  ));

  /* PAGE 201 — fermeture de l'étau : horde devant, poursuivant derrière. */
  wrapText('c201', html => html.replace(
    '<p>Tu dégaines ton arme. Impossible de leur échapper.</p>',
    `<p>Derrière toi, dans la galerie par laquelle tu viens d’entrer, le raclement métallique reprend.</p>
     <p>Cette fois, il ne s’arrête pas.</p>
     <p>Devant toi, les condamnés se lèvent. Derrière, la silhouette approche.</p>
     <p>Tu dégaines ton arme. Il faut ouvrir un passage avant d’être enfermé entre les deux.</p>`
  ));

  /* PAGE 202 — payoff discret. Le joueur identifie enfin la source du bruit,
     sans savoir si elle le chassait réellement ou si elle obéissait au même appel. */
  wrapText('c202', html => html.replace(
    '<p>Il te faut quelques minutes pour reprendre ton souffle et trouver le courage de continuer.</p>',
    `<p>Près de l’entrée de la caverne, un corps différent des autres gît sur le côté.</p>
     <p>Une ancienne plaque d’armure de Veilleur est encore attachée à son épaule. L’un de ses bords est poli jusqu’au métal nu, comme s’il avait frotté contre la pierre pendant des kilomètres.</p>
     <p>Tu reconnais enfin la source du raclement qui descendait derrière toi.</p>
     <p>Tu ne sauras jamais si cette chose te traquait… ou si elle était, elle aussi, attirée vers les profondeurs.</p>
     <p>Il te faut quelques minutes pour reprendre ton souffle et trouver le courage de continuer.</p>`
  ));
})();
