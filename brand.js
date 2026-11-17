// ═══════════════════════════════════════════════════
// PRODUCT BRANDING — change the product name here and it
// updates everywhere (portal, pitch page, page titles).
// ═══════════════════════════════════════════════════
const BRAND = {
  name: 'CampusFlow',
  tagline: 'The live room & timetable platform for modern campuses',
  shortPitch: 'Every room, every class, live — in one place.',
  client: 'UE Dubai',            // the campus this deployment is for
  founder: 'The CampusFlow team', // shown on the pitch page sign-off
  year: 2026,
};

(function applyBrand(){
  function run(){
    document.querySelectorAll('[data-brand]').forEach(el=>{
      const key=el.getAttribute('data-brand')||'name';
      if(BRAND[key]!=null) el.textContent=BRAND[key];
    });
    if(document.title.includes('{brand}')) document.title=document.title.replace(/\{brand\}/g,BRAND.name);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
