// API key
const API_KEY = '234b819cfb481db6fb290020fa2d9cf0';
const BASE_URL = 'https://gnews.io/api/v4';

// Elements
const newsContainer = document.getElementById('news-container');
const searchForm = document.querySelector('#search-section form');
const searchInput = document.getElementById('search-input');
const loading = document.getElementById('loading');
const prevPageBtn = document.querySelector('.pagination #prev-page');
const nextPageBtn = document.querySelector('.pagination #next-page');
const pageInfo = document.querySelector('.pagination #page-info');
const themeToggle = document.getElementById('theme-toggle');

// State
let currentPage = 1;
let currentQuery = ''; // Tracks search query
let currentLang = 'en'; // Default language
let currentCategory = 'general'; // Default category
let totalPages = 1; // Updated based on totalArticles

// Detect category from body id
function detectCategory() {
  const bodyId = document.body.id;
  console.log('Detected body id:', bodyId); // Debug category
  switch (bodyId) {
    case 'home-page': return 'general';
    case 'breaking-page': return 'general'; // Use search for breaking
    case 'sports-page': return 'sports';
    case 'technology-page': return 'technology';
    case 'world-page': return 'world';
    default: return 'general';
  }
}

// Load saved theme and initialize language select on page load
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
  console.log('Initial category:', currentCategory); // Debug initial state

  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
  // Initialize language select
  const languageSelect = document.getElementById('language-select');
  console.log('Language Select initialized:', languageSelect); // Debug initialization
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      console.log('Language changed to:', e.target.value); // Debug change
      currentLang = e.target.value;
      currentPage = 1;
      fetchNews(currentPage);
    });
  } else {
    console.error('Language select element not found');
  }

  fetchNews(currentPage); // Load news based on category
});

// Theme toggle with persistence
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

// Theme switch logic
const styleToggle = document.getElementById('style-toggle');
const themeStylesheet = document.getElementById('theme-stylesheet');

let currentTheme = 'professional'; // Default

styleToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'professional' ? 'fun' : 'professional';
  const isSubPage = window.location.pathname.includes('/breaking/') ||
    window.location.pathname.includes('/sports/') ||
    window.location.pathname.includes('/technology/') ||
    window.location.pathname.includes('/world/');
  const pathPrefix = isSubPage ? '../' : '';
  themeStylesheet.href = `${pathPrefix}${currentTheme}.css`;
  console.log('New stylesheet URL:', themeStylesheet.href); // Debug log
  styleToggle.textContent = currentTheme === 'professional' ? '🎨 Fun Theme' : '💼 Professional Theme';
});

// Fetch news
async function fetchNews(page = 1) {
  loading.style.display = 'block';
  newsContainer.innerHTML = '';

  let url;
  if (currentQuery && currentCategory === 'general' && document.body.id === 'breaking-page') {
    url = `${BASE_URL}/search?q=${encodeURIComponent(currentQuery || 'breaking')}&lang=${currentLang}&page=${page}&apikey=${API_KEY}`;
  } else if (currentQuery) {
    url = `${BASE_URL}/search?q=${encodeURIComponent(currentQuery)}&category=${currentCategory}&lang=${currentLang}&page=${page}&apikey=${API_KEY}`;
  } else if (currentCategory === 'general' && document.body.id === 'breaking-page') {
    url = `${BASE_URL}/search?q=breaking&lang=${currentLang}&page=${page}&apikey=${API_KEY}`;
  } else {
    url = `${BASE_URL}/top-headlines?category=${currentCategory}&lang=${currentLang}&page=${page}&apikey=${API_KEY}`;
  }
  console.log('Fetch URL:', url); // Debug URL

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2)); // Debug response

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
      totalPages = Math.ceil((data.totalResults || 100) / 10) || 1; // Assuming 10 per page
      currentPage = page;
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

// Update pagination
function updatePagination() {
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

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

let player;
let lastScrollY = window.scrollY;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    events: {
      onReady: onPlayerReady
    }
  });
}

function onPlayerReady(event) {
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
}