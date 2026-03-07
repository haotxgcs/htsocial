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
          <div @click="$router.push(`/profile/${order.seller._id}`)" class="seller-info">
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

          <img :src="item.item?.images?.[0]" class="item-img" />

          <div class="item-content">
            <div class="item-title">
              {{ item.item?.title }}
            </div>

            <div class="item-sub">
              x{{ item.quantity }}
            </div>
          </div>

          <div class="item-price">
            ${{ item.price }}
          </div>

        </div>
        </div>

        <!-- TOTAL -->
        <div class="order-total">
          Total:
          <span class="total-price">${{ order.totalPrice }}</span>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="order-actions">

          <!-- PAY NOW -->
          <button
            v-if="order.payment?.method === 'online' && order.payment?.status === 'unpaid' && order.status === 'pending'"
            class="btn-primary"
            @click="$router.push(`/payment/${order._id}`)"
          >
            Pay Now
          </button>

          <!-- CANCEL -->
          <button
            v-if="order.status === 'pending'"
            class="btn-outline"
            @click="cancelOrder(order._id)"
          >
            Cancel Order
          </button>

          <!-- REVIEW -->
          <button
            v-if="order.status === 'completed'"
            class="btn-outline"
            @click="reviewOrder(order._id)"
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

export default {
  name: "OrderPage",
  components:{
    LoadingOverlay,
    ConfirmDialog,
    Pagination,
    ActionModal
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

    this.orders = data.orders || [];
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

    formatPayment(status) {
      return status === "paid" ? "Paid" : "Unpaid"
    },

    /* ===========================
       ACTIONS
    =========================== */
    cancelOrder(orderId) {
      this.confirmDialog.message = "Are you sure you want to cancel this order?"
      this.confirmDialog.onConfirm = () => this.cancelOrderConfirmed(orderId)
      this.confirmDialog.visible = true
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


    async cancelOrderConfirmed(orderId) {
      try {
        const token = localStorage.getItem("token")

        const response = await fetch(
          `http://localhost:3000/orders/${orderId}/cancel`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!response.ok) {
          throw new Error("Cancel failed")
        }

        this.fetchOrders()

      } catch (err) {
        console.error("Cancel error:", err)
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

    reviewOrder(orderId) {
      this.$router.push(`/orders/${orderId}/review`)
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
  margin-left: 280px;
  padding: 100px 40px 40px;

  min-height: 100vh;
}

.order-container {
  max-width: 900px;
  margin: 0 auto;
}



.page-title {
  text-align: center; margin-bottom: 24px; padding: 24px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; font-weight: 600;
}
.page-title h2 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #1c1e21; }
.order-count { margin: 0; font-size: 14px; color: #FF642F; font-weight: 500; }

.empty-state { text-align: center; padding: 80px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.empty-icon { width: 100px; height: 100px; opacity: 0.4; margin-bottom: 24px; }

/* CARD */
.order-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #eee;
  cursor:pointer;
}

/* HEADER */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.seller-info:hover{
  text-decoration: underline;
  cursor: pointer;
}

.status-text {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}

.status-text.pending   { background: #e2e3e5; color: #555; }
.status-text.confirmed { background: #fff3cd; color: #856404; }
.status-text.shipping  { background: #cce5ff; color: #004085; }
.status-text.completed { background: #d4edda; color: #155724; }
.status-text.cancelled { background: #f8d7da; color: #721c24; }
.status-text.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* ITEM */
.order-item {
  display: flex;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding: 15px 0;
}

.order-item-scroll {
  max-height: 200px;
  overflow-y: auto;
}

.order-item-scroll::-webkit-scrollbar {
  width: 6px;
}

.order-item-scroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 15px;
}

.item-content {
  flex: 1;
}

.item-title {
  font-weight: 500;
  margin-bottom: 6px;
}

.item-sub {
  font-size: 14px;
  color: #777;
}

.item-price {
  font-weight: 600;
  color: #333;
}

/* TOTAL */
.order-total {
  text-align: right;
  padding-top: 10px;
  font-size: 16px;
}

.total-price {
  font-size: 20px;
  font-weight: 600;
  color: #ee4d2d;
  margin-left: 8px;
}

/* ACTIONS */
.order-actions {
  margin-top: 15px;
  text-align: right;
}

.btn-primary {
  background: #ee4d2d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-outline {
  border: 1px solid #ccc;
  background: white;
  padding: 8px 16px;
  border-radius: 4px;
  margin-left: 8px;
  cursor: pointer;
}

.refund-sent-note {
  display: inline-block;
  font-size: 12px;
  color: #888;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px 12px;
  margin-left: 8px;
  text-transform: capitalize;
}

/* ===============================
   SEARCH + FILTER BOX
================================= */

.search-filter-box {
  background: #FFF;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 25px;
}

/* SEARCH ROW */
.search-row {
  position: relative;
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 14px 20px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  outline: none;
  transition: 0.2s ease;
}

.search-input:focus {
  border-color: #ff642f;
}

.clear-icon {
  position: absolute;
  right: 130px;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 4px;
  margin-top: 8px;

}
.clear-icon:hover { color: #FF642F; }

.search-btn {
  padding: 12px 28px;
  border-radius: 30px;
  background: #ff642f;
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.search-btn:hover {
  background: #e05522;
}

/* FILTER ROW */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-pill {
  padding: 8px 18px;
  border-radius: 25px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s ease;
}

.filter-pill:hover {
  border-color: #ff642f;
  color: #ff642f;
}

.filter-pill.active {
  background: #ff642f;
  color: white;
  border-color: #ff642f;
}

.count-badge {
  margin-left: 6px;
  background: #eee;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.filter-pill.active .count-badge {
  background: white;
  color: #ff642f;
}

/* ========================
   RESPONSIVE
======================== */

@media (max-width: 992px) {
  .order-wrapper {
    margin-left: 0;
    padding: 100px 20px 40px;
  }
}

@media (max-width: 600px) {

  .order-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-img {
    width: 100%;
    height: auto;
    margin-bottom: 10px;
  }

  .item-price {
    margin-top: 5px;
  }

  .order-total {
    text-align: left;
  }

  .order-actions {
    text-align: left;
  }
}
</style>