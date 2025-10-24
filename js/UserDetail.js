(function () {
  const form = document.getElementById("accountForm");
  const toast = document.getElementById("toast");
  const toastClose = document.getElementById("toastClose");
  const avatarInput = document.getElementById("avatarInput");
  const avatarImg = document.getElementById("avatarImg");
  const displayName = document.getElementById("displayName");
  const emailShort = document.getElementById("emailShort");
  const submitBtn = document.getElementById("submitBtn");
  const profileKey = "rop_h_profile_v1";
  const MAX_IMAGE_WIDTH = 512; // px
  const MAX_IMAGE_BYTES = 1024 * 1024; // 1MB after compress try

  // helper: validate email
  function isValidEmail(email) {
    if (!email) return false;
    // simple but practical regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // show toast
  let toastTimer = null;
  function showToast(msg, ms = 2600) {
    toast.setAttribute("aria-hidden", "false");
    toast.dataset.msg = msg;
    toast.classList.add("show");
    toast.firstChild && (toast.firstChild.textContent = msg);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      toast.setAttribute("aria-hidden", "true");
    }, ms);
  }

  toastClose.addEventListener("click", () => {
    toast.classList.remove("show");
  });

  // load saved profile
  function load() {
    try {
      const s = localStorage.getItem(profileKey);
      if (!s) return;
      const p = JSON.parse(s);
      if (p.email)
        (document.getElementById("email").value = p.email),
          (emailShort.textContent = p.email);
      if (p.display)
        (document.getElementById("display").value = p.display),
          (displayName.textContent = p.display);
      if (p.gender) {
        const r = document.querySelector(
          'input[name="gender"][value="' + p.gender + '"]'
        );
        if (r) r.checked = true;
      }
      if (p.avatar) avatarImg.src = p.avatar;
    } catch (e) {
      console.warn(e);
    }
  }

  // utility: resize image with canvas to limit dimensions and quality
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
      };
      reader.onerror = reject;
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = Math.min(1, MAX_IMAGE_WIDTH / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // try jpeg first for smaller size, fallback to png
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Không thể xử lý ảnh"));
              return;
            }
            if (blob.size <= MAX_IMAGE_BYTES) {
              const r = new File([blob], file.name, { type: blob.type });
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result);
              fr.onerror = reject;
              fr.readAsDataURL(r);
            } else {
              // try reduce quality (jpeg)
              canvas.toBlob(
                (b2) => {
                  if (!b2) {
                    reject(new Error("Không thể nén ảnh"));
                    return;
                  }
                  const r2 = new File([b2], file.name, { type: b2.type });
                  const fr2 = new FileReader();
                  fr2.onload = () => resolve(fr2.result);
                  fr2.onerror = reject;
                  fr2.readAsDataURL(r2);
                },
                "image/jpeg",
                0.7
              );
            }
          },
          "image/jpeg",
          0.9
        );
      };
      reader.readAsDataURL(file);
    });
  }

  // Save profile object
  function persistProfile(profile) {
    try {
      localStorage.setItem(profileKey, JSON.stringify(profile));
    } catch (e) {
      console.warn(e);
    }
  }

  function getProfile() {
    try {
      const s = localStorage.getItem(profileKey);
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  }

  // form validation and submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById("email");
    const displayEl = document.getElementById("display");
    const emailVal = emailEl.value.trim();
    const displayVal = displayEl.value.trim();
    let ok = true;
    // reset
    emailEl.classList.remove("input-invalid");
    displayEl.classList.remove("input-invalid");
    document.getElementById("emailError").style.display = "none";
    document.getElementById("displayError").style.display = "none";
    if (!isValidEmail(emailVal)) {
      document.getElementById("emailError").textContent =
        "Vui lòng nhập email hợp lệ.";
      document.getElementById("emailError").style.display = "block";
      emailEl.classList.add("input-invalid");
      ok = false;
    }
    if (!displayVal) {
      document.getElementById("displayError").textContent =
        "Tên hiển thị không được để trống.";
      document.getElementById("displayError").style.display = "block";
      displayEl.classList.add("input-invalid");
      ok = false;
    }
    if (!ok) {
      showToast("Vui lòng sửa các trường");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang lưu...";
    const fd = new FormData(form);
    const profile = getProfile();
    profile.email = emailVal;
    profile.display = displayVal;
    profile.gender = fd.get("gender") || "unspecified";
    // avatarImg.src already updated when user selected file
    profile.avatar = avatarImg.src || "";
    persistProfile(profile);
    displayName.textContent = profile.display || "Người dùng";
    emailShort.textContent = profile.email || "—";
    showToast("Thông tin đã được cập nhật");
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Cập nhật";
    }, 600);
  });

  // avatar input change: resize/compress then save
  avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // simple validation
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp ảnh hợp lệ");
      return;
    }
    try {
      submitBtn.disabled = true;
      const dataUrl = await compressImage(file);
      avatarImg.src = dataUrl;
      const profile = getProfile();
      profile.avatar = dataUrl;
      persistProfile(profile);
      showToast("Ảnh avatar đã được cập nhật");
    } catch (err) {
      console.warn(err);
      showToast("Không thể xử lý ảnh");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // accessible keyboard trigger for changePwd
  const changePwd = document.getElementById("changePwd");
  const pwdModal = document.getElementById("pwdModal");
  const pwdCancel = document.getElementById("pwdCancel");
  const pwdSubmit = document.getElementById("pwdSubmit");
  const pwdOld = document.getElementById("pwdOld");
  const pwdNew = document.getElementById("pwdNew");

  function openPwdModal() {
    pwdModal.style.display = "flex";
    pwdModal.setAttribute("aria-hidden", "false");
    pwdOld.focus();
  }
  function closePwdModal() {
    pwdModal.style.display = "none";
    pwdModal.setAttribute("aria-hidden", "true");
    changePwd.focus();
  }

  changePwd.addEventListener("click", openPwdModal);
  changePwd.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPwdModal();
    }
  });
  pwdCancel.addEventListener("click", () => {
    closePwdModal();
    showToast("Hủy đổi mật khẩu");
  });
  pwdSubmit.addEventListener("click", () => {
    closePwdModal();
    showToast("Đổi mật khẩu (demo)");
  });

  // Esc to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (pwdModal.style.display === "flex") closePwdModal();
    }
  });

  // logout confirm
  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn đăng xuất? (demo)")) {
      localStorage.removeItem(profileKey);
      showToast("Đã đăng xuất (demo)");
      setTimeout(() => location.reload(), 900);
    }
  });

  // small UX: focus first invalid on input blur
  ["email", "display"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("blur", () => {
      if (id === "email" && !isValidEmail(el.value.trim())) {
        el.classList.add("input-invalid");
        document.getElementById("emailError").style.display = "block";
      }
      if (id === "display" && !el.value.trim()) {
        el.classList.add("input-invalid");
        document.getElementById("displayError").style.display = "block";
      }
    });
    el.addEventListener("input", () => {
      el.classList.remove("input-invalid");
      document.getElementById(id + "Error").style.display = "none";
    });
  });

  // keyboard shortcut to focus display (cmd/ctrl+k)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      document.getElementById("display").focus();
    }
  });

  // progressive enhancement: allow paste image from clipboard onto avatar
  avatarImg.addEventListener("paste", async (ev) => {
    const items = ev.clipboardData && ev.clipboardData.items;
    if (!items) return;
    for (const it of items) {
      if (it.type && it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) {
          try {
            const dataUrl = await compressImage(file);
            avatarImg.src = dataUrl;
            const p = getProfile();
            p.avatar = dataUrl;
            persistProfile(p);
            showToast("Ảnh avatar đã được dán và lưu");
          } catch (err) {
            console.warn(err);
            showToast("Không thể xử lý ảnh dán");
          }
        }
        break;
      }
    }
  });

  // initial load
  load();
})();
