<template>
  <transition name="modal-fade">
    <div v-if="isVisible" class="overlay" @click.self="$emit('close')">
      <div class="modal">

        <!-- HEADER -->
        <div class="modal-header">
          <div class="header-left">
            <!-- ✅ Back button khi đang xem detail -->
            <button v-if="selectedReport" class="back-btn" @click="selectedReport = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="header-icon">🚩</div>
            <div>
              <h2 class="modal-title">{{ selectedReport ? 'Report Details' : 'My Reports' }}</h2>
              <p class="modal-sub">{{ selectedReport ? 'Submitted ' + fmtDate(selectedReport.createdAt) : 'Track the status of your submitted reports' }}</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- FILTER PILLS (chỉ hiện ở list view) -->
        <div class="filter-bar" v-if="!selectedReport" @wheel.prevent="handleFilterScroll">
          <button
            v-for="f in filters"
            :key="f.key"
            class="filter-pill"
            :class="{ active: activeFilter === f.key }"
            @click="activeFilter = f.key"
          >
            {{ f.icon }} {{ f.label }}
            <span v-if="countByStatus(f.key) > 0" class="pill-count">{{ countByStatus(f.key) }}</span>
          </button>
        </div>

        <!-- ══════════════ BODY ══════════════ -->
        <div class="modal-body">

          <!-- ── LIST VIEW ── -->
          <template v-if="!selectedReport">
            <div v-if="loading" class="state-box">
              <div class="skeleton-list">
                <div v-for="i in 3" :key="i" class="skeleton-card">
                  <div class="sk-bar wide"></div>
                  <div class="sk-bar medium"></div>
                  <div class="sk-bar short"></div>
                </div>
              </div>
            </div>

            <div v-else-if="filteredReports.length === 0" class="state-box">
              <div class="empty-icon">📭</div>
              <p class="empty-title">No reports here</p>
              <p class="empty-sub">{{ activeFilter === 'all' ? "You haven't submitted any reports yet." : `No ${activeFilter} reports found.` }}</p>
            </div>

            <div v-else class="report-list">
              <div
                v-for="r in filteredReports"
                :key="r._id"
                class="report-card"
                :class="'status-' + r.status"
                @click="selectReport(r)"
              >
                <div class="card-top">
                  <div class="card-badges">
                    <span class="target-badge">{{ targetLabels[r.targetType] || r.targetType }}</span>
                    <span class="reason-badge">{{ reasonLabels[r.reason] || r.reason }}</span>
                  </div>
                  <span class="status-chip" :class="'chip-' + r.status">
                    {{ statusConfig[r.status] && statusConfig[r.status].icon }} {{ statusConfig[r.status] && statusConfig[r.status].label }}
                  </span>
                </div>

                <div v-if="r.description" class="card-desc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {{ r.description.length > 100 ? r.description.slice(0, 100) + '...' : r.description }}
                </div>

                <div class="card-footer">
                  <span class="card-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ fmtDate(r.createdAt) }}
                  </span>
                  <span v-if="r.adminNote" class="has-response">💬 Has response</span>
                  <span v-if="r.resolvedAt" class="card-resolved">Resolved {{ fmtDate(r.resolvedAt) }}</span>
                  <span class="view-detail">View details →</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ── DETAIL VIEW ── -->
          <template v-else>
            <div class="detail-view">

              <!-- Status banner -->
              <div class="detail-status-banner" :class="'banner-' + selectedReport.status">
                <span class="banner-icon">{{ statusConfig[selectedReport.status] && statusConfig[selectedReport.status].icon }}</span>
                <div>
                  <div class="banner-label">{{ statusConfig[selectedReport.status] && statusConfig[selectedReport.status].label }}</div>
                  <div class="banner-sub" v-if="selectedReport.resolvedAt">
                    Processed on {{ fmtDate(selectedReport.resolvedAt) }}
                  </div>
                  <div class="banner-sub" v-else>
                    Submitted {{ fmtDate(selectedReport.createdAt) }} · Under review
                  </div>
                </div>
              </div>

              <!-- Report info -->
              <div class="detail-section">
                <div class="section-title">Report Information</div>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-lbl">Type</span>
                    <span class="target-badge">{{ targetLabels[selectedReport.targetType] || selectedReport.targetType }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-lbl">Reason</span>
                    <span class="reason-badge">{{ reasonLabels[selectedReport.reason] || selectedReport.reason }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-lbl">Submitted</span>
                    <span class="info-val">{{ fmtDateFull(selectedReport.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="detail-section" v-if="selectedReport.description">
                <div class="section-title">Your Description</div>
                <div class="desc-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" class="desc-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <p>{{ selectedReport.description }}</p>
                </div>
              </div>

              <!-- Reported target -->
              <div class="detail-section" v-if="selectedReport.targetType !== 'other'">
                <div class="section-title">Reported {{ targetLabels[selectedReport.targetType] }}</div>
                <div v-if="loadingTarget" class="target-loading">
                  <div class="spinner-sm"></div> Loading...
                </div>
                <div v-else-if="targetData" class="target-preview" @click="openTarget">
                  <!-- User target -->
                  <template v-if="selectedReport.targetType === 'user'">
                    <img :src="resolveAvatar(targetData.avatar)" class="target-av" @error="onAvErr"/>
                    <div class="target-info">
                      <div class="target-name">{{ targetData.firstname }} {{ targetData.lastname }}</div>
                      <div class="target-meta">@{{ targetData.username }}</div>
                    </div>
                    <span class="target-link">View Profile →</span>
                  </template>
                  <!-- Post / Share target -->
                  <template v-else-if="selectedReport.targetType === 'post' || selectedReport.targetType === 'share'">
                    <div class="target-thumb" v-if="targetData.media">
                      <img :src="targetData.media" @error="onAvErr"/>
                    </div>
                    <div class="target-thumb placeholder" v-else>📝</div>
                    <div class="target-info">
                      <div class="target-name">{{ targetData.title || '(no title)' }}</div>
                      <div class="target-meta">by {{ targetData.author && targetData.author.firstname }} {{ targetData.author && targetData.author.lastname }}</div>
                    </div>
                    <span class="target-link">View Post →</span>
                  </template>
                  <!-- Item target -->
                  <template v-else-if="selectedReport.targetType === 'item'">
                    <div class="target-thumb" v-if="targetData.images && targetData.images.length">
                      <img :src="resolveImg(targetData.images[0])" @error="onAvErr"/>
                    </div>
                    <div class="target-thumb placeholder" v-else>📦</div>
                    <div class="target-info">
                      <div class="target-name">{{ targetData.title }}</div>
                      <div class="target-meta">${{ targetData.price }} · {{ targetData.type }}</div>
                    </div>
                    <span class="target-link">View Item →</span>
                  </template>
                </div>
                <div v-else class="target-deleted">
                  <span>⚠️</span>
                  <span>This content may have been removed or is no longer available.</span>
                </div>
              </div>

              <!-- Admin response -->
              <div class="detail-section" v-if="selectedReport.adminNote">
                <div class="section-title">Admin Response</div>
                <div class="admin-response-box">
                  <div class="admin-response-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Admin
                    <span v-if="selectedReport.resolvedBy" class="admin-name">
                      · {{ selectedReport.resolvedBy.firstname }} {{ selectedReport.resolvedBy.lastname }}
                    </span>
                    <span v-if="selectedReport.resolvedAt" class="admin-date">{{ fmtDate(selectedReport.resolvedAt) }}</span>
                  </div>
                  <p class="admin-response-text">{{ selectedReport.adminNote }}</p>
                </div>
              </div>

              <!-- No admin response yet -->
              <div class="detail-section" v-else>
                <div class="section-title">Admin Response</div>
                <div class="no-response">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>No response yet. Our team is reviewing your report.</span>
                </div>
              </div>

            </div>
          </template>

        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
          <span class="footer-count" v-if="!loading && !selectedReport">
            {{ filteredReports.length }} report{{ filteredReports.length !== 1 ? 's' : '' }}
          </span>
          <span v-else-if="selectedReport"></span>
          <button class="btn-close" @click="$emit('close')">Close</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script>
const API = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "MyReportsModal",
  props: { 
    isVisible: { type: Boolean, default: false } ,

    initialReportId: { type: String, default: null },
  
  },
  emits: ["close"],

  data() {
    return {
      reports: [],
      loading: false,
      activeFilter: "all",
      selectedReport: null,
      targetData: null,
      loadingTarget: false,

      filters: [
        { key: "all",       icon: "📋", label: "All" },
        { key: "pending",   icon: "⏳", label: "Pending" },
        { key: "reviewed",  icon: "🔍", label: "Reviewing" },
        { key: "resolved",  icon: "✅", label: "Resolved" },
        { key: "dismissed", icon: "❌", label: "Dismissed" },
      ],

      statusConfig: {
        pending:   { label: "Pending",   icon: "⏳" },
        reviewed:  { label: "Reviewing", icon: "🔍" },
        resolved:  { label: "Resolved",  icon: "✅" },
        dismissed: { label: "Dismissed", icon: "❌" },
      },

      targetLabels: {
        user:  "👤 User",
        post:  "📝 Post",
        share: "🔁 Share",
        item:  "🛍️ Item",
        other: "💬 Other",
      },

      reasonLabels: {
        spam:                  "Spam",
        harassment:            "Harassment",
        hate_speech:           "Hate Speech",
        misinformation:        "Misinformation",
        inappropriate_content: "Inappropriate Content",
        fake_account:          "Fake Account",
        scam:                  "Scam / Fraud",
        copyright:             "Copyright",
        other:                 "Other",
      },
    };
  },

  computed: {
    filteredReports() {
      if (this.activeFilter === "all") return this.reports;
      return this.reports.filter(r => r.status === this.activeFilter);
    },
  },

watch: {
  isVisible(val) {
    if (val) {
      this.selectedReport = null;
      this.activeFilter = "all";
      this.fetchReports();
    }
  },

  // Khi reports load xong → check initialReportId
  reports(val) {
    if (this.isVisible && this.initialReportId && !this.selectedReport && val.length > 0) {
      const target = val.find(r => String(r._id) === String(this.initialReportId));
      if (target) this.selectReport(target);
    }
  },

  // Khi prop initialReportId thay đổi sau khi reports đã load
  initialReportId(val) {
    if (val && this.isVisible && this.reports.length > 0 && !this.selectedReport) {
      const target = this.reports.find(r => String(r._id) === String(val));
      if (target) this.selectReport(target);
    }
  },
},

  methods: {
    async fetchReports() {
      this.loading = true;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API + "/reports/my", { headers: { Authorization: "Bearer " + token } });
        if (res.ok) {
          const data = await res.json();
          this.reports = data.reports || [];

          // Nếu có initialReportId → tự động mở detail sau khi load xong
          if (this.initialReportId && this.reports.length > 0) {
            const target = this.reports.find(r => String(r._id) === String(this.initialReportId));
            if (target) this.selectReport(target);
          }
        }
      } catch (e) { console.error(e); }
      finally { this.loading = false; }
    },

    async selectReport(r) {
      this.selectedReport = r;
      this.targetData = null;

      // Fetch dữ liệu của đối tượng bị report
      if (!r.targetId || r.targetType === "other") return;

      this.loadingTarget = true;
      try {
        const token = localStorage.getItem("token");
        const h = { Authorization: "Bearer " + token };
        const endpoints = {
          user:  API + "/users/"          + r.targetId,
          post:  API + "/posts/"          + r.targetId,
          share: API + "/posts/"          + r.targetId,  // share dùng postId
          item:  API + "/marketplace/"    + r.targetId,
        };
        const url = endpoints[r.targetType];
        if (!url) return;
        const res = await fetch(url, { headers: h });
        if (res.ok) { this.targetData = await res.json(); }
        else { this.targetData = null; }
      } catch (e) { this.targetData = null; }
      finally { this.loadingTarget = false; }
    },

    openTarget() {
      if (!this.selectedReport || !this.selectedReport.targetId) return;
      const paths = {
        user:  "/profile/"     + this.selectedReport.targetId,
        post:  "/home?postId=" + this.selectedReport.targetId,
        share: "/home?postId=" + this.selectedReport.targetId,
        item:  "/marketplace/" + this.selectedReport.targetId,
      };
      const path = paths[this.selectedReport.targetType];
      if (path) window.open(path, "_blank");
    },

    countByStatus(key) {
      if (key === "all") return this.reports.length;
      return this.reports.filter(r => r.status === key).length;
    },

    resolveAvatar(a) { if (!a) return API + "/uploads/user.png"; return a.startsWith("http") ? a : API + "/" + a; },
    resolveImg(img)  { if (!img) return ""; return img.startsWith("http") ? img : API + "/" + img; },
    onAvErr(e) { e.target.src = API + "/uploads/user.png"; },

    fmtDate(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    fmtDateFull(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    },

    handleFilterScroll(e) {
      const container = e.currentTarget;
      container.scrollLeft += e.deltaY;
    },
  },

  
};
</script>

<style scoped>
/* ── OVERLAY ── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); z-index: 6000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px; backdrop-filter: blur(6px);
}

/* ── MODAL ── */
.modal {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 20px; width: 100%; max-width: 560px;
  max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  animation: popIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* ── HEADER ── */
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-icon { font-size: 28px; line-height: 1; }
.modal-title { font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0 0 2px; }
.modal-sub   { font-size: 12px; color: var(--text-sub); margin: 0; }
.back-btn {
  background: none; border: none; cursor: pointer; color: var(--text-sub);
  padding: 6px; border-radius: 8px; transition: 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.back-btn:hover { background: var(--hover-bg); color: var(--text-main); }
.close-btn {
  background: none; border: none; cursor: pointer; color: var(--text-sub);
  padding: 6px; border-radius: 8px; transition: 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: var(--hover-bg); color: var(--text-main); }

/* ── FILTER BAR ── */
.filter-bar {
  display: flex; gap: 6px; padding: 14px 24px;
  border-bottom: 1px solid var(--border-color); overflow-x: auto;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar { display: none; }
.filter-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border-color);
  background: none; color: var(--text-sub); font-size: 12px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.15s; flex-shrink: 0;
}
.filter-pill:hover { border-color: #FF642F55; color: #FF642F; }
.filter-pill.active { background: #FF642F; border-color: #FF642F; color: #fff; }
.pill-count { background: rgba(255,255,255,0.25); color: inherit; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
.filter-pill:not(.active) .pill-count { background: var(--bg-input); color: var(--text-sub); }

/* ── BODY ── */
.modal-body { flex: 1; overflow-y: auto; padding: 16px 24px; scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; }
.modal-body::-webkit-scrollbar { width: 5px; }
.modal-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

/* ── STATE ── */
.state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; gap: 10px; }
.empty-icon { font-size: 48px; }
.empty-title { font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0; }
.empty-sub   { font-size: 13px; color: var(--text-sub); margin: 0; text-align: center; }

/* ── SKELETON ── */
.skeleton-list { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.skeleton-card { padding: 16px; border-radius: 14px; background: var(--bg-input); display: flex; flex-direction: column; gap: 8px; }
.sk-bar { height: 12px; border-radius: 6px; background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-card) 50%, var(--border-color) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.sk-bar.wide  { width: 70%; }
.sk-bar.medium { width: 50%; }
.sk-bar.short { width: 35%; }

/* ── LIST VIEW ── */
.report-list { display: flex; flex-direction: column; gap: 10px; }

.report-card {
  background: var(--bg-card); border: 1.5px solid var(--border-color);
  border-radius: 14px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  position: relative; overflow: hidden; cursor: pointer;
}
.report-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 3px 0 0 3px;
}
.report-card.status-pending::before   { background: #f59e0b; }
.report-card.status-reviewed::before  { background: #3b82f6; }
.report-card.status-resolved::before  { background: #22c55e; }
.report-card.status-dismissed::before { background: #9ca3af; }
.report-card:hover { border-color: #FF642F55; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(255,100,47,0.1); }

.card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.card-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.target-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: var(--bg-input); color: var(--text-sub); border: 1px solid var(--border-color); text-transform: uppercase; letter-spacing: 0.4px; }
.reason-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: #FF642F12; color: #FF642F; border: 1px solid #FF642F33; }
.status-chip  { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
.chip-pending   { background: #6e76811a; color: #6e7681; }
.chip-reviewed  { background: #3b82f61a; color: #3b82f6; }
.chip-resolved  { background: #22c55e1a; color: #22c55e; }
.chip-dismissed { background: #f59e0b1a; color: #ef4444; }

.card-desc { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--text-sub); font-style: italic; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; line-height: 1.5; white-space: pre-wrap;}
.card-desc svg { flex-shrink: 0; margin-top: 2px; }

.card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 4px; border-top: 1px solid var(--border-color); flex-wrap: wrap; }
.card-date    { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-sub); }
.card-resolved { color: #16a34a; font-weight: 600; font-size: 11px; }
.has-response  { font-size: 11px; color: #2563eb; font-weight: 600; }
.view-detail   { font-size: 11px; color: #FF642F; font-weight: 600; margin-left: auto; }

/* ── DETAIL VIEW ── */
.detail-view { display: flex; flex-direction: column; gap: 16px; }

/* Status banner */
.detail-status-banner {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; border-radius: 14px; border: 1.5px solid;
}
.banner-pending   { background: #6e76811a; color: #6e7681; }
.banner-reviewed  { background: #3b82f61a; color: #3b82f6; }
.banner-resolved  { background: #22c55e1a; color: #22c55e; }
.banner-dismissed { background: #f59e0b1a; color: #ef4444; }
.banner-icon { font-size: 28px; flex-shrink: 0; }
.banner-label { font-size: 15px; font-weight: 800; color: var(--text-main); }
.banner-sub   { font-size: 12px; color: var(--text-sub); margin-top: 2px; }

/* Section */
.detail-section { display: flex; flex-direction: column; gap: 10px; }
.section-title  { font-size: 11px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.6px; }

/* Info grid */
.info-grid { display: flex; flex-direction: column; gap: 8px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; }
.info-row  { display: flex; align-items: center; gap: 10px; }
.info-lbl  { font-size: 12px; color: var(--text-sub); font-weight: 600; min-width: 80px; }
.info-val  { font-size: 13px; color: var(--text-main); }

/* Description box */
.desc-box {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--bg-input); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 14px; white-space: pre-wrap;
}
.desc-icon { flex-shrink: 0; margin-top: 2px; color: var(--text-sub); }
.desc-box p { margin: 0; font-size: 14px; color: var(--text-main); line-height: 1.6; }

/* Target preview */
.target-preview {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-input); border: 1.5px solid var(--border-color);
  border-radius: 12px; padding: 12px 16px;
  cursor: pointer; transition: all 0.15s;
}
.target-preview:hover { border-color: #FF642F55; background: var(--hover-primary); }
.target-av { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color); flex-shrink: 0; }
.target-thumb { width: 42px; height: 42px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border-color); }
.target-thumb img { width: 100%; height: 100%; object-fit: cover; }
.target-thumb.placeholder { background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-size: 20px; }
.target-info { flex: 1; min-width: 0; }
.target-name { font-size: 14px; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.target-meta { font-size: 12px; color: var(--text-sub); margin-top: 2px; }
.target-link { font-size: 12px; font-weight: 700; color: #FF642F; white-space: nowrap; flex-shrink: 0; }
.target-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-sub); padding: 12px; }
.target-deleted {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-input); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 12px 16px;
  font-size: 13px; color: var(--text-sub);
}

/* Admin response */
.admin-response-box {
  background: #eff6ff; border: 1.5px solid #bfdbfe;
  border-radius: 12px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.admin-response-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: #2563eb;
  text-transform: uppercase; letter-spacing: 0.4px;
}
.admin-name { font-weight: 400; text-transform: none; letter-spacing: 0; color: #60a5fa; }
.admin-date { margin-left: auto; font-weight: 400; text-transform: none; letter-spacing: 0; color: #93c5fd; }
.admin-response-text { margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6; }

/* No response */
.no-response {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-input); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 14px;
  font-size: 13px; color: var(--text-sub);
}
.no-response svg { flex-shrink: 0; color: var(--text-sub); }

/* Spinner */
.spinner-sm { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-color); border-top-color: #FF642F; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── FOOTER ── */
.modal-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid var(--border-color); flex-shrink: 0; }
.footer-count { font-size: 12px; color: var(--text-sub); font-weight: 600; }
.btn-back {
  padding: 8px 18px; border-radius: 10px; border: 1.5px solid var(--border-color);
  background: none; color: var(--text-sub); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: 0.15s;
}
.btn-back:hover { border-color: #FF642F; color: #FF642F; }
.btn-close {
  padding: 9px 24px; border-radius: 10px; border: 1.5px solid var(--border-color);
  background: none; color: var(--text-main); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: 0.15s;
}
.btn-close:hover { border-color: #FF642F; color: #FF642F; }

/* ── ANIMATIONS ── */
@keyframes popIn { 0% { transform: scale(0.88); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .modal { border-radius: 16px 16px 0 0; max-height: 92vh; align-self: flex-end; }
  .overlay { align-items: flex-end; padding: 0; }
}
</style>