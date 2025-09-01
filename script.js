// Your GNews API key
const API_KEY = '234b819cfb481db6fb290020fa2d9cf0';
const BASE_URL = 'https://gnews.io/api/v4';

// Elements
const newsContainer = document.getElementById('news-container');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const loading = document.getElementById('loading');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// State
let currentPage = 1;
let currentQuery = ''; // Tracks search query (empty for headlines)
let totalPages = 1; // Updated based on totalArticles

// Function to fetch and display news
async function fetchNews(query = '', page = 1, pageSize = 4) {
  if (loading) {
    loading.textContent = query ? `Searching for "${query}"...` : 'Loading news...';
    loading.style.display = 'block';
  }
  newsContainer.innerHTML = ''; // Clear existing cards

  let url;
  if (query) {
    url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}&max=${pageSize}&lang=en&sortby=relevance&page=${page}`;
    console.log('Search URL:', url); // Debug
  } else {
    url = `${BASE_URL}/search?q=news&country=us&token=${API_KEY}&max=${pageSize}&lang=en&sortby=publishedAt&page=${page}`;
    console.log('Headlines URL:', url); // Debug
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2)); // Debug

    if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
      console.log('Rendering articles:', data.articles.length); // Debug
      data.articles.forEach(article => {
        const card = createNewsCard(article);
        newsContainer.appendChild(card);
      });

      // Update pagination
      totalPages = Math.ceil(data.totalArticles / pageSize) || 1;
      currentPage = page;
      currentQuery = query;
      updatePagination();
    } else {
      console.log('No articles found. Response details:', {
        status: data.status,
        totalArticles: data.totalArticles,
        articles: data.articles
      }); // Debug
      const message = data.status === 'error' 
        ? `API Error: ${data.message || 'Unknown error'} (Check rate limit: 100 requests/day)`
        : `No news found for "${query || 'news'}". Try broader terms like "technology" or "world".`;
      newsContainer.innerHTML = `<p>${message}</p>`;
      // Reset pagination
      totalPages = 1;
      currentPage = 1;
      updatePagination();
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    newsContainer.innerHTML = '<p>Error loading news. Please check your internet connection or try again later.</p>';
    // Reset pagination
    totalPages = 1;
    currentPage = 1;
    updatePagination();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// Function to create a news card element
function createNewsCard(article) {
  const articleElement = document.createElement('article');
  articleElement.className = 'news-card';

  const imgUrl = article.image || 'https://picsum.photos/400/200';
  const title = article.title || 'Untitled';
  const summary = article.description || 'No summary available.';
  const link = article.url || '#';

  articleElement.innerHTML = `
    <a href="${link}" target="_blank">
      <img src="${imgUrl}" alt="${title}" class="news-image">
      <h2 class="news-title">${title}</h2>
      <p class="news-summary">${summary}</p>
    </a>
  `;

  return articleElement;
}

// Function to update pagination buttons
function updatePagination() {
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
  }
  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchNews(); // Load top US headlines
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    console.log('Search Query:', query); // Debug
    currentPage = 1; // Reset to page 1 on new search
    fetchNews(query, 1);
  } else {
    newsContainer.innerHTML = '<p>Please enter a search term.</p>';
    if (loading) loading.style.display = 'none';
    // Reset pagination
    totalPages = 1;
    currentPage = 1;
    updatePagination();
  }
});

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    fetchNews(currentQuery, currentPage - 1);
  }
});

nextPageBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    fetchNews(currentQuery, currentPage + 1);
  }
});

// Theme toggle
const toggleBtn = document.getElementById('theme-toggle');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});