import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

export async function Auth_Modaljs() {
  // Không cần initTranslate() ở đây vì HTML đã gọi trước

  const modal            = document.querySelector(".modal");
  const backdrop         = document.querySelector(".modal_backdrop");
  const closeBtn         = document.querySelector(".modal_close");
  const switchLinks      = document.querySelectorAll(".switch-form");

  const loginForm        = document.querySelector(".form-wrapper.login");
  const registerForm     = document.querySelector(".form-wrapper.register");
  const forgotForm       = document.querySelector(".form-wrapper.forgot");
  const resetForm        = document.querySelector(".form-wrapper.reset");
  const verifyForm       = document.querySelector(".form-wrapper.verify");

  const registerFormEl   = registerForm.querySelector("form");
  const resetFormEl      = resetForm.querySelector("form");
  const forgotFormEl     = forgotForm.querySelector("form");
  const verifyFormEl     = verifyForm.querySelector("form");

  let forgotPasswordEmail = "";
  let resendTimer        = null;
  let resendCountdown    = 0;

  // ──────────────────────────────────────────────────────────────
  // Helper: hiển thị thông báo lỗi / thành công
  // ──────────────────────────────────────────────────────────────
  function showErrorMessage(formWrapper, message, isSuccess = false) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    const errorText = errorDiv?.querySelector(".error-text");
    const icon = errorDiv?.querySelector("i");

    if (!errorDiv || !errorText) return;

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
    setTimeout(() => errorDiv.classList.add("show"), 10);

    setTimeout(() => {
      errorDiv.classList.remove("show");
      setTimeout(() => errorDiv.style.display = "none", 300);
    }, 5000);
  }

  function hideErrorMessage(formWrapper) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      setTimeout(() => errorDiv.style.display = "none", 300);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Resend OTP timer
  // ──────────────────────────────────────────────────────────────
  function startResendTimer() {
    resendCountdown = 300; // 5 phút
    const resendLink = verifyForm.querySelector(".switch-form");

    if (!resendLink) return;

    function updateTimer() {
      const m = Math.floor(resendCountdown / 60);
      const s = (resendCountdown % 60).toString().padStart(2, "0");
      resendLink.textContent = `Gửi lại OTP (${m}:${s})`;
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

  // ──────────────────────────────────────────────────────────────
  // Mở / đóng modal
  // ──────────────────────────────────────────────────────────────
  window.openLRFModal = function (target = "login") {
    modal.classList.remove("hidden");

    [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach(f =>
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
    [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach(hideErrorMessage);
  }

  backdrop.addEventListener("click", closeLRFModal);
  closeBtn.addEventListener("click", closeLRFModal);
  document.addEventListener("keydown", e => e.key === "Escape" && closeLRFModal());

  // ──────────────────────────────────────────────────────────────
  // Switch form bằng data-i18n (không phụ thuộc vào text)
  // ──────────────────────────────────────────────────────────────
  switchLinks.forEach(link => {
    link.addEventListener("click", () => {
      [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach(hideErrorMessage);

      const key = link.getAttribute("data-i18n") || "";

      if (key === "auth.login.register_now") window.openLRFModal("register");
      else if (key === "auth.register.login_now" || key.includes("back_to_login")) window.openLRFModal("login");
      else if (key === "auth.login.forgot") window.openLRFModal("forgot");
      else if (key === "auth.verify.back_to_login") window.openLRFModal("login");
      // Resend OTP
      else if (key === "auth.verify.resend" && resendCountdown <= 0 && forgotPasswordEmail) {
        resendOTP();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Resend OTP
  // ──────────────────────────────────────────────────────────────
  async function resendOTP() {
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      if (res.ok) {
        showErrorMessage(verifyForm, "Mã OTP mới đã được gửi!", true);
        startResendTimer();
      } else {
        const txt = await res.text();
        showErrorMessage(verifyForm, txt || "Không thể gửi lại OTP!");
      }
    } catch (err) {
      showErrorMessage(verifyForm, "Lỗi kết nối. Vui lòng thử lại!");
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Validate mật khẩu (register + reset)
  // ──────────────────────────────────────────────────────────────
  const pwdInput      = registerFormEl.querySelector('input[name="password"]');
  const cfPwdInput    = registerFormEl.querySelector('input[name="cf_password"]');
  const regSubmitBtn  = registerFormEl.querySelector(".btn.btn-primary");
  const regErrorMsg   = registerFormEl.querySelector(".non-same-pw");

  const newPwdInput   = resetFormEl.querySelector('input[name="new_password"]');
  const cfNewPwdInput = resetFormEl.querySelector('input[name="cf_new_password"]');
  const resetSubmitBtn= resetFormEl.querySelector(".btn.btn-primary");
  const resetErrorMsg = resetFormEl.querySelector(".non-same-pw");

  function validatePasswords(pwd, cfPwd, errorEl, btn) {
    if (pwd.value && cfPwd.value && pwd.value !== cfPwd.value) {
      errorEl.style.display = "block";
      cfPwd.style.border = "1px solid red";
      btn.disabled = true;
    } else {
      errorEl.style.display = "none";
      cfPwd.style.border = "";
      btn.disabled = false;
    }
  }

  pwdInput.addEventListener("input", () => validatePasswords(pwdInput, cfPwdInput, regErrorMsg, regSubmitBtn));
  cfPwdInput.addEventListener("input", () => validatePasswords(pwdInput, cfPwdInput, regErrorMsg, regSubmitBtn));
  newPwdInput.addEventListener("input", () => validatePasswords(newPwdInput, cfNewPwdInput, resetErrorMsg, resetSubmitBtn));
  cfNewPwdInput.addEventListener("input", () => validatePasswords(newPwdInput, cfNewPwdInput, resetErrorMsg, resetSubmitBtn));

  // ──────────────────────────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────────────────────────
  registerFormEl.addEventListener("submit", async e => {
    e.preventDefault();
    if (!registerFormEl.checkValidity() || regSubmitBtn.disabled) return;

    const userName = registerFormEl.querySelector('input[name="name"]').value.trim();
    const email    = registerFormEl.querySelector('input[name="email"]').value.trim();
    const password = registerFormEl.querySelector('input[name="password"]').value.trim();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, email, password })
      });

      if (res.ok) {
        registerFormEl.reset();
        window.openLRFModal("login");
        showErrorMessage(loginForm, "Đăng ký thành công! Vui lòng đăng nhập.", true);
      } else {
        const txt = await res.text();
        showErrorMessage(registerForm, txt || "Không thể đăng ký!");
      }
    } catch (err) {
      showErrorMessage(registerForm, "Lỗi kết nối. Vui lòng thử lại!");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────────────
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email    = loginForm.querySelector('input[name="email"]').value.trim();
    const password = loginForm.querySelector('input[name="password"]').value.trim();

    if (!email || !password) {
      showErrorMessage(loginForm, "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.accessToken;
        const decoded = jwtDecode(token);

        if (decoded.status === "Banned") {
          showErrorMessage(loginForm, "Tài khoản của bạn đã bị chặn.");
          return;
        }

        localStorage.setItem("accessToken", token);
        localStorage.setItem("userName", decoded.username);
        localStorage.setItem("userEmail", decoded.email);

        document.dispatchEvent(new CustomEvent("userLoggedIn", { detail: data }));
        modal.classList.add("hidden");

        if (decoded.role === "Admin") {
          window.location.href = "/client/view/pages/AdminUsers.html";
        } else {
          window.location.href = "/client/view/pages/HomePage.html";
        }
      } else {
        const txt = await res.text();
        showErrorMessage(loginForm, txt || "Email hoặc mật khẩu không đúng!");
      }
    } catch (err) {
      showErrorMessage(loginForm, "Lỗi kết nối. Vui lòng thử lại!");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // Forgot → Verify → Reset (đầy đủ như file 1)
  // ──────────────────────────────────────────────────────────────
  forgotFormEl.addEventListener("submit", async e => {
    e.preventDefault();
    const email = forgotFormEl.querySelector('input[name="email"]').value.trim();
    if (!email) return showErrorMessage(forgotForm, "Vui lòng nhập email!");

    const btn = forgotFormEl.querySelector(".btn-primary");
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Đang gửi...";

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        forgotPasswordEmail = email;
        forgotFormEl.reset();
        window.openLRFModal("verify");
        showErrorMessage(verifyForm, "Mã OTP đã được gửi đến email của bạn!", true);
      } else {
        const txt = await res.text();
        showErrorMessage(forgotForm, txt || "Không thể gửi yêu cầu!");
      }
    } catch (err) {
      showErrorMessage(forgotForm, "Lỗi kết nối!");
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  verifyFormEl.addEventListener("submit", async e => {
    e.preventDefault();
    const otp = verifyFormEl.querySelector('input[name="otp"]').value.trim();
    if (!otp) return showErrorMessage(verifyForm, "Vui lòng nhập mã OTP!");

    const btn = verifyFormEl.querySelector(".btn-primary");
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Đang xác thực...";

    try {
      const res = await fetch("http://localhost:5000/api/auth/verifyOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, otp })
      });

      if (res.ok) {
        stopResendTimer();
        verifyFormEl.reset();
        window.openLRFModal("reset");
        showErrorMessage(resetForm, "Xác thực thành công! Nhập mật khẩu mới.", true);
      } else {
        const txt = await res.text();
        showErrorMessage(verifyForm, txt || "Mã OTP không đúng!");
      }
    } catch (err) {
      showErrorMessage(verifyForm, "Lỗi kết nối!");
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  resetFormEl.addEventListener("submit", async e => {
    e.preventDefault();
    if (!resetFormEl.checkValidity() || resetSubmitBtn.disabled) return;

    const newPassword = resetFormEl.querySelector('input[name="new_password"]').value.trim();

    const btn = resetSubmitBtn;
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";

    try {
      const res = await fetch("http://localhost:5000/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, newPassword })
      });

      if (res.ok) {
        forgotPasswordEmail = "";
        resetFormEl.reset();
        window.openLRFModal("login");
        showErrorMessage(loginForm, "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.", true);
      } else {
        const txt = await res.text();
        showErrorMessage(resetForm, txt || "Không thể đặt lại mật khẩu!");
      }
    } catch (err) {
      showErrorMessage(resetForm, "Lỗi kết nối!");
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });
}

// ──────────────────────────────────────────────────────────────
// Kiểm tra token hết hạn
// ──────────────────────────────────────────────────────────────
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}