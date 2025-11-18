import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

// UserDetail.js - Xử lý tương tác cho trang User Detail
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => getUserDetail(), 1500);

  // Toast functionality
  const toast = document.querySelector(".user-detail__toast");
  const toastButton = document.querySelector(".user-detail__toast-btn");

  if (toastButton) {
    toastButton.addEventListener("click", function () {
      toast.classList.remove("user-detail__toast--show");
    });
  }

  // Handle Save Personal Info button
  const savePersonalInfoBtn = document.querySelector(".save-personal-info");
  if (savePersonalInfoBtn) {
    savePersonalInfoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (validateForm()) {
        updateInformation();
      }
    });
  }

  // Handle Update Password button
  const updatePasswordBtn = document.querySelector(".update-password");
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener("click", function (e) {
      e.preventDefault();
      updatePassword();
    });
  }

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
  if (modal) {
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
        showToast("Hành động đã được xác nhận");
      });
    }
  }

  // Navigation functionality - Handle tab switching
  const navButtons = document.querySelectorAll(".user-detail__nav-btn");
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      navButtons.forEach((btn) =>
        btn.classList.remove("user-detail__nav-btn--active")
      );
      this.classList.add("user-detail__nav-btn--active");

      const sectionId = this.getAttribute("data-section");
      handleNavigation(sectionId);
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
    logoutButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("User signing out");

      // Xóa tất cả thông tin user khỏi localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");

      window.location.href = "/client/view/pages/HomePage.html";
    });
  }
});

// Load user detail
async function getUserDetail() {
  try {
    const token = localStorage.getItem("accessToken");
    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;
    if (!token) {
      setTimeout(() => {
        window.location.href = "../../Pages/Login.html";
      }, 1500);
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/authUser/userDetail/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Không thể tải thông tin người dùng");
    }
    const userData = await response.json();
    displayUserInformation(userData);
  } catch (error) {
    console.error("Error loading user info:", error);
    showToast("Lỗi khi tải thông tin người dùng");
  }
}

function displayUserInformation(userData) {
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const joinDateField = document.getElementById("joinDate");
  const userName = document.querySelector(".user-detail__name");

  if (nameField && userData.userName) nameField.value = userData.userName;
  if (emailField && userData.email) emailField.value = userData.email;

  const joinYear = userData.joinDate.split("-")[0];
  const joinMonth = userData.joinDate.split("-")[1];
  const joinDay =
    userData.joinDate.split("-")[2].split("")[0] +
    userData.joinDate.split("-")[2].split("")[1];
  const joinDate = joinDay + "/" + joinMonth + "/" + joinYear;
  if (joinDateField && userData.joinDate) {
    joinDateField.value = joinDate;
    joinDateField.setAttribute("readonly", true);
    joinDateField.style.cursor = "not-allowed";
  }
  if (userName && userData.userName) userName.textContent = userData.userName;
}

async function updateInformation() {
  try {
    const token = localStorage.getItem("accessToken");
    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;

    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");

    const updatedData = {
      name: nameField ? nameField.value.trim() : "",
      email: emailField ? emailField.value.trim() : "",
    };

    const response = await fetch(
      `http://localhost:5000/api/authUser/updateInfo/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      }
    );

    if (response.status !== 200) {
      throw new Error("Không thể cập nhật thông tin");
    }

    const result = await response.json();
    showToast("Thay đổi đã được lưu");
    if (result.userName) {
      const userName = document.querySelector(".user-detail__name");
      if (userName) userName.textContent = result.userName;
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    showToast("Lỗi khi lưu thông tin");
  }
}

async function updatePassword() {
  try {
    const token = localStorage.getItem("accessToken");
    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;

    const currentPasswordField = document.getElementById("current-password");
    const newPasswordField = document.getElementById("new-password");
    const confirmPasswordField = document.getElementById("confirm-password");

    // Kiểm tra nhập hợp lệ trước khi gửi
    if (
      !currentPasswordField.value.trim() ||
      !newPasswordField.value.trim() ||
      !confirmPasswordField.value.trim()
    ) {
      showToast("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPasswordField.value !== confirmPasswordField.value) {
      showToast("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPasswordField.value.length < 6) {
      showToast("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const updatedData = {
      currentPassword: currentPasswordField.value.trim(),
      newPassword: newPasswordField.value.trim(),
    };

    const response = await fetch(
      `http://localhost:5000/api/authUser/updatePassword/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      }
    );

    const result = await response.json();

    if (response.status === 200) {
      showToast(result.message || "Đổi mật khẩu thành công");

      // Reset ô input
      currentPasswordField.value = "";
      newPasswordField.value = "";
      confirmPasswordField.value = "";
    } else {
      showToast(result.message || "Đổi mật khẩu thất bại");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    showToast("Lỗi khi đổi mật khẩu");
  }
}

// Function to show toast message
function showToast(message) {
  const toast = document.querySelector(".user-detail__toast");
  const toastText = toast.querySelector("span");

  if (toastText) {
    toastText.textContent = message;
  } else {
    toast.childNodes[0].textContent = message + " ";
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
function handleNavigation(sectionId) {
  // Hide all sections
  const allSections = document.querySelectorAll(".user-detail__section");
  allSections.forEach((section) => {
    section.classList.remove("user-detail__section--active");
  });

  // Show selected section
  const targetSection = document.getElementById(`${sectionId}-section`);
  if (targetSection) {
    targetSection.classList.add("user-detail__section--active");
  }

  console.log("Navigated to:", sectionId);
}

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
  const userName = document.querySelector(".user-detail__name");

  if (nameField && userData.name) nameField.value = userData.name;
  if (emailField && userData.email) emailField.value = userData.email;
  if (userName && userData.name) userName.textContent = userData.name;
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
