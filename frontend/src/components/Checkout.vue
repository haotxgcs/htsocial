<template>
  <div class="checkout-page">

    <!-- ✅ PAGE HEADER -->
    <div class="checkout-title">
      <h2>Checkout</h2>
    </div>

    <LoadingOverlay v-if="loading" />

    <NotificationModal
      :isVisible="notification.show"
      :message="notification.message"
      :type="notification.type"
      title="Notification"
      buttonText="OK"
      @confirm="notification.show = false"/>

    <!-- ✅ 1. SHIPPING ADDRESS CARD -->
    <div class="checkout-section">
      <div class="section-header">
        <div class="section-address-header-clean">
          <span class="section-icon">📍</span>
          <span class="section-text">Delivery Address</span>
        </div>

        <button class="small-btn" @click="showAddModal = true">
          + New Address
        </button>

      </div>


      <div v-if="addresses.length" class="address-scroll">
        <div class="address-list">
        <div
          v-for="a in addresses"
          :key="a._id"
          class="address-card"
          :class="{ active: selectedAddressId === a._id }"
        >
          <!-- ✅ MAIN INFO -->
          <div class="address-main" @click="selectAddress(a._id)">

            <input
              type="radio"
              class="radio"
              :checked="selectedAddressId === a._id"
            />

            <div class="address-info">
              <div class="top-line">
                <span class="name">{{ a.fullName }}</span>

                <span v-if="a.isDefault" class="badge">
                  Default
                </span>
              </div>

              <div class="sub">{{ a.phone }}</div>
              <div class="sub">{{ a.address }}</div>
            </div>
          </div>

          <!-- ✅ MENU -->
          <div class="menu-wrapper">
            <button class="menu-btn" @click.stop="toggleMenu(a._id)">
              <MoreHorizontal class="icon" />
            </button>

            <div
              v-if="openMenuId === a._id"
              class="menu-dropdown"
            >
              <button
                v-if="!a.isDefault"
                @click.stop="setDefault(a._id)"
              >
              <Star class="icon" /> Set Default
              </button>

              <button @click.stop="openEdit(a)">
                <Pencil class="icon" /> Edit
              </button>

              <button
                class="danger"
                @click.stop="removeAddress(a._id)"
              >
                <Trash2 class="icon" /> Delete
              </button>
            </div>
          </div>
        </div>
        </div>
 

      </div>


      <p v-else class="empty-text">
        No address found. Please add one.
      </p>
    </div>


    <!-- ✅ 2. ORDER SUMMARY -->
    <div v-if="items && items.length" class="checkout-section">

      <!-- <h2 class="section-title">🛒 Order Summary</h2> -->
      <div class="section-header-clean">
        <span class="section-icon">🛒</span>
        <span class="section-text">Order Summary</span>
      </div>

      <div class="order-list-scroll">

        <div
          v-for="group in groupedItems"
          :key="group.seller?._id"
          class="order-seller-group"
        >

          <!-- SELLER HEADER -->
          <div class="order-seller">
            Seller:
            <strong>
              {{ group.seller?.firstname }}
              {{ group.seller?.lastname }}
            </strong>
          </div>

          <!-- ITEMS -->
          <div
            v-for="cartItem in group.items"
            :key="cartItem._id"
            class="order-item"
          >

            <img
              :src="getImage(cartItem.item?.images?.[0])"
              class="product-img"
            />

            <div class="product-info">
              <p class="product-name">
                {{ cartItem.item?.title }}
              </p>
              <p class="product-qty">
                x {{ cartItem.quantity }}
              </p>
            </div>

            <div class="product-price">
              {{ formatPrice(cartItem.item?.price * cartItem.quantity) }}
            </div>

          </div>

          <!-- SELLER SUBTOTAL -->
          <div class="seller-subtotal">
            Subtotal:
            <strong>
              {{ formatPrice(group.items.reduce((sum, i) => sum + (i.item?.price || 0) * i.quantity, 0)) }}
            </strong>
          </div>

        </div>

      </div>

    </div>

    <div v-else class="empty-text">
      <p class="checkout-section">No items to checkout.</p>
    </div>

    <!-- ✅ 3. PAYMENT METHOD -->
  <div class="checkout-section">

    <div class="section-header-clean">
      <span class="section-icon">💳</span>
      <span class="section-text">Payment Method</span>
    </div>

    <div class="payment-list">

      <!-- COD -->
      <div
        class="payment-card"
        :class="{ active: paymentMethod === 'cod' }"
        @click="paymentMethod = 'cod'"
      >
        <input
          type="radio"
          value="cod"
          v-model="paymentMethod"
        />

        <div class="payment-info">
          <div class="payment-title">
            Cash on Delivery (COD)
          </div>
          <div class="payment-desc">
            Pay when receiving goods
          </div>
        </div>
      </div>

      <!-- STRIPE -->
      <div
        class="payment-card"
        :class="{ active: paymentMethod === 'online' }"
        @click="paymentMethod = 'online'"
      >
        <input
          type="radio"
          value="online"
          v-model="paymentMethod"
        />

        <div class="payment-info">
          <div class="payment-title">
            Online Payment (Stripe)
          </div>
          <div class="payment-desc">
            Secure online transaction
          </div>
        </div>
      </div>

    </div>

  </div>

    <!-- ✅ 3.5 ORDER NOTE -->
    <div class="checkout-section">

      <div class="section-header-clean">
        <span class="section-icon">📝</span>
        <span class="section-text">Order Note</span>
      </div>

      <textarea
        v-model="orderNote"
        class="note-input"
        placeholder="Add note for seller (optional)..."
        rows="3"
      ></textarea>

    </div>

    <!-- ✅ 4. ORDER TOTAL + PLACE ORDER -->
    <div v-if="items && items.length" class="checkout-footer">

      <div class="total-row">
        <span>Total Payment:</span>
        <strong>{{ formatPrice(totalPrice) }}</strong>
      </div>

      <button
        class="place-btn"
        :disabled="!selectedAddressId || loading || isSubmitting"
        @click="placeOrder"
      >
        <span v-if="!loading">Place Order</span>
        <span v-else>Processing...</span>
      </button>

    </div>

    <!-- ✅ ADD ADDRESS MODAL -->
    <AddressModal
      mode="create"
      v-if="showAddModal"
      @close="showAddModal = false"
      @saved="updateAddresses"
    />

    <AddressModal
      mode="edit"
      v-if="showEditModal"
      :address="editingAddress"
      @close="showEditModal = false"
      @saved="updateAddresses"
    />


  </div>
</template>

<script>
import AddressModal from "./AddressModal.vue";
import NotificationModal from "./NotificationModal.vue"
import LoadingOverlay from "./LoadingOverlay.vue"

import {
  Star,
  Pencil,
  Trash2,
  MoreHorizontal
} from "lucide-vue-next";

export default {
  name: "CheckoutPage",

  components: {
    AddressModal,
    NotificationModal,
    LoadingOverlay,

    // icon
    Star,
    Pencil,
    Trash2,
    MoreHorizontal
  },

  data() {
    return {
      // BUY NOW
      item: null,
      qty: 1,

      // CART CHECKOUT
      cartItems: [],

      // ADDRESS
      addresses: [],
      selectedAddressId: "",

      // PAYMENT
      paymentMethod: "cod",

      // NOTE
      orderNote: "",

      // UI
      loading: false,
      showAddModal: false,
      openMenuId: null,
      editingAddress: null,
      showEditModal: false,

      // Notification
      notification: {
        show: false,
        type: "success", // success | error
        message: ""
      },

      isSubmitting: false,
    };
  },

  computed: {
    isBuyNow() {
      return Boolean(this.$route.query.item);
    },

    items() {
      if (this.isBuyNow) {
        if (!this.item) return [];

        return [
          {
            item: this.item,
            quantity: this.qty
          }
        ];
      }

      return this.cartItems || [];
    },

    totalPrice() {
      return this.items.reduce(
        (sum, i) =>
          sum + (i.item?.price || 0) * i.quantity,
        0
      );
    },

    groupedItems() {
      const groups = {}

      this.items.forEach(ci => {
        const sellerId = ci.item?.seller?._id || "unknown"

        if (!groups[sellerId]) {
          groups[sellerId] = {
            seller: ci.item?.seller,
            items: []
          }
        }

        groups[sellerId].items.push(ci)
      })

      return Object.values(groups)
    }
  },

  async created() {
    await this.loadCheckoutData();
  },

  watch: {
    "$route.query": {
      handler() {
        this.loadCheckoutData();
      },
      deep: true
    }
  },

  methods: {
    formatPrice(value) {
      if (value === null || value === undefined || isNaN(value)) return "$0.00";
      return "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // ===============================
    // LOAD DATA
    // ===============================

    async loadCheckoutData() {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        this.$router.push("/login");
        return;
      }

      try {
        this.loading = true;

        // ---------------------------
        // 1️⃣ LOAD ADDRESS
        // ---------------------------
        const addrRes = await fetch(
          `${process.env.VUE_APP_API_URL}/user-address`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const addrData = await addrRes.json();
        this.addresses = addrData.addresses || [];

        const defaultAddr = this.addresses.find(a => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId = defaultAddr._id;
        }

        // ---------------------------
        // 2️⃣ BUY NOW
        // ---------------------------
        if (this.$route.query.item) {
          const itemId = this.$route.query.item;
          this.qty = Number(this.$route.query.qty) || 1;

          const res = await fetch(
            `${process.env.VUE_APP_API_URL}/marketplace/${itemId}`
          );

          if (!res.ok) throw new Error("Item not found");

          this.item = await res.json();
          this.cartItems = [];
        }

        // ---------------------------
        // 3️⃣ CART CHECKOUT
        // ---------------------------
        else if (this.$route.query.ids) {
          const res = await fetch(
            `${process.env.VUE_APP_API_URL}/cart`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const data = await res.json();

          const selectedIds =
            this.$route.query.ids.split(",");

          this.cartItems =
            data.cart?.items?.filter(ci =>
              selectedIds.includes(ci._id)
            ) || [];

          this.item = null;
        }

      } catch (err) {
        console.error("Checkout load error:", err);
        alert("Failed to load checkout data");
      } finally {
        this.loading = false;
      }
    },

    // ===============================
    // PLACE ORDER
    // ===============================
    async placeOrder() {
      if (this.loading || this.isSubmitting) return;

      const token = localStorage.getItem("token");

      if (!this.selectedAddressId) {
        this.notification = {
          show: true,
          type: "error",
          message: "Please select shipping address"
        };
        return;
      }

      const addressObj = this.addresses.find(
        a => a._id === this.selectedAddressId
      );

      try {
        this.loading = true;
        this.isSubmitting = true;

        let response;
        let data;

        // ================= BUY NOW =================
        if (this.isBuyNow && this.item) {
          response = await fetch(
            `${process.env.VUE_APP_API_URL}/orders/buy-now/${this.item._id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                quantity: this.qty,
                paymentMethod: this.paymentMethod,
                note: this.orderNote,
                shippingAddress: {
                  fullName: addressObj.fullName,
                  phone: addressObj.phone,
                  address: addressObj.address
                }
              })
            }
          );
        }

        // ================= CART CHECKOUT =================
        else if (this.cartItems.length) {
          response = await fetch(
            `${process.env.VUE_APP_API_URL}/orders/checkout`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                itemIds: this.cartItems.map(i => i.item._id),
                paymentMethod: this.paymentMethod,
                note: this.orderNote,
                shippingAddress: {
                  fullName: addressObj.fullName,
                  phone: addressObj.phone,
                  address: addressObj.address
                }
              })
            }
          );
        }

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || "Order failed");
        }

        // ================= SUCCESS =================
        this.notification = {
          show: true,
          type: "success",
          message:
            this.paymentMethod === "online"
              ? "Order created. Please proceed to payment in Orders page."
              : "Order placed successfully!"
        };

        // ================= REDIRECT =================
        setTimeout(() => {
          this.$router.push("/orders");
        }, 1200);

      } catch (err) {
        this.notification = {
          show: true,
          type: "error",
          message: err.message || "Checkout failed"
        };
      } finally {
        this.loading = false;
        this.isSubmitting = false;
      }
    },

    // ===============================
    // ADDRESS
    // ===============================
    selectAddress(id) {
      this.selectedAddressId = id;
    },

    toggleMenu(id) {
      this.openMenuId =
        this.openMenuId === id ? null : id;
    },

    closeMenu() {
      this.openMenuId = null;
    },

    openEdit(address) {
      this.editingAddress = address;
      this.showEditModal = true;
    },

    updateAddresses(newList) {
      this.addresses = newList;
    },

    getImage(path) {
    if (!path) return "/no-image.png";

    // Nếu là Cloudinary hoặc URL ngoài
    if (path.startsWith("http")) {
      return path;
    }

    // Nếu là ảnh local server
    return `${process.env.VUE_APP_API_URL}/${path}`;
  },

  

  async setDefault(id) {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${process.env.VUE_APP_API_URL}/user-address/${id}/default`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      // Reload lại address
      await this.loadCheckoutData();
      this.openMenuId = null;

    } catch (err) {
      alert(err.message || "Failed to set default address");
    }
  },
 
  async removeAddress(id) {
    if (!confirm("Delete this address?")) return;

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${process.env.VUE_APP_API_URL}/user-address/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      // Update lại list
      this.addresses = this.addresses.filter(
        a => a._id !== id
      );

      this.openMenuId = null;

    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }
  
  },

  mounted() {
    document.addEventListener("click", this.closeMenu);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.closeMenu);
  }
};
</script>

<style scoped>
/* ===========================
   ✅ CHECKOUT PAGE LAYOUT
=========================== */
.checkout-page {
  max-width: 720px;
  margin: auto;
  padding: 28px 18px;
  font-family: "Inter", sans-serif;
  min-height: 100vh;
}

/* ✅ Desktop có sidebar */
@media (min-width: 1024px) {
  .checkout-page {
    padding-left: 320px;
  }
}



/* ✅ Title */
.checkout-title {
  text-align: center; margin-bottom: 24px; padding: 24px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; font-weight:600;
}

.checkout-title h2 {
  margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #1c1e21;
}

/* ===========================
   ✅ SECTION CARD
=========================== */
.checkout-section {
  background: white;
  padding: 20px;
  border-radius: 18px;
  margin-bottom: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

/* CLEAN HEADER */
.section-header-clean {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #222;
  padding-bottom: 12px;
  margin-bottom: 18px;
  border-bottom: 1px solid #eee;
}

.section-icon {
  font-size: 16px;
}

.section-text {
  letter-spacing: 0.2px;
}

.section-header {
  display: flex;
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.section-address-header-clean {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight:600;
  font-size:16px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
}

/* Button */
.small-btn {
  justify-content: space-between;
  border: 2px solid #ff642f;
  background: white;
  color: #ff642f;
  padding: 7px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  display:right;
}

.small-btn:hover {
  background: #ff642f;
  color: white;
}

/* ===========================
   ✅ ADDRESS LIST
=========================== */
.address-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Address Card */
.address-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #eee;
  transition: 0.2s;
  cursor: pointer;
}

.address-card:hover {
  border-color: #ff642f;
  background: #fff7f3;
}

.address-card.active {
  border-color: #ff642f;
  background: #fff7f3;
}

/* Main Info */
.address-main {
  display: flex;
  gap: 12px;
}

.address-main input[type="radio"] {
  accent-color: #ff5722;
  cursor: pointer;
}

/* Text */
.address-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.name {
  font-weight: 600;
  font-size: 15px;
}

.sub {
  font-size: 14px;
  color: #666;
}

/* Default Badge */
.badge {
  margin-left: 8px;
  background: #ff642f;
  color: white;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 14px;
}

/* ADDRESS SCROLL */
.address-scroll {
  max-height: 320px;        /* chiều cao tối đa */
  overflow-y: auto;
  padding-right: 6px;       /* tránh che nội dung khi có scrollbar */
}

/* Scroll đẹp hơn (optional) */
.address-scroll::-webkit-scrollbar {
  width: 6px;
}

.address-scroll::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}

.address-scroll::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* ===========================
   ✅ MENU DROPDOWN
=========================== */
.menu-wrapper {
  position: relative;
}

.menu-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px;
  color: #444;
}

.menu-btn:hover {
  color: #ff642f;
}

/* Dropdown Box */
.menu-dropdown {
  position: absolute;
  top: 34px;
  right: 0;
  width: 170px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 999;
}

/* Dropdown Item */
.menu-dropdown button {
  width: 100%;
  padding: 11px 14px;
  background: white;
  border: none;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
}

.menu-dropdown button:hover {
  background: #f8f8f8;
}

.menu-dropdown .danger {
  color: crimson;
}

.menu-dropdown .danger:hover {
  background: #ffecec;
}

/* Icon */
.icon {
  width: 16px;
  height: 16px;
}

/* ===========================
   ✅ ORDER SUMMARY
=========================== */
.order-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f1f1f1;
}

.order-item:last-child {
  border-bottom: none;
}

.product-img {
  width: 90px;
  height: 90px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid #eee;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 600;
  font-size: 15px;
}

.product-qty {
  font-size: 14px;
  color: gray;
}

.product-price {
  font-weight: bold;
  font-size: 18px;
  color: #ff642f;
}

.order-list-scroll {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 6px;
}

.order-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.order-list-scroll::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}



.order-seller-group {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.order-seller {
  font-weight: 600;
  margin-bottom: 10px;
  color: #444;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
}

.product-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 10px;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
}

.product-qty {
  font-size: 13px;
  color: #777;
}

.product-price {
  font-weight: bold;
  color: #ff5722;
}

.seller-subtotal {
  text-align: right;
  font-size: 14px;
  margin-top: 5px;
}

/* ===========================
   ✅ PAYMENT METHOD
=========================== */
.payment-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}

.payment-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  border: 1.5px solid #e5e5e5;
  cursor: pointer;
  transition: 0.2s;
  background: #fff;
}

.payment-card:hover {
  border-color: #ff5722;
}

.payment-card.active {
  border-color: #ff5722;
  background: #fff8f3;
}

.payment-info {
  display: flex;
  flex-direction: column;
}

.payment-title {
  font-weight: 600;
  font-size: 15px;
}

.payment-desc {
  font-size: 13px;
  color: #777;
  margin-top: 4px;
}

.payment-card input[type="radio"] {
  accent-color: #ff5722;
  cursor: pointer;
}

/* Order Note */
.note-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 70px;     /* thấp hơn */
  padding: 12px 14px;
  border-radius: 12px;  /* nhỏ hơn 18px */
  border: 1px solid #e5e5e5;
  font-size: 14px;
  resize: vertical;     /* cho phép kéo nếu cần */
  transition: 0.2s;
  background: #fafafa;
}

.note-input:focus {
  outline: none;
  border-color: #ff5722;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.08);
}




/* ===========================
   ✅ FOOTER TOTAL
=========================== */
.checkout-footer {
  background: white;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  margin-bottom: 16px;
  font-weight:600;
}



.total-row strong {
  color: #ff642f;
}

/* Place Order Button */
.place-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #ff642f;
  color: white;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}

.place-btn:hover {
  opacity: 0.9;
}

.place-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===========================
   ✅ MOBILE RESPONSIVE
=========================== */
@media (max-width: 600px) {
  .checkout-page {
    padding: 15px;
  }

  .checkout-title {
    font-size: 22px;
  }

  .order-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .product-img {
    width: 100%;
    height: 160px;
  }

  .address-card {
    flex-direction: column;
    gap: 12px;
  }

  .menu-wrapper {
    align-self: flex-end;
  }
}


</style>