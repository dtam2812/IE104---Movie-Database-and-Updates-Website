
export async function checkAndShowLoginPopup() {
  // Check if "tokenExpired" flag exists in sessionStorage
  const tokenExpired = sessionStorage.getItem("tokenExpired");
  
  if (tokenExpired === "true") {
    
    // Remove flag
    sessionStorage.removeItem("tokenExpired");
    
    // Wait a bit to ensure the page has fully loaded
    setTimeout(async () => {
      let modal = document.querySelector(".modal");
      
      if (!modal) {
        // Load file AuthModal.html
        try {
          const html = await (
            await fetch("../../view/components/AuthModal.html")
          ).text();
          
          const doc = new DOMParser().parseFromString(html, "text/html");
          document.body.appendChild(doc.querySelector(".modal"));

          // Load CSS
          doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
            const href = link.href;
            if (!document.querySelector(`link[href="${href}"]`)) {
              document.head.appendChild(
                Object.assign(document.createElement("link"), {
                  rel: "stylesheet",
                  href,
                })
              );
            }
          });

          // Import AuthModal.js
          const { Auth_Modaljs } = await import("./AuthModal.js");
          Auth_Modaljs();
          
          // Open login popup
          setTimeout(() => {
            if (window.openLRFModal) {
              window.openLRFModal("login");
              
              // Show message to user
              showTokenExpiredMessage();
            }
          }, 100);
        } catch (error) {
          console.error("Error loading auth modal:", error);
        }
      } else {
        // Modal already exists, just open it
        if (window.openLRFModal) {
          window.openLRFModal("login");
          showTokenExpiredMessage();
        }
      }
    }, 500);
  }
}

// Hiện thông báo token hết hạn
function showTokenExpiredMessage() {
  // Tạo một thông báo nhỏ ở trên form login
  const loginForm = document.querySelector(".form-wrapper.login");
  
  if (loginForm) {
    // Check xem đã có thông báo chưa
    let existingMessage = loginForm.querySelector(".token-expired-message");
    
    if (!existingMessage) {
      const message = document.createElement("div");
      message.className = "token-expired-message";
      message.style.cssText = `
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        color: #856404;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      message.innerHTML = `
        <i class="fa-solid fa-exclamation-triangle" style="color: #ffc107;"></i>
        <span>Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!</span>
      `;
      
      // Thêm vào đầu form
      const form = loginForm.querySelector("form");
      if (form) {
        form.insertBefore(message, form.firstChild);
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
          message.style.opacity = "0";
          message.style.transition = "opacity 0.5s";
          setTimeout(() => message.remove(), 500);
        }, 5000);
      }
    }
  }
}