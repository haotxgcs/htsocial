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

<!-- ========================= -->
<!-- REVIEWS SECTION          -->
<!-- ========================= -->
<div class="info info-extra reviews-section">

  <!-- HEADER -->
  <div class="reviews-header">
    <div class="reviews-title-block">
      <strong class="reviews-title">Customer Reviews</strong>
      <div class="rating-summary" v-if="reviews.length > 0">
        <span class="avg-stars">
          <span v-for="s in 5" :key="s" class="avg-star" :class="{ full: s <= Math.round(avgRating) }">&#9733;</span>
        </span>
        <span class="avg-score">{{ avgRating.toFixed(1) }}</span>
        <span class="avg-count">({{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }})</span>
      </div>
      <span v-else class="no-reviews-yet">No reviews yet</span>
    </div>
    <button v-if="!isOwner && canReview && !showReviewForm" class="write-review-btn" @click="showReviewForm = true">
      ✏️ Write a Review
    </button>
  </div>

  <!-- REVIEW FORM -->
  <div v-if="showReviewForm" class="review-form-box">
    <div class="form-title">Your Review</div>
    <div class="star-input-row">
      <span
        v-for="s in 5" :key="s"
        class="star-input"
        :class="{ active: s <= (reviewForm.hover || reviewForm.rating) }"
        @click="reviewForm.rating = s"
        @mouseover="reviewForm.hover = s"
        @mouseleave="reviewForm.hover = 0"
      >{{ s <= (reviewForm.hover || reviewForm.rating) ? '\u2605' : '\u2606' }}</span>
      <span class="star-label-text">{{ starInputLabel }}</span>
    </div>
    <textarea v-model="reviewForm.comment" placeholder="Share your experience with this item... (optional)" class="review-textarea" rows="3"></textarea>
    <div class="form-actions">
      <button class="cancel-review-btn" @click="cancelReviewForm">Cancel</button>
      <button class="submit-review-btn" :disabled="!reviewForm.rating || reviewForm.submitting" @click="submitReview">
        {{ reviewForm.submitting ? 'Submitting...' : 'Submit Review' }}
      </button>
    </div>
    <p v-if="reviewForm.error" class="review-error">{{ reviewForm.error }}</p>
    <p v-if="reviewForm.success" class="review-success">✅ Review submitted!</p>
  </div>

  <!-- REVIEW LIST -->
  <div v-if="reviewsLoading" class="reviews-loading">Loading reviews...</div>

  <div v-else-if="reviews.length === 0 && !showReviewForm" class="empty-reviews">
    <p>🌟 Be the first to review this item!</p>
  </div>

  <div v-else class="review-list">
    <div v-for="review in visibleReviews" :key="review._id" class="review-card">
      <div class="review-top">
        <div class="reviewer-info">
          <img :src="review.user?.avatar ? imageFromPath(review.user.avatar) : '/default-avatar.png'" class="reviewer-avatar" />
          <div>
            <div class="reviewer-name">{{ review.user?.firstname }} {{ review.user?.lastname }}</div>
            <div class="review-date">{{ formatDate(review.createdAt) }}</div>
          </div>
        </div>
        <div class="review-stars">
          <span v-for="s in 5" :key="s" class="rs" :class="{ filled: s <= review.rating }">&#9733;</span>
        </div>
      </div>
      <p class="review-comment" v-if="review.comment">{{ review.comment }}</p>

      <!-- SELLER REPLY (đã có) -->
      <div v-if="review.sellerReply && review.sellerReply.repliedAt" class="seller-reply-box">
        <div class="seller-reply-label">
          <span class="reply-icon">↩</span> Seller's response
          <span class="reply-date">· {{ formatDate(review.sellerReply.repliedAt) }}</span>
        </div>
        <p class="seller-reply-content">{{ review.sellerReply.content }}</p>
      </div>

      <!-- SELLER REPLY FORM (chưa reply + đang là owner) -->
      <div v-else-if="isOwner" class="reply-form-wrap">
        <div v-if="replyingTo === review._id" class="reply-form">
          <textarea
            v-model="replyContent"
            placeholder="Write your response... (max 500 characters)"
            class="reply-textarea"
            maxlength="500"
            rows="2"
          ></textarea>
          <div class="reply-form-actions">
            <span class="reply-char-count">{{ replyContent.length }}/500</span>
            <button class="cancel-reply-btn" @click="cancelReply">Cancel</button>
            <button
              class="submit-reply-btn"
              :disabled="!replyContent.trim() || replySubmitting"
              @click="submitReply(review._id)"
            >{{ replySubmitting ? 'Submitting...' : 'Post Response' }}</button>
          </div>
        </div>
        <button v-else class="open-reply-btn" @click="openReply(review._id)">
          ↩ Reply to this review
        </button>
      </div>
    </div>

    <button v-if="reviews.length > reviewsShown" class="show-more-btn" @click="reviewsShown += 5">
      Show more ({{ reviews.length - reviewsShown }} remaining)
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

      modalMode: "cart",

      // Reviews
      reviews: [],
      reviewsLoading: false,
      reviewsShown: 5,
      canReview: false,
      showReviewForm: false,
      reviewForm: {
        rating: 0,
        hover: 0,
        comment: "",
        submitting: false,
        error: "",
        success: false,
        eligibleOrderId: null
      },

      // Seller reply
      replyingTo: null,       // reviewId đang mở form reply
      replyContent: "",
      replySubmitting: false


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

      // Load reviews sau khi có item
      await this.fetchReviews();
      await this.checkCanReview();
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

  avgRating() {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  },

  visibleReviews() {
    return this.reviews.slice(0, this.reviewsShown);
  },

  starInputLabel() {
    const map = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };
    return map[this.reviewForm.hover || this.reviewForm.rating] || "";
  }

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
  },

  /* ========================= */
  /* REVIEWS                   */
  /* ========================= */
  async fetchReviews() {
    this.reviewsLoading = true;
    try {
      const res = await axios.get(
        `${process.env.VUE_APP_API_URL}/reviews/item/${this.$route.params.id}`
      );
      this.reviews = res.data?.reviews || res.data || [];
    } catch (err) {
      console.error("Fetch reviews error:", err);
    } finally {
      this.reviewsLoading = false;
    }
  },

  // Kiểm tra user có đơn hàng completed chứa item này chưa review không
  async checkCanReview() {
    const token = localStorage.getItem("token");
    if (!token || this.isOwner) return;
    try {
      const res = await axios.get(
        `${process.env.VUE_APP_API_URL}/reviews/can-review/${this.$route.params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      this.canReview = res.data?.canReview || false;
      this.reviewForm.eligibleOrderId = res.data?.orderId || null;
    } catch {
      this.canReview = false;
    }
  },

  cancelReviewForm() {
    this.showReviewForm = false;
    this.reviewForm = { rating: 0, hover: 0, comment: "", submitting: false, error: "", success: false, eligibleOrderId: this.reviewForm.eligibleOrderId };
  },

  async submitReview() {
    if (!this.reviewForm.rating) return;
    this.reviewForm.submitting = true;
    this.reviewForm.error = "";
    this.reviewForm.success = false;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.VUE_APP_API_URL}/orders/review`,
        {
          orderId: this.reviewForm.eligibleOrderId,
          itemId: this.$route.params.id,
          rating: this.reviewForm.rating,
          comment: this.reviewForm.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      this.reviewForm.success = true;
      this.canReview = false;
      // Đợi 1s rồi đóng form, reload reviews
      setTimeout(async () => {
        this.showReviewForm = false;
        await this.fetchReviews();
      }, 1200);
    } catch (err) {
      this.reviewForm.error = err.response?.data?.msg || "Failed to submit review.";
    } finally {
      this.reviewForm.submitting = false;
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  },

  /* ========================= */
  /* SELLER REPLY               */
  /* ========================= */
  openReply(reviewId) {
    this.replyingTo = reviewId;
    this.replyContent = "";
  },

  cancelReply() {
    this.replyingTo = null;
    this.replyContent = "";
  },

  async submitReply(reviewId) {
    if (!this.replyContent.trim()) return;
    this.replySubmitting = true;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.VUE_APP_API_URL}/reviews/${reviewId}/reply`,
        { content: this.replyContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật trực tiếp trong array thay vì refetch cả list
      const review = this.reviews.find(r => r._id === reviewId);
      if (review) {
        review.sellerReply = res.data.sellerReply;
      }

      this.replyingTo = null;
      this.replyContent = "";
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to submit reply.");
    } finally {
      this.replySubmitting = false;
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



/* ========================= */
/* REVIEWS SECTION           */
/* ========================= */

.reviews-section {
  gap: 0;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.reviews-title-block {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.reviews-title {
  font-size: 17px;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avg-stars { display: flex; gap: 1px; }
.avg-star { font-size: 18px; color: #ddd; }
.avg-star.full { color: #f5a623; }

.avg-score {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.avg-count {
  font-size: 13px;
  color: #888;
}

.no-reviews-yet {
  font-size: 13px;
  color: #aaa;
  font-style: italic;
}

.write-review-btn {
  padding: 9px 18px;
  background: #ff642f;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}
.write-review-btn:hover { background: #e05522; }

/* FORM */
.review-form-box {
  background: #fff8f5;
  border: 1px solid #ffe0d0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.form-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 14px;
  color: #333;
}

.star-input-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 14px;
}

.star-input {
  font-size: 32px;
  cursor: pointer;
  color: #ddd;
  transition: color 0.1s;
  line-height: 1;
  user-select: none;
}
.star-input.active { color: #f5a623; }

.star-label-text {
  font-size: 13px;
  color: #888;
  margin-left: 8px;
  min-width: 75px;
}

.review-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.5;
}
.review-textarea:focus { outline: none; border-color: #ff642f; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.cancel-review-btn {
  padding: 9px 18px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.cancel-review-btn:hover { border-color: #ff642f; color: #ff642f; }

.submit-review-btn {
  padding: 9px 20px;
  background: #ff642f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}
.submit-review-btn:hover:not(:disabled) { background: #e05522; }
.submit-review-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.review-error   { color: #e74c3c; font-size: 13px; margin-top: 8px; }
.review-success { color: #27ae60; font-size: 13px; margin-top: 8px; font-weight: 500; }

/* LIST */
.reviews-loading {
  text-align: center;
  color: #aaa;
  padding: 20px 0;
  font-size: 14px;
}

.empty-reviews {
  text-align: center;
  padding: 28px 0 10px;
  color: #aaa;
}
.empty-reviews p { font-size: 14px; margin-top: 6px; }

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 4px;
}

.review-card {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fafafa;
  transition: box-shadow 0.15s;
}
.review-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviewer-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.reviewer-name {
  font-weight: 600;
  font-size: 14px;
}

.review-date {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.review-stars {
  display: flex;
  gap: 2px;
}

.rs {
  font-size: 17px;
  color: #ddd;
}
.rs.filled { color: #f5a623; }

.review-comment {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.show-more-btn {
  width: 100%;
  padding: 10px;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  color: #ff642f;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 4px;
}
.show-more-btn:hover { background: #fff4f0; border-color: #ff642f; }

/* ========================= */
/* SELLER REPLY              */
/* ========================= */

.seller-reply-box {
  margin-top: 12px;
  background: #f8f8f8;
  border-left: 3px solid #ff642f;
  border-radius: 0 8px 8px 0;
  padding: 10px 14px;
}

.seller-reply-label {
  font-size: 12px;
  font-weight: 600;
  color: #ff642f;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reply-icon { font-size: 14px; }

.reply-date {
  font-weight: 400;
  color: #aaa;
}

.seller-reply-content {
  font-size: 13px;
  color: #444;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.reply-form-wrap { margin-top: 12px; }

.open-reply-btn {
  background: none;
  border: none;
  color: #ff642f;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  opacity: 0.75;
  transition: opacity 0.15s;
}
.open-reply-btn:hover { opacity: 1; }

.reply-form {
  background: #fff8f5;
  border: 1px solid #ffe0d0;
  border-radius: 10px;
  padding: 12px;
}

.reply-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.5;
}
.reply-textarea:focus { outline: none; border-color: #ff642f; }

.reply-form-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.reply-char-count {
  font-size: 11px;
  color: #bbb;
  margin-right: auto;
}

.cancel-reply-btn {
  padding: 6px 14px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.cancel-reply-btn:hover { border-color: #ff642f; color: #ff642f; }

.submit-reply-btn {
  padding: 6px 16px;
  background: #ff642f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.submit-reply-btn:hover:not(:disabled) { background: #e05522; }
.submit-reply-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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