<template>
  <div class="friends-page">
    <!-- Header Section -->
    <div class="friends-header">
      <div class="header-content">
        <h1 class="page-title">Bạn bè</h1>
        <div class="friends-count">{{ friends.length }} bạn bè</div>
      </div>
      
      <!-- Search and Filter -->
      <div class="friends-controls">
        <div class="search-box">
          <i class="search-icon">🔍</i>
          <input 
            type="text" 
            placeholder="Tìm kiếm bạn bè..."
            v-model="searchQuery"
            class="search-input"
          />
        </div>
        
        <div class="filter-tabs">
          <button 
            v-for="filter in filters" 
            :key="filter.id"
            :class="['filter-tab', { active: activeFilter === filter.id }]"
            @click="activeFilter = filter.id"
          >
            {{ filter.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Friends Grid -->
    <div class="friends-container">
      <div class="friends-grid">
        <div 
          class="friend-card" 
          v-for="friend in filteredFriends" 
          :key="friend.id"
        >
          <!-- Friend Avatar -->
          <div class="friend-avatar-container">
            <img 
              :src="friend.avatar || defaultAvatar" 
              :alt="`${friend.firstname} ${friend.lastname}`"
              class="friend-avatar" 
              @click="viewProfile(friend)"
            />
            <div class="online-indicator" v-if="friend.isOnline"></div>
          </div>
          
          <!-- Friend Info -->
          <div class="friend-info">
            <h3 class="friend-name" @click="viewProfile(friend)">
              {{ friend.firstname }} {{ friend.lastname }}
            </h3>
            <p class="friend-username">@{{ friend.username }}</p>
            
            <!-- Mutual Friends -->
            <div class="mutual-friends" v-if="friend.mutualFriends">
              <span class="mutual-count">{{ friend.mutualFriends }} bạn chung</span>
            </div>
            
            <!-- Last Activity -->
            <div class="last-activity" v-if="friend.lastActive">
              <span class="activity-text">{{ formatLastActive(friend.lastActive) }}</span>
            </div>
          </div>
          
          <!-- Friend Actions -->
          <div class="friend-actions">
            <button class="action-btn message-btn" @click="sendMessage(friend)">
              <i class="btn-icon">💬</i>
              Nhắn tin
            </button>
            
            <div class="dropdown-container">
              <button 
                class="action-btn more-btn"
                @click="toggleDropdown(friend.id)"
                :class="{ active: dropdownOpen === friend.id }"
              >
                <i class="btn-icon">⋯</i>
              </button>
              
              <div 
                class="dropdown-menu"
                v-if="dropdownOpen === friend.id"
                @click.stop
              >
                <button class="dropdown-item" @click="viewProfile(friend)">
                  <i class="dropdown-icon">👤</i>
                  Xem trang cá nhân
                </button>
                <button class="dropdown-item" @click="blockFriend(friend.id)">
                  <i class="dropdown-icon">🚫</i>
                  Chặn
                </button>
                <button class="dropdown-item danger" @click="showUnfriendModal(friend)">
                  <i class="dropdown-icon">❌</i>
                  Hủy kết bạn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div class="empty-state" v-if="filteredFriends.length === 0">
        <div class="empty-icon">👥</div>
        <h3 class="empty-title">Không tìm thấy bạn bè</h3>
        <p class="empty-description">
          {{ searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bạn chưa có bạn bè nào' }}
        </p>
      </div>
    </div>

    <!-- Unfriend Confirmation Modal -->
    <div class="modal-overlay" v-if="showModal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Hủy kết bạn với {{ selectedFriend?.firstname }}?</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="friend-preview">
            <img 
              :src="selectedFriend?.avatar || defaultAvatar" 
              :alt="selectedFriend?.firstname"
              class="preview-avatar"
            />
            <div class="preview-info">
              <h4>{{ selectedFriend?.firstname }} {{ selectedFriend?.lastname }}</h4>
              <p>@{{ selectedFriend?.username }}</p>
            </div>
          </div>
          
          <p class="modal-description">
            Bạn có chắc chắn muốn hủy kết bạn với {{ selectedFriend?.firstname }}? 
            Hành động này không thể hoàn tác.
          </p>
        </div>
        
        <div class="modal-actions">
          <button class="modal-btn cancel-btn" @click="closeModal">
            Hủy
          </button>
          <button 
            class="modal-btn confirm-btn" 
            @click="confirmUnfriend"
            :disabled="isRemoving"
          >
            {{ isRemoving ? 'Đang xử lý...' : 'Hủy kết bạn' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="isLoading">
      <div class="loading-spinner"></div>
      <p>Đang tải danh sách bạn bè...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "FriendPage",
  data() {
    return {
      friends: [],
      searchQuery: '',
      activeFilter: 'all',
      dropdownOpen: null,
      showModal: false,
      selectedFriend: null,
      isRemoving: false,
      isLoading: true,
      defaultAvatar: require('../assets/user.png'),
      filters: [
        { id: 'all', name: 'Tất cả bạn bè' },
        { id: 'recent', name: 'Gần đây' },
        { id: 'online', name: 'Đang online' },
        { id: 'birthdays', name: 'Sinh nhật' }
      ]
    };
  },
  
  computed: {
    filteredFriends() {
      let filtered = this.friends;
      
      // Apply search filter
      if (this.searchQuery) {
        filtered = filtered.filter(friend => 
          `${friend.firstname} ${friend.lastname}`.toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          friend.username.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      
      // Apply category filter
      switch (this.activeFilter) {
        case 'online':
          filtered = filtered.filter(friend => friend.isOnline);
          break;
        case 'recent':
          filtered = filtered.sort((a, b) => 
            new Date(b.lastActive) - new Date(a.lastActive)
          );
          break;
        case 'birthdays':
          filtered = filtered.filter(friend => friend.hasBirthday);
          break;
      }
      
      return filtered;
    }
  },
  
  mounted() {
    this.loadFriends();
    // Close dropdown when clicking outside
    document.addEventListener('click', this.closeDropdown);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown);
  },
  
  methods: {
    async loadFriends() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return this.$router.push("/login");
      
      try {
        this.isLoading = true;
        const res = await fetch(`http://localhost:3000/users/${user.id}`);
        const data = await res.json();
        
        if (data.friends && data.friends.length > 0) {
          const friendsData = await Promise.all(
            data.friends.map(async id => {
              const friendRes = await fetch(`http://localhost:3000/users/${id}`);
              const friend = await friendRes.json();
              
              // Add mock data for demo
              return {
                ...friend,
                isOnline: Math.random() > 0.6,
                lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                mutualFriends: Math.floor(Math.random() * 20) + 1,
                hasBirthday: Math.random() > 0.9
              };
            })
          );
          this.friends = friendsData;
        }
      } catch (error) {
        console.error("Error loading friends:", error);
      } finally {
        this.isLoading = false;
      }
    },
    
    toggleDropdown(friendId) {
      this.dropdownOpen = this.dropdownOpen === friendId ? null : friendId;
    },
    
    closeDropdown() {
      this.dropdownOpen = null;
    },
    
    showUnfriendModal(friend) {
      this.selectedFriend = friend;
      this.showModal = true;
      this.closeDropdown();
    },
    
    closeModal() {
      this.showModal = false;
      this.selectedFriend = null;
      this.isRemoving = false;
    },
    
    async confirmUnfriend() {
      if (!this.selectedFriend) return;
      
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      
      try {
        this.isRemoving = true;
        const res = await fetch("http://localhost:3000/users/unfriend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id, 
            friendId: this.selectedFriend.id 
          })
        });
        
        const result = await res.json();
        
        if (res.ok) {
          this.friends = this.friends.filter(f => f.id !== this.selectedFriend.id);
          this.closeModal();
          this.showNotification(`Đã hủy kết bạn với ${this.selectedFriend.firstname}`, 'success');
        } else {
          this.showNotification(result.msg || "Lỗi khi hủy kết bạn", 'error');
        }
      } catch (err) {
        console.error("Unfriend error:", err);
        this.showNotification("Có lỗi xảy ra, vui lòng thử lại", 'error');
      } finally {
        this.isRemoving = false;
      }
    },
    
    viewProfile(friend) {
      console.log('View profile:', friend);
      // Navigate to friend's profile
      // this.$router.push(`/profile/${friend.id}`);
    },
    
    sendMessage(friend) {
      console.log('Send message to:', friend);
      // Navigate to chat or open message modal
    },
    
    blockFriend(friendId) {
      console.log('Block friend:', friendId);
      this.closeDropdown();
      // Implement block functionality
    },
    
    formatLastActive(date) {
      const now = new Date();
      const diff = now - new Date(date);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'Hoạt động hôm nay';
      if (days === 1) return 'Hoạt động hôm qua';
      if (days < 7) return `Hoạt động ${days} ngày trước`;
      return `Hoạt động ${Math.floor(days / 7)} tuần trước`;
    },
    
    showNotification(message) {
      // eslint-disable-next-line no-unused-vars
      const notificationType = 'info'; // If you're not using this, remove this line
      // Simple notification - you can replace with a proper notification system
      alert(message);
    }
  }
};
</script>

<style scoped>
/* Base Styles */
.friends-page {
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Header Section */
.friends-header {
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1c1e21;
  margin: 0 0 4px 0;
}

.friends-count {
  font-size: 15px;
  color: #65676b;
}

/* Search and Filter Controls */
.friends-controls {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #65676b;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #dadde1;
  border-radius: 20px;
  background: #f0f2f5;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background: white;
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 8px 16px;
  background: #e4e6ea;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-tab:hover {
  background: #d8dadf;
}

.filter-tab.active {
  background: #1877f2;
  color: white;
}

/* Friends Container */
.friends-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Friends Grid */
.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

/* Friend Card */
.friend-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
}

.friend-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* Friend Avatar */
.friend-avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.friend-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.friend-avatar:hover {
  opacity: 0.9;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: #42b883;
  border: 2px solid white;
  border-radius: 50%;
}

/* Friend Info */
.friend-info {
  margin-bottom: 16px;
}

.friend-name {
  font-size: 16px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 4px 0;
  cursor: pointer;
  transition: color 0.2s;
}

.friend-name:hover {
  color: #1877f2;
}

.friend-username {
  font-size: 13px;
  color: #65676b;
  margin: 0 0 8px 0;
}

.mutual-friends {
  margin-bottom: 4px;
}

.mutual-count {
  font-size: 13px;
  color: #65676b;
}

.last-activity {
  margin-top: 4px;
}

.activity-text {
  font-size: 13px;
  color: #65676b;
}

/* Friend Actions */
.friend-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.message-btn {
  background: #1877f2;
  color: white;
}

.message-btn:hover {
  background: #166fe5;
}

.more-btn {
  background: #e4e6ea;
  color: #1c1e21;
  flex: 0 0 40px;
  padding: 8px;
}

.more-btn:hover,
.more-btn.active {
  background: #d8dadf;
}

.btn-icon {
  font-size: 16px;
}

/* Dropdown Menu */
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 200px;
  z-index: 1000;
  margin-top: 4px;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 15px;
  color: #1c1e21;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f2f3f5;
}

.dropdown-item.danger {
  color: #e41e3f;
}

.dropdown-item.danger:hover {
  background: #fff2f2;
}

.dropdown-icon {
  font-size: 16px;
  width: 20px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #dadde1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #65676b;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: #f2f3f5;
}

.modal-body {
  padding: 20px;
}

.friend-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f0f2f5;
  border-radius: 8px;
}

.preview-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.preview-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 2px 0;
}

.preview-info p {
  font-size: 13px;
  color: #65676b;
  margin: 0;
}

.modal-description {
  font-size: 15px;
  color: #1c1e21;
  line-height: 1.4;
  margin: 0;
}

.modal-actions {
  padding: 16px 20px;
  border-top: 1px solid #dadde1;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e4e6ea;
  color: #1c1e21;
}

.cancel-btn:hover {
  background: #d8dadf;
}

.confirm-btn {
  background: #e41e3f;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #d91a40;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #65676b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 15px;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #65676b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e4e6ea;
  border-top: 3px solid #1877f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .friends-header {
    padding: 16px;
  }
  
  .friends-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-tabs {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .filter-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .filter-tab {
    flex-shrink: 0;
  }
  
  .friends-container {
    padding: 0 16px;
  }
  
  .friends-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }
  
  .friend-card {
    padding: 12px;
  }
  
  .friend-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .more-btn {
    flex: 1;
  }
}
</style>