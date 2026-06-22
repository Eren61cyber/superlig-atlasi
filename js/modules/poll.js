import { polls } from '../data/polls.js';
import * as DOM from './dom.js';

export function renderPoll() {
  const poll=polls[0], voted=localStorage.getItem(poll.id);
  const counts=JSON.parse(localStorage.getItem(poll.id+"_counts")||"null")||Object.fromEntries(poll.candidates.map(c=>[c.name,0]));
  pollBadge.textContent = voted ? "Oy verildi ✓" : "Oy ver";
  const total=Object.values(counts).reduce((s,v)=>s+v,0);
  pollOptions.innerHTML = poll.candidates.map(c=>{
    const pct=total>0?Math.round((counts[c.name]/total)*100):0;
    return `<button class="poll-option ${voted?(voted===c.name?"voted":""):""}"
      data-candidate="${c.name}" type="button" ${voted?"disabled":""}>
      <div class="poll-bar" style="width:${voted?pct:0}%"></div>
      <div class="poll-name">${c.name}</div>
      <div class="poll-team">${c.team}</div>
      <div class="poll-pct ${voted?"visible":""}">%${pct}</div>
    </button>`;
  }).join("");
  pollNote.textContent = voted?`Toplam ${total} oy kullanıldı.`:"Oyunuzu kullanın, sonuçları görün.";
  if (!voted) {
    pollOptions.addEventListener("click",e=>{
      const b=e.target.closest(".poll-option"); if(!b) return;
      counts[b.dataset.candidate]=(counts[b.dataset.candidate]||0)+1;
      localStorage.setItem(poll.id,b.dataset.candidate);
      localStorage.setItem(poll.id+"_counts",JSON.stringify(counts));
      renderPoll();
    },{once:true});
  }
}
