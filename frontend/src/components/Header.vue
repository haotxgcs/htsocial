<template>
  <div>
    <header class="header">
      
      <div class="left" v-show="!showMobileSearch">
        <div class="menu-btn" @click="toggleSidebar">
          <img src="../assets/menu.png" alt="Menu" class="menu-icon-img" />
        </div>
        <router-link to="/home" class="logo-link">
          <img src="../assets/htsocial.png" alt="Logo" class="logo" />
        </router-link>
      </div>

      <div class="center" :class="{ 'mobile-active': showMobileSearch }">
        
        <button class="back-btn-mobile" v-if="showMobileSearch" @click="showMobileSearch = false">
          <span><img src="../assets/back.png"></span>
        </button>

        <div class="search-wrapper">
          <img src="../assets/search.png" class="search-icon">
          <input type="text" placeholder="Tìm kiếm trên HT Social..." class="search-input" />
        </div>
      </div>

      <div class="right" v-show="!showMobileSearch">
        
        <div class="icon-circle mobile-search-trigger" @click="showMobileSearch = true">
           <img src="../assets/search.png" class="search-icon">
        </div>

        <div class="icon-circle theme-toggle" @click="toggleDark()" :title="isDark ? 'Light Mode' : 'Dark Mode'">
          <img v-if="isDark" src="../assets/light.png" alt="Light Mode" class="theme-icon" />
          <img v-else src="../assets/dark.png" alt="Dark Mode" class="theme-icon" />
        </div>

        <div class="icon-circle" @click="toggleMessage">
          <img src="../assets/message.png" class="icon-img" />
          <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          
          <div v-if="showMessageDropdown" class="message-dropdown-panel">
             <div class="dropdown-header">
               <h3>Tin nhắn</h3>
               <div class="header-actions"><div class="action-btn">⋯</div></div>
             </div>
             <div class="message-list">
                <div v-if="filteredFriends.length === 0" class="no-messages"><p>Không có tin nhắn nào</p></div>
             </div>
             <div class="dropdown-footer-btn">
                <router-link to="/message">Xem tất cả trong Messenger</router-link>
             </div>
          </div>
        </div>

        <div class="icon-circle" @click="toggleNotification">
          <img src="../assets/notification.png" class="icon-img" />
          <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
          
          <div v-if="showNotificationDropdown" class="notification-dropdown-panel">
            <div class="dropdown-header"><h3>Thông báo</h3></div>
            <div class="notification-list"></div>
          </div>
        </div>

        <div class="icon-circle user-dropdown" @click="toggleUserDropdown">
          <img :src="currentUser.avatarUrl || require('../assets/user.png')" class="avatar-image" />
          
          <div v-if="showUserDropdown" class="user-dropdown-panel">
            
            <div class="user-info" @click="goToProfile">
              <img :src="currentUser.avatarUrl || require('../assets/user.png')" class="user-avatar-img" />
              <div class="user-details">
                <p class="user-name">{{ currentUser.name }}</p>
                <p class="user-email">Xem trang cá nhân của bạn</p>
              </div>
            </div>

            <div class="dropdown-divider"></div>
            <div class="menu-items">
              <div class="menu-item" @click="goToSettings">
                <div class="menu-icon-bg"><img src="../assets/setting.png" class="menu-icon"/></div>
                <p class="menu-title">Cài đặt & quyền riêng tư</p>
              </div>
              <div class="menu-item logout-item" @click="logout">
                <div class="menu-icon-bg"><img src="../assets/logout.png" class="menu-icon"/></div>
                <p class="menu-title">Đăng xuất</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <div class="sidebar-content">
        <router-link to="/home" class="sidebar-item" active-class="active">
          <div class="sidebar-icon"><img src="../assets/home.png" /></div>
          <span class="sidebar-text">Home</span>
        </router-link>

        <router-link to="/friend" class="sidebar-item" active-class="active">
          <div class="sidebar-icon"><img src="../assets/friend.png" /></div>
          <span class="sidebar-text">Friend</span>
        </router-link>

        <router-link to="/marketplace" class="sidebar-item" active-class="active">
          <div class="sidebar-icon"><img src="../assets/marketplace.png" /></div>
          <span class="sidebar-text">Marketplace</span>
        </router-link>

        <router-link to="/saved" class="sidebar-item" active-class="active">
          <div class="sidebar-icon"><img src="../assets/save.png" /></div>
          <span class="sidebar-text">Saved</span>
        </router-link>

        <router-link to="/hidden" class="sidebar-item" active-class="active">
          <div class="sidebar-icon"><img src="../assets/hide.png" /></div>
          <span class="sidebar-text">Hidden</span>
        </router-link>

        <div class="divider"></div>

        <div class="sidebar-item" @click="goToProfile">
          <div class="sidebar-icon">
            <img :src="currentUser.avatarUrl || require('../assets/user.png')" style="border-radius: 50%; width: 28px; height: 28px; object-fit: cover;"/>
          </div>
          <span class="sidebar-text">Hồ sơ của tôi</span>
        </div>
      </div>
    </aside>
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
  </div>
</template>

<script>
import { useDark, useToggle } from '@vueuse/core';

export default {
  name: 'MainHeader',
  setup() {
    const isDark = useDark() 
    const toggleDark = useToggle(isDark)
    return { isDark, toggleDark }
  },
  data() {
    return {
      isSidebarOpen: true,
      showMessageDropdown: false,
      showNotificationDropdown: false,
      showUserDropdown: false,
      search: '',
      friends: [], 
      unreadMessages: 3,
      unreadNotifications: 5,
      notifications: [],
      
      // [CẬP NHẬT] Thêm các trường cần thiết cho User
      currentUser: {
        name: 'User',
        email: 'user@example.com',
        avatarUrl: '', // Link ảnh đã xử lý để hiển thị
        role: 'user',
        gender: ''
      },
      
      showMobileSearch: false,
      // Ảnh fallback cuối cùng nếu mọi thứ đều lỗi (ảnh trong assets)
      defaultAssetAvatar: require('../assets/user.png') 
    };
  },
  computed: {
    filteredFriends() {
       return []; // Logic filter của bạn
    }
  },
  methods: {
    toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; },
    
    // Logic đóng mở dropdown (giữ nguyên để đảm bảo chỉ 1 cái mở 1 lúc)
    toggleMessage() { 
      this.showMessageDropdown = !this.showMessageDropdown; 
      this.showNotificationDropdown = false; 
      this.showUserDropdown = false; 
    },
    toggleNotification() { 
      this.showNotificationDropdown = !this.showNotificationDropdown; 
      this.showMessageDropdown = false; 
      this.showUserDropdown = false; 
    },
    toggleUserDropdown() { 
      this.showUserDropdown = !this.showUserDropdown; 
      this.showMessageDropdown = false; 
      this.showNotificationDropdown = false; 
    },
    
    goToProfile() { 
      this.$router.push('/profile'); 
      this.showUserDropdown = false; 
    },
    goToSettings() { console.log('Settings'); },
    
    async logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      this.$router.push("/login");
    },

    handleClickOutside(event) {
      // Đóng dropdown khi click ra ngoài
      if (!this.$el.querySelector('.right').contains(event.target)) {
        this.showMessageDropdown = false;
        this.showNotificationDropdown = false;
        this.showUserDropdown = false;
      }
      // Logic đóng sidebar mobile
      if (window.innerWidth < 1024 && this.isSidebarOpen) {
         if (!this.$el.querySelector('.sidebar').contains(event.target) && !this.$el.querySelector('.menu-btn').contains(event.target)) {
             this.isSidebarOpen = false;
         }
      }
    },
    handleResize() {
      if (window.innerWidth < 1024) this.isSidebarOpen = false;
      else this.isSidebarOpen = true;

      if (window.innerWidth > 768) {
        this.showMobileSearch = false;
      }
    },

    // ============================================================
    // [MỚI] CÁC HÀM XỬ LÝ AVATAR (LOGIC ĐỒNG BỘ VỚI PROFILE PAGE)
    // ============================================================

    // 1. Tính toán ảnh mặc định dựa trên giới tính & role
    getDefaultAvatarPath(user) {
      if (!user) return "uploads/generic_avatar.png";
      
      if (user.role === "admin") return "uploads/admin_avatar.png";

      const g = user.gender ? user.gender.toLowerCase() : "";
      if (g === "male" || g === "nam") return "uploads/male_avatar.png";
      if (g === "female" || g === "nữ") return "uploads/female_avatar.png";
      
      return "uploads/generic_avatar.png";
    },

    // 2. Lấy URL hiển thị cuối cùng
    getAvatarUrl(user) {
      if (!user) return this.defaultAssetAvatar;

      // Nếu user có avatar riêng VÀ không phải là cái ảnh "user.png" cũ kỹ
      if (user.avatar && user.avatar !== "uploads/user.png") {
        return `http://localhost:3000/${user.avatar}`;
      }
      
      // Nếu không, tính toán ảnh mặc định server
      const defaultPath = this.getDefaultAvatarPath(user);
      return `http://localhost:3000/${defaultPath}`;
    },

    // 3. Hàm tải dữ liệu từ LocalStorage và cập nhật giao diện
    loadUserFromStorage() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user) {
            this.currentUser.name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
            this.currentUser.email = user.email || 'user@example.com';
            this.currentUser.role = user.role;
            this.currentUser.gender = user.gender;
            
            // Tính toán và gán link ảnh vào biến avatarUrl
            this.currentUser.avatarUrl = this.getAvatarUrl(user);
          }
        } catch (e) {
          console.error("Lỗi parse user:", e);
        }
      }
    }
  },
  
  mounted() {
    // 1. Tải thông tin user ngay khi Header xuất hiện
    this.loadUserFromStorage();

    // 2. Lắng nghe sự kiện custom: Khi ProfilePage update xong, nó sẽ bắn event này
    // Giúp Header cập nhật ảnh ngay lập tức mà không cần F5
    window.addEventListener('user-profile-updated', this.loadUserFromStorage);

    // 3. Lắng nghe sự kiện storage (khi thay đổi data ở tab khác)
    window.addEventListener('storage', this.loadUserFromStorage);

    // 4. Các sự kiện UI khác
    document.addEventListener('click', this.handleClickOutside);
    window.addEventListener('resize', this.handleResize);
    this.handleResize(); 
  },

  beforeUnmount() {
    // Dọn dẹp sự kiện để tránh rò rỉ bộ nhớ
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('user-profile-updated', this.loadUserFromStorage);
    window.removeEventListener('storage', this.loadUserFromStorage);
  }
};
</script>

<style scoped>
/* --- HEADER CHUNG --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 60px;
  padding: 0 16px;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* Left */
.left { display: flex; align-items: center; min-width: 240px; }
.menu-btn {
  padding: 10px; border-radius: 50%; cursor: pointer; margin-right: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.menu-btn:hover { background-color: #f0f2f5; }
.menu-icon-img { width: 24px; height: 24px; }
.logo { height: 32px; cursor: pointer; } /* Tăng nhẹ logo cho rõ */

/* Center - Search Bar Desktop */
.center { flex: 1; display: flex; justify-content: center; max-width: 700px; }
.search-wrapper {
  display: flex; align-items: center;
  background-color: #f0f2f5; border-radius: 50px;
  padding: 0 16px; width: 100%; height: 40px;
  transition: all 0.2s;
}
.search-icon { color: #65676b; margin-right: 8px; font-size: 16px; width: 16px; height: 16px; }
.search-input {
  border: none; background: transparent; outline: none;
  font-size: 15px; width: 100%; color: #050505;
}

/* Right - Actions */
.right { display: flex; align-items: center; gap: 10px; justify-content: flex-end; min-width: 200px; }
.icon-circle {
  width: 40px; height: 40px; border-radius: 50%; background: #e4e6eb;
  display: flex; justify-content: center; align-items: center;
  cursor: pointer; position: relative; flex-shrink: 0;
}
.icon-circle:hover { background: #d8dadf; }
.icon-img { width: 20px; height: 20px; }
.avatar-image { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.badge {
  position: absolute; top: -2px; right: -2px;
  background: #e41e3f; color: white;
  font-size: 11px; font-weight: bold; border-radius: 10px;
  padding: 2px 5px; min-width: 16px; text-align: center; border: 2px solid white;
}

/* --- SIDEBAR --- */
.sidebar {
  position: fixed; top: 60px; left: 0; bottom: 0;
  width: 280px; background: #f0f2f5;
  overflow-y: auto; padding: 16px 8px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 900; box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}
.sidebar.sidebar-closed { transform: translateX(-100%); }

.sidebar-item {
  display: flex; align-items: center; padding: 0 12px; height: 52px;
  border-radius: 8px; cursor: pointer; text-decoration: none;
  color: #050505; margin-bottom: 4px; transition: background 0.2s;
}
.sidebar-item:hover { background-color: #e4e6eb; }
.sidebar-item.active { background-color: #e4e6eb; font-weight: 600; }
.sidebar-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
.sidebar-icon img { width: 28px; height: 28px; object-fit: cover; }
.sidebar-text { font-size: 15px; font-weight: 500; }
.divider { height: 1px; background: #ced0d4; margin: 8px 12px; }
.sidebar-overlay {
  position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.6); backdrop-filter: blur(4px);
  z-index: 899;
}

/* --- DROPDOWNS --- */
.message-dropdown-panel, .notification-dropdown-panel, .user-dropdown-panel {
  position: absolute; top: 55px; right: 0; width: 360px;
  background: white; border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1001; overflow: hidden; border: 1px solid #f0f2f5;
}
/* (Các style dropdown con giữ nguyên như cũ hoặc tùy chỉnh thêm) */
.user-info { display: flex; align-items: center; padding: 16px; cursor: pointer; }
.user-info:hover { background: #f0f2f5; }
.user-avatar-img { width: 60px; height: 60px; border-radius: 50%; margin-right: 12px; object-fit: cover; }
.user-name { font-weight: 700; font-size: 17px; margin: 0; }
.user-email { font-size: 13px; color: #65676b; margin: 0; }
.menu-item { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; }
.menu-item:hover { background: #f0f2f5; }
.menu-icon-bg { width: 36px; height: 36px; border-radius: 50%; background: #e4e6eb; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
.menu-icon { width: 20px; height: 20px; }

/* --- RESPONSIVE MOBILE & TABLET --- */

/* Ẩn search trigger trên Desktop */
.mobile-search-trigger { display: none; }
.back-btn-mobile { display: none; }

@media (max-width: 900px) {
  /* Thu gọn Sidebar trên màn hình nhỏ */
  .sidebar { width: 100%; max-width: 300px; }
  .left { min-width: auto; }
  /* .logo { display: none; } Ẩn logo nếu chật quá, chỉ hiện icon menu */
}

@media (max-width: 768px) {
  .header { padding: 0 10px; }
  .left { min-width: auto; flex: 0 0 auto; }
  .right { min-width: auto; gap: 6px; }
  
  /* Hiện logo lại nhưng nhỏ hơn */
  .logo { display: block; height: 28px; }
  .logo-link { margin-right: 15px; }

  /* Ẩn search bar chính, hiện nút kính lúp */
  .center { display: none; }
  .mobile-search-trigger { display: flex !important; }

  /* --- CHẾ ĐỘ TÌM KIẾM MOBILE ACTIVE --- */
  .center.mobile-active {
    display: flex;
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: white;
    z-index: 1100; /* Cao hơn tất cả */
    padding: 0 8px;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.2s ease-out;
  }

  /* Style nút Back Mobile */
  .back-btn-mobile {
    display: flex;
    align-items: center; justify-content: center;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: transparent; border: none;
    cursor: pointer; flex-shrink: 0;
  }
  .back-btn-mobile:hover, .back-btn-mobile:active { background: #f0f2f5; }
  .back-btn-mobile img { width: 24px; height: 24px; opacity: 0.7; }

  /* Search Wrapper khi Active */
  .center.mobile-active .search-wrapper {
    width: 100%; height: 40px;
    background: #f0f2f5;
  }
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>