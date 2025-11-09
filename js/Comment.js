let commentsData = [];
let currentRating = 0;

//Tính điểm trung bình//
function calculateAverage(comments) {
  if (comments.length === 0) return 0;
  const total = comments.reduce((sum, comment) => sum + comment.rating, 0);
  return (total / comments.length).toFixed(1);
}

// Cập nhật thống kê//
function updateStats() {
  const avgRating = calculateAverage(commentsData);
  const totalComments = commentsData.length;

  document.getElementById("avg-rating").textContent = avgRating;
  document.getElementById("total-comments").textContent = totalComments;
}

//Tạo comment//
function createComment(comment) {
  const stars = Array(5)
    .fill(0)
    .map((_, i) =>
      i < comment.rating
        ? '<i class="fas fa-star"></i>'
        : '<i class="fas fa-star empty"></i>'
    )
    .join("");

  const avatar = comment.userName.charAt(0).toUpperCase();
  const date = new Date(comment.date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div class="comment-item" data-id="${comment.id}">
      <div class="comment-header">
        <div class="comment-user">
          <div class="user-avatar">${avatar}</div>
          <div class="user-info">
            <div class="user-name">${comment.userName}</div>
            <div class="comment-date">${date}</div>
          </div>
        </div>
        <div class="comment-rating">${stars}</div>
      </div>
      <div class="comment-text">${comment.text}</div>
      <div class="comment-actions">
        <button class="comment-action-btn like-btn" data-id="${comment.id}">
          <i class="fas fa-thumbs-up"></i>
          <span>Hữu ích (${comment.likes || 0})</span>
        </button>
      </div>
    </div>
  `;
}

//Hiển thị danh sách comment//
function renderComments() {
  const commentsList = document.getElementById("comments-list");

  if (commentsData.length === 0) {
    commentsList.innerHTML =
      '<div class="no-comments">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>';
    return;
  }

  // Sắp xếp theo thời gian mới nhất
  const sortedComments = [...commentsData].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  commentsList.innerHTML = sortedComments.map(createComment).join("");

  // Thêm sự kiện cho nút like
  commentsList.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const commentId = this.getAttribute("data-id");
      handleLike(commentId);
    });
  });
}

// Xử lý like//
function handleLike(commentId) {
  const comment = commentsData.find((c) => c.id === commentId);

  if (comment) {
    if (comment.likedByUser) {
      comment.likes = (comment.likes || 1) - 1;
      comment.likedByUser = false;
    } else {
      comment.likes = (comment.likes || 0) + 1;
      comment.likedByUser = true;
    }

    renderComments();
  }
}

//Xử lý chọn sao//
function initStarRating() {
  const stars = document.querySelectorAll("#star-rating i");

  stars.forEach((star, index) => {
    // Hover effect
    star.addEventListener("mouseenter", function () {
      stars.forEach((s, i) => {
        if (i <= index) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });

    star.addEventListener("click", function () {
      currentRating = index + 1;
      stars.forEach((s, i) => {
        if (i < currentRating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  const starRating = document.getElementById("star-rating");
  starRating.addEventListener("mouseleave", function () {
    stars.forEach((s, i) => {
      if (i < currentRating) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  });
}

// Xử lý comment//
function initCommentForm() {
  const submitBtn = document.getElementById("submit-comment");
  const commentText = document.getElementById("comment-text");

  submitBtn.addEventListener("click", function () {
    const text = commentText.value.trim();

    // Validate
    if (currentRating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }

    if (text === "") {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    if (text.length < 10) {
      alert("Đánh giá phải có ít nhất 10 ký tự!");
      return;
    }

    // Tạo comment mới
    const newComment = {
      id: Date.now().toString(),
      userName: generateRandomName(),
      rating: currentRating,
      text: text,
      date: new Date().toISOString(),
      likes: 0,
      likedByUser: false,
    };

   
    commentsData.push(newComment);

   
    renderComments();
    updateStats();

    
    commentText.value = "";
    currentRating = 0;
    document.querySelectorAll("#star-rating i").forEach((s) => {
      s.classList.remove("active");
    });

    alert("Cảm ơn bạn đã đánh giá!");

    setTimeout(() => {
      const commentsList = document.getElementById("comments-list");
      commentsList.scrollIntoView({ behavior: "smooth" });
    }, 100);
  });
}

// Tạo tên ngẫu nhiên //
function generateRandomName() {
  const firstNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Phan",
    "Vũ",
    "Đặng",
    "Bùi",
    "Đỗ",
  ];
  const lastNames = [
    "Anh",
    "Minh",
    "Hùng",
    "Dũng",
    "Tùng",
    "Linh",
    "Hương",
    "Mai",
    "Lan",
    "Hoa",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

//Khởi tạo comment //
export function initComments() {
  initStarRating();

  initCommentForm();

  updateStats();
}

document.addEventListener("DOMContentLoaded", () => {
  initComments();
});