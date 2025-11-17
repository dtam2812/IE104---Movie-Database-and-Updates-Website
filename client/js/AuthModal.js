import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

export function Auth_Modaljs() {
  const modal = document.querySelector(".modal");
  const backdrop = document.querySelector(".modal_backdrop");
  const closeBtn = document.querySelector(".modal_close");
  const switchLink = document.querySelectorAll(".switch-form");
  const loginForm = document.querySelector(".form-wrapper.login");
  const registerForm = document.querySelector(".form-wrapper.register");
  const forgotForm = document.querySelector(".form-wrapper.forgot");
  const resetForm = document.querySelector(".form-wrapper.reset");
  const registerFormEl = registerForm.querySelector("form");
  const resetFormEl = resetForm.querySelector("form");

  // Biến lưu email khi forgot password
  let forgotPasswordEmail = "";

  // Hàm hiển thị thông báo lỗi
  function showErrorMessage(formWrapper, message) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    const errorText = errorDiv.querySelector(".error-text");

    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.style.display = "flex";

      // Trigger animation
      setTimeout(() => {
        errorDiv.classList.add("show");
      }, 10);

      // Tự động ẩn sau 5 giây
      setTimeout(() => {
        errorDiv.classList.remove("show");
        setTimeout(() => {
          errorDiv.style.display = "none";
        }, 300);
      }, 5000);
    }
  }

  // Hàm ẩn thông báo lỗi
  function hideErrorMessage(formWrapper) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 300);
    }
  }

  window.openLRFModal = function (target = "login") {
    modal.classList.remove("hidden");
    [loginForm, registerForm, forgotForm, resetForm].forEach((f) =>
      f.classList.remove("active")
    );
    if (target === "register") registerForm.classList.add("active");
    else if (target === "forgot") forgotForm.classList.add("active");
    else if (target === "reset") resetForm.classList.add("active");
    else loginForm.classList.add("active");
  };

  function closeLRFModal() {
    modal.classList.add("hidden");
    // Ẩn tất cả error messages khi đóng modal
    [loginForm, registerForm, forgotForm, resetForm].forEach((form) =>
      hideErrorMessage(form)
    );
  }

  backdrop.addEventListener("click", closeLRFModal);
  closeBtn.addEventListener("click", closeLRFModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLRFModal();
  });

  // Switch form events
  switchLink.forEach((link) => {
    link.addEventListener("click", () => {
      // Ẩn error messages khi chuyển form
      [loginForm, registerForm, forgotForm, resetForm].forEach((form) =>
        hideErrorMessage(form)
      );

      const text = link.textContent.trim();
      if (text.includes("Đăng ký ngay")) window.openLRFModal("register");
      else if (
        text.includes("Đăng nhập") ||
        text.includes("Quay lại đăng nhập")
      )
        window.openLRFModal("login");
      else if (text.includes("Quên mật khẩu?")) window.openLRFModal("forgot");
    });
  });

  // Password validation for register form
  const pwdInput = registerFormEl.querySelector('input[name="password"]');
  const cfPwdInput = registerFormEl.querySelector('input[name="cf_password"]');
  const submitBtn = registerFormEl.querySelector(".btn.btn-primary");
  const errorMessage = registerFormEl.querySelector(".non-same-pw");

  function validatePasswords() {
    if (
      pwdInput.value &&
      cfPwdInput.value &&
      pwdInput.value !== cfPwdInput.value
    ) {
      errorMessage.style.display = "block";
      cfPwdInput.style.border = "1px solid red";
      submitBtn.disabled = true;
    } else {
      errorMessage.style.display = "none";
      cfPwdInput.style.border = "";
      submitBtn.disabled = false;
    }
  }

  pwdInput.addEventListener("input", validatePasswords);
  cfPwdInput.addEventListener("input", validatePasswords);

  // Password validation for reset password form
  const newPwdInput = resetFormEl.querySelector('input[name="new_password"]');
  const cfNewPwdInput = resetFormEl.querySelector(
    'input[name="cf_new_password"]'
  );
  const resetSubmitBtn = resetFormEl.querySelector(".btn.btn-primary");
  const resetErrorMessage = resetFormEl.querySelector(".non-same-pw");

  function validateResetPasswords() {
    if (
      newPwdInput.value &&
      cfNewPwdInput.value &&
      newPwdInput.value !== cfNewPwdInput.value
    ) {
      resetErrorMessage.style.display = "block";
      cfNewPwdInput.style.border = "1px solid red";
      resetSubmitBtn.disabled = true;
    } else {
      resetErrorMessage.style.display = "none";
      cfNewPwdInput.style.border = "";
      resetSubmitBtn.disabled = false;
    }
  }

  newPwdInput.addEventListener("input", validateResetPasswords);
  cfNewPwdInput.addEventListener("input", validateResetPasswords);

  // Register form submit
  registerFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isValid = registerFormEl.checkValidity();
    if (!isValid || submitBtn.disabled) return;

    const userName = registerFormEl
      .querySelector('input[name="name"]')
      .value.trim();
    const email = registerFormEl
      .querySelector('input[name="email"]')
      .value.trim();
    const password = registerFormEl
      .querySelector('input[name="password"]')
      .value.trim();

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, email, password }),
      });

      if (response.status === 200) {
        registerFormEl.reset();
        window.openLRFModal("login");
      } else {
        const errorText = await response.text();
        showErrorMessage(
          registerForm,
          errorText || "Không thể đăng ký. Vui lòng thử lại!"
        );
      }
    } catch (error) {
      console.error("Register error:", error);
      showErrorMessage(registerForm, "Lỗi kết nối. Vui lòng thử lại!");
    }
  });

  // Login form submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[name="email"]').value.trim();
    const password = loginForm
      .querySelector('input[name="password"]')
      .value.trim();

    if (!email || !password) {
      showErrorMessage(loginForm, "Vui lòng nhập email và mật khẩu!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        const data = await response.json();
        const accessToken = data.accessToken;
        const payloadDecoded = jwtDecode(accessToken);

        if (payloadDecoded.status === "Banned") {
          showErrorMessage(loginForm, "Tài khoản của bạn đã bị chặn.");
          return;
        }

        // Lưu token và thông tin user
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("userName", payloadDecoded.username);
        localStorage.setItem("userEmail", payloadDecoded.email);

        // Token check sẽ được start từ Header.js sau khi reload

        // Dispatch event để cập nhật UI
        document.dispatchEvent(
          new CustomEvent("userLoggedIn", { detail: data })
        );

        // Đóng modal
        modal.classList.add("hidden");

        console.log("User role:", payloadDecoded.role);

        if (payloadDecoded.role === "Admin") {
          window.location.href = "/client/view/pages/AdminUsers.html";
        } else {
          window.location.href = "/client/view/pages/HomePage.html";
        }
      } else {
        // login error (400/401)
        const errorText = await response.text();
        showErrorMessage(
          loginForm,
          errorText || "Email hoặc mật khẩu không đúng!"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      showErrorMessage(loginForm, "Lỗi kết nối. Vui lòng thử lại!");
    }
  });

  // Forgot password form submit
  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = forgotForm.querySelector('input[name="email"]').value.trim();

    if (!email) {
      showErrorMessage(forgotForm, "Vui lòng nhập email!");
      return;
    }

    // Lưu email để dùng khi reset password
    forgotPasswordEmail = email;

    // Reset form và chuyển sang form reset password
    forgotForm.querySelector("form").reset();
    window.openLRFModal("reset");
  });

  // Reset password form submit
  resetFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const isValid = resetFormEl.checkValidity();
    if (!isValid || resetSubmitBtn.disabled) return;

    const newPassword = resetFormEl
      .querySelector('input[name="new_password"]')
      .value.trim();

    // Reset form và chuyển về login
    resetFormEl.reset();
    forgotPasswordEmail = ""; // Clear email
    window.openLRFModal("login");
  });
}

// Helper function để check token expired (optional, dùng khi cần)
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp && decoded.exp < now;
  } catch {
    return true;
  }
}
