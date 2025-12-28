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

  <!-- IMAGE -->
  <div class="image-wrapper">
    <img
      :src="currentImage"
      alt="item image"
      @click="openFullscreen"
    />
  </div>

  <!-- THUMBNAILS (PHÍA DƯỚI ẢNH) -->
  <div
    class="thumbnails"
    v-if="item.images && item.images.length > 1"
  >
    <img
      v-for="(img, i) in item.images"
      :key="i"
      :src="imageFromPath(img)"
      :class="{ active: i === currentIndex }"
      @click="currentIndex = i"
    />
  </div>

</div>


  <!-- INFO -->
  <div class="info">
    <h1>{{ item.title }}</h1>

    <p class="price">{{ formatPrice(item.price) }}</p>

    <p class="quantity">Số lượng: {{ item.quantity }}</p>

    <p class="type">Loại: {{ item.type }}</p>

    <p class="description">
      {{ item.description || "Không có mô tả" }}
    </p>

    <!-- SELLER -->
    <div class="seller">
      <img
        v-if="item.seller?.avatar"
        :src="item.seller.avatar"
        class="avatar"
      />
      <span>
        {{ item.seller?.firstname }} {{ item.seller?.lastname }}
      </span>
    </div>

    <!-- CHAT BUTTON -->
    <button class="chat-btn">
      💬 Chat với người bán
    </button>
  </div>
</div>


    <!-- FULLSCREEN IMAGE -->
    <div
      class="fullscreen"
      v-if="showFullscreen"
      @click="closeFullscreen"
    >
      <img :src="currentImage" />
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
  },

  methods: {
    imageFromPath(path) {
      return `http://localhost:3000/${path}`;
    },

    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN").format(price) + " đ";
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
}

.detail-content {
  max-width: 1200px;     /* desktop rộng, nhìn đã */


  
}



.marketplace-detail {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  margin-top: 24px;

}

.image-block {
  display: flex;
  flex-direction: column;
}




.image-wrapper {
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

.info {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
  padding-bottom:40px;

}


.info h1 {
  font-size: 26px;
  margin-bottom: 10px;
  font-weight: 600;
}

.price {
  font-size: 22px;
  font-weight: 700;
  color: var(--orange-main);
  margin-bottom: 14px;
}


.quantity,
.type {
  font-size: 14px;
  color: var(--gray-text);
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


.thumbnails {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.thumbnails img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  cursor: pointer;
  border-radius: 8px;
  opacity: 0.6;
  transition: all 0.2s ease;
  flex-shrink: 0;
}


.thumbnails img:hover {
  opacity: 1;
}

.thumbnails img.active {
  opacity: 1;
  outline: 2px solid var(--orange-main);
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
}

.chat-btn {
  margin-top: 24px;
  padding: 12px;
  width: 100%;
  background: var(--orange-main);
  color: black;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.chat-btn:hover {
   background: #fdf4f0;
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
