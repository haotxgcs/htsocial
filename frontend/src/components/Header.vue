<template>
  <div>
    <div class="mobile-toggle" :class="{ 'active': isOpen, 'show-on-chat': isMessagesPage }" @click="isOpen = !isOpen">
      <div v-if="!isOpen"  alt="Menu" style="color: #666;"><PanelLeftOpen/></div>
      <div v-else alt="Close" style="filter: invert(1); "><PanelLeftClose/></div> 
    </div>

    <aside class="vertical-sidebar" :class="{ 'open': isOpen, 'collapsed-for-chat': isMessagesPage }">

      <div class="sidebar-header">
        <router-link to="/home" class="logo-link">
          <img src="../assets/htsocial.png" alt="HTSocial" class="logo" />
        </router-link>
        <strong class="logo-title" @click="$router.push('/home')">HT Social</strong>
      </div>

      

      <nav class="sidebar-nav">
        <router-link to="/home" class="nav-item" active-class="active">
          <div class="icon-box"><House/></div>
          <span>Home</span>
        </router-link>

        <router-link to="/friend" class="nav-item" active-class="active">
          <div class="icon-box"><Users/></div>
          <span>Friends</span>
        </router-link>

        <router-link to="/marketplace" class="nav-item" active-class="active">
          <div class="icon-box"><Store/></div>
          <span>Marketplace</span>
        </router-link>

        <router-link to="/saved" class="nav-item" active-class="active">
          <div class="icon-box"><Bookmark/></div>
          <span>Saved</span>
        </router-link>

        <router-link to="/hidden" class="nav-item" active-class="active">
          <div class="icon-box"><EyeOff/></div>
          <span>Hidden</span>
        </router-link>

        <router-link to="/orders" class="nav-item" active-class="active">
          <div class="icon-box"><ShoppingBag/></div>
          <span>Orders</span>
        </router-link>

        <router-link to="/cart" class="nav-item" active-class="active">
          <div class="icon-box"><ShoppingCart/></div>
          <span>Cart</span>
        </router-link>

        <router-link to="/seller-orders" class="nav-item" active-class="active">
          <div class="icon-box"><Store/></div>
          <span>Seller Orders</span>
        </router-link>
        
      </nav>

      <div class="spacer"></div>

      <div class="sidebar-actions">
        <div class="action-btn" @click="toggleDark()" title="Theme">
          <div v-if="isDark"><Sun/></div>
          <div v-else><Moon/></div>
        </div>

        <div class="action-btn" @click.stop="toggleMessage" title="Message">
          <MessageCircle/>
          <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>

          <div v-if="showMessageDropdown" class="popover-panel msg-popover">
            <div class="popover-header">
              <h3>Messages</h3>
              <span v-if="unreadMessages > 0" class="hdr-badge">{{ unreadMessages }}</span>
            </div>
            <div class="msg-list-scroll">
            <div class="msg-list">
              <div v-if="loadingContacts" class="msg-empty">Loading...</div>
              <template v-else-if="contacts.length">
                <div
                  v-for="c in contacts" :key="c._id"
                  class="mc-row"
                  :class="{ 'mc-unread': isUnread(c) }"
                  @click.stop="openChat(c)"
                >
                  <div class="mc-av-wrap">
                    <img :src="resolveAvatar(getPartner(c))" class="mc-av" @error="onAvErr" />
                    <span v-if="isOnline(getPartner(c)?._id)" class="mc-dot"></span>
                  </div>
                  <div class="mc-info">
                    <div class="mc-name-row">
                      <span class="mc-name">{{ getPartner(c)?.firstname }} {{ getPartner(c)?.lastname }}</span>
                      <span class="mc-time">{{ fmtTime(c.createdAt) }}</span>
                    </div>
                    <div class="mc-prev" :class="{ 'mc-bold': isUnread(c) }">
                      <span v-if="isMine(c)" class="mc-you">You: </span>
                      <span v-if="c.recalled" class="mc-recalled">recalled a message</span>
                      <span v-else>{{ c.content || '—' }}</span>
                    </div>
                  </div>
                  <span v-if="isUnread(c)" class="mc-badge"></span>
                </div>
              </template>
              <div v-else class="msg-empty">No messages yet</div>
            </div>
            </div>
            <div class="popover-footer">
              <router-link to="/messages" @click.stop="closeDropdowns">See all messages</router-link>
            </div>
          </div>
        </div>

        <div class="action-btn" @click.stop="toggleNotification" title="Notifications">
          <Bell/>
          <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>

          <div v-if="showNotificationDropdown" class="popover-panel">
            <div class="popover-header"><h3>Thông báo</h3></div>
            <div class="popover-body"><p class="empty-text">Chưa có thông báo</p></div>
          </div>
        </div>
      </div>

      <div class="user-profile-section" @click.stop="toggleUserDropdown">
        <div class="profile-card">
          <img :src="currentUser.avatarUrl || defaultAssetAvatar" class="avatar" />
          <div class="user-info">
            <p class="name">{{ currentUser.name }}</p>
            <p class="username">{{ currentUser.username }}</p>
          </div>
        </div>

        <div v-if="showUserDropdown" class="user-menu-popover">
          <div class="menu-item" @click="goToProfile">
            <CircleUserRound/> 
            <span class="menu-title">View Profile</span>
          </div>
          <div class="menu-item" @click="goToSettings">
            <Settings/>
            <span class="menu-title">Settings</span>
          </div>
          <div class="menu-item logout" @click="logout">
            <LogOut/> 
            <span class="menu-title">Logout</span>
          </div>
        </div>
      </div>

    </aside>

    <div v-if="isOpen" class="sidebar-overlay" @click="isOpen = false"></div>

  </div>
</template>

<script>
import { useDark, useToggle } from '@vueuse/core';
import { io } from 'socket.io-client';

const API = process.env.VUE_APP_API_URL || 'http://localhost:3000';
import { House, Users, Store, Bookmark, EyeOff, ShoppingBag, Moon, Sun, MessageCircle, Bell, CircleUserRound, Settings, LogOut, ShoppingCart, PanelLeftClose, PanelLeftOpen  } from 'lucide-vue-next';

export default {
  name: 'VerticalHeader',
  components: { 
    House,
    Users,
    Store,
    Bookmark,
    EyeOff,
    ShoppingBag,
    Moon,
    Sun,
    MessageCircle,
    Bell,
    CircleUserRound,
    Settings,
    LogOut,
    ShoppingCart,
    PanelLeftClose,
    PanelLeftOpen
  },
  setup() {
    const isDark = useDark();
    const toggleDark = useToggle(isDark);
    return { isDark, toggleDark };
  },
  data() {
    return {
      isOpen: false,
      search: '',
      
      showMessageDropdown: false,
      showNotificationDropdown: false,
      showUserDropdown: false,

      unreadMessages: 0,
      unreadNotifications: 5,

      contacts: [],
      loadingContacts: false,
      onlineUserIds: new Set(),
      socket: null,

      currentUser: {
        name: 'User',
        username: '@user',
        avatarUrl: '',
        id: null
      },
      defaultAssetAvatar: require('../assets/user.png')
    };
  },
  computed: {
    isMessagesPage() {
      return this.$route?.path?.startsWith("/messages");
    }
  },

  methods: {
    handleSearch() {
      console.log('Searching:', this.search);
    },
    toggleMessage() {
      this.showMessageDropdown = !this.showMessageDropdown;
      this.showNotificationDropdown = false;
      this.showUserDropdown = false;
      if (this.showMessageDropdown) {
        this.fetchContacts();
        // Reset unread khi mở
        this.unreadMessages = 0;
      }
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
    
    goToProfile() {
      const user = JSON.parse(localStorage.getItem('user'));
      const id = user?._id || user?.id;
      if (id) this.$router.push(`/profile/${id}`);
      this.closeDropdowns();
    },
    goToSettings() { console.log('Settings'); this.closeDropdowns(); },
    closeDropdowns() {
      this.showUserDropdown = false;
      this.showMessageDropdown = false; 
      this.showNotificationDropdown = false;
    },
    
    async logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      this.$router.push("/login");
    },

    loadUserFromStorage() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUser.id = user._id || user.id;
          this.currentUser.name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
          this.currentUser.username = user.username ? `@${user.username}` : (user.email || '@user');

          // Fix avatar: Cloudinary URL đã có https://, local path cần prefix
          if (user.avatar && user.avatar !== 'uploads/user.png') {
            this.currentUser.avatarUrl = user.avatar.startsWith('http')
              ? user.avatar
              : `http://localhost:3000/${user.avatar}`;
          } else {
            this.currentUser.avatarUrl = this.defaultAssetAvatar;
          }
        } catch (e) { console.error(e); }
      }
    },

    // ── Socket ───────────────────────────────────────────────────
    initSocket() {
      if (!this.currentUser.id) return;
      this.socket = io(API, { transports: ['websocket'] });

      this.socket.on('connect', () => {
        this.socket.emit('user:online', this.currentUser.id);
      });

      this.socket.on('users:online', ids => {
        this.onlineUserIds = new Set(ids.map(String));
      });

      this.socket.on('user:status', ({ userId, online }) => {
        const set = new Set(this.onlineUserIds);
        online ? set.add(String(userId)) : set.delete(String(userId));
        this.onlineUserIds = set;
      });

      // Tin nhắn mới → tăng badge + cập nhật contacts
      this.socket.on('message:new', (message) => {
        this.unreadMessages++;
        // Bump contact lên đầu hoặc thêm mới
        const senderId = message.sender?._id || message.sender;
        const idx = this.contacts.findIndex(c => {
          const p = this.getPartner(c);
          return p && String(p._id) === String(senderId);
        });
        if (idx !== -1) {
          const updated = { ...this.contacts[idx], ...message };
          this.contacts.splice(idx, 1);
          this.contacts.unshift(updated);
        } else {
          this.contacts.unshift(message);
        }
      });

      // Tin mình gửi thành công → cập nhật preview
      this.socket.on('message:sent', ({ message }) => {
        if (!message) return;
        const idx = this.contacts.findIndex(c => {
          const p = this.getPartner(c);
          const rid = message.receiver?._id || message.receiver;
          return p && String(p._id) === String(rid);
        });
        if (idx !== -1) {
          this.contacts.splice(idx, 1, { ...this.contacts[idx], ...message });
        } else {
          this.contacts.unshift(message);
        }
      });
    },

    // ── API ──────────────────────────────────────────────────────
    async fetchUnreadCount() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API}/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.unreadMessages = data.count || 0;
        }
      } catch (e) { console.error('fetchUnreadCount:', e); }
    },

    async fetchContacts() {
      if (this.loadingContacts) return;
      this.loadingContacts = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API}/messages/contacts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.contacts = data.contacts || [];
        }
      } catch (e) { console.error('fetchContacts:', e); }
      finally { this.loadingContacts = false; }
    },

    // ── Helpers ──────────────────────────────────────────────────
    getPartner(contact) {
      const myId = this.currentUser.id;
      if (!myId || !contact) return null;
      const sid = contact.sender?._id || contact.sender;
      if (String(sid) === String(myId)) {
        return contact.receiver?._id ? contact.receiver : null;
      }
      return contact.sender?._id ? contact.sender : null;
    },

    isMine(contact) {
      const myId = this.currentUser.id;
      const sid = contact.sender?._id || contact.sender;
      return String(sid) === String(myId);
    },

    isUnread(contact) {
      return !this.isMine(contact) && contact.status !== 'seen';
    },

    isOnline(userId) {
      return userId && this.onlineUserIds.has(String(userId));
    },

    resolveAvatar(user) {
      if (!user?.avatar) return this.defaultAssetAvatar;
      if (user.avatar.startsWith('http')) return user.avatar;
      return `http://localhost:3000/${user.avatar}`;
    },

    onAvErr(e) {
      e.target.src = this.defaultAssetAvatar;
    },

    fmtTime(d) {
      if (!d) return '';
      const date = new Date(d);
      const now = new Date();
      const diff = now - date;
      if (diff < 60000) return 'now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    openChat(contact) {
      const partner = this.getPartner(contact);
      if (!partner?._id) return;
      this.closeDropdowns();
      this.unreadMessages = Math.max(0, this.unreadMessages - (this.isUnread(contact) ? 1 : 0));
      this.$router.push(`/messages?userId=${partner._id}`);
    },
    
    handleClickOutside(e) {
      if (!this.$el.contains(e.target)) {
        this.closeDropdowns();
      }
    }
  },
  watch: {
    $route() {
      this.isOpen = false;
    }
  },
  mounted() {
    this.loadUserFromStorage();
    document.addEventListener('click', this.handleClickOutside);
    window.addEventListener('user-profile-updated', this.loadUserFromStorage);
    this.fetchUnreadCount();
    this.initSocket();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    this.socket?.disconnect();
  }
};
</script>

<style scoped>
/* --- VARIABLES --- */
:root {
  --primary: #FF642F;
  --bg-sidebar: #FFFFFF;
  --text-main: #333;
  --hover-bg: #FFF0E6;
}

/* --- LAYOUT CHÍNH --- */
.vertical-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 280px;
  background-color: var(--bg-sidebar, #fff);
  border-right: 1px solid #EAEAEA;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0,0,0,0.02);
  
  /* ⭐ QUAN TRỌNG: Cho phép cuộn cả thanh sidebar nếu màn hình quá ngắn */
  overflow-y: visible; 
}

/* Ẩn thanh cuộn của sidebar cho đẹp */
.vertical-sidebar::-webkit-scrollbar { width: 0; }

/* --- 1. LOGO --- */
.sidebar-header {
  margin-bottom: 20px;
  padding-left: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0; /* Không cho logo bị co lại */
}
.logo {
  margin-top:15px;
  height: 40px;
  width: auto;
  object-fit: contain;
  border-radius:20%;
}
.logo-title{
  padding: 15px 0 0 15px;
  font-size: 28px;
  font-weight: 700;
  font-family:'Berkshire Swash';
  color: #FF624F;
  cursor:pointer;
}

/* --- 2. SEARCH BOX --- */
.sidebar-search {
  margin-bottom: 20px;
  flex-shrink: 0;
}
.search-box {
  display: flex;
  align-items: center;
  background: #F8F9FA;
  border: 1px solid #EEE;
  border-radius: 12px;
  padding: 10px 12px;
  transition: all 0.2s;
}
.search-box:focus-within {
  border-color: #FF642F;
  background: #FFF;
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1);
}
.search-icon { width: 16px; opacity: 0.5; margin-right: 8px; }
.search-box input {
  border: none; outline: none; width: 100%; background: transparent;
  font-size: 14px; color: #333;
}

/* --- 3. NAVIGATION --- */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px; 
  /* ⭐ FIX: Xóa overflow-y: auto ở đây để không hiện thanh cuộn con */
  /* Menu sẽ hiển thị full, đẩy các phần dưới xuống */
  flex-shrink: 0; 
  margin-bottom: 10px;
  overflow-y: auto;
}

.sidebar-footer {
  flex-shrink: 0; /* Không bao giờ bị co lại */
  background: #fff;
  position: relative; /* Làm điểm neo cho popup */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #F8F9FA;
  color: #FF642F;
}

.nav-item.active {
  background-color: #FF642F;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 100, 47, 0.25);
}

.nav-item .icon-box {
  width: 24px; margin-right: 12px; display: flex; justify-content: center;
}
.nav-item img {
  width: 20px; height: 20px; object-fit: contain;
  opacity: 0.6; transition: 0.2s;
}
.nav-item:hover img { opacity: 1; filter: invert(53%) sepia(35%) saturate(3000%) hue-rotate(345deg) brightness(100%) contrast(105%); } 
.nav-item.active img {
  filter: brightness(0) invert(1);
  opacity: 1;
}

/* Spacer: Đẩy các phần bên dưới xuống đáy */
.spacer { flex-grow: 1; }

/* --- 4. ACTIONS (ICONS) --- */
.sidebar-actions {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 16px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.action-btn {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: #F8F9FA;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: all 0.2s;
}
.action-btn:hover { background: #FFF0E6; transform: translateY(-2px); }
.action-btn img { width: 20px; opacity: 0.7; }
.badge {
  position: absolute; top: -2px; right: -2px;
  background: #FF4444; color: white;
  font-size: 10px; font-weight: bold;
  padding: 2px 5px; border-radius: 10px;
  border: 2px solid #fff;
}

/* --- 5. USER PROFILE --- */
.user-profile-section {
  position: relative;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  flex-shrink: 0; /* Giữ user profile luôn cố định kích thước */
}
.profile-card {
  display: flex; align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.profile-card:hover { 
  background: #F8F9FA; 
  border-color: #eee;
}

.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 1px solid #eee; }
.user-info .name { font-weight: 700; font-size: 14px; margin: 0; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.user-info .username { font-size: 12px; color: #999; margin: 0; }

/* --- POPOVERS --- */
.popover-panel {
  position: absolute; left: 50px; bottom: 40px;
  width: 280px; background: white; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13); z-index: 1100; border: 1px solid #eee;
  overflow: hidden;
}
.popover-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid #f3f4f6;
}
.popover-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #111827; }
.popover-body { padding: 20px; text-align: center; color: #999; font-size: 13px; }
.popover-footer { padding: 12px 16px; text-align: center; border-top: 1px solid #f3f4f6; }
.popover-footer a { color: #FF642F; font-weight: 600; font-size: 13px; text-decoration: none; }
.popover-footer a:hover { text-decoration: underline; }

/* Message popup */
.msg-popover { width: 340px; }
.hdr-badge {
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 20px;
}

/* Contact list inside popup */
.msg-list-scroll{
  max-height: 200px;
  overflow-y: auto;
}

.msg-list-scroll::-webkit-scrollbar { width: 5px; }
.msg-list-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 10px; }


.msg-list { max-height: 360px; overflow-y: auto; }
.msg-list::-webkit-scrollbar { width: 4px; }
.msg-list::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
.msg-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }

.mc-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; cursor: pointer; transition: background 0.12s;
  border-bottom: 1px solid #f3f4f6;
}
.mc-row:last-child { border-bottom: none; }
.mc-row:hover { background: #f9fafb; }
.mc-unread { background: #fff8f6; }
.mc-unread:hover { background: #fdf4f0; }

.mc-av-wrap {
  position: relative; flex-shrink: 0;
  width: 46px; height: 46px; min-width: 46px; min-height: 46px;
}
.mc-av {
  width: 46px !important; height: 46px !important;
  min-width: 46px; min-height: 46px;
  border-radius: 50%; object-fit: cover;
  display: block; border: 2px solid #f3f4f6;
  aspect-ratio: 1 / 1;
}
.mc-dot {
  position: absolute; bottom: 1px; right: 1px;
  width: 11px; height: 11px; border-radius: 50%;
  background: #22c55e; border: 2px solid #fff;
}

.mc-info { flex: 1; min-width: 0; }
.mc-name-row {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 6px; margin-bottom: 3px;
}
.mc-name {
  font-size: 13px; font-weight: 600; color: #111827;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; white-space: nowrap; }
.mc-prev {
  font-size: 12px; color: #6b7280;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-bold { font-weight: 600; color: #111827; }
.mc-you { color: #9ca3af; }
.mc-recalled { font-style: italic; color: #9ca3af; }
.mc-badge {
  width: 8px; height: 8px; border-radius: 50%;
  background: #FF642F; flex-shrink: 0;
}

/* User Menu Dropdown */
.user-menu-popover {
  position: absolute; bottom: 100%; left: 0; width: 100%;
  background: white; border-radius: 12px;
  box-shadow: 0 -5px 25px rgba(0,0,0,0.1); margin-bottom: 12px;
  overflow: hidden; z-index: 1100; border: 1px solid #eee;
}
.menu-item { padding: 12px 16px; display: flex; align-items: center; cursor: pointer; color: #555; font-size: 14px; transition: 0.2s; }
.menu-item:hover { background: #f9f9f9; color: #FF642F; }
.menu-item img { width: 18px; margin-right: 12px; opacity: 0.6; }

.menu-title {
  margin-left:5px;
  font-weight:500;
}

/* --- RESPONSIVE MOBILE --- */
.mobile-toggle {
  display: none; 
  position: fixed; 
  top: 20px; left: 20px;
  width: 40px; height: 40px;
  background: white; 
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1200; 
  cursor: pointer;
  align-items: center; justify-content: center;
}
.mobile-toggle img { width: 22px; height: 22px; }
.mobile-toggle.active { background: #FF642F; }
.mobile-toggle.active img { filter: brightness(0) invert(1); }

.sidebar-overlay { display: none; }

@media (max-width: 1024px) {
  .mobile-toggle { display: flex; }
  
  .vertical-sidebar {
    transform: translateX(-100%);
    padding-top: 80px; /* đủ chỗ cho mobile-toggle (40px) + gap */ 
  }
  
  .vertical-sidebar.open {
    transform: translateX(0);
  }
  
  .sidebar-overlay {
    display: block; position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); 
    backdrop-filter: blur(2px);
    z-index: 999;
  }
}

/* Messages page: sidebar collapsed, only hamburger visible */
.vertical-sidebar.collapsed-for-chat {
  transform: translateX(-100%);
}
.vertical-sidebar.collapsed-for-chat.open {
  transform: translateX(0);
  padding-top: 0;
}
/* Khi chat page sidebar mở: header cố định ở top, ngang hàng nút toggle */
.vertical-sidebar.collapsed-for-chat.open .sidebar-header {
  position: fixed;
  top: 0; left: 0;
  width: 280px;
  height: 68px;
  padding: 14px 16px 14px 72px; /* 72px = left offset để tránh nút toggle */
  background: white;
  border-bottom: 1px solid #eaeaea;
  z-index: 1100;
  margin-bottom: 0;
  box-sizing: border-box;
}
/* Đẩy nav xuống đúng chiều cao header */
.vertical-sidebar.collapsed-for-chat.open nav.sidebar-nav {
  margin-top: 68px;
}
.show-on-chat {
  display: flex !important;
}
</style>