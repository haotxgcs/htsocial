<template>
  <div class="friend-page-wrapper">
    
    <div class="page-header">
      <h2>Friends & Connections</h2>
      <p class="subtitle">Manage your network and discover new people</p>
    </div>

    <div class="nav-wrapper">
      <div class="glass-nav">
        <button 
          :class="['nav-pill', { active: currentView === 'friends' || currentView === 'home' }]"
          @click="currentView = 'friends'"
        >My Friends
          
        </button>

        <button 
          :class="['nav-pill', { active: currentView === 'suggestions' }]"
          @click="currentView = 'suggestions'"
        >Discover
        </button>

        <button 
          :class="['nav-pill', { active: currentView === 'requests' }]"
          @click="currentView = 'requests'"
        >Requests
          <span class="badge red" v-if="friendRequests.length">{{ friendRequests.length }}</span>
        </button>

        <button 
          :class="['nav-pill', { active: currentView === 'sent' }]"
          @click="currentView = 'sent'"
        >Sent
          
        </button>
      </div>
    </div>

    <div class="main-container">

      <div v-if="currentView === 'friends' || currentView === 'home'" class="content-section">
        <div class="section-header">
          <h2>Your Friends</h2>
          <span class="counter">{{ allFriends.length }} friends</span>
        </div>

        <div v-if="allFriends.length > 0" class="modern-grid"> <div v-for="friend in allFriends" :key="friend._id" class="modern-card">
            
            <div class="card-image-wrapper">
              <img :src="getImageUrl(friend.avatar)" class="card-img" />
              <div class="status-badge" v-if="friend.active">Online</div>
            </div>

            <div class="card-body">
              <h4>{{ friend.firstname }} {{ friend.lastname }}</h4>
              <p class="username">@{{ friend.username }}</p>
              
              <div class="action-group">
                <button class="btn-primary" @click="$router.push(`/profile/${friend._id}`)">View Profile</button>
                <div style="display: flex; gap: 8px;">
                   <button class="btn-secondary" style="flex:1" title="Message">Message</button>
                   <button class="btn-secondary" style="flex:1; color:#ef4444;" @click="unfriend(friend._id)" title="Unfriend">Unfriend</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div v-else class="empty-state">
          <p>You don't have any friends yet.</p>
          <button class="btn-primary mt-4" @click="currentView = 'suggestions'" style="width: auto; padding: 10px 24px;">Find Friends</button>
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
  --primary-color: #FF642F; 
  --bg-color: #f3f4f6;
  --text-main: #111827;
  --text-sub: #6b7280;
}

.friend-page-wrapper {
  background-color: #fcf8f5; /* Màu nền đồng bộ các trang */
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* ⭐ QUAN TRỌNG: CĂN CHỈNH LAYOUT TRÁNH HEADER/SIDEBAR ⭐ */
  padding-left: 320px;  /* Chừa chỗ cho Sidebar bên trái */
  padding-right: 20px;
  padding-top: 30px;    /* Cách Header trên một chút */
  box-sizing: border-box;
  
}

/* Responsive cho Tablet/Mobile: Reset padding */
@media (max-width: 1024px) {
  .friend-page-wrapper {
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 80px; /* Đẩy xuống nhiều hơn để tránh Header cố định */
  }
}

/* --- 1. HEADER SECTION --- */
.page-header {
  text-align: center; margin-bottom: 24px; padding: 24px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; font-weight: 600;
  max-width:950px; margin-left:auto; margin-right:auto;
}

.page-header h2 {
  margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #1c1e21;
}
.subtitle { margin: 0; font-size: 14px; color: #FF642F; }
.icon { width: 20px; height: 20px; }

/* --- 2. NAVIGATION (PILLS) --- */
.nav-wrapper {
  display: flex;
  justify-content: center;
  position: sticky;
  top: 70px; /* ⭐ Vị trí dính: Cách mép trên 70px (dưới Header chính) */
  z-index: 90;
  margin-bottom: 40px;
  padding: 10px 0;
  /* background: #fcf8f5; <-- Có thể bật nền nếu muốn che nội dung khi cuộn */
}

.glass-nav {  backdrop-filter: blur(16px); padding: 6px; border-radius: 100px; display: flex; gap: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);  }

.nav-pill {
  padding: 10px 20px;
  border-radius: 40px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
  font-size: 14px;
}

.nav-pill:hover { background-color: #f2f2f2; }

.nav-pill.active {
  background: #FF642F; /* Màu cam chủ đạo */
  color: white;
  box-shadow: 0 4px 12px rgba(255, 100, 47, 0.3);
}

.badge {
  background: #fff; color: #FF642F; /* Đảo màu badge khi active */
  font-size: 11px; padding: 2px 6px; border-radius: 10px; font-weight: 700;
}
.nav-pill:not(.active) .badge { background: #e5e7eb; color: #6b7280; }
.nav-pill:not(.active) .badge.red { background: #ef4444; color: white; }

/* --- 3. MAIN CONTAINER --- */
.main-container {
  max-width: 1000px; /* Độ rộng tối ưu cho lưới bạn bè */
  margin: 0 auto;
  padding-bottom: 60px;
  
}

.content-section { animation: fadeIn 0.4s ease-out; }

.section-header {
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px; /* Khoảng cách với lưới bạn bè */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between; /* Đẩy tiêu đề sang trái, số lượng sang phải */
  border: 1px solid #f3f4f6;
}
.section-header h2 { font-size: 22px; font-weight: 800; color: #1c1e21; margin: 0; }
.counter { background: #fdf4f0;
  color: #FF642F;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700; }

/* Search Box */
.search-wrapper { position: relative; width: 100%; max-width: 650px; }
.glass-input {
  width: 100%; padding: 10px 16px; border-radius: 30px; border: 1px solid #e5e7eb;
  background: white; outline: none; font-size: 14px; transition: all 0.2s; box-sizing: border-box;
}
.glass-input:focus { border-color: #FF642F; box-shadow: 0 0 0 3px rgba(255, 100, 47, 0.1); }

/* --- GRID LAYOUT (MODERN CARDS) --- */
.modern-grid, .friends-list-grid {
  display: grid;
  /* Tự động chia cột: Tối thiểu 220px mỗi thẻ */
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

/* CARD STYLE */
.modern-card, .friend-row-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #f0f2f5;
  transition: transform 0.2s;
  display: flex; flex-direction: column;
  
}
.modern-card:hover, .friend-row-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.08); }

.card-image-wrapper { position: relative; width: 100%; aspect-ratio: 1/1; }
.card-img { width: 100%; height: 100%; object-fit: cover; background-color: #f3f4f6; }
.status-badge {
  position: absolute; bottom: 8px; right: 8px;
  background: #10b981; color: white; font-size: 10px; font-weight: 700;
  padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.card-body h4 { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #111827; }
.username { color: #6b7280; font-size: 13px; margin: 0 0 12px; }

.action-group { margin-top: auto; display: grid; gap: 8px; }

/* Buttons */
.btn-primary {
  background: #FF642F; color: white; border: none; padding: 8px;
  border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; width: 100%; transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #e04f1d; }
.btn-primary:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }

.btn-secondary {
  background: #f3f4f6; color: #374151; border: none; padding: 8px;
  border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; width: 100%; transition: background 0.2s;
}
.btn-secondary:hover { background: #e5e7eb; }

.btn-icon {
  background: #f3f4f6; border: none; width: 32px; height: 32px;
  border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.btn-icon:hover { background: #e5e7eb; transform: scale(1.1); }
.text-red { color: #ef4444; } .text-red:hover { background: #fee2e2; }
.full-width { width: 100%; }

/* FRIEND ROW STYLE (Chuyển sang dạng Card lưới) */
.friend-row-card { align-items: center; padding: 16px; text-align: center; }
.friend-avatar-small { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid #f3f4f6; }
.friend-info { margin-bottom: 12px; }
.friend-info h4 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
.friend-info p { margin: 2px 0 4px; font-size: 13px; color: #6b7280; }
.status-text { font-size: 11px; color: #10b981; font-weight: 600; }
.friend-actions { display: flex; justify-content: center; gap: 10px; width: 100%; }

/* Empty State */
.empty-state { text-align: center; padding: 60px 0; color: #9ca3af; grid-column: 1 / -1; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>