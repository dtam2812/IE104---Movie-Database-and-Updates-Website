export async function AdminUsers_js() {
  const modalUser = document.querySelector(".modal--user");
  const addUserBtn = document.querySelector(".admin-content__add-btn");
  const backdrop = document.querySelector(".modal--user .modal__backdrop");
  const closeBtn = document.querySelector(".modal--user .modal__close");
  const userForm = document.querySelector(".form--user");
  const userFormEl = userForm.querySelector("form");
  const userCountHeading = document.querySelector(".data-table__title");
  const modalTitle = document.querySelector(".form__title");
  const submitBtn = userFormEl.querySelector(".form__btn--primary");

  let currentEditRow = null;
  let isEditMode = false;

  const tableBody = document.querySelector(".data-table__body");

  const paginationLeft = document.querySelector(".pagination__arrow--left");
  const paginationRight = document.querySelector(".pagination__arrow--right");
  const currentPageSpan = document.querySelector(".pagination__current");
  const totalPagesSpan = document.querySelector(
    ".pagination__info span:last-child"
  );

  // SEARCH & FILTER
  const searchInput = document.querySelector(".search-filter__input");
  const roleFilter = document.querySelector(
    ".search-filter__select:nth-child(1)"
  );
  const statusFilter = document.querySelector(
    ".search-filter__select:nth-child(2)"
  );

  let allUsers = [];

  // PASSWORD VALIDATION
  const pwdInput = userFormEl.querySelector('input[name="password"]');
  const cfPwdInput = userFormEl.querySelector('input[name="cf_password"]');
  const errorMessage = userFormEl.querySelector(".form__error");

  // API BASE URL
  const API_BASE = "http://localhost:5000";

  // GET TOKEN
  const getToken = () => localStorage.getItem("accessToken");

  // SIGN OUT FUNCTIONALITY
  const signOutLink = document.querySelector(
    ".admin-menu__item:last-child .admin-menu__link"
  );
  if (signOutLink) {
    signOutLink.addEventListener("click", (e) => {
      e.preventDefault();

      console.log("Admin signing out");

      // Xóa tất cả thông tin user khỏi localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");

      // Redirect về trang HomePage
      window.location.href = "/client/view/pages/HomePage.html";
    });
  }

  // LOAD USERS FROM API
  const getListUser = async () => {
    try {
      const token = getToken();
      console.log("Fetching users with token:", token);

      const response = await fetch(`${API_BASE}/auth/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded users:", data);

      allUsers = data;
      filteredUsers = [...allUsers];
      renderUsers();
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      alert("Không thể tải danh sách người dùng. Vui lòng đăng nhập lại.");
    }
  };

  // UPDATE USER VIA API
  const updateUserAPI = async (userId, userData) => {
    try {
      const token = getToken();
      console.log("Updating user:", userId, userData);

      const response = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi cập nhật user:", error);
      throw error;
    }
  };

  // DELETE USER VIA API
  const deleteUserAPI = async (userId) => {
    try {
      const token = getToken();
      console.log("Deleting user:", userId);

      const response = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("User deleted successfully");
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa user:", error);
      throw error;
    }
  };

  // CREATE USER VIA API
  const createUserAPI = async (userData) => {
    try {
      const token = getToken();
      console.log("Creating user:", userData);

      const response = await fetch(`${API_BASE}/auth/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User created successfully:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi tạo user:", error);
      throw error;
    }
  };

  getListUser();

  let filteredUsers = [...allUsers];
  let currentPage = 1;
  const usersPerPage = 5;

  // FORMAT DATE HELPER
  function formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
      const [year, month, day] = dateString.split("-");
      return `${day.slice(0, 2)}/${month}/${year}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  }

  // GENERATE USER ID
  function generateUserId() {
    if (allUsers.length === 0) {
      return "UIT001";
    }

    const maxNumber = allUsers.reduce((max, user) => {
      const match = user.id?.match(/^UIT(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const newNumber = maxNumber + 1;
    return "UIT" + String(newNumber).padStart(3, "0");
  }

  // PAGINATION
  function getTotalPages() {
    return Math.ceil(filteredUsers.length / usersPerPage);
  }

  function getUsersForCurrentPage() {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }

  // FILTER USERS
  function filterUsers() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const roleValue = roleFilter.value;
    const statusValue = statusFilter.value;

    filteredUsers = allUsers.filter((user) => {
      const userName = user.userName || user.name || "";
      const matchSearch =
        userName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm);

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

  // CREATE USER ROW
  function createUserRow(user, no) {
    const newRow = document.createElement("tr");
    newRow.dataset.userId = user._id || user.id;

    const noCell = document.createElement("td");
    noCell.classList.add("data-table__th");
    noCell.textContent = no;
    newRow.appendChild(noCell);

    const userName = user.userName || user.name || "No Name";

    const userCell = document.createElement("td");
    userCell.classList.add("data-table__th");
    userCell.innerHTML = `
      <div class="user-cell">
        <div class="user-cell__info">
          <span class="user-cell__name">${userName}</span><br>
          <span class="user-cell__email">${user.email}</span>
        </div>
      </div>
    `;
    newRow.appendChild(userCell);

    const roleCell = document.createElement("td");
    roleCell.classList.add("data-table__th");
    roleCell.textContent = user.role;
    newRow.appendChild(roleCell);

    const statusCell = document.createElement("td");
    statusCell.classList.add("data-table__th");
    const isActive = user.status === "active";
    statusCell.innerHTML = `
      <label class="status-toggle">
        <input type="checkbox" class="status-toggle__input" ${
          isActive ? "checked" : ""
        }>
        <span class="status-toggle__slider ${isActive ? "active" : "banned"}">
          <span class="status-toggle__text status-toggle__text--active">Active</span>
          <span class="status-toggle__text status-toggle__text--banned">Banned</span>
        </span>
      </label>
    `;
    newRow.appendChild(statusCell);

    const toggle = statusCell.querySelector(".status-toggle__input");
    const slider = statusCell.querySelector(".status-toggle__slider");
    toggle.addEventListener("change", async () => {
      const userId = user._id || user.id;
      const newStatus = toggle.checked ? "active" : "banned";

      try {
        // Update via API
        await updateUserAPI(userId, { status: newStatus });

        // Update local data
        const userIndex = allUsers.findIndex((u) => (u._id || u.id) === userId);
        if (userIndex !== -1) {
          allUsers[userIndex].status = newStatus;
          slider.classList.toggle("active", toggle.checked);
          slider.classList.toggle("banned", !toggle.checked);
        }
      } catch (error) {
        alert("Không thể cập nhật trạng thái user!");
        toggle.checked = !toggle.checked; // Revert
      }
    });

    const createDateCell = document.createElement("td");
    createDateCell.classList.add("data-table__th");
    createDateCell.textContent = formatDate(user.joinDate || user.createdDate);
    newRow.appendChild(createDateCell);

    const editCell = document.createElement("td");
    editCell.classList.add("data-table__th");
    editCell.innerHTML = `<button class="data-table__btn data-table__btn--edit"><i class="fa-solid fa-user-pen"></i></button>`;
    newRow.appendChild(editCell);

    const detailCell = document.createElement("td");
    detailCell.classList.add("data-table__th");
    detailCell.innerHTML = `<a href="#" class="data-table__btn data-table__btn--detail"><i class="fa-solid fa-circle-info"></i></a>`;
    newRow.appendChild(detailCell);

    const deleteCell = document.createElement("td");
    deleteCell.classList.add("data-table__th");
    deleteCell.innerHTML = `<button class="data-table__btn data-table__btn--delete"><i class="fa-solid fa-trash"></i></button>`;
    newRow.appendChild(deleteCell);

    const editBtn = editCell.querySelector(".data-table__btn--edit");
    editBtn.addEventListener("click", () => {
      console.log("Edit button clicked for user:", user);
      openEditModal(newRow);
    });

    const deleteBtn = deleteCell.querySelector(".data-table__btn--delete");
    deleteBtn.addEventListener("click", async function () {
      const userName = user.userName || user.name;
      if (confirm(`Are you sure you want to delete "${userName}"?`)) {
        try {
          const userId = user._id || user.id;
          await deleteUserAPI(userId);

          // Remove from local array
          allUsers = allUsers.filter((u) => (u._id || u.id) !== userId);
          filterUsers();
          alert("Xóa user thành công!");
        } catch (error) {
          alert("Không thể xóa user!");
        }
      }
    });

    return newRow;
  }

  // RENDER USERS
  function renderUsers() {
    tableBody.innerHTML = "";

    const usersToShow = getUsersForCurrentPage();
    const startNo = (currentPage - 1) * usersPerPage + 1;

    if (usersToShow.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #717182;">
            No users found
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

  function updateUserCount() {
    if (filteredUsers.length === allUsers.length) {
      userCountHeading.textContent = `Users (${allUsers.length})`;
    } else {
      userCountHeading.textContent = `Users (${filteredUsers.length} / ${allUsers.length})`;
    }
  }

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

  // PAGINATION EVENTS
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

  // SEARCH & FILTER EVENTS
  searchInput.addEventListener("input", filterUsers);
  roleFilter.addEventListener("change", filterUsers);
  statusFilter.addEventListener("change", filterUsers);

  // MODAL - ADD USER
  addUserBtn.addEventListener("click", () => {
    console.log("Add button clicked");

    isEditMode = false;
    modalTitle.textContent = "Add User";
    submitBtn.textContent = "Create";

    userFormEl.reset();

    const idDisplayGroup = userFormEl.querySelector(".form__id-display");
    const passwordGroup = userFormEl.querySelector(".form__group--password");
    const cfPasswordGroup = userFormEl.querySelector(
      ".form__group--confirm-password"
    );

    if (idDisplayGroup) idDisplayGroup.style.display = "none";
    if (passwordGroup) {
      passwordGroup.style.display = "block";
      pwdInput.setAttribute("required", "");
    }
    if (cfPasswordGroup) {
      cfPasswordGroup.style.display = "block";
      cfPwdInput.setAttribute("required", "");
    }

    errorMessage.style.display = "none";
    cfPwdInput.style.border = "";
    submitBtn.disabled = false;

    modalUser.classList.remove("hidden");
    userForm.classList.add("form--active");
  });

  // MODAL - EDIT USER
  function openEditModal(row) {
    console.log("Opening edit modal");
    console.log("Row dataset:", row.dataset);

    isEditMode = true;
    currentEditRow = row;

    const userId = row.dataset.userId;
    const user = allUsers.find((u) => (u._id || u.id) === userId);

    console.log("Found user for edit:", user);

    if (!user) {
      console.error("User not found with ID:", userId);
      alert("Cannot find user data!");
      return;
    }

    modalTitle.textContent = "Edit User";
    submitBtn.textContent = "Save";

    const idDisplayGroup = userFormEl.querySelector(".form__id-display");
    const idDisplayInput = userFormEl.querySelector('input[name="id-display"]');
    if (idDisplayGroup && idDisplayInput) {
      idDisplayGroup.style.display = "block";
      idDisplayInput.value = user._id || user.id;
    }

    const passwordGroup = userFormEl.querySelector(".form__group--password");
    const cfPasswordGroup = userFormEl.querySelector(
      ".form__group--confirm-password"
    );
    if (passwordGroup) {
      passwordGroup.style.display = "none";
      pwdInput.removeAttribute("required");
    }
    if (cfPasswordGroup) {
      cfPasswordGroup.style.display = "none";
      cfPwdInput.removeAttribute("required");
    }

    userFormEl.querySelector('input[name="id"]').value = user._id || user.id;
    userFormEl.querySelector('input[name="name"]').value =
      user.userName || user.name || "";
    userFormEl.querySelector('input[name="email"]').value = user.email;
    userFormEl.querySelector('select[name="role"]').value = user.role;

    console.log("Modal should be visible now");
    modalUser.classList.remove("hidden");
    userForm.classList.add("form--active");
  }

  // MODAL - CLOSE
  function closeModal() {
    modalUser.classList.add("hidden");
    userForm.classList.remove("form--active");
    userFormEl.reset();
    currentEditRow = null;
    isEditMode = false;
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

  // FORM SUBMIT
  userFormEl.addEventListener("submit", async function (event) {
    event.preventDefault();

    console.log("Form submitted. Edit mode:", isEditMode);

    const name = userFormEl.querySelector('input[name="name"]').value.trim();
    const email = userFormEl.querySelector('input[name="email"]').value.trim();
    const role = userFormEl.querySelector('select[name="role"]').value;
    const password = pwdInput.value.trim();

    try {
      if (isEditMode && currentEditRow) {
        console.log("Saving edited user");

        const userId = currentEditRow.dataset.userId;

        // Prepare update data
        const updateData = {
          userName: name,
          email: email,
          role: role,
        };

        // Call API
        await updateUserAPI(userId, updateData);

        // Update local data
        const userIndex = allUsers.findIndex((u) => (u._id || u.id) === userId);
        if (userIndex !== -1) {
          allUsers[userIndex] = {
            ...allUsers[userIndex],
            ...updateData,
          };
          console.log("Updated user:", allUsers[userIndex]);
        }

        alert("Cập nhật user thành công!");
        filterUsers();
      } else {
        console.log("Adding new user");

        // Prepare new user data
        const newUserData = {
          userName: name,
          email: email,
          password: password,
          role: role,
          status: "active",
        };

        // Call API
        const createdUser = await createUserAPI(newUserData);

        // Add to local array
        allUsers.push(createdUser);

        alert("Tạo user thành công!");
        filterUsers();

        // Go to last page
        currentPage = getTotalPages();
        renderUsers();
      }

      closeModal();
    } catch (error) {
      alert("Lỗi khi lưu user: " + error.message);
    }
  });

  // INITIAL RENDER
  renderUsers();
}
