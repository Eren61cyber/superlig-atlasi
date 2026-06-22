import { enrichedPlayers } from './state.js';
import { teamSquads } from '../data/squads.js';
import * as DOM from './dom.js';
import { getTeamLogoHtml, formatValue } from './utils.js';
export function fillCompareOptions() {
  initCustomSelect("containerPlayerA", "playerA", topBy("impactScore").name);
  initCustomSelect("containerPlayerB", "playerB", topBy("valueScore").name);
}
function sl(lbl,l,r) {
  return `<div class="duel-row"><span>${lbl}</span><strong>
    <span class="${l>r?"winner":""}">${l}</span>/<span class="${r>l?"winner":""}">${r}</span>
  </strong></div>`;
}
export function renderComparison() {
  const l=enrichedPlayers.find(p=>p.name===playerA.value), r=enrichedPlayers.find(p=>p.name===playerB.value);
  if (!l||!r) return;
  const w = l.impactScore===r.impactScore ? "Bu eşleşmede performans dengesi tam anlamıyla eşit."
    : l.impactScore>r.impactScore ? `${l.name} sahaya yansıttığı etki skoru ve performansı ile bu kıyaslamada öne çıkıyor.`
    : `${r.name} sahaya yansıttığı etki skoru ve performansı ile bu kıyaslamada öne çıkıyor.`;
    
  const imgLId = `compare-img-L-${l.name.replace(/\s+/g, '-')}`;
  const imgRId = `compare-img-R-${r.name.replace(/\s+/g, '-')}`;
  setTimeout(() => {
    loadPlayerImage(l.name, imgLId);
    loadPlayerImage(r.name, imgRId);
  }, 0);

  comparison.innerHTML = `
    <article class="duel-card">
      <div class="card-header-with-photo">
        <div class="player-photo-wrapper">
          <img id="${imgLId}" class="player-photo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3C/svg%3E" alt="${l.name}">
        </div>
        <div class="card-head-details" style="text-align: left;">
          <h3 style="margin:0 0 4px 0;">${l.name}</h3>
          <p style="margin:0; display:flex; align-items:center; gap:4px;">${getTeamLogoHtml(l.team, "tiny")} <span>${l.team}</span></p>
        </div>
      </div>
      ${sl("Gol",l.goals,r.goals)}${sl("Asist",l.assists,r.assists)}
      ${sl("Etki skoru",l.impactScore,r.impactScore)}${sl("Değer skoru",l.valueScore,r.valueScore)}${sl("Form",l.form,r.form)}
    </article>
    <article class="duel-card">
      <div class="card-header-with-photo">
        <div class="player-photo-wrapper">
          <img id="${imgRId}" class="player-photo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3C/svg%3E" alt="${r.name}">
        </div>
        <div class="card-head-details" style="text-align: left;">
          <h3 style="margin:0 0 4px 0;">${r.name}</h3>
          <p style="margin:0; display:flex; align-items:center; gap:4px;">${getTeamLogoHtml(r.team, "tiny")} <span>${r.team}</span></p>
        </div>
      </div>
      <div class="duel-row"><span>Piyasa değeri</span><strong>${formatValue(l.marketValue)} / ${formatValue(r.marketValue)} €</strong></div>
      <div class="duel-row"><span>Dakika</span><strong>${l.minutes} / ${r.minutes}</strong></div>
      <div class="duel-row"><span>Büyük maç</span><strong>${l.bigMatch} / ${r.bigMatch}</strong></div>
      <div class="duel-row"><span>Scout skoru</span><strong>${l.scoutScore} / ${r.scoutScore}</strong></div>
  </article>
    <div class="insight">${w}</div>`;
}

// ── TEAM COMPARISON (DERBİ MODU) ──────────────────────────────────
export function fillTeamCompareOptions() {
  const uniqueTeams = [...new Set(enrichedPlayers.map(p => p.team))].sort();
  const optionsHtml = uniqueTeams.map(t => `<option value="${t}">${t}</option>`).join("");
  if(teamASelect) {
    teamASelect.innerHTML = `<option value="">1. Takımı Seçin</option>` + optionsHtml;
    teamASelect.value = uniqueTeams[0] || "";
  }
  if(teamBSelect) {
    teamBSelect.innerHTML = `<option value="">2. Takımı Seçin</option>` + optionsHtml;
    teamBSelect.value = uniqueTeams[1] || "";
  }
}

function getTeamStats(teamName) {
  const playersInTeam = enrichedPlayers.filter(p => p.team === teamName);
  if(!playersInTeam.length) return null;
  
  const totalValue = playersInTeam.reduce((sum, p) => sum + p.marketValue, 0);
  const avgAge = playersInTeam.reduce((sum, p) => sum + p.age, 0) / playersInTeam.length;
  
  const attackers = playersInTeam.filter(p => p.position === "Forvet" || p.position === "Kanat");
  const defenders = playersInTeam.filter(p => p.position === "Defans" || p.position === "Kaleci");
  
  const attackScore = attackers.length ? Math.round(attackers.reduce((sum, p) => sum + p.impactScore, 0) / attackers.length) : 0;
  const defenseScore = defenders.length ? Math.round(defenders.reduce((sum, p) => sum + p.impactScore, 0) / defenders.length) : 0;
  
  const topPlayer = [...playersInTeam].sort((a,b) => b.impactScore - a.impactScore)[0];
  const mostValuable = [...playersInTeam].sort((a,b) => b.marketValue - a.marketValue)[0];
  
  return {
    name: teamName,
    totalValue,
    avgAge,
    attackScore,
    defenseScore,
    topPlayer,
    mostValuable
  };
}

export function renderTeamComparison() {
  if(!teamASelect || !teamBSelect || !teamComparison) return;
  const tA = getTeamStats(teamASelect.value);
  const tB = getTeamStats(teamBSelect.value);
  if(!tA || !tB) {
    teamComparison.innerHTML = "<p style='padding:20px; text-align:center;'>Lütfen karşılaştırmak için iki takım seçin.</p>";
    return;
  }
  
  const totalAttack = tA.attackScore + tB.attackScore;
  const totalDefense = tA.defenseScore + tB.defenseScore;
  const totalValue = tA.totalValue + tB.totalValue;
  
  const w = tA.totalValue > tB.totalValue 
    ? `${tA.name}, kadro kalitesi ve piyasa değeri açısından derbinin favorisi konumunda.` 
    : `${tB.name}, kadro kalitesi ve piyasa değeri açısından derbinin favorisi konumunda.`;

  teamComparison.innerHTML = `
    <article class="duel-card">
      <div class="card-header-with-photo" style="justify-content:center;">
        <div class="player-photo-wrapper medium" style="margin:0;">
          ${getTeamLogoHtml(tA.name, "medium")}
        </div>
        <h3 style="margin:10px 0 0 0; text-align:center; font-size:1.4rem;">${tA.name}</h3>
      </div>
      ${sl("Kadro Değeri (M€)", tA.totalValue.toFixed(1), tB.totalValue.toFixed(1))}
      ${sl("Hücum Gücü", tA.attackScore, tB.attackScore)}
      ${sl("Savunma Gücü", tA.defenseScore, tB.defenseScore)}
      ${sl("Yaş Ortalaması", tA.avgAge.toFixed(1), tB.avgAge.toFixed(1))}
      <div class="duel-row" style="flex-direction:column; align-items:flex-start; text-align:left;">
        <span style="margin-bottom:4px; font-size:0.8rem;">En Etkili Oyuncu</span>
        <strong>${tA.topPlayer.name} (${tA.topPlayer.impactScore} Etki)</strong>
      </div>
      <div class="duel-row" style="flex-direction:column; align-items:flex-start; text-align:left;">
        <span style="margin-bottom:4px; font-size:0.8rem;">En Değerli Oyuncu</span>
        <strong>${tA.mostValuable.name} (${formatValue(tA.mostValuable.marketValue)} €)</strong>
      </div>
    </article>

    <article class="duel-card">
      <div class="card-header-with-photo" style="justify-content:center;">
        <div class="player-photo-wrapper medium" style="margin:0;">
          ${getTeamLogoHtml(tB.name, "medium")}
        </div>
        <h3 style="margin:10px 0 0 0; text-align:center; font-size:1.4rem;">${tB.name}</h3>
      </div>
      ${sl("Kadro Değeri (M€)", tA.totalValue.toFixed(1), tB.totalValue.toFixed(1))}
      ${sl("Hücum Gücü", tA.attackScore, tB.attackScore)}
      ${sl("Savunma Gücü", tA.defenseScore, tB.defenseScore)}
      ${sl("Yaş Ortalaması", tA.avgAge.toFixed(1), tB.avgAge.toFixed(1))}
      <div class="duel-row" style="flex-direction:column; align-items:flex-start; text-align:left;">
        <span style="margin-bottom:4px; font-size:0.8rem;">En Etkili Oyuncu</span>
        <strong>${tB.topPlayer.name} (${tB.topPlayer.impactScore} Etki)</strong>
      </div>
      <div class="duel-row" style="flex-direction:column; align-items:flex-start; text-align:left;">
        <span style="margin-bottom:4px; font-size:0.8rem;">En Değerli Oyuncu</span>
        <strong>${tB.mostValuable.name} (${formatValue(tB.mostValuable.marketValue)} €)</strong>
      </div>
    </article>
    <div class="insight" style="margin-top:10px;">${w}</div>`;
}


// ── ANKET ─────────────────────────────────────────────────────
// ── STATS CHARTS ──────────────────────────────────────────────
let chartsInstance = [];