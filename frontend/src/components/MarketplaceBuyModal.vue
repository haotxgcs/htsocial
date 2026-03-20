<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">

      <div class="modal-header">
        <h2 class="header-title">Select Quantity</h2>

        <button class="header-close" @click="closeModal">
          <X />
        </button>
      </div>


      <!-- ITEM INFO -->
       <div class="item-content">
      <div class="item-info">
        <img :src="getItemImage(item.images)" class="item-img" />

        <div class="item-text">
          <p class="title">{{ item.title }}</p>
          <p class="price">{{ formatPrice(item.price) }}</p>
          <p class="stock">Quantity: {{ item.quantity }}</p>
          <p class="condition" v-if="item.type === 'tool'">Condition: {{ item.condition }}</p>
        </div>
      </div>
      </div>
      <!-- QUANTITY CONTROL -->
      <div class="qty-control">
        <button class="qty-btn" @click="decrease"><Minus size="16px"/></button>

        <input
          v-model.number="qty"
          type="number"
          min="1"
          :max="item.quantity"
          class="qty-input"
        />

        <button class="qty-btn" @click="increase"><Plus size="16px"/></button>
      </div>

      <!-- ✅ TOTAL PRICE -->
      <div class="total-row">
        <span>Total:</span>
        <strong>{{ formatPrice(totalPrice) }}</strong>
      </div>


      <!-- ACTION BUTTON (ONLY ONE) -->
      <button
        class="main-btn"
        :class="mode"
        @click="confirm"
        :disabled="!canSubmit"
      >
        <ShoppingCart v-if="mode === 'cart'" class="btn-icon" />
        <Zap v-else class="btn-icon" />

        {{ mode === "cart" ? "Add to Cart" : "Buy Now" }}
      </button>


    </div>
  </div>
</template>

<script>
import { ShoppingCart, Zap, X,Minus, Plus } from "lucide-vue-next";

export default {
  name: "MarketplaceBuyModal",
  components: {
    ShoppingCart,
    Zap,
    X,
    Minus,
    Plus
  },
  props: {
    item: Object,

    // ✅ NEW: mode decides which button to show
    mode: {
      type: String,
      default: "cart" // "cart" or "buy"
    }
  },

  data() {
    return {
      qty: 1
    };
  },

  methods: {
    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `${process.env.VUE_APP_API_URL}/${img}`;
    },

    increase() {
      if (this.qty < this.item.quantity) this.qty++;
    },

    decrease() {
      if (this.qty > 1) this.qty--;
    },

    confirm() {
      this.$emit("confirm", {
        type: this.mode,
        quantity: this.qty
      });
    },

    closeModal() {
      this.$emit("close");

    },

    formatPrice(price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);
    },
  },

  computed: {
    // ✅ Total price realtime
    totalPrice() {
      return (this.qty * this.item.price).toFixed(2);
    },

    // ✅ Disable button if qty invalid
    canSubmit() {
      return (
        this.qty >= 1 &&
        this.qty <= this.item.quantity
      );
    }
  },

  watch: {
    qty(val) {
      if (val > this.item.quantity) {
        this.qty = this.item.quantity;
      }
      if (val < 1) {
        this.qty = 1;
      }
    }
  },


};
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box;
}

.modal-box {
  background: white;
  width: 420px;
  padding: 20px;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modal-header {
  height: 64px;
  border-bottom: 1px solid #eee;

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
}

/* Title nằm đúng giữa */
.header-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

/* ❌ Button chuẩn như modal comment */
.header-close {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);

  width: 38px;
  height: 38px;
  border-radius: 50%;

  border: none;
  background: #f1f3f5;
  color: #444;

  font-size: 20px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: 0.2s;
}

.header-close:hover {
  background: #e5e7eb;
}




/* .close-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);

  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #f1f3f5;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
} */
.close-btn { background: #f0f2f5; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 20px; color: #606770; display: flex; align-items: center; justify-content: center; cursor: pointer; position: absolute; right: 24px; top: 50%; transform: translateY(-50%); }

.close-btn svg {
  width: 18px;
  height: 18px;
  color: #555;
}

.close-btn:hover {
  background: #e5e7eb;
}

.item-content{
  padding: 20px 0;
}


/* ITEM INFO */
.item-info {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.item-img {
  width: 90px;
  height: 90px;
  border-radius: 14px;
  object-fit: cover;
}

.item-text .title {
  font-weight: bold;
  font-size: 18px;
}

.item-text .price {
  color: #ff642f;
  font-weight: bold;
}

.item-text .stock, .condition {
  font-size: 13px;
  color: gray;
}

/* QUANTITY */
.qty-control {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
}

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

.qty-input {
  width: 40px;
  text-align: center;
  font-size: 16px;
  font-weight:600;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 6px;
}

/* MAIN BUTTON */
.main-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}


/* MODE STYLES */
.main-btn.cart {
  background: white;
  border: 2px solid #ff642f;
  color: #ff642f;
}

.main-btn.buy {
  background: #ff642f;
  color: white;
}

/* ✅ Total Price */
.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;

  font-size: 16px;
  font-weight: 600;
}

.total-row strong {
  color: #ff642f;
  font-size: 18px;
}

</style>