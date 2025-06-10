<template>
  <div class="friend-page">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Friends</h2>
        <div class="settings-icon">⚙️</div>
      </div>
      
      <div class="sidebar-menu">
        <div class="menu-item active">
          <span class="icon">🏠</span>
          <span>Home</span>
        </div>
        <div class="menu-item">
          <span class="icon">👥</span>
          <span>Friend Requests</span>
          <span class="arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="icon">💡</span>
          <span>Suggestions</span>
          <span class="arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="icon">👫</span>
          <span>All friends</span>
          <span class="arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="icon">🎂</span>
          <span>Birthdays</span>
        </div>
        <div class="menu-item">
          <span class="icon">📋</span>
          <span>Custom Lists</span>
          <span class="arrow">›</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="content-header">
        <h3>Friend Requests</h3>
        <a href="#" class="see-all">See all</a>
      </div>

      <div class="friend-requests-grid">
        <div class="friend-card" v-for="friend in friends" :key="friend.id">
          <div class="friend-image">
            <img :src="friend.avatar || defaultAvatar" alt="Profile" />
          </div>
          <div class="friend-info">
            <h4>{{ friend.firstname }} {{ friend.lastname }}</h4>
            <div class="mutual-friends" v-if="friend.mutualFriends">
              <span class="mutual-icon">👥</span>
              <span>{{ friend.mutualFriends }} mutual friend{{ friend.mutualFriends !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          <div class="friend-actions">
            <button class="confirm-btn" @click="confirmFriend(friend.id)">Confirm</button>
            <button class="delete-btn" @click="removeFriend(friend.id)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Nếu không có friend requests, hiển thị danh sách bạn bè hiện tại -->
      <div v-if="friends.length === 0" class="no-requests">
        <h3>All Friends</h3>
        <div class="friends-grid">
          <div class="existing-friend-card" v-for="friend in existingFriends" :key="friend.id">
            <img :src="friend.avatar || defaultAvatar" alt="Profile" />
            <div class="friend-name">{{ friend.firstname }} {{ friend.lastname }}</div>
            <button class="unfriend-btn" @click="removeFriend(friend.id)">Unfriend</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FriendPage",
  data() {
    return {
      friends: [
        // Mock data for friend requests (giống như trong hình)
        {
          id: 1,
          firstname: "Nguyễn Ky",
          lastname: "Duyên",
          avatar: null,
          mutualFriends: 1
        },
        {
          id: 2,
          firstname: "Minh",
          lastname: "PT",
          avatar: null,
          mutualFriends: 1
        },
        {
          id: 3,
          firstname: "Loan",
          lastname: "Anh",
          avatar: null,
          mutualFriends: 0
        },
        {
          id: 4,
          firstname: "Kim",
          lastname: "Hiên",
          avatar: null,
          mutualFriends: 1
        },
        {
          id: 5,
          firstname: "Minh",
          lastname: "Tran",
          avatar: null,
          mutualFriends: 3
        }
      ],
      existingFriends: [], // Danh sách bạn bè hiện tại
      defaultAvatar: require('../assets/user.png'),
    };
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");

    // Gọi API lấy danh sách bạn bè hiện tại
    fetch(`http://localhost:3000/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.friends && data.friends.length > 0) {
          Promise.all(
            data.friends.map(id =>
              fetch(`http://localhost:3000/users/${id}`).then(res => res.json())
            )
          ).then(friendsData => {
            this.existingFriends = friendsData;
          });
        }
      });
  },
  methods: {
    async confirmFriend(friendId) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        const res = await fetch("http://localhost:3000/users/accept-friend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, friendId })
        });
        const result = await res.json();
        if (res.ok) {
          this.friends = this.friends.filter(f => f.id !== friendId);
          alert("Đã chấp nhận lời mời kết bạn!");
        } else {
          alert(result.msg || "Lỗi khi chấp nhận kết bạn");
        }
      } catch (err) {
        console.error("Accept friend error:", err);
      }
    },

    async removeFriend(friendId) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        const res = await fetch("http://localhost:3000/users/unfriend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, friendId })
        });
        const result = await res.json();
        if (res.ok) {
          this.friends = this.friends.filter(f => f.id !== friendId);
          this.existingFriends = this.existingFriends.filter(f => f.id !== friendId);
          alert("Đã hủy kết bạn!");
        } else {
          alert(result.msg || "Lỗi khi hủy kết bạn");
        }
      } catch (err) {
        console.error("Unfriend error:", err);
      }
    }
  }
};
</script>

<style scoped>
.friend-page {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 320px;
  background: white;
  padding: 20px 0;
  border-right: 1px solid #e4e6ea;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 20px;
}

.sidebar-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1c1e21;
  margin: 0;
}

.settings-icon {
  width: 36px;
  height: 36px;
  background: #e4e6ea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
}

.settings-icon:hover {
  background: #d8dadf;
}

.sidebar-menu {
  padding: 0 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 8px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.menu-item:hover {
  background-color: #f2f2f2;
}

.menu-item.active {
  background-color: #e7f3ff;
  color: #1877f2;
  font-weight: 600;
}

.menu-item .icon {
  width: 36px;
  height: 36px;
  background: #e4e6ea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.menu-item.active .icon {
  background: #1877f2;
  color: white;
}

.menu-item span:not(.icon):not(.arrow) {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.arrow {
  color: #65676b;
  font-size: 16px;
  margin-left: auto;
}

/* Main Content */
.main-content {
  margin-left: 320px;
  padding: 20px;
  width: calc(100% - 320px);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.content-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  margin: 0;
}

.see-all {
  color: #1877f2;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
}

.see-all:hover {
  text-decoration: underline;
}

/* Friend Requests Grid */
.friend-requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.friend-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.friend-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.friend-image {
  width: 100%;
  height: 280px;
  overflow: hidden;
}

.friend-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-info {
  padding: 12px;
}

.friend-info h4 {
  font-size: 17px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 4px 0;
}

.mutual-friends {
  display: flex;
  align-items: center;
  color: #65676b;
  font-size: 13px;
  margin-bottom: 12px;
}

.mutual-icon {
  margin-right: 4px;
}

.friend-actions {
  padding: 0 12px 12px;
  display: flex;
  gap: 8px;
}

.confirm-btn, .delete-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-btn {
  background: #1877f2;
  color: white;
}

.confirm-btn:hover {
  background: #166fe5;
}

.delete-btn {
  background: #e4e6ea;
  color: #1c1e21;
}

.delete-btn:hover {
  background: #d8dadf;
}

/* Existing Friends */
.no-requests h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  margin-bottom: 20px;
  padding: 0 4px;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.existing-friend-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.existing-friend-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.existing-friend-card img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
}

.friend-name {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 12px;
}

.unfriend-btn {
  background: #e4e6ea;
  color: #1c1e21;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.unfriend-btn:hover {
  background: #d8dadf;
}

/* Responsive */
@media (max-width: 1200px) {
  .sidebar {
    width: 280px;
  }
  
  .main-content {
    margin-left: 280px;
    width: calc(100% - 280px);
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 16px;
  }
  
  .friend-requests-grid {
    grid-template-columns: 1fr;
  }
}
</style>