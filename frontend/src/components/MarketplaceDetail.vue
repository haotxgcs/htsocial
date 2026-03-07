<template>
    <div class="marketplace-detail-page">

      <div class="detail-wrapper">
        <div class="detail-content">
        
    <!-- LOADING -->
  <LoadingOverlay v-if="isLoading" />
  
  <!-- DELETED ITEM MESSAGE -->
  <div v-if="isDeleted" class="deleted-item-box">
    <h2>Item is no longer available</h2>
    <p>This item has been removed by the seller.</p>

    <button class="back-btn" @click="$router.push('/marketplace')">
      Back to Marketplace
    </button>
  </div>

  <!-- CONTENT -->
  <div v-else-if="item">
    <!-- BREADCRUMB -->
    <div class="detail-header">
        <div class="breadcrumb">
        <span @click="$router.push('/marketplace')">Marketplace</span>
        <span> / </span>
        <span
          v-if="item"
          class="breadcrumb-title"
          :title="item.title"
        >
          {{ item.title }}
        </span>

        </div>
    </div>

<div class="marketplace-detail">
<div class="image-block">
  <div class="image-wrapper">
    <img
      :src="currentImage"
      alt="item image"
      @click="openFullscreen"
    />

    <!-- ARROW LEFT -->
    <button
      v-if="hasMultipleImages"
      class="nav-arrow left"
      @click.stop="prevImage"
    >
      ‹
    </button>

    <!-- ARROW RIGHT -->
    <button
      v-if="hasMultipleImages"
      class="nav-arrow right"
      @click.stop="nextImage"
    >
      ›
    </button>


    <!-- THUMBNAILS OVERLAY -->
<div
  class="thumbnails-overlay"
  v-if="item?.images?.length > 1"
>
  <div class="thumbnail-strip">
    <img
      v-for="(img, i) in item.images"
      :key="i"
      :src="imageFromPath(img)"
      :class="{ active: i === currentIndex }"
      @click.stop="currentIndex = i"
    />
  </div>
</div>

  </div>
</div>



  <!-- INFO -->
  <div class="info">
    <h1 class="item-title" :title="item.title">{{ item.title }}</h1>

    <p class="price">{{ formatPrice(item.price) }}</p>

    <p class="quantity" v-if="item.quantity > 0">Quantity: {{ item.quantity }}</p>

    <p class="sold-out" v-if="item.quantity === 0">Sold Out</p>

    <p class="condition" v-if="item.type === 'tool'">Condition: {{ item.condition }}</p>

    <!-- ACTION BUTTONS -->
    <div v-if="!isOwner" class="buyer-actions">

      <button class="cart-btn" @click="openModal('cart')" :disabled="item.quantity === 0">
        <ShoppingCart class="icon" />
        Add to Cart
      </button>

      <button class="buy-btn" @click="openModal('buy')" :disabled="item.quantity === 0">
        <Zap class="icon" />
        Buy Now
      </button>



    </div>


    

    <p class="type">{{ typeLabel }}</p>



      <!-- SELLER INFO (CHỈ HIỆN KHI KHÔNG PHẢI OWNER) -->
  <div class="seller-row" v-if="!isOwner">
    <div class="seller-info">
      <img
        v-if="item.seller?.avatar"
        :src="imageFromPath(item.seller.avatar)"
        class="avatar"
      />
      <span class="seller-name">
      {{ item.seller?.firstname }} {{ item.seller?.lastname }}
    </span>
    </div>
    

    <!-- ACTION BUTTON -->
  <button
    v-if="!isOwner"
    class="chat-btn"
    @click="onChat"
  >
    <MessageCircle class="icon" />
    Chat with Seller
  </button>

  </div>

  

<!-- OWNER ACTIONS -->
  <div v-if="isOwner" class="owner-actions">
    <button class="edit-btn" @click="openEditModal">
      Edit Item
    </button>

    <MarketplaceEditModal
  :isVisible="showEditModal"
  :item="item"
  :user="currentUser"
  @close="showEditModal = false"
  @updated="onItemUpdated"
/>



    <button class="delete-btn" @click="onDelete">
      Delete Item
    </button>
  </div>

  </div>



  
</div>

    <div class="info info-extra">
  <p class="description">
    <strong>Description:</strong><br><br>
    
    {{ item.description || "No Description." }}
  </p>
</div>

<div class="info info-extra">
  <strong>Rating</strong>
  <span style="font-style:italic">⭐⭐⭐⭐⭐ 5/5 (999 ratings)</span>

  <button>Write a review</button>

</div>


    <!-- FULLSCREEN IMAGE -->
    <div
      class="fullscreen"
      v-if="showFullscreen"
      @click="closeFullscreen"
    >
      <img :src="currentImage" />

      <!-- ARROWS -->
      <button
        v-if="hasMultipleImages"
        class="nav-arrow left"
        @click.stop="prevImage"
      >
        ‹
      </button>

      <button
        v-if="hasMultipleImages"
        class="nav-arrow right"
        @click.stop="nextImage"
      >
        ›
      </button>
    </div>
  </div>
      </div>
    </div>

    <MarketplaceBuyModal
      v-if="showBuyModal"
      :item="item"
      :mode="modalMode"
      @close="showBuyModal = false"
      @confirm="handleBuyAction"
    />

  </div>
</template>


<script>
import axios from "axios";
import LoadingOverlay from "../components/LoadingOverlay.vue";
import MarketplaceEditModal from "../components/MarketplaceEditModal.vue";
import MarketplaceBuyModal from "../components/MarketplaceBuyModal.vue";
import {
  ShoppingCart,
  Zap,
  MessageCircle
} from "lucide-vue-next";



export default {
  name: "MarketplaceDetail",
  components: {
    LoadingOverlay,
    MarketplaceEditModal,
    MarketplaceBuyModal,

    ShoppingCart,
    Zap,
    MessageCircle
  },

  data() {
    return {
      item: null,
      currentIndex: 0,
      showFullscreen: false,
      isLoading:true,

      showEditModal: false,

      isDeleted: false,

      showBuyModal: false,

      modalMode: "cart"


    };
  },

  async created() {
    this.isLoading = true;
    try {
      const res = await axios.get(
        `http://localhost:3000/marketplace/${this.$route.params.id}`
      );
      this.item = res.data;

      if (res.data?.isDeleted === true || res.data?.status === "hidden") {
        this.isDeleted = true;
      }
    } catch (err) {
      console.error(
        "DETAIL ERROR:",
        err.response?.status,
        err.response?.data
      );
    } finally {
      this.isLoading = false; // 👈 TẮT LOADING
    }
  },

  computed: {

    currentUser() {
      return JSON.parse(localStorage.getItem("user"));
    },

    currentImage() {
      if (!this.item?.images?.length) {
        return "/no-image.png";
      }

      const img = this.item.images[this.currentIndex];

      // ✅ Cloudinary URL
      if (img.startsWith("http")) {
        return img;
      }

      // ✅ Local image
      return `http://localhost:3000/${img}`;
    },


    isOwner(){
      const user = JSON.parse(localStorage.getItem("user"));
      if(!user || !this.item?.seller) return false;

      return (
        this.item.seller._id === (user._id || user.id)
      );
    },

    hasMultipleImages() {
      return this.item?.images?.length > 1;
    },

    typeLabel() {
    const map = {
      ingredient: "Ingredients",
      dish: "Dishes",
      tool: "Tools"
    };
    return map[this.item.type] || "Item";
  },

  },

  methods: {
    imageFromPath(path) {
      if (!path) return "/no-image.png";

      // ✅ Nếu cloudinary URL
      if (path.startsWith("http")) {
        return path;
      }

      // ✅ Nếu local
      return `http://localhost:3000/${path}`;
    },


    formatPrice(price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);
    },

    openFullscreen() {
      this.showFullscreen = true;
    },

    closeFullscreen() {
      this.showFullscreen = false;
    },
    
    openEditModal() {
    this.showEditModal = true;
  },

  async onItemUpdated() {
  this.showEditModal = false;
  this.isLoading = true;

  const res = await axios.get(
    `http://localhost:3000/marketplace/${this.$route.params.id}`
  );

  this.item = res.data;
  this.isLoading = false;
},

  async onDelete() {
  if (!confirm("Bạn chắc chắn muốn xóa item này?")) return;

  try {
    await axios.delete(
      `http://localhost:3000/marketplace/${this.item._id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    this.$router.push("/marketplace");
  } catch (err) {
    alert("Xóa item thất bại");
    console.error(err);
  }
},

    
    
    onChat() {
    // Sau này có thể redirect sang chat page
    alert("Open chat (UI only)");
  },


    nextImage() {
      if (!this.item?.images?.length) return;
      this.currentIndex =
        (this.currentIndex + 1) % this.item.images.length;
    },

    prevImage() {
      if (!this.item?.images?.length) return;
      this.currentIndex =
        (this.currentIndex - 1 + this.item.images.length) %
        this.item.images.length;
    },

    async handleBuyAction({ type, quantity }) {
      this.showBuyModal = false;

      const token = localStorage.getItem("token");
      if (!token) return alert("Login first");

      if (type === "cart") {
        await axios.post(
          "http://localhost:3000/cart/add",
          {
            itemId: this.item._id,
            quantity
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        alert("✅ Added to cart!");
      }

      if (type === "buy") {
        // this.$router.push(`/checkout?item=${this.item._id}&qty=${quantity}`);
        this.$router.push({
          path: "/checkout",
          query: {
            item: this.item._id,
            qty: quantity
          }
        });
      }
    },

    openModal(mode) {
    this.modalMode = mode;
    this.showBuyModal = true;
  }


  },
};
</script>


<style scoped>
:root {
  --orange-main: #f97316;
  --orange-dark: #ea580c;
  --orange-light: #fff7ed;
  --gray-text: #6b7280;
}



.marketplace-detail-page {
  height:auto;
  min-height:100vh;
  padding-top: 72px;          /* header top */
  background: #fdf4f0;
 
}

.detail-wrapper {

  padding: 0 32px;
  margin-left:300px;
  margin-bottom:40px;
}

.detail-content {
  max-width: 1200px;     /* desktop rộng, nhìn đã */


  
}



.marketplace-detail {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  align-items: stretch; /* 👈 QUAN TRỌNG */
}


.image-block {
  width: 100%;
}

.image-wrapper {
  position: relative;              /* BẮT BUỘC */
  width: 100%;
  height: 420px;
  overflow: hidden;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  cursor: zoom-in;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  width: 44px;
  height: 44px;
  border-radius: 50%;

  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);

  color: white;
  font-size: 28px;
  font-weight: 500;

  border: none;
  cursor: pointer;
  z-index: 5;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: all 0.2s ease;
}

.nav-arrow:hover {
  background: rgba(0,0,0,0.65);
  transform: translateY(-50%) scale(1.05);
}

.nav-arrow.left {
  left: 12px;
}

.nav-arrow.right {
  right: 12px;
}


.thumbnails-overlay {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);

  max-width: calc(100% - 32px);
  padding: 10px 16px;

  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(6px);
  border-radius: 14px;

}


.thumbnails-overlay img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.6;
  flex-shrink: 0;
  transition: all 0.2s ease;
}





.thumbnail-strip {
  
  display: flex;
  gap: 16px;                 /* 👈 GIÃN RA Ở ĐÂY */
  padding:4px;
  justify-content: center;
  overflow-x: auto;

  scrollbar-width: none;
}

.thumbnail-strip::-webkit-scrollbar {
  display: none;
}

.thumbnail-strip img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.6;
  flex-shrink: 0;
  transition: all 0.2s ease;
  background-color:white;
}   

.thumbnail-strip img:hover,
.thumbnail-strip img.active {
  opacity: 1;
  box-shadow: 0 0 0 2px #FF642F;
}




.info {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
  

  display: flex;
  flex-direction: column;

}

.info-extra {
  margin-top: 24px;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);

  display: flex;
  flex-direction: column;
  gap: 16px;
}




.info h1 {
  font-size: 26px;
  margin-bottom: 10px;
  font-weight: 600;
}

.item-title {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
  max-height: 370px;    /* 👈 GIỚI HẠN CHIỀU CAO */

  display: -webkit-box;
  -webkit-line-clamp: 2;     /* 👈 GIỚI HẠN 2 DÒNG */
  -webkit-box-orient: vertical;

  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.item-title {
  position: relative;
}

.item-title:hover::after {
  content: attr(title);
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 6px;

  background: #111;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;

  white-space: normal;
  max-width: 300px;
  z-index: 10;
}


.price {
  font-size: 22px;
  font-weight: 700;
  color: #ff642f;
  margin-bottom: 14px;
}


.quantity, .condition {
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  margin-bottom: 8px;
}

.sold-out{
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  margin-bottom: 8px;
  color:#ff4d4f;
}

.buyer-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cart-btn {
  flex: 1;
  background: #fff;
  border: 2px solid #ff642f;
  color: #ff642f;
  padding: 12px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}

.cart-btn:disabled {
  background: #ffe5d9;
  border-color: #ffb3a2;
  color: #ffb3a2;
  cursor: not-allowed;
}

.buy-btn {
  flex: 1;
  background: #ff642f;
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}

.buy-btn:disabled {
  background: #ffb3a2;
  cursor: not-allowed;
}

.type{
  position: right;
  display: inline-block;
  top: 8px;
  left: 8px;
  width:fit-content;
  background: #ff642f;
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.description {
  margin: 16px 0;
  line-height: 1.5;
  white-space:pre-line;

}

.seller {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eae9e9;
}

.seller span {
  font-weight: 500;
}


/* .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
} */

.loading {
  text-align: center;
  margin-top: 60px;
}

.detail-header {
  color:#FF642F;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.breadcrumb {
  margin-bottom: 16px;
  font-size: 14px;
 margin-left:0;
}

.breadcrumb span:first-child {
  cursor: pointer;
  color: #FF642F;
  font-weight: 500;
}

.breadcrumb span:first-child:hover {
  text-decoration: underline;
}

.breadcrumb-title{
  max-width: 370px;
  display: inline-block;
  vertical-align: bottom;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}








.fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.fullscreen img {
  max-width: 90%;
  max-height: 90%;
  background:white;
}

.fullscreen .nav-arrow {
  background: rgba(255,255,255,0.15);
  color: white;
}

.fullscreen .nav-arrow:hover {
  background: rgba(255,255,255,0.3);
}


/* .chat-btn {
  margin-top: auto;
  padding: 12px;
  width: 50%;
  background: #fdf4f0;
  color: black;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.chat-btn:hover {
   background: #ff642f;
   color:white;
} */

.owner-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-btn {
  margin-top: auto;
  padding: 12px;
  width: 100%;
  background: #fdf4f0;
  color: black;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.edit-btn:hover {
   background: #ff642f;
   color:white;
}

.delete-btn{
  margin-top: auto;
  padding: 12px;
  width: 100%;
  background: #ffdddd;
  color: #ff4d4f;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.delete-btn:hover {
   background: #ff4d4f;
   color:white;
}

/* Deleted item style */
.deleted-item-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
}

.deleted-item-box h2 {
  color: #ff4d4f;
  margin-bottom: 12px;
}

.deleted-item-box p {
  font-style: italic;
  color: #666;
  margin-bottom: 24px;
}

.back-btn {
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  background: #ff642f;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

/* ✅ Seller Row */
.seller-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 22px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

/* ✅ Seller Info */
.seller-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seller-name {
  font-weight: 600;
  font-size: 15px;
}

/* ✅ Avatar */
.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

/* ✅ Chat Button */
.chat-btn {
  padding: 9px 15px;
  border-radius: 10px;
  border: 1px solid #ff642f;
  background: white;
  color: #ff642f;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.chat-btn:hover {
  background: #ff642f;
  color: white;
}

/* ✅ Action Buttons Row */
.action-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-row button {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
}

.icon{
  width:18px;
  height:18px;
  margin-right:8px;
  vertical-align:middle;
}



@media (max-width: 1024px) {
  .detail-wrapper {
    margin-left: 0;
  }

  .marketplace-detail {
    grid-template-columns: 1fr;
  }

  .image-wrapper {
    height: 320px;
  }
}


@media (max-width: 600px) {
  .detail-wrapper {
    padding: 0 16px;
    margin-left:0;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .image-wrapper {
    height: 240px;
  }

  .thumbnails img {
    width: 70px;
    height: 70px;
  }

  .nav-arrow.left {
    left: 6px;
    color:white;
    background-color:rgba(75, 75, 75, 0.45)
  }

  .nav-arrow.right {
    right: 6px;
    color:white;
    background-color:rgba(75, 75, 75, 0.45)
  }
}




</style>
