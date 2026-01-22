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

        <div class="content-body">
        <LoadingOverlay v-if="loadingFriends" />

        <div v-if="!loadingFriends && paginatedFriends.length > 0" class="modern-grid"> <div v-for="friend in paginatedFriends" :key="friend._id" class="modern-card">
            
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

        <div v-if="!loadingFriends && !paginatedFriends.length" class="empty-state">
          <p>You don't have any friends yet.</p>
          <button class="btn-primary mt-4" @click="currentView = 'suggestions'" style="width: auto; padding: 10px 24px;">Find Friends</button>
        </div>
        </div>

        

        <Pagination
          v-if="!loadingFriends && friendsTotalPages > 1"
          :currentPage="pageFriends"
          :totalPages="friendsTotalPages"
          @update:page="changePage('friends', $event)"
        />

      </div>

      <div v-if="currentView === 'suggestions'" class="content-section">
        
        <div class="section-header">
          <h2>People You May Know</h2>
          <div class="search-wrapper">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search for new friends..."
              class="glass-input"
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">
              Search
            </button>
          </div>
        </div>
        
        <div class="content-body">
        <LoadingOverlay v-if="loadingSuggestions" />
        <div v-if="!loadingSuggestions && paginatedSuggestions.length > 0" class="modern-grid">
          <div v-for="user in paginatedSuggestions" :key="user._id" class="modern-card">
            <div class="card-image-wrapper" @click="$router.push(`/profile/${user._id}`)">
              <img :src="getImageUrl(user.avatar)" class="card-img" />
            </div>
            <div class="card-body" @click="$router.push(`/profile/${user._id}`)">
              <h4>{{ user.firstname }} {{ user.lastname }}</h4>
              <p class="username">@{{ user.username }}</p>

              <button
                v-if="user.friendStatus === 'self'"
                class="btn-secondary full-width"
                @click.stop="$router.push(`/profile/${user._id}`)"
              >
                View Profile
              </button>

              <button
                v-else-if="user.friendStatus === 'friends'"
                class="btn-secondary full-width text-red"
                @click.stop="unfriend(user._id)"
              >
                Unfriend
              </button>

              <button
                v-else-if="user.friendStatus === 'sent'"
                class="btn-secondary full-width"
                disabled
              >
                Request Sent
              </button>

              <button
                v-else-if="user.friendStatus === 'received'"
                class="btn-primary full-width"
                @click.stop="acceptFriendRequest(user._id)"
              >
                Accept Request
              </button>

              <button
                v-else
                class="btn-primary full-width"
                @click.stop="sendFriendRequest(user._id)"
              >
                Add Friend
              </button>


            </div>
          </div>
        </div>

        <div v-if="!loadingSuggestions && !paginatedSuggestions.length" class="empty-state">
          <p>{{ searchQuery ? 'No users found' : 'No suggestions available' }}</p>
        </div>
        </div>

        <Pagination
          v-if="!loadingSuggestions && totalSuggestionPages > 1"
          :currentPage="pageSuggestions"
          :totalPages="totalSuggestionPages"
          @update:page="changePage('suggestions', $event)"
          />
      </div>
      
      <div v-if="currentView === 'requests'" class="content-section">
        
        <div class="section-header">
          <h2>Friend Requests</h2>
          <span class="counter">{{ paginatedRequests.length }} pending</span>
        </div>

        <div class="content-body">
        <LoadingOverlay v-if="loadingRequests" />
        <div v-if="!loadingRequests && paginatedRequests.length > 0" class="modern-grid">
          <div v-for="request in paginatedRequests" :key="request._id" class="modern-card">
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
        
        <div v-if="!loadingRequests && !paginatedRequests.length" class="empty-state">
          <div class="empty-icon"></div>
          <p>No new friend requests</p>
        </div>
        </div>

        <Pagination
          v-if="!loadingRequests && totalRequestPages > 1"
          :currentPage="pageRequests"
          :totalPages="totalRequestPages"
          @update:page="changePage('requests', $event)"
        />
      </div>

      <div v-if="currentView === 'sent'" class="content-section">
        
        <div class="section-header">
          <h2>Sent Requests</h2>
          <span class="counter">{{ paginatedSent.length }} sent</span>
        </div>

        <div class="content-body">
        <LoadingOverlay v-if="loadingSent" />
        <div v-if="!loadingSent && paginatedSent.length > 0" class="modern-grid">
          <div v-for="request in paginatedSent" :key="request._id" class="modern-card">
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

        <div v-if="!loadingSent && !paginatedSent.length" class="empty-state">
          <p>No pending sent requests</p>
        </div>
        </div>

        <Pagination
          v-if="!loadingSent && totalSentPages > 1"
          :currentPage="pageSent"
          :totalPages="totalSentPages"
          @update:page="changePage('sent', $event)"
        />
      </div>

      

      

    </div>
  </div>
  <ConfirmDialog
  v-if="confirmVisible"
  :message="confirmMessage"
  @confirm="handleConfirm"
  @cancel="confirmVisible = false"
/>

<NotificationModal
  :is-visible="notification.visible"
  :type="notification.type"
  :title="notification.title"
  :message="notification.message"
  @confirm="notification.visible = false"
/>

</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import NotificationModal from './NotificationModal.vue';
import Pagination from './Pagination.vue';
import LoadingOverlay from './LoadingOverlay.vue';
 
export default {
  name: "FriendPage",
  components: {
  ConfirmDialog,
  NotificationModal,
  Pagination,
  LoadingOverlay
  },
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

      confirmVisible: false,
    confirmMessage: '',
    pendingAction: null,   // function sẽ chạy khi confirm

    notification: {
      visible: false,
      type: 'success', // success | error | warning
      title: '',
      message: ''
    },

    itemsPerPage: 4,

    // pagination
    pageFriends: 1,
    pageSuggestions: 1,
    pageRequests: 1,
    pageSent: 1,

    
    // loading

    loadingFriends: false,
    loadingSuggestions: false,
    loadingRequests: false,
    loadingSent: false,
    

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
    },
    // pagination of friends tab
    paginatedFriends() {
      const start = (this.pageFriends - 1) * this.itemsPerPage;
      return this.allFriends.slice(start, start + this.itemsPerPage);
    },

    friendsTotalPages() {
      return Math.ceil(this.allFriends.length / this.itemsPerPage);
    },


    // pagination of suggestions tab
    paginatedSuggestions() {
      const start = (this.pageSuggestions - 1) * this.itemsPerPage;
      return this.suggestedUsers.slice(start, start + this.itemsPerPage);
    },

    totalSuggestionPages() {
      return Math.ceil(this.suggestedUsers.length / this.itemsPerPage);
    },


    // pagination of requests tab
    paginatedRequests() {
      const start = (this.pageRequests - 1) * this.itemsPerPage;
      return this.friendRequests.slice(start, start + this.itemsPerPage);
    },

    totalRequestPages() {
      return Math.ceil(this.friendRequests.length / this.itemsPerPage);
    },


    // pagination of sent tab
    paginatedSent() {
      const start = (this.pageSent - 1) * this.itemsPerPage;
      return this.sentRequests.slice(start, start + this.itemsPerPage);
    },

    totalSentPages() {
      return Math.ceil(this.sentRequests.length / this.itemsPerPage);
    },

  },
watch: {
  currentView(newVal) {
    this.pageFriends = 1;
    this.pageSuggestions = 1;
    this.pageRequests = 1;
    this.pageSent = 1;

    try {
      if (newVal === 'suggestions') {
        this.searchQuery = '';
        this.loadAllUsers();
        // this.filterSuggestedUsers();
      }

      if (newVal === 'friends') {
        this.loadAllFriends();
      }

      if (newVal === 'requests') {
        this.loadFriendRequests();
      }

      if (newVal === 'sent') {
        this.loadSentRequests();
      }

    } catch (err) {
      console.error(err);
    }
    
  }
}, 
mounted() {
  this.loadUserData();

  this._onFriendStatusChanged = () => {
    this.loadAllFriends();
    this.loadFriendRequests();
    this.loadSentRequests();
    this.filterSuggestedUsers();
  };

  window.addEventListener(
    'friend-status-changed',
    this._onFriendStatusChanged
  );
},

beforeUnmount() {
  window.removeEventListener(
    'friend-status-changed',
    this._onFriendStatusChanged
  );
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


  try {
    await Promise.all([
      this.loadFriendRequests(),
      this.loadSentRequests(),
      this.loadAllFriends(),
      this.loadAllUsers()
    ]);
  } catch (err) {
    console.error(err);
  }
},


    getImageUrl(avatar) {
      if (!avatar) return `http://localhost:3000/${this.defaultAvatar}`;
      if (avatar.startsWith('http')) return avatar;
      return `http://localhost:3000/${avatar}`;
    },

    // --- API CALLS ---

    async loadFriendRequests() {
      this.loadingRequests = true;
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
      } catch (err) { 
        console.error(err); 
      } finally {
        this.loadingRequests = false;
      }
    },

    async loadSentRequests() {
      this.loadingSent = true;
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
      } catch (err) { 
        console.error(err); 
      } finally {
        this.loadingSent = false;
      }
    },

async loadAllFriends() {
  this.loadingFriends = true;
  try {
    const res = await fetch(
      `http://localhost:3000/users/${this.currentUser.id}/friends`
    );
    const data = await res.json();

    // ✅ CHỈ LẤY ARRAY
    this.allFriends = Array.isArray(data)
      ? data
      : data.items || [];

  } catch (err) {
    console.error(err);
    this.allFriends = []; // ✅ fallback an toàn
  } finally {
    this.loadingFriends = false;
  }
},


async loadAllUsers() {
  this.loadingSuggestions = true;
  try {
    const res = await fetch(
      `http://localhost:3000/users?viewerId=${this.currentUser.id}`
    );
    this.allUsers = await res.json();
    this.filterSuggestedUsers();
  } catch (err) {
    console.error(err);
  } finally {
    this.loadingSuggestions = false;
  }
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
          this.showNotify(
            "success",
            "Friend Added",
            "You are now friends!"
          );

        }
      } catch (err) { 
        console.error(err); 
      } 
    },

    declineFriendRequest(requesterId) {
  this.showConfirm(
    "Do you want to delete this friend request?",
    async () => {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: requesterId,
            toUserId: this.currentUser.id
          })
        });

        if (res.ok) {
          this.friendRequests = this.friendRequests.filter(r => r._id !== requesterId);
          this.showNotify("success", "Deleted", "Friend request has been removed.");
        }
      } catch (err) {
        this.showNotify("error", "Error", "Failed to delete request.");
      }
    }
  );
},


cancelFriendRequest(toUserId) {
  this.showConfirm(
    "Are you sure you want to cancel this friend request?",
    async () => {
      try {
        const res = await fetch("http://localhost:3000/users/friend-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: this.currentUser.id,
            toUserId
          })
        });

        if (!res.ok) {
          throw new Error("Cancel request failed");
        }

        // Cập nhật state
        this.sentRequests = this.sentRequests.filter(r => r._id !== toUserId);
        this.loadAllUsers();
        this.loadAllFriends();
        this.loadFriendRequests();
        this.loadSentRequests();

        // Thông báo thành công
        this.showNotify(
          "success",
          "Request Cancelled",
          "Your friend request has been cancelled."
        );

      } catch (err) {
        console.error(err);
        this.showNotify(
          "error",
          "Error",
          "Failed to cancel friend request."
        );
      }
    }
  );
},


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

    if (res.ok) {
      // ✅ update UI NGAY
      const user = this.allUsers.find(u => u._id === toUserId);
      if (user) user.friendStatus = 'sent';

      // background sync
      this.loadSentRequests();

      this.showNotify(
        "success",
        "Request Sent",
        "Your friend request has been sent."
      );
    }
  } catch (err) {
    this.showNotify("error", "Error", "Failed to send friend request.");
  }
},


    unfriend(friendId) {
  this.showConfirm(
    "Are you sure you want to unfriend this person?",
    async () => {
      try {
        const res = await fetch("http://localhost:3000/users/unfriend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.currentUser.id,
            friendId
          })
        });

        if (res.ok) {
          this.allFriends = this.allFriends.filter(f => f._id !== friendId);
          this.loadAllUsers();
          this.loadAllFriends();
          this.loadFriendRequests();
          this.loadSentRequests();
          this.showNotify("success", "Unfriended", "This user has been removed from your friends list.");
        }
      } catch (err) {
        this.showNotify("error", "Error", "Failed to unfriend user.");
      }
    }
  );
},


    // --- FILTERS ---

    filterSuggestedUsers() {
  this.suggestedUsers = this.allUsers.filter(
    u =>
      u.friendStatus === 'none' &&
      u._id !== this.currentUser.id
  );
}, 

    filterUsers() {
      if (!this.searchQuery.trim()) {
        this.loadAllUsers();
        this.loadAllFriends();
        this.loadFriendRequests();
        this.loadSentRequests();
        return;
      }

      const query = this.searchQuery.toLowerCase();
      this.suggestedUsers = this.suggestedUsers.filter(user => {
        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        const username = user.username.toLowerCase();
        return fullName.includes(query) || username.includes(query);
      });
    },

    handleSearch() {
      const query = this.searchQuery.trim().toLowerCase();

      // Nếu search rỗng → reset về gợi ý ban đầu
      if (!query) {
        this.loadAllUsers();
        this.loadAllFriends();
        this.loadFriendRequests();
        this.loadSentRequests();
        return;
      }

      this.suggestedUsers = this.allUsers.filter(user => {
        if (user.friendStatus !== 'none') return false;

        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        const username = user.username.toLowerCase();

        return (
          fullName.includes(query) ||
          username.includes(query)
        );
      });

    },




    showConfirm(message, action) {
  this.confirmMessage = message;
  this.pendingAction = action;
  this.confirmVisible = true;
},

handleConfirm() {
  this.confirmVisible = false;
  if (this.pendingAction) {
    this.pendingAction();
    this.pendingAction = null;
  }
},

showNotify(type, title, message) {
  this.notification = {
    visible: true,
    type,
    title,
    message
  };
},

changePage(tab, page) {
  if (tab === 'friends') this.pageFriends = page;
  if (tab === 'suggestions') this.pageSuggestions = page;
  if (tab === 'requests') this.pageRequests = page;
  if (tab === 'sent') this.pageSent = page;

  window.scrollTo({ top: 0, behavior: 'smooth' });
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

.content-body {
  position: relative;
  min-height: 200px;
}


.friend-page-wrapper {
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
.search-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 650px;
}

.search-btn {
  padding: 10px 18px;
  border-radius: 30px;
  border: none;
  background: #FF642F;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  white-space: nowrap;
}

.search-btn:hover {
  background: #e04f1d;
}

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