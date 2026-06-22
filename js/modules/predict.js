import { matchFixtures } from '../data/fixtures.js';
import * as DOM from './dom.js';
import { getTeamLogoHtml } from './utils.js';

export function renderMatchPredictions() {
  const savedScore=parseInt(localStorage.getItem("predict_total_score")||"0");
  userTotalScore.textContent=savedScore;
  const submitted=localStorage.getItem("predict_submitted")==="true";
  matchCards.innerHTML=matchFixtures.map((m,i)=>{
    const sh=localStorage.getItem(`pred_h_${i}`)||"", sa=localStorage.getItem(`pred_a_${i}`)||"";
    let cls="", label="";
    if(submitted&&sh!==""&&sa!==""){
      const ph=parseInt(sh),pa=parseInt(sa);
      if(ph===m.actualHome&&pa===m.actualAway){cls="correct";label="✅ Tam isabet! +3 puan";}
      else if((ph>pa)===(m.actualHome>m.actualAway)&&(ph===pa)===(m.actualHome===m.actualAway)){cls="partial";label="🟡 Doğru sonuç! +1 puan";}
      else{cls="wrong";label=`❌ Yanlış. Gerçek: ${m.actualHome}–${m.actualAway}`;}
    }
    return `<div class="match-card ${cls}">
      <div class="match-teams">
        <div class="match-team">${getTeamLogoHtml(m.home, "small")} <span>${m.home}</span></div>
        <div class="match-vs">VS</div>
        <div class="match-team"><span>${m.away}</span> ${getTeamLogoHtml(m.away, "small")}</div>
      </div>
      <div class="match-inputs">
        <input type="number" min="0" max="20" placeholder="0" id="pred_h_${i}" value="${sh}" ${submitted?"disabled":""}>
        <div class="match-sep">—</div>
        <input type="number" min="0" max="20" placeholder="0" id="pred_a_${i}" value="${sa}" ${submitted?"disabled":""}>
      </div>
      <div class="match-result-label">${label}</div>
    </div>`;
  }).join("");
  if(submitted){
    submitPredictions.disabled=true;
    submitPredictions.textContent="Tahminler gönderildi ✓";
    predictResult.hidden=false;
    predictResult.innerHTML=`<h3>🏆 Toplam Puanın: ${savedScore}</h3><p>Tebrikler! Yeni haftada tekrar dene.</p>`;
  }
}
submitPredictions.addEventListener("click",()=>{
  let total=0;
  matchFixtures.forEach((m,i)=>{
    const h=document.querySelector(`#pred_h_${i}`)?.value, a=document.querySelector(`#pred_a_${i}`)?.value;
    if(h===""||a==="") return;
    localStorage.setItem(`pred_h_${i}`,h); localStorage.setItem(`pred_a_${i}`,a);
    const ph=parseInt(h),pa=parseInt(a);
    if(ph===m.actualHome&&pa===m.actualAway) total+=3;
    else if((ph>pa)===(m.actualHome>m.actualAway)&&(ph===pa)===(m.actualHome===m.actualAway)) total+=1;
  });
  const prev=parseInt(localStorage.getItem("predict_total_score")||"0");
  localStorage.setItem("predict_total_score",prev+total);
  localStorage.setItem("predict_submitted","true");
  userTotalScore.textContent=prev+total;
  renderMatchPredictions();
});
resetPredictions.addEventListener("click",()=>{
  matchFixtures.forEach((_,i)=>{localStorage.removeItem(`pred_h_${i}`);localStorage.removeItem(`pred_a_${i}`);});
  localStorage.removeItem("predict_submitted");
  submitPredictions.disabled=false;
  submitPredictions.textContent="Tahminleri Gönder";
  predictResult.hidden=true;
  renderMatchPredictions();
});
