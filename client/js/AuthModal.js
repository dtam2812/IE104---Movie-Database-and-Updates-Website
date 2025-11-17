import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

export async function Auth_Modaljs() {
  // Không cần gọi initTranslate() vì HTML đã gọi rồi

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

  switchLink.forEach((link) => {
    link.addEventListener("click", () => {
      const key = link.getAttribute("data-i18n");
      
      // Kiểm tra key thay vì text để xác định form nào cần mở
      if (key === "auth.login.register_now") {
        window.openLRFModal("register");
      } else if (key === "auth.register.login_now" || key === "auth.forgot.login_now") {
        window.openLRFModal("login");
      } else if (key === "auth.login.forgot") {
        window.openLRFModal("forgot");
      }
    });
  });

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
      }
    } catch (error) {
      console.log(error);
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[name="email"]').value.trim();
    const password = loginForm
      .querySelector('input[name="password"]')
      .value.trim();

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

        if (payloadDecoded.role === "user") {
          window.location.href = "/client/view/pages/HomePage.html";
        } else {
          window.location.href = "/client/view/pages/AdminUsers.html";
        }

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("userName", payloadDecoded.username);
        localStorage.setItem("userEmail", payloadDecoded.email);
        document.dispatchEvent(
          new CustomEvent("userLoggedIn", { detail: data })
        );
        modal.classList.add("hidden");
      }
    } catch (error) {
      console.log(error);
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