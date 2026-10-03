/* Livre 04 — Au milieu des morts · La Route des Cendres */
(function(){
'use strict';

const STARTING_AMMO=6;
const KNIFE_REACH=2;

function heroGender(s){return s.heroGender==='female'?'female':'male';}
function heroName(s){return heroGender(s)==='female'?'Nora':'Marek';}
function heroRank(s){return heroGender(s)==='female'?'Survivante':'Survivant';}
function setHeroIdentity(s,g){s.heroGender=g==='female'?'female':'male';s.heroName=heroName(s);}
function currentForce(s){return Number.isFinite(s.baseForce)?s.baseForce:3;}
function currentDexterity(s){return Number.isFinite(s.baseDexterity)?s.baseDexterity:5;}
function currentAmmo(s){return Math.max(0,Math.floor(Number(s.ammo)||0));}
function weaponLabel(s){return s.weaponLabel||'Long couteau';}
function weaponReach(s){return Number.isFinite(s.weaponReach)?s.weaponReach:KNIFE_REACH;}
function enemyDanger(force,proximity){return Math.max(0,Number(force)||0)+Math.max(0,Number(proximity)||0);}
function meleeTotal(reach,diceTotal){return Math.max(0,Number(reach)||0)+Math.max(0,Number(diceTotal)||0);}
function meleeSuccess(reach,diceTotal,force,proximity){return meleeTotal(reach,diceTotal)>enemyDanger(force,proximity);}
function spendAmmo(s,n=1){const cost=Math.max(0,Math.floor(Number(n)||0));if(currentAmmo(s)<cost)return false;s.ammo=currentAmmo(s)-cost;return true;}
function addAmmo(s,n=1){s.ammo=currentAmmo(s)+Math.max(0,Math.floor(Number(n)||0));return s.ammo;}
function applyDamage(s,a){const incoming=Math.max(0,Math.floor(Number(a)||0));s.hp=Math.max(0,s.hp-incoming);return{incoming,absorbed:0,hpLost:incoming,heroHp:s.hp};}

function createInitialState(){
  return {
    node:'start',pageMapVersion:1,heroGender:'male',heroName:'Marek',
    inventory:{},flags:{},visited:{},history:[],journal:'',
    hp:18,maxHp:18,baseForce:3,baseDexterity:5,
    ammo:STARTING_AMMO,
    weapon:'long-knife',weaponLabel:'Long couteau',weaponReach:KNIFE_REACH,
    sidearm:'pistol',sidearmLabel:'Pistolet',
    damageRolls:{},damageRollResults:{},lastDice:null,lastTotal:null,lastStat:null,lastStatName:'',rollCount:0,currentCheckpoint:null
  };
}

const STORY={
 start:{sheet:true,number:'FICHE DU HÉROS',title:'Choisis ton personnage',text:s=>`
   <div class="hero-sheet">
     <div class="hero-selection-title">Qui veux-tu incarner ?</div>
     <div class="hero-selection-copy">La même aventure et les mêmes caractéristiques. Seuls ton identité et ton portrait changent.</div>
     <div class="hero-choice-grid">
       <label class="hero-choice-card ${heroGender(s)==='male'?'selected':''}"><input class="hero-gender-input" type="radio" name="heroGenderChoice" value="male" ${heroGender(s)==='male'?'checked':''}><span class="hero-choice-name">Marek</span><span class="hero-choice-rank">Survivant</span></label>
       <label class="hero-choice-card ${heroGender(s)==='female'?'selected':''}"><input class="hero-gender-input" type="radio" name="heroGenderChoice" value="female" ${heroGender(s)==='female'?'checked':''}><span class="hero-choice-name">Nora</span><span class="hero-choice-rank">Survivante</span></label>
     </div>
     <div class="hero-sheet-row"><span class="hero-label">Nom</span><span class="hero-value"><strong>${heroName(s)}</strong></span></div>
     <div class="hero-sheet-row"><span class="hero-label">Situation</span><span class="hero-value">Trois ans de survie en refuge</span></div>
     <div class="hero-sheet-grid hero-sheet-tag-grid">
       <div class="tag"><span class="tag-copy"><small>Vie</small><strong>${s.hp}/${s.maxHp}</strong></span></div>
       <div class="tag"><span class="tag-copy"><small>Dextérité</small><strong>${currentDexterity(s)}</strong></span></div>
       <div class="tag"><span class="tag-copy"><small>Force</small><strong>${currentForce(s)}</strong></span></div>
       <div class="tag"><span class="tag-copy"><small>Munitions</small><strong>${currentAmmo(s)}</strong></span></div>
     </div>
     <div class="hero-characteristics" role="note">
       <div class="hero-info-title">Équipement de départ</div>
       <p><strong>Long couteau</strong> — Allonge ${KNIFE_REACH}</p>
       <p><strong>Pistolet</strong> — ${STARTING_AMMO} munitions</p>
     </div>
   </div>`,choices:[{label:'Continuer',to:'startRules',effect:s=>setHeroIdentity(s,heroGender(s))}]},

 startRules:{sheet:true,number:'RÈGLES DU JEU',title:'Avant de sortir',text:s=>`
   <div class="hero-sheet">
     <div class="combat-rules-card">
       <div class="combat-rules-title">Combat au corps à corps</div>
       <p>Quand tu affrontes un ennemi au corps à corps, lance <strong>2 dés à 6 faces</strong> et ajoute l’<strong>Allonge de ton arme</strong>.</p>
       <p>Ton résultat doit être <strong>strictement supérieur</strong> au <strong>Danger de l’ennemi</strong>.</p>
       <p><strong>Danger = Force de l’ennemi + Proximité.</strong></p>
       <p>Si tu rates ton attaque, l’ennemi se rapproche : sa <strong>Proximité augmente</strong> et le prochain échange devient plus dangereux. Les éventuels dégâts seront indiqués pendant le combat.</p>
       <p>Ton long couteau possède une <strong>Allonge de ${KNIFE_REACH}</strong>.</p>
     </div>
     <div class="hero-characteristics" role="note">
       <div class="hero-info-title">Munitions</div>
       <p>Ton pistolet contient au départ <strong>${STARTING_AMMO} munitions</strong>.</p>
       <p>Lorsqu’un affrontement te laisse le choix, tirer dépense <strong>1 munition</strong> et permet d’éviter le corps à corps contre une menace ordinaire.</p>
       <p>Les munitions sont rares. Tu pourras parfois en trouver, mais chaque balle utilisée maintenant peut te manquer plus tard.</p>
       <p>Un tir fait également du <strong>bruit</strong>. Selon l’endroit, cela peut avoir des conséquences.</p>
     </div>
     <div class="hero-characteristics" role="note">
       <div class="hero-info-title">Avant de commencer</div>
       <p>En bas de l’écran, tu peux consulter à tout moment tes caractéristiques, ton inventaire et ton journal.</p>
       <p>Ton nombre de munitions reste visible pendant l’aventure.</p>
     </div>
   </div>`,choices:[{label:'Commencer l’aventure',to:'c0'}]},

 c0:{title:'',text:s=>`<p><strong>Est de la France. Trois ans après l’effondrement.</strong></p><p>Au début, personne ne savait combien de temps cela durerait.</p><p>L’épidémie avait commencé loin d’ici. Quelques foyers isolés, des images floues, des hôpitaux saturés. Puis les frontières avaient fermé. Les routes s’étaient remplies. Les réseaux avaient cessé de répondre les uns après les autres.</p><p>En quelques semaines, le monde que tu connaissais avait disparu.</p><p>Tu avais trouvé refuge à la lisière d’une ancienne zone industrielle, dans un local technique enterré dont l’accès était presque invisible depuis la route. Personne ne devait savoir que tu étais là.</p><p>Pendant trois ans, cet endroit t’a gardé en vie.</p><p>Tu as rationné chaque boîte, chaque comprimé, chaque litre d’eau. Tu as réparé ce qui pouvait l’être. Tu as appris à dormir malgré les bruits au-dehors et à ne jamais allumer de lumière près de l’entrée.</p><p>Mais les réserves sont terminées.</p><p>Il ne reste presque plus rien à manger. Le filtre à eau donne ses derniers signes de vie. Ta trousse médicale est vide.</p><p>Et devant toi, sur une caisse métallique, reposent tout ce que tu peux emporter : un sac, un long couteau et un pistolet.</p><p>Tu retires le chargeur.</p><p><strong>Six cartouches.</strong></p><p>Pas une de plus.</p><p>Tu ignores ce qu’est devenu le pays. Tu sais seulement que les contaminés sont toujours dehors, que des groupes de survivants se sont organisés… et que tous ne vivent pas du troc.</p><p>Ton ancien refuge ne peut plus te sauver.</p><p>Il va falloir trouver de l’eau, de la nourriture, des médicaments — et surtout un nouvel endroit où tenir.</p><p>Tu glisses le pistolet à ta ceinture, serres la poignée du couteau et poses la main sur le verrou.</p><p>Pour la première fois depuis trois ans, tu n’ouvres pas cette porte pour revenir.</p><p><strong>Tu l’ouvres pour partir.</strong></p>`,choices:[{label:'Ouvrir le refuge',to:'c1'}]},

 c1:{title:'',text:`<p>Le verrou résiste quelques secondes avant de céder.</p><p>Un filet de lumière grise traverse l’ouverture.</p><p>L’air extérieur entre dans le refuge avec une odeur de poussière, de végétation humide et de métal rouillé.</p><p>Tu restes immobile, le pistolet à portée de main.</p><p>Dehors, rien ne bouge.</p><p>Pour l’instant.</p><div class="ending">SUITE EN COURS D’ÉCRITURE</div>`,choices:[]}
};

const PAGE_ORDER=['c0','c1'];
const PAGE_BY_NODE=Object.fromEntries(PAGE_ORDER.map((id,i)=>[id,i]));
const PAGE_NAV_TITLES={c0:'Introduction — Le refuge',c1:'La sortie'};
const padPage=n=>String(n).padStart(3,'0');

function characterSheetHtml(s){
 return `<div class="character-modal-sheet"><div class="character-modal-name">${heroName(s)}</div><div class="character-modal-rank">${heroRank(s)}</div><div class="character-modal-stats">
 <div><span class="tag-copy"><small>Vie</small><strong>${s.hp}/${s.maxHp}</strong></span></div>
 <div><span class="tag-copy"><small>Dextérité</small><strong>${currentDexterity(s)}</strong></span></div>
 <div><span class="tag-copy"><small>Force</small><strong>${currentForce(s)}</strong></span></div>
 <div><span class="tag-copy"><small>Munitions</small><strong>${currentAmmo(s)}</strong></span></div>
 </div></div>`;
}

const inventory={
 topLine:s=>`Munitions : ${currentAmmo(s)}`,
 extraHtml:s=>`<div class="inventory-equipment-card"><div class="inventory-equipment-title">Armes</div><div class="inventory-equipment-row"><span>Long couteau</span><strong>Allonge ${weaponReach(s)}</strong></div><div class="inventory-equipment-row"><span>Pistolet</span><strong>${currentAmmo(s)} munition${currentAmmo(s)>1?'s':''}</strong></div></div>`
};

BookRegistry.register({
 id:'milieu-morts-04',initialMaxHp:18,seriesId:'milieu-morts',seriesLabel:'AU MILIEU DES MORTS',episode:1,orderInSeries:1,
 slug:'au-milieu-des-morts',title:'Au milieu des morts',description:'La Route des Cendres — trois ans après l’effondrement, quitter le refuge devient la seule chance de survivre.',access:'free',
 contentVersion:1,pageMapVersion:1,saveVersion:1,libraryNumber:4,libraryLabel:'Livre 04',sheetLabel:'FICHE DU PERSONNAGE',
 readerEyebrow:'APHANES - Livre 04',
 assetBase:'./books/Livre04-Au-Milieu-des-Morts/images',assetBases:['./books/Livre04-Au-Milieu-des-Morts/images'],uiAssetBase:'./books/Livre02-Le-Secret-du-Providence/assets',
 seriesProfileDefaults:{heroGender:'male',heroName:'Marek',baseStats:{maxHp:18,force:3,dexterity:5}},
 normalizeSeriesProfile(p){p.heroName=p.heroGender==='female'?'Nora':'Marek';p.baseStats={maxHp:18,force:3,dexterity:5};},
 syncSeriesProfile(s,p){p.heroGender=s.heroGender==='female'?'female':'male';p.heroName=heroName(s);p.baseStats={maxHp:18,force:3,dexterity:5};p.memory={...(p.memory||{})};},
 handleProfileInputChange(s,input){if(input?.classList.contains('hero-gender-input'))setHeroIdentity(s,input.value);},
 statusStats(s){const r=s.maxHp>0?s.hp/s.maxHp:0;return[
  {icon:'♥',label:'Vie',value:`${s.hp}/${s.maxHp}`,cls:r<=.3?'status-critical':r<=.55?'status-warning':''},
  {icon:'◆',label:'Dextérité',value:String(currentDexterity(s))},
  {icon:'⚔',label:'Force',value:String(currentForce(s))},
  {icon:'●',label:'Munitions',value:String(currentAmmo(s)),cls:currentAmmo(s)<=1?'status-critical':currentAmmo(s)<=3?'status-warning':''}
 ];},
 resetSeriesOnRestart:true,showMissingIllustrationPlaceholder:true,story:STORY,pageOrder:PAGE_ORDER,pageByNode:PAGE_BY_NODE,navigationTitles:PAGE_NAV_TITLES,padPage,
 imageBaseForPage:n=>`Au-Milieu-des-Morts-${padPage(n)}`,imageCandidatesForPage:n=>[`Au-Milieu-des-Morts-${padPage(n)}`,`pages/Au-Milieu-des-Morts-${padPage(n)}`],imageExtensions:['webp','png','jpg','jpeg'],
 createInitialState,rules:{currentForce,currentDexterity,currentAmmo,weaponLabel,weaponReach,enemyDanger,meleeTotal,meleeSuccess,spendAmmo,addAmmo,applyDamage},characterSheetHtml,inventory,
 checkpoints:[],conclusion:{successNodes:[],deathNodes:[],showJournalRecap:true},
 exportSeriesMemory(){return {};}
});
})();