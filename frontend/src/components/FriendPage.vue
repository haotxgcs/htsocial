<template>
  <div class="friend-page">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Friends</h2>
        <div class="settings-icon">⚙️</div>
      </div>
      
      <div class="sidebar-menu">
        <div class="menu-item" :class="{ active: currentView === 'home' }" @click="currentView = 'home'">
          <span class="icon">🏠</span>
          <span>Home</span>
        </div>
        <div class="menu-item" :class="{ active: currentView === 'requests' }" @click="currentView = 'requests'">
          <span class="icon">👥</span>
          <span>Friend Requests</span>
          <span class="badge" v-if="friendRequests.length > 0">{{ friendRequests.length }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="menu-item" :class="{ active: currentView === 'sent' }" @click="currentView = 'sent'">
          <span class="icon">📤</span>
          <span>Sent Requests</span>
          <span class="badge" v-if="sentRequests.length > 0">{{ sentRequests.length }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="menu-item" :class="{ active: currentView === 'suggestions' }" @click="currentView = 'suggestions'">
          <span class="icon">💡</span>
          <span>Suggestions</span>
          <span class="arrow">›</span>
        </div>
        <div class="menu-item" :class="{ active: currentView === 'friends' }" @click="currentView = 'friends'">
          <span class="icon">👫</span>
          <span>All friends</span>
          <span class="arrow">›</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Friend Requests Section -->
      <div v-if="currentView === 'requests'">
        <div class="content-header">
          <h3>Friend Requests</h3>
          <span class="count">{{ friendRequests.length }} request{{ friendRequests.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="friend-requests-grid" v-if="friendRequests.length > 0">
          <div class="friend-card" v-for="request in friendRequests" :key="request._id">
            <div class="friend-image">
              <img :src="getImageUrl(request.avatar)" :alt="request.firstname" />
            </div>
            <div class="friend-info">
              <h4>{{ request.firstname }} {{ request.lastname }}</h4>
              <p class="username">@{{ request.username }}</p>
              <div class="status-indicator" v-if="request.active">
                <span class="online-dot"></span>
                <span>Online</span>
              </div>
            </div>
            <div class="friend-actions">
              <button class="confirm-btn" @click="acceptFriendRequest(request._id)">Confirm</button>
              <button class="delete-btn" @click="declineFriendRequest(request._id)">Delete</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No friend requests at this time</p>
        </div>
      </div>

      <!-- Sent Requests Section -->
      <div v-if="currentView === 'sent'">
        <div class="content-header">
          <h3>Sent Requests</h3>
          <span class="count">{{ sentRequests.length }} pending</span>
        </div>

        <div class="friend-requests-grid" v-if="sentRequests.length > 0">
          <div class="friend-card" v-for="request in sentRequests" :key="request._id">
            <div class="friend-image">
              <img :src="getImageUrl(request.avatar)" :alt="request.firstname" />
            </div>
            <div class="friend-info">
              <h4>{{ request.firstname }} {{ request.lastname }}</h4>
              <p class="username">@{{ request.username }}</p>
              <div class="status-indicator" v-if="request.active">
                <span class="online-dot"></span>
                <span>Online</span>
              </div>
            </div>
            <div class="friend-actions">
              <button class="delete-btn full-width" @click="cancelFriendRequest(request._id)">Cancel Request</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No pending sent requests</p>
        </div>
      </div>

      <!-- Suggestions Section (All Users) -->
      <div v-if="currentView === 'suggestions'">
        <div class="content-header">
          <h3>People You May Know</h3>
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search users..." 
              @input="filterUsers"
            />
          </div>
        </div>

        <div class="friend-requests-grid" v-if="suggestedUsers.length > 0">
          <div class="friend-card" v-for="user in suggestedUsers" :key="user._id">
            <div class="friend-image">
              <img :src="getImageUrl(user.avatar)" :alt="user.firstname" />
            </div>
            <div class="friend-info">
              <h4>{{ user.firstname }} {{ user.lastname }}</h4>
              <p class="username">@{{ user.username }}</p>
              <div class="status-indicator" v-if="user.active">
                <span class="online-dot"></span>
                <span>Online</span>
              </div>
            </div>
            <div class="friend-actions">
              <button 
                class="confirm-btn full-width" 
                @click="sendFriendRequest(user._id)"
                :disabled="isRequestSent(user._id)"
              >
                {{ isRequestSent(user._id) ? 'Request Sent' : 'Add Friend' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>{{ searchQuery ? 'No users found' : 'No suggestions available' }}</p>
        </div>
      </div>

      <!-- All Friends Section -->
      <div v-if="currentView === 'friends' || currentView === 'home'">
        <div class="content-header">
          <h3>All Friends</h3>
          <span class="count">{{ allFriends.length }} friend{{ allFriends.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="friends-grid" v-if="allFriends.length > 0">
          <div class="existing-friend-card" v-for="friend in allFriends" :key="friend._id">
            <img :src="getImageUrl(friend.avatar)" :alt="friend.firstname" />
            <div class="friend-name">{{ friend.firstname }} {{ friend.lastname }}</div>
            <p class="username">@{{ friend.username }}</p>
            <div class="status-indicator" v-if="friend.active">
              <span class="online-dot"></span>
              <span>Online</span>
            </div>
            <button class="unfriend-btn" @click="unfriend(friend._id)">Unfriend</button>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>You don't have any friends yet</p>
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
      currentUser: null,
      currentView: 'home', // home, requests, sent, suggestions, friends
      friendRequests: [], // Lời mời kết bạn nhận được
      sentRequests: [], // Lời mời kết bạn đã gửi
      allFriends: [], // Danh sách bạn bè
      allUsers: [], // Tất cả người dùng
      suggestedUsers: [], // Gợi ý kết bạn (users chưa là bạn)
      searchQuery: '', // Tìm kiếm người dùng
      defaultAvatar: require('../assets/user.png'),
    };
  },
  mounted() {
    this.loadUserData();
  },
  methods: {
    // Load dữ liệu người dùng từ localStorage
    loadUserData() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        this.$router.push("/login");
        return;
      }
      this.currentUser = user;
      this.loadFriendRequests();
      this.loadSentRequests();
      this.loadAllFriends();
      this.loadAllUsers();
    },

    // Lấy danh sách lời mời kết bạn nhận được
    async loadFriendRequests() {
      try {
        const res = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
        const userData = await res.json();
        
        if (userData.requestReceived && userData.requestReceived.length > 0) {
          const requests = await Promise.all(
            userData.requestReceived.map(id =>
              fetch(`http://localhost:3000/users/${id}`).then(r => r.json())
            )
          );
          this.friendRequests = requests;
        } else {
          this.friendRequests = [];
        }
      } catch (err) {
        console.error("Load friend requests error:", err);
      }
    },

    // Lấy danh sách lời mời kết bạn đã gửi
    async loadSentRequests() {
      try {
        const res = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
        const userData = await res.json();
        
        if (userData.requestSent && userData.requestSent.length > 0) {
          const requests = await Promise.all(
            userData.requestSent.map(id =>
              fetch(`http://localhost:3000/users/${id}`).then(r => r.json())
            )
          );
          this.sentRequests = requests;
        } else {
          this.sentRequests = [];
        }
      } catch (err) {
        console.error("Load sent requests error:", err);
      }
    },

    // Lấy danh sách tất cả bạn bè
    async loadAllFriends() {
      try {
        const res = await fetch(`http://localhost:3000/users/${this.currentUser.id}/friends`);
        const friends = await res.json();
        this.allFriends = friends;
      } catch (err) {
        console.error("Load all friends error:", err);
      }
    },

    // Chấp nhận lời mời kết bạn
    async acceptFriendRequest(requesterId) {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: this.currentUser.id, 
            requesterId 
          })
        });
        
        const result = await res.json();
        
        if (res.ok) {
          alert("Đã chấp nhận lời mời kết bạn!");
          this.loadFriendRequests();
          this.loadAllFriends();
          this.filterSuggestedUsers();
        } else {
          alert(result.msg || "Lỗi khi chấp nhận kết bạn");
        }
      } catch (err) {
        console.error("Accept friend error:", err);
        alert("Lỗi kết nối server");
      }
    },

    // Từ chối lời mời kết bạn (thực chất là cancel từ phía người nhận)
    async declineFriendRequest(requesterId) {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fromUserId: requesterId,
            toUserId: this.currentUser.id
          })
        });
        
        const result = await res.json();
        
        if (res.ok) {
          alert("Đã xóa lời mời kết bạn!");
          this.loadFriendRequests();
          this.filterSuggestedUsers();
        } else {
          alert(result.msg || "Lỗi khi xóa lời mời");
        }
      } catch (err) {
        console.error("Decline friend error:", err);
        alert("Lỗi kết nối server");
      }
    },

    // Hủy lời mời kết bạn đã gửi
    async cancelFriendRequest(toUserId) {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fromUserId: this.currentUser.id,
            toUserId 
          })
        });
        
        const result = await res.json();
        
        if (res.ok) {
          alert("Đã hủy lời mời kết bạn!");
          this.loadSentRequests();
          this.filterSuggestedUsers();
        } else {
          alert(result.msg || "Lỗi khi hủy lời mời");
        }
      } catch (err) {
        console.error("Cancel friend request error:", err);
        alert("Lỗi kết nối server");
      }
    },

    // Hủy kết bạn
    async unfriend(friendId) {
      if (!confirm("Bạn có chắc muốn hủy kết bạn?")) return;

      try {
        const res = await fetch("http://localhost:3000/users/unfriend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: this.currentUser.id, 
            friendId 
          })
        });
        
        const result = await res.json();
        
        if (res.ok) {
          alert("Đã hủy kết bạn!");
          this.loadAllFriends();
          this.filterSuggestedUsers();
        } else {
          alert(result.msg || "Lỗi khi hủy kết bạn");
        }
      } catch (err) {
        console.error("Unfriend error:", err);
        alert("Lỗi kết nối server");
      }
    },

    // Get image URL
    getImageUrl(avatar) {
      if (!avatar) return this.defaultAvatar;
      if (avatar.startsWith('http')) return avatar;
      return `http://localhost:3000/${avatar}`;
    },

    // Lấy tất cả người dùng
    async loadAllUsers() {
      try {
        const res = await fetch('http://localhost:3000/users');
        const users = await res.json();
        this.allUsers = users;
        this.filterSuggestedUsers();
      } catch (err) {
        console.error("Load all users error:", err);
      }
    },

    // Lọc gợi ý kết bạn (loại bỏ bạn bè hiện tại và requests đã nhận, giữ lại requests đã gửi)
    filterSuggestedUsers() {
      const friendIds = this.allFriends.map(f => f._id);
      const receivedIds = this.friendRequests.map(r => r._id);

      this.suggestedUsers = this.allUsers.filter(user => {
        return user._id !== this.currentUser.id &&
               !friendIds.includes(user._id) &&
               !receivedIds.includes(user._id);
      });

      if (this.searchQuery) {
        this.filterUsers();
      }
    },

    // Tìm kiếm người dùng
    filterUsers() {
      if (!this.searchQuery.trim()) {
        this.filterSuggestedUsers();
        return;
      }

      const query = this.searchQuery.toLowerCase();
      const friendIds = this.allFriends.map(f => f._id);
      const sentIds = this.sentRequests.map(r => r._id);
      const receivedIds = this.friendRequests.map(r => r._id);

      this.suggestedUsers = this.allUsers.filter(user => {
        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        const username = user.username.toLowerCase();
        const matchesSearch = fullName.includes(query) || username.includes(query);

        return user._id !== this.currentUser.id &&
               !friendIds.includes(user._id) &&
               !sentIds.includes(user._id) &&
               !receivedIds.includes(user._id) &&
               matchesSearch;
      });
    },

    // Gửi lời mời kết bạn
    async sendFriendRequest(toUserId) {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fromUserId: this.currentUser.id, 
            toUserId 
          })
        });
        
        const result = await res.json();
        
        if (res.ok) {
          alert("Đã gửi lời mời kết bạn!");
          this.loadSentRequests();
          this.filterSuggestedUsers();
        } else {
          alert(result.msg || "Lỗi khi gửi lời mời");
        }
      } catch (err) {
        console.error("Send friend request error:", err);
        alert("Lỗi kết nối server");
      }
    },

    // Kiểm tra xem đã gửi request chưa
    isRequestSent(userId) {
      return this.sentRequests.some(r => r._id === userId);
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

.menu-item span:not(.icon):not(.arrow):not(.badge) {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.badge {
  background: #e41e3f;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.arrow {
  color: #65676b;
  font-size: 16px;
  margin-left: 8px;
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

.count {
  color: #65676b;
  font-size: 15px;
}

.search-box {
  flex: 0 0 300px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e4e6ea;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #1877f2;
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
  background: #f0f2f5;
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

.username {
  color: #65676b;
  font-size: 13px;
  margin: 0 0 8px 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  color: #42b72a;
  font-size: 13px;
  margin-top: 8px;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #42b72a;
  border-radius: 50%;
  margin-right: 6px;
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

.full-width {
  flex: 1;
  width: 100%;
}

.confirm-btn {
  background: #1877f2;
  color: white;
}

.confirm-btn:hover {
  background: #166fe5;
}

.confirm-btn:disabled {
  background: #e4e6ea;
  color: #65676b;
  cursor: not-allowed;
}

.delete-btn {
  background: #e4e6ea;
  color: #1c1e21;
}

.delete-btn:hover {
  background: #d8dadf;
}

/* All Friends Grid */
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
  background: #f0f2f5;
}

.friend-name {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 4px;
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
  margin-top: 8px;
}

.unfriend-btn:hover {
  background: #d8dadf;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #65676b;
}

.empty-state p {
  font-size: 16px;
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