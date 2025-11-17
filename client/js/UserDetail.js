import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

// Global translations object
let translations = {};

// Load translations based on current language
async function loadTranslations() {
  const lang = localStorage.getItem('language') || 'vi';
  try {
    const res = await fetch(`../../../public/locales/${lang}.json`);
    translations = await res.json();
    console.log(`✅ Loaded ${lang} translations:`, Object.keys(translations).length, 'keys');
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
}

// Get translation by key
function t(key) {
  const value = translations[key];
  if (!value) {
    console.warn(`⚠️ Missing translation for key: ${key}`);
    return key;
  }
  return value;
}

// Listen for language changes
window.addEventListener('languagechange', async (e) => {
  console.log('🔄 Language changed to:', e.detail.lang);
  await loadTranslations();
});

// Hàm khởi tạo tất cả event listeners và chức năng
export async function initUserDetail() {
  // Load translations first
  await loadTranslations();
  
  // Load user detail sau 500ms
  setTimeout(() => getUserDetail(), 500);

  // Toast functionality
  const toast = document.querySelector(".toast");
  const toastButton = document.querySelector(".toast button");

  if (toastButton) {
    toastButton.addEventListener("click", function () {
      toast.classList.remove("show");
    });
  }

  // Handle Save Personal Info button
  const savePersonalInfoBtn = document.querySelector(".save-personal-info");
  if (savePersonalInfoBtn) {
    console.log("✅ Found save button");
    savePersonalInfoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (validateForm()) {
        updateInformation();
      }
    });
  } else {
    console.error("❌ Save button not found");
  }

  // Handle Update Password button
  const updatePasswordBtn = document.querySelector(".update-password");
  if (updatePasswordBtn) {
    console.log("✅ Found password button");
    updatePasswordBtn.addEventListener("click", function (e) {
      e.preventDefault();
      updatePassword();
    });
  } else {
    console.error("❌ Password button not found");
  }

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
  if (modal) {
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
        showToast(t("userdetail.actionConfirmed"));
      });
    }
  }

  // Navigation functionality - Handle tab switching
  const navButtons = document.querySelectorAll(".nav button");
  console.log(`✅ Found ${navButtons.length} navigation buttons`);
  
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      navButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

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
  const logoutButton = document.querySelector(".logout");
  if (logoutButton) {
    console.log("✅ Found logout button");
    logoutButton.addEventListener("click", function () {
      if (confirm(t("userdetail.logoutConfirm"))) {
        showToast(t("userdetail.logoutSuccess"));
        setTimeout(() => {
          window.location.href = "../pages/HomePage.html";
        }, 1000);
      }
    });
  }

  // Favorites links
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

  console.log("✅ UserDetail initialized successfully");
}

// Load user detail
async function getUserDetail() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setTimeout(() => {
        window.location.href = "../pages/HomePage.html";
      }, 1500);
      return;
    }

    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;

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
      throw new Error("Cannot load user information");
    }

    const userData = await response.json();
    displayUserInformation(userData);
  } catch (error) {
    console.error("Error loading user info:", error);
    showToast(t("userdetail.errors.loadUserFailed"));
  }
}

function displayUserInformation(userData) {
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const joinDateField = document.getElementById("joinDate");
  const userName = document.querySelector(".sidebar .name");

  if (nameField && userData.userName) nameField.value = userData.userName;
  if (emailField && userData.email) emailField.value = userData.email;

  if (userData.joinDate) {
    const [year, month, day] = userData.joinDate.split("-");
    const joinDate = `${day.substring(0, 2)}/${month}/${year}`;
    
    if (joinDateField) {
      joinDateField.value = joinDate;
      joinDateField.setAttribute("readonly", true);
      joinDateField.style.cursor = "not-allowed";
    }
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
      throw new Error("Cannot update information");
    }

    const result = await response.json();
    showToast(t("userdetail.changesSaved"));
    
    if (result.userName) {
      const userName = document.querySelector(".sidebar .name");
      if (userName) userName.textContent = result.userName;
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    showToast(t("userdetail.errors.saveInfoFailed"));
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

    if (
      !currentPasswordField.value.trim() ||
      !newPasswordField.value.trim() ||
      !confirmPasswordField.value.trim()
    ) {
      showToast(t("userdetail.errors.fillAllFields"));
      return;
    }

    if (newPasswordField.value !== confirmPasswordField.value) {
      showToast(t("userdetail.errors.passwordNotMatch"));
      return;
    }

    if (newPasswordField.value.length < 6) {
      showToast(t("userdetail.errors.passwordTooShort"));
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
      showToast(result.message || t("userdetail.passwordChangeSuccess"));
      currentPasswordField.value = "";
      newPasswordField.value = "";
      confirmPasswordField.value = "";
    } else {
      showToast(result.message || t("userdetail.passwordChangeFailed"));
    }
  } catch (error) {
    console.error("Error updating password:", error);
    showToast(t("userdetail.errors.changePasswordFailed"));
  }
}

// Function to show toast message
function showToast(message) {
  console.log("🔍 showToast called with:", message);

  const toast = document.querySelector(".toast");
  if (!toast) {
    console.error("❌ Toast element not found!");
    return;
  }

  const toastText = toast.querySelector("span");
  if (toastText) {
    toastText.textContent = message;
  } else {
    toast.childNodes[0].textContent = message + " ";
  }

  toast.classList.add("show");
  console.log("✅ Toast class:", toast.className);

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showModal() {
  const modal = document.querySelector(".modal-backdrop");
  if (modal) modal.style.display = "flex";
}

function hideModal() {
  const modal = document.querySelector(".modal-backdrop");
  if (modal) modal.style.display = "none";
}

function validateForm() {
  let isValid = true;

  const requiredFields = document.querySelectorAll("input[required]");
  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      showError(field, t("userdetail.errors.fieldRequired"));
      isValid = false;
    } else {
      clearError(field);
    }
  });

  const emailField = document.getElementById("email");
  if (emailField && emailField.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      showError(emailField, t("userdetail.errors.invalidEmail"));
      isValid = false;
    }
  }

  const newPassword = document.getElementById("new-password");
  const confirmPassword = document.getElementById("confirm-password");

  if (newPassword && confirmPassword && newPassword.value && confirmPassword.value) {
    if (newPassword.value !== confirmPassword.value) {
      showError(confirmPassword, t("userdetail.errors.passwordNotMatch"));
      isValid = false;
    }
  }

  return isValid;
}

function validatePasswordField(field) {
  if (field.value && field.value.length < 6) {
    showError(field, t("userdetail.errors.passwordTooShort"));
    return false;
  } else {
    clearError(field);
    return true;
  }
}

function showError(field, message) {
  field.classList.add("input-invalid");

  const existingError = field.parentNode.querySelector(".error");
  if (existingError) existingError.remove();

  const errorElement = document.createElement("div");
  errorElement.className = "error";
  errorElement.textContent = message;
  errorElement.style.display = "block";

  field.parentNode.appendChild(errorElement);
}

function clearError(field) {
  field.classList.remove("input-invalid");
  const errorElement = field.parentNode.querySelector(".error");
  if (errorElement) errorElement.remove();
}

function handleNavigation(section) {
  const sectionMap = {
    "personal-info": "personal-info-section",
    "favorites": "favorites-section"
  };

  const targetSectionId = sectionMap[section];
  if (targetSectionId) {
    showSection(targetSectionId);
  } else {
    console.log("Unknown section:", section);
  }
}

function showSection(sectionId) {
  const allSections = document.querySelectorAll(".content-section");
  allSections.forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
    setTimeout(() => {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }
}