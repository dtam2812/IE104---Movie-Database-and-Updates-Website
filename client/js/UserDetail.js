// UserDetail.js - Xử lý tương tác cho trang User Detail

document.addEventListener("DOMContentLoaded", function () {
  // Toast functionality
  const toast = document.querySelector(".user-detail__toast");
  const toastButton = document.querySelector(".user-detail__toast-btn");

  if (toastButton) {
    toastButton.addEventListener("click", function () {
      toast.classList.remove("user-detail__toast--show");
    });
  }

  // Show toast when save button is clicked
  const saveButtons = document.querySelectorAll(
    ".user-detail__btn:not(.user-detail__btn--secondary)"
  );
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
  const modal = document.querySelector(".user-detail__modal-backdrop");
  const cancelButtons = document.querySelectorAll(
    ".user-detail__btn--secondary"
  );

  cancelButtons.forEach((button) => {
    if (!button.closest(".user-detail__modal")) {
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
  const modalCancel = modal.querySelector(".user-detail__btn--secondary");
  if (modalCancel) {
    modalCancel.addEventListener("click", function () {
      hideModal();
    });
  }

  // Confirm action in modal
  const modalConfirm = modal.querySelector(
    ".user-detail__btn:not(.user-detail__btn--secondary)"
  );
  if (modalConfirm) {
    modalConfirm.addEventListener("click", function () {
      hideModal();
      // Perform confirmation action here
      showToast("Hành động đã được xác nhận");
    });
  }

  // Navigation functionality
  const navButtons = document.querySelectorAll(".user-detail__nav-btn");
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      navButtons.forEach((btn) =>
        btn.classList.remove("user-detail__nav-btn--active")
      );
      // Add active class to clicked button
      this.classList.add("user-detail__nav-btn--active");

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
  const logoutButton = document.querySelector(".user-detail__logout");
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
  const toast = document.querySelector(".user-detail__toast");
  const toastText = toast.querySelector("span");

  if (toastText) {
    toastText.textContent = message;
  }

  toast.classList.add("user-detail__toast--show");

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("user-detail__toast--show");
  }, 3000);
}

// Function to show modal
function showModal() {
  const modal = document.querySelector(".user-detail__modal-backdrop");
  modal.style.display = "flex";
}

// Function to hide modal
function hideModal() {
  const modal = document.querySelector(".user-detail__modal-backdrop");
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
  field.classList.add("user-detail__input--invalid");

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".user-detail__error");
  if (existingError) {
    existingError.remove();
  }

  // Create and show error message
  const errorElement = document.createElement("div");
  errorElement.className = "user-detail__error";
  errorElement.textContent = message;
  errorElement.style.display = "block";

  field.parentNode.appendChild(errorElement);
}

// Function to clear error message
function clearError(field) {
  field.classList.remove("user-detail__input--invalid");

  const errorElement = field.parentNode.querySelector(".user-detail__error");
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
  const allSections = document.querySelectorAll(".user-detail__section");
  allSections.forEach((section) => {
    section.classList.remove("user-detail__section--active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("user-detail__section--active");

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
    const navButtons = document.querySelectorAll(".user-detail__nav-btn");
    navButtons.forEach((btn) =>
      btn.classList.remove("user-detail__nav-btn--active")
    );
    link.classList.add("user-detail__nav-btn--active");

    // Show favorites section
    showSection("favorites-section");
  });
});

// Function to update user avatar
function updateAvatar(imageUrl) {
  const avatar = document.querySelector(".user-detail__avatar-img");
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
  const userName = document.querySelector(".user-detail__name");

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
