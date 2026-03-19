/* ============================================
   02HUB — Core Application JavaScript
   v2.0 — Enhanced Animations, CAPTCHA, Transitions
   ============================================ */

const API = '';

// ─── State ───
let currentUser = JSON.parse(localStorage.getItem('02HUB_user') || 'null');
let heroInterval = null;
let currentHeroSlide = 0;

// ─── API Helpers ───
async function api(endpoint, options = {}) {
    const res = await fetch(`${API}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
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
});

function initPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
        loadHomepage();
    }
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

    // Phase 1: curtains close
    requestAnimationFrame(() => {
        overlay.classList.add('entering');
        overlay.style.pointerEvents = 'all';
    });

    // Phase 2: navigate after curtains close
    setTimeout(() => {
        window.location.href = url;
    }, 650);
}

// Intercept all internal link clicks for page transitions
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');

    // Only intercept internal navigation
    if (href &&
        !href.startsWith('http') &&
        !href.startsWith('//') &&
        !href.startsWith('#') &&
        !href.startsWith('javascript:') &&
        !link.target) {

        // Skip transition for same page
        if (href === window.location.pathname) return;

        e.preventDefault();
        navigateWithTransition(href);
    }
});

// On page load, play exit animation if coming from transition
window.addEventListener('pageshow', () => {
    const overlay = document.querySelector('.page-transition');
    if (overlay) {
        overlay.classList.remove('entering');
        overlay.classList.add('leaving');
        setTimeout(() => overlay.remove(), 600);
    }
});

// ═══════════════════════════════════════════
//  SCROLL REVEAL (Intersection Observer)
// ═══════════════════════════════════════════
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.section, .slider-wrapper, .comments-section, .filter-group, .continue-card');

    // Add reveal class to sections
    revealElements.forEach(el => {
        if (!el.classList.contains('reveal') &&
            !el.classList.contains('reveal-left') &&
            !el.classList.contains('reveal-right')) {
            el.classList.add('reveal');
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');

                // Add stagger to child cards after reveal
                const slider = entry.target.querySelector('.slider');
                if (slider) slider.classList.add('stagger-children');

                const grid = entry.target.querySelector('.search-results-grid, .watchlist-grid, .episodes-grid');
                if (grid) grid.classList.add('stagger-children');

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));

    // Also observe dynamically added sections
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
//  CAPTCHA SYSTEM — Google reCAPTCHA v2
// ═══════════════════════════════════════════
// Note: Using reCAPTCHA test key for development (always passes)
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

function loadRecaptchaScript() {
    if (document.querySelector('script[src*="recaptcha"]')) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
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
        try {
            loginRecaptchaWidgetId = grecaptcha.render('loginRecaptcha', {
                sitekey: RECAPTCHA_SITE_KEY,
                theme: 'dark',
                callback: () => {},
            });
        } catch (e) { /* already rendered */ }
    }

    if (registerContainer && registerContainer.childElementCount === 0 && registerRecaptchaWidgetId === null) {
        try {
            registerRecaptchaWidgetId = grecaptcha.render('registerRecaptcha', {
                sitekey: RECAPTCHA_SITE_KEY,
                theme: 'dark',
                callback: () => {},
            });
        } catch (e) { /* already rendered */ }
    }
}

function validateRecaptcha(widgetId) {
    if (typeof grecaptcha === 'undefined') return true; // Fallback if script not loaded
    const response = grecaptcha.getResponse(widgetId);
    return response && response.length > 0;
}

function resetRecaptcha(widgetId) {
    if (typeof grecaptcha !== 'undefined' && widgetId !== null) {
        try { grecaptcha.reset(widgetId); } catch(e) {}
    }
}


// ═══════════════════════════════════════════
//  AUTH (with CAPTCHA)
// ═══════════════════════════════════════════
function updateNavUser() {
    const navUser = document.getElementById('navUser');
    if (!navUser) return;
    if (currentUser) {
        navUser.innerHTML = `
            <a href="/profile.html" class="avatar-link">
                <img src="${currentUser.avatar || '/images/default-avatar.png'}" alt="Avatar" class="avatar"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%231a1a2e%22 width=%2240%22 height=%2240%22/><text x=%2250%%22 y=%2255%%22 text-anchor=%22middle%22 fill=%22%23a855f7%22 font-size=%2218%22>${currentUser.username[0].toUpperCase()}</text></svg>'">
            </a>
            ${currentUser.role === 'admin' ? '<a href="/admin.html" class="btn btn-sm btn-secondary">Admin</a>' : ''}
            <button class="btn btn-sm btn-secondary" onclick="logout()">ออก</button>
        `;
    } else {
        navUser.innerHTML = '<button class="btn btn-primary btn-sm" onclick="showAuthModal()">เข้าสู่ระบบ</button>';
    }
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        modal.classList.remove('closing');
        // Render reCAPTCHA widgets after a short delay
        setTimeout(() => renderRecaptchaWidgets(), 500);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.classList.remove('active', 'closing');
        }, 300);
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

    // Refresh reCAPTCHA for the active tab
    setTimeout(() => renderRecaptchaWidgets(), 300);
}

async function handleLogin(e) {
    e.preventDefault();

    // Validate reCAPTCHA
    if (!validateRecaptcha(loginRecaptchaWidgetId)) {
        showToast('กรุณายืนยัน reCAPTCHA', 'error');
        return;
    }

    const form = new FormData(e.target);
    try {
        const user = await api('/api/users/login', {
            method: 'POST',
            body: JSON.stringify({ username: form.get('username'), password: form.get('password') })
        });
        currentUser = user;
        localStorage.setItem('02HUB_user', JSON.stringify(user));
        closeAuthModal();
        updateNavUser();
        showToast('เข้าสู่ระบบสำเร็จ!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
        resetRecaptcha(loginRecaptchaWidgetId);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    // Validate reCAPTCHA
    if (!validateRecaptcha(registerRecaptchaWidgetId)) {
        showToast('กรุณายืนยัน reCAPTCHA', 'error');
        return;
    }

    const form = new FormData(e.target);
    try {
        const user = await api('/api/users/register', {
            method: 'POST',
            body: JSON.stringify({
                username: form.get('username'),
                email: form.get('email'),
                password: form.get('password')
            })
        });
        currentUser = user;
        localStorage.setItem('02HUB_user', JSON.stringify(user));
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
    localStorage.removeItem('02HUB_user');
    updateNavUser();
    showToast('ออกจากระบบแล้ว');
    if (window.location.pathname.includes('profile') || window.location.pathname.includes('admin')) {
        navigateWithTransition('/');
    }
}

// ─── Toast Notification (enhanced) ───
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

        // Trigger scroll reveal for newly added content
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
                    ${anime.status === 'airing' ? '<svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;"><circle cx="12" cy="12" r="6" fill="#ef4444"/></svg> กำลังฉาย' : anime.status === 'upcoming' ? '<svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#0ea5e9"/><path d="M12 7v5l3 3" stroke="white" stroke-width="2" fill="none"/></svg> เร็วๆ นี้' : '<svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" fill="none"/></svg> จบแล้ว'}
                </div>
                <h1 class="hero-title">${anime.title}</h1>
                <div class="hero-meta">
                    <span class="rating"><svg class="icon-sm" viewBox="0 0 24 24" width="14" height="14" style="display:inline;vertical-align:middle;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg> ${anime.rating}</span>
                    <span class="dot"></span>
                    <span>${anime.year}</span>
                    <span class="dot"></span>
                    <span>${anime.studio}</span>
                    <span class="dot"></span>
                    <span>${anime.total_episodes} ตอน</span>
                </div>
                <p class="hero-synopsis">${anime.synopsis || ''}</p>
                <div class="hero-actions">
                    <a href="/anime.html?id=${anime.id}" class="btn btn-primary">
                        ▶ ดูเลย
                    </a>
                    <button class="btn btn-secondary" onclick="addToWatchlist('${anime.id}')">
                        + รายการของฉัน
                    </button>
                </div>
            </div>
        `;
        hero.insertBefore(slide, dots);
    });

    // Dots
    slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToHeroSlide(i);
        dots.appendChild(dot);
    });

    // Auto-rotate
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

// ─── Anime Card Renderer ───
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => navigateWithTransition(`/anime.html?id=${anime.id}`);

    const badgeClass = anime.status === 'airing' ? 'badge-airing' :
                       anime.status === 'completed' ? 'badge-completed' : 'badge-upcoming';
    const badgeText = anime.status === 'airing' ? 'กำลังฉาย' :
                      anime.status === 'completed' ? 'จบแล้ว' : 'เร็วๆ นี้';

    card.innerHTML = `
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        ${anime.cover_image
            ? `<img class="poster" src="${anime.cover_image}" alt="${anime.title}" loading="lazy"
                    onerror="this.outerHTML='<div class=\\'poster-placeholder\\'><svg viewBox=\'0 0 24 24\' width=\'32\' height=\'32\'><rect x=\'2\' y=\'3\' width=\'20\' height=\'18\' rx=\'3\' stroke=\'%239d9dba\' stroke-width=\'2\' fill=\'none\'/><polygon points=\'10 8 16 12 10 16\' fill=\'%239d9dba\'/></svg></div>'">`
            : `<div class="poster-placeholder"><svg viewBox="0 0 24 24" width="32" height="32"><rect x="2" y="3" width="20" height="18" rx="3" stroke="var(--text-muted)" stroke-width="2" fill="none"/><polygon points="10 8 16 12 10 16" fill="var(--text-muted)"/></svg></div>`}
        <div class="card-overlay">
            <div class="play-btn">▶</div>
        </div>
        <div class="card-info">
            <h3 class="card-title">${anime.title}</h3>
            <div class="card-meta">
                <span class="card-rating"><svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg> ${anime.rating}</span>
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
    // Add stagger animation
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
        if (!q) {
            searchResults.classList.remove('active');
            return;
        }
        searchTimeout = setTimeout(async () => {
            try {
                const results = await api(`/api/anime/search?q=${encodeURIComponent(q)}`);
                if (results.length > 0) {
                    searchResults.innerHTML = results.slice(0, 8).map(a => `
                        <div class="search-result-item" onclick="navigateWithTransition('/anime.html?id=${a.id}')">
                            <img src="${a.cover_image}" alt="${a.title}"
                                 onerror="this.style.background='var(--bg-tertiary)'">
                            <div class="info">
                                <h4>${a.title}</h4>
                                <span><svg class="icon-sm" viewBox="0 0 24 24" width="12" height="12" style="display:inline;vertical-align:middle;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="#facc15"/></svg> ${a.rating} · ${a.year} · ${a.studio || ''}</span>
                            </div>
                        </div>
                    `).join('');
                    searchResults.classList.add('active');
                } else {
                    searchResults.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center;">ไม่พบผลลัพธ์</div>';
                    searchResults.classList.add('active');
                }
            } catch (err) {
                console.error('Search error:', err);
            }
        }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (q) navigateWithTransition(`/search.html?q=${encodeURIComponent(q)}`);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search')) {
            searchResults.classList.remove('active');
        }
    });
}

// ─── Watchlist ───
async function addToWatchlist(animeId, status = 'want') {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    try {
        await api(`/api/users/${currentUser.id}/watchlist`, {
            method: 'POST',
            body: JSON.stringify({ anime_id: animeId, status })
        });
        showToast('เพิ่มในรายการแล้ว!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ─── Mobile Nav ───
function toggleMobileNav() {
    const links = document.getElementById('navLinks');
    if (links) {
        links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
        links.style.position = 'absolute';
        links.style.top = 'var(--navbar-height)';
        links.style.left = '0';
        links.style.right = '0';
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
