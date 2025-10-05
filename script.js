// Config
const CONFIG = {
  API_KEY: 'd4982bb50c4d6a93468a411589c5b354',
  BASE_URL: 'https://gnews.io/api/v4',
};

// Elements
const newsContainer = document.getElementById('news-container');
const searchForm = document.querySelector('#search-section form');
const searchInput = document.getElementById('search-input');
const loading = document.getElementById('loading');
const prevPageBtn = document.querySelector('.pagination #prev-page');
const nextPageBtn = document.querySelector('.pagination #next-page');
const pageInfo = document.querySelector('.pagination #page-info');
const themeToggle = document.getElementById('theme-toggle');
const styleToggle = document.getElementById('style-toggle');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

// State
let currentPage = 1;
let currentQuery = '';
let currentLang = 'en';
let currentCategory = 'general';
let totalPages = 1;
let lastScrollY = window.scrollY;
let player;

// Utility Functions
function detectCategory() {
  const bodyId = document.body.id;
  console.log('Detected body id:', bodyId);
  switch (bodyId) {
    case 'home-page': return 'general';
    case 'breaking-page': return 'general';
    case 'sports-page': return 'sports';
    case 'technology-page': return 'technology';
    case 'world-page': return 'world';
    default: return 'general';
  }
}

function updatePagination() {
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

// YouTube Player Functions
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    events: {
      onReady: onPlayerReady,
    }
  });
}

function onPlayerReady(event) {
  player.playVideo();
  window.addEventListener("scroll", function () {
    let newScrollY = window.scrollY;
    if (!player) return;
    if (newScrollY > lastScrollY) {
      player.pauseVideo();
    } else if (newScrollY < lastScrollY) {
      player.playVideo();
    }
    lastScrollY = newScrollY;
  });
  addVideoControls();
}

function addVideoControls() {
  const videoSection = document.getElementById('video-section');
  if (!videoSection || !player) return;

  const controls = document.createElement('div');
  controls.style = 'text-align: center; margin-top: 10px;';
  controls.innerHTML = `
    <button id="play-btn">Play</button>
    <button id="pause-btn">Pause</button>
  `;
  videoSection.appendChild(controls);

  document.getElementById('play-btn').addEventListener('click', () => player.playVideo());
  document.getElementById('pause-btn').addEventListener('click', () => player.pauseVideo());
}

// Fetch News with Retry Logic
async function fetchNews(page = 1, retries = 2) {
  loading.style.display = 'block';
  newsContainer.innerHTML = '';

  let url;
  if (currentQuery && currentCategory === 'general' && document.body.id === 'breaking-page') {
    url = `${CONFIG.BASE_URL}/search?q=${encodeURIComponent(currentQuery || 'breaking')}&lang=${currentLang}&page=${page}&apikey=${CONFIG.API_KEY}`;
  } else if (currentQuery) {
    url = `${CONFIG.BASE_URL}/search?q=${encodeURIComponent(currentQuery)}&category=${currentCategory}&lang=${currentLang}&page=${page}&apikey=${CONFIG.API_KEY}`;
  } else if (currentCategory === 'general' && document.body.id === 'breaking-page') {
    url = `${CONFIG.BASE_URL}/search?q=breaking&lang=${currentLang}&page=${page}&apikey=${CONFIG.API_KEY}`;
  } else {
    url = `${CONFIG.BASE_URL}/top-headlines?category=${currentCategory}&lang=${currentLang}&page=${page}&apikey=${CONFIG.API_KEY}`;
  }
  console.log('Fetch URL:', url);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (data.articles && data.articles.length > 0) {
        data.articles.forEach(article => {
          const card = document.createElement('div');
          card.className = 'news-card';
          card.innerHTML = `
            <img src="${article.image || 'https://via.placeholder.com/400x200'}" alt="news image" class="news-image">
            <h2 class="news-title"><a href="${article.url}" target="_blank">${article.title}</a></h2>
            <p class="news-summary">${article.description || 'No description available.'}</p>
          `;
          newsContainer.appendChild(card);
        });
        totalPages = Math.ceil((data.totalResults || 100) / 10) || 1;
        currentPage = page;
        updatePagination();
      } else {
        newsContainer.innerHTML = `<p>No articles found for ${currentCategory} in ${currentLang}.</p>`;
        totalPages = 1;
        currentPage = 1;
        updatePagination();
      }
      break; // Exit loop on success
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);
      if (attempt === retries) {
        newsContainer.innerHTML = `<p>Error loading news: ${err.message}. Retries exhausted.</p>`;
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      }
    }
  }
  loading.style.display = 'none';
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  currentCategory = detectCategory();
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }
  console.log('Initial category:', currentCategory);

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      console.log('Language changed to:', e.target.value);
      currentLang = e.target.value;
      currentPage = 1;
      fetchNews(currentPage);
    });
  } else {
    console.error('Language select element not found');
  }

  const themeStylesheet = document.getElementById('theme-stylesheet');
  let currentTheme = 'professional';
  const isSubPage = window.location.pathname.includes('/breaking/') ||
                    window.location.pathname.includes('/sports/') ||
                    window.location.pathname.includes('/technology/') ||
                    window.location.pathname.includes('/world/');
  const pathPrefix = isSubPage ? '../' : '';

  styleToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'professional' ? 'fun' : 'professional';
    themeStylesheet.href = `${pathPrefix}${currentTheme}.css`;
    console.log('New stylesheet URL:', themeStylesheet.href);
    styleToggle.textContent = currentTheme === 'professional' ? '🎨 Fun Theme' : '💼 Professional Theme';

    const iframe = document.getElementById('player');
    if (iframe) {
      if (currentTheme === 'fun') {
        iframe.style.borderRadius = '25px';
        iframe.style.boxShadow = '0 8px 25px rgba(255,107,107,0.4)';
      } else {
        iframe.style.borderRadius = '10px';
        iframe.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      }
    }
  });

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  fetchNews(currentPage);
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
});

// Search Functionality
if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    if (currentQuery) {
      currentPage = 1;
      fetchNews(currentPage);
    } else {
      newsContainer.innerHTML = '<p>Please enter a search term.</p>';
      if (loading) loading.style.display = 'none';
      totalPages = 1;
      currentPage = 1;
      updatePagination();
    }
  });
}

// Pagination
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchNews(currentPage);
  }
});

nextPageBtn.addEventListener('click', () => {
  currentPage++;
  fetchNews(currentPage);
});