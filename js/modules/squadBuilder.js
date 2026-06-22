import { state, enrichedPlayers } from './state.js';
import { BuilderDOM as DOM } from './dom.js';
import { teamSquads } from '../data/squads.js';
import { formatValue, getTeamLogoHtml } from './utils.js';
import { renderSquadTeams, renderSquad } from './render.js';
function loadPlayerImage(playerName, imgElementId) {
  if (state.playerImages[playerName]) {
    const imgEl = document.getElementById(imgElementId);
    if (imgEl) {
      imgEl.crossOrigin = "anonymous";
      imgEl.src = state.playerImages[playerName];
      imgEl.style.opacity = 1;
    }
    return;
  }
  
  const setFallback = () => {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=0f172a&color=38bdf8&size=150&font-size=0.33`;
    state.playerImages[playerName] = fallbackAvatar;
    const imgEl = document.getElementById(imgElementId);
    if (imgEl) {
      imgEl.crossOrigin = "anonymous";
      imgEl.src = fallbackAvatar;
      imgEl.style.opacity = 1;
    }
  };

  const title = encodeURIComponent(playerName);
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&format=json&pithumbsize=150&origin=*`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const pages = data.query?.pages;
      const pageId = pages ? Object.keys(pages)[0] : null;
      if (pageId && pageId !== "-1" && pages[pageId].thumbnail) {
        state.playerImages[playerName] = pages[pageId].thumbnail.source;
        const imgEl = document.getElementById(imgElementId);
        if (imgEl) { imgEl.crossOrigin = "anonymous"; imgEl.src = state.playerImages[playerName]; imgEl.style.opacity = 1; }
      } else {
        const trUrl = `https://tr.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&format=json&pithumbsize=150&origin=*`;
        fetch(trUrl)
          .then(res => res.json())
          .then(trData => {
            const trPages = trData.query?.pages;
            const trPageId = trPages ? Object.keys(trPages)[0] : null;
            if (trPageId && trPageId !== "-1" && trPages[trPageId].thumbnail) {
              state.playerImages[playerName] = trPages[trPageId].thumbnail.source;
              const imgEl = document.getElementById(imgElementId);
              if (imgEl) { imgEl.crossOrigin = "anonymous"; imgEl.src = state.playerImages[playerName]; imgEl.style.opacity = 1; }
            } else {
              setFallback();
            }
          })
          .catch(setFallback);
      }
    })
    .catch(setFallback);
}

function updateScoutSuggestions() {
  if (!scoutSuggestionsPanel || !scoutSuggestionsContent) return;

  const selectedPlayers = Object.values(state.builderSquad).filter(p => p !== null);
  const emptySlots = Object.entries(state.builderSquad).filter(([role, player]) => player === null);
  
  if (emptySlots.length === 0 || selectedPlayers.length === 0) {
    scoutSuggestionsPanel.hidden = true;
    return;
  }
  
  let currentSquadValue = 0;
  selectedPlayers.forEach(p => {
    currentSquadValue += p.marketValue;
  });
  
  const remainingBudget = state.builderBudget - currentSquadValue;
  const N = emptySlots.length;
  const averageBudgetPerPlayer = remainingBudget / N;
  
  const suggestions = [];
  
  for (let i = 0; i < Math.min(3, emptySlots.length); i++) {
    const [role, _] = emptySlots[i];
    const slotEl = document.getElementById("slot-" + role);
    if (!slotEl) continue;
    const slotPosition = slotEl.dataset.position;
    const isForvet = slotPosition === "Forvet";
    
    const candidates = enrichedPlayers.filter(p => {
      const matchesPos = isForvet 
        ? (p.position === "Forvet" || p.position === "Kanat") 
        : (p.position === slotPosition);
      if (!matchesPos) return false;
      
      const isAlreadySelected = Object.values(state.builderSquad).some(sel => sel && sel.name === p.name);
      if (isAlreadySelected) return false;
      
      return p.marketValue <= remainingBudget;
    });
    
    if (candidates.length === 0) continue;
    
    // Score recommendation based on impactScore, penalizing if it exceeds average budget heavily
    candidates.forEach(p => {
      let score = p.impactScore;
      if (p.marketValue > averageBudgetPerPlayer * 1.25) {
        score -= (p.marketValue - averageBudgetPerPlayer) * 15;
      }
      p._recScore = score;
    });
    
    candidates.sort((a, b) => b._recScore - a._recScore);
    const recommendedPlayer = candidates[0];
    
    if (recommendedPlayer) {
      suggestions.push({
        role,
        position: slotPosition,
        player: recommendedPlayer
      });
    }
  }
  
  if (suggestions.length === 0) {
    scoutSuggestionsPanel.hidden = true;
    return;
  }
  
  scoutSuggestionsContent.innerHTML = suggestions.map(s => {
    const roleUpper = s.role.toUpperCase();
    return `
      <div class="scout-suggestion-card">
        <div class="scout-suggestion-info">
          <span class="scout-suggestion-role">${roleUpper} (${s.position})</span>
          <strong>${s.player.name}</strong>
          <small>${s.player.team} • ${s.player.marketValue.toFixed(1)} M€ • ${s.player.impactScore} Pts</small>
        </div>
        <button class="btn-primary compact scout-add-btn" data-role="${s.role}" data-name="${s.player.name}" type="button">Hemen Ekle</button>
      </div>
    `;
  }).join("");
  
  scoutSuggestionsContent.querySelectorAll(".scout-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      const name = btn.dataset.name;
      const player = enrichedPlayers.find(x => x.name === name);
      if (player) {
        state.builderSquad[role] = player;
        updateBuilderSlotDOM(role);
        updateBuilderStats();
      }
    });
  });
  
  scoutSuggestionsPanel.hidden = false;
}

function animateCountUp(element, target, suffix = "", duration = 1000) {
  let start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress * (2 - progress); // easeOutQuad
    const current = Math.round(start + ease * (target - start));
    
    element.textContent = current + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target + suffix;
    }
  }
  
  requestAnimationFrame(update);
}

function runSquadSimulation() {
  const selectedPlayers = Object.values(state.builderSquad).filter(p => p !== null);
  if (selectedPlayers.length < 11) return;

  simConsoleLogs.innerHTML = "";
  simResultsScreen.hidden = true;
  simLoadingScreen.hidden = false;
  simulationModal.hidden = false;

  const logLines = [
    { text: "🔍 [AI Ajanı] Oyuncu verileri ve kariyer istatistikleri inceleniyor...", delay: 0 },
    { text: "⚙️ [AI Ajanı] 4-3-3 taktiksel formasyon yerleşimi doğrulanıyor...", delay: 600 },
    { text: "🧬 [AI Ajanı] Takım kimyası ve saha içi uyum faktörleri hesaplanıyor...", delay: 1200 },
    { text: "🏟️ [AI Ajanı] Süper Lig devlerine karşı 25 maçlık simülasyon başlatıldı...", delay: 1800 },
    { text: "📊 [AI Ajanı] Rakip analizleri tamamlandı, derbi maçı simüle ediliyor...", delay: 2400 },
    { text: "✅ [AI Ajanı] Rapor hazırlandı! Sonuçlar ekrana aktarılıyor...", delay: 3000, cls: "success" }
  ];

  logLines.forEach(line => {
    setTimeout(() => {
      const p = document.createElement("p");
      p.className = "sim-log-line" + (line.cls ? " " + line.cls : "");
      p.textContent = line.text;
      simConsoleLogs.appendChild(p);
      simConsoleLogs.scrollTop = simConsoleLogs.scrollHeight;
    }, line.delay);
  });

  // 1. Chemistry calculation
  let baselineChemistry = 50;
  const teamCounts = {};
  selectedPlayers.forEach(p => {
    teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
  });
  const maxSameTeam = Math.max(...Object.values(teamCounts));
  const synergyBonus = (maxSameTeam - 1) * 4;
  
  let dmfBonus = 0;
  const mids = selectedPlayers.filter(p => p.position === "Orta saha");
  const hasDmf = mids.some(p => {
    const s = p.strengths.join(" ").toLowerCase();
    return s.includes("savunma") || s.includes("top kapma") || s.includes("mücadele") || p.name.includes("Torreira") || p.name.includes("Ndidi") || p.name.includes("Alvarez");
  });
  if (hasDmf) dmfBonus = 12;
  
  const avgForm = selectedPlayers.reduce((s, p) => s + p.form, 0) / 11;
  const formBonus = Math.round((avgForm - 75) * 0.4);
  const totalChemistry = Math.min(100, baselineChemistry + synergyBonus + dmfBonus + formBonus);

  // 2. Expected points calculation (25 matches)
  const totalImpact = selectedPlayers.reduce((s, p) => s + p.impactScore, 0);
  const chemBonus = (totalChemistry - 70) * 0.25; // -5 to +7.5 points effect
  const calculatedPointsBase = ((totalImpact - 1600) / 1000) * 35 + 35 + chemBonus;
  const randomFactor = Math.floor(Math.random() * 11) - 5;
  let points = Math.max(0, Math.min(75, Math.round(calculatedPointsBase + randomFactor)));
  if (points === 74) points = 73; // 74 is mathematically impossible in 25 games
  
  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (let w = Math.min(25, Math.floor(points / 3)); w >= 0; w--) {
    let d = points - 3 * w;
    if (w + d <= 25) {
      wins = w;
      draws = d;
      losses = 25 - w - d;
      break;
    }
  }

  // 3. Goal Average (25 matches)
  const forwards = selectedPlayers.filter(p => p.position === "Forvet" || p.position === "Kanat");
  const defenders = selectedPlayers.filter(p => p.position === "Defans" || p.position === "Kaleci");
  
  const fwdImpact = forwards.reduce((s, p) => s + p.impactScore, 0);
  const defImpact = defenders.reduce((s, p) => s + p.impactScore, 0);
  
  const goalsScoredBase = (fwdImpact / 350) * 30 + 15;
  const goalsScored = Math.round(goalsScoredBase + (Math.random() * 15 - 7));
  
  const goalsConcededBase = 55 - (defImpact / 450) * 30;
  const goalsConceded = Math.max(5, Math.round(goalsConcededBase + (Math.random() * 15 - 7)));

  const goalDiff = goalsScored - goalsConceded;
  const sign = goalDiff >= 0 ? "+" : "";

  // 4. Generate simulated standings for the 18 real teams + user's squad
  const simStandings = standings.map(r => {
    const ratio = 25 / 34;
    let basePts = Math.round(r.pts * ratio);
    const variation = Math.floor(Math.random() * 9) - 4;
    let simPts = Math.max(0, Math.min(75, basePts + variation));
    if (simPts === 74) simPts = 73;
    
    let teamG = 0, teamB = 0, teamM = 0;
    for (let w = Math.min(25, Math.floor(simPts / 3)); w >= 0; w--) {
      let d = simPts - 3 * w;
      if (w + d <= 25) {
        teamG = w;
        teamB = d;
        teamM = 25 - w - d;
        break;
      }
    }
    
    let teamAg = Math.round(r.ag * ratio + (Math.random() * 8 - 4));
    let teamYg = Math.round(r.yg * ratio + (Math.random() * 8 - 4));
    teamAg = Math.max(0, teamAg);
    teamYg = Math.max(0, teamYg);
    const teamGd = teamAg - teamYg;
    
    return {
      team: r.team,
      o: 25,
      g: teamG,
      b: teamB,
      m: teamM,
      ag: teamAg,
      yg: teamYg,
      gd: teamGd,
      pts: simPts,
      isUser: false
    };
  });

  simStandings.push({
    team: "Kendi Kadronuz",
    o: 25,
    g: wins,
    b: draws,
    m: losses,
    ag: goalsScored,
    yg: goalsConceded,
    gd: goalDiff,
    pts: points,
    isUser: true
  });

  // Sort by points, then goal difference, then goals scored
  simStandings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.ag - a.ag;
  });

  const userRank = simStandings.findIndex(t => t.isUser) + 1;

  // AI Scout Report Content Generation
  let rankComment = "";
  if (userRank === 1) {
    rankComment = `<p>🏆 <strong>ŞAMPİYONLUK RÜYASI!</strong> Kadronuz 25 maçlık simülasyonu <strong>${userRank}. sırada (Şampiyon)</strong> tamamladı! Ligin tozunu atan bu yapılanma, Süper Lig'in yeni hükümdarı olmaya aday.</p>`;
  } else if (userRank <= 4) {
    rankComment = `<p>🇪🇺 <strong>Avrupa Vizesi:</strong> Kadronuz 25 maçlık simülasyonu <strong>${userRank}. sırada</strong> bitirerek Avrupa kupalarına katılma hakkı kazandı. Zirve yarışında büyük bir tehdit oluşturuyorsunuz.</p>`;
  } else if (userRank <= 8) {
    rankComment = `<p>📈 <strong>Orta Sıra Güvenliği:</strong> Kadronuz ligi <strong>${userRank}. sırada</strong> tamamladı. İstikrarlı bir performans sergilese de şampiyonluk ortaklığı için kadro derinliği artırılmalı.</p>`;
  } else if (userRank <= 15) {
    rankComment = `<p>⚠️ <strong>Gelişime Açık:</strong> Kadronuz ligi <strong>${userRank}. sırada</strong> bitirdi. Düşme hattından uzak olsa da hedeflenen başarıların gerisinde kalındı.</p>`;
  } else {
    rankComment = `<p>🚨 <strong>KÜME DÜŞME TEHLİKESİ!</strong> Kadronuz simülasyonu <strong>${userRank}. sırada (Küme düşme hattı)</strong> tamamladı. Acilen taktiksel değişikliklere ve kritik takviyelere ihtiyaç var!</p>`;
  }

  const avgAge = selectedPlayers.reduce((s, p) => s + p.age, 0) / 11;
  let ageAnalysis = "";
  if (avgAge > 30) {
    ageAnalysis = `<p>👴 <strong>Deneyim Odaklı Kadro:</strong> Takımınızın yaş ortalaması oldukça yüksek (<strong>${avgAge.toFixed(1)}</strong>). Büyük maç streslerini kolaylıkla yönetebilecek deneyimli ayaklara sahipsiniz ancak uzun maratonlarda fiziksel düşüşler ve sakatlık riskleri yaşanabilir.</p>`;
  } else if (avgAge < 25) {
    ageAnalysis = `<p>👶 <strong>Gelecek ve Dinamizm:</strong> Kadronuz çok genç ve enerjik (<strong>${avgAge.toFixed(1)}</strong> yaş). Tempolu oyunda ve pres gücünde rakipleri boğabilirsiniz fakat ligin kırılma anlarında tecrübe eksikliği hissedilebilir.</p>`;
  } else {
    ageAnalysis = `<p>⚖️ <strong>Dengeli Yaş Dağılımı:</strong> Takım yaş ortalaması son derece dengeli (<strong>${avgAge.toFixed(1)}</strong>). Tecrübe ile atletizm arasındaki altın dengeyi yakalamış durumdasınız.</p>`;
  }

  const budget = state.builderBudget;
  const maxVal = Math.max(...selectedPlayers.map(p => p.marketValue));
  const superstar = selectedPlayers.find(p => p.marketValue === maxVal);
  let budgetAnalysis = "";
  if (maxVal > budget * 0.4) {
    budgetAnalysis = `<p>⭐ <strong>Yıldız Bağımlılığı:</strong> Bütçenizin <strong>%${Math.round((maxVal/budget)*100)}</strong>'ini kaplayan <strong>${superstar.name}</strong> takımın mutlak lideri. Bu superstar odaklı bir yapı sunsa da, onun sakatlanması halinde alternatif üretmekte zorlanabilirsiniz.</p>`;
  } else {
    budgetAnalysis = `<p>💼 <strong>Dengeli Bütçe Yönetimi:</strong> Bütçenizi tek bir yıldıza yatırmak yerine homojen dağıtarak geniş ve dengeli bir kadro kurmuşsunuz. Sakatlık veya formsuzluk durumlarında alternatiflerinizin olması takımı koruyacaktır.</p>`;
  }

  const strengthCounts = {};
  selectedPlayers.forEach(p => {
    p.strengths.forEach(s => {
      strengthCounts[s] = (strengthCounts[s] || 0) + 1;
    });
  });
  const sortedStrengths = Object.entries(strengthCounts).sort((a,b) => b[1] - a[1]);
  let strengthsText = "";
  if (sortedStrengths.length > 0) {
    strengthsText = `<p>🎯 <strong>Taktiksel Güçler:</strong> Kadronuzda en çok öne çıkan yetenekler: <strong>${sortedStrengths.slice(0, 2).map(x => x[0]).join(" ve ")}</strong>. Bu nitelikler, oyun kurarken ve hücum varyasyonlarında temel silahlarınız olacaktır.</p>`;
  }

  let advice = "";
  if (totalChemistry < 70) {
    advice = `<p>💡 <strong>AI Önerisi:</strong> Takım kimyanız (<strong>%${totalChemistry}</strong>) biraz düşük. Aynı takımdan oynayan oyuncuları bir araya getirerek (örneğin stoper ikilisini veya kanat-bek uyumunu) sinerjiyi artırabilirsiniz.</p>`;
  } else if (totalImpact < 800) {
    advice = `<p>💡 <strong>AI Önerisi:</strong> Kadronuz dengeli ancak genel etki kalitesi biraz sınırda. Bütçe limitinizi sonuna kadar zorlayıp, daha ucuz mevkilerden tasarruf ederek kilit pozisyonlara daha yüksek puanlı lider oyuncular yerleştirebilirsiniz.</p>`;
  } else {
    advice = `<p>💡 <strong>AI Önerisi:</strong> Harika bir bütçe/performans dengesi yakalanmış! Bu kadro şampiyonluk yarışının en güçlü adaylarından biri olacaktır. Taktiksel yapıyı bozmadan devam edin.</p>`;
  }

  simReportContent.innerHTML = rankComment + ageAnalysis + budgetAnalysis + strengthsText + advice;

  // 5. Derby Simulation Generation
  const bigTeams = ["Galatasaray", "Fenerbahce", "Besiktas", "Trabzonspor"];
  let opponent = "Galatasaray";
  let minPlayers = 11;
  bigTeams.forEach(t => {
    const cnt = selectedPlayers.filter(p => p.team === t).length;
    if (cnt < minPlayers) {
      minPlayers = cnt;
      opponent = t;
    }
  });

  let userGoals = 0;
  let oppGoals = 0;
  const squadStrength = (totalImpact * 0.7) + (totalChemistry * 5);
  
  if (squadStrength > 2000) {
    // Strong squad: high chance of winning, but can still draw or lose a close match
    const r = Math.random();
    if (r < 0.6) {
      userGoals = Math.floor(Math.random() * 3) + 1; // 1-3
      oppGoals = Math.floor(Math.random() * userGoals); // 0 to userGoals-1 (Win)
    } else if (r < 0.85) {
      userGoals = Math.floor(Math.random() * 3); // 0-2
      oppGoals = userGoals; // Draw
    } else {
      oppGoals = Math.floor(Math.random() * 2) + 1; // 1-2
      userGoals = Math.floor(Math.random() * oppGoals); // Lose
    }
  } else if (squadStrength < 1600) {
    // Weak squad: high chance of losing
    const r = Math.random();
    if (r < 0.6) {
      oppGoals = Math.floor(Math.random() * 3) + 1;
      userGoals = Math.floor(Math.random() * oppGoals); // Lose
    } else if (r < 0.85) {
      userGoals = Math.floor(Math.random() * 3);
      oppGoals = userGoals; // Draw
    } else {
      userGoals = Math.floor(Math.random() * 2) + 1;
      oppGoals = Math.floor(Math.random() * userGoals); // Win
    }
  } else {
    // Average squad: balanced chances
    const r = Math.random();
    if (r < 0.4) {
      userGoals = Math.floor(Math.random() * 3) + 1;
      oppGoals = Math.floor(Math.random() * userGoals); // Win
    } else if (r < 0.8) {
      userGoals = Math.floor(Math.random() * 3);
      oppGoals = userGoals; // Draw
    } else {
      oppGoals = Math.floor(Math.random() * 3) + 1;
      userGoals = Math.floor(Math.random() * oppGoals); // Lose
    }
  }

  simDerbyHeader.innerHTML = `
    <span style="display:flex; align-items:center; gap:8px;">${getFallbackLogoSvg("Kadro Kur")} Kendi Kadronuz</span>
    <span class="sim-derby-score">${userGoals} - ${oppGoals}</span>
    <span style="display:flex; align-items:center; gap:8px;"><span>${opponent}</span> ${getTeamLogoHtml(opponent, "small")}</span>
  `;

  const timelineEvents = [];
  const defs = selectedPlayers.filter(p => p.position === "Defans" || p.position === "Orta saha");
  const cardPlayer = defs.length > 0 ? defs[Math.floor(Math.random() * defs.length)].name : "Oyuncu";
  timelineEvents.push({
    min: Math.floor(Math.random() * 30) + 15,
    type: "cards",
    text: `⚠️ <strong>${cardPlayer}</strong> rakip hücumu kesmek için yaptığı taktik faul nedeniyle sarı kart gördü.`
  });

  const userScorers = selectedPlayers.filter(p => p.position === "Forvet" || p.position === "Kanat" || p.position === "Orta saha");
  for (let i = 0; i < userGoals; i++) {
    const scorer = userScorers.length > 0 ? userScorers[Math.floor(Math.random() * userScorers.length)].name : "Forvet";
    const assistProvider = selectedPlayers.filter(p => p.name !== scorer && p.position !== "Kaleci");
    const assister = assistProvider.length > 0 ? assistProvider[Math.floor(Math.random() * assistProvider.length)].name : null;
    const assistText = assister ? `, <strong>${assister}</strong>'in asistinde` : "";
    
    timelineEvents.push({
      min: Math.floor(Math.random() * 40) + (i * 20) + 5,
      type: "goal",
      text: `⚽ <strong>GOL!</strong> Takımınızda <strong>${scorer}</strong> ceza sahası içinden klas bir vuruşla${assistText} golü buluyor!`
    });
  }

  for (let i = 0; i < oppGoals; i++) {
    timelineEvents.push({
      min: Math.floor(Math.random() * 45) + (i * 15) + 10,
      type: "opp-goal",
      text: `⚽ <strong>Gol!</strong> ${opponent} takımı hızlı hücumla savunmamızın arkasına sarkarak golü atıyor.`
    });
  }

  const gks = selectedPlayers.filter(p => p.position === "Kaleci");
  const gkName = gks.length > 0 ? gks[0].name : "Kalecimiz";
  timelineEvents.push({
    min: Math.floor(Math.random() * 20) + 70,
    type: "save",
    text: `🧤 <strong>Dev Kurtarış!</strong> ${opponent} hücumunda karşı karşıya kalınan pozisyonda kalecimiz <strong>${gkName}</strong> müthiş refleksle golü önledi.`
  });

  timelineEvents.sort((a, b) => a.min - b.min);

  simDerbyTimeline.innerHTML = timelineEvents.map((e, idx) => {
    let cls = e.type === "goal" ? "goal" : (e.type === "cards" ? "cards" : "");
    return `
      <div class="sim-timeline-event ${cls}" style="animation-delay: ${400 + idx * 120}ms;">
        <strong>${e.min}'</strong> ${e.text}
      </div>
    `;
  }).join("");

  setTimeout(() => {
    simLoadingScreen.hidden = true;
    simResultsScreen.hidden = false;
    
    animateCountUp(simStatChemistry, totalChemistry, "%", 1200);
    simChemistryBar.style.width = totalChemistry + "%";
    
    animateCountUp(simStatPoints, points, " Puan", 1200);
    simStatRecord.textContent = `${wins}G ${draws}B ${losses}M`;
    
    simStatGoals.textContent = `${goalsScored} - ${goalsConceded}`;
    simStatDiff.textContent = sign + goalDiff;
    simStatDiff.className = goalDiff >= 0 ? "success" : "danger";
    if (goalDiff >= 0) {
      simStatDiff.style.color = "#10b981";
    } else {
      simStatDiff.style.color = "#ef4444";
    }

    // Render Standings Table
    simStandingsBody.innerHTML = simStandings.map((t, index) => {
      const rank = index + 1;
      const rowClass = t.isUser ? "class='sim-row-user'" : "";
      const logoHtml = t.isUser ? getTeamLogoHtml("Kadro Kur", "small") : getTeamLogoHtml(t.team, "small");
      const teamDisplayName = t.isUser ? "Kendi Kadronuz" : t.team;
      const signStr = t.gd >= 0 ? "+" : "";
      return `
        <tr ${rowClass}>
          <td>${rank}</td>
          <td>
            <div class="st-team">
              ${logoHtml}
              <span>${teamDisplayName}</span>
            </div>
          </td>
          <td>${t.o}</td>
          <td>${t.g}</td>
          <td>${t.b}</td>
          <td>${t.m}</td>
          <td>${signStr}${t.gd}</td>
          <td class="st-pts">${t.pts}</td>
        </tr>
      `;
    }).join("");
  }, 3400);
}

function closeSimulationModal() {
  simulationModal.hidden = true;
}

function renderBuilderPlayers() {
  if (!state.activeSlotId) return;
  const slotEl = document.getElementById(state.activeSlotId);
  if (!slotEl) return;
  
  const slotPosition = slotEl.dataset.position;
  const slotRole = slotEl.dataset.role;
  const isForvet = slotPosition === "Forvet";
  
  // Filter eligible players
  const filtered = enrichedPlayers.filter(p => {
    // position match: Forvet slots accept Kanat and Forvet
    const matchesPos = isForvet 
      ? (p.position === "Forvet" || p.position === "Kanat") 
      : (p.position === slotPosition);
    if (!matchesPos) return false;
    
    // exclude players already selected in OTHER slots
    const isAlreadySelected = Object.entries(state.builderSquad).some(([role, sel]) => {
      return role !== slotRole && sel && sel.name === p.name;
    });
    if (isAlreadySelected) return false;
    
    // search filter
    if (state.builderSearch) {
      const q = state.builderSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
    }
    return true;
  });
  
  // Sort by impact score descending
  filtered.sort((a, b) => b.impactScore - a.impactScore);
  
  if (filtered.length === 0) {
    builderPlayerList.innerHTML = `<p style="padding:20px; text-align:center; color:var(--muted); font-weight:600;">Oyuncu bulunamadı.</p>`;
    return;
  }
  
  builderPlayerList.innerHTML = filtered.map(p => `
    <div class="builder-player-card" data-name="${p.name}">
      <div class="builder-player-info">
        <strong>${p.name}</strong>
        <small>${p.team} • ${p.position} • Yaş ${p.age}</small>
      </div>
      <div class="builder-player-stats">
        <span class="builder-player-val">${p.marketValue.toFixed(1)} M€</span>
        <span class="builder-player-impact">${p.impactScore} Pts</span>
      </div>
    </div>
  `).join("");
  
  // Bind click events to player cards
  builderPlayerList.querySelectorAll(".builder-player-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = card.dataset.name;
      const player = enrichedPlayers.find(x => x.name === name);
      if (player) {
        state.builderSquad[slotRole] = player;
        updateBuilderSlotDOM(slotRole);
        updateBuilderStats();
        closeBuilderModal();
      }
    });
  });
}

function updateBuilderSlotDOM(role) {
  const slotEl = document.getElementById("slot-" + role);
  if (!slotEl) return;
  
  const player = state.builderSquad[role];
  if (player) {
    const imgId = `slot-img-${role}-${player.name.replace(/\s+/g, '-')}`;
    setTimeout(() => loadPlayerImage(player.name, imgId), 0);
    slotEl.classList.add("populated");
    slotEl.innerHTML = `
      <button class="remove-player-btn" data-role="${role}" type="button" aria-label="Kaldır">✕</button>
      <div class="slot-photo-wrapper">
        <img id="${imgId}" class="slot-player-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3C/svg%3E" alt="${player.name}">
      </div>
      <span class="slot-role">${role.toUpperCase()}</span>
      <span class="populated-player-name">${player.name}</span>
      <span class="populated-player-value">${player.marketValue.toFixed(1)} M€</span>
      <span class="populated-player-score">${player.impactScore} Pts</span>
    `;
    
    // Bind remove button click
    slotEl.querySelector(".remove-player-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // prevent modal opening
      state.builderSquad[role] = null;
      updateBuilderSlotDOM(role);
      updateBuilderStats();
    });
  } else {
    slotEl.classList.remove("populated");
    slotEl.innerHTML = `
      <span class="slot-role">${role.toUpperCase()}</span>
      <span class="slot-add">+</span>
    `;
  }
}

function updateBuilderStats() {
  let totalValue = 0;
  let totalImpact = 0;
  let populatedCount = 0;
  
  Object.values(state.builderSquad).forEach(p => {
    if (p) {
      totalValue += p.marketValue;
      totalImpact += p.impactScore;
      populatedCount++;
    }
  });
  
  totalValueValue.textContent = totalValue.toFixed(1) + " M€";
  totalImpactValue.textContent = totalImpact;
  
  const budget = state.builderBudget;
  maxBudgetValue.textContent = budget.toFixed(1) + " M€";
  
  const pct = Math.min(100, (totalValue / budget) * 100);
  budgetProgressBar.style.width = pct + "%";
  
  const labelsEl = totalValueValue.closest(".budget-progress-labels");
  
  if (totalValue > budget) {
    budgetProgressBar.classList.add("exceeded");
    if (labelsEl) labelsEl.classList.add("exceeded");
    
    builderMessage.className = "builder-status-msg error";
    builderMessage.textContent = `Bütçe limitini aştınız! Limit: ${budget.toFixed(1)} M€, Kadro Değeri: ${totalValue.toFixed(1)} M€`;
    builderMessage.hidden = false;
  } else {
    budgetProgressBar.classList.remove("exceeded");
    if (labelsEl) labelsEl.classList.remove("exceeded");
    
    if (populatedCount === 11) {
      builderMessage.className = "builder-status-msg success";
      builderMessage.textContent = `Tebrikler! ${budget.toFixed(1)} M€ bütçe altında ${totalImpact} toplam etki skoruyla kadronuzu başarıyla kurdunuz!`;
      builderMessage.hidden = false;
    } else {
      builderMessage.hidden = true;
    }
  }

  const isComplete = (populatedCount === 11 && totalValue <= budget);
  if (simulateSquadBtn) {
    simulateSquadBtn.disabled = !isComplete;
  }

  // AI Scout Suggestions Agent invocation
  updateScoutSuggestions();
}

function closeBuilderModal() {
  builderModal.hidden = true;
  state.activeSlotId = null;
}

function resetBuilder() {
  Object.keys(state.builderSquad).forEach(role => {
    state.builderSquad[role] = null;
    updateBuilderSlotDOM(role);
  });
  updateBuilderStats();
}

export function initSquadBuilder() {
  // Budget dropdown change handler
  if (squadBudgetLimit) {
    squadBudgetLimit.addEventListener("change", (e) => {
      state.builderBudget = parseFloat(e.target.value);
      updateBuilderStats();
    });
  }
  
  // Pitch slot click handler
  document.querySelectorAll(".pitch-slot").forEach(slot => {
    slot.addEventListener("click", () => {
      state.activeSlotId = slot.id;
      const slotRole = slot.dataset.role;
      const slotPosition = slot.dataset.position;
      
      builderModalSubtitle.textContent = `Mevki: ${slotPosition} (${slotRole.toUpperCase()})`;
      state.builderSearch = "";
      builderSearchInput.value = "";
      
      renderBuilderPlayers();
      builderModal.hidden = false;
    });
  });
  
  // Search input handler in builder modal
  if (builderSearchInput) {
    builderSearchInput.addEventListener("input", (e) => {
      state.builderSearch = e.target.value;
      renderBuilderPlayers();
    });
  }
  
  // Close buttons & modal clicks
  if (builderModalClose) {
    builderModalClose.addEventListener("click", closeBuilderModal);
  }
  
  if (builderModal) {
    builderModal.addEventListener("click", (e) => {
      if (e.target === builderModal) {
        closeBuilderModal();
      }
    });
  }
  
  // Reset button click
  if (resetBuilderBtn) {
    resetBuilderBtn.addEventListener("click", resetBuilder);
  }

  // Simulation button click
  if (simulateSquadBtn) {
    simulateSquadBtn.addEventListener("click", runSquadSimulation);
  }

  // Download button click
  const downloadSquadBtn = document.getElementById("downloadSquadBtn");
  if (downloadSquadBtn) {
    downloadSquadBtn.addEventListener("click", () => {
      const pitch = document.querySelector(".pitch-container");
      if (!pitch) return;
      
      // Add a loading state to the button
      const origText = downloadSquadBtn.innerHTML;
      downloadSquadBtn.innerHTML = "İndiriliyor...";
      downloadSquadBtn.disabled = true;

      // Ensure html2canvas is loaded
      if (typeof html2canvas === "undefined") {
        alert("İndirme aracı yüklenemedi. Lütfen sayfayı yenileyin.");
        downloadSquadBtn.innerHTML = origText;
        downloadSquadBtn.disabled = false;
        return;
      }

      html2canvas(pitch, { 
        backgroundColor: "#0f172a", 
        scale: 2,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        const link = document.createElement("a");
        link.download = "ruya-onbirim.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }).catch(err => {
        console.error("Ekran görüntüsü alınırken hata:", err);
        alert("Bir hata oluştu.");
      }).finally(() => {
        downloadSquadBtn.innerHTML = origText;
        downloadSquadBtn.disabled = false;
      });
    });
  }

  if (simulationModalClose) {
    simulationModalClose.addEventListener("click", closeSimulationModal);
  }

  if (simulationModal) {
    simulationModal.addEventListener("click", (e) => {
      if (e.target === simulationModal) {
        closeSimulationModal();
      }
    });
  }
  
  // Escape key support to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!builderModal.hidden) closeBuilderModal();
      if (!simulationModal.hidden) closeSimulationModal();
    }
  });
  
  // Initial stats setup
  updateBuilderStats();
}