<template>
  <div class="seller-orders">

    <h2 class="page-title">Seller Dashboard</h2>

    <!-- ========================= -->
    <!-- TABS                      -->
    <!-- ========================= -->
    <div class="tabs">
      <button :class="{ active: tab === 'orders' }" @click="tab = 'orders'">
        Orders
        <span class="tab-badge" v-if="orders.length">{{ orders.length }}</span>
      </button>
      <button :class="{ active: tab === 'refunds' }" @click="tab = 'refunds'">
        Refund Requests
        <span class="tab-badge tab-badge--red" v-if="pendingRefunds.length">{{ pendingRefunds.length }}</span>
      </button>
      <button :class="{ active: tab === 'reviews' }" @click="switchToReviews">
        Reviews
        <span class="tab-badge tab-badge--yellow" v-if="unrepliedCount > 0">{{ unrepliedCount }}</span>
      </button>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="error-msg">⚠️ {{ error }}</div>

    <!-- LOADING -->
    <LoadingOverlay v-if="loading" />

    <!-- ======================================= -->
    <!-- ORDERS TAB                              -->
    <!-- ======================================= -->
    <div v-if="!loading && tab === 'orders'">

      <!-- Status filter pills -->
      <div class="filter-bar">
        <button
          v-for="f in statusFilters" :key="f.value"
          class="filter-pill"
          :class="{ active: statusFilter === f.value }"
          @click="statusFilter = f.value"
        >
          <span v-if="f.value !== 'all'" class="pill-dot" :class="f.value"></span>
          {{ f.label }}
          <span class="pill-count">{{ f.value === 'all' ? orders.length : orders.filter(o => o.status === f.value).length }}</span>
        </button>
      </div>

      <!-- Orders search -->
      <div class="search-bar">
        <span class="search-icon"><Search/></span>
        <input
          v-model="orderSearch"
          class="search-input"
          type="text"
          placeholder="Search by order ID, buyer name or item..."
        />
        <button v-if="orderSearch" class="search-clear" @click="orderSearch = ''"><X/></button>
      </div>

      <!-- Orders table -->
      <div class="table-wrapper" v-if="filteredOrders.length > 0">
        <table class="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Buyer</th>
              <th>Payment</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Estimated Delivery</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order._id">
              <td class="order-id">#{{ order._id.slice(-6) }}</td>
              <td>{{ order.buyer?.firstname }} {{ order.buyer?.lastname }}</td>
              <td>
                <span class="order-status-badge" :class="order.payment.method">{{order.payment.method === 'cod' ? 'COD':'ONLINE' }}</span>
              </td>
              <td>
                <div class="item-scroll">
                  <div v-for="item in order.items" :key="item._id" class="item-row">
                    {{ item.itemSnapshot?.title }} <span class="item-qty">×{{ item.quantity }}</span>
                  </div>
                </div>
              </td>
              <td><strong class="total-price">{{ formatPrice(order.subtotal) }}</strong></td>
              <td><span class="status-badge" :class="order.status">{{ order.status }}</span></td>
              <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
              <td>{{ formatDate(order.estimatedDeliveryDate) || '—' }}</td>
              <td class="action-cell">
                <button class="btn-view" @click="$router.push(`/seller-orders/${order._id}`)">View</button>
                <button
                  v-if="['pending','confirmed','shipping'].includes(order.status)"
                  class="btn-update"
                  @click="openStatusModal(order)"
                >Update</button>
                <button
                  v-if="['pending','shipping'].includes(order.status)"
                  class="btn-cancel-order"
                  @click="openCancelModal(order)"
                >Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <p>
          No orders found
          <template v-if="statusFilter !== 'all'"> with status "{{ statusFilter }}"</template>
          <template v-if="orderSearch"> matching "{{ orderSearch }}"</template>.
        </p>
      </div>
    </div>

    <!-- ======================================= -->
    <!-- REFUNDS TAB                             -->
    <!-- ======================================= -->
    <div v-if="!loading && tab === 'refunds'">

      <!-- Refund filter pills -->
      <div class="filter-bar">
        <button
          v-for="f in refundFilters" :key="f.value"
          class="filter-pill"
          :class="{ active: refundFilter === f.value }"
          @click="refundFilter = f.value"
        >
          <span v-if="f.value !== 'all'" class="pill-dot" :class="'rf-' + f.value"></span>
          {{ f.label }}
          <span class="pill-count">{{ f.value === 'all' ? refunds.length : refunds.filter(r => r.refund?.status === f.value).length }}</span>
        </button>
      </div>

      <!-- Refunds search -->
      <div class="search-bar">
        <span class="search-icon"><Search/></span>
        <input
          v-model="refundSearch"
          class="search-input"
          type="text"
          placeholder="Search by order ID, buyer name or reason..."
        />
        <button v-if="refundSearch" class="search-clear" @click="refundSearch = ''"><X/></button>
      </div>

      <div class="table-wrapper" v-if="filteredRefunds.length > 0">
        <table class="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Buyer</th>
              <th>Payment</th>
              <th>Reason</th>
              <th>Evidence</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="refund in filteredRefunds" :key="refund.orderId">
              <td class="order-id">#{{ refund.orderId.slice(-6) }}</td>
              <td>{{ refund.buyer?.firstname }} {{ refund.buyer?.lastname }}</td>
              <td>
                <span class="order-status-badge" :class="refund.payment.method">{{ refund.payment?.method === 'cod' ? 'COD':'ONLINE' }}</span>
              </td>
              <td class="reason-cell">{{ refund.refund?.reason }}</td>
              <td>
                <div class="evidence-thumbs" v-if="refund.refund?.evidence?.images?.length || refund.refund?.evidence?.videos?.length">
                  <img
                    v-for="(img, i) in (refund.refund.evidence.images || []).slice(0, 3)"
                    :key="i" :src="img" class="evidence-mini"
                  />
                  <span v-if="refund.refund?.evidence?.videos?.length" class="evidence-video-tag">
                    🎥 {{ refund.refund.evidence.videos.length }}
                  </span>
                </div>
                <span v-else class="no-evidence-text">—</span>
              </td>
              <td>{{ formatDate(refund.refund?.requestedAt) }}</td>
              <td><span class="refund-status-badge" :class="refund.refund?.status">{{ refund.refund?.status }}</span></td>
              <td><button class="btn-view" @click="openRefundModal(refund)">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🎉</div>
        <p>
          <template v-if="!refundSearch">{{ refundFilter === "all" ? "No refund requests. Great job!" : `No ${refundFilter} refund requests.` }}</template>
          <template v-else>No refund requests matching "{{ refundSearch }}".</template>
        </p>
      </div>
    </div>

    <!-- ======================================= -->
    <!-- REVIEWS TAB                             -->
    <!-- ======================================= -->
    <div v-if="!loading && tab === 'reviews'">

      <div class="filter-bar">
        <!-- Reply state filter -->
        <button
          v-for="f in reviewFilters" :key="f.value"
          class="filter-pill"
          :class="{ active: reviewFilter === f.value }"
          @click="reviewFilter = f.value"
        >
          {{ f.label }}
          <span class="pill-count">
            {{ f.value === 'all' ? reviews.length : f.value === 'unreplied' ? unrepliedCount : (reviews.length - unrepliedCount) }}
          </span>
        </button>

        <!-- Star filter -->
        <div class="star-filter">
          <button
            v-for="s in [0, 5, 4, 3, 2, 1]" :key="s"
            class="star-pill"
            :class="{ active: starFilter === s }"
            @click="starFilter = s"
          >
            <template v-if="s === 0">All ★</template>
            <template v-else>{{ s }}★</template>
          </button>
        </div>
      </div>

      <div v-if="reviewsLoading" class="empty-state">
        <div class="empty-icon">⏳</div><p>Loading reviews...</p>
      </div>

      <div v-else-if="filteredReviews.length === 0" class="empty-state">
        <div class="empty-icon">⭐</div><p>No reviews found.</p>
      </div>

      <div v-else class="reviews-grid">
        <div v-for="review in pagedReviews" :key="review._id" class="review-card">

          <!-- Item bar -->
          <div class="review-item-bar">
            <img :src="review.item?.images?.[0]" class="review-item-img" />
            <div class="review-item-info">
              <div class="review-item-title">{{ review.item?.title || 'Unknown Item' }}</div>
              <div class="review-item-price">{{ formatPrice(review.item?.price) }}</div>
            </div>
            <div class="rating-badge" :class="ratingClass(review.rating)">{{ review.rating }}★</div>
          </div>

          <!-- Stars -->
          <div class="stars-display">
            <span v-for="s in 5" :key="s" class="rstar" :class="{ filled: s <= review.rating }">★</span>
            <span class="rating-label">{{ ratingLabel(review.rating) }}</span>
          </div>

          <!-- Reviewer -->
          <div class="reviewer-row">
            <img :src="getAvatar(review.user?.avatar) || '/default-avatar.png'" class="reviewer-avatar" />
            <div>
              <div class="reviewer-name">{{ review.user?.firstname }} {{ review.user?.lastname }}</div>
              <div class="review-date">{{ formatDate(review.createdAt) }} · Order #{{ typeof review.order === 'object' ? review.order._id.slice(-6) : review.order.toString().slice(-6) }}</div>
            </div>
          </div>

          <!-- Comment -->
          <div v-if="review.comment">
            <p class="review-comment" :class="{ 'text-clamped': !expandedComments[review._id] }">{{ review.comment }}</p>
            <button v-if="review.comment.length > 150" class="toggle-btn" @click="toggleExpand('comment', review._id)">
              {{ expandedComments[review._id] ? 'Show less \u25b2' : 'Show more \u25bc' }}
            </button>
          </div>
          <p class="review-comment no-comment" v-else>No written review.</p>

          <!-- Already replied -->
          <div v-if="review.sellerReply?.repliedAt" class="seller-reply-box">
            <div class="seller-reply-label">
              ↩ Your response
              <span class="reply-date">· {{ formatDate(review.sellerReply.repliedAt) }}</span>
            </div>
            <p class="seller-reply-text" :class="{ 'text-clamped': !expandedReplies[review._id] }">{{ review.sellerReply.content }}</p>
            <button v-if="review.sellerReply.content.length > 150" class="toggle-btn" @click="toggleExpand('reply', review._id)">
              {{ expandedReplies[review._id] ? 'Show less \u25b2' : 'Show more \u25bc' }}
            </button>
            <button class="btn-edit-reply" @click="openReplyModal(review)">Edit Reply</button>
          </div>

          <!-- Not replied -->
          <button v-else class="btn-reply" @click="openReplyModal(review)">↩ Reply to Review</button>

        </div>
      </div>

      <!-- PAGINATION -->
      <Pagination
        v-if="reviewTotalPages > 1"
        :currentPage="reviewPage"
        :totalPages="reviewTotalPages"
        @update:page="reviewPage = $event"
      />

    </div>

    <!-- ========================= -->
    <!-- ACTION MODAL              -->
    <!-- ========================= -->
    <ActionModal
      v-if="modal.visible"
      ref="actionModalRef"
      :type="modal.type"
      :order="modal.order"
      :refund="modal.refund"
      :review="modal.review"
      :actor="modal.type === 'cancel' ? 'seller' : 'buyer'"
      @cancel="modal.visible = false"
      @confirm="handleModalConfirm"
    />

    <NotificationModal 
      :is-visible="notification.visible" 
      :type="notification.type" 
      :title="notification.title" 
      :message="notification.message" 
      @confirm="closeNotify" 
    />

  </div>
</template>


<script>
import LoadingOverlay from "../layout/LoadingOverlay.vue";
import ActionModal from "../common/ActionModal.vue";
import Pagination from "../layout/Pagination.vue";
import NotificationModal from "../notifications/NotificationModal.vue";

import { Search, X } from 'lucide-vue-next';


export default {
  components: { 
    LoadingOverlay, 
    ActionModal, 
    Pagination,
    NotificationModal,

    Search,
    X 
  },

  data() {
    return {
      tab: "orders",
      // Orders
      orders: [],
      statusFilter: "all",
      orderSearch: "",
      loading: false,
      error: null,
      // Refunds
      refunds: [],
      refundFilter: "all",
      refundSearch: "",
      // Reviews
      reviews: [],
      reviewsLoading: false,
      reviewFilter: "all",
      starFilter: 0,
      reviewPage: 1,
      reviewsPerPage: 12,
      // Modal
      modal: { visible: false, type: "", order: null, refund: null, review: null },
      // Show more/less for review content
      expandedComments: {},
      expandedReplies: {},

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },

    };
  },

  computed: {
    /* Orders */
    statusFilters() {
      return [
        { label: "All",       value: "all"       },
        { label: "Pending",   value: "pending"   },
        { label: "Confirmed", value: "confirmed" },
        { label: "Shipping",  value: "shipping"  },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded",  value: "refunded"  }
      ];
    },
    filteredOrders() {
      let list = this.orders;
      if (this.statusFilter !== "all") list = list.filter(o => o.status === this.statusFilter);
      if (this.orderSearch.trim()) {
        const q = this.orderSearch.trim().toLowerCase();
        list = list.filter(o =>
          o._id.slice(-6).toLowerCase().includes(q) ||
          (o.buyer?.firstname + " " + o.buyer?.lastname).toLowerCase().includes(q) ||
          o.items?.some(i => i.itemSnapshot?.title?.toLowerCase().includes(q))
        );
      }
      return list;
    },
    /* Refunds */
    pendingRefunds() {
      return this.refunds.filter(r => r.refund?.status === "requested");
    },
    refundFilters() {
      return [
        { label: "All",       value: "all"       },
        { label: "Requested", value: "requested" },
        { label: "Approved",  value: "approved"  },
        { label: "Refunded",  value: "refunded"  },
        { label: "Rejected",  value: "rejected"  }
      ];
    },
    filteredRefunds() {
      let list = this.refunds;
      if (this.refundFilter !== "all") list = list.filter(r => r.refund?.status === this.refundFilter);
      if (this.refundSearch.trim()) {
        const q = this.refundSearch.trim().toLowerCase();
        list = list.filter(r =>
          r.orderId.slice(-6).toLowerCase().includes(q) ||
          (r.buyer?.firstname + " " + r.buyer?.lastname).toLowerCase().includes(q) ||
          r.refund?.reason?.toLowerCase().includes(q)
        );
      }
      return list;
    },
    /* Reviews */
    reviewFilters() {
      return [
        { label: "All",       value: "all"       },
        { label: "Unreplied", value: "unreplied" },
        { label: "Replied",   value: "replied"   }
      ];
    },
    unrepliedCount() {
      return this.reviews.filter(r => !r.sellerReply?.repliedAt).length;
    },
    filteredReviews() {
      let list = this.reviews;
      if (this.reviewFilter === "unreplied") list = list.filter(r => !r.sellerReply?.repliedAt);
      if (this.reviewFilter === "replied")   list = list.filter(r =>  r.sellerReply?.repliedAt);
      if (this.starFilter > 0) list = list.filter(r => r.rating === this.starFilter);
      return list;
    },
    reviewTotalPages() {
      return Math.ceil(this.filteredReviews.length / this.reviewsPerPage) || 1;
    },
    pagedReviews() {
      const start = (this.reviewPage - 1) * this.reviewsPerPage;
      return this.filteredReviews.slice(start, start + this.reviewsPerPage);
    }
  },

  mounted() {
    this.fetchOrders();
    this.fetchRefunds();

    const queryTab = this.$route.query.tab;
      if (queryTab === 'refunds' || queryTab === 'refund') {
        this.tab = 'refunds'; // Khớp với giá trị button tab trong template của bạn
      } else if (queryTab === 'reviews') {
        this.tab = 'reviews';
        this.fetchReviews();
      } else {
        this.tab = 'orders';
      }
  },

  watch: {
    // Reset ve trang 1 khi doi filter
    reviewFilter() { this.reviewPage = 1; },
    starFilter()   { this.reviewPage = 1; }
  },

  methods: {

    async fetchOrders() {
      this.loading = true; this.error = null;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/orders/seller`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) { this.error = data.msg || "Failed to load orders"; return; }
        this.orders = data.orders || [];
      } catch { this.error = "Network error. Could not load orders."; }
      finally { this.loading = false; }
    },

    async fetchRefunds() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/refund/seller-refunds`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        if (res.ok) {
          this.refunds = data.refunds || [];
          
          // THÊM LOGIC NÀY: Sau khi load xong dữ liệu, kiểm tra orderId trên URL
          this.checkAutoOpenRefund();
        }
      } catch (err) { 
        console.error("Fetch refunds error:", err); 
      }
    },

    checkAutoOpenRefund() {
    const targetOrderId = this.$route.query.orderId;
    if (targetOrderId && this.tab === 'refunds') {
      // Tìm đơn hàng refund khớp với ID từ URL
      const targetRefund = this.refunds.find(r => r.orderId === targetOrderId);
      
      if (targetRefund) {
        // Mở modal giống như khi nhấn nút "View" thủ công[cite: 6, 7]
        this.openRefundModal(targetRefund);
        
        // (Tùy chọn) Xóa orderId trên URL sau khi đã mở để tránh popup hiện lại khi reload
        this.$router.replace({ 
          path: this.$route.path,
          query: { } 
        });
      }
    }
  },



    async fetchReviews() {
      this.reviewsLoading = true;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reviews/seller`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        this.reviews = data.reviews || [];
      } catch (err) { console.error("Fetch reviews error:", err); }
      finally { this.reviewsLoading = false; }
    },

    switchToReviews() {
      this.tab = "reviews";
      if (this.reviews.length === 0) this.fetchReviews();
    },

    openStatusModal(order) { this.modal = { visible: true, type: "status", order, refund: null, review: null }; },
    openRefundModal(refund) { this.modal = { visible: true, type: "refund", order: null, refund, review: null }; },
    openReplyModal(review) { this.modal = { visible: true, type: "seller-review", order: null, refund: null, review }; },
    openCancelModal(order) { this.modal = { visible: true, type: "cancel", order, refund: null, review: null }; },

    async handleModalConfirm(payload) {
      if (this.modal.type === "status") await this.updateStatus(payload);
      else if (this.modal.type === "cancel") await this.cancelOrder(payload);
      else if (this.modal.type === "refund") {
        if (payload === "approve") await this.approveRefund();
        else if (payload?.action === "reject" || payload === "reject") await this.rejectRefund(payload?.rejectReason || "");
      } else if (this.modal.type === "seller-review") {
        if (payload === "__delete_reply__") await this.deleteReply(this.modal.review._id);
        else await this.submitReply(this.modal.review._id, payload);
      }
    },

    async updateStatus(payload) {
      try {
        const token = localStorage.getItem("token");
        const body = typeof payload === "object" ? payload : { status: payload };
        const res = await fetch(`${process.env.VUE_APP_API_URL}/orders/${this.modal.order._id}/seller-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) { this.showNotify("error", "Error", data.msg || "Failed to update status"); return; } 
        this.modal.visible = false;
        await this.fetchOrders();
      } catch { this.showNotify("error", "Error", "Network error. Please try again."); } 
    },

    async cancelOrder(reason) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/orders/${this.modal.order._id}/seller-cancel`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) { this.showNotify("error", "Error", data.msg || "Failed to cancel order"); return; } 
        this.modal.visible = false;
        await this.fetchOrders();
      } catch { this.showNotify("error", "Error", "Network error. Please try again."); } 
    },

    async approveRefund() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/refund/approve/${this.modal.refund.orderId}`, {
          method: "PATCH", headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) { this.showNotify("error", "Error", data.msg || "Failed to approve refund"); return; } 
        this.modal.visible = false;
        await this.fetchRefunds();
      } catch { this.showNotify("error", "Error", "Network error. Please try again."); } 
    },

    async rejectRefund(rejectReason = "") {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/refund/reject/${this.modal.refund.orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rejectReason })
        });
        const data = await res.json();
        if (!res.ok) { this.showNotify("error", "Error", data.msg || "Failed to reject refund"); return; } 
        this.modal.visible = false;
        await this.fetchRefunds();
      } catch { this.showNotify("error", "Error", "Network error. Please try again."); } 
    },

    async submitReply(reviewId, content) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reviews/${reviewId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content })
        });
        const data = await res.json();
        if (!res.ok) { this.showNotify("error", "Error", data.msg || "Failed to post reply"); return; } 
        const r = this.reviews.find(rv => rv._id === reviewId);
        if (r) r.sellerReply = data.sellerReply;
        this.modal.visible = false;
      } catch { alert("Network error."); }
    },

    async deleteReply(reviewId) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reviews/${reviewId}/reply`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) { alert(); return; } this.showNotify("error", "Error", data.msg || "Failed to delete reply");
        const r = this.reviews.find(rv => rv._id === reviewId);
        if (r) r.sellerReply = null;
        this.modal.visible = false;
      } catch { alert("Network error."); }
    },

    toggleExpand(type, reviewId) {
      if (type === 'comment') {
        this.expandedComments = { ...this.expandedComments, [reviewId]: !this.expandedComments[reviewId] };
      } else {
        this.expandedReplies = { ...this.expandedReplies, [reviewId]: !this.expandedReplies[reviewId] };
      }
    },

    formatDate(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    },
    formatPrice(price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);
    },
    ratingLabel(r) { return { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" }[r] || ""; },
    ratingClass(r) { return r >= 4 ? "rating--green" : r === 3 ? "rating--yellow" : "rating--red"; },
    getAvatar(avatar) {
      if (!avatar) return '/default-avatar.png'
      if (avatar.startsWith('http')) return avatar  // URL đầy đủ → giữ nguyên
      return `${process.env.VUE_APP_API_URL}/${avatar.replace(/^\/uploads\//, '')}`
    },

    showNotify(type, title, message) {
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.visible = true;
    },

    closeNotify() {
      this.notification.visible = false;
    },
  }
};
</script>


<style scoped>

.seller-orders {
  margin-left: 320px;
  padding: 80px 40px 60px;
  max-width: 1200px;
  background-color: var(--bg-body);
  color: var(--text-main);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 24px;
}

/* ========================= */
/* TABS                      */
/* ========================= */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--border-color);
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: none;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: color 0.15s;
}
.tabs button:hover { color: var(--primary); }
.tabs button.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 700; }

.tab-badge {
  background: var(--bg-input);
  color: var(--text-sub);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.tab-badge--red    { background: #fde8e8; color: #ef4444; }
.tab-badge--yellow { background: #fffae8; color: #d97706; }

/* ========================= */
/* ERROR                     */
/* ========================= */
.error-msg {
  background: #fdecea; color: #c0392b;
  padding: 12px 16px; border-radius: 8px;
  margin-bottom: 16px; font-size: 14px;
}

/* ========================= */
/* FILTER BAR                */
/* ========================= */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 8px 14px;
  margin-bottom: 14px;
  transition: border-color 0.2s;
}
.search-bar:focus-within { border-color: var(--primary);  }
.search-icon { font-size: 15px; color: var(--text-sub); flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--text-main);
}
.search-input::placeholder { color: var(--text-sub); opacity: 0.6; }



.search-clear {
  background: none;
  border: none;
  color: var(--text-sub);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}
.search-clear:hover { color: var(--primary); }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-card); 
  color: var(--text-sub);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-pill:hover { border-color: var(--primary); color: var(--primary); }
.filter-pill.active { background: var(--primary); color: white; border-color: #FF642F; }

.pill-dot {
  width: 7px; height: 7px; border-radius: 50%;
}
.pill-dot.pending   { background: #555; }
.pill-dot.confirmed { background: #f59e0b; }
.pill-dot.shipping  { background: #3b82f6; }
.pill-dot.completed { background: #10b981; }
.pill-dot.cancelled { background: #ef4444; }
.pill-dot.refunded  { background: #7950da; }
.pill-dot.rf-requested { background: #f59e0b; }
.pill-dot.rf-approved  { background: #3b82f6; }
.pill-dot.rf-refunded  { background: #10b981; }
.pill-dot.rf-rejected  { background: #ef4444; }
.filter-pill.active .pill-dot { background: rgba(255,255,255,0.8); }

.pill-count {
  background: var(--bg-input);
  border-radius: 10px; padding: 1px 7px;
  font-size: 11px; font-weight: 700;
}
.filter-pill.active .pill-count { background: rgba(255,255,255,0.25); }

/* Star filter */
.star-filter { display: flex; gap: 6px; margin-left: auto; }
.star-pill {
  padding: 5px 12px; border-radius: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-card); 
  color: var(--text-sub);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.15s;
}
.star-pill:hover { border-color: #f5a623; color: #f5a623; }
.star-pill.active { background: #f5a623; color: white; border-color: #f5a623; }

/* ========================= */
/* TABLE                     */
/* ========================= */
.table-wrapper {
  max-height: 520px; overflow-y: auto;
  background: var(--bg-card); border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
}
.table-wrapper::-webkit-scrollbar { width: 5px; }
.table-wrapper::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

.table { width: 100%; border-collapse: collapse; background: var(--bg-card); }

.table thead { position: sticky; top: 0; background: var(--bg-input); z-index: 10; }

.table th {
  padding: 12px 14px;
  border-bottom: 2px solid var(--border-color);
  text-align: left;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-sub);
}

.table td {
  padding: 13px 14px; border-bottom: 1px solid var(--border-color);
  font-size: 14px; color: var(--text-main); vertical-align: middle;
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: var(--hover-bg); }

.order-id { font-family: monospace; font-weight: 600; color: var(--text-sub); }

.order-status-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}

.order-status-badge.cod    { background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7; }
.order-status-badge.online { background:#e3f2fd;color:#1565c0;border:1px solid #90caf9; }

.total-price { font-size: 15px; font-weight: 700; color: var(--primary); }
.date-cell { font-size: 12px; color: var(--text-sub); white-space: nowrap; }
.reason-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #666; font-size: 13px; }

.item-scroll { max-height: 25px; overflow-y: auto; }
.item-scroll::-webkit-scrollbar { width: 3px; }
.item-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.item-row { font-size: 12px; color: var(--text-main); margin-bottom: 2px; }
.item-qty { color: var(--text-sub); }

/* Status badges */
.status-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize;
}
.status-badge.pending   { background: #e2e3e5; color: #555;  }
.status-badge.confirmed { background: #fff3cd; color: #856404; }
.status-badge.shipping  { background: #cce5ff; color: #004085; }
.status-badge.completed { background: #d4edda; color: #155724; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.status-badge.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* Refund status */
.refund-status-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize;
}
.refund-status-badge.requested { background: #fff3cd; color: #856404; }
.refund-status-badge.approved  { background: #d4edda; color: #155724; }
.refund-status-badge.rejected  { background: #f8d7da; color: #721c24; }
.refund-status-badge.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* Evidence in refund table */
.evidence-thumbs { display: flex; align-items: center; gap: 4px; }
.evidence-mini { width: 32px; height: 32px; object-fit: cover; border-radius: 5px; border: 1px solid #eee; }
.evidence-video-tag { font-size: 11px; color: #888; }
.no-evidence-text { color: #ddd; }

/* Action buttons */
.action-cell { display: flex; gap: 6px; align-items: center; }

.btn-view {
  padding: 5px 12px; background: var(--bg-card); color: #FF642F;
  border: 1.5px solid #FF642F; border-radius: 7px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-view:hover { background: #FF642F; color:white;}

.btn-update {
  padding: 5px 12px; background: var(--primary); color: white;
  border: 1.5px solid var(--primary); border-radius: 7px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-update:hover { background: #e05522; }

.btn-cancel-order {
  padding: 5px 12px; background: var(--bg-card); color: #ef4444;
  border: 1.5px solid #ef4444; border-radius: 7px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-cancel-order:hover { background: #ef4444; color: white; }

button:disabled { opacity: 0.5; cursor: not-allowed; }

/* ========================= */
/* EMPTY STATE               */
/* ========================= */
.empty-state { text-align: center; padding: 60px 20px; color: #ccc; }
.empty-icon { font-size: 44px; margin-bottom: 10px; }
.empty-state p { font-size: 15px; }

/* ========================= */
/* REVIEWS GRID              */
/* ========================= */
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.review-card {
  background: var(--bg-card); 
  border: 1px solid var(--border-color);
  border-radius: 16px; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}
.review-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.09); transform: translateY(-2px); }

.review-item-bar {
  display: flex; align-items: center; gap: 10px;
  padding-bottom: 12px; border-bottom: 1px solid var(--border-color);
}
.review-item-img { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee; }
.review-item-info { flex: 1; min-width: 0; }
.review-item-title { font-size: 13px; font-weight: 600; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.review-item-price { font-size: 12px; color:var(--primary); margin-top: 2px; }

.rating-badge { flex-shrink: 0; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 700; }
.rating--green  { background: #dcfce7; color: #15803d; }
.rating--yellow { background: #fef9c3; color: #92400e; }
.rating--red    { background: #fee2e2; color: #b91c1c; }

.stars-display { display: flex; align-items: center; gap: 3px; }
.rstar { font-size: 16px; color: #e0e0e0; }
.rstar.filled { color: #f5a623; }
.rating-label { font-size: 12px; color: #bbb; margin-left: 6px; }

.reviewer-row { display: flex; align-items: center; gap: 10px; }
.reviewer-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #eee; }
.reviewer-name { font-size: 13px; font-weight: 600; color: var(--text-main); }
.review-date { font-size: 11px; color: var(--text-sub); margin-top: 1px; }

.review-comment { font-size: 13px; color: var(--text-main); line-height: 1.6; margin: 0; white-space: pre-line; }
.text-clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.toggle-btn { background: none; border: none; color: var(--primary); font-size: 12px; font-weight: 500; cursor: pointer; padding: 3px 0; display: block; }
.toggle-btn:hover { text-decoration: underline; }
.review-comment.no-comment { color: #ccc; font-style: italic; }

.seller-reply-box {
  background: var(--hover-primary);
  border-left: 4px solid var(--primary);
  border-radius: 0 10px 10px 0;
  padding: 10px 14px;
}
.seller-reply-label {
  font-size: 11px; font-weight: 700; color: var(--primary);
  margin-bottom: 5px; display: flex; align-items: center; gap: 6px;
}
.reply-date { font-weight: 400; color: #bbb; }
.seller-reply-text { font-size: 13px; color: var(--text-main); margin: 0 0 8px; line-height: 1.5; white-space: pre-line; }
.btn-edit-reply {
  background: none; border: 1px solid #FF642F; color: #FF642F;
  padding: 3px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-edit-reply:hover { background: #FF642F; color: white; }

.btn-reply {
  background: none; border: 1.5px solid #FF642F; color: #FF642F;
  padding: 8px 16px; border-radius: 9px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s, color 0.15s;
}
.btn-reply:hover { background: #FF642F; color: white; }

/* ========================= */
/* RESPONSIVE                */
/* ========================= */
@media (max-width: 992px) {
  .seller-orders { margin-left: 0; padding: 80px 16px 60px; }
  .reviews-grid { grid-template-columns: 1fr; }
  .star-filter { margin-left: 0; flex-wrap: wrap; }
}

</style>