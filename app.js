const players = [
  {
    name: "Deniz Karaca",
    team: "Ankara Kartallari",
    position: "Forvet",
    age: 23,
    marketValue: 0.9,
    goals: 11,
    assists: 3,
    minutes: 1470,
    bigMatch: 84,
    form: 91,
    story: "Dusuk butceyle gelen, son haftalarda ceza sahasi kosulariyla mac koparan forvet."
  },
  {
    name: "Emir Sari",
    team: "Istanbul Aslanlari",
    position: "Forvet",
    age: 30,
    marketValue: 13,
    goals: 16,
    assists: 5,
    minutes: 2060,
    bigMatch: 78,
    form: 79,
    story: "Yildiz kalitesi yuksek; ceza sahasinda az pozisyonla cok is cikaran bitirici."
  },
  {
    name: "Mert Can Yildiz",
    team: "Izmir Firtinasi",
    position: "Kanat",
    age: 21,
    marketValue: 1.4,
    goals: 7,
    assists: 8,
    minutes: 1810,
    bigMatch: 72,
    form: 88,
    story: "Bire birde hizli, asist tehdidi yuksek ve scout radarinda parlayan bir kanat."
  },
  {
    name: "Alihan Demir",
    team: "Karadeniz Gucu",
    position: "Orta saha",
    age: 25,
    marketValue: 2.2,
    goals: 4,
    assists: 9,
    minutes: 2240,
    bigMatch: 69,
    form: 75,
    story: "Takimin temposunu ayarlayan, pas kalitesiyle gorunmeyen katkisi buyuk oyun kurucu."
  },
  {
    name: "Kerem Bora",
    team: "Bursa Yesili",
    position: "Defans",
    age: 27,
    marketValue: 0.75,
    goals: 3,
    assists: 2,
    minutes: 2430,
    bigMatch: 81,
    form: 82,
    story: "Ucuz ama guvenilir; hava toplari ve kritik mudahalelerde takimini ayakta tutuyor."
  },
  {
    name: "Yusuf Aksoy",
    team: "Istanbul Lacivert",
    position: "Kanat",
    age: 24,
    marketValue: 7.5,
    goals: 9,
    assists: 10,
    minutes: 2185,
    bigMatch: 83,
    form: 84,
    story: "Skor ve asist dengesini iyi kuran, buyuk maclarda sorumluluk alan kanat."
  },
  {
    name: "Sami Tekin",
    team: "Sivas Kirmizisi",
    position: "Forvet",
    age: 28,
    marketValue: 1.1,
    goals: 10,
    assists: 1,
    minutes: 1320,
    bigMatch: 92,
    form: 86,
    story: "Az surede cok gol bulan, buyuk rakiplere karsi surpriz etki ureten santrfor."
  },
  {
    name: "Burak Efe",
    team: "Akdeniz Spor",
    position: "Kaleci",
    age: 26,
    marketValue: 0.65,
    goals: 0,
    assists: 0,
    minutes: 2520,
    bigMatch: 87,
    form: 83,
    story: "Kurtaris yuzdesi ve buyuk mac refleksleriyle puan kazandiran kaleci."
  },
  {
    name: "Arda Keskin",
    team: "Kocaeli Kuzey",
    position: "Orta saha",
    age: 19,
    marketValue: 0.55,
    goals: 5,
    assists: 6,
    minutes: 1180,
    bigMatch: 66,
    form: 89,
    story: "Genc yasta skor katkisi veren, potansiyel ve maliyet tarafinda dikkat ceken isim."
  },
  {
    name: "Ozan Kaya",
    team: "Baskent Birlik",
    position: "Defans",
    age: 31,
    marketValue: 3.6,
    goals: 2,
    assists: 4,
    minutes: 2600,
    bigMatch: 74,
    form: 70,
    story: "Tecrubesiyle savunma hattini yoneten, degeri istikrardan gelen lider stoper."
  },
  {
    name: "Nico Alves",
    team: "Marmara Mavi",
    position: "Kanat",
    age: 22,
    marketValue: 2.8,
    goals: 8,
    assists: 7,
    minutes: 1690,
    bigMatch: 76,
    form: 92,
    story: "Son haftalarin formda hucumcusu; hizli karar ve ceza sahasi kosulariyla fark yaratiyor."
  },
  {
    name: "Tuna Aydin",
    team: "Ege Kaplanlari",
    position: "Forvet",
    age: 26,
    marketValue: 0.45,
    goals: 6,
    assists: 2,
    minutes: 790,
    bigMatch: 71,
    form: 80,
    story: "Kulubeden gelip oyunu degistiren, dakika basina etkisi yuksek firsat oyuncusu."
  }
];

const weights = {
  goal: 7,
  assist: 5,
  minutes: 0.012,
  bigMatch: 0.38,
  form: 0.32
};

const state = {
  search: "",
  position: "all",
  sort: "valueScore",
  budgetOnly: false
};

const enrichedPlayers = players.map((player) => {
  const attacking = player.goals * weights.goal + player.assists * weights.assist;
  const roleBonus = player.position === "Kaleci" ? 46 : player.position === "Defans" ? 28 : 0;
  const impactScore = Math.round(
    attacking +
      player.minutes * weights.minutes +
      player.bigMatch * weights.bigMatch +
      player.form * weights.form +
      roleBonus
  );
  const valueScore = Math.round((impactScore / Math.max(player.marketValue, 0.35)) * 7);
  const scoutScore = Math.round(valueScore * 0.58 + player.form * 0.28 + (28 - Math.min(player.age, 28)) * 1.6);
  return {
    ...player,
    impactScore,
    valueScore,
    scoutScore,
    contribution: player.goals + player.assists
  };
});

const playerGrid = document.querySelector("#playerGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const positionFilter = document.querySelector("#positionFilter");
const sortMode = document.querySelector("#sortMode");
const budgetOnly = document.querySelector("#budgetOnly");
const playerA = document.querySelector("#playerA");
const playerB = document.querySelector("#playerB");
const comparison = document.querySelector("#comparison");
const swapButton = document.querySelector("#swapButton");

function formatValue(value) {
  return value >= 1 ? value.toFixed(1) + "M" : Math.round(value * 1000) + "K";
}

function getLabel(player) {
  if (player.valueScore > 720) return "Gizli yildiz";
  if (player.scoutScore > 430) return "Scout radari";
  if (player.bigMatch > 84) return "Buyuk mac";
  if (player.form > 86) return "Formda";
  return "Istikrar";
}

function getFilteredPlayers() {
  return enrichedPlayers
    .filter((player) => {
      const text = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      const matchesSearch = text.includes(state.search.toLowerCase());
      const matchesPosition = state.position === "all" || player.position === state.position;
      const matchesBudget = !state.budgetOnly || player.marketValue < 2;
      return matchesSearch && matchesPosition && matchesBudget;
    })
    .sort((a, b) => b[state.sort] - a[state.sort]);
}

function renderSummary() {
  const byImpact = [...enrichedPlayers].sort((a, b) => b.impactScore - a.impactScore)[0];
  const byValue = [...enrichedPlayers].sort((a, b) => b.valueScore - a.valueScore)[0];
  const byScout = [...enrichedPlayers].sort((a, b) => b.scoutScore - a.scoutScore)[0];
  document.querySelector("#topImpact").textContent = `${byImpact.name} (${byImpact.impactScore})`;
  document.querySelector("#topValue").textContent = `${byValue.name} (${byValue.valueScore})`;
  document.querySelector("#topScout").textContent = `${byScout.name} (${byScout.scoutScore})`;
}

function renderPlayers() {
  const list = getFilteredPlayers();
  resultCount.textContent = `${list.length} oyuncu`;
  playerGrid.innerHTML = list
    .map((player) => {
      const meterWidth = Math.min(100, Math.round(player.valueScore / 9));
      return `
        <article class="player-card">
          <div class="card-head">
            <div>
              <h3>${player.name}</h3>
              <p>${player.team} • ${player.position} • ${player.age}</p>
            </div>
            <span class="tag">${getLabel(player)}</span>
          </div>
          <div class="stat-row">
            <div class="stat"><span>Deger</span><strong>${formatValue(player.marketValue)} EUR</strong></div>
            <div class="stat"><span>G+A</span><strong>${player.contribution}</strong></div>
            <div class="stat"><span>Etki</span><strong>${player.impactScore}</strong></div>
          </div>
          <div>
            <div class="meter" aria-label="Deger skoru">
              <span style="width: ${meterWidth}%"></span>
            </div>
          </div>
          <p class="story">${player.story}</p>
        </article>
      `;
    })
    .join("");
}

function fillCompareOptions() {
  const options = enrichedPlayers
    .map((player) => `<option value="${player.name}">${player.name} - ${player.team}</option>`)
    .join("");
  playerA.innerHTML = options;
  playerB.innerHTML = options;
  playerA.value = enrichedPlayers[0].name;
  playerB.value = enrichedPlayers[1].name;
}

function statLine(label, left, right, suffix = "") {
  const leftWins = left > right;
  const rightWins = right > left;
  return `
    <div class="duel-row">
      <span>${label}</span>
      <strong>
        <span class="${leftWins ? "winner" : ""}">${left}${suffix}</span>
        /
        <span class="${rightWins ? "winner" : ""}">${right}${suffix}</span>
      </strong>
    </div>
  `;
}

function renderComparison() {
  const left = enrichedPlayers.find((player) => player.name === playerA.value);
  const right = enrichedPlayers.find((player) => player.name === playerB.value);
  const winner =
    left.valueScore === right.valueScore
      ? "Bu eslesme berabereye cok yakin."
      : left.valueScore > right.valueScore
        ? `${left.name} degerine gore daha fazla etki uretiyor.`
        : `${right.name} degerine gore daha fazla etki uretiyor.`;

  comparison.innerHTML = `
    <article class="duel-card">
      <h3>${left.name}</h3>
      ${statLine("Gol", left.goals, right.goals)}
      ${statLine("Asist", left.assists, right.assists)}
      ${statLine("Etki skoru", left.impactScore, right.impactScore)}
      ${statLine("Deger skoru", left.valueScore, right.valueScore)}
      ${statLine("Form", left.form, right.form)}
    </article>
    <article class="duel-card">
      <h3>${right.name}</h3>
      <div class="duel-row"><span>Piyasa degeri</span><strong>${formatValue(left.marketValue)} / ${formatValue(right.marketValue)} EUR</strong></div>
      <div class="duel-row"><span>Dakika</span><strong>${left.minutes} / ${right.minutes}</strong></div>
      <div class="duel-row"><span>Buyuk mac</span><strong>${left.bigMatch} / ${right.bigMatch}</strong></div>
      <div class="duel-row"><span>Scout skoru</span><strong>${left.scoutScore} / ${right.scoutScore}</strong></div>
      <div class="duel-row"><span>Etiket</span><strong>${getLabel(left)} / ${getLabel(right)}</strong></div>
    </article>
    <div class="insight">${winner} Bu sonuc demo formulune gore hesaplandi; gercek surumde canli istatistik ve guncel piyasa verisiyle calisir.</div>
  `;
}

function renderAll() {
  renderSummary();
  renderPlayers();
  renderComparison();
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderPlayers();
});

positionFilter.addEventListener("change", (event) => {
  state.position = event.target.value;
  renderPlayers();
});

sortMode.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderPlayers();
});

budgetOnly.addEventListener("change", (event) => {
  state.budgetOnly = event.target.checked;
  renderPlayers();
});

playerA.addEventListener("change", renderComparison);
playerB.addEventListener("change", renderComparison);
swapButton.addEventListener("click", () => {
  const oldA = playerA.value;
  playerA.value = playerB.value;
  playerB.value = oldA;
  renderComparison();
});

fillCompareOptions();
renderAll();
