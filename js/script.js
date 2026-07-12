const slate = document.getElementById('slate');
const clapboard = slate;
const clapTop = document.getElementById('clapTop');
const actionBtn = document.getElementById('actionBtn');
const promptEl = document.getElementById('prompt');
const secondsEl = document.getElementById('seconds');
const sizeEl = document.getElementById('size');
const modelEl = document.getElementById('model');
const sceneNoEl = document.getElementById('sceneNo');
const formError = document.getElementById('formError');
const reel = document.getElementById('reel');
const emptyState = document.getElementById('emptyState');

let sceneCount = 1;
const pollers = {};

function pad(n) { return String(n).padStart(2, '0'); }

slate.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const prompt = promptEl.value.trim();
  if (!prompt) {
    formError.textContent = 'Write the scene before calling action.';
    return;
  }

  // clapperboard "clap" animation
  clapboard.classList.add('clapping');
  setTimeout(() => clapboard.classList.remove('clapping'), 350);

  actionBtn.disabled = true;

  const sceneLabel = pad(sceneCount);
  const card = createCard(sceneLabel, prompt);
  reel.prepend(card);
  emptyState.classList.add('hidden');

  try {
    const res = await fetch('api/create_video.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        seconds: secondsEl.value,
        size: sizeEl.value,
        model: modelEl.value,
      }),
    });
    const data = await res.json();

    if (!data.ok) {
      setCardFailed(card, data.error || 'Could not start the generation.');
      actionBtn.disabled = false;
      return;
    }

    const video = data.video;
    card.dataset.videoId = video.id;
    updateCardStatus(card, video.status, video.progress || 0);
    pollStatus(video.id, card);
    sceneCount += 1;
    sceneNoEl.textContent = pad(sceneCount);
    promptEl.value = '';
  } catch (err) {
    setCardFailed(card, 'Network error — check your connection and try again.');
  } finally {
    actionBtn.disabled = false;
  }
});

function createCard(sceneLabel, prompt) {
  const div = document.createElement('div');
  div.className = 'frame';
  div.innerHTML = `
    <div class="sprockets">${'<span></span>'.repeat(6)}</div>
    <div class="frame-content">
      <div class="frame-top">
        <span class="frame-scene">SCENE ${sceneLabel} · TAKE 1</span>
        <span class="frame-status processing"><span class="dot"></span><span class="status-text">queued</span></span>
      </div>
      <p class="frame-prompt">${escapeHtml(prompt)}</p>
      <div class="frame-media loading">
        <span class="status-text">In the queue…</span>
        <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
      </div>
    </div>
    <div class="sprockets">${'<span></span>'.repeat(6)}</div>
  `;
  return div;
}

function updateCardStatus(card, status, progress) {
  const statusWrap = card.querySelector('.frame-status');
  const statusText = statusWrap.querySelector('.status-text');
  const media = card.querySelector('.frame-media');
  const mediaText = media.querySelector('.status-text');
  const fill = media.querySelector('.progress-fill');

  statusWrap.className = 'frame-status ' + (status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'processing');

  const labels = {
    queued: 'in the queue',
    in_progress: 'rolling',
    processing: 'rolling',
    completed: 'cut — ready',
    failed: "didn't make it",
  };
  statusText.textContent = labels[status] || status;

  if (status === 'completed') return; // media gets swapped for <video> elsewhere
  if (status === 'failed') {
    mediaText.textContent = "Scene didn't make it — try again.";
    return;
  }

  mediaText.textContent = status === 'queued' ? 'In the queue…' : `Rolling… ${progress || 0}%`;
  if (fill) fill.style.width = (progress || 0) + '%';
}

function setCardFailed(card, message) {
  updateCardStatus(card, 'failed', 0);
  const mediaText = card.querySelector('.frame-media .status-text');
  if (mediaText) mediaText.textContent = message;
}

function pollStatus(id, card) {
  if (pollers[id]) clearInterval(pollers[id]);

  pollers[id] = setInterval(async () => {
    try {
      const res = await fetch(`api/check_status.php?id=${encodeURIComponent(id)}`);
      const data = await res.json();

      if (!data.ok) {
        clearInterval(pollers[id]);
        setCardFailed(card, data.error || 'Lost track of this take.');
        return;
      }

      const video = data.video;
      updateCardStatus(card, video.status, video.progress || 0);

      if (video.status === 'completed') {
        clearInterval(pollers[id]);
        renderVideo(card, id);
      } else if (video.status === 'failed') {
        clearInterval(pollers[id]);
      }
    } catch (err) {
      // transient network hiccup — keep polling
    }
  }, 3000);
}

function renderVideo(card, id) {
  const media = card.querySelector('.frame-media');
  media.classList.remove('loading');
  media.innerHTML = `<video controls preload="metadata" src="api/get_video.php?id=${encodeURIComponent(id)}"></video>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
