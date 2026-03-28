const API_BASE = "https://api.imdbapi.dev";
const DEFAULT_QUERY = "spider";
const ITEMS_LIMIT = 20;
const SCROLL_AMOUNT = 500;

const elements = {
  backgroundLayer: document.getElementById("backgroundLayer"),
  title: document.getElementById("movieTitle"),
  rating: document.getElementById("movieRating"),
  year: document.getElementById("movieYear"),
  duration: document.getElementById("movieDuration"),
  genre: document.getElementById("movieGenre"),
  description: document.getElementById("movieDescription"),
  movieStrip: document.getElementById("movieStrip"),
  statusMessage: document.getElementById("statusMessage"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
};

const appState = {
  movies: [],
  selectedMovieId: null,
  previewMovieId: null,
  loading: false,
  lastQuery: DEFAULT_QUERY,
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  fetchAndRenderMovies(DEFAULT_QUERY);
}

function bindEvents() {
  elements.searchForm.addEventListener("submit", handleSearchSubmit);

  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit(event);
    }
  });

  elements.prevBtn.addEventListener("click", () => {
    elements.movieStrip.scrollBy({
      left: -SCROLL_AMOUNT,
      behavior: "smooth",
    });
  });

  elements.nextBtn.addEventListener("click", () => {
    elements.movieStrip.scrollBy({
      left: SCROLL_AMOUNT,
      behavior: "smooth",
    });
  });
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const query = elements.searchInput.value.trim() || DEFAULT_QUERY;
  await fetchAndRenderMovies(query);
}

async function fetchAndRenderMovies(query) {
  setStatus("Loading...", "loading");
  setLoading(true);

  try {
    const movies = await fetchMovies(query);

    appState.movies = movies;
    appState.lastQuery = query;

    if (!movies.length) {
      appState.selectedMovieId = null;
      appState.previewMovieId = null;
      renderMovies([]);
      renderMovieDetails(null);
      setStatus("No results found", "empty");
      return;
    }

    appState.selectedMovieId = movies[0].id;
    appState.previewMovieId = null;

    renderMovies(movies);

    // جلب تفاصيل أول فيلم تلقائيًا
    await loadMovieDetails(appState.selectedMovieId);

    setStatus("");
  } catch (error) {
    console.error(error);
    appState.movies = [];
    appState.selectedMovieId = null;
    appState.previewMovieId = null;

    renderMovies([]);
    renderMovieDetails(null);
    setStatus("Something went wrong", "error");
  } finally {
    setLoading(false);
  }
}

async function fetchMovies(query) {
  const url = `${API_BASE}/search/titles?query=${encodeURIComponent(query)}&limit=${ITEMS_LIMIT}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  console.log("Search response:", data);

  const rawItems = extractMovieArray(data);

  return rawItems.slice(0, ITEMS_LIMIT).map(normalizeSearchMovie);
}

function extractMovieArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.titles)) return data.titles;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

// هذه للبحث فقط
function normalizeSearchMovie(item) {
  return {
    id: item.id || crypto.randomUUID(),
    title:
      item.primaryTitle || item.originalTitle || item.title || "Unknown title",
    image:
      item.primaryImage?.url ||
      item.primaryImage ||
      item.image?.url ||
      item.image ||
      "",
    type: item.type || "unknown",
    rating: "N/A",
    year: item.startYear ? String(item.startYear) : "N/A",
    duration: "N/A",
    genre: "N/A",
    description: "Loading movie details...",
  };
}

// نجلب التفاصيل الكاملة للفيلم المختار
async function loadMovieDetails(movieId) {
  try {
    setStatus("Loading movie details...", "loading");

    const details = await fetchMovieDetails(movieId);

    // نحدّث الفيلم داخل الحالة
    appState.movies = appState.movies.map((movie) =>
      movie.id === movieId ? { ...movie, ...details } : movie,
    );

    renderMovieDetails(getCurrentMovie());
    renderMovies(appState.movies);
    updateCardStates();
    setStatus("");
  } catch (error) {
    console.error("Failed to load movie details:", error);
    renderMovieDetails(getCurrentMovie());
    setStatus("Could not load full movie details", "error");
  }
}

async function fetchMovieDetails(movieId) {
  // غيّر هذا المسار إذا كان الـ API عندك يستخدم endpoint مختلف للتفاصيل
  const url = `${API_BASE}/titles/${movieId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Details HTTP error: ${response.status}`);
  }

  const data = await response.json();
  console.log("Details response:", data);

  return normalizeMovieDetails(data);
}

function normalizeMovieDetails(item) {
  const image =
    item.primaryImage?.url ||
    item.primaryImage ||
    item.image?.url ||
    item.image ||
    item.poster ||
    item.poster_url ||
    "";

  const ratingValue =
    item.rating?.aggregateRating ??
    item.aggregateRating ??
    item.imdbRating ??
    item.rating ??
    null;

  const yearValue =
    item.releaseYear?.year ??
    item.year ??
    item.startYear ??
    item.releaseDate ??
    null;

  let durationValue = null;
  if (item.runtimeMinutes) {
    durationValue = item.runtimeMinutes;
  } else if (item.runtime?.seconds) {
    durationValue = Math.round(item.runtime.seconds / 60);
  } else if (!Number.isNaN(Number(item.duration))) {
    durationValue = Number(item.duration);
  }

  let genreValue = "Unknown";
  if (Array.isArray(item.genres) && item.genres.length) {
    genreValue = item.genres.map((g) => g.text || g.name || g).join(" • ");
  } else if (Array.isArray(item.genre) && item.genre.length) {
    genreValue = item.genre.join(" • ");
  } else if (typeof item.genre === "string" && item.genre.trim()) {
    genreValue = item.genre;
  }

  const descriptionValue =
    item.plot?.plotText?.plainText ||
    item.plot?.plainText ||
    item.description ||
    item.summary ||
    item.overview ||
    item.plot ||
    "Movie description is not available.";

  return {
    id: item.id,
    title:
      item.primaryTitle || item.originalTitle || item.title || "Unknown title",
    image,
    rating: formatRating(ratingValue),
    year: formatYear(yearValue),
    duration: formatDuration(durationValue),
    genre: genreValue,
    description: descriptionValue,
  };
}

function formatRating(rating) {
  if (rating === null || rating === undefined || rating === "") return "N/A";
  const value = Number(rating);
  return Number.isNaN(value) ? "N/A" : value.toFixed(1);
}

function formatYear(year) {
  if (year === null || year === undefined || year === "") return "Unknown year";
  const yearText = String(year);
  const match = yearText.match(/\d{4}/);
  return match ? match[0] : "Unknown year";
}

function formatDuration(duration) {
  if (duration === null || duration === undefined || duration === "") {
    return "N/A";
  }

  const value = Number(duration);
  if (!Number.isNaN(value) && value > 0) {
    return `${value} min`;
  }

  return "N/A";
}

function renderMovies(movies) {
  elements.movieStrip.innerHTML = "";

  if (!movies.length) return;

  const fragment = document.createDocumentFragment();

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    fragment.appendChild(card);
  });

  elements.movieStrip.appendChild(fragment);
}

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";
  card.dataset.id = movie.id;
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Select ${movie.title}`);

  if (appState.selectedMovieId === movie.id) {
    card.classList.add("is-selected");
  }

  if (movie.image) {
    const img = document.createElement("img");
    img.src = movie.image;
    img.alt = movie.title;
    img.loading = "lazy";
    img.onerror = () => {
      img.remove();
      card.prepend(createFallback(movie.title));
    };
    card.appendChild(img);
  } else {
    card.appendChild(createFallback(movie.title));
  }

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = movie.title;
  card.appendChild(title);

  card.addEventListener("mouseenter", () => handlePreview(movie.id));
  card.addEventListener("mouseleave", handlePreviewLeave);
  card.addEventListener("click", () => handleSelect(movie.id));

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(movie.id);
    }
  });

  return card;
}

function createFallback(title) {
  const fallback = document.createElement("div");
  fallback.className = "fallback";
  fallback.textContent = title;
  return fallback;
}

async function handlePreview(movieId) {
  appState.previewMovieId = movieId;
  renderMovieDetails(getCurrentMovie());
  updateCardStates();
  await loadMovieIfNeeded(movieId);
}

function handlePreviewLeave() {
  appState.previewMovieId = null;
  renderMovieDetails(getCurrentMovie());
  updateCardStates();
}

async function handleSelect(movieId) {
  appState.selectedMovieId = movieId;
  appState.previewMovieId = null;
  renderMovieDetails(getCurrentMovie());
  updateCardStates();
  await loadMovieIfNeeded(movieId);
}

function updateCardStates() {
  const cards = elements.movieStrip.querySelectorAll(".movie-card");

  cards.forEach((card) => {
    const id = card.dataset.id;
    card.classList.toggle("is-selected", id === appState.selectedMovieId);
    card.classList.toggle("is-preview", id === appState.previewMovieId);
  });
}

function getCurrentMovie() {
  const currentId = appState.previewMovieId || appState.selectedMovieId;
  return appState.movies.find((movie) => movie.id === currentId) || null;
}

async function loadMovieIfNeeded(movieId) {
  const movie = appState.movies.find((m) => m.id === movieId);
  if (movie && movie.description === "Loading movie details...") {
    await loadMovieDetails(movieId);
  }
}

function renderMovieDetails(movie) {
  if (!movie) {
    elements.title.textContent = "No Movie Selected";
    elements.rating.textContent = "IMDb N/A";
    elements.year.textContent = "Unknown year";
    elements.duration.textContent = "Unknown duration";
    elements.genre.textContent = "Unknown";
    elements.description.textContent =
      "There is no movie data to display right now.";
    updateBackground("");
    return;
  }

  elements.title.textContent = movie.title;
  elements.rating.textContent = `IMDb ${movie.rating}`;
  elements.year.textContent = movie.year;
  elements.duration.textContent = movie.duration;
  elements.genre.textContent = movie.genre;
  elements.description.textContent = movie.description;
  updateBackground(movie.image);
}

function updateBackground(imageUrl) {
  if (!imageUrl) {
    elements.backgroundLayer.style.backgroundImage =
      "linear-gradient(180deg, #10131a, #06070b)";
    elements.backgroundLayer.style.opacity = "1";
    return;
  }

  // Fade out
  elements.backgroundLayer.style.opacity = "0.5";

  // Change image after fade
  elements.backgroundLayer.style.backgroundImage = `url("${imageUrl}")`;

  // Small delay for smooth transition
  setTimeout(() => {
    elements.backgroundLayer.style.opacity = "1";
  }, 50);
}

function setStatus(message, type = "") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`.trim();
}

function setLoading(isLoading) {
  appState.loading = isLoading;
  elements.prevBtn.disabled = isLoading;
  elements.nextBtn.disabled = isLoading;
}
