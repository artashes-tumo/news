const newsContainer = document.getElementById("news-container");
const loading = document.getElementById("loading");
const pageInfo = document.getElementById("page-info");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const themeToggle = document.getElementById("theme-toggle");

const API_KEY = '234b819cfb481db6fb290020fa2d9cf0';
const BASE_URL = 'https://gnews.io/api/v4';

let currentPage = 1;
let currentCategory = "general";

// Detect category from <body id="">
switch (document.body.id) {
  case "home-page": currentCategory = "general"; break;
  case "breaking-page": currentCategory = "general"; break; // Use search for breaking if needed
  case "sports-page": currentCategory = "sports"; break;
  case "technology-page": currentCategory = "technology"; break;
  case "world-page": currentCategory = "world"; break;
}

// Load saved theme on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙";
  }
});

// Theme toggle with persistence
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// Fetch news
async function fetchNews(page = 1) {
  loading.style.display = "block";
  newsContainer.innerHTML = "";

  try {
    const url = currentCategory === "general" && document.body.id === "breaking-page"
      ? `${BASE_URL}/search?q=breaking&lang=en&page=${page}&apikey=${API_KEY}`
      : `${BASE_URL}/top-headlines?category=${currentCategory}&lang=en&page=${page}&apikey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    if (data.articles && data.articles.length > 0) {
      data.articles.forEach(article => {
        const card = document.createElement("div");
        card.className = "news-card";
        card.innerHTML = `
          <img src="${article.image || 'https://via.placeholder.com/400x200'}" alt="news image" class="news-image">
          <h2 class="news-title"><a href="${article.url}" target="_blank">${article.title}</a></h2>
          <p class="news-summary">${article.description || 'No description available.'}</p>
        `;
        newsContainer.appendChild(card);
      });
    } else {
      newsContainer.innerHTML = `<p>No articles found for this category.</p>`;
    }
    pageInfo.textContent = `Page ${page}`;
    prevPageBtn.disabled = page === 1;
    nextPageBtn.disabled = data.articles.length === 0 || (data.totalArticles && page * 10 >= data.totalArticles);
  } catch (err) {
    console.error("Error fetching news:", err);
    newsContainer.innerHTML = `<p>Error loading news: ${err.message}</p>`;
  } finally {
    loading.style.display = "none";
  }
}

prevPageBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    fetchNews(currentPage);
  }
});

nextPageBtn?.addEventListener("click", () => {
  currentPage++;
  fetchNews(currentPage);
});

fetchNews(currentPage);