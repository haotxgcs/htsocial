<template>
  <div class="payment-wrapper">
    <div class="payment-card">
      <h2>Pay Order</h2>

      <div id="card-element" class="card-box"></div>

      <button
        class="btn-pay"
        @click="handlePayment"
        :disabled="processing"
      >
        {{ processing ? "Processing..." : "Pay Now" }}
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

    this.stripe = await loadStripe(process.env.VUE_APP_STRIPE_PUBLIC_KEY)

    const token = localStorage.getItem("token")

    const res = await fetch(`${process.env.VUE_APP_API_URL}/stripe/create-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
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
.payment-wrapper {
  margin-left: 280px;
  padding: 120px 40px;
  min-height: 100vh;
}

.payment-card {
  max-width: 400px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.card-box {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 20px;
}

.btn-pay {
  width: 100%;
  padding: 10px;
  background: #ee4d2d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.error {
  margin-top: 10px;
  color: red;
}

@media (max-width: 768px) {
  .payment-wrapper {
    margin-left: 0;
    padding: 20px;
  }

  .payment-card {
    width: 100%;
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .payment-card {
    padding: 15px;
  }
}

</style>