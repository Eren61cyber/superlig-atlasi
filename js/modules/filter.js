import { positionModels, state, enrichedPlayers } from './state.js';
import { navHamburger, playerModal, playerGrid, modalClose, maxPriceFilter, swapTeamButton, teamFilter, loadMoreBtn, ageFilter, playerB, teamBSelect, searchInput, squadTeamSelect, swapButton, teamASelect, sortMode, navMobileMenu, budgetOnly, ageLabel, playerA, positionFilter } from './dom.js';
import { closePlayerModal, renderBoards, renderPlayers, syncCustomSelectLabel, openPlayerModal } from './render.js';
import { renderSquad } from './squad.js';
import { getFilteredPlayers, getLabel } from './utils.js';
import { renderComparison, renderTeamComparison } from './comparison.js';

export function fillTeamFilter() {
  const teams=[...new Set(enrichedPlayers.map(p=>p.team))].sort();
  teamFilter.innerHTML=`<option value="all">Tüm takımlar</option>`+teams.map(t=>`<option value="${t}">${t}</option>`).join("");
}

// ── HAMBURGER ─────────────────────────────────────────────────
navHamburger.addEventListener("click",e=>{
  e.stopPropagation();
  const open=!navMobileMenu.hidden;
  navMobileMenu.hidden=open;
  navHamburger.setAttribute("aria-expanded",String(!open));
});
document.addEventListener("click",e=>{
  if(!navMobileMenu.hidden&&!e.target.closest(".navbar")){
    navMobileMenu.hidden=true;
    navHamburger.setAttribute("aria-expanded","false");
  }
});
navMobileMenu.querySelectorAll(".nav-link").forEach(link=>{
  link.addEventListener("click",()=>{navMobileMenu.hidden=true;navHamburger.setAttribute("aria-expanded","false");});
});

// ── EVENT LISTENERS ───────────────────────────────────────────
searchInput.addEventListener("input",  e=>{state.search=e.target.value; state.visibleLimit=12; renderPlayers();});
positionFilter.addEventListener("change",e=>{state.position=e.target.value; state.visibleLimit=12; renderPlayers();});
teamFilter.addEventListener("change",  e=>{state.team=e.target.value; state.visibleLimit=12; renderPlayers();});
sortMode.addEventListener("change",    e=>{state.sort=e.target.value; state.visibleLimit=12; renderPlayers();});
budgetOnly.addEventListener("change",  e=>{state.budgetOnly=e.target.checked; state.visibleLimit=12; renderPlayers();});

if (ageFilter) {
  ageFilter.addEventListener("input", e => {
    state.maxAge = parseInt(e.target.value, 10);
    if(ageLabel) ageLabel.textContent = state.maxAge;
    state.visibleLimit=12;
    renderPlayers();
  });
}

if (maxPriceFilter) {
  maxPriceFilter.addEventListener("change", e => {
    state.maxPrice = parseFloat(e.target.value);
    state.visibleLimit=12;
    renderPlayers();
  });
}
playerA.addEventListener("change", renderComparison);
playerB.addEventListener("change", renderComparison);
squadTeamSelect.addEventListener("change", renderSquad);

playerGrid.addEventListener("click",e=>{const c=e.target.closest(".player-card");if(c)openPlayerModal(c.dataset.player);});
playerGrid.addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ") return;
  const c=e.target.closest(".player-card");if(!c) return;
  e.preventDefault();openPlayerModal(c.dataset.player);
});
modalClose.addEventListener("click",closePlayerModal);
playerModal.addEventListener("click",e=>{if(e.target===playerModal)closePlayerModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!playerModal.hidden)closePlayerModal();});
swapButton.addEventListener("click",()=>{
  const o=playerA.value;
  playerA.value=playerB.value;
  playerB.value=o;
  syncCustomSelectLabel("playerA");
  syncCustomSelectLabel("playerB");
  renderComparison();
});

teamASelect.addEventListener("change", renderTeamComparison);
teamBSelect.addEventListener("change", renderTeamComparison);
swapTeamButton.addEventListener("click", () => {
  const o = teamASelect.value;
  teamASelect.value = teamBSelect.value;
  teamBSelect.value = o;
  renderTeamComparison();
});

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    state.visibleLimit += 12;
    renderPlayers();
  });
}

// ── SQUAD BUILDER STATE & REFS ─────────────────────────────────
state.builderSquad = {
  lw: null, st: null, rw: null,
  lcm: null, cm: null, rcm: null,
  lb: null, lcb: null, rcb: null, rb: null,
  gk: null
};
state.builderBudget = 25.0;
state.activeSlotId = null;
state.builderSearch = "";