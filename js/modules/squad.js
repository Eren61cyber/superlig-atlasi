import { teamSquads } from '../data/squads.js';
import * as DOM from './dom.js';
import { getTeamLogoHtml } from './utils.js';
export export function renderSquadTeams() {
  squadTeamSelect.innerHTML = teamThemes.filter(t=>t.name!=="Lig teması").map(t=>`<option value="${t.name}">${t.name}</option>`).join("");
  squadTeamSelect.value = "Trabzonspor";
  renderSquad();
}
export function renderSquad() {
  const name=squadTeamSelect.value, squad=teamSquads[name], theme=teamThemes.find(t=>t.name===name);
  if(theme) applyTheme(theme);
  if(!squad){ squadNote.innerHTML=`${getTeamLogoHtml(name, "small")} <span style="vertical-align:middle; margin-left:6px;">${name}: kadro henüz eklenmedi</span>`; squadGrid.innerHTML=`<div class="squad-empty">${name} kadrosu yakında eklenecek.</div>`; return; }
  squadNote.innerHTML=`${getTeamLogoHtml(name, "small")} <span style="vertical-align:middle; margin-left:6px;">${name}: ${squad.length} oyuncu — 2025-26 Sezonu</span>`;
  squadGrid.innerHTML=squad.map(p=>`
    <article class="squad-card">
      <strong>${p.name}</strong>
      <span>${p.position} · ${p.note}</span>
      <a class="tm-link small-link" href="${tmUrl(p.name)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" aria-label="Transfermarkt'ta ${p.name}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Transfermarkt'ta Gör
      </a>
    </article>`).join("");
}
