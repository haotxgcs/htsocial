<template>
    <div class="marketplace-detail-page">
      <div class="detail-wrapper">
        <div class="detail-content">
        
  <!-- LOADING -->
  <div v-if="!item" class="loading">
    Loading...
  </div>

  <!-- CONTENT -->
  <div v-else>
    <!-- BREADCRUMB -->
    <div class="detail-header">
        <div class="breadcrumb">
        <span @click="$router.push('/marketplace')">Marketplace</span>
        <span> / </span>
        <span>{{ item.title }}</span>
        </div>

        <!-- ACTION MENU -->
        <div class="action-menu" v-if="isOwner">
        <button @click="onEdit">✏️ Edit</button>
        <button class="danger" @click="onDelete">🗑 Delete</button>
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
  v-if="item.images && item.images.length > 1"
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
    <h1>{{ item.title }}</h1>

    <p class="price">{{ formatPrice(item.price) }}</p>

    <p class="quantity">Quantity: {{ item.quantity }}</p>

    <p class="type">{{ typeLabel }}</p>

    <!-- <p class="description">
  <strong>Description:</strong><br />
  {{ item.description || "No Description." }}
</p> -->


    <!-- SELLER -->
    <div class="seller">
      <img
        v-if="item.seller?.avatar"
        :src="imageFromPath(item.seller.avatar)"
        class="avatar"
      />
      <span>
        {{ item.seller?.firstname }} {{ item.seller?.lastname }}
      </span>
    </div>

    <!-- CHAT BUTTON -->
    <button class="chat-btn">
      Chat with Seller 
    </button>
  </div>

  
</div>

  <div class="info info-extra">
  <p class="description">
    <strong>Description:</strong><br />
    {{ item.description || "No Description." }}
  </p>
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
  </div>
</template>


<script>
import axios from "axios";

export default {
  name: "MarketplaceDetail",

  data() {
    return {
      item: null,
      currentIndex: 0,
      showFullscreen: false,
    };
  },

  async created() {
    try {
      const res = await axios.get(
        `http://localhost:3000/marketplace/${this.$route.params.id}`
      );
      this.item = res.data;
    } catch (err) {
      console.error(
        "DETAIL ERROR:",
        err.response?.status,
        err.response?.data
      );
    }
  },

  computed: {
    currentImage() {
      if (!this.item?.images?.length) {
        return "/no-image.png";
      }
      return `http://localhost:3000/${this.item.images[this.currentIndex]}`;
    },

    isOwner() {
      const userId = localStorage.getItem("userId");
      return userId && userId === this.item?.seller?._id;
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

    onEdit() {
      alert("Edit item (UI only)");
    },

    onDelete() {
      if (confirm("Bạn chắc chắn muốn xóa item này?")) {
        alert("Delete item (UI only)");
      }
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
  min-height: 100vh;
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
  background: #f3f4f6;
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

.price {
  font-size: 22px;
  font-weight: 700;
  color: #ff642f;
  margin-bottom: 14px;
}


.quantity{
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  margin-bottom: 8px;

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

}

.seller {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.seller span {
  font-weight: 500;
}


.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

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


.action-menu button {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  background: var(--orange-light);
  color: var(--orange-main);
  font-weight: 500;
}

.action-menu button:hover {
  background: #ffedd5;
}

.action-menu .danger {
  background: #fff1f2;
  color: #dc2626;
  border-color: #fecaca;
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


.chat-btn {
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

.chat-btn:hover {
   background: #ff642f;
   color:white;
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
}




</style>
