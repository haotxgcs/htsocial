<template>
  <div>
    <header class="header">
      <div class="left">
        <div class="menu-btn" @click="toggleSidebar">
          <img src="../assets/menu.png" alt="Menu" class="menu-icon-img" />
        </div>
        <router-link to="/home" class="logo-link">
          <img src="../assets/htsocial.png" alt="Logo" class="logo" />
        </router-link>
      </div>

      <div class="center">
        <div class="search-container-bar">
          <input type="text" placeholder="Tìm kiếm trên HT Social..." class="search-input-bar" />
          <button class="search-btn"><img src="../assets/search.png"></button>
        </div>
      </div>

      <div class="right">
        <div class="icon-circle" @click="toggleMessage">
          <img src="../assets/message.png" class="icon-img" />
          <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          <div v-if="showMessageDropdown" class="message-dropdown-panel">
            <div class="dropdown-header">
              <h3>Tin nhắn</h3>
              <div class="header-actions">
                <div class="action-btn">⋯</div>
                <div class="action-btn">🎥</div>
                <div class="action-btn">✏️</div>
              </div>
            </div>
            <div class="search-container">
              <input type="text" v-model="search" placeholder="Tìm kiếm trong Messenger" class="message-search-input" />
            </div>
            <div class="message-list">
              <div v-if="filteredFriends.length === 0" class="no-messages">
                <p>Không có tin nhắn nào</p>
              </div>
              <div v-for="friend in filteredFriends" :key="friend._id" @click="goToChat(friend)" class="message-item">
                <div class="message-avatar">
                  <img :src="friend.avatar || '../assets/user.png'" :alt="friend.firstname" />
                  <div class="online-status"></div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="contact-name">{{ friend.firstname }} {{ friend.lastname }}</span>
                    <span class="message-time">2 phút</span>
                  </div>
                  <div class="message-preview">
                    <span class="last-message">Bạn: Chào bạn! Bạn khỏe không?</span>
                  </div>
                </div>
                <div class="message-status">
                  <div class="unread-dot"></div>
                </div>
              </div>
            </div>
            <div class="dropdown-footer-btn">
              <router-link to="/message" @click="showMessageDropdown = false">
                Xem tất cả trong Messenger
              </router-link>
            </div>
          </div>
        </div>

        <div class="icon-circle notification" @click="toggleNotification">
          <img src="../assets/notification.png" class="icon-img" />
          <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
          <div v-if="showNotificationDropdown" class="notification-dropdown-panel">
            <div class="dropdown-header">
              <h3>Thông báo</h3>
              <div class="header-actions">
                <div class="action-btn">⋯</div>
              </div>
            </div>
            <div class="notification-tabs">
              <div class="tab active">Tất cả</div>
              <div class="tab">Chưa đọc</div>
            </div>
            <div class="notification-list">
              <div v-if="notifications.length === 0" class="no-notifications">
                <div class="no-notifications-icon">🔔</div>
                <p>Không có thông báo mới</p>
              </div>
              <div 
                v-for="(notification, index) in notifications" 
                :key="index"
                class="notification-item"
                :class="{ 'unread': notification.unread }"
              >
                <div class="notification-avatar">
                  <img :src="notification.avatar || '../assets/user.png'" :alt="notification.user" />
                  <div class="notification-type-icon" :class="notification.type">
                    <span v-if="notification.type === 'like'">👍</span>
                    <span v-else-if="notification.type === 'comment'">💬</span>
                    <span v-else-if="notification.type === 'friend'">👥</span>
                    <span v-else-if="notification.type === 'share'">📤</span>
                  </div>
                </div>
                <div class="notification-content">
                  <div class="notification-text">
                    <strong>{{ notification.user }}</strong> {{ notification.message }}
                  </div>
                  <div class="notification-time">{{ notification.time }}</div>
                </div>
                <div class="notification-actions">
                  <div class="notification-menu">⋯</div>
                </div>
              </div>
            </div>
            <div class="dropdown-footer-btn">
              <a href="#" @click="showNotificationDropdown = false">
                Xem tất cả thông báo
              </a>
            </div>
          </div>
        </div>

        <div class="icon-circle user-dropdown" @click="toggleUserDropdown">
          <img src="../assets/user.png" class="avatar-image" />
          <div v-if="showUserDropdown" class="user-dropdown-panel">
            <div class="user-info">
              <div class="user-avatar">
                <img src="../assets/user.png" class="user-avatar-img" />
              </div>
              <div class="user-details">
                <p class="user-name">{{ currentUser.name }}</p>
                <p class="user-email">{{ currentUser.email }}</p>
              </div>
            </div>
            <div class="view-profile-btn" @click="goToProfile">
              <img src="../assets/user.png" class="menu-icon" />
              Xem tất cả trang cá nhân
            </div>
            <div class="dropdown-divider"></div>
            <div class="menu-items">
              <div class="menu-item" @click="goToSettings">
                <div class="menu-icon-bg settings"><img src="../assets/setting.png" class="menu-icon" /></div>
                <div class="menu-content">
                  <p class="menu-title">Cài đặt & quyền riêng tư</p>
                </div>
                <div class="menu-arrow">→</div>
              </div>
              <div class="menu-item" @click="goToHelp">
                <div class="menu-icon-bg help"><img src="../assets/help.png" class="menu-icon" /></div>
                <div class="menu-content">
                  <p class="menu-title">Trợ giúp & hỗ trợ</p>
                </div>
                <div class="menu-arrow">→</div>
              </div>
              <div class="menu-item logout-item" @click="logout">
                <div class="menu-icon-bg logout"><img src="../assets/logout.png" class="menu-icon" /></div>
                <p class="menu-title">Đăng xuất</p>
              </div>
            </div>
             <div class="dropdown-footer">
              <p>HT Social © 2025</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <div class="sidebar-content">
        <router-link to="/home" class="sidebar-item" active-class="active">
          <div class="sidebar-icon">
            <img src="../assets/home.png" />
          </div>
          <span class="sidebar-text">Home</span>
        </router-link>

        <router-link to="/friend" class="sidebar-item" active-class="active">
          <div class="sidebar-icon">
            <img src="../assets/friend.png" />
          </div>
          <span class="sidebar-text">Friend</span>
        </router-link>

        <router-link to="/marketplace" class="sidebar-item" active-class="active">
          <div class="sidebar-icon">
            <img src="../assets/marketplace.png" />
          </div>
          <span class="sidebar-text">Marketplace</span>
        </router-link>

        

        <router-link to="/hidden" class="sidebar-item" active-class="active">
          <div class="sidebar-icon">
            <img src="../assets/hide.png" />
          </div>
          <span class="sidebar-text">Hidden Posts</span>
        </router-link>

        <router-link to="/saved" class="sidebar-item" active-class="active">
          <div class="sidebar-icon">
            <img src="../assets/save.png" />
          </div>
          <span class="sidebar-text">Saved Posts</span>
        </router-link>

        <div class="divider"></div>

        <div class="sidebar-item" @click="goToProfile">
          <div class="sidebar-icon">
             <img src="../assets/user.png" style="border-radius: 50%"/>
          </div>
          <span class="sidebar-text">Hồ sơ của tôi</span>
        </div>
      </div>
    </aside>
    
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
  </div>
</template>

<script>
export default {
  name: 'MainHeader',
  data() {
    return {
      isSidebarOpen: true, // Mặc định mở trên desktop
      showMessageDropdown: false,
      showNotificationDropdown: false,
      showUserDropdown: false,
      search: '',
      friends: [],
      unreadMessages: 3,
      unreadNotifications: 5,
      notifications: [
        // ... (Giữ nguyên data cũ)
         {
          user: 'Nguyễn Văn Hào',
          message: 'đã thích bài viết của bạn',
          time: '5 phút trước',
          type: 'like',
          avatar: null,
          unread: true
        },
        {
          user: 'Trần Thị Bảo',
          message: 'đã chia sẻ bài viết của bạn',
          time: '10 phút trước',
          type: 'share',
          avatar: null,
          unread: true
        }
        // ... thêm các item khác từ code cũ của bạn nếu cần
      ],
      currentUser: {
        name: 'Trần Xuân Hào',
        email: 'tranxuanhao@example.com'
      }
    };
  },
  computed: {
    filteredFriends() {
      return this.friends.filter(f =>
        `${f.firstname} ${f.lastname}`.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
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
    goToChat(friend) {
      this.$router.push({ 
        path: '/message', 
        query: { to: friend._id, name: `${friend.firstname} ${friend.lastname}` } 
      });
      this.showMessageDropdown = false;
    },
    goToProfile() {
      this.$router.push('/profile');
      this.showUserDropdown = false;
    },
    goToSettings() { console.log('Chuyển đến cài đặt'); this.showUserDropdown = false; },
    goToHelp() { console.log('Chuyển đến trợ giúp'); this.showUserDropdown = false; },
    goToDisplay() { console.log('Chuyển đến cài đặt hiển thị'); this.showUserDropdown = false; },
    goToFeedback() { console.log('Gửi phản hồi'); this.showUserDropdown = false; },
    
    async fetchFriends() {
      // ... (Giữ nguyên logic fetchFriends cũ)
       const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      try {
        // Mock data logic or real fetch here
      } catch (err) {
        console.error("Lỗi khi tải bạn bè:", err);
      }
    },
    async logout() {
      // ... (Giữ nguyên logic logout cũ)
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      this.$router.push("/login");
    },
    handleClickOutside(event) {
      // Logic đóng dropdown
      const headerRight = this.$el.querySelector('.right');
      if (headerRight && !headerRight.contains(event.target)) {
        this.showMessageDropdown = false;
        this.showNotificationDropdown = false;
        this.showUserDropdown = false;
      }
      
      // Logic đóng sidebar trên mobile khi click ra ngoài (nếu cần)
      const sidebar = this.$el.querySelector('.sidebar');
      const menuBtn = this.$el.querySelector('.menu-btn');
      if (window.innerWidth < 1024 && this.isSidebarOpen) {
         if (sidebar && !sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
             this.isSidebarOpen = false;
         }
      }
    },
    handleResize() {
      // Tự động đóng/mở sidebar dựa trên kích thước màn hình
      if (window.innerWidth < 1024) {
        this.isSidebarOpen = false;
      } else {
        this.isSidebarOpen = true;
      }
    }
  },
  mounted() {
    this.fetchFriends();
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      this.currentUser.name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
      this.currentUser.email = user.email || 'user@example.com';
    }
    document.addEventListener('click', this.handleClickOutside);
    window.addEventListener('resize', this.handleResize);
    this.handleResize(); // Check initial size
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
/* --- 1. HEADER STYLES (Thanh ngang trên cùng) --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 56px;
  padding: 0 16px;
  position: fixed; /* Cố định header */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid #e5e5e5;
}

/* Left: Menu Button + Logo */
.left {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.menu-btn {
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.menu-btn:hover {
  background-color: #f0f2f5;
}

.menu-icon-img {
  width: 24px;
  height: 24px;
}

.logo {
  height: 24px; /* Logo nhỏ gọn hơn giống YouTube */
  cursor: pointer;
}

/* Center: Search Bar */
.center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 720px; /* Giới hạn chiều rộng thanh tìm kiếm */
}

.search-container-bar {
  display: flex;
  width: 100%;
  align-items: center;
}

.search-input-bar {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #ccc;
  border-right: none;
  border-radius: 40px 0 0 40px;
  font-size: 16px;
  outline: none;
  background-color: white;
  box-shadow: inset 0 1px 2px #eee;
}

.search-input-bar:focus {
  border-color: #1c62b9;
  box-shadow: inset 0 1px 2px #eee, 0 0 2px #1c62b9;
}

.search-btn {
  height: 42px; /* Khớp với border của input */
  width: 64px;
  background-color: #f8f8f8;
  border: 1px solid #ccc;
  border-radius: 0 40px 40px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.search-btn:hover {
  background-color: #f0f0f0;
}

/* Right: Action Icons */
.right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
  justify-content: flex-end;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.icon-circle:hover {
  background: #f2f2f2;
}

.icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.avatar-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

/* Badge notification */
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #cc0000;
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 10px;
  padding: 2px 5px;
  min-width: 16px;
  text-align: center;
  border: 2px solid white;
}

/* --- 2. SIDEBAR STYLES (Menu Dọc) --- */
.sidebar {
  position: fixed;
  top: 56px; /* Nằm ngay dưới header */
  left: 0;
  bottom: 0;
  width: 240px;
  background: white;
  padding: 12px 12px 12px 0; /* padding phải 0 để scrollbar đẹp hơn */
  overflow-y: auto; /* Cho phép cuộn dọc */
  transition: transform 0.2s ease-in-out;
  z-index: 900;
  /* Tạo thanh cuộn đẹp hơn cho Chrome/Safari */
  scrollbar-width: thin;
  scrollbar-color: #909090 #f0f0f0;
}

/* Class để ẩn sidebar khi toggle */
.sidebar.sidebar-closed {
  transform: translateX(-100%);
}

.sidebar-content {
  padding-right: 12px; /* Bù lại padding scrollbar */
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 48px;
  border-radius: 0 10px 10px 0; /* Bo tròn góc phải */
  cursor: pointer;
  text-decoration: none;
  color: #0f0f0f;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.sidebar-item:hover {
  background-color: #f2f2f2;
}

.sidebar-item.active {
  background-color: #e5e5e5;
  font-weight: 600;
}

.sidebar-icon {
  margin-right: 24px;
  margin-left: 12px;
  display: flex;
  align-items: center;
  width: 24px;
}

.sidebar-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.sidebar-text {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  height: 1px;
  background: #e5e5e5;
  margin: 12px 0;
}

/* Overlay cho Mobile/Tablet */
.sidebar-overlay {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 899;
}

/* --- 3. RESPONSIVE --- */
@media (max-width: 1024px) {
  /* Trên tablet/mobile: Sidebar mặc định ẩn (hoặc hiện kiểu overlay) */
  .sidebar {
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  
  .search-input-bar {
    width: 100%; /* Full width trên tablet nhỏ */
  }
}

@media (max-width: 768px) {
  /* Trên mobile: Ẩn thanh search, chỉ hiện icon hoặc thu gọn */
  .center {
    display: none; 
    /* Nếu muốn hiện nút search icon trên mobile thì cần thêm logic HTML khác */
  }
  .left {
    min-width: auto;
  }
}

/* --- 4. DROPDOWN STYLES (Giữ nguyên logic cũ nhưng căn chỉnh lại vị trí) --- */
.message-dropdown-panel,
.notification-dropdown-panel,
.user-dropdown-panel {
  position: absolute;
  top: 50px; /* Đẩy xuống dưới icon */
  right: 0;
  width: 360px;
  background: white;
  border: 1px solid #dadde1;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 1001; /* Phải cao hơn header và sidebar */
  overflow: hidden;
  cursor: default; /* Tránh con trỏ pointer toàn bảng */
}

/* Các style chi tiết bên trong Dropdown (User Info, Notification List...) 
   giữ nguyên từ file cũ của bạn để đảm bảo tính năng không bị vỡ */

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e6ea;
}
.dropdown-header h3 {
  font-size: 24px; font-weight: 700; margin: 0;
}
.header-actions .action-btn {
  width: 32px; height: 32px; border-radius: 50%; background: #f0f2f5; 
  display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 8px;
}

/* Message List */
.search-container { padding: 8px 16px; }
.message-search-input {
  width: 100%; padding: 8px 12px; border-radius: 20px; border: 1px solid #ddd; background: #f0f2f5;
}
.message-list, .notification-list { max-height: 400px; overflow-y: auto; }
.message-item, .notification-item {
  padding: 8px 16px; display: flex; align-items: center; cursor: pointer; position: relative;
}
.message-item:hover, .notification-item:hover { background: #f0f2f5; }

/* User Menu Items */
.user-info { padding: 16px; display: flex; align-items: center; border-bottom: 1px solid #eee; }
.user-avatar-img { width: 60px; height: 60px; border-radius: 50%; margin-right: 12px; }
.user-name { font-weight: 600; font-size: 16px; margin: 0; }
.user-email { font-size: 13px; color: #65676b; margin: 0; }
.view-profile-btn {
  margin: 8px 16px; padding: 6px; color: #1877f2; font-weight: 500; cursor: pointer; border-radius: 6px;
}
.view-profile-btn:hover { background: #f2f2f2; }

.menu-items { padding: 8px 0; }
.menu-item { display: flex; align-items: center; padding: 8px 16px; cursor: pointer; }
.menu-item:hover { background-color: #f2f2f2; }
.menu-icon-bg {
  width: 36px; height: 36px; border-radius: 50%; background: #e4e6eb; 
  display: flex; align-items: center; justify-content: center; margin-right: 12px;
}
.menu-icon { width: 20px; height: 20px; }
.menu-content p { margin: 0; }
.menu-title { font-weight: 500; font-size: 15px; }
.menu-subtitle { font-size: 12px; color: #65676b; }
.dropdown-footer-btn { padding: 12px; text-align: center; border-top: 1px solid #eee; }
.dropdown-footer-btn a { text-decoration: none; color: #1877f2; font-weight: 500; }
.dropdown-footer { background: #f7f8fa; padding: 12px; font-size: 11px; color: #65676b; }
</style>