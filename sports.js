// GNews API key & base
const API_KEY = '234b819cfb481db6fb290020fa2d9cf0';
const BASE_URL = 'https://gnews.io/api/v4';

// Elements
const newsContainer = document.getElementById('news-container');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// State
let currentPage = 1;
let totalPages = 1;
const pageSize = 6; // number of sports articles per page

// Fetch sports news
async function fetchSportsNews(page = 1) {
  newsContainer.innerHTML = '<p>Loading sports news...</p>';

  const url = `${BASE_URL}/search?q=sports&lang=en&country=us&max=${pageSize}&page=${page}&token=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.articles && data.articles.length > 0) {
      newsContainer.innerHTML = '';
      data.articles.forEach(article => {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.innerHTML = `
          <a href="${article.url}" target="_blank">
            <img src="${article.image || 'https://picsum.photos/400/200'}" 
                 alt="${article.title}" class="news-image">
            <h2 class="news-title">${article.title}</h2>
            <p class="news-summary">${article.description || 'No description available.'}</p>
          </a>
        `;
        newsContainer.appendChild(card);
      });

      totalPages = Math.ceil(data.totalArticles / pageSize);
      currentPage = page;
      updatePagination();
    } else {
      newsContainer.innerHTML = '<p>No sports news found right now.</p>';
    }
  } catch (error) {
    console.error(error);
    newsContainer.innerHTML = '<p>Error fetching sports news.</p>';
  }
}

// Pagination
function updatePagination() {
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) fetchSportsNews(currentPage - 1);
});

nextPageBtn.addEventListener('click', () => {
  if (currentPage < totalPages) fetchSportsNews(currentPage + 1);
});

// Theme toggle
const toggleBtn = document.getElementById('theme-toggle');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// Load initial sports news
document.addEventListener('DOMContentLoaded', () => {
  fetchSportsNews();
});
