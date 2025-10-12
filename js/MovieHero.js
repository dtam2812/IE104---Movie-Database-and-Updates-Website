import { movies } from '../data/movies.js';

export function initMovieHero() {
  const movieHeroContainer = document.getElementById('movie-hero');
  if (!movieHeroContainer) return;

  let currentIndex = 0;
  let intervalId = null;

  // Create the movie hero HTML structure
  function createMovieHeroHTML() {
    return `
      <div class="movie-hero-container">
        <div class="movie-hero-backgrounds">
          ${movies.map((movie, index) => `
            <div class="movie-background ${index === currentIndex ? 'active' : ''}" data-index="${index}">
              <div class="background-image">
                <img src="${movie.backgroundImage}" alt="${movie.title}" />
                <div class="gradient-overlay-1"></div>
                <div class="gradient-overlay-2"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="movie-hero-content">
          <div class="movie-hero-info">
            <div class="movie-poster">
              <img src="${movies[currentIndex].posterImage}" alt="${movies[currentIndex].title}" />
            </div>
            
            <div class="movie-details">
              <div class="movie-english-title">${movies[currentIndex].englishTitle}</div>
              
              <div class="movie-badges">
                ${movies[currentIndex].quality ? `
                  <div class="badge quality-badge">
                    <span>${movies[currentIndex].quality}</span>
                  </div>
                ` : ''}
                
                <div class="badge age-badge">
                  <span>${movies[currentIndex].ageRating}</span>
                </div>
                
                ${movies[currentIndex].imdbRating ? `
                  <div class="badge imdb-badge">
                    <span class="imdb-label">IMDb</span>
                    <span class="imdb-rating">${movies[currentIndex].imdbRating}</span>
                  </div>
                ` : ''}
                
                <div class="badge year-badge">
                  <span>${movies[currentIndex].year}</span>
                </div>
                
                ${movies[currentIndex].season ? `
                  <div class="badge season-badge">
                    <span>${movies[currentIndex].season}</span>
                  </div>
                ` : ''}
                
                <div class="badge duration-badge">
                  <span>${movies[currentIndex].duration}</span>
                </div>
              </div>
              
              <div class="movie-genres">
                ${movies[currentIndex].genres.slice(0, 4).map(genre => `
                  <div class="genre-badge">
                    <span>${genre}</span>
                  </div>
                `).join('')}
                ${movies[currentIndex].genres.length > 4 ? `
                  <div class="genre-badge">
                    <span>+${movies[currentIndex].genres.length - 4}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="movie-description">
                <p>${movies[currentIndex].description}</p>
              </div>
              
              <div class="movie-actions">
                <button class="play-button">
                  <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                
                <div class="action-buttons">
                  <button class="action-button heart-button">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <div class="action-divider"></div>
                  <button class="action-button info-button">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="movie-thumbnails">
          <div class="thumbnails-container">
            ${movies.map((movie, index) => `
              <button class="thumbnail-button ${index === currentIndex ? 'active' : ''}" data-index="${index}">
                <img src="${movie.thumbnailImage}" alt="${movie.title}" />
              </button>
            `).join('')}
          </div>
        </div>

        <div class="hero-gradient-bottom"></div>
      </div>
    `;
  }

  // Update the movie display
  function updateMovieDisplay() {
    const backgrounds = movieHeroContainer.querySelectorAll('.movie-background');
    const thumbnails = movieHeroContainer.querySelectorAll('.thumbnail-button');
    const poster = movieHeroContainer.querySelector('.movie-poster img');
    const englishTitle = movieHeroContainer.querySelector('.movie-english-title');
    const badges = movieHeroContainer.querySelector('.movie-badges');
    const genres = movieHeroContainer.querySelector('.movie-genres');
    const description = movieHeroContainer.querySelector('.movie-description p');

    const currentMovie = movies[currentIndex];

    // Update backgrounds
    backgrounds.forEach((bg, index) => {
      bg.classList.toggle('active', index === currentIndex);
    });

    // Update thumbnails
    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === currentIndex);
    });

    // Update movie details
    if (poster) poster.src = currentMovie.posterImage;
    if (englishTitle) englishTitle.textContent = currentMovie.englishTitle;
    
    if (badges) {
      badges.innerHTML = `
        ${currentMovie.quality ? `
          <div class="badge quality-badge">
            <span>${currentMovie.quality}</span>
          </div>
        ` : ''}
        
        <div class="badge age-badge">
          <span>${currentMovie.ageRating}</span>
        </div>
        
        ${currentMovie.imdbRating ? `
          <div class="badge imdb-badge">
            <span class="imdb-label">IMDb</span>
            <span class="imdb-rating">${currentMovie.imdbRating}</span>
          </div>
        ` : ''}
        
        <div class="badge year-badge">
          <span>${currentMovie.year}</span>
        </div>
        
        ${currentMovie.season ? `
          <div class="badge season-badge">
            <span>${currentMovie.season}</span>
          </div>
        ` : ''}
        
        <div class="badge duration-badge">
          <span>${currentMovie.duration}</span>
        </div>
      `;
    }

    if (genres) {
      genres.innerHTML = `
        ${currentMovie.genres.slice(0, 4).map(genre => `
          <div class="genre-badge">
            <span>${genre}</span>
          </div>
        `).join('')}
        ${currentMovie.genres.length > 4 ? `
          <div class="genre-badge">
            <span>+${currentMovie.genres.length - 4}</span>
          </div>
        ` : ''}
      `;
    }

    if (description) {
      description.textContent = currentMovie.description;
    }
  }

  // Start auto-rotation
  function startAutoRotation() {
    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % movies.length;
      updateMovieDisplay();
    }, 5000);
  }

  // Stop auto-rotation
  function stopAutoRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Handle thumbnail click
  function handleThumbnailClick(event) {
    const button = event.target.closest('.thumbnail-button');
    if (button) {
      const index = parseInt(button.dataset.index);
      currentIndex = index;
      updateMovieDisplay();
      stopAutoRotation();
      startAutoRotation();
    }
  }

  // Initialize the component
  function init() {
    movieHeroContainer.innerHTML = createMovieHeroHTML();
    updateMovieDisplay();
    startAutoRotation();

    // Add event listeners
    movieHeroContainer.addEventListener('click', handleThumbnailClick);

    // Pause on hover
    movieHeroContainer.addEventListener('mouseenter', stopAutoRotation);
    movieHeroContainer.addEventListener('mouseleave', startAutoRotation);
  }

  // Cleanup function
  function destroy() {
    stopAutoRotation();
    movieHeroContainer.removeEventListener('click', handleThumbnailClick);
    movieHeroContainer.removeEventListener('mouseenter', stopAutoRotation);
    movieHeroContainer.removeEventListener('mouseleave', startAutoRotation);
  }

  // Initialize
  init();

  // Return cleanup function
  return destroy;
}
