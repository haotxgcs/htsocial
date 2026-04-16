<template>
  <div class="admin-page">

    <!-- HEADER -->
    <div class="admin-header">
      <div class="header-left">
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-sub">HT Social — Content & User Management</p>
      </div>
      <button class="back-btn" @click="$router.push('/home')">Back Home</button>
    </div>

    <!-- STAT CARDS -->
    <div class="stat-row">
      <div class="stat-card"><span class="stat-icon">👥</span><div><div class="stat-val">{{ stats.totalUsers }}</div><div class="stat-lbl">Total Users</div></div></div>
      <div class="stat-card danger"><span class="stat-icon">🚫</span><div><div class="stat-val">{{ stats.bannedUsers }}</div><div class="stat-lbl">Banned</div></div></div>
      <div class="stat-card"><span class="stat-icon">📝</span><div><div class="stat-val">{{ stats.totalPosts }}</div><div class="stat-lbl">Posts</div></div></div>
      <div class="stat-card"><span class="stat-icon">🛍️</span><div><div class="stat-val">{{ stats.totalItems }}</div><div class="stat-lbl">Items</div></div></div>
      <div class="stat-card warn"><span class="stat-icon">🚩</span><div><div class="stat-val">{{ stats.pendingReports}}</div><div class="stat-lbl">Pending Reports</div></div></div>
      <div class="stat-card warn"><span class="stat-icon">✉️</span><div><div class="stat-val">{{ stats.unreadContacts }}</div><div class="stat-lbl">Unread Messages</div></div></div>
    </div>

    <!-- MAIN TABS -->
    <div class="main-tabs">
      <button v-for="tab in tabs" :key="tab.key" class="main-tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        {{ tab.icon }} {{ tab.label }}
        <span v-if="tab.key === 'users' && stats.bannedUsers" class="tab-chip danger">{{ stats.bannedUsers }}</span>
        <span v-if="tab.key === 'reports' && stats.pendingReports" class="tab-chip warn">{{ stats.pendingReports }}</span>
      </button>
    </div>

    <!-- CONTENT AREA -->
    <div class="content-area">

      <!-- TOOLBAR -->
      <div class="toolbar">
        <!-- Sub-tabs Posts -->
        <div v-if="activeTab === 'posts'" class="sub-tabs">
          <button :class="{ active: postSubTab === 'posts' }" @click="postSubTab = 'posts'; page = 1; loadData()">Posts <span class="chip">{{ stats.totalPosts }}</span></button>
          <button :class="{ active: postSubTab === 'shares' }" @click="postSubTab = 'shares'; page = 1; loadData()">Shares <span class="chip">{{ stats.totalShares }}</span></button>
        </div>
        <!-- Filter Reports -->
        <div v-else-if="activeTab === 'reports'" class="sub-tabs">
          <button v-for="s in reportStatuses" :key="s.key" :class="{ active: reportFilter === s.key }" @click="reportFilter = s.key; page = 1; loadData()">
            {{ s.label }} <span class="chip" :class="s.key === 'pending' ? 'warn-chip' : ''">{{ reportStats[s.key] || 0 }}</span>
          </button>
        </div>
        <!-- Filter status cho Users tab -->
        <div v-else-if="activeTab === 'users'" class="sub-tabs">
          <button
            v-for="f in userStatusFilters"
            :key="f.key"
            :class="{ active: userStatusFilter === f.key }"
            @click="userStatusFilter = f.key; page = 1; loadData()"
          >
            {{ f.label }}
            <span class="chip" :class="f.key === 'banned' ? 'danger-chip' : ''">
              {{ f.key === 'all' ? stats.totalUsers : f.key === 'banned' ? stats.bannedUsers : (stats.totalUsers - stats.bannedUsers) }}
            </span>
          </button>
        </div>
        <div v-else class="toolbar-spacer"></div>

        <!-- Search (không dùng cho reports) -->
        <div v-if="activeTab !== 'reports'" class="search-wrap">
          <svg class="search-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13.5 13.5 3 3"/></svg>
          <input v-model="searchQuery" class="search-input" :placeholder="'Search ' + activeTab + '...'" @keyup.enter="doSearch"/>
          <button v-if="searchQuery" class="clear-ico" @click="clearSearch">x</button>
          <button class="search-btn" @click="doSearch">Search</button>
        </div>
      </div>

      <!-- ══ USERS ══ -->
      <template v-if="activeTab === 'users'">
        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>
        <div v-else-if="!users.length" class="empty-state"><span class="empty-icon">👥</span><p>No users found</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>USER</th><th>USERNAME</th><th>EMAIL</th><th>POSTS</th><th>JOINED</th><th>STATUS</th><th>ACTION</th></tr></thead>
            <tbody>
              <tr v-for="u in users" :key="u._id" :class="{ 'row-banned': u.banned }">
                <td><div class="cell-user"><img :src="resolveAvatar(u.avatar)" class="av" @error="onAvErr"/><span class="fw600 link" @click="openInNewTab('/profile/' + u._id)">{{ u.firstname }} {{ u.lastname }}</span></div></td>
                <td><span class="mono">@{{ u.username }}</span></td>
                <td><span class="muted">{{ u.email }}</span></td>
                <td><span class="chip-num">{{ u.postCount || 0 }}</span></td>
                <td><span class="muted">{{ fmtDate(u.createdAt) }}</span></td>
                <td><span class="status-pill" :class="u.banned ? 'banned' : 'active'">{{ u.banned ? 'Banned' : 'Active' }}</span></td>
                <td>
                  <button v-if="!u.banned" class="btn-action red" @click="confirmAction('ban', u)">Ban</button>
                  <button v-else class="btn-action green" @click="confirmAction('unban', u)">Unban</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ══ POSTS ══ -->
      <template v-if="activeTab === 'posts' && postSubTab === 'posts'">
        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>
        <div v-else-if="!posts.length" class="empty-state"><span class="empty-icon">📝</span><p>No posts found</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>POST</th><th>AUTHOR</th><th>CATEGORY</th><th>LIKES</th><th>COMMENTS</th><th>DATE</th><th>ACTION</th></tr></thead>
            <tbody>
              <tr v-for="p in posts" :key="p._id">
                <td><div class="cell-user"><img v-if="p.media && p.mediaType==='image'" :src="resolveImg(p.media)" class="thumb" @error="onAvErr"/><div v-else class="thumb-ph">📄</div><span class="fw600 truncate link" @click="openInNewTab('/home?postId=' + p._id)">{{ p.title || '(no title)' }}</span></div></td>
                <td><div class="cell-user"><img :src="resolveAvatar(p.author && p.author.avatar)" class="av-sm" @error="onAvErr"/><span class="link" @click="p.author && openInNewTab('/profile/' + p.author._id)">{{ p.author && p.author.firstname }} {{ p.author && p.author.lastname }}</span></div></td>
                <td><span class="cat-tag">{{ p.category }}</span></td>
                <td><span class="chip-num">{{ p.likes && p.likes.length || 0 }}</span></td>
                <td><span class="chip-num">{{ p.commentCount || 0 }}</span></td>
                <td><span class="muted">{{ fmtDate(p.createdAt) }}</span></td>
                <td><button class="btn-action red" @click="confirmAction('deletePost', p)">Delete</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ══ SHARES ══ -->
      <template v-if="activeTab === 'posts' && postSubTab === 'shares'">
        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>
        <div v-else-if="!shares.length" class="empty-state"><span class="empty-icon">🔁</span><p>No shares found</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>SHARED BY</th><th>ORIGINAL POST</th><th>ORIGINAL AUTHOR</th><th>DATE</th><th>ACTION</th></tr></thead>
            <tbody>
              <tr v-for="s in shares" :key="s._id">
                <td><div class="cell-user"><img :src="resolveAvatar(s.username && s.username.avatar)" class="av-sm" @error="onAvErr"/><span class="fw600 link" @click="s.username && openInNewTab('/profile/' + s.username._id)">{{ s.username && s.username.firstname }} {{ s.username && s.username.lastname }}</span></div></td>
                <td><span class="fw600 truncate link" @click="s.post && s.post._id && openInNewTab('/home?postId=' + s.post._id)">{{ s.post && s.post.title || '(deleted)' }}</span></td>
                <td><span class="muted link" @click="s.post && s.post.author && openInNewTab('/profile/' + s.post.author._id)">{{ s.post && s.post.author && s.post.author.firstname }} {{ s.post && s.post.author && s.post.author.lastname }}</span></td>
                <td><span class="muted">{{ fmtDate(s.createdAt) }}</span></td>
                <td><button class="btn-action red" @click="confirmAction('deleteShare', s)">Delete</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ══ ITEMS ══ -->
      <template v-if="activeTab === 'items'">
        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>
        <div v-else-if="!items.length" class="empty-state"><span class="empty-icon">🛍️</span><p>No items found</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>ITEM</th><th>SELLER</th><th>PRICE</th><th>TYPE</th><th>STATUS</th><th>RATING</th><th>DATE</th><th>ACTION</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="item._id">
                <td><div class="cell-user"><img v-if="item.images && item.images.length" :src="resolveImg(item.images[0])" class="thumb" @error="onAvErr"/><div v-else class="thumb-ph">📦</div><span class="fw600 truncate link" @click="openInNewTab('/marketplace/' + item._id)">{{ item.title }}</span></div></td>
                <td><div class="cell-user"><img :src="resolveAvatar(item.seller && item.seller.avatar)" class="av-sm" @error="onAvErr"/><span class="link" @click="item.seller && openInNewTab('/profile/' + item.seller._id)">{{ item.seller && item.seller.firstname }} {{ item.seller && item.seller.lastname }}</span></div></td>
                <td><span class="price">${{ item.price }}</span></td>
                <td><span class="cat-tag">{{ item.type }}</span></td>
                <td><span class="status-pill" :class="item.status">{{ item.status }}</span></td>
                <td><span class="muted">{{ item.rating && item.rating.average && item.rating.average.toFixed(1) || '—' }}</span></td>
                <td><span class="muted">{{ fmtDate(item.createdAt) }}</span></td>
                <td><button class="btn-action red" @click="confirmAction('deleteItem', item)">Delete</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ══ REPORTS ══ -->
      <template v-if="activeTab === 'reports'">
        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>
        <div v-else-if="!reports.length" class="empty-state"><span class="empty-icon">🚩</span><p>No reports found</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>REPORTER</th>
                <th>TYPE</th>
                <th>REASON</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reports" :key="r._id">
                <!-- Reporter -->
                <td>
                  <div class="cell-user">
                    <img :src="resolveAvatar(r.reporter && r.reporter.avatar)" class="av-sm" @error="onAvErr"/>
                    <span class="link" @click="r.reporter && openInNewTab('/profile/' + r.reporter._id)">
                      {{ r.reporter && r.reporter.firstname }} {{ r.reporter && r.reporter.lastname }}
                    </span>
                  </div>
                </td>
                <!-- Target type + link -->
                <td>
                  <div class="report-target">
                    <span class="target-type-badge" :class="r.targetType">{{ r.targetType }}</span>
                    <span v-if="r.targetId" class="link muted small" @click="openTarget(r)">View →</span>
                  </div>
                </td>
                <!-- Reason -->
                <td>
                  <span class="reason-badge">{{ formatReason(r.reason) }}</span>
                </td>
                <!-- Description -->
                <td>
                  <span class="muted desc-cell" :title="r.description">
                    {{ r.description ? (r.description.length > 60 ? r.description.slice(0, 60) + '...' : r.description) : '—' }}
                  </span>
                </td>
                <!-- Status -->
                <td>
                  <span class="status-pill" :class="'report-' + r.status">{{ r.status }}</span>
                </td>
                <!-- Date -->
                <td><span class="muted">{{ fmtDate(r.createdAt) }}</span></td>
                <!-- Actions -->
                <td>
                  <div class="report-actions">
                    <select
                      v-if="r.status !== 'resolved' && r.status !== 'dismissed'"
                      class="status-select"
                      :value="r.status"
                      @change="openReportCommentModal(r, $event.target.value)"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                    <button class="btn-action red sm" @click="confirmAction('deleteReport', r)" title="Delete report">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ══ CONTACTS ══ -->
      <template v-if="activeTab === 'contacts'">
        <div v-if="loading" class="loading-state"><div class="spinner"></div> Loading...</div>
        <div v-else-if="!contacts.length" class="empty-state"><span class="empty-icon">✉️</span><p>No messages yet</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NAME</th><th>EMAIL</th><th>SUBJECT</th>
                <th>MESSAGE</th><th>STATUS</th><th>DATE</th><th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in contacts" :key="c._id" :class="{ 'row-unread': c.status === 'unread' }">
                <td><span class="fw600">{{ c.name }}</span></td>
                <td><span class="muted">{{ c.email }}</span></td>
                <td><span class="truncate" style="max-width:160px;display:block">{{ c.subject || '—' }}</span></td>
                <td>
                  <span class="muted desc-cell" :title="c.message">
                    {{ c.message.length > 60 ? c.message.slice(0,60) + '...' : c.message }}
                  </span>
                </td>
                <td>
                  <span class="status-pill" :class="'contact-' + c.status">{{ c.status }}</span>
                </td>
                <td><span class="muted">{{ fmtDate(c.createdAt) }}</span></td>
                <td>
                  <div class="report-actions">
                    <button class="btn-action green sm" @click="openReply(c)">
                      {{ c.status === 'replied' ? '✏️ Edit Reply' : '↩️ Reply' }}
                    </button>
                    <button class="btn-action red sm" @click="confirmAction('deleteContact', c)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

<!-- Reply Modal -->
<div v-if="contactReplyModal.visible" class="overlay-dim" @click.self="contactReplyModal.visible = false">
  <div class="comment-modal">
    <div class="comment-modal-header">
      <span>↩️ Reply to {{ contactReplyModal.contact?.name }}</span>
      <button class="close-x" @click="contactReplyModal.visible = false">✕</button>
    </div>
    <div class="comment-modal-body">
      <p class="comment-hint" style="font-style:italic;background:var(--bg-input);padding:10px;border-radius:8px;margin:0">
        "{{ contactReplyModal.contact?.message }}"
      </p>
      <label class="comment-label">Your Reply</label>
      <textarea v-model="contactReplyModal.reply" class="comment-textarea" placeholder="Type your reply..." rows="4"></textarea>
    </div>
    <div class="comment-modal-footer">
      <button class="btn-cancel" @click="contactReplyModal.visible = false">Cancel</button>
      <button class="btn-confirm" @click="sendReply">Send Reply</button>
    </div>
  </div>
</div>

      <!-- PAGINATION -->
      <div class="pagination-wrap">
        <Pagination :current-page="page" :total-pages="totalPages" @update:page="changePage" />
      </div>

    </div>

    <!-- Report Comment Modal -->
    <div v-if="reportCommentModal.visible" class="overlay-dim" @click.self="cancelReportComment">
      <div class="comment-modal">
        <div class="comment-modal-header">
          <span>✏️ Update Report Status</span>
          <button class="close-x" @click="cancelReportComment">✕</button>
        </div>
        <div class="comment-modal-body">
          <p class="comment-hint">
            Changing status to <strong :class="'txt-' + reportCommentModal.newStatus">{{ reportCommentModal.newStatus }}</strong>
          </p>
          <label class="comment-label">Admin note <span class="optional">(optional)</span></label>
          <textarea
            v-model="reportCommentModal.note"
            class="comment-textarea"
            placeholder="Leave a note for the reporter... e.g. 'This content has been reviewed and removed.'"
            rows="4"
          ></textarea>
        </div>
        <div class="comment-modal-footer">
          <button class="btn-cancel" @click="cancelReportComment">Cancel</button>
          <button class="btn-confirm" @click="confirmReportComment">Confirm</button>
        </div>
      </div>
    </div>

    <!-- ConfirmDialog -->
    <ConfirmDialog
      v-if="confirmDialog.visible"
      :message="confirmDialog.message"
      @confirm="executeAction"
      @cancel="confirmDialog.visible = false"
    />

    <!-- NotificationModal -->
    <NotificationModal
      :is-visible="notifModal.visible"
      :type="notifModal.type"
      :title="notifModal.title"
      :message="notifModal.message"
      :button-text="notifModal.buttonText"
      @confirm="notifModal.visible = false"
    />

  </div>
</template>

<script>
import ConfirmDialog     from '../common/ConfirmDialog.vue';
import NotificationModal from '../notifications/NotificationModal.vue';
import Pagination        from '../layout/Pagination.vue';

const API = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "AdminPage",
  components: { ConfirmDialog, NotificationModal, Pagination },

  data() {
    return {
      activeTab: "users",
      postSubTab: "posts",
      reportFilter: "pending",
      tabs: [
        { key: "users",   icon: "👥", label: "Users" },
        { key: "posts",   icon: "📝", label: "Posts" },
        { key: "items",   icon: "🛍️", label: "Marketplace" },
        { key: "reports", icon: "🚩", label: "Reports" },
        { key: "contacts", icon: "✉️", label: "Messages" },
      ],
      reportStatuses: [
        { key: "pending",   label: "Pending" },
        { key: "reviewed",  label: "Reviewed" },
        { key: "resolved",  label: "Resolved" },
        { key: "dismissed", label: "Dismissed" },
      ],
      users: [], posts: [], shares: [], items: [], reports: [],
      stats: { totalUsers: 0, bannedUsers: 0, totalPosts: 0, totalShares: 0, totalItems: 0, pendingReports: 0, unreadContacts: 0  },
      reportStats: { pending: 0, reviewed: 0, resolved: 0, dismissed: 0 },
      page: 1, total: 0, limit: 20,
      loading: false, searchQuery: "", activeSearch: "",
      confirmDialog: { visible: false, message: "", action: null, target: null },
      notifModal: { visible: false, type: "success", title: "", message: "", buttonText: "OK" },

      // Trong data() thêm:
      reportCommentModal: {
        visible: false,
        report: null,
        newStatus: "",
        note: ""
      },

      userStatusFilter: "all",

      userStatusFilters: [
        { key: "all",    label: "All" },
        { key: "active", label: "Active" },
        { key: "banned", label: "Banned" },
      ],

      contacts: [],
      contactReplyModal: { visible: false, contact: null, reply: "" },
       
    };
  },

  computed: {
    totalPages() { return Math.ceil(this.total / this.limit); }
  },

  watch: {
    activeTab() { this.page = 1; this.searchQuery = ""; this.activeSearch = ""; this.postSubTab = "posts"; this.loadData(); }
  },

  mounted() { 
    this.checkAdmin(); 
    this.fetchStats(); 

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.darkTheme) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    
    if (this.$route?.query?.tab) {
      this.activeTab = this.$route.query.tab;
    }

    this.loadData(); 
  },

  methods: {
    checkAdmin() {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.role !== "admin") this.$router.push("/home");
    },

    async fetchStats() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API + "/admin/stats", { headers: { Authorization: "Bearer " + token } });
        if (res.ok) { const d = await res.json(); this.stats = d.stats; }
        const cr = await fetch(API + "/contact?limit=1", { headers: { Authorization: "Bearer " + token } });
        if (cr.ok) { const cd = await cr.json(); this.stats.unreadContacts = cd.unreadCount || 0; }
      } catch (e) { console.error(e); }
    },

    async loadData() {
      this.loading = true;
      try {
        const token = localStorage.getItem("token");
        const q = this.activeSearch ? "&search=" + encodeURIComponent(this.activeSearch) : "";
        const base = API + "/admin";
        const h = { Authorization: "Bearer " + token };

        if (this.activeTab === "users") {
          const statusQ = this.userStatusFilter !== "all" ? "&status=" + this.userStatusFilter : "";
          const r = await fetch(base + "/users?page=" + this.page + "&limit=" + this.limit + q + statusQ, { headers: h });
          if (r.ok) { const d = await r.json(); this.users = d.users; this.total = d.total; }
        } else if (this.activeTab === "posts") {
          if (this.postSubTab === "posts") {
            const r = await fetch(base + "/posts?page=" + this.page + "&limit=" + this.limit + q, { headers: h });
            if (r.ok) { const d = await r.json(); this.posts = d.posts; this.total = d.total; }
          } else {
            const r = await fetch(base + "/shares?page=" + this.page + "&limit=" + this.limit, { headers: h });
            if (r.ok) { const d = await r.json(); this.shares = d.shares; this.total = d.total; }
          }
        } else if (this.activeTab === "items") {
          const r = await fetch(base + "/items?page=" + this.page + "&limit=" + this.limit + q, { headers: h });
          if (r.ok) { const d = await r.json(); this.items = d.items; this.total = d.total; }
        } else if (this.activeTab === "reports") {
          const r = await fetch(API + "/reports?page=" + this.page + "&limit=" + this.limit + "&status=" + this.reportFilter, { headers: h });
          if (r.ok) { const d = await r.json(); this.reports = d.reports; this.total = d.total; this.reportStats = d.stats; }
        } else if (this.activeTab === "contacts") {
          const r = await fetch(API + "/contact?page=" + this.page + "&limit=" + this.limit, { headers: h });
          if (r.ok) { const d = await r.json(); this.contacts = d.contacts; this.total = d.total; }
        }
      } catch (e) { console.error(e); }
      finally { this.loading = false; }
    },

    doSearch() { this.activeSearch = this.searchQuery; this.page = 1; this.loadData(); },
    clearSearch() { this.searchQuery = ""; this.activeSearch = ""; this.page = 1; this.loadData(); },
    changePage(p) { this.page = p; this.loadData(); },
    openInNewTab(path) { if (!path) return; window.open(path, '_blank'); },

    openTarget(report) {
      const paths = {
        user:  "/profile/" + report.targetId,
        post:  "/home?postId=" + report.targetId,
        share: "/home?postId=" + report.targetId,
        item:  "/marketplace/" + report.targetId,
      };
      const path = paths[report.targetType];
      if (path) window.open(path, '_blank');
    },

    formatReason(reason) {
      const map = {
        spam: "Spam", harassment: "Harassment", hate_speech: "Hate Speech",
        misinformation: "Misinformation", inappropriate_content: "Inappropriate",
        fake_account: "Fake Account", scam: "Scam", copyright: "Copyright", other: "Other"
      };
      return map[reason] || reason;
    },

// XÓA method updateReportStatus cũ, thay bằng:

openReportCommentModal(report, newStatus) {
  if (newStatus === report.status) return;
  this.reportCommentModal = { visible: true, report, newStatus, note: report.adminNote || "" };
},

cancelReportComment() {
  this.reportCommentModal.visible = false;
},

async confirmReportComment() {
  const { report, newStatus, note } = this.reportCommentModal;
  this.reportCommentModal.visible = false;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(API + "/reports/" + report._id + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ status: newStatus, adminNote: note.trim() })
    });
    if (res.ok) {
      report.status = newStatus;
      report.adminNote = note.trim();
      this.fetchStats();
      if (newStatus !== this.reportFilter) this.loadData();
    }
  } catch (e) { console.error(e); }
},

    confirmAction(action, target) {
      const messages = {
        ban:          "Ban @" + target.username + "? They will not be able to login.",
        unban:        "Unban @" + target.username + "? They will regain access.",
        deletePost:   "Delete post \"" + (target.title || 'this post') + "\"? This cannot be undone.",
        deleteShare:  "Delete this share? This cannot be undone.",
        deleteItem:   "Delete item \"" + target.title + "\"? This cannot be undone.",
        deleteReport: "Delete this report? This cannot be undone.",
        deleteContact: "Delete this message? This cannot be undone.",
      };
      this.confirmDialog = { visible: true, message: messages[action], action: action, target: target };
    },

    async executeAction() {
      this.confirmDialog.visible = false;
      const { action, target } = this.confirmDialog;
      const token = localStorage.getItem("token");
      const h = { Authorization: "Bearer " + token };

      try {
        const urlMap = {
          ban:          [API + "/admin/users/"  + target._id + "/ban",   "PATCH"],
          unban:        [API + "/admin/users/"  + target._id + "/unban", "PATCH"],
          deletePost:   [API + "/admin/posts/"  + target._id,            "DELETE"],
          deleteShare:  [API + "/admin/shares/" + target._id,            "DELETE"],
          deleteItem:   [API + "/admin/items/"  + target._id,            "DELETE"],
          deleteReport: [API + "/reports/"      + target._id,            "DELETE"],
          deleteContact: [API + "/contact/" + target._id, "DELETE"],
        };
        const pair = urlMap[action];
        const res = await fetch(pair[0], { method: pair[1], headers: h });

        if (res.ok) {
          const titles = {
            ban: "User Banned", unban: "User Unbanned",
            deletePost: "Post Deleted", deleteShare: "Share Deleted",
            deleteItem: "Item Deleted", deleteReport: "Report Deleted"
          };
          this.notifModal = { visible: true, type: action === "ban" ? "warning" : "success", title: titles[action], message: "Action completed successfully.", buttonText: "OK" };
          this.fetchStats();
          this.loadData();
        } else {
          this.notifModal = { visible: true, type: "error", title: "Action Failed", message: "Something went wrong. Please try again.", buttonText: "Close" };
        }
      } catch (e) {
        this.notifModal = { visible: true, type: "error", title: "Network Error", message: "Could not connect to server.", buttonText: "Close" };
      }
    },

    resolveAvatar(a) { if (!a) return API + "/uploads/user.png"; return a.startsWith("http") ? a : API + "/" + a; },
    resolveImg(img)  { if (!img) return ""; return img.startsWith("http") ? img : API + "/" + img; },
    onAvErr(e) { e.target.src = API + "/uploads/user.png"; },
    fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); },

    openReply(contact) {
  // Mark as read nếu chưa đọc
  if (contact.status === 'unread') {
    fetch(API + "/contact/" + contact._id + "/read", {
      method: "PATCH",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    contact.status = 'read';
    if (this.stats.unreadContacts > 0) this.stats.unreadContacts--;
  }
  this.contactReplyModal = { visible: true, contact, reply: contact.adminReply || "" };
},

  async sendReply() {
    const { contact, reply } = this.contactReplyModal;
    if (!reply.trim()) return;
    try {
      const res = await fetch(API + "/contact/" + contact._id + "/reply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({ adminReply: reply.trim() })
      });
      if (res.ok) {
        contact.adminReply = reply.trim();
        contact.status = "replied";
        this.contactReplyModal.visible = false;
        this.notifModal = { visible: true, type: "success", title: "Reply Sent", message: "Your reply has been saved.", buttonText: "OK" };
      }
    } catch (e) { console.error(e); }
  },

  }
};
</script>

<style scoped>
.admin-page { min-height: 100vh; background: var(--bg-card); color: var(--text-main); font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px 40px 60px; }
.admin-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0 0 4px; }
.page-sub   { font-size: 13px; color: var(--text-sub); margin: 0; }
.back-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: none; color: var(--text-main); font-size: 13px; cursor: pointer; transition: 0.15s; }
.back-btn:hover { border-color: #FF642F; color: #FF642F; }
.stat-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.stat-card { display: flex; align-items: center; gap: 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px 20px; flex: 1; min-width: 130px; transition: border-color 0.15s; }
.stat-card:hover { border-color: #FF642F; }
.stat-card.danger { border-color: #fca5a533; }
.stat-card.danger:hover { border-color: #ef4444; }
.stat-card.warn { border-color: #f59e0b33; }
.stat-card.warn:hover { border-color: #f59e0b; }
.stat-icon { font-size: 22px; }
.stat-val  { font-size: 22px; font-weight: 800; color: var(--text-main); line-height: 1; }
.stat-card.danger .stat-val { color: #ef4444; }
.stat-card.warn .stat-val   { color: #f59e0b; }
.stat-lbl  { font-size: 11px; color: var(--text-sub); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
.main-tabs { display: flex; border-bottom: 1px solid var(--border-color); }
.main-tab { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; background: none; color: var(--text-sub); font-size: 14px; font-weight: 600; cursor: pointer; transition: color 0.15s; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.main-tab:hover { color: var(--text-main); }
.main-tab.active { color: #FF642F; border-bottom-color: #FF642F; }
.tab-chip { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 20px; background: var(--bg-input); color: var(--text-sub); }
.tab-chip.danger { background: #ef44441a; color: #ef4444; }
.tab-chip.warn   { background: #f59e0b1a; color: #f59e0b; }
.content-area { background: var(--bg-card); border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 12px 12px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border-color); gap: 12px; flex-wrap: wrap; background: var(--bg-card); }
.toolbar-spacer { flex: 1; }
.sub-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.sub-tabs button { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: none; color: var(--text-sub); font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.15s; }
.sub-tabs button:hover { background: var(--hover-primary); color: #FF642F; }
.sub-tabs button.active { background: #FF642F1a; border-color: #FF642F55; color: #FF642F; }
.chip { font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 20px; background: var(--bg-input); color: var(--text-sub); }
.warn-chip { background: #f59e0b1a !important; color: #f59e0b !important; }
.danger-chip { background: #ef44441a !important; color: #ef4444 !important; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; transition: border-color 0.15s; }
.search-wrap:focus-within { border-color: #FF642F; }
.search-ico { width: 15px; height: 15px; color: var(--text-sub); flex-shrink: 0; }
.search-input { border: none; background: none; outline: none; font-size: 13px; color: var(--text-main); min-width: 180px; }
.search-input::placeholder { color: var(--text-sub); }
.clear-ico { background: none; border: none; color: var(--text-sub); cursor: pointer; font-size: 13px; }
.clear-ico:hover { color: #ef4444; }
.search-btn { background: #FF642F; border: none; color: #fff; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.15s; }
.search-btn:hover { background: #e05522; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead tr { border-bottom: 1px solid var(--border-color); }
th { padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; background: var(--bg-card); color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
td { padding: 13px 16px; font-size: 13px; color: var(--text-main); background: var(--bg-card); border-bottom: 1px solid var(--border-color); vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: var(--hover-bg); }
tbody tr.row-banned td { opacity: 0.55; }
.cell-user { display: flex; align-items: center; gap: 10px; color: var(--text-main); }
.av    { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0; }
.av-sm { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0; }
.thumb { width: 36px; height: 36px; border-radius: 7px; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0; }
.thumb-ph { width: 36px; height: 36px; border-radius: 7px; background: var(--bg-input); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.fw600   { font-weight: 600; color: var(--text-main); }
.truncate { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.muted   { color: var(--text-sub); font-size: 12px; }
.small   { font-size: 11px; }
.mono    { font-family: 'SFMono-Regular', Consolas, monospace; color: var(--text-sub); font-size: 12px; }
.price   { color: #FF642F; font-weight: 700; font-size: 13px; }
.chip-num { background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 600; color: var(--text-sub); }
.cat-tag  { background: #FF642F15; color: #FF642F; border-radius: 5px; padding: 2px 8px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.link { cursor: pointer; transition: color 0.15s; }
.link:hover { color: #FF642F; text-decoration: underline; }
.status-pill { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
.status-pill.active    { background: #22c55e1a; color: #22c55e; }
.status-pill.banned    { background: #ef44441a; color: #ef4444; }
.status-pill.available { background: #22c55e1a; color: #22c55e; }
.status-pill.sold      { background: #6e76811a; color: #6e7681; }
.status-pill.hidden    { background: #f59e0b1a; color: #f59e0b; }
/* Report statuses */
.status-pill.report-pending   { background: #6e76811a; color: #6e7681; }
.status-pill.report-reviewed  { background: #3b82f61a; color: #3b82f6; }
.status-pill.report-resolved  { background: #22c55e1a; color: #22c55e; }
.status-pill.report-dismissed { background: #f59e0b1a; color: #ef4444; }
/* Report target type */
.report-target { display: flex; align-items: center; gap: 6px; }
.target-type-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
.target-type-badge.user  { background: #3b82f61a; color: #3b82f6; }
.target-type-badge.post  { background: #22c55e1a; color: #22c55e; }
.target-type-badge.share { background: #a855f71a; color: #a855f7; }
.target-type-badge.item  { background: #FF642F1a; color: #FF642F; }
.target-type-badge.other { background: var(--bg-input); color: var(--text-sub); }
.reason-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; background: var(--bg-input); color: var(--text-main); }
.desc-cell { display: block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Report actions */
.report-actions { display: flex; align-items: center; gap: 8px; }
.status-select {
  padding: 5px 10px; border-radius: 7px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border-color); background: var(--bg-input);
  color: var(--text-main); cursor: pointer; outline: none; transition: 0.15s;
}
.status-select:focus { border-color: #FF642F; }
.btn-action { padding: 5px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid; transition: all 0.15s; }
.btn-action.sm { padding: 5px 10px; }
.btn-action.red   { border-color: #ef444440; background: #ef44441a; color: #ef4444; }
.btn-action.red:hover   { background: #ef4444; color: #fff; }
.btn-action.green { border-color: #22c55e40; background: #22c55e1a; color: #22c55e; }
.btn-action.green:hover { background: #22c55e; color: #fff; }
.pagination-wrap { padding: 8px 0; border-top: 1px solid var(--border-color); }
.loading-state { display: flex; align-items: center; gap: 12px; padding: 60px 24px; justify-content: center; color: var(--text-sub); background: var(--bg-card); font-size: 14px; }
.empty-state   { text-align: center; padding: 60px 20px; background: var(--bg-card); }
.empty-icon    { font-size: 42px; display: block; margin-bottom: 10px; }
.empty-state p { color: var(--text-sub); font-size: 14px; margin: 0; }
.spinner { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border-color); border-top-color: #FF642F; animation: spin 0.7s linear infinite; }

/* Report comment modal */
.overlay-dim {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 9000; display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(3px);
}
.comment-modal {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 16px; width: 90%; max-width: 440px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275);
}
.comment-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  font-size: 15px; font-weight: 700; color: var(--text-main);
}
.close-x { background: none; border: none; cursor: pointer; color: var(--text-sub); font-size: 16px; }
.close-x:hover { color: var(--text-main); }
.comment-modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.comment-hint { margin: 0; font-size: 13px; color: var(--text-sub); }
.txt-resolved  { color: #22c55e; }
.txt-dismissed { color: #ef4444; }
.txt-reviewed  { color: #3b82f6; }
.txt-pending   { color: #f59e0b; }
.comment-label { font-size: 12px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.4px; }
.optional { font-weight: 400; text-transform: none; color: var(--text-sub); }
.comment-textarea {
  width: 100%; padding: 10px 12px; border-radius: 10px;
  border: 1.5px solid var(--border-color); background: var(--bg-input);
  color: var(--text-main); font-size: 13px; font-family: inherit;
  resize: vertical; outline: none; transition: border-color 0.15s; box-sizing: border-box;
}
.comment-textarea:focus { border-color: #FF642F; }
.comment-textarea::placeholder { color: var(--text-sub); }
.comment-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid var(--border-color);
}
.btn-cancel {
  padding: 8px 18px; border-radius: 8px; border: 1.5px solid var(--border-color);
  background: none; color: var(--text-sub); font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-cancel:hover { border-color: var(--text-sub); color: var(--text-main); }
.btn-confirm {
  padding: 8px 22px; border-radius: 8px; border: none;
  background: #FF642F; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
}
.btn-confirm:hover { background: #e05522; }

@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1024px) { .admin-page { margin-left: 0; padding: 20px 16px 60px; } }
@media (max-width: 768px) { .admin-page { padding: 16px 12px 60px; } .stat-row { gap: 8px; } .stat-card { min-width: 100px; padding: 10px 14px; } .main-tab { padding: 10px 12px; font-size: 12px; } .toolbar { flex-direction: column; align-items: stretch; } .search-wrap { width: 100%; } .search-input { min-width: unset; flex: 1; } }
</style>