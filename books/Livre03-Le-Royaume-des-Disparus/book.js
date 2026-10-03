/* Livre 03 — Le Royaume des disparus */
(function(){
'use strict';

const TERROR_MAX=9;
function heroGender(s){return s.heroGender==='female'?'female':'male';}
function heroName(s){return heroGender(s)==='female'?'Pema':'Tenzin';}
function heroRank(){return 'Guide de haute montagne';}
function setHeroIdentity(s,g){s.heroGender=g==='female'?'female':'male';s.heroName=heroName(s);}
function currentForce(s){return Number.isFinite(s.baseForce)?s.baseForce:3;}
function currentDexterity(s){return Number.isFinite(s.baseDexterity)?s.baseDexterity:5;}
function combatPower(s){return Number.isFinite(s.weaponPower)?s.weaponPower:0;}
function weaponLabel(s){return s.weaponLabel||'Aucune';}
function currentTerror(s){return Math.max(0,Math.min(TERROR_MAX,Number(s.terror)||0));}
function addTerror(s,n=1){s.terror=Math.max(0,Math.min(TERROR_MAX,currentTerror(s)+Math.max(0,Number(n)||0)));if(s.terror>=TERROR_MAX)s.flags.terrorMax=true;return s.terror;}
function applyDamage(s,a){const incoming=Math.max(0,Math.floor(Number(a)||0));s.hp=Math.max(0,s.hp-incoming);return{incoming,absorbed:0,hpLost:incoming,heroHp:s.hp};}

function createInitialState(){
  return {
    node:'start',pageMapVersion:1,heroGender:'male',heroName:'Tenzin',
    inventory:{},flags:{},visited:{},history:[],journal:'',
    hp:18,maxHp:18,baseForce:3,baseDexterity:5,
    terror:0,maxTerror:TERROR_MAX,
    weapon:'none',weaponPower:0,weaponLabel:'Aucune',
    damageRolls:{},damageRollResults:{},lastDice:null,lastTotal:null,lastStat:null,lastStatName:'',rollCount:0,currentCheckpoint:null
  };
}

const STORY={
 start:{sheet:true,number:'FICHE DU HÉROS',title:'Choisis ton personnage',text:s=>`
   <div class="hero-sheet">
     <div class="hero-selection-title">Qui veux-tu incarner ?</div>
     <div class="hero-selection-copy">La même aventure et les mêmes caractéristiques. Seuls ton identité et ton portrait changent.</div>
     <div class="hero-choice-grid">
       <label class="hero-choice-card ${heroGender(s)==='male'?'selected':''}"><input class="hero-gender-input" type="radio" name="heroGenderChoice" value="male" ${heroGender(s)==='male'?'checked':''}><span class="hero-choice-name">Tenzin</span><span class="hero-choice-rank">Guide de haute montagne</span></label>
       <label class="hero-choice-card ${heroGender(s)==='female'?'selected':''}"><input class="hero-gender-input" type="radio" name="heroGenderChoice" value="female" ${heroGender(s)==='female'?'checked':''}><span class="hero-choice-name">Pema</span><span class="hero-choice-rank">Guide de haute montagne</span></label>
     </div>
     <div class="hero-sheet-row"><span class="hero-label">Nom</span><span class="hero-value"><strong>${heroName(s)}</strong></span></div>
     <div class="hero-sheet-row"><span class="hero-label">Origine</span><span class="hero-value">Chhokangparo · Vallée de Tsum</span></div>
     <div class="hero-sheet-grid hero-sheet-tag-grid">
       <div class="tag"><span class="tag-copy"><small>Vie</small><strong>${s.hp}/${s.maxHp}</strong></span></div>
       <div class="tag"><span class="tag-copy"><small>Dextérité</small><strong>${currentDexterity(s)}</strong></span></div>
       <div class="tag"><span class="tag-copy"><small>Force</small><strong>${currentForce(s)}</strong></span></div>
       <div class="tag"><span class="tag-copy"><small>Terreur</small><strong>${currentTerror(s)}/${TERROR_MAX}</strong></span></div>
     </div>
   </div>`,choices:[{label:'Continuer',to:'startRules',effect:s=>setHeroIdentity(s,heroGender(s))}]},

 startRules:{sheet:true,number:'RÈGLES DU JEU',title:'Avant de commencer',text:s=>`
   <div class="hero-sheet">
     <div class="combat-rules-card">
       <div class="combat-rules-title">Règles des combats</div>
       <p>Lors d’un combat, ton adversaire et toi lancez chacun <strong>2 dés</strong> et ajoutez votre <strong>Force</strong> et votre <strong>Dextérité</strong>. Le meilleur total remporte l’échange. En cas d’égalité, personne n’est blessé.</p>
       <p>Les dégâts dépendront de l’arme utilisée. Les détails utiles seront toujours indiqués au moment du combat.</p>
     </div>
     <div class="hero-characteristics" role="note">
       <div class="hero-info-title">Terreur</div>
       <p>Ta Terreur commence à <strong>0</strong>. Certaines situations peuvent l’augmenter.</p>
       <p>Plus elle monte, plus tes perceptions peuvent devenir incertaines : un bruit, un mouvement, une forme dans la roche… tout ne sera peut-être pas exactement ce qu’il paraît.</p>
       <p>Si ta Terreur atteint <strong>${TERROR_MAX}</strong>, tu n’es plus capable de poursuivre normalement l’aventure.</p>
     </div>
     <div class="hero-characteristics" role="note">
       <div class="hero-info-title">Avant de commencer</div>
       <p>En bas de l’écran, tu peux consulter à tout moment tes caractéristiques, ton inventaire et ton journal.</p>
       <p>Certains chemins, objets ou décisions pourront modifier durablement la suite de ton voyage.</p>
     </div>
   </div>`,choices:[{label:'Commencer l’aventure',to:'c0'}]},

 c0:{title:'',text:s=>`<p>Chhokangparo, haute vallée de Tsum, au nord du Népal.</p><p>Tu as grandi ici, dans un village accroché à la montagne, entouré de champs pauvres, de murs de pierre et de sommets qui ferment l’horizon.</p><p>Ta famille n’a jamais possédé grand-chose. Très jeune, tu as appris à porter, marcher, observer le ciel et écouter la neige. Avec les années, tu es devenu ${heroGender(s)==='female'?'une guide':'un guide'} de haute montagne. Tu accompagnes ceux qui connaissent moins bien ces reliefs que toi, tu poses des cordes, repères les passages dangereux et sais quand il faut renoncer.</p><p>Depuis l’enfance, pourtant, il existe un endroit dont personne ici ne parle de la même manière que des autres montagnes.</p><p>Au-delà des itinéraires habituels du Ganesh Himal se trouverait une zone que les anciens préfèrent éviter. On raconte que des hommes y sont partis à la recherche d’un trésor. Certains auraient trouvé des traces. D’autres seraient revenus blessés, incapables d’expliquer ce qu’ils avaient vu.</p><p>Beaucoup n’ont jamais reparu.</p><p>Tu n’as jamais vraiment cru à la malédiction.</p><p>La montagne suffit à tuer ceux qui la sous-estiment. Il n’est pas nécessaire d’inventer des esprits pour expliquer un corps perdu dans une crevasse ou une expédition engloutie par une tempête.</p><p>Mais ce soir, assis dans le silence de ta maison, tu regardes longtemps vers les sommets.</p><p>Depuis des années, la même question revient.</p><p><strong>Qu’est-ce qu’ils sont allés chercher là-haut ?</strong></p><p>Tu as pris ta décision.</p><p>Ton matériel est prêt. Avant le lever du soleil, tu quitteras Chhokangparo seul, en direction du Ganesh Himal.</p>`,choices:[{label:'Partir avant l’aube',to:'c1'}]},

 c1:{title:'',text:`<p>La nuit est encore noire lorsque tu refermes la porte derrière toi.</p><p>Le village dort.</p><p>Quelques drapeaux de prières claquent faiblement dans le vent froid. Plus haut, les sommets du Ganesh Himal se confondent encore avec le ciel.</p><p>Tu ajustes ton sac et prends le sentier.</p><p>Dans quelques heures, les premières lueurs toucheront les crêtes.</p><p>Pour l’instant, tu marches seul.</p><div class="ending">SUITE EN COURS D’ÉCRITURE</div>`,choices:[]}
};

const PAGE_ORDER=['c0','c1'];
const PAGE_BY_NODE=Object.fromEntries(PAGE_ORDER.map((id,i)=>[id,i]));
const PAGE_NAV_TITLES={c0:'Introduction — Chhokangparo',c1:'Départ avant l’aube'};
const padPage=n=>String(n).padStart(3,'0');

function characterSheetHtml(s){
 return `<div class="character-modal-sheet"><div class="character-modal-name">${heroName(s)}</div><div class="character-modal-rank">${heroRank()}</div><div class="character-modal-stats">
 <div><span class="tag-copy"><small>Vie</small><strong>${s.hp}/${s.maxHp}</strong></span></div>
 <div><span class="tag-copy"><small>Dextérité</small><strong>${currentDexterity(s)}</strong></span></div>
 <div><span class="tag-copy"><small>Force</small><strong>${currentForce(s)}</strong></span></div>
 <div><span class="tag-copy"><small>Terreur</small><strong>${currentTerror(s)}/${TERROR_MAX}</strong></span></div>
 </div></div>`;
}

const inventory={
 topLine:s=>`Terreur : ${currentTerror(s)}/${TERROR_MAX}`,
 extraHtml:s=>`<div class="inventory-equipment-card"><div class="inventory-equipment-title">État de l’expédition</div><div class="inventory-equipment-row"><span>Terreur</span><strong>${currentTerror(s)} / ${TERROR_MAX}</strong></div></div>`
};

BookRegistry.register({
 id:'royaume-disparus-03',initialMaxHp:18,seriesId:'royaume-disparus',seriesLabel:'LE ROYAUME DES DISPARUS',episode:1,orderInSeries:1,
 slug:'le-royaume-des-disparus',title:'Le Royaume des disparus',description:'Une aventure de haute montagne dans la vallée de Tsum et le Ganesh Himal.',access:'free',
 contentVersion:1,pageMapVersion:1,saveVersion:1,libraryNumber:3,libraryLabel:'Livre 03',sheetLabel:'FICHE DU PERSONNAGE',
 readerEyebrow:'APHANES - Livre 03',
 assetBase:'./books/Livre03-Le-Royaume-des-Disparus/images',assetBases:['./books/Livre03-Le-Royaume-des-Disparus/images'],uiAssetBase:'./books/Livre02-Le-Secret-du-Providence/assets',
 seriesProfileDefaults:{heroGender:'male',heroName:'Tenzin',baseStats:{maxHp:18,force:3,dexterity:5}},
 normalizeSeriesProfile(p){p.heroName=p.heroGender==='female'?'Pema':'Tenzin';p.baseStats={maxHp:18,force:3,dexterity:5};},
 syncSeriesProfile(s,p){p.heroGender=s.heroGender==='female'?'female':'male';p.heroName=heroName(s);p.baseStats={maxHp:18,force:3,dexterity:5};p.memory={...(p.memory||{})};},
 handleProfileInputChange(s,input){if(input?.classList.contains('hero-gender-input'))setHeroIdentity(s,input.value);},
 statusStats(s){const r=s.maxHp>0?s.hp/s.maxHp:0;return[
  {icon:'♥',label:'Vie',value:`${s.hp}/${s.maxHp}`,cls:r<=.3?'status-critical':r<=.55?'status-warning':''},
  {icon:'◆',label:'Dextérité',value:String(currentDexterity(s))},
  {icon:'⚔',label:'Force',value:String(currentForce(s))},
  {icon:'◉',label:'Terreur',value:`${currentTerror(s)}/${TERROR_MAX}`,cls:currentTerror(s)>=7?'status-critical':currentTerror(s)>=4?'status-warning':''}
 ];},
 resetSeriesOnRestart:true,showMissingIllustrationPlaceholder:true,story:STORY,pageOrder:PAGE_ORDER,pageByNode:PAGE_BY_NODE,navigationTitles:PAGE_NAV_TITLES,padPage,
 imageBaseForPage:n=>`Le-Royaume-des-Disparus-${padPage(n)}`,imageCandidatesForPage:n=>[`Le-Royaume-des-Disparus-${padPage(n)}`,`pages/Le-Royaume-des-Disparus-${padPage(n)}`],imageExtensions:['webp','png','jpg','jpeg'],
 createInitialState,rules:{currentForce,currentDexterity,combatPower,weaponLabel,applyDamage,addTerror,currentTerror},characterSheetHtml,inventory,
 checkpoints:[],conclusion:{successNodes:[],deathNodes:[],showJournalRecap:true},
 exportSeriesMemory(){return {};}
});
})();