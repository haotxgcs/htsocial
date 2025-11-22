<template>
  <div class="friend-page-wrapper">
    
    <div class="page-header">
      <h1>Friends & Connections</h1>
      <p class="subtitle">Manage your network and discover new people</p>
    </div>

    <div class="nav-wrapper">
      <div class="glass-nav">
        <button 
          :class="['nav-pill', { active: currentView === 'friends' || currentView === 'home' }]"
          @click="currentView = 'friends'"
        >
          <span class="icon"></span>My Friends
          <span class="badge" v-if="allFriends.length">{{ allFriends.length }}</span>
        </button>

        <button 
          :class="['nav-pill', { active: currentView === 'suggestions' }]"
          @click="currentView = 'suggestions'"
        >
          <span class="icon"></span>Discover
        </button>

        <button 
          :class="['nav-pill', { active: currentView === 'requests' }]"
          @click="currentView = 'requests'"
        >
          <span class="icon"></span>Requests
          <span class="badge red" v-if="friendRequests.length">{{ friendRequests.length }}</span>
        </button>

        <button 
          :class="['nav-pill', { active: currentView === 'sent' }]"
          @click="currentView = 'sent'"
        >
          <span class="icon"></span>Sent
          <span class="badge" v-if="sentRequests.length">{{ sentRequests.length }}</span>
        </button>
      </div>
    </div>

    <div class="main-container">
      
      <div v-if="currentView === 'requests'" class="content-section">
        <div class="section-header">
          <h2>Friend Requests</h2>
          <span class="counter">{{ friendRequests.length }} pending</span>
        </div>

        <div v-if="friendRequests.length > 0" class="modern-grid">
          <div v-for="request in friendRequests" :key="request._id" class="modern-card">
            <div class="card-image-wrapper">
              <img :src="getImageUrl(request.avatar)" class="card-img" />
              <div class="status-badge" v-if="request.active">Online</div>
            </div>
            <div class="card-body">
              <h4>{{ request.firstname }} {{ request.lastname }}</h4>
              <p class="username">@{{ request.username }}</p>
              <div class="action-group">
                <button class="btn-primary" @click="acceptFriendRequest(request._id)">Confirm</button>
                <button class="btn-secondary" @click="declineFriendRequest(request._id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <div class="empty-icon"></div>
          <p>No new friend requests</p>
        </div>
      </div>

      <div v-if="currentView === 'sent'" class="content-section">
        <div class="section-header">
          <h2>Sent Requests</h2>
          <span class="counter">{{ sentRequests.length }} sent</span>
        </div>

        <div v-if="sentRequests.length > 0" class="modern-grid">
          <div v-for="request in sentRequests" :key="request._id" class="modern-card">
            <div class="card-image-wrapper">
              <img :src="getImageUrl(request.avatar)" class="card-img" />
            </div>
            <div class="card-body">
              <h4>{{ request.firstname }} {{ request.lastname }}</h4>
              <p class="username">@{{ request.username }}</p>
              <button class="btn-secondary full-width" @click="cancelFriendRequest(request._id)">
                Cancel Request
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No pending sent requests</p>
        </div>
      </div>

      <div v-if="currentView === 'suggestions'" class="content-section">
        <div class="section-header">
          <h2>People You May Know</h2>
          <div class="search-wrapper">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search for new friends..." 
              @input="filterUsers"
              class="glass-input"
            />
          </div>
        </div>

        <div v-if="suggestedUsers.length > 0" class="modern-grid">
          <div v-for="user in suggestedUsers" :key="user._id" class="modern-card">
            <div class="card-image-wrapper">
              <img :src="getImageUrl(user.avatar)" class="card-img" />
            </div>
            <div class="card-body">
              <h4>{{ user.firstname }} {{ user.lastname }}</h4>
              <p class="username">@{{ user.username }}</p>
              <button 
                class="btn-primary full-width" 
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

      <div v-if="currentView === 'friends' || currentView === 'home'" class="content-section">
        <div class="section-header">
          <h2>Your Friends</h2>
          <span class="counter">{{ allFriends.length }} friends</span>
        </div>

        <div v-if="allFriends.length > 0" class="friends-list-grid">
          <div v-for="friend in allFriends" :key="friend._id" class="friend-row-card">
            <div class="friend-left">
              <img :src="getImageUrl(friend.avatar)" class="friend-avatar-small" />
              <div class="friend-info">
                <h4>{{ friend.firstname }} {{ friend.lastname }}</h4>
                <p>@{{ friend.username }}</p>
                <span class="status-text" v-if="friend.active">● Online</span>
              </div>
            </div>
            <div class="friend-actions">
              <button class="btn-icon" title="Message"><img src="../assets/message.png" class="icon"></button>
              <button class="btn-icon text-red" @click="unfriend(friend._id)" title="Unfriend"><img src="../assets/unfriend.png" class="icon"></button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>You don't have any friends yet.</p>
          <button class="btn-primary mt-4" @click="currentView = 'suggestions'">Find Friends</button>
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
      // Thay đổi: Mặc định vào tab 'friends' thay vì 'home' cho hợp lý
      currentView: 'friends', 
      
      friendRequests: [], 
      sentRequests: [], 
      allFriends: [], 
      allUsers: [], 
      suggestedUsers: [], 
      searchQuery: '', 
      
      defaultAvatar: "uploads/user.png", // Đảm bảo đường dẫn đúng với backend
    };
  },
  computed: {
    // Tabs động để cập nhật số lượng badge realtime
    tabs() {
      return [
        { 
          id: 'friends', 
          label: 'My Friends',  
          count: this.allFriends.length 
        },
        { 
          id: 'suggestions', 
          label: 'Discover', 
          count: 0 
        },
        { 
          id: 'requests', 
          label: 'Requests', 
          count: this.friendRequests.length 
        },
        { 
          id: 'sent', 
          label: 'Sent', 
          count: this.sentRequests.length 
        },
      ];
    }
  },
  mounted() {
    this.loadUserData();
  },
  methods: {
    // Load dữ liệu người dùng
    async loadUserData() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        this.$router.push("/login");
        return;
      }
      this.currentUser = user;
      
      // Gọi song song các API để tăng tốc độ load trang
      await Promise.all([
        this.loadFriendRequests(),
        this.loadSentRequests(),
        this.loadAllFriends(),
        this.loadAllUsers()
      ]);
    },

    getImageUrl(avatar) {
      if (!avatar) return `http://localhost:3000/${this.defaultAvatar}`;
      if (avatar.startsWith('http')) return avatar;
      return `http://localhost:3000/${avatar}`;
    },

    // --- API CALLS ---

    async loadFriendRequests() {
      try {
        const res = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
        const userData = await res.json();
        
        if (userData.requestReceived?.length > 0) {
          this.friendRequests = await Promise.all(
            userData.requestReceived.map(id =>
              fetch(`http://localhost:3000/users/${id}`).then(r => r.json())
            )
          );
        } else {
          this.friendRequests = [];
        }
      } catch (err) { console.error(err); }
    },

    async loadSentRequests() {
      try {
        const res = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
        const userData = await res.json();
        
        if (userData.requestSent?.length > 0) {
          this.sentRequests = await Promise.all(
            userData.requestSent.map(id =>
              fetch(`http://localhost:3000/users/${id}`).then(r => r.json())
            )
          );
        } else {
          this.sentRequests = [];
        }
      } catch (err) { console.error(err); }
    },

    async loadAllFriends() {
      try {
        const res = await fetch(`http://localhost:3000/users/${this.currentUser.id}/friends`);
        this.allFriends = await res.json();
        this.filterSuggestedUsers(); // Cập nhật lại gợi ý sau khi load bạn bè
      } catch (err) { console.error(err); }
    },

    async loadAllUsers() {
      try {
        const res = await fetch('http://localhost:3000/users');
        this.allUsers = await res.json();
        this.filterSuggestedUsers();
      } catch (err) { console.error(err); }
    },

    // --- ACTIONS ---

    async acceptFriendRequest(requesterId) {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.currentUser.id, requesterId })
        });
        
        if (res.ok) {
          // Cập nhật lại state ngay lập tức mà không cần reload trang
          this.friendRequests = this.friendRequests.filter(r => r._id !== requesterId);
          await this.loadAllFriends(); // Load lại list bạn bè mới
          alert("Accepted friend request!");
        }
      } catch (err) { console.error(err); }
    },

    async declineFriendRequest(requesterId) {
      if(!confirm("Delete this request?")) return;
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromUserId: requesterId, toUserId: this.currentUser.id })
        });
        
        if (res.ok) {
          this.friendRequests = this.friendRequests.filter(r => r._id !== requesterId);
        }
      } catch (err) { console.error(err); }
    },

    async cancelFriendRequest(toUserId) {
      if(!confirm("Cancel sent request?")) return;
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromUserId: this.currentUser.id, toUserId })
        });
        
        if (res.ok) {
          this.sentRequests = this.sentRequests.filter(r => r._id !== toUserId);
          this.filterSuggestedUsers(); // Người này lại trở thành gợi ý
        }
      } catch (err) { console.error(err); }
    },

    async sendFriendRequest(toUserId) {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromUserId: this.currentUser.id, toUserId })
        });
        
        if (res.ok) {
          await this.loadSentRequests();
          this.filterSuggestedUsers(); // Loại bỏ khỏi danh sách gợi ý
          alert("Friend request sent!");
        }
      } catch (err) { console.error(err); }
    },

    async unfriend(friendId) {
      if (!confirm("Unfriend this person?")) return;
      try {
        const res = await fetch("http://localhost:3000/users/unfriend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.currentUser.id, friendId })
        });
        
        if (res.ok) {
          this.allFriends = this.allFriends.filter(f => f._id !== friendId);
          this.filterSuggestedUsers();
        }
      } catch (err) { console.error(err); }
    },

    // --- FILTERS ---

    filterSuggestedUsers() {
      const friendIds = this.allFriends.map(f => f._id);
      const sentIds = this.sentRequests.map(r => r._id);
      const receivedIds = this.friendRequests.map(r => r._id);

      // Lọc ra những người chưa là bạn, chưa gửi/nhận request và không phải chính mình
      this.suggestedUsers = this.allUsers.filter(user => {
        return user._id !== this.currentUser.id &&
               !friendIds.includes(user._id) &&
               !sentIds.includes(user._id) &&
               !receivedIds.includes(user._id);
      });

      // Nếu đang có từ khóa tìm kiếm thì lọc tiếp
      if (this.searchQuery) {
        this.filterUsers();
      }
    },

    filterUsers() {
      if (!this.searchQuery.trim()) {
        this.filterSuggestedUsers();
        return;
      }

      const query = this.searchQuery.toLowerCase();
      this.suggestedUsers = this.suggestedUsers.filter(user => {
        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        const username = user.username.toLowerCase();
        return fullName.includes(query) || username.includes(query);
      });
    },

    isRequestSent(userId) {
      return this.sentRequests.some(r => r._id === userId);
    }
  }
};
</script>

<style scoped>
/* --- GLOBAL VARIABLES & WRAPPER --- */
:root {
  --primary-color: #6366f1; /* Indigo */
  --bg-color: #f3f4f6;
  --text-main: #111827;
  --text-sub: #6b7280;
}

.friend-page-wrapper {
  background-color: #f3f4f6;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 40px 20px;
  padding-top: 20px;
}

/* --- 1. HEADER SECTION --- */
.page-header {
  text-align: center;
  margin-bottom: 32px;
  margin-top: 40px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.icon { width: 20px; height: 20px; }
/* --- 2. NAVIGATION (PILLS) --- */
.nav-wrapper {
  display: flex;
  justify-content: center;
  position: sticky;
  top: 80px; /* Cách header chính của web */
  z-index: 90;
  margin-bottom: 40px;
  padding: 10px 0;
}

.glass-nav {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 6px;
  border-radius: 100px;
  display: flex;
  gap: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid rgba(255,255,255,0.6);
  overflow-x: auto; /* Cho phép cuộn ngang trên mobile */
  max-width: 100%;
}

.nav-pill {
  padding: 10px 24px;
  border-radius: 40px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.nav-pill:hover {
  background: rgba(0,0,0,0.04);
  color: #111827;
}

.nav-pill.active {
  background: #111827;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.nav-pill .icon {
  font-size: 16px;
}

.badge {
  background: #ef4444; /* Màu đỏ thông báo */
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
  line-height: 1.2;
}
.badge.red { background: #ef4444; }

/* --- 3. MAIN CONTENT --- */
.main-container {
  max-width: 1100px;
  margin: 0 auto;
}

.content-section {
  animation: fadeIn 0.4s ease-out;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 8px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.counter {
  color: #6b7280;
  font-weight: 600;
  font-size: 14px;
  background: #e5e7eb;
  padding: 4px 12px;
  border-radius: 20px;
}

/* Search Box */
.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.glass-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 30px;
  border: 1px solid #e5e7eb;
  background: white;
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.glass-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

/* --- GRID LAYOUT (MODERN CARDS) --- */
/* Dùng cho Requests, Sent, Suggestions */
.modern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.modern-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid rgba(243, 244, 246, 0.8);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.modern-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 240px; /* Ảnh vuông/dọc lớn */
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f3f4f6;
}

.status-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: #10b981; /* Màu xanh online */
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-body h4 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  color: #6b7280;
  font-size: 13px;
  margin: 0 0 16px;
  font-weight: 500;
}

.action-group {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr; /* Chia đôi 2 nút */
  gap: 10px;
}

/* --- LIST LAYOUT (FRIENDS ROW) --- */
/* Dùng cho tab All Friends */
.friends-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.friend-row-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
}

.friend-row-card:hover {
  border-color: #d1d5db;
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.friend-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.friend-avatar-small {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f3f4f6;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.friend-info p {
  margin: 2px 0 4px;
  font-size: 13px;
  color: #6b7280;
}

.status-text {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
}

/* --- BUTTONS --- */
.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-icon {
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.btn-icon:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.text-red {
  color: #ef4444;
}
.text-red:hover {
  background: #fee2e2;
}

.full-width {
  width: 100%;
}

/* --- EMPTY STATE --- */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 0;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* --- ANIMATION --- */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- RESPONSIVE --- */
@media (max-width: 768px) {
  .nav-wrapper {
    justify-content: flex-start; /* Cuộn ngang trên mobile */
    padding: 10px 16px;
  }
  
  .glass-nav {
    border-radius: 12px; /* Bo góc ít hơn trên mobile */
  }

  .modern-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); /* Thẻ nhỏ hơn trên mobile */
    gap: 12px;
  }
  
  .card-image-wrapper {
    height: 160px;
  }

  .card-body {
    padding: 12px;
  }
  
  .action-group {
    flex-direction: column; /* Nút xếp dọc trên mobile */
  }
}
</style>