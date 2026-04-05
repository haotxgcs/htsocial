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
              :src="getItemImage(item.item?.images || item.itemSnapshot?.images)"
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
            @click="$router.push(`/payment/${order._id}?from=/orders/${order._id}`)"
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

          <!-- Evidence: images + videos -->
          <div
            v-if="order.refund.evidence?.images?.length || order.refund.evidence?.videos?.length"
            class="evidence-list"
          >
            <!-- Images -->
            <div
              v-for="(img, i) in (order.refund.evidence.images || [])"
              :key="'img-' + i"
              class="evidence-thumb"
              @click="openLightbox(order.refund.evidence.images, i)"
            >
              <img :src="img" class="evidence-img" />
              <div class="evidence-overlay"><ZoomIn :size="18" /></div>
            </div>
            <!-- Videos -->
            <div
              v-for="(vid, i) in (order.refund.evidence.videos || [])"
              :key="'vid-' + i"
              class="evidence-thumb evidence-thumb--video"
              @click="openVideo(vid)"
            >
              <div class="evidence-video-icon"><Play :size="22" /></div>
              <div class="evidence-video-label">Video {{ i + 1 }}</div>
            </div>
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

    <!-- LIGHTBOX -->
    <div v-if="lightbox.visible" class="ev-lightbox" @click.self="lightbox.visible = false">
      <button class="ev-lightbox-close" @click="lightbox.visible = false"><X :size="22" /></button>
      <button
        v-if="lightbox.images.length > 1"
        class="ev-lightbox-nav ev-lightbox-nav--prev"
        @click="lightbox.index = (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length"
      >&#8249;</button>
      <img :src="lightbox.images[lightbox.index]" class="ev-lightbox-img" />
      <button
        v-if="lightbox.images.length > 1"
        class="ev-lightbox-nav ev-lightbox-nav--next"
        @click="lightbox.index = (lightbox.index + 1) % lightbox.images.length"
      >&#8250;</button>
      <div v-if="lightbox.images.length > 1" class="ev-lightbox-counter">
        {{ lightbox.index + 1 }} / {{ lightbox.images.length }}
      </div>
    </div>

    <!-- VIDEO MODAL -->
    <div v-if="videoModal.visible" class="ev-lightbox" @click.self="videoModal.visible = false">
      <button class="ev-lightbox-close" @click="videoModal.visible = false"><X :size="22" /></button>
      <video :src="videoModal.url" controls autoplay class="ev-lightbox-video" />
    </div>

  </div>
</template>


<script>
import ActionModal from "./ActionModal.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import { Truck, ZoomIn, Play, X } from 'lucide-vue-next';

export default {
  name: "OrderDetailPage",

  components: { 
    ActionModal,
    LoadingOverlay,

    Truck,
    ZoomIn,
    Play,
    X
  },

  data() {
    return {
      order: null,
      error: null,
      modal: { visible: false, type: "", requireEvidence: false },
      lightbox: { visible: false, images: [], index: 0 },
      videoModal: { visible: false, url: "" }
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

    openLightbox(images, index = 0) {
      this.lightbox = { visible: true, images, index };
    },
    openVideo(url) {
      this.videoModal = { visible: true, url };
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

    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `${process.env.VUE_APP_API_URL}/${img}`;
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
/* --- WRAPPER & CONTAINER --- */
.order-wrapper {
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

/* BREADCRUMB */
.breadcrumb {
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--primary);
  display: flex;
  gap: 8px;
}

.breadcrumb span:first-child {
  cursor: pointer;
  opacity: 0.8;
}

.breadcrumb span:first-child:hover {
  text-decoration: underline;
  opacity: 1;
}

/* CARD */
.order-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* HEADER */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.seller-info {
  cursor: pointer;
  font-weight: 600;
  color: var(--text-main);
}

.seller-info:hover {
  text-decoration: underline;
  color: var(--primary);
}

.buyer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.buyer-email {
  font-size: 13px;
  color: var(--text-sub);
}

/* STATUS BADGE */
.order-status-badge {
font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: capitalize;
}

.order-status-badge.pending   { background: var(--bg-input); color: var(--text-sub); }
.order-status-badge.confirmed { background: #fff3cd; color: #856404; }
.order-status-badge.shipping  { background: #cce5ff; color: #004085; }
.order-status-badge.completed { background: #d4edda; color: #155724; }
.order-status-badge.cancelled { background: #f8d7da; color: #721c24; }
.order-status-badge.refunded  { background: #f0d9f5; color: #5a1a6e; }

/* ITEMS */
.order-item-scroll {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.order-item-scroll::-webkit-scrollbar { width: 5px; }
.order-item-scroll::-webkit-scrollbar-thumb { 
  background: var(--border-color); 
  border-radius: 10px; 
}

.order-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding: 16px 0;
}

.order-item:last-child { border-bottom: none; }

.item-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
  background-color: var(--bg-input);
}

.item-content { flex: 1; }

.item-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-main);
  transition: color 0.2s;
}

.item-title:hover { color: var(--primary); }

.item-sub { font-size: 13px; color: var(--text-sub); }

.item-price { font-weight: 700; color: var(--text-main); margin-top: 4px; }

/* TOTAL */
.order-total {
  text-align: right;
  padding-top: 20px;
  border-top: 2px dashed var(--border-color);
  font-size: 16px;
}

.total-price {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  margin-left: 10px;
}

/* ACTIONS */
.order-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 24px;
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
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--hover-bg);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-outline.danger {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-outline.danger:hover { background: #fef2f2; }

/* INFO BOXES (DELIVERY, PAYMENT, ADDRESS, REFUND) */
.delivery-box, .payment-box, .address-box, .note-box, .cancel-box, .refund-box {
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid var(--border-color);
}

.delivery-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
}

.delivery-label { 
  font-size: 11px; 
  font-weight: 700; 
  color: #059669; 
  text-transform: uppercase; 
  letter-spacing: 1px;
}

.delivery-date { font-size: 18px; font-weight: 800; color: var(--text-main); }

.payment-box, .address-box, .note-box, .cancel-box, .refund-box {
  background: var(--bg-input);
}

.payment-title, .address-title, .note-title, .cancel-title, .refund-title {
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
}

/* BADGES */
.method-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}

.method-badge.cod    { background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7; }
.method-badge.online { background:#e3f2fd;color:#1565c0;border:1px solid #90caf9; }

.refund-status-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 8px;
  font-weight: 700;
  text-transform: uppercase;
}

.refund-status-badge.requested { background: #fef3c7; color: #92400e; }
.refund-status-badge.approved  { background: #d1fae5; color: #065f46; }
.refund-status-badge.rejected  { background: #fee2e2; color: #991b1b; }
.refund-status-badge.refunded  { background: #f3e8ff; color: #6b21a8; }

/* EVIDENCE */
.evidence-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }

.evidence-thumb {
  position: relative;
  width: 75px; height: 75px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
}

.evidence-img { width: 100%; height: 100%; object-fit: cover; }

.evidence-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.evidence-thumb:hover .evidence-overlay { opacity: 1; }

.evidence-thumb--video { background: #0f172a; }

/* LIGHTBOX */
.ev-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(5px);
}

.ev-lightbox-img, .ev-lightbox-video { 
  max-width: 90vw; 
  max-height: 85vh; 
  border-radius: 8px; 
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
}

.ev-lightbox-close {
  position: absolute; top: 24px; right: 24px;
  background: rgba(255,255,255,0.2); border: none;
  color: #fff; width: 40px; height: 40px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}

.ev-lightbox-close:hover { background: rgba(255,255,255,0.4); }

/* MISC */
.meta, .note, .address-content {
  font-size: 14px;
  color: var(--text-sub);
  line-height: 1.6;
}

.loading { text-align: center; padding: 100px; color: var(--text-sub); font-weight: 500; }

.error-msg {
  background: #fef2f2;
  color: #b91c1c;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #fee2e2;
  font-weight: 500;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .order-wrapper {
    margin-left: 0;
    padding: 100px 20px 40px;
  }
}

@media (max-width: 600px) {
  .order-card { padding: 16px; }
  .order-item { flex-direction: column; align-items: flex-start; }
  .item-img { width: 100%; height: 200px; margin-bottom: 12px; }
  .total-price { font-size: 20px; }
  .order-actions { flex-direction: column; }
  .btn-primary, .btn-outline { width: 100%; }
}
</style>