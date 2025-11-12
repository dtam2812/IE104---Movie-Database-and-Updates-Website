import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

// UserDetail.js - Xử lý tương tác cho trang User Detail
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => getUserDetail(), 1500);

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
        updateInformation();
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
  const userName = document.querySelector(".sidebar .name");

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
      `http://localhost:5000/api/authUser/update/${userId}`,
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
      const userName = document.querySelector(".sidebar .name");
      if (userName) userName.textContent = result.userName;
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    showToast("Lỗi khi lưu thông tin");
  }
}

// Function to show toast message
function showToast(message) {
  const toast = document.querySelector(".toast");
  const toastText = toast.querySelector("span");

  if (toastText) {
    toastText.textContent = message;
  } else {
    toast.childNodes[0].textContent = message + " ";
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
      // Load personal information section
      console.log("Loading personal information...");
      break;
    case "Yêu thích":
      // Load favorites section
      console.log("Loading favorites...");
      // You can redirect or load content dynamically here
      // window.location.href = "../../Pages/Favorites.html";
      break;
    case "Cài đặt":
      // Load settings section
      console.log("Loading settings...");
      // window.location.href = "../../Pages/Settings.html";
      break;
    default:
      console.log("Unknown section:", section);
  }
}

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
  const userName = document.querySelector(".sidebar .name");

  if (nameField && userData.name) nameField.value = userData.name;
  if (emailField && userData.email) emailField.value = userData.email;
  if (phoneField && userData.phone) phoneField.value = userData.phone;
  if (birthdayField && userData.birthday)
    birthdayField.value = userData.birthday;
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
