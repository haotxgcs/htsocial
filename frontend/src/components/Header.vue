<template>
  <header class="header">
    <!-- Left: Logo + Search -->
    <div class="left">
      <router-link to="/home">
        <img src="../assets/htsocial.png" alt="Logo" class="logo" />
      </router-link>
      <input type="text" placeholder="Search on HT Social..." class="search" />
    </div>

    <!-- Center: Navigation Icons -->
    <div class="center">
      <router-link to="/home" class="nav-icon" active-class="active">
        <img src="../assets/home.png" class="icon-img" />
      </router-link>
      <router-link to="/friend" class="nav-icon" active-class="active">
        <img src="../assets/friend.png" class="icon-img" />
      </router-link>
      <router-link to="/marketplace" class="nav-icon" active-class="active">
        <img src="../assets/marketplace.png" class="icon-img" />
      </router-link>
      <router-link to="/group" class="nav-icon" active-class="active">
        <img src="../assets/group.png" class="icon-img" />
      </router-link>
      <router-link to="/game" class="nav-icon" active-class="active">
        <img src="../assets/game.png" class="icon-img" />
      </router-link>
    </div>

    <!-- Right: Actions -->
    <div class="right">
      <div class="icon-circle">
        <img src="../assets/menu.png" class="icon-img" />
      </div>

      <!-- Message Dropdown -->
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
            <div 
              v-for="friend in filteredFriends" 
              :key="friend._id"
              @click="goToChat(friend)"
              class="message-item"
            >
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

      <!-- Notification Dropdown -->
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

      <!-- User Dropdown -->
      <div class="icon-circle user-dropdown" @click="toggleUserDropdown">
        <img src="../assets/user.png" class="avatar-image" />
        <div v-if="showUserDropdown" class="user-dropdown-panel">
          <!-- User Info Section -->
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

          <!-- Menu Items -->
          <div class="menu-items">
            <div class="menu-item" @click="goToSettings">
              <div class="menu-icon-bg settings">
                <img src="../assets/setting.png" class="menu-icon" />
              </div>
              <div class="menu-content">
                <p class="menu-title">Cài đặt và quyền riêng tư</p>
                <p class="menu-subtitle">Kiểm soát tài khoản của bạn</p>
              </div>
              <div class="menu-arrow">→</div>
            </div>

            <div class="menu-item" @click="goToHelp">
              <div class="menu-icon-bg help">
                <img src="../assets/help.png" class="menu-icon" />
              </div>
              <div class="menu-content">
                <p class="menu-title">Trợ giúp và hỗ trợ</p>
                <p class="menu-subtitle">Trung tâm trợ giúp và liên hệ</p>
              </div>
              <div class="menu-arrow">→</div>
            </div>

            <div class="menu-item" @click="goToDisplay">
              <div class="menu-icon-bg display">
                <img src="../assets/display.png" class="menu-icon" />
              </div>
              <div class="menu-content">
                <p class="menu-title">Màn hình & trợ năng</p>
                <p class="menu-subtitle">Điều chỉnh giao diện</p>
              </div>
              <div class="menu-arrow">→</div>
            </div>

            <div class="menu-item" @click="goToFeedback">
              <div class="menu-icon-bg feedback">
                <img src="../assets/feedback.png" class="menu-icon" />
              </div>
              <div class="menu-content">
                <p class="menu-title">Đóng góp ý kiến</p>
                <p class="menu-subtitle">Báo cáo vấn đề</p>
              </div>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <!-- Logout Section -->
          <div class="menu-item logout-item" @click="logout">
            <div class="menu-icon-bg logout">
              <img src="../assets/logout.png" class="menu-icon" />
            </div>
            <p class="menu-title">Đăng xuất</p>
          </div>

          <!-- Footer -->
          <div class="dropdown-footer">
            <p>Quyền riêng tư · Điều khoản · Quảng cáo · Lựa chọn quảng cáo · Cookie · Xem thêm · HT Social © 2025</p>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'MainHeader',
  data() {
    return {
      showMessageDropdown: false,
      showNotificationDropdown: false,
      showUserDropdown: false,
      search: '',
      friends: [],
      unreadMessages: 3,
      unreadNotifications: 5,
      notifications: [
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
        },
        {
          user: 'Lê Văn Nam',
          message: 'đã bình luận về bài viết của bạn: "Bài viết hay quá!"',
          time: '1 giờ trước',
          type: 'comment',
          avatar: null,
          unread: false
        },
        {
          user: 'Hoàng Thị Mai',
          message: 'đã gửi lời mời kết bạn cho bạn',
          time: '2 giờ trước',
          type: 'friend',
          avatar: null,
          unread: true
        },
        {
          user: 'Phạm Văn Đức',
          message: 'đã thích bình luận của bạn',
          time: '1 ngày trước',
          type: 'like',
          avatar: null,
          unread: false
        }
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
    goToSettings() {
      // Thêm logic chuyển đến trang cài đặt
      console.log('Chuyển đến cài đặt');
      this.showUserDropdown = false;
    },
    goToHelp() {
      // Thêm logic chuyển đến trang trợ giúp
      console.log('Chuyển đến trợ giúp');
      this.showUserDropdown = false;
    },
    goToDisplay() {
      // Thêm logic chuyển đến cài đặt hiển thị
      console.log('Chuyển đến cài đặt hiển thị');
      this.showUserDropdown = false;
    },
    goToFeedback() {
      // Thêm logic gửi phản hồi
      console.log('Gửi phản hồi');
      this.showUserDropdown = false;
    },
    async fetchFriends() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        const res = await fetch(`http://localhost:3000/users/${user.id}`);
        const data = await res.json();
        const allUsersRes = await fetch(`http://localhost:3000/users`);
        const allUsers = await allUsersRes.json();

        this.friends = allUsers.filter(u => data.friends.includes(u._id));
      } catch (err) {
        console.error("Lỗi khi tải bạn bè:", err);
      }
    },
    async logout() {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (user && token) {
        try {
          await fetch("http://localhost:3000/users/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user.id })
          });
        } catch (err) {
          console.error("Logout error:", err);
        }
      }

      // Xoá localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Chuyển về trang đăng nhập
      this.$router.push("/login");
    },
    // Đóng dropdown khi click ra ngoài
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.showMessageDropdown = false;
        this.showNotificationDropdown = false;
        this.showUserDropdown = false;
      }
    }
  },
  mounted() {
    this.fetchFriends();
    
    // Lấy thông tin user từ localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      this.currentUser.name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
      this.currentUser.email = user.email || 'user@example.com';
    }

    // Thêm event listener để đóng dropdown khi click ra ngoài
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // Xóa event listener khi component bị hủy
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #ccc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.left {
  display: flex;
  align-items: center;
}

.logo {
  height: 36px;
  margin-right: 12px;
}

.search {
  background: #f0f2f5;
  border: none;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 14px;
  width: 220px;
}

.center {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.nav-icon {
  width: 45px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.nav-icon:hover {
  background-color: #f0f2f5;
}

.nav-icon.active {
  border-bottom: 3px solid #1877f2;
  background-color: #f0f2f5;
}

.icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-circle {
  background: #e4e6eb;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: red;
  color: white;
  font-size: 10px;
  border-radius: 999px;
  padding: 2px 5px;
}

.avatar-image {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
}

.dropdown-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 300px;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border-radius: 8px;
  z-index: 999;
  padding: 10px;
}

.dropdown-panel h4 {
  margin-bottom: 10px;
  font-size: 16px;
}

.dropdown-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-panel li {
  padding: 8px 6px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  cursor: pointer;
}

.dropdown-panel li:hover {
  background-color: #f0f2f5;
}

.search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
}

/* User Dropdown Styles */
.user-dropdown-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 360px;
  background: white;
  border: 1px solid #dadde1;
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  border-radius: 8px;
  z-index: 999;
  overflow: hidden;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e6ea;
}

.user-avatar {
  width: 60px;
  height: 60px;
  margin-right: 12px;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 17px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 2px 0;
}

.user-email {
  font-size: 13px;
  color: #65676b;
  margin: 0;
}

.view-profile-btn {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  color: #1877f2;
  font-weight: 500;
  transition: background-color 0.2s;
}

.view-profile-btn:hover {
  background-color: #f0f2f5;
}

.view-profile-btn .menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.dropdown-divider {
  height: 1px;
  background: #e4e6ea;
  margin: 8px 0;
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f0f2f5;
}

.menu-icon-bg {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.menu-icon-bg.settings {
  background-color: #e3f2fd;
}

.menu-icon-bg.help {
  background-color: #e8f5e8;
}

.menu-icon-bg.display {
  background-color: #f3e5f5;
}

.menu-icon-bg.feedback {
  background-color: #fff3e0;
}

.menu-icon-bg.logout {
  background-color: #ffebee;
}

.menu-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 15px;
  font-weight: 500;
  color: #1c1e21;
  margin: 0 0 2px 0;
}

.menu-subtitle {
  font-size: 12px;
  color: #65676b;
  margin: 0;
}

.menu-arrow {
  font-size: 16px;
  color: #65676b;
}

.logout-item {
  border-top: 1px solid #e4e6ea;
  margin-top: 8px;
  padding-top: 16px;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #e4e6ea;
  background-color: #f8f9fa;
}

.dropdown-footer p {
  font-size: 11px;
  color: #65676b;
  margin: 0;
  line-height: 1.4;
}

/* Message Dropdown Styles */
.message-dropdown-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 360px;
  background: white;
  border: 1px solid #dadde1;
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  border-radius: 8px;
  z-index: 999;
  overflow: hidden;
  max-height: 500px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e6ea;
}

.dropdown-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1c1e21;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #e4e6ea;
}

.search-container {
  padding: 8px 16px;
}

.message-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccd0d5;
  border-radius: 20px;
  font-size: 14px;
  background: #f0f2f5;
  box-sizing: border-box;
}

.message-search-input:focus {
  outline: none;
  border-color: #1877f2;
  background: white;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.message-item:hover {
  background: #f0f2f5;
}

.message-avatar {
  position: relative;
  margin-right: 12px;
}

.message-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.online-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: #42b883;
  border: 2px solid white;
  border-radius: 50%;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.contact-name {
  font-size: 15px;
  font-weight: 500;
  color: #1c1e21;
}

.message-time {
  font-size: 12px;
  color: #65676b;
}

.message-preview {
  font-size: 13px;
  color: #65676b;
}

.last-message {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-status {
  margin-left: 8px;
}

.unread-dot {
  width: 12px;
  height: 12px;
  background: #1877f2;
  border-radius: 50%;
}

.no-messages {
  text-align: center;
  padding: 40px 20px;
  color: #65676b;
}

.dropdown-footer-btn {
  padding: 8px 16px;
  border-top: 1px solid #e4e6ea;
  text-align: center;
}

.dropdown-footer-btn a {
  display: block;
  padding: 8px 16px;
  color: #1877f2;
  text-decoration: none;
  font-size: 14px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.dropdown-footer-btn a:hover {
  background: #f0f2f5;
}

/* Notification Dropdown Styles */
.notification-dropdown-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 360px;
  background: white;
  border: 1px solid #dadde1;
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  border-radius: 8px;
  z-index: 999;
  overflow: hidden;
  max-height: 500px;
}

.notification-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid #e4e6ea;
}

.tab {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  color: #65676b;
  transition: all 0.2s;
}

.tab.active {
  color: #1877f2;
  border-bottom-color: #1877f2;
}

.tab:hover {
  background: #f0f2f5;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f0f2f5;
}

.notification-item.unread {
  background: rgba(24, 119, 242, 0.1);
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 20px;
  width: 12px;
  height: 12px;
  background: #1877f2;
  border-radius: 50%;
}

.notification-avatar {
  position: relative;
  margin-right: 12px;
}

.notification-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.notification-type-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: 2px solid white;
}

.notification-type-icon.like {
  background: #1877f2;
}

.notification-type-icon.comment {
  background: #42b883;
}

.notification-type-icon.friend {
  background: #f02849;
}

.notification-type-icon.share {
  background: #f7b928;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 14px;
  line-height: 1.3;
  color: #1c1e21;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 13px;
  color: #65676b;
}

.notification-actions {
  margin-left: 8px;
}

.notification-menu {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #65676b;
  transition: background-color 0.2s;
}

.notification-menu:hover {
  background: #f0f2f5;
}

.no-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #65676b;
}

.no-notifications-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* Badge improvements */
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #fa3e3e;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  padding: 2px 6px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
</style>