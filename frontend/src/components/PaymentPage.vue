<template>
  <div class="payment-wrapper">

    <!-- BREADCRUMB -->
    <nav class="breadcrumb">
      <strong class="breadcrumb-link" @click="goBack">
        {{ fromOrderDetail ? "Order Details" : "My Orders" }}
      </strong>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Payment</span>
    </nav>

    <div class="payment-card">

      <!-- HEADER -->
      <div class="pay-header">
        <h2 class="pay-title">Complete Payment</h2>
        <div class="pay-orderid">Order <span class="mono">#{{ order?._id?.slice(-6)?.toUpperCase() || '...' }}</span></div>
      </div>

      <!-- ORDER SUMMARY -->
      <div v-if="order" class="order-summary">

        <!-- Seller -->
        <div class="summary-seller">
          <span class="summary-seller-label">Seller</span>
          <strong>{{ order.seller?.firstname }} {{ order.seller?.lastname }}</strong>
        </div>

        <!-- Items -->
         <div class="summary-items-scroll">
        <div class="summary-items">
          <div v-for="item in order.items" :key="item._id" class="summary-item">
            <img
              :src="getItemImage(item.itemSnapshot?.images || item.item?.images)"
              class="summary-item-img"
            />
            <div class="summary-item-info">
              <div class="summary-item-title">{{ item.itemSnapshot?.title || item.item?.title }}</div>
              <div class="summary-item-sub">
                {{ formatPrice(item.price) }} &times; {{ item.quantity }}
              </div>
            </div>
            <div class="summary-item-total">{{ formatPrice(item.price * item.quantity) }}</div>
          </div>
        </div>
        </div>

        <!-- Total -->
        <div class="summary-total">
          <span>Total Payment</span>
          <strong class="summary-total-amount">{{ formatPrice(order.totalPrice) }}</strong>
        </div>

      </div>

      <!-- Loading skeleton -->
      <div v-else class="summary-loading">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>

      <!-- DIVIDER -->
      <div class="pay-divider">
        <span>Payment Details</span>
      </div>

      <!-- STRIPE CARD -->
      <div id="card-element" class="card-box"></div>

      <button
        class="btn-pay"
        @click="handlePayment"
        :disabled="processing || !order"
      >
        <span v-if="processing">Processing...</span>
        <span v-else>Pay {{ order ? formatPrice(order.totalPrice) : '' }}</span>
      </button>

    </div>

    <!-- <NotificationModal
      v-if="showNotification"
      :message="notificationMessage"
      :type="notificationType"
      @close="showNotification = false"
      /> -->
      <!-- <NotificationModal
      v-if="showNotification"
      :message="notificationMessage"
      :type="notificationType"
      @close="showNotification = false"
    /> -->
    <NotificationModal
      :isVisible="notification.show"
      :message="notification.message"
      :type="notification.type"
      title="Notification"
      buttonText="OK"
      @confirm="notification.show = false"/>
  </div>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js"
import NotificationModal from "./NotificationModal.vue";

export default {
  name: "PaymentPage",
  components: {
    NotificationModal
  },

  data() {
    return {
      stripe: null,
      elements: null,
      card: null,
      clientSecret: null,
      processing: false,
      error: null,
      order: null,
      fromOrderDetail: false,

        // Notification state
        // showNotification: false,
        // notificationMessage: "",
        // notificationType: "success",

          // Centralized notification state
          notification: {
            show: false,
            message: "",
            type: "success"
          }
    }
  },

  async mounted() {
    const orderId = this.$route.params.id
    // Detect if came from order detail page
    const from = this.$route.query.from || document.referrer || ""
    this.fromOrderDetail = from.includes(`/orders/${orderId}`)  

    const token = localStorage.getItem("token")

    // Fetch order info to display summary
    try {
      const orderRes = await fetch(`${process.env.VUE_APP_API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const orderData = await orderRes.json()
      this.order = orderData.order || orderData
    } catch (e) {
      console.error("Failed to load order:", e)
    }

    this.stripe = await loadStripe(process.env.VUE_APP_STRIPE_PUBLIC_KEY)

    const token2 = token

    const res = await fetch(`${process.env.VUE_APP_API_URL}/stripe/create-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`
      },
      body: JSON.stringify({ orderId })
    })

    const data = await res.json()

    this.clientSecret = data.clientSecret

    this.elements = this.stripe.elements()
    this.card = this.elements.create("card")
    this.card.mount("#card-element")
  },

  methods: {
    goBack() {
      const orderId = this.$route.params.id;
      if (this.fromOrderDetail) {
        this.$router.push(`/orders/${orderId}`);
      } else {
        this.$router.push("/orders");
      }
    },
    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `${process.env.VUE_APP_API_URL}/${img}`;
    },
    formatPrice(value) {
      if (!value && value !== 0) return "";
      return "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

  async handlePayment() {
    this.processing = true
    this.error = null

    try {
      const { error, paymentIntent } =
        await this.stripe.confirmCardPayment(this.clientSecret, {
          payment_method: {
            card: this.card
          }
        })

      if (error) {
        this.notification.type = "error"
        this.notification.message = error.message
        this.notification.show = true
        return
      }

      if (paymentIntent.status === "succeeded") {
        this.notification.type = "success"
        this.notification.message = "Payment successful!"
        this.notification.show = true

        setTimeout(() => {
          this.$router.push("/orders")
        }, 1200)
      }

    } catch (err) {
      this.notification.type = "error"
      this.notification.message = "Payment failed. Please try again."
      this.notification.show = true
    } finally {
      this.processing = false
    }
  }

  }
}
</script>

<style scoped>
.payment-wrapper { margin-left: 280px; min-height: 100vh; padding: 80px 40px 60px; box-sizing: border-box; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 6px; max-width: 480px; margin: 0 auto 16px; font-size: 14px; color: #888; }
.breadcrumb-link { color: #FF642F;font-size:14px;font-weight:500; cursor: pointer; }
.breadcrumb-link:hover { text-decoration:underline;}
.breadcrumb-sep { color: #FF642F; font-size: 13px; }
.breadcrumb-current { color: #FF642F; font-weight: 400; }

/* Card */
.payment-card { max-width: 480px; margin: 0 auto; background: white; padding: 30px; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); box-sizing: border-box; }

/* Header */
.pay-header { margin-bottom: 20px; }
.pay-title { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1a1a1a; }
.pay-orderid { font-size: 13px; color: #999; }
.mono { font-family: monospace; color: #555; }

/* Order summary */
.order-summary { background: #fafafa; border: 1px solid #eee; border-radius: 10px; margin-bottom: 20px; overflow: hidden; }
.summary-seller { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 13px; color: #666; border-bottom: 1px solid #eee; }
.summary-seller-label { font-weight: 500; }
.summary-items { padding: 6px 0; max-height: 200px; overflow-y: auto; }
.summary-items::-webkit-scrollbar { width: 4px; }
.summary-items::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
.summary-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
.summary-item:last-child { border-bottom: none; }
.summary-item-img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #eee; }
.summary-item-info { flex: 1; min-width: 0; }
.summary-item-title { font-size: 13px; font-weight: 600; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.summary-item-sub { font-size: 12px; color: #888; margin-top: 2px; }
.summary-item-total { font-size: 13px; font-weight: 700; color: #1a1a1a; white-space: nowrap; }
.summary-total { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #fff3ee; font-size: 14px; color: #555; border-top: 1px solid #eee; }
.summary-total-amount { font-size: 18px; font-weight: 800; color: #ff5757; }

/* Skeleton */
.summary-loading { padding: 16px; display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }
.skeleton { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200%; animation: shimmer 1.2s infinite; border-radius: 6px; }
.skeleton-img { width: 52px; height: 52px; border-radius: 8px; flex-shrink: 0; }
.skeleton-text { height: 13px; flex: 1; }
.skeleton-text.short { flex: 0 0 80px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Divider */
.pay-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.pay-divider::before,.pay-divider::after { content:""; flex:1; height:1px; background:#eee; }
.pay-divider span { font-size: 12px; color: #aaa; font-weight: 500; white-space: nowrap; }

/* Stripe + button */
.card-box { padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 20px; }
.btn-pay { width: 100%; padding: 12px; background: #ee4d2d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
.btn-pay:disabled { opacity: 0.6; cursor: not-allowed; }
.error { margin-top: 10px; color: red; }

/* Responsive */
@media (max-width: 768px) {
  .payment-wrapper { margin-left: 0; padding: 20px 16px 80px; }
  .breadcrumb { max-width: 100%; margin-bottom: 12px; font-size: 13px; }
  .payment-card { max-width: 100%; padding: 20px 16px; border-radius: 12px; }
  .summary-item-img { width: 46px; height: 46px; }
  .summary-total-amount { font-size: 16px; }
}

@media (max-width: 480px) {
  .payment-wrapper { padding: 16px 12px 80px; }
  .payment-card { padding: 16px 14px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .pay-title { font-size: 17px; }
  .summary-item { gap: 8px; padding: 8px 12px; }
  .summary-item-img { width: 42px; height: 42px; border-radius: 6px; }
  .summary-item-title { font-size: 12px; }
  .summary-item-sub, .summary-item-total { font-size: 11px; }
  .summary-seller, .summary-total { padding: 9px 12px; font-size: 13px; }
  .summary-total-amount { font-size: 15px; }
  .btn-pay { font-size: 14px; padding: 12px; }
  .breadcrumb { font-size: 12px; }
}
</style>