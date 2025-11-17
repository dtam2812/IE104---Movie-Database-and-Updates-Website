// UserDetail.js - Xử lý tương tác cho trang User Detail

document.addEventListener("DOMContentLoaded", function () {
  // Toast functionality
  const toast = document.querySelector(".toast");
  const toastButton = document.querySelector(".toast button");

  if (toastButton) {
    toastButton.addEventListener("click", function () {
      toast.classList.remove("show");
    });
  }

  // Show toast when save button is clicked
  const saveButtons = document.querySelectorAll(".btn:not(.secondary)");
  saveButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();

      // Validate form before showing toast
      if (validateForm()) {
        showToast("Thay đổi đã được lưu");
      }
    });
  });

  // Modal functionality
  const modal = document.querySelector(".modal-backdrop");
  const cancelButtons = document.querySelectorAll(".btn.secondary");

  cancelButtons.forEach((button) => {
    if (!button.closest(".modal")) {
      button.addEventListener("click", function () {
        showModal();
      });
    }
  });

  // Close modal when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Close modal with cancel button in modal
  const modalCancel = modal.querySelector(".btn.secondary");
  if (modalCancel) {
    modalCancel.addEventListener("click", function () {
      hideModal();
    });
  }

  // Confirm action in modal
  const modalConfirm = modal.querySelector(".btn:not(.secondary)");
  if (modalConfirm) {
    modalConfirm.addEventListener("click", function () {
      hideModal();
      // Perform confirmation action here
      showToast("Hành động đã được xác nhận");
    });
  }

  // Navigation functionality
  const navButtons = document.querySelectorAll(".nav button");
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      navButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");

      // Handle navigation based on button text
      handleNavigation(this.textContent.trim());
    });
  });

  // Form validation for password fields
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validatePasswordField(this);
    });
  });

  // Logout functionality
  const logoutButton = document.querySelector(".logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        // Perform logout action here
        showToast("Đã đăng xuất thành công");
        // Redirect to login page after 1 second
        setTimeout(() => {
          window.location.href = "../../Pages/Login.html";
        }, 1000);
      }
    });
  }
});

// Function to show toast message
function showToast(message) {
  const toast = document.querySelector(".toast");
  const toastText = toast.querySelector("span");

  if (toastText) {
    toastText.textContent = message;
  }

  toast.classList.add("show");

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Function to show modal
function showModal() {
  const modal = document.querySelector(".modal-backdrop");
  modal.style.display = "flex";
}

// Function to hide modal
function hideModal() {
  const modal = document.querySelector(".modal-backdrop");
  modal.style.display = "none";
}

// Function to validate form
function validateForm() {
  let isValid = true;

  // Validate required fields
  const requiredFields = document.querySelectorAll("input[required]");
  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      showError(field, "Trường này là bắt buộc");
      isValid = false;
    } else {
      clearError(field);
    }
  });

  // Validate email format
  const emailField = document.getElementById("email");
  if (emailField && emailField.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      showError(emailField, "Email không hợp lệ");
      isValid = false;
    }
  }

  // Validate password match
  const newPassword = document.getElementById("new-password");
  const confirmPassword = document.getElementById("confirm-password");

  if (
    newPassword &&
    confirmPassword &&
    newPassword.value &&
    confirmPassword.value
  ) {
    if (newPassword.value !== confirmPassword.value) {
      showError(confirmPassword, "Mật khẩu xác nhận không khớp");
      isValid = false;
    }
  }

  return isValid;
}

// Function to validate password field
function validatePasswordField(field) {
  if (field.value && field.value.length < 6) {
    showError(field, "Mật khẩu phải có ít nhất 6 ký tự");
    return false;
  } else {
    clearError(field);
    return true;
  }
}

// Function to show error message
function showError(field, message) {
  field.classList.add("input-invalid");

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".error");
  if (existingError) {
    existingError.remove();
  }

  // Create and show error message
  const errorElement = document.createElement("div");
  errorElement.className = "error";
  errorElement.textContent = message;
  errorElement.style.display = "block";

  field.parentNode.appendChild(errorElement);
}

// Function to clear error message
function clearError(field) {
  field.classList.remove("input-invalid");

  const errorElement = field.parentNode.querySelector(".error");
  if (errorElement) {
    errorElement.remove();
  }
}

// Function to handle navigation between sections
function handleNavigation(section) {
  switch (section) {
    case "Thông tin cá nhân":
      showSection("personal-info-section");
      break;
    case "Yêu thích":
      showSection("favorites-section");
      break;
    default:
      console.log("Unknown section:", section);
  }
}

function showSection(sectionId) {
  // Hide all sections
  const allSections = document.querySelectorAll(".content-section");
  allSections.forEach((section) => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");

    // Scroll to top of the section smoothly
    setTimeout(() => {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }
}

const favoritesLinks = document.querySelectorAll('[data-section="favorites"]');

favoritesLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Highlight button nav
    const navButtons = document.querySelectorAll(".nav button");
    navButtons.forEach((btn) => btn.classList.remove("active"));
    link.classList.add("active");

    // Show favorites section
    showSection("favorites-section");
  });
});

// Function to update user avatar
function updateAvatar(imageUrl) {
  const avatar = document.querySelector(".avatar img");
  if (avatar) {
    avatar.src = imageUrl;
  }
}

// Function to update user information
function updateUserInfo(userData) {
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const phoneField = document.getElementById("phone");
  const birthdayField = document.getElementById("birthday");
  const userName = document.querySelector(".sidebar .name");

  if (nameField && userData.name) nameField.value = userData.name;
  if (emailField && userData.email) emailField.value = userData.email;
  if (phoneField && userData.phone) phoneField.value = userData.phone;
  if (birthdayField && userData.birthday)
    birthdayField.value = userData.birthday;
  if (userName && userData.name) userName.textContent = userData.name;

  if (userData.avatar) {
    updateAvatar(userData.avatar);
  }
}

// Lấy thông tin user từ server
async function fetchUserDetail() {
  try {
    const res = await fetch("http://localhost:5000/api/authUser/getUser", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu");

    const data = await res.json(); // ✅ khai báo const
    console.log("User data:", data.user);

    // Cập nhật thông tin lên giao diện
    updateUserInfo({
      name: data.user.userName,
      email: data.user.email,
      phone: data.user.phone,
      birthday: data.user.birthday,
      avatar: data.user.avatar, // nếu có
    });

    // Nếu có danh sách yêu thích
    if (data.user.favoriteFilm) {
      renderFavorites(data.user.favoriteFilm);
    }
  } catch (err) {
    console.error("Fetch user detail error:", err);
  }
}

// Render danh sách phim yêu thích
// Render danh sách phim yêu thích
function renderFavorites(favorites) {
  const container = document.querySelector(".favorites-list");
  if (!container) {
    console.error("Favorites container not found");
    return;
  }

  container.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-favorites">
        <i class="bx bx-heart"></i>
        <p>Chưa có phim nào trong danh sách yêu thích</p>
        <a href="../pages/HomePage.html" class="btn browse-movies-btn">Khám phá phim</a>
      </div>
    `;
    return;
  }

  // Lọc các phim trùng lặp
  const uniqueFavorites = favorites.filter(
    (film, index, self) =>
      index ===
      self.findIndex(
        (f) =>
          f._id === film._id ||
          f.id === film.id ||
          (f.title === film.title && f.originalName === film.originalName)
      )
  );

  if (uniqueFavorites.length === 0) {
    container.innerHTML = `
      <div class="empty-favorites">
        <i class="bx bx-heart"></i>
        <p>Chưa có phim nào trong danh sách yêu thích</p>
        <a href="../pages/HomePage.html" class="btn browse-movies-btn">Khám phá phim</a>
      </div>
    `;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "favorites-grid";

  uniqueFavorites.forEach((film, index) => {
    const filmId = film.id;

    const filmCard = document.createElement("div");
    filmCard.className = "favorite-card";
    filmCard.setAttribute("data-film-id", filmId);

    if (!filmId) {
      console.warn("Film missing ID:", film);
      return; // Bỏ qua phim không có ID
    }

    // Tạo episode/quality badge
    const typeBadge =
      film.type === "TV" || film.media_type === "tv"
        ? `<div class="favorite-card__episode-badge">TV Show</div>`
        : `<div class="favorite-card__episode-badge">Movie</div>`;

    filmCard.innerHTML = `
  <div class="favorite-card__container">
    <img 
      src="${film.posterPath || "/images/default-poster.jpg"}" 
      alt="${film.title || film.originalName || "Unknown"}" 
      class="favorite-card__poster"
      onerror="this.src='/images/default-poster.jpg'"
    />
    <div class="favorite-card__info-top">
      ${typeBadge}
    </div>
  </div>
  <div class="favorite-card__info">
    <div class="favorite-card__vietnamese-title">
      <span>${film.title || film.originalName || "Unknown Title"}</span>
    </div>
    <div class="favorite-card__original-title">
      <span>${film.originalName || ""}</span>
    </div>
  </div>
`;

    // Thêm event listener để khi click vào card sẽ chuyển đến trang chi tiết
    filmCard.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Đảm bảo đường dẫn đúng
      window.location.href = `../pages/MovieDetail.html?id=${filmId}`;
    });

    grid.appendChild(filmCard);
  });

  container.appendChild(grid);
}

// Function để xóa phim khỏi danh sách yêu thích
async function removeFromFavorites(filmId) {
  if (
    !confirm("Bạn có chắc chắn muốn xóa phim này khỏi danh sách yêu thích?")
  ) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/films/${filmId}/favorite`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      showToast("Đã xóa phim khỏi danh sách yêu thích");
      // Reload lại danh sách yêu thích
      fetchUserDetail();
    } else {
      throw new Error("Lỗi khi xóa phim yêu thích");
    }
  } catch (error) {
    console.error("Remove from favorites error:", error);
    showToast("Có lỗi xảy ra khi xóa phim");
  }
}

// Gọi khi load trang
document.addEventListener("DOMContentLoaded", fetchUserDetail);

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showToast,
    showModal,
    hideModal,
    validateForm,
    updateUserInfo,
  };
}
