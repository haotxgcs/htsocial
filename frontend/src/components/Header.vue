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
  <div v-if="showMessageDropdown" class="dropdown-panel">
    <h4>Message</h4>
    <input type="text" placeholder="Tìm kiếm..." class="search-input" />
    <ul>
      <li v-for="(msg, index) in messages" :key="index">{{ msg }}</li>
    </ul>
  </div>
</div>

<!-- Notification Dropdown -->
<div class="icon-circle notification" @click="toggleNotification">
  <img src="../assets/notification.png" class="icon-img" />
  <!-- <span class="badge">1</span> -->
  <div v-if="showNotificationDropdown" class="dropdown-panel">
    <h4>Notifications</h4>
    <ul>
      <li v-for="(noti, index) in notifications" :key="index">{{ noti }}</li>
    </ul>
  </div>
</div>


      <router-link to="/profile" class="icon-circle">
        <img src="../assets/user.png" class="avatar-image" />
      </router-link>
    </div>

<div class="icon-circle" @click="logout">
<img src="../assets/logout.png" class="icon-img" />
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
      messages: [
        "Hào: Chào bạn 👋",
        "Tran: File mới nhé",
        "Bảo: Nhớ check inbox"
      ],
      notifications: [
        "Bạn có 1 lời mời kết bạn",
        "Hào đã like bài viết của bạn",
        "Bảo đã chia sẻ bài viết của bạn"
      ]
    };
  },
  methods: {
    toggleMessage() {
      this.showMessageDropdown = !this.showMessageDropdown;
      this.showNotificationDropdown = false;
    },
    toggleNotification() {
      this.showNotificationDropdown = !this.showNotificationDropdown;
      this.showMessageDropdown = false;
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
    }
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



</style>
