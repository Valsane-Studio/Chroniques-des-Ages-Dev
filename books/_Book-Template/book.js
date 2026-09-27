/* Squelette minimal d'un nouveau livre. */
(function(){
  'use strict';

  const STORY={
    start:{
      number:'PAGE 0',
      title:'Nouveau livre',
      noImage:true,
      text:'<p>Commence ici la nouvelle aventure.</p>',
      choices:[]
    }
  };

  const PAGE_BY_NODE={start:0};
  const PAGE_ORDER=['start'];
  const PAGE_NAV_TITLES={start:'Prologue'};
  const padPage=n=>String(n).padStart(3,'0');

  function createInitialState(){
    return{
      version:1,
      pageMapVersion:1,
      node:'start',
      hp:18,
      maxHp:18,
      inventory:{},
      history:[],
      visited:{},
      flags:{}
    };
  }

  BookRegistry.register({
    id:'livreXX',
    title:'Titre du livre',
    libraryNumber:99,
    libraryLabel:'Livre XX',
    initialMaxHp:18,
    saveVersion:1,
    pageMapVersion:1,
    assetBase:'./books/LivreXX-Titre/images',
    assetBases:['./books/LivreXX-Titre/images'],
    uiAssetBase:'./books/LivreXX-Titre/assets',
    imageExtensions:['jpg','jpeg','png'],
    story:STORY,
    pageOrder:PAGE_ORDER,
    pageByNode:PAGE_BY_NODE,
    navigationTitles:PAGE_NAV_TITLES,
    padPage,
    imageBaseForPage:n=>`LivreXX-${padPage(n)}`,
    createInitialState,
    statusStats(state){
      return[{icon:'♥',label:'Vie',value:`${state.hp}/${state.maxHp}`}];
    },
    rules:{
      currentForce:()=>0,
      currentDexterity:()=>0,
      combatPower:()=>0,
      weaponLabel:()=>'Aucune',
      currentProtection:()=>0,
      applyDamage(state,damage){
        state.hp=Math.max(0,state.hp-damage);
        return{incoming:damage,absorbed:0,hpLost:damage,heroHp:state.hp};
      }
    },
    inventory:{}
  });
})();
