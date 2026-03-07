<template>
  <div>
    <div class="mobile-toggle" @click="isOpen = !isOpen" :class="{ 'active': isOpen }">
      <img v-if="!isOpen" src="../assets/menu.png" alt="Menu" />
      <img v-else src="../assets/hide.png" alt="Close" style="filter: invert(1);" /> 
    </div>

    <aside class="vertical-sidebar" :class="{ 'open': isOpen }">

      <div class="sidebar-header">
        <router-link to="/home" class="logo-link">
          <img src="../assets/htsocial.png" alt="HTSocial" class="logo" />
        </router-link>
      </div>

      

      <nav class="sidebar-nav">
        <router-link to="/home" class="nav-item" active-class="active">
          <div class="icon-box"><House/></div>
          <span>Home</span>
        </router-link>

        <router-link to="/friend" class="nav-item" active-class="active">
          <div class="icon-box"><Users/></div>
          <span>Friends</span>
        </router-link>

        <router-link to="/marketplace" class="nav-item" active-class="active">
          <div class="icon-box"><Store/></div>
          <span>Marketplace</span>
        </router-link>

        <router-link to="/saved" class="nav-item" active-class="active">
          <div class="icon-box"><Bookmark/></div>
          <span>Saved</span>
        </router-link>

        <router-link to="/hidden" class="nav-item" active-class="active">
          <div class="icon-box"><EyeOff/></div>
          <span>Hidden</span>
        </router-link>

        <router-link to="/orders" class="nav-item" active-class="active">
          <div class="icon-box"><ShoppingBag/></div>
          <span>Orders</span>
        </router-link>

        <router-link to="/cart" class="nav-item" active-class="active">
          <div class="icon-box"><ShoppingCart/></div>
          <span>Cart</span>
        </router-link>

        <router-link to="/seller-orders" class="nav-item" active-class="active">
          <div class="icon-box"><Store/></div>
          <span>Seller Orders</span>
        </router-link>
        
      </nav>

      <div class="spacer"></div>

      <div class="sidebar-actions">
        <div class="action-btn" @click="toggleDark()" title="Theme">
          <!-- <img v-if="isDark" src="../assets/light.png" />
          <img v-else src="../assets/dark.png" /> -->
          <div v-if="isDark"><Sun/></div>
          <div v-else><Moon/></div>
        </div>

        <div class="action-btn" @click.stop="toggleMessage" title="Message">
          <MessageCircle/>
          <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          
          <div v-if="showMessageDropdown" class="popover-panel">
             <div class="popover-header"><h3>Tin nhắn</h3></div>
             <div class="popover-body">
                <p class="empty-text">Không có tin nhắn mới</p>
             </div>
             <div class="popover-footer">
                <router-link to="/message">Xem tất cả</router-link>
             </div>
          </div>
        </div>

        <div class="action-btn" @click.stop="toggleNotification" title="Notifications">
          <Bell/>
          <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>

          <div v-if="showNotificationDropdown" class="popover-panel">
            <div class="popover-header"><h3>Thông báo</h3></div>
            <div class="popover-body"><p class="empty-text">Chưa có thông báo</p></div>
          </div>
        </div>
      </div>

      <div class="user-profile-section" @click.stop="toggleUserDropdown">
        <div class="profile-card">
          <img :src="currentUser.avatarUrl || defaultAssetAvatar" class="avatar" />
          <div class="user-info">
            <p class="name">{{ currentUser.name }}</p>
            <p class="username">{{ currentUser.username }}</p>
          </div>
        </div>

        <div v-if="showUserDropdown" class="user-menu-popover">
          <div class="menu-item" @click="goToProfile">
            <CircleUserRound/> View Profile
          </div>
          <div class="menu-item" @click="goToSettings">
            <Settings/> Settings
          </div>
          <div class="menu-item logout" @click="logout">
            <LogOut/> Logout
          </div>
        </div>
      </div>

    </aside>

    <div v-if="isOpen" class="sidebar-overlay" @click="isOpen = false"></div>

  </div>
</template>

<script>
import { useDark, useToggle } from '@vueuse/core';
import { House, Users, Store, Bookmark, EyeOff, ShoppingBag, Moon, Sun, MessageCircle, Bell, CircleUserRound, Settings, LogOut, ShoppingCart  } from 'lucide-vue-next';

export default {
  name: 'VerticalHeader',
  components: { 
    House,
    Users,
    Store,
    Bookmark,
    EyeOff,
    ShoppingBag,
    Moon,
    Sun,
    MessageCircle,
    Bell,
    CircleUserRound,
    Settings,
    LogOut,
    ShoppingCart 
  },
  setup() {
    const isDark = useDark();
    const toggleDark = useToggle(isDark);
    return { isDark, toggleDark };
  },
  data() {
    return {
      isOpen: false,
      search: '',
      
      showMessageDropdown: false,
      showNotificationDropdown: false,
      showUserDropdown: false,

      unreadMessages: 2,
      unreadNotifications: 5,

      currentUser: {
        name: 'User',
        username: '@user', // Thay role bằng username
        avatarUrl: ''
      },
      defaultAssetAvatar: require('../assets/user.png')
    };
  },
  methods: {
    handleSearch() {
      console.log('Searching:', this.search);
    },
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
    
    goToProfile() { this.$router.push('/profile'); this.closeDropdowns(); },
    goToSettings() { console.log('Settings'); this.closeDropdowns(); },
    closeDropdowns() {
      this.showUserDropdown = false;
      this.showMessageDropdown = false; 
      this.showNotificationDropdown = false;
    },
    
    async logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      this.$router.push("/login");
    },

    loadUserFromStorage() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUser.name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
          
          // ⭐ SỬA LOGIC: Lấy username hoặc email
          if (user.username) {
            this.currentUser.username = `@${user.username}`;
          } else if (user.email) {
            this.currentUser.username = user.email;
          } else {
            this.currentUser.username = '@user';
          }
          
          if (user.avatar && user.avatar !== "uploads/user.png") {
            this.currentUser.avatarUrl = `http://localhost:3000/${user.avatar}`;
          } else {
             this.currentUser.avatarUrl = this.defaultAssetAvatar; 
          }
        } catch (e) { console.error(e); }
      }
    },
    
    handleClickOutside(e) {
      if (!this.$el.contains(e.target)) {
        this.closeDropdowns();
      }
    }
  },
  watch: {
    $route() {
      this.isOpen = false;
    }
  },
  mounted() {
    this.loadUserFromStorage();
    document.addEventListener('click', this.handleClickOutside);
    window.addEventListener('user-profile-updated', this.loadUserFromStorage);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style scoped>
/* --- VARIABLES --- */
:root {
  --primary: #FF642F;
  --bg-sidebar: #FFFFFF;
  --text-main: #333;
  --hover-bg: #FFF0E6;
}

/* --- LAYOUT CHÍNH --- */
.vertical-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 280px;
  background-color: var(--bg-sidebar, #fff);
  border-right: 1px solid #EAEAEA;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0,0,0,0.02);
  
  /* ⭐ QUAN TRỌNG: Cho phép cuộn cả thanh sidebar nếu màn hình quá ngắn */
  overflow-y: visible; 
}

/* Ẩn thanh cuộn của sidebar cho đẹp */
.vertical-sidebar::-webkit-scrollbar { width: 0; }

/* --- 1. LOGO --- */
.sidebar-header {
  margin-bottom: 20px;
  padding-left: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0; /* Không cho logo bị co lại */
}
.logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

/* --- 2. SEARCH BOX --- */
.sidebar-search {
  margin-bottom: 20px;
  flex-shrink: 0;
}
.search-box {
  display: flex;
  align-items: center;
  background: #F8F9FA;
  border: 1px solid #EEE;
  border-radius: 12px;
  padding: 10px 12px;
  transition: all 0.2s;
}
.search-box:focus-within {
  border-color: #FF642F;
  background: #FFF;
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1);
}
.search-icon { width: 16px; opacity: 0.5; margin-right: 8px; }
.search-box input {
  border: none; outline: none; width: 100%; background: transparent;
  font-size: 14px; color: #333;
}

/* --- 3. NAVIGATION --- */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px; 
  /* ⭐ FIX: Xóa overflow-y: auto ở đây để không hiện thanh cuộn con */
  /* Menu sẽ hiển thị full, đẩy các phần dưới xuống */
  flex-shrink: 0; 
  margin-bottom: 10px;
  overflow-y: auto;
}

.sidebar-footer {
  flex-shrink: 0; /* Không bao giờ bị co lại */
  background: #fff;
  position: relative; /* Làm điểm neo cho popup */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #F8F9FA;
  color: #FF642F;
}

.nav-item.active {
  background-color: #FF642F;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 100, 47, 0.25);
}

.nav-item .icon-box {
  width: 24px; margin-right: 12px; display: flex; justify-content: center;
}
.nav-item img {
  width: 20px; height: 20px; object-fit: contain;
  opacity: 0.6; transition: 0.2s;
}
.nav-item:hover img { opacity: 1; filter: invert(53%) sepia(35%) saturate(3000%) hue-rotate(345deg) brightness(100%) contrast(105%); } 
.nav-item.active img {
  filter: brightness(0) invert(1);
  opacity: 1;
}

/* Spacer: Đẩy các phần bên dưới xuống đáy */
.spacer { flex-grow: 1; }

/* --- 4. ACTIONS (ICONS) --- */
.sidebar-actions {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 16px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.action-btn {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: #F8F9FA;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: all 0.2s;
}
.action-btn:hover { background: #FFF0E6; transform: translateY(-2px); }
.action-btn img { width: 20px; opacity: 0.7; }
.badge {
  position: absolute; top: -2px; right: -2px;
  background: #FF4444; color: white;
  font-size: 10px; font-weight: bold;
  padding: 2px 5px; border-radius: 10px;
  border: 2px solid #fff;
}

/* --- 5. USER PROFILE --- */
.user-profile-section {
  position: relative;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  flex-shrink: 0; /* Giữ user profile luôn cố định kích thước */
}
.profile-card {
  display: flex; align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.profile-card:hover { 
  background: #F8F9FA; 
  border-color: #eee;
}

.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 1px solid #eee; }
.user-info .name { font-weight: 700; font-size: 14px; margin: 0; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.user-info .username { font-size: 12px; color: #999; margin: 0; }

/* --- POPOVERS --- */
.popover-panel {
  position: absolute; left: 50px; bottom: 40px;
  width: 280px; background: white; border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12); z-index: 1100; border: 1px solid #eee;
}
.popover-header { padding: 12px 16px; border-bottom: 1px solid #f5f5f5; font-weight: 600; font-size: 14px; }
.popover-body { padding: 20px; text-align: center; color: #999; font-size: 13px; }
.popover-footer { padding: 12px; text-align: center; border-top: 1px solid #f5f5f5; }
.popover-footer a { color: #FF642F; font-weight: 600; font-size: 13px; text-decoration: none; }

/* User Menu Dropdown */
.user-menu-popover {
  position: absolute; bottom: 100%; left: 0; width: 100%;
  background: white; border-radius: 12px;
  box-shadow: 0 -5px 25px rgba(0,0,0,0.1); margin-bottom: 12px;
  overflow: hidden; z-index: 1100; border: 1px solid #eee;
}
.menu-item { padding: 12px 16px; display: flex; align-items: center; cursor: pointer; color: #555; font-size: 14px; transition: 0.2s; }
.menu-item:hover { background: #f9f9f9; color: #FF642F; }
.menu-item img { width: 18px; margin-right: 12px; opacity: 0.6; }

/* --- RESPONSIVE MOBILE --- */
.mobile-toggle {
  display: none; 
  position: fixed; 
  top: 16px; left: 16px;
  width: 40px; height: 40px;
  background: white; 
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1200; 
  cursor: pointer;
  align-items: center; justify-content: center;
}
.mobile-toggle img { width: 22px; height: 22px; }
.mobile-toggle.active { background: #FF642F; }
.mobile-toggle.active img { filter: brightness(0) invert(1); }

.sidebar-overlay { display: none; }

@media (max-width: 1024px) {
  .mobile-toggle { display: flex; }
  
  .vertical-sidebar {
    transform: translateX(-100%);
    padding-top: 70px; 
  }
  
  .vertical-sidebar.open {
    transform: translateX(0);
  }
  
  .sidebar-overlay {
    display: block; position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); 
    backdrop-filter: blur(2px);
    z-index: 999;
  }
}
</style>