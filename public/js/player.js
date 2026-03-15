/* ============================================
   02HUB — Video Player Logic
   ============================================ */

const video = document.getElementById('videoPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const bigPlayBtn = document.getElementById('bigPlayBtn');
const progressFilled = document.getElementById('progressFilled');
const progressBuffer = document.getElementById('progressBuffer');
const timeDisplay = document.getElementById('timeDisplay');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const skipIntroBtn = document.getElementById('skipIntroBtn');
const playerContainer = document.getElementById('playerContainer');
const videoWrapper = document.getElementById('videoWrapper');

const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('anime_id');
let currentEpNum = parseInt(urlParams.get('ep')) || 1;
let allEpisodes = [];
let currentEpisode = null;
let progressSaveInterval = null;
let isPlaying = false;

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
    if (!animeId) return;
    try {
        const anime = await api(`/api/anime/${animeId}`);
        document.getElementById('epAnimeTitle').textContent = anime.title;
        document.title = `${anime.title} — 02HUB`;

        const userId = currentUser ? currentUser.id : 0;
        allEpisodes = await api(`/api/episodes/anime/${animeId}?user_id=${userId}`);
        loadEpisode(currentEpNum);
        renderEpSelector();
        loadComments();

        if (currentUser) {
            document.getElementById('commentAvatar').src = currentUser.avatar || '';
        }
    } catch (err) {
        console.error('Player init error:', err);
    }
});

function loadEpisode(epNum) {
    currentEpNum = epNum;
    currentEpisode = allEpisodes.find(e => e.number === epNum);
    if (!currentEpisode) return;

    document.getElementById('epTitle').textContent = `ตอนที่ ${currentEpisode.number} — ${currentEpisode.title || ''}`;
    document.title = `ตอนที่ ${currentEpisode.number} — 02HUB`;

    if (currentEpisode.video_url) {
        video.src = currentEpisode.video_url;
        video.load();
    }

    // Resume from progress
    if (currentEpisode.progress && currentEpisode.progress > 10) {
        video.currentTime = currentEpisode.progress;
    }

    // Update URL without reload
    const newUrl = `/watch.html?anime_id=${animeId}&ep=${epNum}`;
    window.history.replaceState(null, '', newUrl);

    // Update selector
    document.querySelectorAll('.ep-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.ep) === epNum);
    });

    // Start progress save
    clearInterval(progressSaveInterval);
    progressSaveInterval = setInterval(saveProgress, 15000);

    loadComments();
}

function renderEpSelector() {
    const container = document.getElementById('epSelector');
    container.innerHTML = allEpisodes.map(ep => `
        <button class="btn btn-sm ep-btn ${ep.number === currentEpNum ? 'btn-primary' : 'btn-secondary'}"
                data-ep="${ep.number}"
                onclick="loadEpisode(${ep.number})"
                style="min-width:50px;">
            ${ep.number}
        </button>
    `).join('');
}

// ─── Playback Controls ───
function togglePlay() {
    if (video.paused) {
        video.play();
        isPlaying = true;
        playPauseBtn.textContent = '⏸';
        bigPlayBtn.style.display = 'none';
    } else {
        video.pause();
        isPlaying = false;
        playPauseBtn.textContent = '▶';
        bigPlayBtn.style.display = 'flex';
    }
}

video.addEventListener('timeupdate', () => {
    if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        progressFilled.style.width = pct + '%';
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;

        // Skip intro button (show between 0-90 seconds)
        if (video.currentTime >= 5 && video.currentTime <= 90) {
            skipIntroBtn.classList.add('visible');
        } else {
            skipIntroBtn.classList.remove('visible');
        }
    }
});

video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration) {
        const buffered = video.buffered.end(video.buffered.length - 1);
        progressBuffer.style.width = (buffered / video.duration * 100) + '%';
    }
});

video.addEventListener('ended', () => {
    isPlaying = false;
    playPauseBtn.textContent = '▶';
    bigPlayBtn.style.display = 'flex';
    saveProgress(true);

    // Auto-play next episode
    const nextEp = allEpisodes.find(e => e.number === currentEpNum + 1);
    if (nextEp) {
        showToast(`กำลังเล่นตอนที่ ${nextEp.number} ต่อ...`);
        setTimeout(() => {
            loadEpisode(nextEp.number);
            setTimeout(() => togglePlay(), 500);
        }, 2000);
    }
});

function seekVideo(e) {
    const bar = document.getElementById('progressBar');
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
}

function skipIntro() {
    video.currentTime = 90;
    skipIntroBtn.classList.remove('visible');
}

function skipEpisode(dir) {
    const nextNum = currentEpNum + dir;
    const nextEp = allEpisodes.find(e => e.number === nextNum);
    if (nextEp) {
        saveProgress();
        loadEpisode(nextNum);
        if (isPlaying) setTimeout(() => togglePlay(), 500);
    } else {
        showToast(dir > 0 ? 'นี่คือตอนสุดท้ายแล้ว' : 'นี่คือตอนแรก', 'error');
    }
}

// ─── Volume ───
function toggleMute() {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? '🔇' : '🔊';
    volumeSlider.value = video.muted ? 0 : video.volume;
}

function changeVolume(val) {
    video.volume = val;
    video.muted = val == 0;
    muteBtn.textContent = val == 0 ? '🔇' : val < 0.5 ? '🔉' : '🔊';
}

// ─── Fullscreen & Theater ───
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        videoWrapper.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreenBtn');
    btn.textContent = document.fullscreenElement ? '⛶' : '⛶';
    playerContainer.classList.toggle('fullscreen', !!document.fullscreenElement);
});

function toggleTheater() {
    playerContainer.classList.toggle('theater');
    if (playerContainer.classList.contains('theater')) {
        playerContainer.style.maxWidth = '100%';
        videoWrapper.style.aspectRatio = '21/9';
    } else {
        playerContainer.style.maxWidth = '';
        videoWrapper.style.aspectRatio = '16/9';
    }
}

// ─── Settings Menus ───
function toggleSubMenu(menuId) {
    document.querySelectorAll('.settings-menu').forEach(m => {
        if (m.id !== menuId) m.classList.remove('active');
    });
    document.getElementById(menuId).classList.toggle('active');
}

function setQuality(q, el) {
    document.querySelectorAll(`#qualityMenu .menu-item`).forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('qualityMenu').classList.remove('active');
    showToast(`เปลี่ยนความละเอียดเป็น ${q}`);
}

function setSub(sub, el) {
    document.querySelectorAll(`#subMenu .menu-item`).forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('subMenu').classList.remove('active');
    const labels = { 'th-sub': 'ซับไทย', 'th-dub': 'พากย์ไทย', 'none': 'ปิดซับ' };
    showToast(labels[sub] || sub);
}

// ─── Keyboard Shortcuts ───
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'ArrowLeft': e.preventDefault(); video.currentTime -= 10; break;
        case 'ArrowRight': e.preventDefault(); video.currentTime += 10; break;
        case 'ArrowUp': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volumeSlider.value = video.volume; break;
        case 'ArrowDown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeSlider.value = video.volume; break;
        case 'n': e.preventDefault(); skipEpisode(1); break;
        case 'p': e.preventDefault(); skipEpisode(-1); break;
    }
});

// Click on video to play/pause
videoWrapper.addEventListener('click', (e) => {
    if (e.target.closest('.video-controls') || e.target.closest('.settings-menu') || e.target.closest('.skip-intro-btn')) return;
    togglePlay();
});

// ─── Progress Save ───
async function saveProgress(completed = false) {
    if (!currentUser || !currentEpisode) return;
    try {
        await api(`/api/users/${currentUser.id}/history`, {
            method: 'POST',
            body: JSON.stringify({
                episode_id: currentEpisode.id,
                progress_seconds: Math.floor(video.currentTime),
                completed: completed || (video.duration > 0 && video.currentTime / video.duration > 0.9) ? 1 : 0
            })
        });
    } catch (err) {
        console.error('Save progress error:', err);
    }
}

// Save on page leave
window.addEventListener('beforeunload', () => saveProgress());

// ─── Comments ───
async function loadComments() {
    if (!currentEpisode) return;
    try {
        const comments = await api(`/api/comments/episode/${currentEpisode.id}`);
        const list = document.getElementById('commentsList');
        if (!comments.length) {
            list.innerHTML = '<p style="padding:20px 0;color:var(--text-muted);text-align:center;">ยังไม่มีความคิดเห็น — เป็นคนแรกที่แสดงความเห็น!</p>';
            return;
        }
        list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <img class="avatar" src="${c.avatar || ''}" alt="${c.username}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%231a1a2e%22 width=%2240%22 height=%2240%22/><text x=%2250%%22 y=%2255%%22 text-anchor=%22middle%22 fill=%22%23a855f7%22 font-size=%2218%22>${c.username[0].toUpperCase()}</text></svg>'">
                <div class="comment-content">
                    <span class="comment-author">${c.username}<span class="comment-time">${timeAgo(c.created_at)}</span></span>
                    <p class="comment-text">${escapeHtml(c.content)}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Load comments error:', err);
    }
}

async function postComment() {
    if (!currentUser) { showAuthModal(); return; }
    const textarea = document.getElementById('commentText');
    const content = textarea.value.trim();
    if (!content) return;
    try {
        await api('/api/comments', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                episode_id: currentEpisode.id,
                content
            })
        });
        textarea.value = '';
        loadComments();
        showToast('แสดงความคิดเห็นสำเร็จ!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ─── Utility ───
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
