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
          ←<img src="../assets/back.png">
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
          <img 
            v-if="isDark" 
            src="../assets/light.png" 
            alt="Light Mode" 
            class="theme-icon" 
          />
          
          <img 
            v-else 
            src="../assets/dark.png" 
            alt="Dark Mode" 
            class="theme-icon" 
          />
        </div>

        <div class="icon-circle" @click="toggleMessage">
          <img src="../assets/message.png" class="icon-img" />
          <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          
          <div v-if="showMessageDropdown" class="message-dropdown-panel">
             <div class="dropdown-header">
               <h3>Tin nhắn</h3>
               <div class="header-actions">
                 <div class="action-btn">⋯</div>
               </div>
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
            <div class="notification-list">
               </div>
          </div>
        </div>

        <div class="icon-circle user-dropdown" @click="toggleUserDropdown">
          <img src="../assets/user.png" class="avatar-image" />
          
          <div v-if="showUserDropdown" class="user-dropdown-panel">
            <div class="user-info" @click="goToProfile">
              <img src="../assets/user.png" class="user-avatar-img" />
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
          <div class="sidebar-icon"><img src="../assets/user.png" style="border-radius: 50%"/></div>
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
      friends: [], // Giả sử data bạn bè
      unreadMessages: 3,
      unreadNotifications: 5,
      notifications: [], // Giả sử data thông báo
      currentUser: {
        name: 'User',
        email: 'user@example.com'
      },
      showMobileSearch: false,
    };
  },
  computed: {
    filteredFriends() {
       return []; // Logic filter của bạn
    }
  },
  methods: {
    toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; },
    toggleMessage() { this.showMessageDropdown = !this.showMessageDropdown; this.showNotificationDropdown = false; this.showUserDropdown = false; },
    toggleNotification() { this.showNotificationDropdown = !this.showNotificationDropdown; this.showMessageDropdown = false; this.showUserDropdown = false; },
    toggleUserDropdown() { this.showUserDropdown = !this.showUserDropdown; this.showMessageDropdown = false; this.showNotificationDropdown = false; },
    goToProfile() { this.$router.push('/profile'); this.showUserDropdown = false; },
    goToSettings() { console.log('Settings'); },
    async logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      this.$router.push("/login");
    },
    handleClickOutside(event) {
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
    }
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      this.currentUser.name = `${user.firstname} ${user.lastname}`;
      this.currentUser.email = user.email;
    }
    document.addEventListener('click', this.handleClickOutside);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
/* --- HEADER --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 60px; /* Tăng nhẹ chiều cao */
  padding: 0 16px;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* Shadow nhẹ hơn */
}

/* Left */
.left { display: flex; align-items: center; min-width: 240px; }
.menu-btn {
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  margin-right: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.menu-btn:hover { background-color: #f0f2f5; }
.menu-icon-img { width: 20px; height: 20px; }
.logo { height: 28px; cursor: pointer; }

/* Center - Search Bar Mới */
.center { flex: 1; display: flex; justify-content: center; }
.search-wrapper {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 50px;
  padding: 0 16px;
  width: 100%;
  max-width: 600px;
  height: 40px;
  transition: width 0.2s;
}
.search-icon { color: #65676b; margin-right: 8px; font-size: 14px; }
.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  width: 100%;
  color: #050505;
}
.search-input::placeholder { color: #65676b; }

/* Right - Actions */
.right { display: flex; align-items: center; gap: 8px; justify-content: flex-end; min-width: 200px; }
.icon-circle {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: #e4e6eb;
  display: flex; justify-content: center; align-items: center;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}
.icon-circle:hover { background: #d8dadf; }
.icon-img { width: 20px; height: 20px; }
.avatar-image { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.badge {
  position: absolute; top: -2px; right: -2px;
  background: #e41e3f; color: white;
  font-size: 11px; font-weight: bold;
  border-radius: 10px; padding: 2px 5px;
  min-width: 16px; text-align: center; border: 2px solid white;
}

/* --- SIDEBAR --- */
.sidebar {
  position: fixed; top: 60px; left: 0; bottom: 0;
  width: 260px; /* Rộng hơn chút cho thoáng */
  background: #f0f2f5; /* Nền xám nhẹ cho sidebar */
  overflow-y: auto;
  padding: 16px 8px;
  transition: transform 0.2s ease-in-out;
  z-index: 900;
}
.sidebar.sidebar-closed { transform: translateX(-100%); }

.sidebar-item {
  display: flex; align-items: center;
  padding: 0 12px; height: 52px;
  border-radius: 8px;
  cursor: pointer; text-decoration: none;
  color: #050505;
  transition: background 0.2s;
  margin-bottom: 4px;
}
.sidebar-item:hover { background-color: #e4e6eb; }
.sidebar-item.active { background-color: #e4e6eb; font-weight: 600; } /* Không dùng màu xanh nữa, dùng xám đậm cho clean */
.sidebar-item.active .sidebar-icon img { transform: scale(1.05); } /* Hiệu ứng nhẹ */

.sidebar-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 12px;
}
.sidebar-icon img { width: 28px; height: 28px; object-fit: contain; }
.sidebar-text { font-size: 15px; font-weight: 500; }
.divider { height: 1px; background: #ced0d4; margin: 8px 12px; }

/* Overlay */
.sidebar-overlay {
  position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8); /* Kính mờ */
  backdrop-filter: blur(4px);
  z-index: 899;
}

/* --- DROPDOWNS (Giữ nguyên nhưng chỉnh vị trí top) --- */
.message-dropdown-panel, .notification-dropdown-panel, .user-dropdown-panel {
  position: absolute; top: 55px; right: 0;
  width: 360px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.2);
  z-index: 1001;
  overflow: hidden;
  cursor: default;
}

.user-info {
  display: flex; align-items: center; padding: 16px;
  border-radius: 8px; margin: 8px; cursor: pointer;
  transition: background 0.2s;
}
.user-info:hover { background: #f0f2f5; }
.user-avatar-img { width: 60px; height: 60px; border-radius: 50%; margin-right: 12px; object-fit: cover; }
.user-name { font-weight: 600; font-size: 17px; color: #050505; margin: 0; }
.user-email { font-size: 13px; color: #65676b; margin: 0; }

.menu-item {
  display: flex; align-items: center; padding: 8px 16px; cursor: pointer;
  transition: background 0.2s;
}
.menu-item:hover { background: #f0f2f5; }
.menu-icon-bg {
  width: 36px; height: 36px; border-radius: 50%; background: #e4e6eb;
  display: flex; align-items: center; justify-content: center; margin-right: 12px;
}
.menu-icon { width: 20px; height: 20px; }
.menu-title { font-weight: 500; font-size: 15px; color: #050505; margin: 0; }

.theme-icon {
  width: 22px;  /* Kích thước icon, chỉnh tùy ý (thường là 20-24px) */
  height: 22px;
  object-fit: contain;
  transition: transform 0.3s ease; /* Hiệu ứng xoay nhẹ khi bấm */
}



/* --- MOBILE SEARCH STYLES --- */

/* Mặc định ẩn nút trigger tìm kiếm trên desktop */
.mobile-search-trigger {
  display: none;
}

.back-btn-mobile {
  display: none; /* Ẩn trên desktop */
}

/* RESPONSIVE */
@media (max-width: 768px) {
  /* 1. Hiện nút trigger tìm kiếm (kính lúp tròn) ở bên phải */
  .mobile-search-trigger {
    display: flex !important; /* Quan trọng: Hiện lên */
  }

  /* 2. Ẩn thanh tìm kiếm chính mặc định trên mobile */
  .center {
    display: none; 
  }

  /* 3. KHI BẤM VÀO NÚT TÌM KIẾM (Active Mode) */
  .center.mobile-active {
    display: flex;       /* Hiện lại */
    position: absolute;  /* Đè lên header cũ */
    top: 0; left: 0; right: 0; bottom: 0;
    background: white;   /* Nền trắng che logo */
    z-index: 1002;
    padding: 0 10px;
    align-items: center;
    gap: 10px;
  }

  /* Style cho nút Back mũi tên */
  .back-btn-mobile {
    display: block;
    background: none;
    border: none;
    font-size: 24px;
    color: #65676b;
    cursor: pointer;
    padding: 0 8px;
  }

  /* Kéo dài thanh input khi active */
  .center.mobile-active .search-wrapper {
    width: 100%;
    max-width: 100%;
  }
  
  /* Khi search active, class 'left' và 'right' đã bị v-show ẩn đi trong template */
}
</style>