export function initAmbientMusic() {
  const musicPlayer = document.querySelector("#musicPlayer");
  const bgAudio = document.querySelector("#bgAudio");
  const playBtn = document.querySelector("#musicPlayBtn");
  const trackBtn = document.querySelector("#musicTrackBtn");
  const titleText = document.querySelector("#musicTitle");
  const statusText = document.querySelector("#musicStatus");
  
  if (!musicPlayer || !bgAudio || !playBtn) return;
  
  const playlist = [
    { title: "Lig Teması", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "Atmosfer Müziği", url: "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample2.mp3" }
  ];
  let currentTrackIdx = 0;

  // Load the first track source into the element
  bgAudio.src = playlist[0].url;
  titleText.textContent = playlist[0].title;
  
  function togglePlay() {
    if (bgAudio.paused) {
      bgAudio.load();
      bgAudio.play()
        .then(() => {
          musicPlayer.classList.add("playing");
          playBtn.textContent = "⏸";
          statusText.textContent = "Oynatılıyor";
        })
        .catch(err => {
          console.warn("Audio play blocked:", err);
          statusText.textContent = "Tıkla & Oynat";
        });
    } else {
      bgAudio.pause();
      musicPlayer.classList.remove("playing");
      playBtn.textContent = "▶";
      statusText.textContent = "Duraklatıldı";
    }
  }
  
  function switchTrack() {
    currentTrackIdx = (currentTrackIdx + 1) % playlist.length;
    const track = playlist[currentTrackIdx];
    
    const wasPlaying = !bgAudio.paused;
    if (wasPlaying) bgAudio.pause();
    bgAudio.src = track.url;
    titleText.textContent = track.title;
    bgAudio.load();
    
    if (wasPlaying) {
      bgAudio.play()
        .then(() => {
          musicPlayer.classList.add("playing");
          playBtn.textContent = "⏸";
          statusText.textContent = "Oynatılıyor";
        })
        .catch(() => {
          musicPlayer.classList.remove("playing");
          playBtn.textContent = "▶";
          statusText.textContent = "Duraklatıldı";
        });
    } else {
      statusText.textContent = "Duraklatıldı";
    }
  }
  
  playBtn.addEventListener("click", togglePlay);
  trackBtn.addEventListener("click", switchTrack);
}