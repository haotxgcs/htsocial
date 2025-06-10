<template>
  <div class="group-page">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Groups</h2>
        <div class="settings-icon">⚙️</div>
      </div>
      
      <div class="search-box">
        <div class="search-input">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search groups" v-model="searchQuery" />
        </div>
      </div>

      <div class="sidebar-menu">
        <div class="menu-item active">
          <span class="icon">📰</span>
          <span>Your feed</span>
        </div>
        <div class="menu-item">
          <span class="icon">🔍</span>
          <span>Discover</span>
        </div>
        <div class="menu-item">
          <span class="icon">👥</span>
          <span>Your groups</span>
        </div>
      </div>

      <div class="create-group">
        <button class="create-btn" @click="createGroup">
          <span class="plus">+</span>
          Create new group
        </button>
      </div>

      <div class="joined-groups">
        <div class="section-header">
          <h3>Groups you've joined</h3>
          <a href="#" class="see-all">See all</a>
        </div>
        
        <div class="group-list">
          <div class="group-item" v-for="group in joinedGroups" :key="group.id" @click="selectGroup(group)">
            <img :src="group.avatar || defaultGroupAvatar" :alt="group.name" class="group-avatar" />
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="last-active">Last active {{ group.lastActive }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="content-header">
        <h3>Recent activity</h3>
      </div>

      <div class="posts-container">
        <div class="post-card" v-for="post in posts" :key="post.id">
          <div class="post-header">
            <div class="group-info-header">
              <img :src="post.groupAvatar || defaultGroupAvatar" :alt="post.groupName" class="group-avatar-small" />
              <div class="post-meta">
                <div class="group-name-link">{{ post.groupName }}</div>
                <div class="post-author-time">
                  <span class="author">{{ post.author }}</span>
                  <span class="separator">·</span>
                  <span class="time">{{ post.time }}</span>
                  <span class="separator">·</span>
                  <span class="privacy">🌐</span>
                </div>
              </div>
            </div>
            <div class="post-options">⋯</div>
          </div>

          <div class="post-content">
            <h4 class="post-title">{{ post.title }}</h4>
            <div class="post-text" :class="{ expanded: post.expanded }">
              {{ post.content }}
            </div>
            <button 
              v-if="post.content.length > 200" 
              class="see-more-btn" 
              @click="togglePostExpansion(post.id)"
            >
              {{ post.expanded ? 'See less' : 'See more' }}
            </button>
          </div>

          <div class="post-media" v-if="post.image">
            <img :src="post.image" :alt="post.title" class="post-image" />
          </div>

          <div class="post-actions">
            <button class="action-btn" @click="likePost(post.id)">
              <span class="icon">👍</span>
              <span>Like</span>
              <span v-if="post.likes" class="count">{{ post.likes }}</span>
            </button>
            <button class="action-btn" @click="commentPost(post.id)">
              <span class="icon">💬</span>
              <span>Comment</span>
              <span v-if="post.comments" class="count">{{ post.comments }}</span>
            </button>
            <button class="action-btn" @click="sharePost(post.id)">
              <span class="icon">↗️</span>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GroupPage",
  data() {
    return {
      searchQuery: '',
      selectedGroup: null,
      defaultGroupAvatar: require('../assets/group.png'),
      joinedGroups: [
        {
          id: 1,
          name: 'FGW_ CHUYÊN NGÀNH CÔNG NGHỆ THÔNG TIN (Ms. Trinh+ Ms. Châu)',
          avatar: null,
          lastActive: 'a day ago',
          members: 1250
        },
        {
          id: 2,
          name: 'SV Greenwich Việt Nam - CS TP. Hồ Chí Minh',
          avatar: null,
          lastActive: '3 days ago',
          members: 890
        },
        {
          id: 3,
          name: 'Khóa Giỏi Tiếng Anh - Xóa Group!!!',
          avatar: null,
          lastActive: '18 minutes ago',
          members: 456
        },
        {
          id: 4,
          name: 'Đại Học Dùng Học Đại',
          avatar: null,
          lastActive: '54 minutes ago',
          members: 2340
        },
        {
          id: 5,
          name: 'TỰ LỌC UYỂN THỊ VETER',
          avatar: null,
          lastActive: '2 hours ago',
          members: 678
        }
      ],
      posts: [
        {
          id: 1,
          groupName: 'Group WhiteHat',
          groupAvatar: null,
          author: 'Bùi Hiếu',
          time: '23m',
          title: 'CẢNH BÁO!',
          content: 'Lỗ hổng bảo mật nghiêm trọng trong windows có thể chiếm quyền kiểm soát hệ thống. Một lỗ hổng bảo mật nghiêm trọng trong đã được phát hiện, cho phép kẻ tấn công có thể bám NTLM khi trích xuất các tệp được tạo đặc biệt từ kho lưu trữ RAR/ZIP. Lỗ hổng này, được định danh là CVE-2025-24071, với điểm CVSS là 7,5.',
          image: '/api/placeholder/800/400',
          likes: 15,
          comments: 8,
          shares: 3,
          expanded: false
        },
        {
          id: 2,
          groupName: 'FGW_ CHUYÊN NGÀNH CÔNG NGHỆ THÔNG TIN',
          groupAvatar: null,
          author: 'Ms. Trinh',
          time: '1h',
          title: 'Thông báo lịch học tuần tới',
          content: 'Các em chú ý lịch học tuần tới có thay đổi. Lớp Programming sẽ chuyển từ thứ 3 sang thứ 5. Các em nhớ cập nhật lịch học nhé!',
          image: null,
          likes: 25,
          comments: 12,
          shares: 1,
          expanded: false
        }
      ]
    };
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return this.$router.push("/login");
    
    // Load user's groups from API
    this.loadUserGroups();
    this.loadGroupPosts();
  },
  methods: {
    async loadUserGroups() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const response = await fetch(`http://localhost:3000/users/${user.id}/groups`);
        if (response.ok) {
          const data = await response.json();
          this.joinedGroups = data.groups || this.joinedGroups;
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    },

    async loadGroupPosts() {
      try {
        const response = await fetch('http://localhost:3000/groups/posts');
        if (response.ok) {
          const data = await response.json();
          this.posts = data.posts || this.posts;
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    },

    createGroup() {
      // Redirect to create group page or open modal
      this.$router.push('/groups/create');
    },

    selectGroup(group) {
      // Navigate to specific group
      this.$router.push(`/groups/${group.id}`);
    },

    togglePostExpansion(postId) {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.expanded = !post.expanded;
      }
    },

    async likePost(postId) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const response = await fetch('http://localhost:3000/posts/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, userId: user.id })
        });
        
        if (response.ok) {
          const post = this.posts.find(p => p.id === postId);
          if (post) {
            post.likes = (post.likes || 0) + 1;
          }
        }
      } catch (error) {
        console.error('Error liking post:', error);
      }
    },

    commentPost(postId) {
      // Open comment section or navigate to post detail
      console.log('Comment on post:', postId);
    },

    sharePost(postId) {
      // Open share dialog
      console.log('Share post:', postId);
    }
  }
};
</script>

<style scoped>
.group-page {
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

.search-box {
  padding: 0 16px 20px;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 0 12px;
}

.search-icon {
  color: #65676b;
  margin-right: 8px;
}

.search-input input {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 0;
  font-size: 15px;
  outline: none;
}

.search-input input::placeholder {
  color: #65676b;
}

.sidebar-menu {
  padding: 0 8px;
  margin-bottom: 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 8px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
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

.menu-item span:not(.icon) {
  font-size: 15px;
  font-weight: 500;
}

.create-group {
  padding: 0 16px;
  margin-bottom: 20px;
}

.create-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: #1877f2;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background-color: #f0f2f5;
}

.create-btn .plus {
  width: 20px;
  height: 20px;
  background: #1877f2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 14px;
}

.joined-groups {
  padding: 0 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0;
}

.see-all {
  color: #1877f2;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
}

.see-all:hover {
  text-decoration: underline;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:hover {
  background-color: #f2f2f2;
}

.group-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  margin-right: 12px;
  object-fit: cover;
  background: #e4e6ea;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: #1c1e21;
  line-height: 1.3;
  margin-bottom: 2px;
}

.last-active {
  font-size: 12px;
  color: #65676b;
}

/* Main Content */
.main-content {
  margin-left: 320px;
  padding: 20px;
  width: calc(100% - 320px);
  max-width: 680px;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  margin: 0;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
}

.group-info-header {
  display: flex;
  align-items: center;
}

.group-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  background: #e4e6ea;
}

.post-meta {
  flex: 1;
}

.group-name-link {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 2px;
}

.post-author-time {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #65676b;
  gap: 4px;
}

.post-options {
  color: #65676b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.post-options:hover {
  background-color: #f2f2f2;
}

.post-content {
  padding: 0 16px 12px;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 8px 0;
}

.post-text {
  font-size: 15px;
  line-height: 1.4;
  color: #1c1e21;
  margin-bottom: 8px;
}

.post-text:not(.expanded) {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.see-more-btn {
  background: none;
  border: none;
  color: #65676b;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.see-more-btn:hover {
  text-decoration: underline;
}

.post-media {
  margin-bottom: 12px;
}

.post-image {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
}

.post-actions {
  display: flex;
  border-top: 1px solid #e4e6ea;
  padding: 8px 4px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: none;
  border: none;
  color: #65676b;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f2f2f2;
}

.action-btn .icon {
  font-size: 16px;
}

.action-btn .count {
  font-size: 13px;
  color: #65676b;
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
}
</style>