import { usersData } from "./Data.js";

export async function AdminUsers_js() {
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

  // TÌM KIẾM VÀ LỌC
  const searchInput = document.querySelector(".search-input");
  const roleFilter = document.querySelector(".filter-select:nth-child(1)");
  const statusFilter = document.querySelector(".filter-select:nth-child(2)");

  // Phân trang - Khởi tạo mảng rỗng nếu không có usersData
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
      console.error("Lỗi khi tải danh sách người dùng:", error);
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

  // Tạo ID tự động tăng theo format UIT001, UIT002, ...
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

  // Tính tổng số trang
  function getTotalPages() {
    return Math.ceil(filteredUsers.length / usersPerPage);
  }

  // Lấy users cho trang hiện tại
  function getUsersForCurrentPage() {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }

  // HÀM TÌM KIẾM VÀ LỌC - Giữ nguyên trang hiện tại nếu có thể
  function filterUsers() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const roleValue = roleFilter.value;
    const statusValue = statusFilter.value;

    filteredUsers = allUsers.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.id.toLowerCase().includes(searchTerm);

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

  // Event listeners cho tìm kiếm và lọc
  searchInput.addEventListener("input", filterUsers);
  roleFilter.addEventListener("change", filterUsers);
  statusFilter.addEventListener("change", filterUsers);

  // Tạo row cho user
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
                <input type="checkbox" class="status-toggle" ${
                  isActive ? "checked" : ""
                }>
                <span class="slider ${isActive ? "active" : "banned"}">
                    <span class="text active-text">Active</span>
                    <span class="text banned-text">Banned</span>
                </span>
            </label>
        `;
    newRow.appendChild(statusCell);

    const toggle = statusCell.querySelector(".status-toggle");
    const slider = statusCell.querySelector(".slider");
    toggle.addEventListener("change", () => {
      const userIndex = allUsers.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        allUsers[userIndex].status = toggle.checked ? "active" : "banned";
        slider.classList.toggle("active", toggle.checked);
        slider.classList.toggle("banned", !toggle.checked);

        filterUsers();
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
      if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
        const userId = newRow.dataset.userId;
        allUsers = allUsers.filter((u) => u.id !== userId);
        filterUsers();
      }
    });

    return newRow;
  }

  // Render bảng users
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

  // Cập nhật số lượng user
  function updateUserCount() {
    if (filteredUsers.length === allUsers.length) {
      userCountHeading.textContent = `Users (${allUsers.length})`;
    } else {
      userCountHeading.textContent = `Users (${filteredUsers.length} / ${allUsers.length})`;
    }
  }

  // Cập nhật nút phân trang
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

  // Event listeners cho phân trang
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

  // KHỞI TẠO
  renderUsers();

  // ========== MODAL ADD/EDIT ==========
  addUserBtn.addEventListener("click", () => {
    isEditMode = false;
    modalTitle.textContent = "Add User";
    submitBtn.textContent = "Create";

    // Reset form và preview
    userFormEl.reset();
    avatarPreviewImg.src = "../../public/assets/image/user_avatar_default.jpg";

    // Ẩn trường ID display và password khi Add
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

    modalTitle.textContent = "Edit User";
    submitBtn.textContent = "Save";

    // Hiển thị preview với data hiện tại
    avatarPreviewImg.src = user.avatar;

    // Hiển thị ID (readonly)
    const idDisplayGroup = userFormEl.querySelector(".user-id-display");
    const idDisplayInput = userFormEl.querySelector('input[name="id-display"]');
    if (idDisplayGroup && idDisplayInput) {
      idDisplayGroup.style.display = "block";
      idDisplayInput.value = user.id;
    }

    // Ẩn password fields khi edit
    const passwordGroup = userFormEl.querySelector(".password-group");
    const cfPasswordGroup = userFormEl.querySelector(".cf-password-group");
    if (passwordGroup) passwordGroup.style.display = "none";
    if (cfPasswordGroup) cfPasswordGroup.style.display = "none";

    // Điền dữ liệu
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

  // Upload avatar mới
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

  // XÁC THỰC MẬT KHẨU
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
        // EDIT MODE - Cập nhật trực tiếp vào allUsers
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

        // Chuyển đến trang cuối nơi có user mới
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
}
