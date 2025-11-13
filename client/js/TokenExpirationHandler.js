import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

const CHECK_INTERVAL_MS = 10000;  // Thay ở đây: 5000=5s, 10000=10s, 60000=1m, 600000=10m

// Hàm kiểm tra token có hết hạn chưa
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // Convert to seconds
    
    if (decoded.exp && decoded.exp < now) {
      console.log("Token đã hết hạn!");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
}

// Hàm xử lý khi token hết hạn
export function handleTokenExpiration() {
  console.log("Token hết hạn - Đang xử lý logout...");
  
  // 1. Set flag để AutoLoginPopup biết là token đã hết hạn
  sessionStorage.setItem("tokenExpired", "true");
  
  // 2. Xóa tất cả thông tin user
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("refreshToken");
  
  // 3. Lấy đường dẫn hiện tại
  const currentPath = window.location.pathname;
  const isHomePage = currentPath.includes("HomePage.html");
  
  // 4. Luôn redirect về HomePage (từ bất kỳ trang nào)
  window.location.href = "/client/view/pages/HomePage.html";  // Absolute path chuẩn
  
  // 5. Nếu đang ở HomePage → reload và mở popup (sẽ trigger sau redirect)
  if (isHomePage) {
    window.location.reload();
  }
}

// Hàm kiểm tra token định kỳ
export function startTokenExpirationCheck() {
  console.log(`Bắt đầu kiểm tra token expiration mỗi ${CHECK_INTERVAL_MS / 1000} giây...`);
  
  const checkInterval = setInterval(() => {
    const accessToken = localStorage.getItem("accessToken");
        
    // Kiểm tra token có hết hạn không
    if (isTokenExpired(accessToken)) {
      console.log("Token đã hết hạn!");
      clearInterval(checkInterval);
      handleTokenExpiration();
    } else {
      // Hiển thị thời gian còn lại (countdown console)
      try {
        const decoded = jwtDecode(accessToken);
        const now = Date.now() / 1000;
        const timeLeft = Math.floor(decoded.exp - now);
        console.log(`Token còn ${timeLeft} giây`);
      } catch (error) {
        console.error("Error checking token:", error);
      }
    }
  }, CHECK_INTERVAL_MS); 
  
  // Clear interval khi page unload (tránh leak)
  window.addEventListener('beforeunload', () => clearInterval(checkInterval));
  
  // Trả về interval ID nếu cần clear manual
  return checkInterval;
}

// Hàm kiểm tra token khi vừa load trang
export function checkTokenOnPageLoad() {
  const accessToken = localStorage.getItem("accessToken");
  
  if (accessToken && isTokenExpired(accessToken)) {
    console.log("Token đã hết hạn khi load trang");
    handleTokenExpiration();
    return false; // Token invalid
  }
  
  return true; // Token valid hoặc không có token
}

// Export tất cả functions
export default {
  isTokenExpired,
  handleTokenExpiration,
  startTokenExpirationCheck,
  checkTokenOnPageLoad
};