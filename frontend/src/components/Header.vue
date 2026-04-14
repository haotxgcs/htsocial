<template>
  <div>
    <div class="mobile-toggle" :class="{ 'active': isOpen, 'show-on-chat': isMessagesPage }" @click="isOpen = !isOpen">
      <div v-if="!isOpen"  alt="Menu"  title="Open"><PanelLeftOpen/></div>
      <div v-else alt="Close"  title="Close"><PanelLeftClose/></div> 
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

        <router-link v-if="currentUser.role === 'admin'" to="/admin" class="nav-item" active-class="active">
          <div class="icon-box"><ShieldUser/></div>
          <span>Admin Panel</span>
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
                      <span v-if="c._reactedBy" class="mc-reacted">
                        {{ c._reactedBy }} reacted {{ c._reactEmoji }}
                      </span>
                      <template v-else>
                        <span v-if="isMine(c)" class="mc-you">You: </span>
                        <span v-if="c.recalled" class="mc-recalled">recalled a message</span>
                        <span v-else-if="c.mediaUrls && c.mediaUrls.length && !c.content">
                          <span v-if="c.mediaUrls[0].type === 'video'">🎥 [video]</span>
                          <span v-else>🖼️ [image]</span>
                        </span>
                        <span v-else>{{ c.content || '—' }}</span>
                      </template>
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

          <div v-if="showNotificationDropdown" class="popover-panel notif-popover">
            <div class="popover-header">
              <h3>Notifications <span v-if="unreadNotifications > 0" class="hdr-badge">{{ unreadNotifications }}</span> </h3>
              
              <a href="#" v-if="unreadNotifications > 0" @click.prevent="markAllNotifsRead" class="popover-footer a">Mark all as read</a>
            </div>
            <div class="notif-list">
              <div v-if="!notifications.length" class="msg-empty">No notifications yet</div>
              <div
                v-for="n in notifications"
                :key="n.id"
                class="notif-row"
                :class="{ 'notif-unread': !n.read }"
                @click="onNotifClick(n)"
              >
                <div class="notif-icon-wrap">
                  <img v-if="n.avatar" :src="n.avatar" class="notif-av" @error="onNotifAvErr" />
                  <div v-else class="notif-icon-default">
                    <span>{{ n.icon }}</span>
                  </div>
                </div>
                <div class="notif-content">
                  <p class="notif-text" v-html="n.text"></p>
                  <span class="notif-time">{{ fmtTime(n.createdAt) }}</span>
                </div>
                <span v-if="!n.read" class="notif-dot"></span>
              </div>
            </div>
            <div class="popover-footer">
              
              <router-link to="/notification" @click.stop="closeDropdowns">See all notifications</router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="user-profile-section" @click.stop="toggleUserDropdown">
        <div class="profile-card">
          <img :src="currentUser.avatarUrl || defaultAssetAvatar" class="avatar" />
          <div class="user-info">
            <p class="name">{{ currentUser.name }} <span class="admin-badge" v-if="currentUser.role === 'admin'">Admin</span></p>
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
          <div class="menu-item logout" @click="showLogoutConfirm = true; showUserDropdown = false">
            <LogOut/> 
            <span class="menu-title">Logout</span>
          </div>
        </div>
      </div>

    </aside>

    <div v-if="isOpen" class="sidebar-overlay" @click="isOpen = false"></div>

  </div>
  <ConfirmDialog
  v-if="showLogoutConfirm"
  message="Are you sure you want to logout?"
  @confirm="doLogout"
  @cancel="showLogoutConfirm = false"
/>

</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import { io } from 'socket.io-client';

const API = process.env.VUE_APP_API_URL || 'http://localhost:3000';
import { House, Users, Store, Bookmark, EyeOff, ShoppingBag, Moon, Sun, MessageCircle, Bell, CircleUserRound, Settings, LogOut, ShoppingCart, PanelLeftClose, PanelLeftOpen,ShieldUser  } from 'lucide-vue-next';

export default {
  name: 'VerticalHeader',
  components: {
    ConfirmDialog,
    
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
    PanelLeftOpen,
    ShieldUser
  },
  
  data() {
    return {
      isOpen: false,
      search: '',
      
      showMessageDropdown: false,
      showNotificationDropdown: false,
      showUserDropdown: false,

      unreadMessages: 0,
      unreadNotifications: 0,

      notifications: [],   // [{ id, type, text, icon, avatar, link, read, createdAt }]
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
      defaultAssetAvatar: require('../assets/user.png'),

      isDark: false,

      showLogoutConfirm: false,
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
        // Chỉ fetch lần đầu, không ghi đè contacts đang có
        if (!this.contacts.length) this.fetchContacts();
        this.unreadMessages = 0;
      }
    },
    toggleNotification() {
      this.showNotificationDropdown = !this.showNotificationDropdown;
      this.showMessageDropdown = false;
      this.showUserDropdown = false;
      if (this.showNotificationDropdown) {
        // Mark all as read khi mở
        this.$nextTick(() => this.markAllNotifsRead());
      }
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
    goToSettings() { 
      console.log('Settings'); this.closeDropdowns(); 
      this.$router.push('/settings');
    },
    closeDropdowns() {
      this.showUserDropdown = false;
      this.showMessageDropdown = false; 
      this.showNotificationDropdown = false;
    },
    
// Đổi logout() thành doLogout()
    doLogout() {
      this.showLogoutConfirm = false;
      this.isDark = false;
      this.applyTheme(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      if (this.socket) this.socket.disconnect();
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
          this.currentUser.role = user.role || "user";
          this.isDark = user.darkTheme || false;
          this.applyTheme(this.isDark);

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

    applyTheme(dark) {
      if (dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    },

    async toggleDark() {
      this.isDark = !this.isDark;
      this.applyTheme(this.isDark);

      // Cập nhật localStorage ngay lập tức
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.darkTheme = this.isDark;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (e) {
        console.error('toggleDark localStorage error:', e);
      }

      // Lưu lên server
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API}/users/preference`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ darkTheme: this.isDark })
        });
      } catch (e) { console.error('toggleDark save error:', e); }
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
        window.__onlineUserIds = ids.map(String);
        // Broadcast danh sách ban đầu
        window.dispatchEvent(new CustomEvent('friends:online-list', {
          detail: ids.map(String)
        }));
      });

      this.socket.on('user:status', ({ userId, online }) => {
        const set = new Set(this.onlineUserIds);
        online ? set.add(String(userId)) : set.delete(String(userId));
        this.onlineUserIds = set;
        // Broadcast từng thay đổi realtime
        window.__onlineUserIds = [...set];
        window.dispatchEvent(new CustomEvent(
          online ? 'friend:online' : 'friend:offline',
          { detail: String(userId) }
        ));
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
          const updated = { ...this.contacts[idx], ...message, _reactedBy: null, _reactEmoji: null };
          this.contacts.splice(idx, 1);
          this.contacts.unshift(updated);
        } else {
          this.contacts.unshift({ ...message, _reactedBy: null, _reactEmoji: null });
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
          // Reset react khi có tin nhắn mới
          this.contacts.splice(idx, 1, {
            ...this.contacts[idx], ...message,
            _reactedBy: null, _reactEmoji: null
          });
        } else {
          this.contacts.unshift(message);
        }
      });

      // React: cập nhật trạng thái trong sidebar popup
      this.socket.on('message:reacted', ({ messageId, reactions }) => {
        const myId = String(this.currentUser.id);

        // Xác định ai react — luôn là người đang đăng nhập (emit từ MessagePage)
        // hoặc là partner (nhận từ server broadcast)
        const myReaction = (reactions || []).find(r =>
          String(r.user?._id || r.user) === myId
        );
        const otherReaction = (reactions || []).find(r =>
          String(r.user?._id || r.user) !== myId
        );

        // Tìm contact chứa tin nhắn này — duyệt tất cả contacts
        // Contact là "latest message" của cuộc trò chuyện, có thể trùng messageId
        let foundIdx = -1;
        for (let i = 0; i < this.contacts.length; i++) {
          const ct = this.contacts[i];
          // Cách 1: _id của contact chính là messageId
          if (String(ct._id) === String(messageId)) { foundIdx = i; break; }
        }

        // Nếu không tìm thấy → dùng contact đang active (đầu list)
        if (foundIdx === -1 && this.contacts.length > 0) {
          // Không tìm được → không cập nhật (tránh sai)
          return;
        }
        if (foundIdx === -1) return;

        const contact = { ...this.contacts[foundIdx] };
        if (otherReaction) {
          const p = this.getPartner(contact);
          contact._reactedBy = p?.firstname || 'Someone';
          contact._reactEmoji = otherReaction.emoji;
        } else if (myReaction) {
          contact._reactedBy = 'You';
          contact._reactEmoji = myReaction.emoji;
        } else {
          contact._reactedBy = null;
          contact._reactEmoji = null;
        }
        this.contacts.splice(foundIdx, 1, contact);
      });

      // ── Notification socket events ────────────────────────────────
      // THAY các listener post hiện tại:
      this.socket.on('notification:like_post', (payload) => {
        this.addNotif({
          type: 'like_post', icon: '❤️',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> liked your post`,
          link: payload.link || null,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:like_comment', (payload) => {
        this.addNotif({
          type: 'like_comment', icon: '❤️',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> liked your comment`,
          link: payload.link || null,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:like_reply', (payload) => {
        this.addNotif({
          type: 'like_reply', icon: '❤️',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> liked your reply`,
          link: payload.link || null,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:comment', (payload) => {
        this.addNotif({
          type: 'comment', icon: '💬',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> commented on your post`,
          link: payload.link || null,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:reply', (payload) => {
        this.addNotif({
          type: 'reply', icon: '↩️',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> replied to your comment`,
          link: payload.link || null,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:share', (payload) => {
        this.addNotif({
          type: 'share', icon: '🔁',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> shared your post`,
          link: payload.link || null,
          createdAt: payload.createdAt
        });
      });
      
      this.socket.on('notification:friend_request', ({ from }) => {
        this.addNotif({ type: 'friend_request', icon: '👤', avatar: from?.avatar,
          text: `<b>${from?.firstname} ${from?.lastname}</b> sent you a friend request`,
          link: '/friend' });
      });
      this.socket.on('notification:friend_accepted', ({ from }) => {
        this.addNotif({ type: 'friend_accepted', icon: '🤝', avatar: from?.avatar,
          text: `<b>${from?.firstname} ${from?.lastname}</b> accepted your friend request`,
          link: from?._id ? `/profile/${from._id}` : null });
      });

      this.socket.on('notification:order_placed', (payload) => {
        this.addNotif({
          type: 'order_placed', icon: '🛒',
          text: payload.text,                                        // ✅ dùng text đã render sẵn
          link: payload.meta?.orderId ? `/orders/${payload.meta.orderId}` : '/orders',
          avatar: payload.avatar,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:order_status', (payload) => {
        this.addNotif({
          type: 'order_status', icon: '📦',
          text: payload.text,                                        // ✅ không còn undefined
          link: payload.meta?.orderId ? `/orders/${payload.meta.orderId}` : '/orders',
          avatar: payload.avatar,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:new_order', (payload) => {
        this.addNotif({
          type: 'new_order', icon: '🛍️',
          text: payload.text,
          link: payload.meta?.orderId ? `/seller-orders/${payload.meta.orderId}` : '/seller-orders',
          avatar: payload.avatar,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:order_cancelled', (payload) => {
        this.addNotif({
          type: 'order_cancelled', icon: '❌',
          text: payload.text,
          link: payload.meta?.orderId ? `/orders/${payload.meta.orderId}` : '/orders',
          avatar: payload.avatar,
          createdAt: payload.createdAt
        });
      });
      this.socket.on('notification:review', (payload) => {
        this.addNotif({
          type: 'review', icon: '⭐',
          avatar: payload.from?.avatar,
          text: payload.text || `<b>${payload.from?.firstname} ${payload.from?.lastname}</b> reviewed <b>${payload.meta?.itemName || 'your item'}</b>`,
          link: payload.link || '/marketplace',  // ✅ dùng link từ backend đã có itemId
          createdAt: payload.createdAt
        });
      });

      this.socket.on('notification:reply_review', (payload) => {
        this.addNotif({
          type: 'reply_review', icon: '💬',
          avatar: payload.from?.avatar
            ? (payload.from.avatar.startsWith('http') ? payload.from.avatar : `http://localhost:3000/${payload.from.avatar}`)
            : null,
          text: payload.text || `Seller replied to your review`,
          link: payload.link || (payload.meta?.itemId
            ? `/marketplace/${payload.meta.itemId}?scrollToReviews=true${payload.meta?.reviewId ? '&reviewId=' + payload.meta.reviewId : ''}`
            : '/marketplace'),
          createdAt: payload.createdAt
        });
      });

      this.socket.on('notification:refund_requested', (payload) => {
        const orderId = payload.meta?.orderId;
        this.addNotif({
          type: 'refund_requested', icon: '🔄',
          avatar: payload.from?.avatar ? (payload.from.avatar.startsWith('http') ? payload.from.avatar : `http://localhost:3000/${payload.from.avatar}`) : null,
          text: payload.text || `<b>${(`${payload.from?.firstname || ""} ${payload.from?.lastname || ""}`.trim() || "Someone")}</b> requested a refund`,
          link: orderId
            ? `/seller-orders?tab=refunds&orderId=${orderId}`
            : '/seller-orders?tab=refunds',
          createdAt: payload.createdAt
        });
      });
 
      // Buyer nhận: refund được approve → vào /orders/:id
      this.socket.on('notification:refund_approved', (payload) => {
        const orderId = payload.meta?.orderId;
        this.addNotif({
          type: 'refund_approved', icon: '💰',
          text: payload.text || `Your refund has been <b>approved</b> 💰`,
          link: orderId ? `/orders/${orderId}` : '/orders',
          createdAt: payload.createdAt
        });
      });
 
      // Buyer nhận: refund bị reject → vào /orders/:id
      this.socket.on('notification:refund_rejected', (payload) => {
        const orderId = payload.meta?.orderId;
        this.addNotif({
          type: 'refund_rejected', icon: '❌',
          text: payload.text || `Your refund has been <b>rejected</b>`,
          link: orderId ? `/orders/${orderId}` : '/orders',
          createdAt: payload.createdAt
        });
      });

      this.socket.on('notification:report_received', (payload) => {
        this.addNotif({
          type: 'report_received',
          icon: '🚩',
          text: payload.text || `Your report has been received and is under review.`,
          reportId: payload.meta?.reportId || payload.reportId || null,
          meta: payload.meta || null,
          createdAt: payload.createdAt
        });
      });

      // Thêm listener cho report_resolved (hiện chưa có):
      this.socket.on('notification:report_resolved', (payload) => {
        this.addNotif({
          type: 'report_resolved',
          icon: '✅',
          text: payload.text || `Your report has been resolved.`,
          reportId: payload.meta?.reportId || null,
          meta: payload.meta || null,
          createdAt: payload.createdAt
        });
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
          const myId = String(this.currentUser.id || '');
          // Giữ lại _reactedBy/_reactEmoji đã có trước khi fetch
          const prevMap = {};
          this.contacts.forEach(ct => {
            if (ct._partnerId) prevMap[ct._partnerId] = {
              _reactedBy: ct._reactedBy || null,
              _reactEmoji: ct._reactEmoji || null
            };
          });
          this.contacts = (data.contacts || []).map(ct => {
            const sid = String(ct.sender?._id || ct.sender || '');
            const rid = String(ct.receiver?._id || ct.receiver || '');
            const _partnerId = sid === myId ? rid : sid;
            const prev = prevMap[_partnerId] || {};
            return { ...ct, _partnerId, ...prev };
          });
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
    
    onMsgReacted({ detail }) {
      const { partnerId, reactedBy, emoji } = detail || {};
      const idx = this.contacts.findIndex(c => {
        const p = this.getPartner(c);
        return p && String(p._id) === String(partnerId);
      });
      if (idx === -1) return;
      const updated = { ...this.contacts[idx] };
      updated._reactedBy = reactedBy || null;
      updated._reactEmoji = emoji || null;
      this.contacts.splice(idx, 1, updated);
    },

    // ── Notification helpers ─────────────────────────────────────
    addNotif({ type, text, icon, avatar, link, createdAt, reportId, meta }) {
      this.notifications.unshift({
        id: Date.now() + Math.random(),
        type, text, icon,
        avatar: avatar ? (avatar.startsWith('http') ? avatar : `http://localhost:3000/${avatar}`) : null,
        link: link || null,
        reportId: reportId || meta?.reportId || null,
        meta: meta || null,
        read: false,
        createdAt: createdAt || new Date().toISOString()
      });
      // Giữ tối đa 50 notification
      if (this.notifications.length > 50) this.notifications.pop();
      this.unreadNotifications++;
    },

    async markAllNotifsRead() {
      this.notifications.forEach(n => n.read = true);
      this.unreadNotifications = 0;
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API}/notifications/read-all`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) { console.error('markAllNotifsRead:', e); }
    },

    async onNotifClick(n) {
      if (!n.read) {
        n.read = true;
        this.unreadNotifications = Math.max(0, this.notifications.filter(x => !x.read).length);
        try {
          const token = localStorage.getItem('token');
          await fetch(`${API}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) { console.error('markOneRead:', e); }
      }
      this.closeDropdowns();

      // Nếu là report notification → navigate sang /notification với reportId
      if (n.type === 'report_received' || n.type === 'report_resolved') {
        const reportId = n.reportId || n.meta?.reportId || null;
        this.$router.push('/notification?openReport=' + (reportId || ''));
        return;
      }

      if (n.link) this.$router.push(n.link);
    },

    onNotifAvErr(e) {
      e.target.style.display = 'none';
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
      this.closeDropdowns();
    }
  },
  mounted() {
    this.loadUserFromStorage();
    document.addEventListener('click', this.handleClickOutside);
    window.addEventListener('user-profile-updated', this.loadUserFromStorage);
    window.addEventListener('msg:reacted', this.onMsgReacted);
    this.fetchUnreadCount();
    this.initSocket();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('msg:reacted', this.onMsgReacted);
    this.socket?.disconnect();
  }
};
</script>

<style scoped>
/* ── LAYOUT ── */
.vertical-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 280px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s, border-color 0.3s;
  box-shadow: 4px 0 24px rgba(0,0,0,0.05);
  overflow-y: visible;
}
.vertical-sidebar::-webkit-scrollbar { width: 0; }

/* ── LOGO ── */
.sidebar-header {
  margin-bottom: 20px;
  padding-left: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.logo {
  margin-top: 15px;
  height: 40px; width: auto;
  object-fit: contain;
  border-radius: 20%;
}
.logo-title {
  padding: 15px 0 0 15px;
  font-size: 28px; font-weight: 700;
  font-family: 'Berkshire Swash';
  color: #FF624F;
  cursor: pointer;
}

/* ── NAV ── */
.sidebar-nav {
  display: flex; flex-direction: column;
  gap: 6px; flex-shrink: 0;
  margin-bottom: 10px;
  overflow-y: auto;
}
.sidebar-footer {
  flex-shrink: 0;
  background: var(--bg-sidebar);
  position: relative;
}
.nav-item {
  display: flex; align-items: center;
  padding: 12px 16px; border-radius: 12px;
  text-decoration: none;
  color: var(--text-sub);
  font-weight: 500;
  transition: all 0.2s ease;
}
.nav-item:hover {
  background-color: var(--hover-primary);
  color: #FF642F;
}
.nav-item.active {
  background-color: #FF642F;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 100, 47, 0.25);
}
.nav-item .icon-box {
  width: 24px; margin-right: 12px;
  display: flex; justify-content: center;
}

.spacer { flex-grow: 1; }

/* ── ACTIONS ── */
.sidebar-actions {
  display: flex; justify-content: space-evenly;
  margin-bottom: 16px; padding: 16px 0;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
.action-btn {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--bg-input);
  color: var(--text-sub);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: all 0.2s;
}
.action-btn:hover {
  background: var(--hover-primary);
  color: #FF642F;
  transform: translateY(-2px);
}
.badge {
  position: absolute; top: -2px; right: -2px;
  background: #FF4444; color: white;
  font-size: 10px; font-weight: bold;
  padding: 2px 5px; border-radius: 10px;
  border: 2px solid var(--bg-sidebar);
}

/* ── USER PROFILE ── */
.user-profile-section {
  position: relative;
  border-top: 1px solid var(--border-color);
  padding-top: 16px; flex-shrink: 0;
}
.profile-card {
  display: flex; align-items: center;
  padding: 8px 12px;
  background: var(--bg-card);
  border-radius: 12px; cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.profile-card:hover {
  background: var(--hover-bg);
  border-color: var(--border-color);
}
.avatar {
  width: 40px; height: 40px; border-radius: 50%;
  object-fit: cover; margin-right: 12px;
  border: 1px solid var(--border-color);
}
.user-info .name {
  font-weight: 700; font-size: 14px; margin: 0;
  color: var(--text-main);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;
}
.user-info .username { font-size: 12px; color: var(--text-sub); margin: 0; }

.admin-badge{
  background: #22c55e; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 20px;
  margin-left: 6px;
}

/* ── POPOVERS ── */
.popover-panel {
  position: absolute; left: 50px; bottom: 40px;
  width: 280px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  z-index: 1100;
  border: 1px solid var(--border-color);
  overflow: hidden;
}
.popover-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}
.popover-header h3 {
  margin: 0; font-size: 15px; font-weight: 700;
  color: var(--text-main);
}
.popover-body { padding: 20px; text-align: center; color: var(--text-sub); font-size: 13px; }
.popover-footer {
  padding: 12px 16px; text-align: center;
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
}
.popover-footer a, .popover-header a {
  color: #FF642F; font-weight: 600; font-size: 13px; text-decoration: none;
}
.popover-footer a:hover, .popover-header a:hover { text-decoration: underline; }

/* ── MESSAGE POPUP ── */
.msg-popover { width: 340px; }
.hdr-badge {
  background: #ef4444; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 20px;
}
.msg-list-scroll { max-height: 200px; overflow-y: auto; }
.msg-list-scroll::-webkit-scrollbar { width: 5px; }
.msg-list-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
.msg-list { max-height: 360px; overflow-y: auto; }
.msg-list::-webkit-scrollbar { width: 4px; }
.msg-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
.msg-empty { padding: 24px; text-align: center; color: var(--text-sub); font-size: 13px; }

.mc-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; cursor: pointer; transition: background 0.12s;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}
.mc-row:last-child { border-bottom: none; }
.mc-row:hover { background: var(--hover-bg); }
.mc-unread { background: var(--hover-primary); }
.mc-unread:hover { background: var(--hover-primary); filter: brightness(0.97); }

.mc-av-wrap {
  position: relative; flex-shrink: 0;
  width: 46px; height: 46px; min-width: 46px; min-height: 46px;
}
.mc-av, .notif-av {
  width: 46px !important; height: 46px !important;
  min-width: 46px; min-height: 46px;
  border-radius: 50%; object-fit: cover;
  display: block; border: 2px solid var(--border-color);
  aspect-ratio: 1/1;
}
.mc-dot {
  position: absolute; bottom: 1px; right: 1px;
  width: 11px; height: 11px; border-radius: 50%;
  background: #22c55e; border: 2px solid var(--bg-card);
}
.mc-info { flex: 1; min-width: 0; }
.mc-name-row {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 6px; margin-bottom: 3px;
}
.mc-name {
  font-size: 13px; font-weight: 600; color: var(--text-main);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-time { font-size: 11px; color: var(--text-sub); flex-shrink: 0; white-space: nowrap; }
.mc-prev {
  font-size: 12px; color: var(--text-sub);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-bold { font-weight: 600; color: var(--text-main); }
.mc-you { color: var(--text-sub); }
.mc-recalled { font-style: italic; color: var(--text-sub); }
.mc-reacted { color: #f97316; font-size: 12px; }
.mc-badge { width: 8px; height: 8px; border-radius: 50%; background: #FF642F; flex-shrink: 0; }

/* ── NOTIFICATION POPUP ── */
.notif-popover { width: 360px; }
.notif-list { max-height: 400px; overflow-y: auto; }
.notif-list::-webkit-scrollbar { width: 4px; }
.notif-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
.notif-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; cursor: pointer; transition: background 0.12s;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  background: var(--bg-card);
}
.notif-row:last-child { border-bottom: none; }
.notif-row:hover { background: var(--hover-bg); }
.notif-unread { background: var(--hover-primary); }
.notif-unread:hover { background: var(--hover-primary); filter: brightness(0.97); }
.notif-icon-wrap { flex-shrink: 0; width: 40px; height: 40px; position: relative; }
.notif-icon-default {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--hover-primary); border: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.notif-content { flex: 1; min-width: 0; }
.notif-text { font-size: 13px; color: var(--text-main); margin: 0 0 3px; line-height: 1.4; }
.notif-text b { font-weight: 700; }
.notif-time { font-size: 11px; color: var(--text-sub); }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #FF642F; flex-shrink: 0; margin-top: 4px; }

/* ── USER MENU ── */
.user-menu-popover {
  position: absolute; bottom: 100%; left: 0; width: 100%;
  background: var(--bg-card); border-radius: 12px;
  box-shadow: 0 -5px 25px rgba(0,0,0,0.15); margin-bottom: 12px;
  overflow: hidden; z-index: 1100;
  border: 1px solid var(--border-color);
}
.menu-item {
  padding: 12px 16px; display: flex; align-items: center;
  cursor: pointer; color: var(--text-sub); font-size: 14px;
  transition: 0.2s;
  background: var(--bg-card);
}
.menu-item:hover { background: var(--hover-bg); color: #FF642F; }
.menu-item.logout:hover { color: #ef4444; }
.menu-title { margin-left: 5px; font-weight: 500; }

/* ── MOBILE TOGGLE ── */
.mobile-toggle {
  display: none;
  position: fixed; top: 20px; left: 20px;
  width: 40px; height: 40px;
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  z-index: 1200; cursor: pointer;
  align-items: center; justify-content: center;
  color: var(--text-sub);
  transition: background 0.3s;
}
.mobile-toggle.active {  color: var(--text-sub); }

.sidebar-overlay { display: none; }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .mobile-toggle { display: flex; }

  .vertical-sidebar {
    transform: translateX(-100%);
    padding-top: 0;
    overflow-y: auto;
  }

  .vertical-sidebar .sidebar-header {
    position: fixed;
    top: 0; left: 0;
    width: 280px; height: 68px;
    padding: 14px 16px 14px 72px;
    background: var(--bg-sidebar);
    border-bottom: 1px solid var(--border-color);
    z-index: 1100; margin-bottom: 0;
    box-sizing: border-box;
    transition: background 0.3s, border-color 0.3s;
  }

  .vertical-sidebar.open {
    transform: translateX(0);
    padding-top: 0;
  }

  .vertical-sidebar.open nav.sidebar-nav {
    margin-top: 68px;
  }

  .sidebar-overlay {
    display: block; position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(2px);
    z-index: 999;
  }

.vertical-sidebar {
    overflow: visible !important;
  }

.popover-panel {
    position: absolute !important;
    left: 10px !important;
    /* Giảm bottom xuống để popup sát với cụm nút bấm bên dưới */
    bottom: 65px !important; 
    
    /* Ép chiều rộng để nằm gọn trong sidebar 280px, không bị tràn ra ngoài */
    width: 260px !important;
    max-width: 260px !important;
    
    /* Loại bỏ các khoảng cách và biến đổi cũ */
    transform: none !important;
    margin: 0 !important;
    z-index: 2000;
    
    /* Tạo hiệu ứng đổ bóng nhẹ để phân biệt với menu bên dưới */
    box-shadow: 0 -10px 25px rgba(0,0,0,0.1) !important;
    border: 1px solid var(--border-color);
  }

  /* Chỉnh riêng cho từng loại nếu cần vị trí khác nhau một chút */
  .msg-popover {
    /* Vị trí này sẽ nằm ngay trên icon Message */
    bottom: 70px !important; 
  }

  .notif-popover {
    /* Vị trí này sẽ nằm ngay trên icon Notification */
    bottom: 70px !important;
  }

  /* Giới hạn chiều cao danh sách tin nhắn để popup không che hết cả màn hình */
  .msg-list-scroll, .notif-list {
    max-height: 300px !important;
    overflow-y: auto;
  }


}

/* ── MESSAGES PAGE ── */
.vertical-sidebar.collapsed-for-chat { transform: translateX(-100%); }
.vertical-sidebar.collapsed-for-chat.open { transform: translateX(0); padding-top: 0; }
.vertical-sidebar.collapsed-for-chat.open .sidebar-header {
  position: fixed; top: 0; left: 0;
  width: 280px; height: 68px;
  padding: 14px 16px 14px 72px;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-color);
  z-index: 1100; margin-bottom: 0; box-sizing: border-box;
}
.vertical-sidebar.collapsed-for-chat.open nav.sidebar-nav { margin-top: 68px; }
.show-on-chat { display: flex !important; }
</style>