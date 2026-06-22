import { initTheme, renderThemes, applyTheme } from './modules/theme.js';
import { fillTeamFilter, bindFilters } from './modules/filter.js';
import { renderSummary, renderBoards, renderStandings, renderAwards, renderPlayers } from './modules/render.js';
import { renderSquadTeams } from './modules/squad.js';
import { fillCompareOptions, fillTeamCompareOptions, renderComparison, renderTeamComparison } from './modules/comparison.js';
import { renderStatsCharts } from './modules/stats.js';
import { renderPoll } from './modules/poll.js';
import { renderMatchPredictions } from './modules/predict.js';
import { initSquadBuilder } from './modules/squadBuilder.js';
import { initAmbientMusic } from './modules/music.js';
import { initWelcomeSplash } from './modules/splash.js';

// Initialize Theme
initTheme();
renderThemes();

// Initialize UI components
fillTeamFilter();
bindFilters();

// Render Views
renderSummary();
renderBoards();
renderSquadTeams();
renderStandings();
renderAwards();
renderPlayers();
renderComparison();
fillTeamCompareOptions();
renderTeamComparison();
renderStatsCharts();
renderPoll();
renderMatchPredictions();
initSquadBuilder();
initAmbientMusic();
initWelcomeSplash();