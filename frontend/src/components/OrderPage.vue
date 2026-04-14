<template>
  <div class="order-wrapper">
    <div class="order-container">
      <div class="page-title">
        <h2 >My Orders</h2>
        <p class="order-count">{{ totalAll }} {{ totalAll === 1 ? 'order' : 'orders' }}</p>
      </div>
      
      <LoadingOverlay v-if="loading" />

      <!-- SEARCH + FILTER BOX -->
      <div class="search-filter-box">

        <!-- SEARCH BAR -->
        <div class="search-row">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Search orders..."
            class="search-input"
            @keyup.enter="applySearch"
          />

          <span v-if="searchKeyword" class="clear-icon" @click.stop="clearSearch">
              ✕
          </span>

          <button class="search-btn" @click="applySearch">
            Search
          </button>
        </div>

        <!-- FILTER BUTTONS -->
        <div class="filter-row">
          <button
            v-for="f in filters"
            :key="f.value"
            :class="['filter-pill', { active: activeFilter === f.value }]"
            @click="changeFilter(f.value)"
          >
            {{ f.label }}
            <span class="count-badge">
              {{
                f.value === "all"
                  ? totalAll || 0
                  : statusCounts[f.value] || 0
              }}
            </span>
          </button>
        </div>

      </div>

      <div v-if="!loading && orders.length === 0" class="empty-state">
        <h2>No orders found.</h2>
      </div>

      <div v-for="order in orders" :key="order._id" class="order-card">
        
        <!-- HEADER -->
        <div class="order-header">
          <div @click="order.seller && $router.push(`/profile/${order.seller._id}`)" class="seller-info">
            Seller: 
            <strong>{{ order.seller?.firstname }} {{ order.seller?.lastname }}</strong>
          </div>

          <div class="order-status" :class="order.status">
            <span class="status-text" :class="order.status">
              {{ formatStatus(order.status) }}
            </span>
          </div>
        </div>

        <div class="order-item-scroll">
        <!-- ITEMS -->
        <div @click="$router.push(`/orders/${order._id}`)" v-for="item in order.items" :key="item._id" class="order-item">

          <!-- Item còn tồn tại -->
          <template v-if="!item.itemDeleted">
            <img :src="getItemImage(item.item.images)" class="item-img" />
            <div class="item-content">
              <div class="item-title">{{ item.item?.title }}</div>
              <div class="item-sub">x{{ item.quantity }}</div>
            </div>
            <div class="item-price">{{ formatPrice(item.price) }}</div>
          </template>

          <!-- Item đã bị xóa -->
          <template v-else>
            <div class="item-img item-deleted-thumb">🚫</div>
            <div class="item-content">
              <div class="item-title item-deleted-label">Deleted Item</div>
              <div class="item-sub">x{{ item.quantity }}</div>
            </div>
            <div class="item-price">{{ formatPrice(item.price) }}</div>
          </template>

        </div>
        </div>

        <!-- TOTAL -->
        <div class="order-total">
          Total:
          <span class="total-price">{{ formatPrice(order.totalPrice) }}</span>
        </div>

        <!-- ESTIMATED DELIVERY -->
        <div
          v-if="order.estimatedDeliveryDate && ['confirmed','shipping'].includes(order.status)"
          class="delivery-date-row"
        >
          <Truck/> Estimated delivery:
          <strong>{{ formatDate(order.estimatedDeliveryDate) }}</strong>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="order-actions">

          <!-- PAY NOW -->
          <button
            v-if="order.payment?.method === 'online' && order.payment?.status === 'unpaid' && order.status === 'pending'"
            class="btn-primary"
            @click="$router.push(`/payment/${order._id}?from=/orders`)"
          >
            Pay Now
          </button>

          <!-- CANCEL -->
          <button
            v-if="order.status === 'pending'"
            class="btn-outline"
            @click="cancelOrder(order)"
          >
            Cancel Order
          </button>

          <!-- REVIEW -->
          <button
            v-if="order.status === 'completed' && hasUnreviewedItems(order)"
            class="btn-outline"
            @click.stop="openReviewModal(order)"
          >
            Review
          </button>

          <!-- REFUND -->
          <button
            v-if="canRequestRefund(order)"
            class="btn-outline"
            @click.stop="openRefundModal(order)"
          >
            Request Refund
          </button>

          <!-- Đã có refund request rồi -->
          <span
            v-else-if="order.status === 'completed' && order.payment?.status === 'paid' && order.refund?.status && order.refund.status !== 'none'"
            class="refund-sent-note"
          >Refund: {{ order.refund.status }}</span>
        </div>

      </div>
      <ConfirmDialog 
        v-if="confirmDialog.visible"
        :message="confirmDialog.message"
        @confirm="handleConfirm"
        @cancel="handleCancel"/>

      <!-- REFUND MODAL -->
      <ActionModal
        v-if="refundModal.visible"
        type="request-refund"
        :order="refundModal.order"
        :require-evidence="refundModal.requireEvidence"
        @cancel="refundModal.visible = false"
        @confirm="submitRefund"
      />

      <!-- REVIEW MODAL -->
      <ActionModal
        v-if="reviewModal.visible"
        ref="reviewModalRef"
        type="review"
        :order="reviewModal.order"
        @cancel="reviewModal.visible = false"
        @confirm="submitReview"
      />

      <!-- CANCEL MODAL -->
      <ActionModal
        v-if="cancelModal.visible"
        type="cancel"
        :order="cancelModal.order"
        @cancel="cancelModal.visible = false"
        @confirm="cancelOrderConfirmed"
      />

      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import LoadingOverlay from "./LoadingOverlay.vue"
import ConfirmDialog from "./ConfirmDialog.vue"
import Pagination from "./Pagination.vue"
import ActionModal from "./ActionModal.vue"
import { Truck } from 'lucide-vue-next';

export default {
  name: "OrderPage",
  components:{
    LoadingOverlay,
    ConfirmDialog,
    Pagination,
    ActionModal,

    Truck
  }, 

  data() {
    return {
      orders: [],
      loading: false,
      error: null,



      currentPage: 1,
      totalPages: 1,
      totalOrders: 0,
      perPage: 5,

      searchKeyword: "",
      activeFilter: "all",

      statusCounts: {},

      confirmDialog: {
        visible: false,
        message: "",
        onConfirm: null
      },

      refundModal: {
        visible: false,
        order: null,
        requireEvidence: false
      },

      reviewModal: {
        visible: false,
        order: null
      },

      cancelModal: {
        visible: false,
        order: null
      }
    }
  },

  mounted() {
    this.fetchOrders()
  },

  methods: {

async fetchOrders() {
  this.loading = true;

  try {
    const token = localStorage.getItem("token");

    const params = new URLSearchParams();
    params.append("page", this.currentPage);
    params.append("limit", this.perPage);

    if (this.searchKeyword) {
      params.append("keyword", this.searchKeyword);
    }

    if (this.activeFilter !== "all") {
      params.append("status", this.activeFilter);
    }

    const url = `${process.env.VUE_APP_API_URL}/orders?${params.toString()}`;

    console.log("FETCH:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    this.orders = (data.orders || []).map(order => ({
      ...order,
      items: (order.items || []).map(i => ({
        ...i,
        itemDeleted: i.item === null  // ← đánh dấu thay vì filter bỏ
      }))
    }));
    this.totalPages = data.totalPages || 1;
    this.totalOrders = data.total || 0;
    this.totalAll = data.totalAll;
    this.statusCounts = data.statusCounts || {};

  } catch (err) {
    console.error("Fetch error:", err);
  } finally {
    this.loading = false;
  }
},

  async changeFilter(status) {
    this.activeFilter = status;
    this.currentPage = 1;
    await this.fetchOrders();
  },

  handlePageChange(page) {
    this.currentPage = page;
    this.fetchOrders(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

    /* ===========================
       FORMAT STATUS
    =========================== */

    formatDate(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },

    formatStatus(status) {
      const map = {
        pending: "Pending",
        confirmed: "Confirmed",
        shipping: "Shipping",
        completed: "Completed",
        cancelled: "Cancelled",
        refunded: "Refunded"
      }

      return map[status] || status
    },

    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `${process.env.VUE_APP_API_URL}/${img}`;
    },

    formatPayment(status) {
      return status === "paid" ? "Paid" : "Unpaid"
    },

    formatPrice(price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);
    },

    /* ===========================
       ACTIONS
    =========================== */
    cancelOrder(order) {
      this.cancelModal.order = order
      this.cancelModal.visible = true
    },

    handleConfirm(){
      const action = this.confirmDialog.onConfirm

      this.confirmDialog.visible = false
      this.confirmDialog.onConfirm = null

      if (action) {
        action()
      }
    },

    handleCancel(){
      this.confirmDialog.visible = false
      this.confirmDialog.onConfirm = null
    },


    async cancelOrderConfirmed(reason) {
      try {
        const token = localStorage.getItem("token")
        const orderId = this.cancelModal.order._id

        const response = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/${orderId}/cancel`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
          }
        )

        if (!response.ok) {
          const data = await response.json()
          alert(data.msg || "Cancel failed")
          return
        }

        this.cancelModal.visible = false
        this.fetchOrders()

      } catch (err) {
        console.error("Cancel error:", err)
        alert("Network error. Please try again.")
      }
    },

    async payNow(orderId) {
      try {
        const token = localStorage.getItem("token")

        const response = await fetch(
          "http://localhost:3000/stripe/create-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ orderId })
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.msg || "Payment failed")
        }

        console.log("Client Secret:", data.clientSecret)

        // ⚠️ LƯU Ý:
        // Backend bạn đang dùng PaymentIntent (card form),
        // không phải Checkout Session redirect.

      } catch (err) {
        console.error("Payment error:", err)
      }
    },

    /* ===========================
       REVIEW
    =========================== */
    hasUnreviewedItems(order) {
      return order.items?.some(i => !i.reviewed)
    },

    openReviewModal(order) {
      this.reviewModal = { visible: true, order }
    },

    async submitReview({ itemId, rating, comment }) {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/review`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              orderId: this.reviewModal.order._id,
              itemId,
              rating,
              comment
            })
          }
        )
        const data = await res.json()
        if (!res.ok) { alert(data.msg || "Failed to submit review"); return }

        // Reset modal về list để review item tiếp theo
        this.$refs.reviewModalRef?.reviewSubmitted()
        await this.fetchOrders()

      } catch (err) {
        console.error("Review error:", err)
        alert("Network error.")
      }
    },

    /* ===========================
       REFUND
    =========================== */

    // Kiểm tra đủ điều kiện hiện nút Request Refund
    canRequestRefund(order) {
      if (!order) return false
      if (order.status !== "completed") return false

      // COD: cho phép refund (seller hoàn tiền mặt)
      // Online: chỉ khi đã paid
      if (order.payment?.method === "online" && order.payment?.status !== "paid") return false

      // Không cho request nếu đã có refund đang xử lý
      const rs = order.refund?.status
      if (rs && rs !== "none" && rs !== "rejected") return false

      // Trong vòng 7 ngày
      const days = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      return days <= 7
    },

    openRefundModal(order) {
      // Order completed → evidence bắt buộc (backend yêu cầu)
      this.refundModal = { visible: true, order, requireEvidence: true }
    },

    async submitRefund({ reason, files }) {
      try {
        const token = localStorage.getItem("token")
        const formData = new FormData()
        formData.append("reason", reason)
        files.forEach(f => formData.append("evidence", f))

        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/refund/request/${this.refundModal.order._id}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          }
        )

        const data = await res.json()
        if (!res.ok) { alert(data.msg || "Failed to submit refund"); return }

        this.refundModal.visible = false
        await this.fetchOrders()

      } catch (err) {
        console.error("Refund error:", err)
        alert("Network error.")
      }
    },

    applySearch() {
      this.currentPage = 1;
      this.fetchOrders();
    },

    clearSearch() {
      this.searchKeyword = "";
      this.applySearch();
    }


  },

  computed: {
  filters() {
    return [
      { label: "All", value: "all" },
      { label: "Pending", value: "pending" },
      { label: "Confirmed", value: "confirmed" },
      { label: "Shipping", value: "shipping" },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Refunded", value: "refunded" }
    ];
  }
}
}
</script>

<style scoped>
.order-wrapper {
  /* Đồng bộ khoảng cách và màu nền */
  margin-left: 280px;
  padding: 100px 40px 40px;
  min-height: 100vh;
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background-color 0.3s ease;
}

.order-container {
  max-width: 900px;
  margin: 0 auto;
}

/* TIÊU ĐỀ TRANG */
.page-title {
  text-align: center; 
  margin-bottom: 24px; 
  padding: 24px;
  background: var(--bg-card); 
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
  border: 1px solid var(--border-color); 
  font-weight: 600;
}

.page-title h2 { 
  margin: 0 0 8px 0; 
  font-size: 24px; 
  font-weight: 800; 
  color: var(--text-main); 
}

.order-count { 
  margin: 0; 
  font-size: 14px; 
  color: var(--primary); 
  font-weight: 500; 
}

/* TRẠNG THÁI TRỐNG */
.empty-state { 
  text-align: center; 
  padding: 80px 20px; 
  background: var(--bg-card); 
  border-radius: 12px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
}

.empty-icon { 
  width: 100px; 
  height: 100px; 
  opacity: 0.3; 
  margin-bottom: 24px; 
  filter: grayscale(1);
}

/* CARD ĐƠN HÀNG */
.order-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border-color: var(--primary);
}

/* HEADER ĐƠN HÀNG */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.seller-info:hover {
  text-decoration: underline;
  cursor: pointer;
  color: var(--primary);
}

/* BADGE TRẠNG THÁI */
.status-text {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: capitalize;
}

.status-text.pending   { background: #e2e3e5; color: #555; }
.status-text.confirmed { background: #fff3cd; color: #856404; } /* Màu cảnh báo giữ nguyên để dễ nhận diện */
.status-text.shipping  { background: #cce5ff; color: #004085; }
.status-text.completed { background: #d4edda; color: #155724; }
.status-text.cancelled { background: #f8d7da; color: #721c24; }
.status-text.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* ITEM ĐƠN HÀNG */
.order-item {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding: 15px 0;
}

.order-item-scroll {
  max-height: 250px;
  overflow-y: auto;
  padding-right: 5px;
}

.order-item-scroll::-webkit-scrollbar { width: 5px; }
.order-item-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}

.item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
  background-color: var(--bg-input);
}

.item-content { flex: 1; }
.item-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-main);
}

.item-sub {
  font-size: 13px;
  color: var(--text-sub);
}

.item-price {
  font-weight: 700;
  color: var(--text-main);
  margin-top: 4px;
}

/* DÒNG NGÀY GIAO HÀNG */
.delivery-date-row {
  font-size: 13px;
  color: var(--text-sub);
  padding: 10px 0 5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.delivery-date-row strong { color: var(--primary); }

/* TỔNG TIỀN */
.order-total {
  text-align: right;
  padding-top: 15px;
  border-top: 1px dashed var(--border-color);
  font-size: 15px;
}

.total-price {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary); /* Sử dụng màu primary cho giá tiền thay vì đỏ cứng */
  margin-left: 8px;
}

.item-deleted-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: var(--bg-input);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}

.item-deleted-label {
  color: #ef4444;
  font-style: italic;
  font-size: 13px;
  text-transform: uppercase;
}

/* CÁC NÚT HÀNH ĐỘNG */
.order-actions {
  margin-top: 15px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.9; }

.btn-outline {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-outline:hover {
  background: var(--hover-bg);
  border-color: var(--primary);
  color: var(--primary);
}

.refund-sent-note {
  display: inline-block;
  font-size: 12px;
  color: var(--text-sub);
  background: var(--bg-input);
  border-radius: 20px;
  padding: 5px 15px;
  text-transform: capitalize;
  border: 1px solid var(--border-color);
}

/* ===============================
   SEARCH + FILTER BOX
================================= */
.search-filter-box {
  background: var(--bg-card);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.search-row {
  position: relative;
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 12px 20px;
  border-radius: 30px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(255, 100, 47, 0.1);
}

.clear-icon {
  position: absolute;
  right: 135px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-sub);
  cursor: pointer;
  font-size: 14px;
  padding: 5px;
}

.search-btn {
  padding: 12px 28px;
  border-radius: 30px;
  background: var(--primary);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.search-btn:hover { filter: brightness(1.1); }

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pill {
  padding: 8px 18px;
  border-radius: 25px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-sub);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.filter-pill.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.count-badge {
  margin-left: 6px;
  background: var(--bg-input);
  color: var(--text-sub);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.filter-pill.active .count-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* ========================
   RESPONSIVE
======================== */
@media (max-width: 992px) {
  .order-wrapper {
    margin-left: 0;
    padding: 100px 16px 40px;
  }
}

@media (max-width: 600px) {
  .order-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .item-img {
    width: 100%;
    height: 180px;
    margin-bottom: 12px;
    margin-right: 0;
  }
  .order-total, .order-actions {
    text-align: left;
    justify-content: flex-start;
  }
  .search-row { flex-direction: column; }
  .search-btn { width: 100%; }
  .clear-icon { right: 20px; top: 22px; }
}
</style>