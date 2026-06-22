import { state, enrichedPlayers } from './state.js';
import { standings } from '../data/standings.js';
import { seasonAwards } from '../data/awards.js';
import * as DOM from './dom.js';
import { formatValue, getTeamLogoHtml, getAwardLogoHtml, getFilteredPlayers } from './utils.js';
export function renderSummary() {
  const bi=topBy("impactScore"), bv=topBy("valueScore"), bs=topBy("scoutScore"), bb=topBy("bigMatch");
  const hero=enrichedPlayers.find(p=>p.name==="Christ Inao Oulai") || topBy("surpriseScore");
  document.querySelector("#topImpact").textContent   = `${bi.name} (${bi.impactScore})`;
  document.querySelector("#topValue").textContent    = `${bv.name} (${bv.valueScore})`;
  document.querySelector("#topScout").textContent    = `${bs.name} (${bs.scoutScore})`;
  document.querySelector("#topBigMatch").textContent = `${bb.name} (${bb.bigMatch})`;
  document.querySelector("#heroPlayer").textContent  = hero.name;
  document.querySelector("#heroNote").textContent    = `${hero.team} · ${formatValue(hero.marketValue)} EUR · skor ${hero.surpriseScore || 99}`;
  
  // Load hero image
  loadPlayerImage(hero.name, "heroPlayerImg");
}

// ── LIDERBOARD ───────────────────────────────────────────────
export function boardItem(p,i,key) {
  const imgId = `board-img-${key}-${p.name.replace(/\s+/g, '-')}-${i}`;
  setTimeout(() => loadPlayerImage(p.name, imgId), 0);
  return `<div class="board-item" style="display:flex; align-items:center; gap:10px;">
    <span class="rank">${i+1}</span>
    <div class="player-photo-wrapper tiny">
      <img id="${imgId}" class="player-photo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3C/svg%3E" alt="${p.name}">
    </div>
    <div style="flex-grow:1; text-align:left;">
      <strong style="display:block;">${p.name}</strong>
      <span class="board-meta" style="display:inline-flex; align-items:center; gap:4px; margin-top:2px;">${getTeamLogoHtml(p.team, "tiny")} <span>${p.team}</span> · ${p.position} · ${formatValue(p.marketValue)} €</span>
    </div>
    <span class="board-score">${p[key]}</span>
  </div>`;
}
export function renderBoards() {
  valueBoard.innerHTML = [...enrichedPlayers].sort((a,b)=>b.valueScore-a.valueScore).slice(0,5).map((p,i)=>boardItem(p,i,"valueScore")).join("");
  scoutBoard.innerHTML = [...enrichedPlayers].filter(p=>p.marketValue<2.5&&p.age<=26).sort((a,b)=>b.scoutScore-a.scoutScore).slice(0,5).map((p,i)=>boardItem(p,i,"scoutScore")).join("");
}

export function renderStandings() {
  const zc = { champion:"row-champion", ucl:"row-ucl", uel:"row-uel", uecl:"row-uel", relegation:"row-relegation" };
  standingsBody.innerHTML = standings.map((r,i)=>`
    <tr class="${zc[r.zone]||""}">
      <td class="st-rank">${i+1}</td>
      <td><div class="st-team">${getTeamLogoHtml(r.team, "small")} <span>${r.team}</span></div></td>
      <td>${r.o}</td><td>${r.g}</td><td>${r.b}</td><td>${r.m}</td>
      <td>${r.ag}</td><td>${r.yg}</td>
      <td>${r.ag-r.yg>=0?"+":""}${r.ag-r.yg}</td>
      <td class="st-pts">${r.pts}</td>
    </tr>`).join("");
  const panel = document.querySelector("#standings-section");
  if (!panel.querySelector(".standings-source")) {
    const src = document.createElement("p");
    src.className = "standings-source";
    src.innerHTML = `📊 Kaynak: <a href="https://www.transfermarkt.com/super-lig/tabelle/wettbewerb/TR1/saison_id/2025" target="_blank" rel="noopener">Transfermarkt — 25/26 · 34. Hafta</a>`;
    panel.appendChild(src);
  }
  if (!panel.querySelector(".standings-legend")) {
    const leg = document.createElement("div");
    leg.className = "standings-legend";
    leg.innerHTML = `
      <div class="legend-item"><span class="legend-dot" style="background:#afd179;"></span>Şampiyon + ŞL</div>
      <div class="legend-item"><span class="legend-dot" style="background:#d6eab6;"></span>Şampiyonlar Ligi</div>
      <div class="legend-item"><span class="legend-dot" style="background:#bdd9ef;"></span>Avrupa Ligi</div>
      <div class="legend-item"><span class="legend-dot" style="background:#a5cce9;"></span>Konferans Ligi</div>
      <div class="legend-item"><span class="legend-dot" style="background:#f8a7a3;"></span>Küme düşme</div>`;
    panel.appendChild(leg);
  }
}

// ── SEZON ÖDÜLLERİ ───────────────────────────────────────────
export function renderAwards() {
  if (!awardsGrid) return;
  awardsGrid.innerHTML = seasonAwards.map(a=>`
    <div class="award-card">
      <div class="award-header" style="--award-color:${a.color};">
        <span class="award-emoji-main">${a.emoji}</span>
        <span class="award-title">${a.title}</span>
        <span class="award-winner">${a.winner}</span>
        <span class="award-team-badge" style="display:inline-flex; align-items:center; gap:6px;">${getAwardLogoHtml(a.team)} <span>${a.team}</span></span>
      </div>
      <div class="award-body">
        <div class="award-detail">${a.detail}</div>
        <p class="award-note">${a.note}</p>
      </div>
    </div>`).join("");
}

// ── OYUNCU KARTLARI ───────────────────────────────────────────
export function renderPlayers() {
  const list = getFilteredPlayers();
  resultCount.textContent = `${list.length} oyuncu`;
  const visibleList = list.slice(0, state.visibleLimit);
  playerGrid.innerHTML = visibleList.map(p => {
    const mw = Math.min(100, Math.round(p.valueScore/10));
    const imgId = `card-img-${p.name.replace(/\s+/g, '-')}`;
    
    // Asynchronously fetch player image after DOM is updated
    setTimeout(() => loadPlayerImage(p.name, imgId), 0);
    
    return `<article class="player-card" data-player="${p.name}" tabindex="0" role="button" aria-label="${p.name} detayını aç">
      <div class="card-header-with-photo">
        <div class="player-photo-wrapper">
          <img id="${imgId}" class="player-photo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3C/svg%3E" alt="${p.name}">
        </div>
        <div class="card-head-details">
          <div class="card-head" style="margin-bottom: 0;">
            <div><h3 style="margin-top:0;">${p.name}</h3><p style="margin-bottom:0; display:flex; align-items:center; gap:4px;">${getTeamLogoHtml(p.team, "tiny")} <span>${p.team}</span> · ${p.position} · ${p.age} yaş</p></div>
            <span class="tag">${getLabel(p)}</span>
          </div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat"><span>Piyasa Değeri</span><strong>${formatValue(p.marketValue)} €</strong></div>
        <div class="stat"><span>Etki Skoru</span><strong>${p.impactScore}</strong></div>
        <div class="stat"><span>Fiyat/Katkı</span><strong>${p.valueScore}</strong></div>
      </div>
      <div><div class="meter"><span style="width:${mw}%"></span></div></div>
      <p class="story">${p.story}</p>
      <a class="tm-link" href="${tmUrl(p.name)}" target="_blank" rel="noopener noreferrer"
         onclick="event.stopPropagation()" aria-label="Transfermarkt'ta ${p.name}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Transfermarkt'ta Gör
      </a>
    </article>`;
  }).join("");

  if (loadMoreBtn) {
    loadMoreBtn.hidden = list.length <= state.visibleLimit;
  }
}

// ===================== RADAR CHART =====================
export function drawRadarChart(player, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const hücum = Math.min(player.contribution / 30, 1);
  const istikrar = Math.min(player.valueScore / 1000, 1);
  const oyunAklı = Math.min(player.impactScore / 1000, 1);
  const büyükMaç = Math.min(player.bigMatch / 100, 1);
  const formSkoru = (player.form && player.form.length) 
      ? player.form.reduce((a,b)=>a+(b==='W'?1:b==='D'?0.5:0),0)/player.form.length 
      : 0.6;
  
  const data = [hücum, istikrar, oyunAklı, büyükMaç, formSkoru];
  const labels = ["Hücum", "İstikrar", "Oyun Aklı", "Büyük Maç", "Form"];
  
  const size = 220;
  const center = size / 2;
  const radius = center - 35; 
  
  let svg = `<svg class="radar-svg" viewBox="0 0 ${size} ${size}">`;
  
  for(let i=1; i<=4; i++){
    let r = radius * (i/4);
    let points = "";
    for(let j=0; j<5; j++){
      let angle = (Math.PI / 2) - (2 * Math.PI * j / 5);
      let x = center + r * Math.cos(angle);
      let y = center - r * Math.sin(angle);
      points += `${x},${y} `;
    }
    svg += `<polygon class="radar-grid" points="${points.trim()}" />`;
  }
  
  for(let j=0; j<5; j++){
    let angle = (Math.PI / 2) - (2 * Math.PI * j / 5);
    let x = center + radius * Math.cos(angle);
    let y = center - radius * Math.sin(angle);
    svg += `<line class="radar-axis" x1="${center}" y1="${center}" x2="${x}" y2="${y}" />`;
    
    let labelX = center + (radius + 20) * Math.cos(angle);
    let labelY = center - (radius + 20) * Math.sin(angle) + 4;
    svg += `<text class="radar-label" x="${labelX}" y="${labelY}">${labels[j]}</text>`;
  }
  
  let dataPoints = "";
  let circles = "";
  for(let j=0; j<5; j++){
    let angle = (Math.PI / 2) - (2 * Math.PI * j / 5);
    let val = Math.max(0.1, data[j] || 0.1);
    let x = center + radius * val * Math.cos(angle);
    let y = center - radius * val * Math.sin(angle);
    dataPoints += `${x},${y} `;
    circles += `<circle class="radar-point" cx="${x}" cy="${y}" r="3" />`;
  }
  
  svg += `<polygon class="radar-area" points="${dataPoints.trim()}" />`;
  svg += circles;
  svg += `</svg>`;
  
  container.innerHTML = svg;
}

// ── MODAL ─────────────────────────────────────────────────────
export function openPlayerModal(name) {
  const p = enrichedPlayers.find(x=>x.name===name);
  if (!p) return;
  modalPlayerName.textContent = p.name;
  modalPlayerTeam.innerHTML = `${getTeamLogoHtml(p.team, "tiny")} <span style="vertical-align:middle; margin-left:6px;">${p.team} · ${p.position} · ${p.age} yaş</span>`;
  modalPlayerTag.textContent  = getLabel(p);
  
  const modalImgId = `modal-img-${p.name.replace(/\s+/g, '-')}`;
  setTimeout(() => loadPlayerImage(p.name, modalImgId), 0);
  
  modalContent.innerHTML = `
    <div class="modal-body-wrapper">
      <div class="modal-photo-container">
        <img id="${modalImgId}" class="modal-player-photo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3C/svg%3E" alt="${p.name}">
      </div>
      <div class="modal-details-container">
        <div class="modal-stats">
          <div class="stat"><span>Piyasa Değeri</span><strong>${formatValue(p.marketValue)} €</strong></div>
          <div class="stat"><span>Gol + Asist</span><strong>${p.contribution}</strong></div>
          <div class="stat"><span>Etki Skoru</span><strong>${p.impactScore}</strong></div>
          <div class="stat"><span>Değer Skoru</span><strong>${p.valueScore}</strong></div>
        </div>
      </div>
    </div>
    <div id="radarChartContainer" class="radar-chart-container"></div>
    <section class="modal-section"><h3>Oyuncu profili</h3><p>${p.story}</p></section>
    <section class="modal-section"><h3>Kulüp geçmişi</h3>
      <div class="career-list">${(p.career||[p.team]).map(c=>`<span class="career-chip">${c}</span>`).join("")}</div>
    </section>
    <section class="modal-section"><h3>Güçlü yönler</h3>
      <div class="strength-list">${(p.strengths||["Etki","Form","Katkı"]).map(s=>`<span>${s}</span>`).join("")}</div>
    </section>
    <section class="modal-section">
      <a class="tm-link" href="${tmUrl(p.name)}" target="_blank" rel="noopener noreferrer" style="margin-top:0;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Transfermarkt'ta Detaylı Profil
      </a>
    </section>`;
    
  setTimeout(() => drawRadarChart(p, "radarChartContainer"), 0);
  
  playerModal.hidden = false;
  modalClose.focus();
}
export function closePlayerModal() { playerModal.hidden = true; }

// ── KARŞILAŞTIRMA ─────────────────────────────────────────────
export function syncCustomSelectLabel(hiddenInputId) {
  const containerId = "container" + hiddenInputId.charAt(0).toUpperCase() + hiddenInputId.slice(1);
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!container || !hiddenInput) return;
  const labelSpan = container.querySelector(".custom-select-label");
  const player = enrichedPlayers.find(p => p.name === hiddenInput.value);
  if (player && labelSpan) {
    labelSpan.innerHTML = `${getTeamLogoHtml(player.team, "tiny")} <strong style="margin-left:6px;vertical-align:middle;">${player.name}</strong> <span style="font-size:0.75rem;opacity:0.75;margin-left:4px;vertical-align:middle;">— ${player.team}</span>`;
  }
}

export function initCustomSelect(containerId, hiddenInputId, defaultValue) {
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!container || !hiddenInput) return;

  const trigger = container.querySelector(".custom-select-trigger");