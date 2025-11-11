export async function AdminUsers_js() {

    // Load dữ liệu movies từ file Data.js 
    let allUsers = [];
    try {
        const { usersData } = await import('./Data.js');
        allUsers = usersData ? [...usersData] : [];
    } catch {
        console.log('No initial user data, starting empty');
    }

    // Modal elements
    const modalUser = document.querySelector('.modal-user');
    const backdrop = document.querySelector('.modal-user .modal_backdrop');
    const userFormEl = document.querySelector('.form-wrapper.user-form form');
    const modalTitle = document.querySelector('.modal-title');
    const submitBtn = userFormEl.querySelector('.btn.btn-primary');
    
    // Table & Pagination
    const tableBody = document.querySelector('.dm-table-body');
    const userCountHeading = document.querySelector('.dm-table-heading h2');
    const currentPageSpan = document.querySelector('.pagination-page-current');
    const totalPagesSpan = document.querySelector('.pagination__main span:last-child');
    const paginationLeft = document.querySelector('.pagination-left-arrow');
    const paginationRight = document.querySelector('.pagination-right-arrow');
    
    // Search & Filter
    const searchInput = document.querySelector('.search-input');
    const roleFilter = document.querySelector('.filter-select:nth-child(1)');
    const statusFilter = document.querySelector('.filter-select:nth-child(2)');
    
    // Avatar preview
    const avatarPreview = document.querySelector('.user-avatar');
    const avatarPreviewImg = avatarPreview.querySelector('img');
    const avatarInput = avatarPreview.querySelector('.avatar-input');

    // Password validation
    const pwdInput = userFormEl.querySelector('input[name="password"]');
    const cfPwdInput = userFormEl.querySelector('input[name="cf_password"]');
    const errorMessage = userFormEl.querySelector('.non-same-pw');

    // STATE MANAGEMENT 
    let filteredUsers = [...allUsers];
    let currentPage = 1;
    let currentEditRow = null;
    let isEditMode = false;
    const usersPerPage = 5;

    // FUNCTIONS 
    // Tạo ID tự động theo format UIT001, UIT002, ...
    const generateUserId = () => {
        if (allUsers.length === 0) return 'UIT001';
        
        const maxNum = allUsers.reduce((max, user) => {
            const match = user.id.match(/^UIT(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        
        return 'UIT' + String(maxNum + 1).padStart(3, '0');
    };

    // Tính tổng số trang
    const getTotalPages = () => Math.ceil(filteredUsers.length / usersPerPage);

    // Lấy danh sách users cho trang hiện tại
    const getUsersForCurrentPage = () => {
        const start = (currentPage - 1) * usersPerPage;
        return filteredUsers.slice(start, start + usersPerPage);
    };

    // Đọc file ảnh thành base64
    const readFileAsDataURL = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    // FILTER & SEARCH 
    // Lọc users theo search và filter
    const filterUsers = () => {
        const search = searchInput.value.toLowerCase().trim();
        const role = roleFilter.value;
        const status = statusFilter.value;

        filteredUsers = allUsers.filter(user => {
            const matchSearch = user.name.toLowerCase().includes(search) || 
                              user.email.toLowerCase().includes(search) ||
                              user.id.toLowerCase().includes(search);
            const matchRole = role === 'all' || user.role === role;
            const matchStatus = status === 'all' || user.status === status;

            return matchSearch && matchRole && matchStatus;
        });

        // Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
        const totalPages = getTotalPages();
        currentPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
        
        renderUsers();
    };

    // RENDER FUNCTIONS 
    // Tạo một row trong bảng users
    const createUserRow = (user, no) => {
        const isActive = user.status === 'active';
        
        const row = document.createElement('tr');
        row.dataset.userId = user.id;
        row.innerHTML = `
            <td>${no}</td>
            <td class="user-column">
                <div class="td-user-info">
                    <div class="td-user-avatar">
                        <img src="${user.avatar}" alt="User Avatar" class="user-avatar-img">
                    </div>
                    <div class="td-user-name-email">
                        <span class="name">${user.name}</span><br>
                        <span class="email">${user.email}</span>
                    </div>
                </div>
            </td>
            <td>${user.role}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" class="status-toggle" ${isActive ? 'checked' : ''}>
                    <span class="slider ${isActive ? 'active' : 'banned'}">
                        <span class="text active-text">Active</span>
                        <span class="text banned-text">Banned</span>
                    </span>
                </label>
            </td>
            <td>${user.createdDate}</td>
            <td><button class="btn btn-edit"><i class="fa-solid fa-user-pen"></i></button></td>
            <td><a href="#" class="btn btn-detail"><i class="fa-solid fa-circle-info"></i></a></td>
            <td><button class="btn btn-delete"><i class="fa-solid fa-trash"></i></button></td>
        `;

        // Event listener cho toggle status
        const toggle = row.querySelector('.status-toggle');
        const slider = row.querySelector('.slider');
        toggle.addEventListener('change', () => {
            const userIndex = allUsers.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                allUsers[userIndex].status = toggle.checked ? 'active' : 'banned';
                slider.classList.toggle('active', toggle.checked);
                slider.classList.toggle('banned', !toggle.checked);
                filterUsers();
            }
        });

        // Event listeners cho các nút
        row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(row));
        row.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
                allUsers = allUsers.filter(u => u.id !== user.id);
                filterUsers();
            }
        });

        return row;
    };

    // Render toàn bộ bảng users
    const renderUsers = () => {
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
            tableBody.innerHTML = '';
            usersToShow.forEach((user, i) => {
                tableBody.appendChild(createUserRow(user, startNo + i));
            });
        }

        updateUserCount();
        updatePaginationButtons();
    };

    // Cập nhật số lượng users hiển thị
    const updateUserCount = () => {
        userCountHeading.textContent = filteredUsers.length === allUsers.length
            ? `Users (${allUsers.length})`
            : `Users (${filteredUsers.length} / ${allUsers.length})`;
    };

    // Cập nhật trạng thái các nút phân trang
    const updatePaginationButtons = () => {
        const totalPages = getTotalPages();
        
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = `/ ${totalPages}`;
        
        paginationLeft.classList.toggle('disable', currentPage === 1 || totalPages === 0);
        paginationLeft.disabled = currentPage === 1 || totalPages === 0;
        
        paginationRight.classList.toggle('disable', currentPage >= totalPages || totalPages === 0);
        paginationRight.disabled = currentPage >= totalPages || totalPages === 0;
    };

    // PASSWORD VALIDATION 
    // Kiểm tra mật khẩu khớp nhau
    const validatePasswords = () => {
        if (pwdInput.value && cfPwdInput.value && pwdInput.value !== cfPwdInput.value) {
            errorMessage.style.display = 'block';
            cfPwdInput.style.border = '1px solid red';
            submitBtn.disabled = true;
        } else {
            errorMessage.style.display = 'none';
            cfPwdInput.style.border = '';
            submitBtn.disabled = false;
        }
    };

    // MODAL ADD/EDIT 
    // Mở modal thêm user mới
    const openAddModal = () => {
        isEditMode = false;
        modalTitle.textContent = 'Add User';
        submitBtn.textContent = 'Create';
        
        userFormEl.reset();
        avatarPreviewImg.src = '../../public/assets/image/user_avatar_default.jpg';
        
        // Ẩn ID display, hiện password fields
        const idDisplayGroup = userFormEl.querySelector('.user-id-display');
        const passwordGroup = userFormEl.querySelector('.password-group');
        const cfPasswordGroup = userFormEl.querySelector('.cf-password-group');
        
        if (idDisplayGroup) idDisplayGroup.style.display = 'none';
        if (passwordGroup) passwordGroup.style.display = 'block';
        if (cfPasswordGroup) cfPasswordGroup.style.display = 'block';
        
        // Reset validation
        errorMessage.style.display = 'none';
        cfPwdInput.style.border = '';
        submitBtn.disabled = false;
        
        modalUser.classList.remove('hidden');
        document.querySelector('.form-wrapper.user-form').classList.add('active');
    };

    // Mở modal chỉnh sửa user
    const openEditModal = (row) => {
        isEditMode = true;
        currentEditRow = row;
        
        const user = allUsers.find(u => u.id === row.dataset.userId);
        if (!user) return;
        
        modalTitle.textContent = 'Edit User';
        submitBtn.textContent = 'Save';
        
        // Hiển thị preview ảnh hiện tại
        avatarPreviewImg.src = user.avatar;
        
        // Hiển thị ID (readonly), ẩn password fields
        const idDisplayGroup = userFormEl.querySelector('.user-id-display');
        const idDisplayInput = userFormEl.querySelector('input[name="id-display"]');
        const passwordGroup = userFormEl.querySelector('.password-group');
        const cfPasswordGroup = userFormEl.querySelector('.cf-password-group');
        
        if (idDisplayGroup && idDisplayInput) {
            idDisplayGroup.style.display = 'block';
            idDisplayInput.value = user.id;
        }
        if (passwordGroup) passwordGroup.style.display = 'none';
        if (cfPasswordGroup) cfPasswordGroup.style.display = 'none';
        
        // Điền dữ liệu vào form
        userFormEl.querySelector('input[name="id"]').value = user.id;
        userFormEl.querySelector('input[name="name"]').value = user.name;
        userFormEl.querySelector('input[name="email"]').value = user.email;
        userFormEl.querySelector('select[name="role"]').value = user.role;
        
        modalUser.classList.remove('hidden');
        document.querySelector('.form-wrapper.user-form').classList.add('active');
    };

    // Đóng modal
    const closeModal = () => {
        modalUser.classList.add('hidden');
        document.querySelector('.form-wrapper.user-form').classList.remove('active');
        userFormEl.reset();
        currentEditRow = null;
        isEditMode = false;
        avatarInput.value = '';
        errorMessage.style.display = 'none';
        cfPwdInput.style.border = '';
        submitBtn.disabled = false;
    };

    // EVENT LISTENERS 
    // Search & Filter
    searchInput.addEventListener('input', filterUsers);
    roleFilter.addEventListener('change', filterUsers);
    statusFilter.addEventListener('change', filterUsers);

    // Pagination
    paginationLeft.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderUsers();
        }
    });
    
    paginationRight.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
            currentPage++;
            renderUsers();
        }
    });

    // Modal
    document.querySelector('.add-btn').addEventListener('click', openAddModal);
    backdrop.addEventListener('click', closeModal);
    document.querySelector('.modal-user .modal_close').addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalUser.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Upload avatar
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) avatarPreviewImg.src = await readFileAsDataURL(file);
    });

    // Password validation
    pwdInput.addEventListener('input', validatePasswords);
    cfPwdInput.addEventListener('input', validatePasswords);

    // Submit form
    userFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Lấy dữ liệu từ form
        const name = userFormEl.querySelector('input[name="name"]').value;
        const email = userFormEl.querySelector('input[name="email"]').value;
        const role = userFormEl.querySelector('select[name="role"]').value;
        
        // Xử lý ảnh avatar
        const avatarFile = avatarInput.files[0];
        const avatarURL = avatarFile ? await readFileAsDataURL(avatarFile) : avatarPreviewImg.src;

        if (isEditMode && currentEditRow) {
            // Chế độ EDIT
            const userId = currentEditRow.dataset.userId;
            const index = allUsers.findIndex(u => u.id === userId);
            
            if (index !== -1) {
                allUsers[index] = {
                    ...allUsers[index],
                    name,
                    email,
                    role,
                    avatar: avatarURL
                };
                filterUsers();
            }
        } else {
            // Chế độ ADD
            const newUser = {
                id: generateUserId(),
                name,
                email,
                role,
                status: 'active',
                avatar: avatarURL,
                createdDate: new Date().toLocaleDateString('en-US')
            };
            
            allUsers.push(newUser);
            filterUsers();
            
            // Chuyển đến trang cuối
            currentPage = getTotalPages();
            renderUsers();
        }
        
        closeModal();
    });
    

    renderUsers();
}