// API configuration
const API_KEY = 'pub_96940c2f42d34d3bacdeb269ac1ae50d'; // Your NewsData.io key
const BASE_URL = 'https://newsdata.io/api/1/latest';

// DOM elements
const newsContainer = document.getElementById('news-container');
const searchForm = document.querySelector('#search-section form');
const searchInput = document.getElementById('search-input');
const loading = document.getElementById('loading');
const prevPageBtn = document.querySelector('.pagination #prev-page');
const nextPageBtn = document.querySelector('.pagination #next-page');
const pageInfo = document.querySelector('.pagination #page-info');
const themeToggle = document.getElementById('theme-toggle');
const languageSelect = document.getElementById('language-select');
const styleToggle = document.getElementById('style-toggle');
const themeStylesheet = document.getElementById('theme-stylesheet');

// Application state
let currentPage = 1;
let currentQuery = '';
let currentLang = 'en';
let currentCategory = 'top'; // Default to 'top' for general headlines
let totalPages = 1;
let pageTokens = [null]; // Token stack, starting with null for page 1
let currentIndex = 0;

// Map body IDs to NewsData.io categories
function detectCategory() {
  const bodyId = document.body.id;
  console.log('Detected body ID:', bodyId);
  const categoryMap = {
    'home-page': 'top',
    'breaking-page': 'top', // Use 'top' for breaking news
    'sports-page': 'sports',
    'technology-page': 'technology',
    'world-page': 'world'
  };
  return categoryMap[bodyId] || 'top';
}

// Initialize page and event listeners
document.addEventListener('DOMContentLoaded', () => {
  currentCategory = detectCategory();
  console.log('Initial category:', currentCategory);

  // Set initial theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }

  // Mobile menu toggle (add if needed: <button id="menu-toggle">☰</button>)
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Language selection with fallback
  const supportedLanguages = ['en', 'fr', 'de', 'el', 'it', 'es', 'pt', 'ru', 'zh', 'ja', 'ar'];
  if (languageSelect) {
    console.log('Language select initialized:', languageSelect);
    languageSelect.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      console.log('Language changed to:', selectedLang);
      currentLang = supportedLanguages.includes(selectedLang) ? selectedLang : 'en';
      resetPagination();
      fetchNews();
    });
  } else {
    console.error('Language select element not found');
  }

  fetchNews();
});

// Reset pagination state (for language or category change)
function resetPagination() {
  currentPage = 1;
  currentIndex = 0;
  pageTokens = [null];
  totalPages = 1;
}

// Toggle theme
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

// Switch between professional and fun themes
let currentTheme = 'professional';
styleToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'professional' ? 'fun' : 'professional';
  const isSubPage = window.location.pathname.includes('/breaking/') ||
    window.location.pathname.includes('/sports/') ||
    window.location.pathname.includes('/technology/') ||
    window.location.pathname.includes('/world/');
  const pathPrefix = isSubPage ? '../' : '';
  themeStylesheet.href = `${pathPrefix}${currentTheme}.css`;
  console.log('New stylesheet URL:', themeStylesheet.href);
  styleToggle.textContent = currentTheme === 'professional' ? '🎨 Fun Theme' : '💼 Professional Theme';
});

// Fetch news from NewsData.io
async function fetchNews() {
  loading.style.display = 'block';
  newsContainer.innerHTML = '';

  let url = `${BASE_URL}?category=${currentCategory}&language=${currentLang}&apikey=${API_KEY}`;
  if (currentQuery || document.body.id === 'breaking-page') {
    url = `${BASE_URL}?q=${encodeURIComponent(currentQuery || 'breaking')}&language=${currentLang}&apikey=${API_KEY}`;
  }
  const currentToken = pageTokens[currentIndex];
  if (currentToken) {
    url += `&page=${currentToken}`;
  }
  console.log('Fetch URL:', url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.results && data.results.length > 0) {
      data.results.forEach(article => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
          <img src="${article.image_url || 'https://via.placeholder.com/400x200'}" alt="news image" class="news-image">
          <h2 class="news-title"><a href="${article.link}" target="_blank">${article.title}</a></h2>
          <p class="news-summary">${article.description || 'No description available.'}</p>
        `;
        newsContainer.appendChild(card);
      });
      totalPages = Math.ceil((data.totalResults || 100) / 10) || 1;
      if (data.nextPage && currentIndex + 1 === pageTokens.length) {
        pageTokens.push(data.nextPage);
      }
      updatePagination();
    } else {
      newsContainer.innerHTML = `<p>No articles found for ${currentCategory} in ${currentLang}.</p>`;
      totalPages = 1;
      currentPage = 1;
      updatePagination();
    }
  } catch (err) {
    console.error('Error fetching news:', err);
    newsContainer.innerHTML = `<p>Error loading news: ${err.message}</p>`;
    totalPages = 1;
    currentPage = 1;
    updatePagination();
  } finally {
    loading.style.display = 'none';
  }
}

// Update pagination display
function updatePagination() {
  if (pageInfo) pageInfo.textContent = `Page ${currentIndex + 1} of ${totalPages}`;
  if (prevPageBtn) prevPageBtn.disabled = currentIndex === 0;
  if (nextPageBtn) nextPageBtn.disabled = currentIndex + 1 >= totalPages || !pageTokens[currentIndex + 1];
}

// Handle search submission
if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    if (currentQuery) {
      resetPagination();
      fetchNews();
    } else {
      newsContainer.innerHTML = '<p>Please enter a search term.</p>';
      if (loading) loading.style.display = 'none';
      totalPages = 1;
      currentPage = 1;
      updatePagination();
    }
  });
}

// Pagination navigation
prevPageBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    fetchNews();
  }
});

nextPageBtn.addEventListener('click', () => {
  if (currentIndex + 1 < pageTokens.length) {
    currentIndex++;
    fetchNews();
  }
});

// YouTube player with scroll control
let player;
let lastScrollY = window.scrollY;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    events: {
      onReady: onPlayerReady
    }
  });
}

function onPlayerReady(event) {
  window.addEventListener('scroll', () => {
    const newScrollY = window.scrollY;
    if (!player) return;

    if (newScrollY > lastScrollY) {
      player.pauseVideo();
    } else if (newScrollY < lastScrollY) {
      player.playVideo();
    }
    lastScrollY = newScrollY;
  });
}