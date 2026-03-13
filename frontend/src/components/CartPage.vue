<template>
  <div class="cart-wrapper">
    <div class="cart-container">

      <div class="page-title">
        <h2>My Cart</h2>
        <span class="item-count">
            {{ cartItems.length }} {{ cartItems.length === 1 ? 'item': 'items' }} 
          </span>
      </div>
    

      <LoadingOverlay v-if="loading" />

      <div v-if="!loading && cartItems.length === 0" class="empty-cart">
        <h2>Your cart is empty.</h2>
        <button @click="$router.push('/marketplace')" class="browse-btn">Shop Now</button>
        
      </div>

      <div v-else>

        <!-- SELECT ALL -->
        <div class="cart-header">
          <label class="select-all">
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
            />
            Select All
          </label>

          
        </div>

        <!-- GROUP BY SELLER -->
        <div
          v-for="group in groupedCart"
          :key="group.seller?._id || group.seller?.firstname"
          class="cart-group"
        >

          <!-- SELLER HEADER -->
          <div class="cart-seller">
            <label>
              <input
                type="checkbox"
                :checked="isSellerSelected(group)"
                @change="toggleSeller(group)"
              />
              Seller:
              <strong @click="$router.push(`/profile/${group.seller._id}`)" class="seller-info">
                {{ group.seller.firstname }} {{ group.seller.lastname }}
              </strong>
            </label>
          </div>


          <div class="seller-items-scroll">
          <!-- ITEMS -->
          <div
            v-for="cartItem in group.items"
            :key="cartItem._id"
            class="cart-item"
            :class="{ 'cart-item--oos': cartItem.item.quantity === 0 }"
          >

            <!-- CHECKBOX -->
            <input
              type="checkbox"
              :value="cartItem._id"
              v-model="selectedItems"
              :disabled="cartItem.item.quantity === 0"
            />

            <!-- IMAGE -->
            <img
              :src="cartItem.item.images?.[0] || '/no-image.png'"
              class="item-img"
              @click="$router.push(`/marketplace/${cartItem.item._id}`)"
            />

            <!-- INFO -->
            <div class="item-info">
              <div
                class="item-title"
                @click="$router.push(`/marketplace/${cartItem.item._id}`)"
              >
                {{ cartItem.item.title }}
              </div>
              <span v-if="cartItem.item.quantity === 0" class="oos-badge">Out of Stock</span>
              <div class="item-price" :class="{ 'item-price--oos': cartItem.item.quantity === 0 }">
                ${{ cartItem.item.price }}
              </div>
            </div>

            <!-- QUANTITY -->
            <div class="qty-control" :class="{ 'qty-control--oos': cartItem.item.quantity === 0 }">
              <button
                class="qty-btn"
                :disabled="cartItem.item.quantity === 0"
                @click="decreaseQty(cartItem)"
              >
                <Minus size="16" />
              </button>

              <div class="qty-number">
                {{ cartItem.quantity }}
              </div>

              <button
                class="qty-btn"
                :disabled="cartItem.item.quantity === 0"
                @click="increaseQty(cartItem)"
              >
                <Plus size="16" />
              </button>
            </div>

            <!-- ITEM TOTAL -->
            <div class="item-total">
              ${{ cartItem.item.price * cartItem.quantity }}
            </div>

            <!-- REMOVE -->
            <button
              class="remove-btn"
              @click="removeItem(cartItem.item._id)"
            >
              Remove
            </button>

          </div>
          </div>

          <!-- SELLER SUBTOTAL (ONLY SELECTED ITEMS) -->
          <div class="seller-total">
            Subtotal:
            <span>
              ${{
                group.items
                  .filter(i => selectedItems.includes(i._id))
                  .reduce((sum, i) => sum + i.item.price * i.quantity, 0)
              }}
            </span>
          </div>
          

        </div>

        <!-- FOOTER -->
        <div class="cart-footer">

          <div class="cart-total">
            Total:
            <span>${{ totalPrice }}</span>
          </div>

          <button
            class="checkout-btn"
            :disabled="selectedItems.length === 0 || hasOosSelected"
            @click="checkout"
          >
            <span v-if="hasOosSelected">Remove out-of-stock items to checkout</span>
            <span v-else>Checkout ({{ selectedItems.length }})</span>
          </button>

        </div>
        

      </div>
      <ConfirmDialog 
        v-if="confirmDialog.visible"
        :message="confirmDialog.message"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </div>
      
      

    
  </div>
</template>

<script>
import LoadingOverlay from "./LoadingOverlay.vue"
import ConfirmDialog from "./ConfirmDialog.vue"
import { Plus, Minus } from "lucide-vue-next"

export default {
  name: "CartPage",

  components: {
    LoadingOverlay,
    ConfirmDialog,

    Plus,
    Minus
  },

  data() {
    return {
      cartItems: [],
      selectedItems: [],
      loading: false,

      confirmDialog: {
        visible: false,
        title: "",
        message: "",
        onConfirm: null
      }
    }
  },

  mounted() {
    this.fetchCart()
  },

  computed: {

    // =========================
    // GROUP BY SELLER
    // =========================
    groupedCart() {
      const groups = {}

      this.cartItems.forEach(item => {
        const sellerId = item.item?.seller?._id

        if (!groups[sellerId]) {
          groups[sellerId] = {
            seller: item.item.seller,
            items: []
          }
        }

        groups[sellerId].items.push(item)
      })

      return Object.values(groups)
    },

    // =========================
    // TOTAL PRICE (SELECTED)
    // =========================
    totalPrice() {
      return this.cartItems
        .filter(i => this.selectedItems.includes(i._id))
        .reduce((sum, i) => sum + i.item.price * i.quantity, 0)
    },

    // =========================
    // OUT OF STOCK IN SELECTION
    // =========================
    hasOosSelected() {
      return this.cartItems
        .filter(i => this.selectedItems.includes(i._id))
        .some(i => i.item.quantity === 0);
    },

    // =========================
    // CHECK IF ALL SELECTED
    // =========================
    isAllSelected() {
      return (
        this.cartItems.length > 0 &&
        this.selectedItems.length === this.cartItems.length
      )
    }
  },

  methods: {

    // =========================
    // FETCH CART
    // =========================
    async fetchCart() {
      this.loading = true
      const token = localStorage.getItem("token")

      try {
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/cart`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await res.json()
        this.cartItems = data.cart?.items || []

        // Reset selected items nếu item không còn tồn tại
        this.selectedItems = this.selectedItems.filter(id =>
          this.cartItems.some(item => item._id === id)
        )

      } catch (err) {
        console.error("Cart load error:", err)
      } finally {
        this.loading = false
      }
    },

    // =========================
    // SELECT ALL
    // =========================
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedItems = []
      } else {
        this.selectedItems = this.cartItems.map(i => i._id)
      }
    },

    // =========================
    // SELLER SELECT
    // =========================
    isSellerSelected(group) {
      return group.items.every(i =>
        this.selectedItems.includes(i._id)
      )
    },

    toggleSeller(group) {
      const ids = group.items.map(i => i._id)

      if (this.isSellerSelected(group)) {
        this.selectedItems = this.selectedItems.filter(
          id => !ids.includes(id)
        )
      } else {
        this.selectedItems = [
          ...new Set([...this.selectedItems, ...ids])
        ]
      }
    },

    // =========================
    // UPDATE QUANTITY
    // =========================
    async increaseQty(cartItem) {
      await this.updateQuantity(
        cartItem.item._id,
        cartItem.quantity + 1
      )
    },

    async decreaseQty(cartItem) {
      if (cartItem.quantity > 1) {
        await this.updateQuantity(
          cartItem.item._id,
          cartItem.quantity - 1
        )
      }
    },

    async updateQuantity(itemId, quantity) {
      const token = localStorage.getItem("token")

      await fetch(
        `${process.env.VUE_APP_API_URL}/cart/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ itemId, quantity })
        }
      )

      await this.fetchCart()
    },

    removeItem(cartItemId) {
      this.confirmDialog.visible = true
      this.confirmDialog.message =
        "Are you sure you want to remove this item from your cart?"

      this.confirmDialog.onConfirm = async () => {
        await this.handleRemoveItem(cartItemId)
      }
    },

    async handleConfirm() {
      const action = this.confirmDialog.onConfirm

      this.confirmDialog.visible = false
      this.confirmDialog.onConfirm = null

      if (action) {
        await action()
      }
    },

    handleCancel() {
      this.confirmDialog.visible = false
      this.confirmDialog.onConfirm = null
    },

    // =========================
    // REMOVE ITEM
    // =========================
    async handleRemoveItem(cartItemId) {
      const token = localStorage.getItem("token")

      await fetch(
        `${process.env.VUE_APP_API_URL}/cart/${cartItemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      this.selectedItems = this.selectedItems.filter(
        id => id !== cartItemId
      )

      await this.fetchCart()
    },

    async checkout() {
      if (this.selectedItems.length === 0) return;

      this.$router.push({
        path: "/checkout",
        query: {
          ids: this.selectedItems.join(",")
        }
      });
    }

  }
}
</script>

<style scoped>

/* ========================
   LAYOUT
======================== */

.cart-wrapper {
  margin-left: 280px;
  padding: 100px 40px;
  min-height: 100vh;
}

.cart-container {
  max-width: 1100px;
  margin: auto;
}

.page-title {
text-align: center; margin-bottom: 24px; padding: 24px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; font-weight: 600;
}

.page-title h2 {
  margin: 0; font-size: 28px; font-weight: 800; color: #1c1e21;
}

.item-count {
    margin: 0; 
    font-size: 14px; 
    color: #FF642F; 
    font-weight: 500;
}

/* ========================
   HEADER
======================== */

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.select-all input[type="checkbox"] {
  accent-color: #ff5722;
  cursor: pointer;
}

/* ========================
   GROUP (SELLER BLOCK)
======================== */

.cart-group {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}

.cart-seller {
  padding: 15px 20px;
  font-weight: 600;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-seller input[type="checkbox"] {
  accent-color: #ff5722;
  cursor: pointer;
}

.seller-info:hover {
  text-decoration: underline;
  cursor: pointer;
}

/* ========================
   ITEM ROW
======================== */

.cart-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.cart-item input[type="checkbox"] {
  accent-color: #ff5722;
  cursor: pointer;
}

.cart-item--oos {
  background: #fafafa;
  opacity: 0.75;
}

.oos-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #e74c3c;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
}

.item-price--oos {
  text-decoration: line-through;
  color: #bbb;
}

.qty-control--oos {
  opacity: 0.35;
  pointer-events: none;
}

.checkout-btn:disabled {
  background: #ccc !important;
  cursor: not-allowed;
  font-size: 13px;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-img {
  width: 75px;
  height: 75px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  flex: 1;
}

.item-title {
  font-weight: 600;
  margin-bottom: 6px;
  cursor: pointer;
}

.item-title:hover {
  color: #ff642f;
}

.item-price {
  font-size: 14px;
  color: #777;
}

/* ITEMS SCROLL */
.seller-items-scroll {
  max-height: 260px;       /* giới hạn chiều cao mỗi seller */
  overflow-y: auto;
  padding-right: 6px;
}

/* Scroll bar đẹp hơn */
.seller-items-scroll::-webkit-scrollbar {
  width: 6px;
}

.seller-items-scroll::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}

.seller-items-scroll::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}


/* ========================
   QUANTITY
======================== */

/* ===== QTY CONTROL ===== */
.qty-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Nút + - */
.qty-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qty-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.qty-btn:active {
  transform: scale(0.95);
}

/* Số lượng */
.qty-number {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: 15px;
}

.item-total {
  font-weight: 600;
  min-width: 90px;
  text-align: right;
}

/* ========================
   SELLER SUBTOTAL
======================== */

.seller-total {
  padding: 12px 20px;
  text-align: right;
  font-weight: 600;
  background: #fafafa;
}

/* ========================
   REMOVE
======================== */

.remove-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 13px;
}

.remove-btn:hover {
  text-decoration: underline;
}

/* ========================
   FOOTER
======================== */

.cart-footer {
  position: sticky;
  bottom: 0;
  margin-top: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.cart-total span {
  font-size: 20px;
  font-weight: 700;
  color: #ff642f;
}

.checkout-btn {
  padding: 12px 32px;
  background: #ff642f;
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.checkout-btn:hover {
  opacity: 0.9;
}

/* ========================
   EMPTY
======================== */

.empty-cart {
  text-align: center;
  padding: 60px;
  background: #fff;
  border-radius: 12px;
}

.browse-btn { background: #FF642F; color: white; border: none; padding: 12px 24px; border-radius: 20px; cursor: pointer; font-weight: 600; margin-top: 16px; transition: 0.2s; }

/* ========================
   RESPONSIVE
======================== */

@media (max-width: 992px) {

  .cart-wrapper {
    margin-left: 0;
    padding: 100px 20px;
  }

  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .item-img {
    width: 100%;
    height: auto;
  }

  .item-total {
    text-align: left;
  }

  .cart-footer {
    flex-direction: column;
    gap: 15px;
  }
}

</style>