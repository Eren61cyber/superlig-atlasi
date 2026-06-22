import { teamLogos, teamThemes } from '../data/teams.js';
// Takım adlarını normalize eden yardımcı (Türkçe ↔ ASCII)
export function normalizeTeamName(name) {
  return name
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U');
}

// Her takım için tek kayıt (ASCII anahtarı — normalizeTeamName ile eşleşir)
const teamLogos = {
  Galatasaray:    "https://tmssl.akamaized.net/images/wappen/head/141.png",
  Fenerbahce:     "https://tmssl.akamaized.net/images/wappen/head/36.png",
  Besiktas:       "https://tmssl.akamaized.net/images/wappen/head/114.png",
  Trabzonspor:    "https://tmssl.akamaized.net/images/wappen/head/449.png",
  Basaksehir:     "https://tmssl.akamaized.net/images/wappen/head/6890.png",
  Goztepe:        "https://tmssl.akamaized.net/images/wappen/head/1467.png",
  Samsunspor:     "https://tmssl.akamaized.net/images/wappen/head/152.png",
  Rizespor:       "https://tmssl.akamaized.net/images/wappen/head/126.png",
  Konyaspor:      "https://tmssl.akamaized.net/images/wappen/head/2293.png",
  Kocaelispor:    "https://tmssl.akamaized.net/images/wappen/head/139.png",
  Alanyaspor:     "https://tmssl.akamaized.net/images/wappen/head/11282.png",
  "Gaziantep FK": "https://tmssl.akamaized.net/images/wappen/head/2832.png",
  Kasimpasa:      "https://tmssl.akamaized.net/images/wappen/head/10484.png",
  Genclerbirligi: "https://tmssl.akamaized.net/images/wappen/head/820.png",
  Eyupspor:       "https://tmssl.akamaized.net/images/wappen/head/4046.png",
  Antalyaspor:    "https://tmssl.akamaized.net/images/wappen/head/589.png",
  Kayserispor:    "https://tmssl.akamaized.net/images/wappen/head/3205.png",
  Karagumruk:     "https://tmssl.akamaized.net/images/wappen/head/7124.png"
};

export function getFallbackLogoSvg(teamName) {
  const theme = (typeof teamThemes !== 'undefined' ? teamThemes.find(t => t.name === teamName) : null) || { primary: "#38bdf8", secondary: "#fbbf24" };
  const initials = teamName.substring(0, 2).toUpperCase();
  return `<svg class="team-logo-fallback" viewBox="0 0 100 100" style="background:linear-gradient(135deg, ${theme.primary}, ${theme.secondary || theme.primary}); border-radius:6px; display:inline-block; vertical-align:middle; width:100%; height:100%;"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="white" font-family='Outfit', sans-serif font-weight='900' font-size='42'>${initials}</text></svg>`;
}

export function getTeamLogoHtml(teamName, sizeClass = "small") {
  // Önce orijinal adla ara, bulamazsan normalize et
  const logoUrl = teamLogos[teamName] || teamLogos[normalizeTeamName(teamName)];
  if (!logoUrl) {
    return `<span class="team-logo-wrapper ${sizeClass}">${getFallbackLogoSvg(teamName)}</span>`;
  }
  const escapedFallback = getFallbackLogoSvg(teamName).replace(/"/g, '&quot;').replace(/'/g, "\\'")
  return `<span class="team-logo-wrapper ${sizeClass}"><img src="${logoUrl}" alt="${teamName}" class="team-logo-img" onerror="this.outerHTML='${escapedFallback}'"></span>`;
}

export function getAwardLogoHtml(teamString) {
  if (teamString.includes("/")) {
    return `<span class="team-logo-wrapper tiny" style="background:#ffd700; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center;"><span style="font-size:10px;line-height:1;display:block;text-align:center;">🏆</span></span>`;
  }
  return getTeamLogoHtml(teamString, "tiny");
}

import { enrichedPlayers } from './state.js';
export function formatValue(v) { return v >= 1 ? v.toFixed(1)+"M" : Math.round(v*1000)+"K"; }
export function getLabel(p) {
  if (p.valueScore > 900) return "Değer canavarı";
  if (p.scoutScore > 430) return "Scout radarı";
  if (p.bigMatch > 88)    return "Büyük maç";
  if (p.form > 88)        return "Formda";
  return "İstikrar";
}
export function tmUrl(name) {
  return `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;
}
export function getFilteredPlayers() {
  return enrichedPlayers
    .filter(p => {
      const txt = `${p.name} ${p.team} ${p.position}`.toLowerCase();
      return txt.includes(state.search.toLowerCase()) &&
        (state.position==="all" || p.position===state.position) &&
        (state.team==="all"     || p.team===state.team) &&
        (!state.budgetOnly      || p.marketValue<2) &&
        (p.age <= state.maxAge) &&
        (p.marketValue <= state.maxPrice);
    })
    .sort((a,b) => b[state.sort]-a[state.sort]);
}
export function topBy(key) { return [...enrichedPlayers].sort((a,b)=>b[key]-a[key])[0]; }

// ── ÖZET ─────────────────────────────────────────────────────