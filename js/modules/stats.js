import { getTeamLogoHtml } from './utils.js';
export function renderStatsCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Outfit', sans-serif";

  // Cleanup old charts if any
  chartsInstance.forEach(c => c.destroy());
  chartsInstance = [];

  // --- GERÇEKÇİ 2024 SÜPER LİG VERİLERİ (Mockup yerine) ---

  // 1. Goals & Assists by Team (Puan tablosuyla senkronize veriler)
  const realTeamStats = {
    "Galatasaray": { goals: 77, assists: 54 },
    "Fenerbahce":  { goals: 77, assists: 55 },
    "Trabzonspor": { goals: 61, assists: 42 },
    "Besiktas":    { goals: 59, assists: 41 },
    "Basaksehir":  { goals: 58, assists: 40 }
  };
  const teams = Object.keys(realTeamStats);
  
  const ctxGoals = document.getElementById('goalsChart');
  if (ctxGoals) {
    chartsInstance.push(new Chart(ctxGoals.getContext('2d'), {
      type: 'bar',
      data: {
        labels: teams,
        datasets: [
          { label: 'Gol', data: teams.map(t => realTeamStats[t].goals), backgroundColor: '#38bdf8' },
          { label: 'Asist', data: teams.map(t => realTeamStats[t].assists), backgroundColor: '#fbbf24' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true }, y: { stacked: true } }
      }
    }));
  }

  // 2. Market Value by Position (Lig geneli tahmini milyon Euro)
  const realPosStats = {
    "Kaleci": 115.5,
    "Defans": 340.2,
    "Orta saha": 465.8,
    "Forvet": 310.5
  };
  const positions = Object.keys(realPosStats);
  const ctxValue = document.getElementById('valueChart');
  if (ctxValue) {
    chartsInstance.push(new Chart(ctxValue.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: positions,
        datasets: [{
          data: positions.map(p => realPosStats[p]),
          backgroundColor: ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: { 
        responsive: true, 
        plugins: { 
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (ctx) => ` €${ctx.raw}M` } }
        } 
      }
    }));
  }

  // 3. Average Age by Team (Gerçekçi yaş ortalamaları)
  const realTeamAges = {
    "Trabzonspor": 25.8,
    "Besiktas": 26.5,
    "Galatasaray": 26.8,
    "Fenerbahce": 27.3,
    "Basaksehir": 27.9
  };
  const ageTeams = Object.keys(realTeamAges);
  const ctxAge = document.getElementById('ageChart');
  if (ctxAge) {
    chartsInstance.push(new Chart(ctxAge.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ageTeams,
        datasets: [{
          label: 'Yaş Ortalaması',
          data: ageTeams.map(t => realTeamAges[t]),
          backgroundColor: '#8b5cf6'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { min: 20, max: 32 } }
      }
    }));
  }
}