import { usersData } from "./Data.js";

// Get current translations
let translations = {};
async function loadTranslations() {
  const lang = localStorage.getItem('language') || 'vi';
  try {
    const res = await fetch(`../../../public/locales/${lang}.json`);
    translations = await res.json();
  } catch (error) {
    console.error('Load translations failed:', error);
  }
}

// Helper function to get translated text
function t(key) {
  return translations[key] || key;
}

export async function AdminUsers_js() {
  // Load translations first
  await loadTranslations();

  const modalUser = document.querySelector(".modal-user");
  const addUserBtn = document.querySelector(".add-btn");
  const backdrop = document.querySelector(".modal-user .modal_backdrop");
  const closeBtn = document.querySelector(".modal-user .modal_close");
  const userForm = document.querySelector(".form-wrapper.user-form");
  const userFormEl = userForm.querySelector("form");
  const userCountHeading = document.querySelector(".dm-table-heading h2");
  const modalTitle = document.querySelector(".modal-title");
  const submitBtn = userFormEl.querySelector(".btn.btn-primary");

  let currentEditRow = null;
  let isEditMode = false;

  const tableBody = document.querySelector(".dm-table-body");

  // Avatar preview elements
  const avatarPreview = userForm.querySelector(".user-avatar");
  const avatarPreviewImg = avatarPreview.querySelector("img");
  const avatarInput = avatarPreview.querySelector(".avatar-input");

  const paginationLeft = document.querySelector(".pagination-left-arrow");
  const paginationRight = document.querySelector(".pagination-right-arrow");
  const currentPageSpan = document.querySelector(".pagination-page-current");
  const totalPagesSpan = document.querySelector(
    ".pagination__main span:last-child"
  );

  // SEARCH & FILTER
  const searchInput = document.querySelector(".search-input");
  const roleFilter = document.querySelector(".filter-select:nth-child(1)");
  const statusFilter = document.querySelector(".filter-select:nth-child(2)");

  let allUsers = [];

  const getListUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch("http://localhost:5000/auth/admin/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      allUsers = data;
      filteredUsers = [...allUsers];
      renderUsers();
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  getListUser();

  let filteredUsers = [...allUsers];
  let currentPage = 1;
  const usersPerPage = 5;

  // Password validation elements
  const pwdInput = userFormEl.querySelector('input[name="password"]');
  const cfPwdInput = userFormEl.querySelector('input[name="cf_password"]');
  const errorMessage = userFormEl.querySelector(".non-same-pw");

  // Auto-generate user ID
  function generateUserId() {
    if (allUsers.length === 0) {
      return "UIT001";
    }

    const maxNumber = allUsers.reduce((max, user) => {
      const match = user.id.match(/^UIT(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const newNumber = maxNumber + 1;
    return "UIT" + String(newNumber).padStart(3, "0");
  }

  // Calculate total pages
  function getTotalPages() {
    return Math.ceil(filteredUsers.length / usersPerPage);
  }

  // Get users for current page
  function getUsersForCurrentPage() {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }

  // SEARCH & FILTER
  function filterUsers() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const roleValue = roleFilter.value;
    const statusValue = statusFilter.value;

    filteredUsers = allUsers.filter((user) => {
      // Safely access properties with fallback
      const userName = (user.userName || user.name || '').toLowerCase();
      const userEmail = (user.email || '').toLowerCase();
      const userId = (user.id || '').toLowerCase();
      
      const matchSearch =
        userName.includes(searchTerm) ||
        userEmail.includes(searchTerm) ||
        userId.includes(searchTerm);

      const matchRole = roleValue === "all" || user.role === roleValue;
      const matchStatus = statusValue === "all" || user.status === statusValue;

      return matchSearch && matchRole && matchStatus;
    });

    const totalPages = getTotalPages();
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }

    renderUsers();
  }

  // Event listeners for search & filter
  searchInput.addEventListener("input", filterUsers);
  roleFilter.addEventListener("change", filterUsers);
  statusFilter.addEventListener("change", filterUsers);

  // Create user row
  function createUserRow(user, no) {
    const newRow = document.createElement("tr");
    newRow.dataset.userId = user.id;

    const noCell = document.createElement("td");
    noCell.textContent = no;
    newRow.appendChild(noCell);

    const userCell = document.createElement("td");
    userCell.classList.add("user-column");
    userCell.innerHTML = `
      <div class="td-user-info">
        <div class="td-user-avatar">
          <img src="${user.avatar}" alt="User Avatar" class="user-avatar-img">
        </div>
        <div class="td-user-name-email">
          <span class="name">${user.userName}</span><br>
          <span class="email">${user.email}</span>
        </div>
      </div>
    `;
    newRow.appendChild(userCell);

    const roleCell = document.createElement("td");
    roleCell.textContent = user.role;
    newRow.appendChild(roleCell);

    const statusCell = document.createElement("td");
    const isActive = user.status === "active";
    statusCell.innerHTML = `
      <label class="switch">
        <input type="checkbox" class="status-toggle" ${isActive ? "checked" : ""}>
        <span class="slider ${isActive ? "active" : "banned"}">
          <span class="text active-text">${t('admin.users.status.active')}</span>
          <span class="text banned-text">${t('admin.users.status.banned')}</span>
        </span>
      </label>
    `;
    newRow.appendChild(statusCell);

    const toggle = statusCell.querySelector(".status-toggle");
    const slider = statusCell.querySelector(".slider");
    toggle.addEventListener("change", async () => {
      const userId = user.id;
      const newStatus = toggle.checked ? "active" : "banned";
      
      // Update in allUsers array
      const userIndex = allUsers.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        allUsers[userIndex].status = newStatus;
        
        // Update in filteredUsers array if exists
        const filteredIndex = filteredUsers.findIndex((u) => u.id === userId);
        if (filteredIndex !== -1) {
          filteredUsers[filteredIndex].status = newStatus;
        }
        
        // Update UI without re-rendering entire table
        slider.classList.toggle("active", toggle.checked);
        slider.classList.toggle("banned", !toggle.checked);
        
        // Optional: Call API to update in backend
        // await updateUserStatus(userId, newStatus);
      }
    });

    const joinYear = user.joinDate.split("-")[0];
    const joinMonth = user.joinDate.split("-")[1];
    const joinDay =
      user.joinDate.split("-")[2].split("")[0] +
      user.joinDate.split("-")[2].split("")[1];
    const joinDate = joinDay + "/" + joinMonth + "/" + joinYear;
    const createDateCell = document.createElement("td");
    createDateCell.textContent = joinDate;
    newRow.appendChild(createDateCell);

    const editCell = document.createElement("td");
    editCell.innerHTML = `<button class="btn btn-edit"><i class="fa-solid fa-user-pen"></i></button>`;
    newRow.appendChild(editCell);

    const detailCell = document.createElement("td");
    detailCell.innerHTML = `<a href="#" class="btn btn-detail"><i class="fa-solid fa-circle-info"></i></a>`;
    newRow.appendChild(detailCell);

    const deleteCell = document.createElement("td");
    deleteCell.innerHTML = `<button class="btn btn-delete"><i class="fa-solid fa-trash"></i></button>`;
    newRow.appendChild(deleteCell);

    const editBtn = editCell.querySelector(".btn-edit");
    editBtn.addEventListener("click", () => {
      openEditModal(newRow);
    });

    const deleteBtn = deleteCell.querySelector(".btn-delete");
    deleteBtn.addEventListener("click", function () {
      const confirmMsg = `${t('admin.users.modal.deleteConfirm')} "${user.name}"?`;
      if (confirm(confirmMsg)) {
        const userId = newRow.dataset.userId;
        allUsers = allUsers.filter((u) => u.id !== userId);
        filterUsers();
      }
    });

    return newRow;
  }

  // Render users table
  function renderUsers() {
    tableBody.innerHTML = "";

    const usersToShow = getUsersForCurrentPage();
    const startNo = (currentPage - 1) * usersPerPage + 1;

    if (usersToShow.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #717182;">
            ${t('admin.users.noUsers')}
          </td>
        </tr>
      `;
    } else {
      usersToShow.forEach((user, index) => {
        const newRow = createUserRow(user, startNo + index);
        tableBody.appendChild(newRow);
      });
    }

    updateUserCount();
    updatePaginationButtons();
  }

  // Update user count
  function updateUserCount() {
    const countSpan = userCountHeading.querySelector('span[data-i18n="admin.users.count"]');
    if (filteredUsers.length === allUsers.length) {
      userCountHeading.innerHTML = `<span data-i18n="admin.users.count">${t('admin.users.count')}</span> (${allUsers.length})`;
    } else {
      userCountHeading.innerHTML = `<span data-i18n="admin.users.count">${t('admin.users.count')}</span> (${filteredUsers.length} / ${allUsers.length})`;
    }
  }

  // Update pagination buttons
  function updatePaginationButtons() {
    const totalPages = getTotalPages();

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = `/ ${totalPages}`;

    if (currentPage === 1 || totalPages === 0) {
      paginationLeft.classList.add("disable");
      paginationLeft.disabled = true;
    } else {
      paginationLeft.classList.remove("disable");
      paginationLeft.disabled = false;
    }

    if (currentPage >= totalPages || totalPages === 0) {
      paginationRight.classList.add("disable");
      paginationRight.disabled = true;
    } else {
      paginationRight.classList.remove("disable");
      paginationRight.disabled = false;
    }
  }

  // Pagination event listeners
  paginationLeft.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderUsers();
    }
  });

  paginationRight.addEventListener("click", () => {
    if (currentPage < getTotalPages()) {
      currentPage++;
      renderUsers();
    }
  });

  // INITIALIZE
  renderUsers();

  // ========== MODAL ADD/EDIT ==========
  addUserBtn.addEventListener("click", () => {
    isEditMode = false;
    modalTitle.textContent = t('admin.users.modal.add');
    submitBtn.textContent = t('admin.users.modal.create');

    // Reset form and preview
    userFormEl.reset();
    avatarPreviewImg.src =
      "../../../public/assets/image/user_avatar_default.jpg";

    // Hide ID display and show password fields for Add mode
    const idDisplayGroup = userFormEl.querySelector(".user-id-display");
    const passwordGroup = userFormEl.querySelector(".password-group");
    const cfPasswordGroup = userFormEl.querySelector(".cf-password-group");

    if (idDisplayGroup) idDisplayGroup.style.display = "none";
    if (passwordGroup) passwordGroup.style.display = "block";
    if (cfPasswordGroup) cfPasswordGroup.style.display = "block";

    // Reset validation
    errorMessage.style.display = "none";
    cfPwdInput.style.border = "";
    submitBtn.disabled = false;

    modalUser.classList.remove("hidden");
    userForm.classList.add("active");
  });

  function openEditModal(row) {
    isEditMode = true;
    currentEditRow = row;

    const userId = row.dataset.userId;
    const user = allUsers.find((u) => u.id === userId);

    if (!user) return;

    modalTitle.textContent = t('admin.users.modal.edit');
    submitBtn.textContent = t('admin.users.modal.save');

    // Show preview with current data
    avatarPreviewImg.src = user.avatar;

    // Show ID (readonly)
    const idDisplayGroup = userFormEl.querySelector(".user-id-display");
    const idDisplayInput = userFormEl.querySelector('input[name="id-display"]');
    if (idDisplayGroup && idDisplayInput) {
      idDisplayGroup.style.display = "block";
      idDisplayInput.value = user.id;
    }

    // Hide password fields in edit mode
    const passwordGroup = userFormEl.querySelector(".password-group");
    const cfPasswordGroup = userFormEl.querySelector(".cf-password-group");
    if (passwordGroup) passwordGroup.style.display = "none";
    if (cfPasswordGroup) cfPasswordGroup.style.display = "none";

    // Fill data
    userFormEl.querySelector('input[name="id"]').value = user.id;
    userFormEl.querySelector('input[name="name"]').value = user.name;
    userFormEl.querySelector('input[name="email"]').value = user.email;
    userFormEl.querySelector('select[name="role"]').value = user.role;

    modalUser.classList.remove("hidden");
    userForm.classList.add("active");
  }

  function closeModal() {
    modalUser.classList.add("hidden");
    userFormEl.reset();
    currentEditRow = null;
    isEditMode = false;
    avatarInput.value = "";
    errorMessage.style.display = "none";
    cfPwdInput.style.border = "";
    submitBtn.disabled = false;
  }

  backdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalUser.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Upload new avatar
  avatarInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        avatarPreviewImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // PASSWORD VALIDATION
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

  // SUBMIT FORM
  userFormEl.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = userFormEl.querySelector('input[name="name"]').value;
    const email = userFormEl.querySelector('input[name="email"]').value;
    const role = userFormEl.querySelector('select[name="role"]').value;

    let avatarURL;
    const avatarFile = avatarInput.files[0];

    function saveUser() {
      if (isEditMode && currentEditRow) {
        // EDIT MODE - Update directly in allUsers
        const userId = currentEditRow.dataset.userId;
        const userIndex = allUsers.findIndex((u) => u.id === userId);

        if (userIndex !== -1) {
          allUsers[userIndex] = {
            ...allUsers[userIndex],
            name: name,
            email: email,
            role: role,
            avatar: avatarURL,
          };

          filterUsers();
        }
      } else {
        // ADD MODE
        const currentDate = new Date().toLocaleDateString("en-US");

        const newUser = {
          id: generateUserId(),
          name: name,
          email: email,
          role: role,
          status: "active",
          avatar: avatarURL,
          createdDate: currentDate,
        };

        allUsers.push(newUser);
        filterUsers();

        // Go to last page where new user is
        currentPage = getTotalPages();
        renderUsers();
      }

      closeModal();
    }

    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarURL = e.target.result;
        saveUser();
      };
      reader.readAsDataURL(avatarFile);
    } else {
      avatarURL = avatarPreviewImg.src;
      saveUser();
    }
  });

  // Listen for language change
  window.addEventListener('languagechange', async (e) => {
    await loadTranslations();
    renderUsers();
  });
}