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
  const verifyForm = document.querySelector(".form-wrapper.verify");

  const registerFormEl = registerForm.querySelector("form");
  const resetFormEl = resetForm.querySelector("form");
  const forgotFormEl = forgotForm.querySelector("form");
  const verifyFormEl = verifyForm.querySelector("form");

  let forgotPasswordEmail = "";
  let resendTimer = null;
  let resendCountdown = 0;

  function showErrorMessage(formWrapper, message, isSuccess = false) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    const errorText = errorDiv.querySelector(".error-text");
    const icon = errorDiv.querySelector("i");

    if (errorDiv && errorText) {
      errorText.textContent = message;

      if (isSuccess) {
        errorDiv.style.background = "#d4edda";
        errorDiv.style.color = "#155724";
        errorDiv.style.borderColor = "#c3e6cb";
        icon.className = "fa-solid fa-check-circle";
      } else {
        errorDiv.style.background = "#fff3cd";
        errorDiv.style.color = "#856404";
        errorDiv.style.borderColor = "#ffc107";
        icon.className = "fa-solid fa-exclamation-triangle";
      }

      errorDiv.style.display = "flex";

      setTimeout(() => {
        errorDiv.classList.add("show");
      }, 10);

      setTimeout(() => {
        errorDiv.classList.remove("show");
        setTimeout(() => {
          errorDiv.style.display = "none";
        }, 300);
      }, 5000);
    }
  }

  function hideErrorMessage(formWrapper) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 300);
    }
  }

  function startResendTimer() {
    resendCountdown = 300; // 5 phút = 300 giây
    const resendLink = verifyForm.querySelector(".switch-form:not([href])");

    if (!resendLink) return;

    function updateTimer() {
      const minutes = Math.floor(resendCountdown / 60);
      const seconds = resendCountdown % 60;
      resendLink.textContent = `Gửi lại OTP (${minutes}:${seconds
        .toString()
        .padStart(2, "0")})`;
      resendLink.style.color = "#ffffff80";
      resendLink.style.cursor = "not-allowed";
      resendLink.style.pointerEvents = "none";
    }

    updateTimer();

    resendTimer = setInterval(() => {
      resendCountdown--;

      if (resendCountdown <= 0) {
        clearInterval(resendTimer);
        resendLink.textContent = "Gửi lại mã OTP";
        resendLink.style.color = "#ffd875";
        resendLink.style.cursor = "pointer";
        resendLink.style.pointerEvents = "auto";
      } else {
        updateTimer();
      }
    }, 1000);
  }

  function stopResendTimer() {
    if (resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }

  window.openLRFModal = function (target = "login") {
    modal.classList.remove("hidden");
    [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach((f) =>
      f.classList.remove("active")
    );

    if (target === "register") registerForm.classList.add("active");
    else if (target === "forgot") forgotForm.classList.add("active");
    else if (target === "reset") resetForm.classList.add("active");
    else if (target === "verify") {
      verifyForm.classList.add("active");
      startResendTimer();
    } else loginForm.classList.add("active");
  };

  function closeLRFModal() {
    modal.classList.add("hidden");
    stopResendTimer();
    [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach(
      (form) => hideErrorMessage(form)
    );
  }

  backdrop.addEventListener("click", closeLRFModal);
  closeBtn.addEventListener("click", closeLRFModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLRFModal();
  });

  switchLink.forEach((link) => {
    link.addEventListener("click", () => {
      [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach(
        (form) => hideErrorMessage(form)
      );

      const text = link.textContent.trim();
      if (text.includes("Đăng ký ngay")) window.openLRFModal("register");
      else if (
        text.includes("Đăng nhập") ||
        text.includes("Quay lại đăng nhập")
      ) {
        stopResendTimer();
        window.openLRFModal("login");
      } else if (text.includes("Quên mật khẩu?")) window.openLRFModal("forgot");
      else if (text.includes("Gửi lại")) {
        if (resendCountdown <= 0 && forgotPasswordEmail) {
          resendOTP();
        }
      }
    });
  });

  async function resendOTP() {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        }
      );

      if (response.status === 200) {
        showErrorMessage(verifyForm, "Mã OTP mới đã được gửi!", true);
        startResendTimer();
      } else {
        const errorText = await response.text();
        showErrorMessage(verifyForm, errorText || "Không thể gửi lại OTP!");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      showErrorMessage(verifyForm, "Lỗi kết nối. Vui lòng thử lại!");
    }
  }

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
        showErrorMessage(
          loginForm,
          "Đăng ký thành công! Vui lòng đăng nhập.",
          true
        );
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

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("userName", payloadDecoded.username);
        localStorage.setItem("userEmail", payloadDecoded.email);

        document.dispatchEvent(
          new CustomEvent("userLoggedIn", { detail: data })
        );

        modal.classList.add("hidden");

        if (payloadDecoded.role === "Admin") {
          window.location.href = "/client/view/pages/AdminUsers.html";
        } else {
          window.location.href = "/client/view/pages/HomePage.html";
        }
      } else {
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

  forgotFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = forgotFormEl
      .querySelector('input[name="email"]')
      .value.trim();

    if (!email) {
      showErrorMessage(forgotForm, "Vui lòng nhập email!");
      return;
    }

    const submitButton = forgotFormEl.querySelector(".btn-primary");
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Đang gửi...";

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgotPassword",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (response.status === 200) {
        forgotPasswordEmail = email;
        forgotFormEl.reset();
        window.openLRFModal("verify");
        showErrorMessage(
          verifyForm,
          "Mã OTP đã được gửi đến email của bạn!",
          true
        );
      } else {
        const errorText = await response.text();
        showErrorMessage(
          forgotForm,
          errorText || "Không thể gửi yêu cầu. Vui lòng thử lại!"
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      showErrorMessage(forgotForm, "Lỗi kết nối. Vui lòng thử lại!");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  verifyFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const otpInput = verifyFormEl.querySelector('input[name="otp"]');
    const otp = otpInput.value.trim();

    if (!otp) {
      showErrorMessage(verifyForm, "Vui lòng nhập mã OTP!");
      return;
    }

    if (!forgotPasswordEmail) {
      showErrorMessage(
        verifyForm,
        "Phiên làm việc đã hết hạn. Vui lòng thử lại!"
      );
      return;
    }

    const submitButton = verifyFormEl.querySelector(".btn-primary");
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Đang xác thực...";

    try {
      const response = await fetch("http://localhost:5000/api/auth/verifyOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, otp }),
      });

      if (response.status === 200) {
        stopResendTimer();
        verifyFormEl.reset();
        window.openLRFModal("reset");
        showErrorMessage(
          resetForm,
          "Xác thực thành công! Vui lòng nhập mật khẩu mới.",
          true
        );
      } else {
        const errorText = await response.text();
        showErrorMessage(
          verifyForm,
          errorText || "Mã OTP không đúng. Vui lòng thử lại!"
        );
        otpInput.classList.add("otp-error");
        setTimeout(() => otpInput.classList.remove("otp-error"), 2000);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      showErrorMessage(verifyForm, "Lỗi kết nối. Vui lòng thử lại!");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  resetFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isValid = resetFormEl.checkValidity();
    if (!isValid || resetSubmitBtn.disabled) return;

    const newPassword = resetFormEl
      .querySelector('input[name="new_password"]')
      .value.trim();

    if (!forgotPasswordEmail) {
      showErrorMessage(
        resetForm,
        "Phiên làm việc đã hết hạn. Vui lòng thử lại!"
      );
      return;
    }

    const originalText = resetSubmitBtn.textContent;
    resetSubmitBtn.disabled = true;
    resetSubmitBtn.textContent = "Đang xử lý...";

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/resetPassword",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail, newPassword }),
        }
      );

      if (response.status === 200) {
        forgotPasswordEmail = "";
        resetFormEl.reset();
        window.openLRFModal("login");
        showErrorMessage(
          loginForm,
          "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.",
          true
        );
      } else {
        const errorText = await response.text();
        showErrorMessage(
          resetForm,
          errorText || "Không thể đặt lại mật khẩu. Vui lòng thử lại!"
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showErrorMessage(resetForm, "Lỗi kết nối. Vui lòng thử lại!");
    } finally {
      resetSubmitBtn.disabled = false;
      resetSubmitBtn.textContent = originalText;
    }
  });
}

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
