/* ============================================
   02HUB — iQIYI-style Video Player
   Quality Tiers: 480P/720P (free), 1080P (VIP), 4K (SVIP)
   CDN-agnostic — works with any video source URL
   ============================================ */

// ─── DOM References ───
const videoWrapper  = document.getElementById('videoWrapper');
const video         = document.getElementById('videoPlayer');
const playPauseBtn  = document.getElementById('playPauseBtn');
const bigPlayBtn    = document.getElementById('bigPlayBtn');
const progressFilled = document.getElementById('progressFilled');
const progressBuffer = document.getElementById('progressBuffer');
const progressThumb = document.getElementById('progressThumb');
const progressTooltip = document.getElementById('progressTooltip');
const timeDisplay   = document.getElementById('timeDisplay');
const muteBtn       = document.getElementById('muteBtn');
const volumeSlider  = document.getElementById('volumeSlider');
const skipIntroBtn  = document.getElementById('skipIntroBtn');
const watchPlayer   = document.getElementById('watchPlayer');
const qualityBtn    = document.getElementById('qualityBtn');
const qualityLabel  = document.getElementById('qualityLabel');
const qualityMenu   = document.getElementById('qualityMenu');
const qualityWrap   = document.getElementById('qualityWrap');
const epListBtn     = document.getElementById('epListBtn');
const iqEpPanel     = document.getElementById('iqEpPanel');
const epPanelClose  = document.getElementById('epPanelClose');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const iqControls    = document.getElementById('iqControls');

const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('anime_id');
let currentEpNum = parseInt(urlParams.get('ep')) || 1;
let allEpisodes = [];
let currentEpisode = null;
let animeData = null;
let progressSaveInterval = null;
let isPlaying = false;
let currentQuality = '720p';
let controlsTimeout = null;
let controlsVisible = true;

// ─── Quality Tier Definitions ───
const QUALITY_TIERS = {
    '4k':    { label: '4K',    minTier: 'svip', bitrate: 'highest' },
    '1080p': { label: '1080P', minTier: 'vip',  bitrate: 'high' },
    '720p':  { label: '720P',  minTier: 'free', bitrate: 'medium' },
    '480p':  { label: '480P',  minTier: 'free', bitrate: 'low' }
};

const TIER_RANK = { free: 0, vip: 1, svip: 2 };

function getUserMembership() {
    return currentUser?.membership || 'free';
}

function canAccessQuality(quality) {
    const tier = QUALITY_TIERS[quality];
    if (!tier) return false;
    return TIER_RANK[getUserMembership()] >= TIER_RANK[tier.minTier];
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
    if (!animeId) return;
    try {
        animeData = await api(`/api/anime/${animeId}`);
        document.getElementById('epAnimeTitle').textContent = animeData.title;
        document.getElementById('sidebarTitle').textContent = animeData.title;
        document.getElementById('panelTitle').textContent = animeData.title;
        document.title = `${animeData.title} — 02HUB`;

        renderMeta();

        const userId = currentUser ? currentUser.id : null;
        const epUrl = userId
            ? `/api/episodes/anime/${animeId}?user_id=${userId}`
            : `/api/episodes/anime/${animeId}`;
        allEpisodes = await api(epUrl);

        document.getElementById('sidebarCount').textContent = `${allEpisodes.length} ตอน`;

        loadEpisode(currentEpNum);
        renderEpGrid();
        renderPanelEpGrid();
        loadComments();
        initQualityMenu();
        initPlayerControls();

        if (currentUser) {
            document.getElementById('commentAvatar').src = currentUser.avatar || '';
        }
    } catch (err) {
        console.error('Player init error:', err);
    }
});

function renderMeta() {
    if (!animeData) return;
    const meta = document.getElementById('watchMeta');
    const genres = (animeData.genres || []).map(g => {
        const name = typeof g === 'string' ? g.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : g.name;
        return `<span class="watch-genre">${name}</span>`;
    }).join('');

    meta.innerHTML = `
        <span class="watch-rating">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg>
            ${animeData.rating || 'N/A'}
        </span>
        <span class="watch-year">${animeData.year || ''}</span>
        <span class="watch-studio">${animeData.studio || ''}</span>
        ${genres}
    `;

    const synEl = document.getElementById('watchSynopsis');
    if (animeData.synopsis) {
        synEl.innerHTML = `<p>${animeData.synopsis}</p>`;
    }
}

// ─── Load Episode ───
function loadEpisode(epNum) {
    currentEpNum = epNum;
    currentEpisode = allEpisodes.find(e => e.number === epNum);
    if (!currentEpisode) return;

    document.getElementById('epTitle').textContent = `ตอนที่ ${currentEpisode.number} — ${currentEpisode.title || ''}`;
    document.title = `ตอนที่ ${currentEpisode.number} — ${animeData?.title || '02HUB'}`;

    // Load video source
    if (currentEpisode.video_url) {
        const url = currentEpisode.video_url;
        
        // Use HLS.js if .m3u8, else native fallback
        if (window.hls) {
            window.hls.destroy();
            window.hls = null;
        }

        if (url.includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 600 });
            hls.loadSource(url);
            hls.attachMedia(video);
            window.hls = hls;
        } else {
            video.src = url;
            video.load();
        }
    }

    // Resume from progress
    if (currentEpisode.progress && currentEpisode.progress > 10) {
        video.addEventListener('loadedmetadata', function resumeOnce() {
            video.currentTime = currentEpisode.progress;
            video.removeEventListener('loadedmetadata', resumeOnce);
        });
    }

    // Reset play state
    isPlaying = false;
    bigPlayBtn.classList.remove('hidden');
    playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

    // Update URL
    const newUrl = `/watch.html?anime_id=${animeId}&ep=${epNum}`;
    window.history.replaceState(null, '', newUrl);

    // Update all episode grids
    document.querySelectorAll('.ep-num').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.ep) === epNum);
    });
    document.querySelectorAll('.iq-ep-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.ep) === epNum);
    });

    // Start progress save
    clearInterval(progressSaveInterval);
    progressSaveInterval = setInterval(saveProgress, 15000);

    loadComments();
}

// ─── Episode Grid (sidebar) ───
function renderEpGrid() {
    const grid = document.getElementById('epGrid');
    grid.innerHTML = allEpisodes.map(ep => `
        <button class="ep-num ${ep.number === currentEpNum ? 'active' : ''} ${ep.watched ? 'watched' : ''}"
                data-ep="${ep.number}"
                onclick="loadEpisode(${ep.number})"
                title="ตอนที่ ${ep.number} — ${ep.title || ''}">
            ${ep.number}
        </button>
    `).join('');
}

// ─── Episode Grid (in-player panel) ───
function renderPanelEpGrid() {
    const grid = document.getElementById('panelEpGrid');
    grid.innerHTML = allEpisodes.map(ep => `
        <button class="iq-ep-btn ${ep.number === currentEpNum ? 'active' : ''}"
                data-ep="${ep.number}"
                onclick="loadEpisode(${ep.number}); closeEpPanel();">
            ${ep.number}
        </button>
    `).join('');
}

// ─── Episode Panel Toggle ───
function toggleEpPanel() {
    iqEpPanel.classList.toggle('open');
}
function closeEpPanel() {
    iqEpPanel.classList.remove('open');
}

// ═══════════════════════════════════════════
//  PLAYER CONTROLS SETUP
// ═══════════════════════════════════════════
function initPlayerControls() {
    // ─── Big Play Button ───
    bigPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    // ─── Single click to play/pause ───
    videoWrapper.addEventListener('click', (e) => {
        if (e.target.closest('.iq-controls') ||
            e.target.closest('.iq-ep-panel') ||
            e.target.closest('.skip-intro-btn') ||
            e.target.closest('.big-play-btn')) return;
        togglePlay();
    });

    // ─── Double click for fullscreen ───
    let clickCount = 0;
    let clickTimer = null;
    videoWrapper.addEventListener('click', (e) => {
        if (e.target.closest('.iq-controls') ||
            e.target.closest('.iq-ep-panel') ||
            e.target.closest('.skip-intro-btn') ||
            e.target.closest('.big-play-btn')) return;

        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => { clickCount = 0; }, 300);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            clickCount = 0;
            toggleFullscreen();
        }
    });

    // ─── Controls auto-hide ───
    videoWrapper.addEventListener('mousemove', showControls);
    videoWrapper.addEventListener('mouseleave', () => {
        if (isPlaying) hideControlsDelayed();
    });

    // ─── Progress bar interaction ───
    const iqProgress = document.getElementById('iqProgress');
    iqProgress.addEventListener('click', seekVideo);
    iqProgress.addEventListener('mousemove', (e) => {
        const rect = iqProgress.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (video.duration) {
            progressTooltip.textContent = formatTime(pct * video.duration);
            progressTooltip.style.left = (pct * 100) + '%';
            progressTooltip.classList.add('visible');
        }
    });
    iqProgress.addEventListener('mouseleave', () => {
        progressTooltip.classList.remove('visible');
    });

    // ─── Play/Pause button ───
    playPauseBtn.addEventListener('click', togglePlay);

    // ─── Next episode button ───
    document.getElementById('nextEpBtn').addEventListener('click', () => skipEpisode(1));

    // ─── Mute button ───
    muteBtn.addEventListener('click', toggleMute);

    // ─── Volume slider ───
    volumeSlider.addEventListener('input', (e) => changeVolume(e.target.value));

    // ─── Episode panel ───
    epListBtn.addEventListener('click', toggleEpPanel);
    epPanelClose.addEventListener('click', closeEpPanel);

    // ─── Fullscreen button ───
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // ─── Skip intro ───
    skipIntroBtn.addEventListener('click', skipIntro);
}

// ─── Controls Show/Hide ───
function showControls() {
    clearTimeout(controlsTimeout);
    iqControls.classList.add('visible');
    videoWrapper.style.cursor = 'default';
    controlsVisible = true;
    if (isPlaying) hideControlsDelayed();
}

function hideControlsDelayed() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        iqControls.classList.remove('visible');
        videoWrapper.style.cursor = 'none';
        controlsVisible = false;
    }, 3000);
}

// ═══════════════════════════════════════════
//  QUALITY SELECTOR
// ═══════════════════════════════════════════
function initQualityMenu() {
    // Set initial quality based on membership
    const membership = getUserMembership();
    if (TIER_RANK[membership] >= TIER_RANK['svip']) {
        currentQuality = '1080p';
    } else if (TIER_RANK[membership] >= TIER_RANK['vip']) {
        currentQuality = '1080p';
    } else {
        currentQuality = '720p';
    }
    qualityLabel.textContent = QUALITY_TIERS[currentQuality].label;

    // Update quality option states
    updateQualityOptions();

    // Toggle dropdown
    qualityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        qualityWrap.classList.toggle('open');
    });

    // Quality option clicks
    qualityMenu.querySelectorAll('.iq-quality-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const quality = opt.dataset.quality;

            if (!canAccessQuality(quality)) {
                const tier = QUALITY_TIERS[quality];
                showToast(`${tier.label} ต้องการสมาชิก ${tier.minTier.toUpperCase()} กรุณาอัปเกรด`, 'error');
                return;
            }

            currentQuality = quality;
            qualityLabel.textContent = QUALITY_TIERS[quality].label;
            updateQualityOptions();
            qualityWrap.classList.remove('open');
            showToast(`เปลี่ยนคุณภาพเป็น ${QUALITY_TIERS[quality].label}`, 'success');

            // TODO: When CDN supports multi-quality, switch video source here
            // e.g. video.src = currentEpisode.video_url.replace('/720p/', `/${quality}/`);
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
        qualityWrap.classList.remove('open');
    });
}

function updateQualityOptions() {
    qualityMenu.querySelectorAll('.iq-quality-option').forEach(opt => {
        const q = opt.dataset.quality;
        opt.classList.toggle('active', q === currentQuality);
        opt.classList.toggle('locked', !canAccessQuality(q));
    });
}

// ═══════════════════════════════════════════
//  PLAYBACK CONTROLS
// ═══════════════════════════════════════════
function togglePlay() {
    if (video.paused) {
        video.play();
        isPlaying = true;
        playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        bigPlayBtn.classList.add('hidden');
        hideControlsDelayed();
    } else {
        video.pause();
        isPlaying = false;
        playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
        bigPlayBtn.classList.remove('hidden');
        showControls();
    }
}

video.addEventListener('timeupdate', () => {
    if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        progressFilled.style.width = pct + '%';
        progressThumb.style.left = pct + '%';
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;

        // Skip intro visibility
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
    playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
    bigPlayBtn.classList.remove('hidden');
    showControls();
    saveProgress(true);

    // Auto-play next with countdown overlay
    const nextEp = allEpisodes.find(e => e.number === currentEpNum + 1);
    if (nextEp) {
        showAutoplayOverlay(nextEp);
    }
});

let autoplayTimer = null;
function showAutoplayOverlay(nextEp) {
    // Remove existing overlay
    const existing = document.querySelector('.autoplay-overlay');
    if (existing) existing.remove();

    let countdown = 5;
    const overlay = document.createElement('div');
    overlay.className = 'autoplay-overlay';
    overlay.innerHTML = `
        <h3>ตอนถัดไป: ตอนที่ ${nextEp.number}</h3>
        <p style="color:var(--text-muted);">${nextEp.title || ''}</p>
        <div class="autoplay-countdown">
            <span id="autoplayCount">${countdown}</span>
            <svg viewBox="0 0 78 78"><circle cx="39" cy="39" r="36"/></svg>
        </div>
        <div class="autoplay-actions">
            <button class="btn btn-secondary" onclick="cancelAutoplay()">ยกเลิก</button>
            <button class="btn btn-primary" onclick="playNextNow(${nextEp.number})"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" style="display:inline;vertical-align:-3px;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> เล่นเลย</button>
        </div>
    `;
    videoWrapper.appendChild(overlay);

    autoplayTimer = setInterval(() => {
        countdown--;
        const countEl = document.getElementById('autoplayCount');
        if (countEl) countEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(autoplayTimer);
            playNextNow(nextEp.number);
        }
    }, 1000);
}

function cancelAutoplay() {
    clearInterval(autoplayTimer);
    const overlay = document.querySelector('.autoplay-overlay');
    if (overlay) overlay.remove();
}

function playNextNow(epNum) {
    clearInterval(autoplayTimer);
    const overlay = document.querySelector('.autoplay-overlay');
    if (overlay) overlay.remove();
    loadEpisode(epNum);
    renderPanelEpGrid();
    setTimeout(() => togglePlay(), 500);
}

function seekVideo(e) {
    const bar = document.getElementById('iqProgress');
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
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
        renderPanelEpGrid();
        if (isPlaying) setTimeout(() => togglePlay(), 500);
    } else {
        showToast(dir > 0 ? 'นี่คือตอนสุดท้ายแล้ว' : 'นี่คือตอนแรก', 'error');
    }
}

// ─── Volume ───
function toggleMute() {
    video.muted = !video.muted;
    updateMuteIcon();
    volumeSlider.value = video.muted ? 0 : video.volume;
}

function changeVolume(val) {
    video.volume = val;
    video.muted = val == 0;
    updateMuteIcon();
}

function updateMuteIcon() {
    if (video.muted || video.volume === 0) {
        muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    } else if (video.volume < 0.5) {
        muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>';
    } else {
        muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg>';
    }
}

// ─── Fullscreen (F11-style) ───
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        const target = watchPlayer;
        if (target.requestFullscreen) {
            target.requestFullscreen();
        } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
        }
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    fullscreenBtn.innerHTML = isFs
        ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>'
        : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';

    if (isFs) {
        document.body.classList.add('is-fullscreen');
    } else {
        document.body.classList.remove('is-fullscreen');
    }
});

// ─── Keyboard Shortcuts ───
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'ArrowLeft': e.preventDefault(); video.currentTime -= 10; showControls(); break;
        case 'ArrowRight': e.preventDefault(); video.currentTime += 10; showControls(); break;
        case 'ArrowUp': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break;
        case 'ArrowDown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break;
        case 'n': e.preventDefault(); skipEpisode(1); break;
        case 'p': e.preventDefault(); skipEpisode(-1); break;
        case 'Escape': closeEpPanel(); break;
    }
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

window.addEventListener('beforeunload', () => saveProgress());

// ─── Comments ───
async function loadComments() {
    if (!currentEpisode) return;
    const epId = currentEpisode.id;
    try {
        const comments = await api(`/api/comments/episode/${epId}`);
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
    const epId = currentEpisode.id;
    try {
        await api('/api/comments', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                episode_id: epId,
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

// ═══════════════════════════════════════════
//  SECURITY & ANTI-DOWNLOAD PROTECTIONS
// ═══════════════════════════════════════════

// 1. Disable Right-Click globally on player
document.addEventListener('contextmenu', e => {
    if (e.target.closest('.watch-main') || e.target.nodeName === 'VIDEO') {
        e.preventDefault();
        showToast('สงวนสิทธิ์การคัดลอก/ดาวน์โหลดวิดีโอ', 'error');
    }
});

// 2. Prevent Developer Tools Shortcuts
document.addEventListener('keydown', e => {
    // Block F12
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    // Block Ctrl+Shift+I / J / C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        return false;
    }
    // Block Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
});

// 3. Prevent PiP, native download controls, and drag-and-drop
if (video) {
    video.disablePictureInPicture = true;
    if (video.controlsList) {
        video.controlsList.add('nodownload');
        video.controlsList.add('noplaybackrate');
    }
    // Prevent dragging the video out to save
    video.addEventListener('dragstart', e => e.preventDefault());
}

// 4. Console Warning for inspecting users
console.log("%c[WARNING] 02HUB SECURITY: STOP!", "color:#ef4444; font-size:40px; font-weight:900; -webkit-text-stroke: 1px black;");
console.log("%cพฤติกรรมทั้งหมดของคุณถูกตรวจสอบโดยระบบ 02HUB Protection การพยายามดาวน์โหลดหรือขโมยวิดีโอละเมิดข้อตกลงการใช้งานและจะมีการแบน IP ของคุณ", "color:#facc15; font-size:16px; background:#1e1e1e; padding:15px; border-radius:8px; border:2px solid #ef4444;");

