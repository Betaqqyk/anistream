/* ============================================
   02HUB — Core Application JavaScript
   v3.0 — JWT Auth, Notifications, Theme Toggle,
          Skeletons, PWA, Rating System
   ============================================ */

const API = '';

// ─── State ───
let currentUser = JSON.parse(localStorage.getItem('02HUB_user') || 'null');
let authToken = localStorage.getItem('02HUB_token') || null;
let heroInterval = null;
let currentHeroSlide = 0;

async function api(endpoint, options = {}) {
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`${API}${endpoint}`, { headers, ...options });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

// ─── Navbar scroll effect ───
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    updateNavUser();
    initPage();
    initScrollReveal();
    initRippleEffect();
    initParticles();
    initTheme();
    if (currentUser) loadUnreadCount();
});

function initPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') loadHomepage();
}

// ═══════════════════════════════════════════
//  PAGE TRANSITION SYSTEM
// ═══════════════════════════════════════════
function createTransitionOverlay() {
    if (document.querySelector('.page-transition')) return;
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.innerHTML = `
        <div class="curtain-left"></div>
        <div class="curtain-right"></div>
        <span class="transition-logo">02HUB</span>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function navigateWithTransition(url) {
    if (url === window.location.pathname || url === window.location.href) return;
    const overlay = createTransitionOverlay();
    requestAnimationFrame(() => {
        overlay.classList.add('entering');
        overlay.style.pointerEvents = 'all';
    });
    setTimeout(() => { window.location.href = url; }, 650);
}

document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('//') &&
        !href.startsWith('#') && !href.startsWith('javascript:') && !link.target) {
        if (href === window.location.pathname) return;
        e.preventDefault();
        navigateWithTransition(href);
    }
});

window.addEventListener('pageshow', () => {
    const overlay = document.querySelector('.page-transition');
    if (overlay) {
        overlay.classList.remove('entering');
        overlay.classList.add('leaving');
        setTimeout(() => overlay.remove(), 600);
    }
});

// ═══════════════════════════════════════════
//  THEME TOGGLE (Dark/Light)
// ═══════════════════════════════════════════
function initTheme() {
    const saved = localStorage.getItem('02HUB_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('02HUB_theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = theme === 'dark'
        ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
}

// ═══════════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════════
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.section, .slider-wrapper, .comments-section, .filter-group, .continue-card');
    revealElements.forEach(el => {
        if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
            el.classList.add('reveal');
        }
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                const slider = entry.target.querySelector('.slider');
                if (slider) slider.classList.add('stagger-children');
                const grid = entry.target.querySelector('.search-results-grid, .watchlist-grid, .episodes-grid');
                if (grid) grid.classList.add('stagger-children');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => observer.observe(el));

    const mutationObs = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.classList && (node.classList.contains('section') || node.classList.contains('reveal'))) {
                        observer.observe(node);
                    }
                    node.querySelectorAll?.('.section, .reveal')?.forEach(el => observer.observe(el));
                }
            });
        });
    });
    mutationObs.observe(document.body, { childList: true, subtree: true });
}

// ═══════════════════════════════════════════
//  BUTTON RIPPLE EFFECT
// ═══════════════════════════════════════════
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

// ═══════════════════════════════════════════
//  FLOATING PARTICLES
// ═══════════════════════════════════════════
function initParticles() {
    if (document.querySelector('.particles-bg')) return;
    const container = document.createElement('div');
    container.className = 'particles-bg';
    const colors = ['#00d4ff', '#0ea5e9', '#06b6d4', '#ec4899'];
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (15 + Math.random() * 20) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.width = (2 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(particle);
    }
    document.body.appendChild(container);
}

// ═══════════════════════════════════════════
//  LOADING SKELETONS
// ═══════════════════════════════════════════
function showSkeleton(containerId, count = 6, type = 'card') {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    if (type === 'card') {
        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton-card"><div class="skeleton-poster skeleton-pulse"></div><div class="skeleton-info"><div class="skeleton-title skeleton-pulse"></div><div class="skeleton-meta skeleton-pulse"></div></div></div>`;
        }
    } else if (type === 'episode') {
        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton-episode"><div class="skeleton-thumb skeleton-pulse"></div><div class="skeleton-ep-info"><div class="skeleton-title skeleton-pulse"></div><div class="skeleton-meta skeleton-pulse"></div></div></div>`;
        }
    }
    container.innerHTML = html;
}

// ═══════════════════════════════════════════
//  CAPTCHA SYSTEM
// ═══════════════════════════════════════════
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

function loadRecaptchaScript() {
    if (document.querySelector('script[src*="recaptcha"]')) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true; script.defer = true;
    document.head.appendChild(script);
}
loadRecaptchaScript();

let loginRecaptchaWidgetId = null;
let registerRecaptchaWidgetId = null;

function renderRecaptchaWidgets() {
    if (typeof grecaptcha === 'undefined' || !grecaptcha.render) return;
    const loginContainer = document.getElementById('loginRecaptcha');
    const registerContainer = document.getElementById('registerRecaptcha');
    if (loginContainer && loginContainer.childElementCount === 0 && loginRecaptchaWidgetId === null) {
        try { loginRecaptchaWidgetId = grecaptcha.render('loginRecaptcha', { sitekey: RECAPTCHA_SITE_KEY, theme: 'dark', callback: () => {} }); } catch (e) {}
    }
    if (registerContainer && registerContainer.childElementCount === 0 && registerRecaptchaWidgetId === null) {
        try { registerRecaptchaWidgetId = grecaptcha.render('registerRecaptcha', { sitekey: RECAPTCHA_SITE_KEY, theme: 'dark', callback: () => {} }); } catch (e) {}
    }
}

function validateRecaptcha(widgetId) {
    if (typeof grecaptcha === 'undefined') return true;
    const response = grecaptcha.getResponse(widgetId);
    return response && response.length > 0;
}

function resetRecaptcha(widgetId) {
    if (typeof grecaptcha !== 'undefined' && widgetId !== null) {
        try { grecaptcha.reset(widgetId); } catch(e) {}
    }
}

// ═══════════════════════════════════════════
//  AUTH (with JWT + CAPTCHA)
// ═══════════════════════════════════════════
function updateNavUser() {
    const navUser = document.getElementById('navUser');
    if (!navUser) return;
    if (currentUser) {
        navUser.innerHTML = `
            <button class="iq-btn theme-toggle-btn" id="themeToggle" onclick="toggleTheme()" title="สลับธีม"></button>
            <div class="notif-wrap" id="notifWrap">
                <button class="iq-btn notif-bell" onclick="toggleNotifications()" title="แจ้งเตือน">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    <span class="notif-badge" id="notifBadge" style="display:none;">0</span>
                </button>
                <div class="notif-dropdown" id="notifDropdown">
                    <div class="notif-header"><h4>แจ้งเตือน</h4><button onclick="markAllRead()">อ่านทั้งหมด</button></div>
                    <div class="notif-list" id="notifList"><p class="notif-empty">ไม่มีการแจ้งเตือน</p></div>
                </div>
            </div>
            <a href="/profile.html" class="avatar-link">
                <img src="${currentUser.avatar || '/images/default-avatar.png'}" alt="Avatar" class="avatar"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%231a1a2e%22 width=%2240%22 height=%2240%22/><text x=%2250%%22 y=%2255%%22 text-anchor=%22middle%22 fill=%22%23a855f7%22 font-size=%2218%22>${currentUser.username[0].toUpperCase()}</text></svg>'">
            </a>
            ${currentUser.role === 'admin' ? '<a href="/admin.html" class="btn btn-sm btn-secondary">Admin</a>' : ''}
            <button class="btn btn-sm btn-secondary" onclick="logout()">ออก</button>
        `;
        updateThemeIcon(localStorage.getItem('02HUB_theme') || 'dark');
    } else {
        navUser.innerHTML = `
            <button class="iq-btn theme-toggle-btn" id="themeToggle" onclick="toggleTheme()" title="สลับธีม"></button>
            <button class="btn btn-primary btn-sm" onclick="showAuthModal()">เข้าสู่ระบบ</button>
        `;
        updateThemeIcon(localStorage.getItem('02HUB_theme') || 'dark');
    }
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        modal.classList.remove('closing');
        setTimeout(() => renderRecaptchaWidgets(), 500);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => modal.classList.remove('active', 'closing'), 300);
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
    });
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
    if (registerForm) registerForm.style.display = tab === 'register' ? 'block' : 'none';
    setTimeout(() => renderRecaptchaWidgets(), 300);
}

async function handleLogin(e) {
    e.preventDefault();
    if (!validateRecaptcha(loginRecaptchaWidgetId)) {
        showToast('กรุณายืนยัน reCAPTCHA', 'error');
        return;
    }
    const form = new FormData(e.target);
    try {
        const data = await api('/api/users/login', {
            method: 'POST',
            body: JSON.stringify({ username: form.get('username'), password: form.get('password') })
        });
        authToken = data.token;
        const { token, ...user } = data;
        currentUser = user;
        localStorage.setItem('02HUB_user', JSON.stringify(user));
        localStorage.setItem('02HUB_token', token);
        closeAuthModal();
        updateNavUser();
        showToast('เข้าสู่ระบบสำเร็จ!', 'success');
        loadUnreadCount();
    } catch (err) {
        showToast(err.message, 'error');
        resetRecaptcha(loginRecaptchaWidgetId);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    if (!validateRecaptcha(registerRecaptchaWidgetId)) {
        showToast('กรุณายืนยัน reCAPTCHA', 'error');
        return;
    }
    const form = new FormData(e.target);
    try {
        const data = await api('/api/users/register', {
            method: 'POST',
            body: JSON.stringify({
                username: form.get('username'),
                email: form.get('email'),
                password: form.get('password')
            })
        });
        authToken = data.token;
        const { token, ...user } = data;
        currentUser = user;
        localStorage.setItem('02HUB_user', JSON.stringify(user));
        localStorage.setItem('02HUB_token', token);
        closeAuthModal();
        updateNavUser();
        showToast('สมัครสมาชิกสำเร็จ!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
        resetRecaptcha(registerRecaptchaWidgetId);
    }
}

function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('02HUB_user');
    localStorage.removeItem('02HUB_token');
    updateNavUser();
    showToast('ออกจากระบบแล้ว');
    if (window.location.pathname.includes('profile') || window.location.pathname.includes('admin')) {
        navigateWithTransition('/');
    }
}

// ═══════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════
async function loadUnreadCount() {
    if (!currentUser) return;
    try {
        const { count } = await api(`/api/users/${currentUser.id}/notifications/unread-count`);
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    } catch {}
}

async function toggleNotifications() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('active');
    dropdown.classList.toggle('active');
    if (!isOpen && currentUser) {
        try {
            const notifications = await api(`/api/users/${currentUser.id}/notifications`);
            const list = document.getElementById('notifList');
            if (notifications.length === 0) {
                list.innerHTML = '<p class="notif-empty">ไม่มีการแจ้งเตือน</p>';
            } else {
                list.innerHTML = notifications.slice(0, 20).map(n => `
                    <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="${n.link ? `navigateWithTransition('${n.link}')` : ''}">
                        <div class="notif-icon">${n.type === 'new_episode' ? '<svg class="icon-sm" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>' : n.type === 'reply' ? '<svg class="icon-sm" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' : '<svg class="icon-sm" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'}</div>
                        <div class="notif-content">
                            <div class="notif-title">${n.title}</div>
                            <div class="notif-msg">${n.message}</div>
                            <div class="notif-time">${timeAgo(n.created_at)}</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch {}
    }
}

async function markAllRead() {
    if (!currentUser) return;
    try {
        await api(`/api/users/${currentUser.id}/notifications/read-all`, { method: 'PUT' });
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
        showToast('อ่านแจ้งเตือนทั้งหมดแล้ว');
    } catch {}
}

// Close notifications when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrap')) {
        document.getElementById('notifDropdown')?.classList.remove('active');
    }
});

// ─── Toast Notification ───
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) {
        existing.classList.add('toast-exit');
        setTimeout(() => existing.remove(), 400);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-enter';
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; padding: 14px 24px;
        border-radius: 12px; font-size: 14px; font-weight: 500; z-index: 9999;
        background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)'}; 
        color: white;
        box-shadow: 0 8px 30px ${type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'};
        backdrop-filter: blur(10px);
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ─── Homepage ───
async function loadHomepage() {
    // Show skeletons
    showSkeleton('airingSlider', 6);
    showSkeleton('topSlider', 6);
    showSkeleton('latestSlider', 6);
    showSkeleton('ratedSlider', 6);

    try {
        const [featured, airing, topRated, latest] = await Promise.all([
            api('/api/anime/featured'),
            api('/api/anime/airing'),
            api('/api/anime/top-rated'),
            api('/api/anime/latest')
        ]);
        renderHero(featured);
        renderSlider('airingSlider', airing);
        renderSlider('topSlider', topRated);
        renderSlider('latestSlider', latest);
        renderSlider('ratedSlider', topRated);
        setTimeout(() => initScrollReveal(), 100);
    } catch (err) {
        console.error('Failed to load homepage:', err);
    }
}

// ─── Hero Banner ───
function renderHero(animeList) {
    const hero = document.getElementById('heroBanner');
    const dots = document.getElementById('heroDots');
    if (!hero || !animeList.length) return;
    const slides = animeList.slice(0, 5);
    slides.forEach((anime, i) => {
        const slide = document.createElement('div');
        slide.className = `hero-slide ${i === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <img class="hero-bg" src="${anime.cover_image}" alt="${anime.title}"
                 onerror="this.style.background='linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-badge">
                    ${anime.status === 'airing' ? '<svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;"><circle cx="12" cy="12" r="6" fill="#ef4444"/></svg> กำลังฉาย' : anime.status === 'upcoming' ? '<svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#eab308" stroke-width="2" style="display:inline;vertical-align:middle;margin-top:-2px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> เร็วๆ นี้' : '<svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#22c55e" stroke-width="3" style="display:inline;vertical-align:middle;margin-top:-2px;"><polyline points="20 6 9 17 4 12"></polyline></svg> จบแล้ว'}
                </div>
                <h1 class="hero-title">${anime.title}</h1>
                <div class="hero-meta">
                    <span class="rating"><svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;margin-top:-2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg> ${anime.rating}</span>
                    <span class="dot"></span><span>${anime.year}</span>
                    <span class="dot"></span><span>${anime.studio}</span>
                    <span class="dot"></span><span>${anime.total_episodes} ตอน</span>
                </div>
                <p class="hero-synopsis">${anime.synopsis || ''}</p>
                <div class="hero-actions">
                    <a href="/anime.html?id=${anime.id}" class="btn btn-primary"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-top:-2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ดูเลย</a>
                    <button class="btn btn-secondary" onclick="addToWatchlist('${anime.id}')">+ รายการของฉัน</button>
                </div>
            </div>
        `;
        hero.insertBefore(slide, dots);
    });
    slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToHeroSlide(i);
        dots.appendChild(dot);
    });
    heroInterval = setInterval(() => {
        goToHeroSlide((currentHeroSlide + 1) % slides.length);
    }, 6000);
}

function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dots .dot');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if (slides[index]) slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentHeroSlide = index;
}

// ─── Anime Card ───
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => navigateWithTransition(`/anime.html?id=${anime.id}`);
    const badgeClass = anime.status === 'airing' ? 'badge-airing' : anime.status === 'completed' ? 'badge-completed' : 'badge-upcoming';
    const badgeText = anime.status === 'airing' ? 'กำลังฉาย' : anime.status === 'completed' ? 'จบแล้ว' : 'เร็วๆ นี้';
    card.innerHTML = `
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        ${anime.cover_image
            ? `<img class="poster" src="${anime.cover_image}" alt="${anime.title}" loading="lazy"
                    onerror="this.outerHTML='<div class=\\'poster-placeholder\\'><svg viewBox=\\'0 0 24 24\\' width=\\'32\\' height=\\'32\\'><rect x=\\'2\\' y=\\'3\\' width=\\'20\\' height=\\'18\\' rx=\\'3\\' stroke=\\'%239d9dba\\' stroke-width=\\'2\\' fill=\\'none\\'/><polygon points=\\'10 8 16 12 10 16\\' fill=\\'%239d9dba\\'/></svg></div>'">`
            : `<div class="poster-placeholder"><svg viewBox="0 0 24 24" width="32" height="32"><rect x="2" y="3" width="20" height="18" rx="3" stroke="var(--text-muted)" stroke-width="2" fill="none"/><polygon points="10 8 16 12 10 16" fill="var(--text-muted)"/></svg></div>`}
        <div class="card-overlay"><div class="play-btn"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" style="margin-left:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div></div>
        <div class="card-info">
            <h3 class="card-title">${anime.title}</h3>
            <div class="card-meta">
                <span class="card-rating"><svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;margin-top:-2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg> ${anime.rating}</span>
                <span>${anime.year || ''}</span>
                <span>${anime.studio || ''}</span>
            </div>
        </div>
    `;
    return card;
}

function renderSlider(containerId, animeList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    animeList.forEach(anime => container.appendChild(createAnimeCard(anime)));
    container.classList.add('stagger-children');
}

// ─── Slider Scroll ───
function slideScroll(sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const scrollAmount = slider.clientWidth * 0.75;
    slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// ─── Live Search ───
let searchTimeout;
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const q = e.target.value.trim();
        if (!q) { searchResults.classList.remove('active'); return; }
        searchTimeout = setTimeout(async () => {
            try {
                const results = await api(`/api/anime/search?q=${encodeURIComponent(q)}`);
                if (results.length > 0) {
                    searchResults.innerHTML = results.slice(0, 8).map(a => `
                        <div class="search-result-item" onclick="navigateWithTransition('/anime.html?id=${a.id}')">
                            <img src="${a.cover_image}" alt="${a.title}" onerror="this.style.background='var(--bg-tertiary)'">
                            <div class="info"><h4>${a.title}</h4><span><svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;margin-top:-2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg> ${a.rating} · ${a.year} · ${a.studio || ''}</span></div>
                        </div>
                    `).join('');
                    searchResults.classList.add('active');
                } else {
                    searchResults.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center;">ไม่พบผลลัพธ์</div>';
                    searchResults.classList.add('active');
                }
            } catch (err) { console.error('Search error:', err); }
        }, 300);
    });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (q) navigateWithTransition(`/search.html?q=${encodeURIComponent(q)}`);
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search')) searchResults.classList.remove('active');
    });
}

// ─── Watchlist ───
async function addToWatchlist(animeId, status = 'want') {
    if (!currentUser) { showAuthModal(); return; }
    try {
        await api(`/api/users/${currentUser.id}/watchlist`, {
            method: 'POST',
            body: JSON.stringify({ anime_id: animeId, status })
        });
        showToast('เพิ่มในรายการแล้ว!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
}

// ─── Rating Widget ───
function createRatingWidget(animeId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <div class="rating-widget" id="ratingWidget">
            <div class="rating-stars" id="ratingStars"></div>
            <span class="rating-info" id="ratingInfo">กำลังโหลด...</span>
        </div>
    `;
    loadRatingData(animeId);
}

async function loadRatingData(animeId) {
    try {
        const userId = currentUser ? currentUser.id : '';
        const data = await api(`/api/anime/${animeId}/ratings?user_id=${userId}`);
        renderStars(animeId, data.average, data.count, data.userScore);
    } catch {}
}

function renderStars(animeId, average, count, userScore) {
    const starsEl = document.getElementById('ratingStars');
    const infoEl = document.getElementById('ratingInfo');
    if (!starsEl) return;

    let html = '';
    for (let i = 1; i <= 10; i++) {
        const filled = userScore ? i <= userScore : i <= Math.round(average);
        html += `<span class="star ${filled ? 'filled' : ''}" data-score="${i}" onclick="rateAnime('${animeId}', ${i})" onmouseover="previewStars(${i})" onmouseout="resetStars()">★</span>`;
    }
    starsEl.innerHTML = html;
    infoEl.textContent = `${average || 0}/10 (${count} คะแนน)${userScore ? ` · คุณให้ ${userScore}` : ''}`;
}

function previewStars(score) {
    document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('preview', parseInt(s.dataset.score) <= score);
    });
}

function resetStars() {
    document.querySelectorAll('.star').forEach(s => s.classList.remove('preview'));
}

async function rateAnime(animeId, score) {
    if (!currentUser) { showAuthModal(); return; }
    try {
        const data = await api(`/api/anime/${animeId}/rate`, {
            method: 'POST',
            body: JSON.stringify({ score })
        });
        renderStars(animeId, data.average, 0, data.userScore);
        showToast(`ให้คะแนน ${score}/10 แล้ว!`, 'success');
    } catch (err) { showToast(err.message, 'error'); }
}

// ─── Mobile Nav ───
function toggleMobileNav() {
    const links = document.getElementById('navLinks');
    if (links) {
        links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
        links.style.position = 'absolute';
        links.style.top = 'var(--navbar-height)';
        links.style.left = '0'; links.style.right = '0';
        links.style.background = 'var(--bg-secondary)';
        links.style.flexDirection = 'column';
        links.style.padding = 'var(--space-md)';
        links.style.borderBottom = '1px solid var(--border-color)';
    }
}

// ─── Utility ───
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} วันที่แล้ว`;
    return `${Math.floor(days / 30)} เดือนที่แล้ว`;
}

// ═══════════════════════════════════════════
//  PWA — Service Worker Registration
// ═══════════════════════════════════════════
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
