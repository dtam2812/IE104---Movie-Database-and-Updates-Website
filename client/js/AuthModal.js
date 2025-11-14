import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

export function Auth_Modaljs() {
  const modal = document.querySelector(".modal");
  const backdrop = document.querySelector(".modal_backdrop");
  const closeBtn = document.querySelector(".modal_close");
  const switchLink = document.querySelectorAll(".switch-form");
  const loginForm = document.querySelector(".form-wrapper.login");
  const registerForm = document.querySelector(".form-wrapper.register");
  const forgotForm = document.querySelector(".form-wrapper.forgot");
  const primaryBtn = document.querySelectorAll(".btn.btn-primary");
  const registerFormEl = registerForm.querySelector("form");

  window.openLRFModal = function (target = "login") {
    modal.classList.remove("hidden");
    [loginForm, registerForm, forgotForm].forEach((f) =>
      f.classList.remove("active")
    );
    if (target === "register") registerForm.classList.add("active");
    else if (target === "forgot") forgotForm.classList.add("active");
    else loginForm.classList.add("active");
  };

  function closeLRFModal() {
    modal.classList.add("hidden");
  }

  backdrop.addEventListener("click", closeLRFModal);
  closeBtn.addEventListener("click", closeLRFModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLRFModal();
  });

  // Switch form events
  switchLink.forEach((link) => {
    link.addEventListener("click", () => {
      const text = link.textContent.trim();
      if (text.includes("Đăng kí ngay")) window.openLRFModal("register");
      else if (text.includes("Đăng nhập")) window.openLRFModal("login");
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
        window.openLRFModal("login");
      } else {
        const errorText = await response.text();
        alert("Lỗi đăng ký: " + errorText || "Không thể đăng ký. Thử lại!");
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("Lỗi kết nối. Vui lòng thử lại!");
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
      alert("Vui lòng nhập email và password!");
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
        
        if (payloadDecoded.role === "admin") {
          // Admin → redirect đến trang Admin
          console.log("Redirecting admin to AdminUsers.html");
          window.location.href = "/client/view/pages/AdminUsers.html";
        } else {
          // User thường → redirect đến HomePage
          console.log("Redirecting user to HomePage.html");
          window.location.href = "/client/view/pages/HomePage.html";
        }
      } else {
        // login error (400/401)
        const errorText = await response.text();
        alert("Lỗi đăng nhập: " + errorText || "Email hoặc password sai!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Lỗi kết nối. Vui lòng thử lại!");
    }
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