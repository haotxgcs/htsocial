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
              :src="getItemImage(cartItem.item?.images)"
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
                {{ formatPrice(cartItem.item.price) }}
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
              {{ formatPrice(cartItem.item.price * cartItem.quantity) }}
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
              {{formatPrice(
                group.items
                  .filter(i => selectedItems.includes(i._id))
                  .reduce((sum, i) => sum + i.item.price * i.quantity, 0)
              )}}
            </span>
          </div>
          

        </div>

        <!-- FOOTER -->
        <div class="cart-footer">

          <div class="cart-total">
            Total:
            <span>{{ formatPrice(totalPrice) }}</span>
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
import LoadingOverlay from "../layout/LoadingOverlay.vue"
import ConfirmDialog from "../common/ConfirmDialog.vue"
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
        if (!item.item || !item.item.seller) return;
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
    },

    formatPrice(price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);
    },

    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `${process.env.VUE_APP_API_URL}/${img}`;
    },
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
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background-color 0.3s ease;
}

.cart-container {
  max-width: 1100px;
  margin: auto;
}

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
  margin: 0; 
  font-size: 28px; 
  font-weight: 800; 
  color: var(--text-main);
}

.item-count {
    margin: 0; 
    font-size: 14px; 
    color: var(--primary); 
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
  color: var(--text-sub);
}

.select-all input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
}

/* ========================
   GROUP (SELLER BLOCK)
======================== */
.cart-group {
  background: var(--bg-card);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.cart-seller {
  padding: 15px 20px;
  font-weight: 700;
  background: var(--bg-input);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-main);
}

.cart-seller input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
}

.seller-info:hover {
  text-decoration: underline;
  cursor: pointer;
  color: var(--primary);
}

/* ========================
   ITEM ROW
======================== */
.cart-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}

.cart-item input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
}

.cart-item--oos {
  background: var(--bg-input);
  opacity: 0.7;
}

.oos-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #e74c3c; /* Giữ màu đỏ cho trạng thái hết hàng */
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.item-price--oos {
  text-decoration: line-through;
  color: var(--text-sub);
}

.qty-control--oos {
  opacity: 0.3;
  pointer-events: none;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-img {
  width: 75px;
  height: 75px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--bg-input);
}

.item-info {
  flex: 1;
}

.item-title {
  font-weight: 600;
  margin-bottom: 6px;
  cursor: pointer;
  color: var(--text-main);
}

.item-title:hover {
  color: var(--primary);
}

.item-price {
  font-size: 14px;
  color: var(--text-sub);
}

/* ITEMS SCROLL */
.seller-items-scroll {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 6px;
}

.seller-items-scroll::-webkit-scrollbar {
  width: 5px;
}

.seller-items-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}

/* ========================
   QUANTITY
======================== */
.qty-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qty-btn:hover {
  background: var(--hover-bg);
  border-color: var(--primary);
  color: var(--primary);
}

.qty-btn:active {
  transform: scale(0.9);
}

.qty-number {
  min-width: 35px;
  text-align: center;
  font-weight: 700;
  font-size: 15px;
  color: var(--text-main);
}

.item-total {
  font-weight: 700;
  min-width: 90px;
  text-align: right;
  color: var(--primary);
}

/* ========================
   SELLER SUBTOTAL
======================== */
.seller-total {
  padding: 12px 20px;
  text-align: right;
  font-weight: 700;
  background: var(--bg-input);
  color: var(--text-main);
  border-top: 1px solid var(--border-color);
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
  font-weight: 500;
}

.remove-btn:hover {
  text-decoration: underline;
  opacity: 0.8;
}

/* ========================
   FOOTER
======================== */
.cart-footer {
  position: sticky;
  bottom: 10px;
  margin-top: 30px;
  padding: 20px 30px;
  background: var(--bg-card);
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color);
  z-index: 100;
}

.cart-total {
  color: var(--text-main);
  font-weight: 600;
}

.cart-total span {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  margin-left: 8px;
}

.checkout-btn {
  padding: 14px 40px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 100, 47, 0.2);
}

.checkout-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 6px 15px rgba(255, 100, 47, 0.3);
}

.checkout-btn:disabled {
  background: var(--text-sub) !important;
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* ========================
   EMPTY
======================== */
.empty-cart {
  text-align: center;
  padding: 80px 40px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  color: var(--text-sub);
}

.browse-btn { 
  background: var(--primary); 
  color: white; 
  border: none; 
  padding: 12px 30px; 
  border-radius: 30px; 
  cursor: pointer; 
  font-weight: 700; 
  margin-top: 20px; 
  transition: all 0.2s; 
}

/* ========================
   RESPONSIVE
======================== */
@media (max-width: 1024px) {
  .cart-wrapper {
    margin-left: 0;
    padding: 100px 16px 40px;
  }
}

@media (max-width: 768px) {
  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .item-img {
    width: 100%;
    height: 180px;
  }

  .item-total {
    text-align: left;
    width: 100%;
  }

  .cart-footer {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    bottom: 0;
    border-radius: 0;
  }
  
  .checkout-btn {
    width: 100%;
  }
}
</style>