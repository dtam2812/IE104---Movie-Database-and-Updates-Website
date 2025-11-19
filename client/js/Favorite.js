class FavoritesManager {
  constructor() {
    this.isInitialized = false;
    this.currentFilm = null;
    this.API_BASE_URL = "http://localhost:5000";
  }

  // Khởi tạo manager
  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.isInitialized = true;
  }

  // Thiết lập event listeners
  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const favoriteBtn = e.target.closest(
        ".movie-banner__button--like, .favorite-btn, .favorite"
      );
      if (favoriteBtn) {
        e.preventDefault();
        this.handleFavoriteClick(favoriteBtn);
      }
    });

    document.addEventListener("filmLoaded", (e) => {
      this.currentFilm = e.detail;
      this.updateFavoriteButtonState();
    });

    document.addEventListener("userLoggedIn", () => {
      this.updateFavoriteButtonState();
    });
  }

  // Phương thức lấy token từ nhiều nguồn
  getToken() {
    return localStorage.getItem("accessToken") || localStorage.getItem("token");
  }

  // Kiểm tra token hợp lệ
  isValidToken(token) {
    if (!token) return false;

    try {
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        this.clearInvalidToken();
        return false;
      }

      return true;
    } catch (error) {
      this.clearInvalidToken();
      return false;
    }
  }

  // Xóa token không hợp lệ
  clearInvalidToken() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
  }

  // Xử lý khi click nút favorite
  async handleFavoriteClick(button, filmData = null) {
    const token = this.getToken();
    if (!token || !this.isValidToken(token)) {
      this.showLoginPrompt();
      return;
    }

    const film = filmData || this.currentFilm;

    if (!film) {
      this.showNotification("Không tìm thấy thông tin phim", "error");
      return;
    }

    try {
      this.setButtonLoading(button, true);

      console.log("🎬 handleFavoriteClick - Film data:", {
        id: film.id,
        type: film.type,
        title: film.title,
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/favorites/toggle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: film.id,
            type: film.type,
            title: film.title,
            originalName: film.originalName,
            posterPath: film.posterPath,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Favorite toggled:", data.action);
        const message =
          data.action === "added"
            ? "Đã thêm vào danh sách yêu thích"
            : "Đã xóa khỏi danh sách yêu thích";
        this.showNotification(message, "success");
        this.updateButtonAppearance(button, data.action === "added");
      } else {
        throw new Error(data.message || "Lỗi không xác định");
      }
    } catch (error) {
      console.error("❌ handleFavoriteClick error:", error);
      this.showNotification("Có lỗi xảy ra", "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  // Cập nhật trạng thái nút favorite
  async updateFavoriteButtonState() {
    if (!this.currentFilm) return;

    const favoriteBtn = document.querySelector(".favorite, .favorite-btn");
    if (favoriteBtn) {
      const isFavorite = await this.checkFavoriteStatus(this.currentFilm.id);
      this.updateButtonAppearance(favoriteBtn, isFavorite);
    }
  }

  // Cập nhật giao diện nút
  updateButtonAppearance(button, isFavorite) {
    const svg = button.querySelector("svg");
    const path = svg?.querySelector("path");

    if (path) {
      if (isFavorite) {
        path.style.fill = "#ff4444";
        button.setAttribute("aria-label", "Bỏ yêu thích");
        button.classList.add("active");
      } else {
        path.style.fill = "#fff";
        button.setAttribute("aria-label", "Yêu thích");
        button.classList.remove("active");
      }
    }
  }

  // Thiết lập trạng thái loading cho nút
  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add("loading");
      button.disabled = true;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }

  // Hiển thị thông báo đăng nhập
  showLoginPrompt() {
    this.showNotification(
      "Vui lòng đăng nhập để sử dụng tính năng yêu thích",
      "info"
    );
  }

  // Hiển thị thông báo
  showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      max-width: 300px;
    `;

    if (type === "success") {
      toast.style.backgroundColor = "#4CAF50";
    } else if (type === "error") {
      toast.style.backgroundColor = "#f44336";
    } else {
      toast.style.backgroundColor = "#2196F3";
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 100);

    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Kiểm tra trạng thái yêu thích của film
  async checkFavoriteStatus(filmId) {
    const token = this.getToken();
    if (!token || !this.isValidToken(token)) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/favorites/check/${filmId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.success ? data.isFavorite : false;
    } catch (error) {
      return false;
    }
  }
}

// Khởi tạo instance global
const favoritesManager = new FavoritesManager();

// Export cho module
export { favoritesManager };
