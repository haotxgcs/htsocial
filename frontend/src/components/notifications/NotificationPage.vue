<template>
  <div class="notif-page">
    <!-- Header -->
    <div class="notif-header">
      <h1>Notifications</h1>
      <div class="notif-header-actions">
        <span class="unread-chip" v-if="unreadCount > 0">{{ unreadCount }} unread</span>
        <button class="btn-mark-all" @click="markAllRead" :disabled="unreadCount === 0">
          Mark all as read
        </button>
        <button class="btn-delete-all" @click="confirmDeleteAll" :disabled="notifications.length === 0">
          Clear all
        </button>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="notif-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="notif-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tabCounts[tab.key] > 0" class="tab-badge" :class="{ 'tab-badge-unread': tab.key === 'unread' }">
          {{ tabCounts[tab.key] }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="notif-loading">
      <div class="notif-skeleton" v-for="i in 5" :key="i">
        <div class="sk-av"></div>
        <div class="sk-lines">
          <div class="sk-line long"></div>
          <div class="sk-line short"></div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="notif-empty">
      <div class="empty-icon">🔔</div>
      <h3>No notifications yet</h3>
      <p>We'll let you know when something happens</p>
    </div>

    <!-- List -->
    <div v-else class="notif-list">
      <div v-if="activeTab ==='reports'" class="view-report-section">
          <button @click="showMyReports = true" class="btn-open-report" style="margin-bottom: 16px;">
            <span>View All Reports</span>
          </button>
        </div>
      <div class="notif-list-scroll">
      <!-- Date group -->
      <template v-for="(group, date) in grouped" :key="date">
        
        

        <div class="notif-date-sep">{{ date }}</div>
        <div
          v-for="n in group"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.read }"
          @click="onNotifClick(n)"
        >
          <!-- Avatar / Icon -->
          <div class="notif-av-wrap">
            <img v-if="n.avatar" :src="n.avatar" class="notif-av" @error="onAvErr" />
            <div v-else class="notif-icon-bubble">{{ n.icon }}</div>
          </div>

          <!-- Content -->
          <div class="notif-body">
            <p class="notif-text" v-html="n.text"></p>
            <span class="notif-time">{{ fmtTime(n.createdAt) }}</span>
          </div>

          <!-- Unread dot + actions -->
          <div class="notif-right">
            <span v-if="!n.read" class="unread-dot"></span>
            <button class="notif-delete" @click.stop="deleteOne(n)" title="Delete"><Trash2/></button>
            <button v-if="!n.read" class="notif-dismiss" @click.stop="dismissOne(n)" title="Mark as read"><ListCheck/></button>
          </div>
        </div>
      </template>
      </div>

      <!-- Load more -->
      <div class="load-more-wrap" v-if="hasMore">
        <button class="btn-load-more" @click="loadMore" :disabled="loadingMore">
          <span v-if="loadingMore">Loading...</span>
          <span v-else>Load more</span>
        </button>
      </div>
    </div>


  </div>
  <MyReportsModal :is-visible="showMyReports" :initial-report-id="openReportId" @close="showMyReports = false; openReportId = null" />
</template>

<script>
import MyReportsModal from '../common/MyReportsModal.vue';
import { Trash2, ListCheck } from 'lucide-vue-next';

export default {
  name: "NotificationsPage",
  components:{
    MyReportsModal,

    Trash2,
    ListCheck
  },
  data() {
    return {
      notifications: [],
      loading: true,
      loadingMore: false,
      page: 1,
      hasMore: false,
      unreadCount: 0,
      activeTab: "all",
      tabs: [
        { key: "all",      label: "All" },
        { key: "social",   label: "Social" },
        { key: "orders",   label: "Orders" },
        { key: "reports",  label: "Reports" },
        { key: "unread",   label: "Unread" }
      ],

      myReports: [],
      loadingReports: false,

      showMyReports: false,

      openReportId: null,
    };
  },

  computed: {
    social() {
      return ["like_post","like_comment","like_reply","comment","reply","share","friend_request","friend_accepted"];
    },
    orders() {
      return ["order_placed","order_status","new_order","review","order_cancelled"];
    },
    reports() {
      return ["report_received", "report_resolved"];
    },
    filtered() {
      return this.notifications.filter(n => {
        if (this.activeTab === "social")  return this.social.includes(n.type);
        if (this.activeTab === "orders")  return this.orders.includes(n.type);
        if (this.activeTab === "reports") return this.reports.includes(n.type);
        if (this.activeTab === "unread")  return !n.read;
        return true;
      });
    },
    tabCounts() {
      const all    = this.notifications.length;
      const social = this.notifications.filter(n => this.social.includes(n.type)).length;
      const orders = this.notifications.filter(n => this.orders.includes(n.type)).length;
      const reports = this.notifications.filter(n => this.reports.includes(n.type)).length;
      const unread = this.notifications.filter(n => !n.read).length;
      return { all, social, orders, reports, unread };
    },

    grouped() {
      const groups = {};
      for (const n of this.filtered) {
        const key = this.fmtDateGroup(n.createdAt);
        if (!groups[key]) groups[key] = [];
        groups[key].push(n);
      }
      return groups;
    },

    reportStatusLabel() {
      return {
        pending:   { text: "Pending",   color: "#f59e0b", bg: "#fef3c7" },
        reviewed:  { text: "Reviewing", color: "#3b82f6", bg: "#eff6ff" },
        resolved:  { text: "Resolved",  color: "#22c55e", bg: "#f0fdf4" },
        dismissed: { text: "Dismissed", color: "#6b7280", bg: "#f3f4f6" },
      };
    },

    reportReasonLabel() {
      return {
        spam: "Spam", harassment: "Harassment", hate_speech: "Hate Speech",
        misinformation: "Misinformation", inappropriate_content: "Inappropriate Content",
        fake_account: "Fake Account", scam: "Scam / Fraud",
        copyright: "Copyright", other: "Other"
      };
    },
  },

  async mounted() {
  await this.fetchNotifications();
  await this.fetchMyReports();
  window.addEventListener("notification:new", this.onNewNotif);

  // Tự động mở MyReports nếu có ?openReport=xxx trong URL
  const reportId = this.$route?.query?.openReport;
  if (reportId !== undefined) {
    this.openReportId = reportId || null;
    this.showMyReports = true;
  }
},
  beforeUnmount() {
    window.removeEventListener("notification:new", this.onNewNotif);
  },

  methods: {
    async fetchNotifications(page = 1) {
      if (page === 1) this.loading = true;
      else this.loadingMore = true;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/notifications?page=${page}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (page === 1) this.notifications = data.notifications || [];
          else this.notifications.push(...(data.notifications || []));
          this.unreadCount = data.unread || 0;
          this.hasMore = data.hasMore || false;
          this.page = page;
        }
      } catch (e) { console.error(e); }
      finally { this.loading = false; this.loadingMore = false; }
    },

    async loadMore() {
      await this.fetchNotifications(this.page + 1);
    },

    async markAllRead() {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${process.env.VUE_APP_API_URL}/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        });
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        window.dispatchEvent(new CustomEvent("notif:read-all"));
      } catch (e) { console.error(e); }
    },

    onNotifClick(n) {
      this.dismissOne(n);
      
      // Nếu là thông báo report → mở modal xem reports
      if (n.type === 'report_received' || n.type === 'report_resolved') {
        this.openReportId = n.meta?.reportId || null;
        this.showMyReports = true;
        return;
      }
      
      if (n.link) this.$router.push(n.link);
    },

    onNewNotif(e) {
      const notif = e.detail;
      if (!notif) return;
      this.notifications.unshift(notif);
      this.unreadCount++;
    },

    onAvErr(e) { e.target.style.display = "none"; },

    fmtTime(d) {
      if (!d) return "";
      const date = new Date(d);
      const diff = Date.now() - date.getTime();
      if (diff < 60000)    return "Just now";
      if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      if (diff < 604800000)return `${Math.floor(diff / 86400000)}d ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    },

    fmtDateGroup(d) {
      if (!d) return "Earlier";
      const date = new Date(d);
      const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      if (diff < 7)  return `${diff} days ago`;
      return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
    },

    // ✅ Xóa 1 notification (thật sự xóa khỏi DB)
async deleteOne(n) {
  try {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.VUE_APP_API_URL}/notifications/${n.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    this.notifications = this.notifications.filter(x => x.id !== n.id);
    this.unreadCount = this.notifications.filter(x => !x.read).length;
  } catch (e) { console.error(e); }
},

// ✅ Xác nhận trước khi xóa tất cả
confirmDeleteAll() {
  if (!confirm("Delete all notifications? This cannot be undone.")) return;
  this.deleteAll();
},

// ✅ Xóa tất cả
async deleteAll() {
  try {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.VUE_APP_API_URL}/notifications`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    this.notifications = [];
    this.unreadCount = 0;
    window.dispatchEvent(new CustomEvent("notif:read-all"));
  } catch (e) { console.error(e); }
},

// ✅ dismissOne giờ chỉ mark read (không xóa) — dùng khi click vào notification
async dismissOne(n) {
  if (n.read) return;
  n.read = true;
  this.unreadCount = Math.max(0, this.notifications.filter(x => !x.read).length);
  try {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.VUE_APP_API_URL}/notifications/${n.id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) { console.error(e); }
},

async fetchMyReports() {
  this.loadingReports = true;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.VUE_APP_API_URL}/reports/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      this.myReports = data.reports || [];
    }
  } catch (e) { console.error(e); }
  finally { this.loadingReports = false; }
},
  }
};
</script>

<style scoped>
.notif-page {
  max-width: 680px;
  margin-left: 500px;
  padding: 32px 20px 60px;
  background: var(--bg-body);
  transition: background-color 0.3s;
}

/* ── HEADER ── */
.notif-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px; padding: 20px 0;
}
.notif-header h1 {
  font-size: 26px; font-weight: 800; color: var(--text-main); margin: 0;
}
.notif-header-actions { display: flex; align-items: center; gap: 10px; }

.unread-chip {
  background: #FF642F; color: #fff;
  font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
}

.btn-mark-all {
  border: 1.5px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main);
  font-size: 13px; font-weight: 600;
  padding: 7px 14px; border-radius: 10px;
  cursor: pointer; transition: all 0.15s;
}
.btn-mark-all:hover:not(:disabled) { border-color: #FF642F; color: #FF642F; }
.btn-mark-all:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-open-report {
  border: 1.5px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main);
  font-size: 13px; font-weight: 600;
  padding: 7px 14px; border-radius: 10px;
  cursor: pointer; transition: all 0.15s; 
}
.btn-open-report:hover:not(:disabled) { border-color: #FF642F; color: #FF642F; }
.btn-open-report:disabled { opacity: 0.4; cursor: not-allowed; }

.view-report-section{
  display: flex; justify-content: flex-end;
}

.btn-delete-all {
  border: 1.5px solid #fecaca;
  background: var(--bg-card); color: #ef4444;
  font-size: 13px; font-weight: 600;
  padding: 7px 14px; border-radius: 10px;
  cursor: pointer; transition: all 0.15s;
}
.btn-delete-all:hover:not(:disabled) { background: #fef2f2; border-color: #ef4444; }
.btn-delete-all:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── TABS ── */
.notif-tabs {
  display: flex; gap: 6px; margin-bottom: 20px;
  background: var(--bg-card);
  border-radius: 12px; padding: 4px;
  border: 1px solid var(--border-color);
  transition: background-color 0.3s;
}
.notif-tab {
  flex: 1; border: none;
  background: var(--bg-card);
  color: var(--text-sub);
  padding: 8px 12px; border-radius: 9px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.notif-tab.active {
  background: #FF642F; color: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

.tab-badge {
  background: #FF642F; color: #fff;
  font-size: 11px; padding: 2px 6px;
  border-radius: 10px; font-weight: 700;
}
.notif-tab.active .tab-badge { background: rgba(255,255,255,0.25); color: #fff; }

.notif-list-scroll {
  max-height: 400px; overflow-y: auto;
  padding-right: 4px;
}

.notif-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.notif-list-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color); border-radius: 3px;
}

/* ── DATE SEPARATOR ── */
.notif-date-sep {
  font-size: 12px; font-weight: 700; color: var(--text-sub);
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 16px 0 8px;
}

/* ── NOTIFICATION ITEM ── */
.notif-item {
  display: flex; align-items: flex-start; gap: 15px;
  padding: 14px 16px; border-radius: 14px;
  cursor: pointer; transition: background 0.12s, border 0.12s;
  margin-bottom: 4px; position: relative;
  background: var(--bg-card);
  border: 2px solid transparent;
}
.notif-item:hover {
  background: var(--hover-primary);
  border: 2px solid #FF642F;
}
.notif-item.unread {
  background: var(--bg-card);
  border-left: 3px solid #FF642F;
}
.notif-item.unread:hover {
  background: var(--hover-primary);
  border: 2px solid #FF642F;
  border-left: 3px solid #FF642F;
}

.notif-av-wrap { flex-shrink: 0; }
.notif-av {
  width: 46px; height: 46px; border-radius: 50%;
  object-fit: cover; border: 2px solid var(--border-color); display: block;
}
.notif-icon-bubble {
  width: 46px; height: 46px; border-radius: 50%;
  background: var(--hover-primary); border: 2px solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}

.notif-body { flex: 1; min-width: 0; }
.notif-text { font-size: 14px; color: var(--text-main); margin: 0 0 4px; line-height: 1.45; }
.notif-text :deep(b) { font-weight: 700; }
.notif-time { font-size: 12px; color: var(--text-sub); }

.notif-right {
  display: flex; flex-direction: column;
  align-items: center; gap: 6px; flex-shrink: 0;
}
.unread-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #FF642F; flex-shrink: 0;
}
.notif-dismiss {
  background: none; border: none; cursor: pointer;
  color: var(--text-sub); font-size: 18px; line-height: 1;
  opacity: 0; transition: opacity 0.15s; padding: 0;
}
.notif-delete {
  background: none; border: none; cursor: pointer;
  color: var(--text-sub); font-size: 18px; line-height: 1;
  opacity: 0; transition: opacity 0.15s; padding: 0;
}
.notif-item:hover .notif-dismiss,
.notif-item:hover .notif-delete { opacity: 1; }
.notif-dismiss:hover { color: #FF642F; }
.notif-delete:hover { color: #ef4444; }

/* ── EMPTY STATE ── */
.notif-empty { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 52px; margin-bottom: 16px; }
.notif-empty h3 { font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0 0 8px; }
.notif-empty p  { color: var(--text-sub); font-size: 14px; margin: 0; }

/* ── LOADING SKELETON ── */
.notif-loading { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
.notif-skeleton {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 14px;
  background: var(--bg-input);
}
.sk-av {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-input) 50%, var(--border-color) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  flex-shrink: 0;
}
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.sk-line {
  height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-input) 50%, var(--border-color) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.sk-line.long  { width: 75%; }
.sk-line.short { width: 40%; }
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── LOAD MORE ── */
.load-more-wrap { text-align: center; padding: 20px 0; }
.btn-load-more {
  border: 1.5px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main);
  font-size: 14px; font-weight: 600;
  padding: 10px 28px; border-radius: 12px;
  cursor: pointer; transition: all 0.15s;
}
.btn-load-more:hover:not(:disabled) { border-color: #FF642F; color: #FF642F; }
.btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }

/* Report list section */
.report-list { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }

.report-card {
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color 0.15s;
}
.report-card:hover { border-color: #FF642F55; }

.report-card-header { display: flex; align-items: center; justify-content: space-between; }

.report-target-badge {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px; border-radius: 20px;
  background: var(--bg-input); color: var(--text-sub);
  border: 1px solid var(--border-color);
}

.report-status-pill {
  font-size: 12px; font-weight: 700;
  padding: 3px 12px; border-radius: 20px;
}

.report-reason { font-size: 14px; color: var(--text-main); }
.report-reason-label { font-weight: 700; color: var(--text-sub); font-size: 12px; margin-right: 4px; text-transform: uppercase; }

.report-desc {
  font-size: 13px; color: var(--text-sub);
  font-style: italic;
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: 8px;
  border-left: 3px solid var(--border-color);
}

.report-admin-note {
  font-size: 13px; color: #3b82f6;
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}
.admin-note-label { font-weight: 700; margin-right: 4px; }

.report-card-footer { display: flex; align-items: center; gap: 4px; }
.report-date { font-size: 12px; color: var(--text-sub); }
.report-resolved-by { font-size: 12px; color: var(--text-sub); }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) { .notif-page { margin-left: 0; } }

@media (max-width: 768px) {
  .notif-page { margin-left: 0; padding: 20px 12px 60px; }
}

@media (max-width: 480px) {
  .notif-header { flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px 0; }
  .notif-header-actions { order: 1; }
}

@media (max-width: 400px) {
  .notif-header h1 { font-size: 22px; margin-top: 10px; }
  .notif-av { width: 40px; height: 40px; }
  .notif-icon-bubble { width: 40px; height: 40px; font-size: 18px; }
}
</style>