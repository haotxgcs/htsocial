<template>
  <div class="order-wrapper">
    <div class="order-container" v-if="order">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span @click="goBack">
          {{ isSeller ? 'Seller Orders' : 'My Orders' }}
        </span>
        <span> / Order #{{ order._id.slice(-6) }}</span>
      </div>

      <div class="order-card">

        <!-- HEADER -->
        <div class="order-header">
          <div>
            <!-- BUYER xem: hiển thị tên Seller -->
            <div
              v-if="!isSeller"
              @click="$router.push(`/profile/${order.seller._id}`)"
              class="seller-info"
            >
              Seller:
              <strong>{{ order.seller?.firstname }} {{ order.seller?.lastname }}</strong>
            </div>

            <!-- SELLER xem: hiển thị tên Buyer -->
            <div v-if="isSeller" class="buyer-info">
              Buyer:
              <strong>{{ order.buyer?.firstname }} {{ order.buyer?.lastname }}</strong>
              <span class="buyer-email">{{ order.buyer?.email }}</span>
            </div>
          </div>

          <div class="order-status-badge" :class="order.status">
            {{ formatStatus(order.status) }}
          </div>
        </div>


        <!-- ITEMS -->
        <div class="order-item-scroll">
          <div
            v-for="item in order.items"
            :key="item._id"
            class="order-item"
          >
            <img
              :src="item.item?.images?.[0] || item.itemSnapshot?.images?.[0]"
              class="item-img"
            />

            <div class="item-content">
              <div
                @click="$router.push(`/marketplace/${item.item?._id}`)"
                class="item-title"
              >
                {{ item.item?.title || item.itemSnapshot?.title }}
              </div>
              <div class="item-sub">x{{ item.quantity }}</div>
            </div>

            <div class="item-price">{{ formatPrice(item.price) }}</div>
          </div>
        </div>


        <!-- TOTAL -->
        <div class="order-bottom">
          <div class="order-total">
            Total:
            <!-- buyer có totalPrice, seller response có subtotal -->
            <strong class="total-price">
              {{ formatPrice(order.totalPrice ?? order.subtotal) }}
            </strong>
          </div>
        </div>


        <!-- ========================= -->
        <!-- ACTIONS — BUYER          -->
        <!-- ========================= -->
        <div v-if="!isSeller" class="order-actions">

          <!-- Pay Now -->
          <button
            v-if="order.payment?.method === 'online' && order.payment?.status === 'unpaid' && order.status === 'pending'"
            class="btn-primary"
            @click="$router.push(`/payment/${order._id}`)"
          >Pay Now</button>

          <!-- Cancel (Buyer) -->
          <button
            v-if="order.status === 'pending'"
            class="btn-outline"
            @click="openCancelModal"
          >Cancel Order</button>

          <!-- Review -->
          <button
            v-if="order.status === 'completed' && hasUnreviewedItems(order)"
            class="btn-outline"
            @click="openReviewModal"
          >Review</button>

          <!-- Request Refund -->
          <button
            v-if="canRequestRefund(order)"
            class="btn-outline"
            @click="openRefundModal"
          >Request Refund</button>

          <!-- Refund đã gửi rồi -->
          <span
            v-else-if="order.status === 'completed' && order.payment?.status === 'paid' && order.refund?.status && order.refund.status !== 'none'"
            class="refund-sent-note"
          >Refund {{ order.refund.status }}</span>

        </div>


        <!-- ========================= -->
        <!-- ACTIONS — SELLER         -->
        <!-- ========================= -->
        <div v-if="isSeller" class="order-actions">

          <!-- Update Status -->
          <button
            v-if="['pending','confirmed','shipping'].includes(order.status)"
            class="btn-primary"
            @click="openStatusModal"
          >Update Status</button>

          <!-- Cancel Order (Seller) -->
          <button
            v-if="['pending','shipping'].includes(order.status)"
            class="btn-outline danger"
            @click="openCancelModal"
          >Cancel Order</button>

        </div>


        <!-- ESTIMATED DELIVERY -->
        <div
          v-if="order.estimatedDeliveryDate && ['confirmed','shipping'].includes(order.status)"
          class="delivery-box"
        >
          <div class="delivery-icon"><Truck/></div>
          <div>
            <div class="delivery-label">Estimated Delivery</div>
            <div class="delivery-date">{{ formatDate(order.estimatedDeliveryDate) }}</div>
            <div class="delivery-sub" v-if="order.estimatedDeliveryDays">
              Within {{ order.estimatedDeliveryDays }} day{{ order.estimatedDeliveryDays > 1 ? 's' : '' }} of confirmation
            </div>
          </div>
        </div>

        <!-- PAYMENT INFO -->
        <div class="payment-box">
          <div class="payment-title">
            Payment Method
            <strong class="method-badge" :class=order.payment?.method>{{ order.payment?.method === "cod" ? "COD" : "ONLINE" }}</strong>
          </div>
          <div class="meta">
            Status: {{ order.payment?.status }}<br>
            Ordered At: {{ order.createdAt ? formatDate(order.createdAt): 'N/A' }}<br>
            Paid At: {{ order.paidAt ? formatDate(order.paidAt) : 'N/A' }}
          </div>
        </div>


        <!-- REFUND INFO (nếu có) -->
        <div class="refund-box" v-if="order.refund && order.refund.status !== 'none'">
          <div class="refund-title">
            Refund Request
            <span class="refund-status-badge" :class="order.refund.status">
              {{ order.refund.status }}
            </span>
          </div>
          <div class="meta">
            Reason: {{ order.refund.reason || 'N/A' }}<br>
            Requested At: {{ order.refund.requestedAt ? formatDate(order.refund.requestedAt) : 'N/A' }}<br>
            <div v-if="order.payment?.status === 'refunded'">
              Refunded At: {{ order.refund?.resolvedAt ? formatDate(order.refund.resolvedAt) : 'N/A' }}
            </div>
            <span v-if="order.refund.rejectReason">
              Reject Reason: {{ order.refund.rejectReason }}
            </span>
          </div>

          <!-- Evidence images -->
          <div
            v-if="order.refund.evidence?.images?.length"
            class="evidence-list"
          >
            <img
              v-for="(img, i) in order.refund.evidence.images"
              :key="i"
              :src="img"
              class="evidence-img"
            />
          </div>
        </div>


        <!-- NOTE -->
        <div class="note-box">
          <div class="note-title">Buyer's Note</div>
          <div class="note">{{ order.note || 'None' }}</div>
        </div>


        <!-- CANCELLATION -->
        <div class="cancel-box" v-if="order.status === 'cancelled'">
          <div class="cancel-title">Cancellation</div>
          <div class="meta">
            Reason: {{ order.cancelReason || 'None' }}<br>
            By: {{ order.cancelledBy === 'buyer' ? 'Buyer' : order.cancelledBy === 'seller' ? 'Seller' : 'N/A' }}<br>
            At: {{ order.cancelledAt ? formatDate(order.cancelledAt) : 'N/A' }}
          </div>
        </div>


        <!-- SHIPPING ADDRESS -->
        <div class="address-box">
          <div class="address-title">Shipping Address</div>
          <div class="address-content">
            <strong>{{ order.shippingAddress?.fullName }}</strong>
            <div>{{ order.shippingAddress?.phone }}</div>
            <div>{{ order.shippingAddress?.address }}</div>
          </div>
        </div>

      </div>
    </div>

    <!-- LOADING -->
    <LoadingOverlay v-if="!order && !error" />

    <!-- ERROR -->
    <div v-if="error" class="error-msg">⚠️ {{ error }}</div>


    <!-- STATUS MODAL (Seller only) -->
    <ActionModal
      v-if="modal.visible"
      ref="actionModalRef"
      :type="modal.type"
      :order="order"
      :refund="null"
      :require-evidence="modal.requireEvidence"
      :actor="modal.type === 'cancel' ? (isSeller ? 'seller' : 'buyer') : 'buyer'"
      @cancel="modal.visible = false"
      @confirm="handleModalConfirm"
    />

  </div>
</template>


<script>
import ActionModal from "./ActionModal.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import { Truck } from 'lucide-vue-next';

export default {
  name: "OrderDetailPage",

  components: { 
    ActionModal,
    LoadingOverlay,

    Truck
  },

  data() {
    return {
      order: null,
      error: null,
      modal: { visible: false, type: "", requireEvidence: false }
    };
  },

  computed: {
    // Detect seller nếu route có prefix /seller hoặc query ?role=seller
    isSeller() {
      return (
        this.$route.path.startsWith("/seller") ||
        this.$route.query.role === "seller"
      );
    }
  },

  async mounted() {
    await this.fetchOrder();
  },

  methods: {

    async fetchOrder() {
      try {
        const token = localStorage.getItem("token");
        const id = this.$route.params.id;

        // Seller và buyer dùng cùng endpoint GET /orders/:id
        // Backend đã populate cả seller lẫn user (buyer)
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        if (!res.ok) {
          this.error = data.msg || "Failed to load order";
          return;
        }

        // Backend buyer endpoint trả { order } với order.user
        // Normalize: gán order.buyer = order.user để template dùng 1 key
        const o = data.order;
        if (o.user && !o.buyer) o.buyer = o.user;

        this.order = o;

      } catch (err) {
        console.error("Fetch order error:", err);
        this.error = "Network error. Could not load order.";
      }
    },

    goBack() {
      if (this.isSeller) {
        this.$router.push("/seller-orders");
      } else {
        this.$router.push("/orders");
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    },

    formatStatus(status) {
      const map = {
        pending: "Pending",
        confirmed: "Confirmed",
        shipping: "Shipping",
        completed: "Completed",
        cancelled: "Cancelled",
        refunded: "Refunded"
      };
      return map[status] || status;
    },

    formatPrice(price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);
    },

    // ========================= //
    // MỞ MODAL                  //
    // ========================= //
    openRefundModal() {
      this.modal = { visible: true, type: "request-refund", requireEvidence: true };
    },

    hasUnreviewedItems(order) {
      return order?.items?.some(i => !i.reviewed);
    },

    openReviewModal() {
      this.modal = { visible: true, type: "review", requireEvidence: false };
    },

    /* ========================= */
    /* BUYER: Submit Review      */
    /* ========================= */
    async submitReview({ itemId, rating, comment }) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/review`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              orderId: this.order._id,
              itemId,
              rating,
              comment
            })
          }
        );
        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to submit review"); return; }

        // Reset modal về list để có thể review item tiếp
        this.$refs.actionModalRef?.reviewSubmitted();
        await this.fetchOrder();

      } catch (err) {
        alert("Network error.");
      }
    },

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

    openStatusModal() {
      this.modal = { visible: true, type: "status", requireEvidence: false };
    },

    openCancelModal() {
      this.modal = { visible: true, type: "cancel", requireEvidence: false };
    },

    // ========================= //
    // XỬ LÝ EMIT confirm        //
    // ========================= //
    async handleModalConfirm(payload) {
      if (this.modal.type === "status") {
        await this.updateStatus(payload);
      } else if (this.modal.type === "cancel") {
        if (this.isSeller) {
          await this.cancelOrderBySeller(payload);
        } else {
          await this.cancelOrder(payload);
        }
      } else if (this.modal.type === "request-refund") {
        await this.submitRefund(payload);
      } else if (this.modal.type === "review") {
        await this.submitReview(payload);
      }
    },

    // ========================= //
    // BUYER: Cancel             //
    // ========================= //
    async cancelOrder(reason) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/${this.order._id}/cancel`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
          }
        );
        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to cancel"); return; }
        this.modal.visible = false;
        this.$router.push("/orders");
      } catch (err) {
        alert("Network error.");
      }
    },

    // ========================= //
    // SELLER: Update status     //
    // ========================= //
    async updateStatus(payload) {
      try {
        const token = localStorage.getItem("token");
        const body = typeof payload === "object" ? payload : { status: payload };

        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/${this.order._id}/seller-status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          }
        );

        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to update"); return; }

        this.modal.visible = false;
        await this.fetchOrder();

      } catch (err) {
        alert("Network error.");
      }
    },

    // ========================= //
    // SELLER: Cancel order      //
    // ========================= //
    async cancelOrderBySeller(reason) {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/orders/${this.order._id}/seller-cancel`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
          }
        );

        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to cancel"); return; }

        this.modal.visible = false;
        await this.fetchOrder();

      } catch (err) {
        alert("Network error.");
      }
    },

    // ========================= //
    // BUYER: Submit Refund      //
    // ========================= //
    async submitRefund({ reason, files }) {
      try {
        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("reason", reason);
        files.forEach(f => formData.append("evidence", f));

        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/refund/request/${this.order._id}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          }
        );

        const data = await res.json();
        if (!res.ok) { alert(data.msg || "Failed to submit refund"); return; }

        this.modal.visible = false;
        await this.fetchOrder();

      } catch (err) {
        alert("Network error.");
      }
    }

  }
};
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

/* BREADCRUMB */
.breadcrumb {
  margin-bottom: 20px;
  font-size: 14px;
  color: #ee4d2d;
}
.breadcrumb span:first-child {
  cursor: pointer;
}
.breadcrumb span:first-child:hover {
  text-decoration: underline;
  font-weight: 500;
}

/* CARD */
.order-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #eee;
}

/* HEADER */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.seller-info {
  cursor: pointer;
}
.seller-info:hover {
  text-decoration: underline;
}

.buyer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.buyer-email {
  font-size: 13px;
  color: #888;
}

/* STATUS BADGE */
.order-status-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}
.order-status-badge.pending   { background: #e2e3e5; color: #555; }
.order-status-badge.confirmed { background: #fff3cd; color: #856404; }
.order-status-badge.shipping  { background: #cce5ff; color: #004085; }
.order-status-badge.completed { background: #d4edda; color: #155724; }
.order-status-badge.cancelled { background: #f8d7da; color: #721c24; }
.order-status-badge.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* ITEMS */
.order-item-scroll {
  max-height: 300px;
  overflow-y: auto;
}
.order-item-scroll::-webkit-scrollbar { width: 6px; }
.order-item-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

.order-item {
  display: flex;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding: 15px 0;
}

.item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 15px;
}

.item-content { flex: 1; }

.item-title {
  font-weight: 500;
  margin-bottom: 6px;
  cursor: pointer;
}
.item-title:hover { color: #FF642F; }

.item-sub { font-size: 14px; color: #777; }

.item-price { font-weight: 600; color: #333; }

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
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
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
  cursor: pointer;
}
.btn-outline.danger {
  border-color: #e74c3c;
  color: #e74c3c;
}
.btn-outline.danger:hover { background: #fdecea; }

.refund-sent-note {
  font-size: 13px;
  color: #888;
  padding: 6px 10px;
  border-radius: 6px;
  background: #f5f5f5;
  align-self: center;
}

/* INFO BOXES */
.delivery-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #f0fff4;
  border: 1px solid #a5d6a7;
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 16px;
}
.delivery-icon { font-size: 22px; line-height: 1; margin-top: 2px; }
.delivery-label { font-size: 12px; font-weight: 600; color: #2e7d32; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
.delivery-date { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.delivery-sub { font-size: 12px; color: #666; margin-top: 2px; }

.payment-box,
.note-box,
.cancel-box,
.refund-box {
  background: #fdf4f0;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.payment-title,
.note-title,
.cancel-title,
.refund-title {
  font-weight: 500;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.method-badge {
  font-size: 13px;font-weight:700;padding:2px 8px;border-radius:10px;
}
.method-badge.cod    { background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7; }
.method-badge.online { background:#e3f2fd;color:#1565c0;border:1px solid #90caf9; }

/* REFUND STATUS BADGE */
.refund-status-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: capitalize;
  font-weight: 600;
}
.refund-status-badge.requested { background: #fff3cd; color: #856404; }
.refund-status-badge.approved  { background: #d4edda; color: #155724; }
.refund-status-badge.rejected  { background: #f8d7da; color: #721c24; }
.refund-status-badge.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* EVIDENCE */
.evidence-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.evidence-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.meta {
  margin-top: 10px;
  font-size: 14px;
  color: #555;
  line-height: 1.7;
}

.note {
  margin-top: 10px;
  font-size: 14px;
  color: #555;
}

/* ADDRESS */
.address-box {
  background: #fdf4f0;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}
.address-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.address-content {
  font-size: 14px;
  color: #555;
  line-height: 1.7;
}

/* LOADING / ERROR */
.loading {
  text-align: center;
  padding: 60px;
  color: #888;
}
.error-msg {
  background: #fdecea;
  color: #c0392b;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 20px 0;
}

/* RESPONSIVE */
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
  .item-price { margin-top: 5px; }
  .order-total { text-align: left; }
  .order-actions { justify-content: flex-start; }
}

</style>