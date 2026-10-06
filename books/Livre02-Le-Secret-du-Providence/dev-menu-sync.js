/* Livre 02 — menu DEV : synchronise numéros et titres avec les pages réellement affichées. */
(function(){
  'use strict';

  const book=window.BookRegistry?.get?.('providence-02');
  const list=document.getElementById('pageNavList');
  if(!book||!list)return;

  function syncDevMenu(){
    list.querySelectorAll('.page-nav-btn[data-node]').forEach(btn=>{
      const nodeId=btn.dataset.node;
      const pageNumber=book.pageByNode?.[nodeId];
      const scene=book.story?.[nodeId];
      const numberEl=btn.querySelector('.page-nav-number');
      const titleEl=btn.querySelector('.page-nav-title');

      if(numberEl&&Number.isInteger(pageNumber)){
        numberEl.textContent=book.padPage?.(pageNumber) ?? String(pageNumber).padStart(3,'0');
      }

      // Toujours afficher le même titre que celui visible lorsque la page s'ouvre.
      // Si une scène n'a volontairement aucun titre, on conserve le libellé de travail existant.
      const actualTitle=typeof scene?.title==='string'?scene.title.trim():'';
      if(titleEl&&actualTitle)titleEl.textContent=actualTitle;
    });
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(syncDevMenu));
  observer.observe(list,{childList:true,subtree:true});
  requestAnimationFrame(syncDevMenu);
})();
