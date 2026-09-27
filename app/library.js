/* Bibliothèque générique de APHANES. */
(function(){
  'use strict';
  const manifests = new Map();

  window.BookManifestRegistry = {
    register(manifest) {
      if (!manifest || !manifest.id) throw new Error('Manifest de livre sans id.');
      manifests.set(manifest.id, manifest);
      return manifest;
    },
    get(id) { return manifests.get(id); },
    list() { return Array.from(manifests.values()); }
  };

  function loadScript(src) {
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`Impossible de charger ${src}`));
      document.head.appendChild(script);
    });
  }

  function configEntries(){
    return [...((window.LIBRARY_CONFIG&&LIBRARY_CONFIG.books)||[])]
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }
  function entryById(id){ return configEntries().find(entry=>entry.id===id)||null; }

  async function ensureManifest(entry){
    if(!entry) return null;
    const cached=BookManifestRegistry.get(entry.id);
    if(cached) return cached;
    await loadScript(`./books/${entry.folder}/manifest.js?v=2`);
    return BookManifestRegistry.get(entry.id)||null;
  }

  function resolveBookAsset(entry,relativePath){
    if(!relativePath) return '';
    if(/^(https?:|data:|\/)/.test(relativePath)) return relativePath;
    return `./books/${entry.folder}/${relativePath.replace(/^\.\//,'')}`;
  }

  function bookUrl(id){
    const url=new URL(window.location.href);
    url.search=''; url.hash='';
    url.searchParams.set('book',id);
    return url.toString();
  }
  function homeUrl(){
    const url=new URL(window.location.href);
    url.search=''; url.hash='';
    return url.toString();
  }

  async function loadAllManifests(){
    await Promise.all(configEntries().map(async entry=>{
      try{ await ensureManifest(entry); }catch(e){ console.warn(e); }
    }));
  }

  function makeCover(entry,manifest){
    const cover=document.createElement('div');
    cover.className='library-book-cover';
    const candidates=[manifest.libraryImage,...(manifest.coverCandidates||[]),manifest.cover,manifest.preview?.image]
      .filter(Boolean).map(path=>resolveBookAsset(entry,path));
    if(!candidates.length){ cover.classList.add('is-fallback'); return cover; }

    const img=document.createElement('img');
    img.alt=`Présentation — ${manifest.title||entry.id}`;
    let i=0;
    const tryNext=()=>{
      if(i>=candidates.length){ img.remove(); cover.classList.add('is-fallback'); return; }
      img.src=candidates[i++];
    };
    img.onerror=tryNext;
    tryNext();
    cover.appendChild(img);
    return cover;
  }

  function hasSavedGame(manifest){
    const runtimeId=manifest.runtimeId||manifest.id;
    const prefix=`ldveh.book.${runtimeId}.save.v`;
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(!key||!key.startsWith(prefix)) continue;
        const raw=localStorage.getItem(key);
        if(!raw) continue;
        try{
          const saved=JSON.parse(raw);
          if(saved&&typeof saved==='object'&&saved.node&&saved.node!=='start') return true;
        }catch(e){ return true; }
      }
    }catch(e){}
    return false;
  }

  const previewBackdrop=document.getElementById('libraryPreviewBackdrop');
  const previewClose=document.getElementById('libraryPreviewClose');
  const previewImage=document.getElementById('libraryPreviewImage');
  const previewKicker=document.getElementById('libraryPreviewKicker');
  const previewTitle=document.getElementById('libraryPreviewTitle');
  const previewSituation=document.getElementById('libraryPreviewSituation');
  const previewAdventure=document.getElementById('libraryPreviewAdventure');
  const previewDangers=document.getElementById('libraryPreviewDangers');
  const previewAction=document.getElementById('libraryPreviewAction');

  let previewSelection=null;

  function closePreview(){
    if(!previewBackdrop) return;
    previewBackdrop.classList.add('hidden');
    previewBackdrop.setAttribute('aria-hidden','true');
    previewSelection=null;
  }

  function showPreview(entry,manifest){
    if(!previewBackdrop) return;
    const data=manifest.preview||{};
    previewSelection={entry,manifest};

    if(previewKicker) previewKicker.textContent=manifest.kicker||manifest.label||'APHANES';
    if(previewTitle) previewTitle.textContent=manifest.title||entry.id;
    if(previewSituation) previewSituation.textContent=data.situation||manifest.pitch||'';
    if(previewAdventure) previewAdventure.textContent=data.adventure||'';
    if(previewDangers) previewDangers.textContent=data.dangers||'';

    if(previewImage){
      const imagePath=data.image||manifest.cover||manifest.libraryImage||'';
      if(imagePath){
        previewImage.src=resolveBookAsset(entry,imagePath);
        previewImage.alt=`Présentation — ${manifest.title||entry.id}`;
        previewImage.classList.remove('hidden');
      }else{
        previewImage.removeAttribute('src');
        previewImage.classList.add('hidden');
      }
    }

    if(previewAction){
      const texture=manifest.theme?.buttonTexture;
      if(texture){
        previewAction.style.setProperty('--library-preview-button-texture',`url("${resolveBookAsset(entry,texture)}")`);
      }else{
        previewAction.style.removeProperty('--library-preview-button-texture');
      }
      previewAction.textContent=hasSavedGame(manifest)?'Poursuivre l’aventure':'Commencer l’aventure';
    }

    previewBackdrop.classList.remove('hidden');
    previewBackdrop.setAttribute('aria-hidden','false');
    try{previewAction?.focus();}catch(e){}
  }

  previewClose?.addEventListener('click',closePreview);
  previewBackdrop?.addEventListener('click',event=>{
    if(event.target===previewBackdrop) closePreview();
  });
  previewAction?.addEventListener('click',()=>{
    if(!previewSelection) return;
    window.location.href=bookUrl(previewSelection.entry.id);
  });
  previewImage?.addEventListener('error',()=>{
    previewImage.classList.add('hidden');
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') closePreview();
  });

  async function renderLibrary(){
    const root=document.getElementById('libraryBookList');
    if(!root) return;
    root.replaceChildren();
    const entries=configEntries().filter(entry=>entry.visible!==false);

    if(!entries.length){
      const empty=document.createElement('div');
      empty.className='library-empty';
      empty.textContent='Aucun livre visible.';
      root.appendChild(empty);
      return;
    }

    for(const entry of entries){
      let manifest=null;
      try{ manifest=await ensureManifest(entry); }catch(e){}
      if(!manifest) continue;

      const available=(manifest.status||'available')==='available';
      const saved=hasSavedGame(manifest);

      const card=document.createElement('article');
      card.className='library-book';
      card.dataset.status=manifest.status||'available';

      const media=document.createElement('div');
      media.className='library-book-media';
      const cover=makeCover(entry,manifest);
      const img=cover.querySelector('img');
      if(img){
        img.className='library-book-image';
        media.appendChild(img);
      }else{
        media.classList.add('is-fallback');
      }

      const copy=document.createElement('div');
      copy.className='library-book-copy';

      const number=document.createElement('div');
      number.className='library-book-number';
      number.textContent=manifest.label||`Livre ${String(manifest.number||entry.order||'').padStart(2,'0')}`;

      const title=document.createElement('h2');
      title.className='library-book-title';
      title.textContent=manifest.title||entry.id;

      const pitch=document.createElement('p');
      pitch.className='library-book-pitch';
      pitch.textContent=manifest.pitch||'';

      copy.append(number,title,pitch);

      const actionWrap=document.createElement('div');
      actionWrap.className='library-book-action-wrap';

      const action=document.createElement('button');
      action.className='library-book-action';
      action.type='button';

      const texture=manifest.theme?.buttonTexture;
      if(texture){
        action.style.setProperty('--library-book-texture',`url("${resolveBookAsset(entry,texture)}")`);
      }

      if(!available){
        action.disabled=true;
        action.textContent=manifest.statusLabel||'Bientôt';
      }else{
        action.textContent=manifest.actionLabel||'Découvrir';
        action.addEventListener('click',()=>showPreview(entry,manifest));
      }

      actionWrap.appendChild(action);
      card.append(media,copy,actionWrap);
      root.appendChild(card);
    }
  }

  function showHome(){
    document.getElementById('libraryHome')?.classList.remove('hidden');
    document.body.classList.add('library-home-open');
    document.body.classList.remove('library-book-open');
  }
  function showBook(){
    document.getElementById('libraryHome')?.classList.add('hidden');
    document.body.classList.remove('library-home-open');
    document.body.classList.add('library-book-open');
  }

  window.LibraryApp={
    loadScript,configEntries,entryById,ensureManifest,resolveBookAsset,
    loadAllManifests,renderLibrary,showHome,showBook,showPreview,closePreview,hasSavedGame,
    goHome(){window.location.href=homeUrl();}
  };
})();
