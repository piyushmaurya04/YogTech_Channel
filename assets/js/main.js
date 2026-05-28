/* =====================================================
   YogTech — Main Script
   Handles: theme toggle, navbar, video fetch/render,
            scroll reveal, video detail page, smooth UX.
   ===================================================== */

// ---------- Theme ----------
(function initTheme() {
  const stored = localStorage.getItem('yt_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('yt_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const knob = document.querySelector('.theme-toggle .knob');
  if (!knob) return;
  knob.innerHTML = theme === 'dark'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
}

// ---------- Nav (hamburger + active link) ----------
function initNav() {
  const burger = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('active');
      links.classList.remove('open');
    }));
  }

  // Active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const target = href.split('/').pop();
    if (target === path || (path === '' && target === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ---------- Scroll Reveal ----------
function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!('IntersectionObserver' in window) || els.length === 0) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  els.forEach(el => io.observe(el));
}

// ---------- Videos ----------
const VIDEOS_KEY = 'yt_videos_cache';
const SELECTED_KEY = 'yt_selected_video';

async function loadVideos() {
  // Try multiple paths depending on page depth
  const paths = ['../data/videos.json', 'data/videos.json', '/data/videos.json'];
  for (const p of paths) {
    try {
      const r = await fetch(p);
      if (r.ok) {
        const data = await r.json();
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (_) { /* try next */ }
  }
  // Fallback to cache
  const cached = localStorage.getItem(VIDEOS_KEY);
  return cached ? JSON.parse(cached) : [];
}

function videoCard(v) {
  const desc = (v.description || '').replace(/\n/g, ' ').slice(0, 110);
  return `
    <article class="video-card" onclick="openVideo('${v.id}')">
      <div class="video-thumb-wrap">
        <img src="${v.thumbnail}" alt="${escapeAttr(v.title)}" loading="lazy">
      </div>
      <div class="video-info">
        <h3 class="video-title">${escapeHTML(v.title)}</h3>
        <span class="video-date">📅 ${v.published || ''}</span>
        <p class="video-desc">${escapeHTML(desc)}${desc.length >= 110 ? '…' : ''}</p>
        <span class="video-cta">View Details</span>
      </div>
    </article>
  `;
}

function renderVideos(containerId, videos, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!videos || videos.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <p>📹 No videos available yet.</p>
        <p style="font-size:.9rem; margin-top:.5rem;">Check back soon for new content.</p>
      </div>`;
    return;
  }
  const list = limit ? videos.slice(0, limit) : videos;
  container.innerHTML = list.map(videoCard).join('');
  // Stagger reveal
  container.querySelectorAll('.video-card').forEach((c, i) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
      c.style.transition = `opacity .6s var(--ease-out) ${i * 60}ms, transform .6s var(--ease-out) ${i * 60}ms`;
      c.style.opacity = '1';
      c.style.transform = 'translateY(0)';
    });
  });
}

window.openVideo = function(id) {
  localStorage.setItem(SELECTED_KEY, id);
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? 'video-detail.html' : 'pages/video-detail.html';
};

function renderVideoDetail(videos) {
  const wrap = document.getElementById('video-detail-container');
  if (!wrap) return;
  const id = localStorage.getItem(SELECTED_KEY);
  const v = videos.find(x => x.id === id) || videos[0];
  if (!v) {
    wrap.innerHTML = `<div class="loading-state">Video not found. <a href="videos.html" style="color:var(--accent)">Browse all videos</a></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="video-player">
      <iframe src="https://www.youtube.com/embed/${v.id}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div class="video-detail-body">
      <h1>${escapeHTML(v.title)}</h1>
      <div class="video-meta">
        <span>📅 ${v.published || ''}</span>
        <span>🎬 YogTech</span>
      </div>
      <div class="desc">
        <h3>Description</h3>
        <p>${escapeHTML(v.description || '')}</p>
      </div>
      <div class="video-actions">
        <a href="${v.url}" target="_blank" rel="noopener" class="btn btn-primary">🎥 Watch on YouTube</a>
        <button class="btn btn-secondary" onclick="history.back()">← Go Back</button>
      </div>
      <div class="share-box">
        <h3>Share This Video</h3>
        <div class="share-btns">
          <a class="share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(v.url)}&text=${encodeURIComponent(v.title)}">Twitter</a>
          <a class="share-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(v.url)}">Facebook</a>
          <a class="share-btn" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(v.url)}">LinkedIn</a>
          <button class="share-btn" onclick="copyText('${v.url}', this)">Copy Link</button>
        </div>
      </div>
    </div>
  `;
}

window.copyText = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const t = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => (btn.textContent = t), 1800);
    }
  });
};

// ---------- Helpers ----------
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHTML(s).replace(/\n/g, ' '); }

window.comingSoon = function() { alert('Coming Soon 🚀 Stay tuned!'); };
window.scrollToLatestVideos = function() {
  const s = document.getElementById('latest-videos-section');
  if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  // Theme toggle wiring
  updateThemeIcon(document.documentElement.getAttribute('data-theme'));
  const tt = document.querySelector('.theme-toggle');
  if (tt) tt.addEventListener('click', toggleTheme);

  initNav();
  initReveal();

  const hasLatest = document.getElementById('latest-videos-container');
  const hasAll = document.getElementById('all-videos-container');
  const hasDetail = document.getElementById('video-detail-container');

  if (hasLatest || hasAll || hasDetail) {
    const videos = await loadVideos();
    if (hasLatest) renderVideos('latest-videos-container', videos, 6);
    if (hasAll) renderVideos('all-videos-container', videos);
    if (hasDetail) renderVideoDetail(videos);
  }
});

// Smooth anchor scroll
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = id && document.getElementById(id);
  if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
});
