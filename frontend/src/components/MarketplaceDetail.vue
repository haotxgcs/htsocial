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

    <strong class="sold-out" v-if="item.quantity === 0">SOLD OUT</strong>

    <p class="condition" v-if="item.type === 'tool'">Condition: {{ item.condition }}</p>

    <div class="delivery-estimate" v-if="item.quantity > 0">
      <Truck/>Estimated delivery: <strong>{{ item.estimatedDeliveryDays || 7 }} days</strong> after order confirmation
    </div>

    <!-- ACTION BUTTONS -->
    <div v-if="!isOwner" class="buyer-actions">

      <button class="report-btn" @click="openReport('item', item._id)">
        <FlagTriangleRight class="icon"/>
        Report Item
      </button>

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
<!-- ========================= -->
<!-- REVIEWS SECTION          -->
<!-- ========================= -->
<div id="reviews-section" class="info info-extra reviews-section ">

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
    <button v-if="!isOwner && canReview" class="write-review-btn" @click="openReviewModal">
      ✏️ Write a Review
    </button>
  </div>

  <!-- REVIEW LIST -->
  <div v-if="reviewsLoading" class="reviews-loading">Loading reviews...</div>

  <div v-else-if="reviews.length === 0" class="empty-reviews">
    <p>🌟 Be the first to review this item!</p>
  </div>

  <div v-else class="review-list">
    <div v-for="review in visibleReviews" :key="review._id" :id="`review-${review._id}`" class="review-card" :class="{ 'reviews-highlighted': highlightedReviewId === review._id }">
      <div class="review-top">
        <img :src="review.user?.avatar ? imageFromPath(review.user.avatar) : '/default-avatar.png'" class="reviewer-avatar" />
        <div class="review-main">
          <!-- Row 1: name + stars -->
          <div class="review-row1">
            <span class="reviewer-name">{{ review.user?.firstname }} {{ review.user?.lastname }}</span>
            <div class="review-stars">
              <span v-for="s in 5" :key="s" class="rs" :class="{ filled: s <= review.rating }">&#9733;</span>
            </div>
          </div>
          <!-- Row 2: date + order id + actions -->
          <div class="review-row2">
            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
            <span class="review-order-id" v-if="review.order">· Order #{{ typeof review.order === 'object' ? review.order._id.slice(-6) : review.order.toString().slice(-6) }}</span>
            <div v-if="isMyReview(review)" class="review-owner-actions">
              <button class="review-edit-btn" @click="openEditReviewModal(review)">Edit</button>
              <button class="review-delete-btn" @click="deleteReview(review)">Delete</button>
            </div>
          </div>
          <!-- Comment -->
          <div v-if="review.comment">
            <p class="review-comment" :class="{ 'text-clamped': !expandedComments[review._id] }">{{ review.comment }}</p>
            <button v-if="review.comment.length > 150" class="toggle-btn" @click="toggleComment(review._id)">
              {{ expandedComments[review._id] ? 'Show less ▲' : 'Show more ▼' }}
            </button>
          </div>
        </div>
      </div>

      <!-- SELLER REPLY (da co) -->
      <div v-if="review.sellerReply && review.sellerReply.repliedAt" class="seller-reply-box">
        <div class="seller-reply-label">
          <span class="reply-icon">↩</span> Seller's response
          <span class="reply-date">· {{ formatDate(review.sellerReply.repliedAt) }}</span>
        </div>
        <p class="seller-reply-content" :class="{ 'reply-clamped': !expandedReplies[review._id] }">
          {{ review.sellerReply.content }}
        </p>
        <button
          v-if="review.sellerReply.content.length > 200"
          class="reply-toggle-btn"
          @click="toggleReply(review._id)"
        >{{ expandedReplies[review._id] ? 'Show less ▲' : 'Show more ▼' }}</button>
        <button v-if="isOwner" class="open-reply-btn" @click="openReplyModal(review)">Edit Reply</button>
      </div>

      <!-- SELLER chua reply -->
      <div v-else-if="isOwner">
        <button class="open-reply-btn" @click="openReplyModal(review)">↩ Reply to this review</button>
      </div>
    </div>

    <button v-if="reviews.length > reviewsShown" class="show-more-btn" @click="reviewsShown += 5">
      Show more ({{ reviews.length - reviewsShown }} remaining)
    </button>
  </div>

  <!-- ACTION MODAL -->
  <ActionModal
    v-if="actionModal.visible"
    :type="actionModal.type"
    :order="actionModal.order"
    :review="actionModal.review"
    @cancel="actionModal.visible = false"
    @confirm="handleModalConfirm"
  />

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

    <ReportModal
      :is-visible="reportModal.visible"
      :target-type="reportModal.targetType"
      :target-id="reportModal.targetId"
      @close="reportModal.visible = false"
    />

  </div>
</template>


<script>
import axios from "axios";
import LoadingOverlay from "../components/LoadingOverlay.vue";
import MarketplaceEditModal from "../components/MarketplaceEditModal.vue";
import MarketplaceBuyModal from "../components/MarketplaceBuyModal.vue";
import ActionModal from "../components/ActionModal.vue";
import ReportModal from "../components/ReportModal.vue";

import {
  ShoppingCart,
  Zap,
  MessageCircle,
  Truck,
  FlagTriangleRight
} from "lucide-vue-next";



export default {
  name: "MarketplaceDetail",
  components: {
    LoadingOverlay,
    MarketplaceEditModal,
    MarketplaceBuyModal,
    ActionModal,
    ReportModal,

    ShoppingCart,
    Zap,
    MessageCircle, 
    Truck,
    FlagTriangleRight
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
      eligibleOrderId: null,

      // ActionModal
      actionModal: {
        visible: false,
        type: "",       // "review" | "seller-review"
        order: null,
        review: null
      },

      expandedReplies: {}, // { [reviewId]: bool }
      expandedComments: {},

      highlightedReviewId: null,

      reportModal: { 
        visible: false, 
        targetType: '', 
        targetId: null 
      },


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
  }

  },

watch: {
  isLoading(newVal) {
    if (newVal === false && this.$route.query.scrollToReviews) {
      const reviewId = this.$route.query.reviewId || null;

      // ✅ Đảm bảo review được render — tăng reviewsShown nếu cần
      if (reviewId) {
        const idx = this.reviews.findIndex(r => r._id === reviewId);
        if (idx !== -1 && idx >= this.reviewsShown) {
          this.reviewsShown = idx + 1;
        }
      }

      this.$nextTick(() => {
        setTimeout(() => {
          if (reviewId) {
            const reviewEl = document.getElementById(`review-${reviewId}`);
            console.log('reviewId:', reviewId);
            console.log('reviews list:', this.reviews.map(r => r._id));
            console.log('reviewEl:', reviewEl);
            if (reviewEl) {
              reviewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              this.highlightedReviewId = reviewId;
              setTimeout(() => { this.highlightedReviewId = null; }, 3000);
            }
          } else {
            const el = document.getElementById('reviews-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              el.classList.add('reviews-highlighted');
              setTimeout(() => el.classList.remove('reviews-highlighted'), 3000);
            }
          }
          this.$router.replace({ path: this.$route.path });
        }, 300);
      });
    }
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
      const sellerId = this.item?.seller?._id || this.item?.seller;
      if (!sellerId) return;
      this.$router.push({ path: "/messages", query: { userId: sellerId.toString() } });
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

  openReport(targetType = 'item', targetId = this.item?._id) {
    this.reportModal.targetType = targetType;
    this.reportModal.targetId = targetId;
    this.reportModal.visible = true;
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
      this.eligibleOrderId = res.data?.orderId || null;
    } catch {
      this.canReview = false;
    }
  },

  openReviewModal() {
    this.actionModal = {
      visible: true,
      type: "review",
      order: {
        _id: this.eligibleOrderId,
        items: [{
          _id: this.item._id,
          item: this.item,
          quantity: 1,
          reviewed: false
        }]
      },
      review: null
    };
  },

  openReplyModal(review) {
    // Inject item data vì review.item từ API chỉ là ObjectId, không populate
    const reviewWithItem = { ...review, item: this.item };
    this.actionModal = {
      visible: true,
      type: "seller-review",
      order: null,
      review: reviewWithItem
    };
  },

  toggleReply(reviewId) {
    this.expandedReplies = { ...this.expandedReplies, [reviewId]: !this.expandedReplies[reviewId] };
  },

  toggleComment(reviewId) {
    this.expandedComments = { ...this.expandedComments, [reviewId]: !this.expandedComments[reviewId] };
  },

  isMyReview(review) {    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !review.user) return false;
    return review.user._id === (user._id || user.id);
  },

  openEditReviewModal(review) {
    this.actionModal = {
      visible: true,
      type: "edit-review",
      order: {
        _id: review.order,
        items: [{ _id: this.item._id, item: this.item, quantity: 1, reviewed: true }]
      },
      review
    };
  },

  async updateReview(payload) {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.VUE_APP_API_URL}/reviews/${this.actionModal.review._id}`,
        { rating: payload.rating, comment: payload.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Merge chỉ rating/comment, giữ nguyên user/sellerReply/... để tránh mất avatar
      const idx = this.reviews.findIndex(r => r._id === this.actionModal.review._id);
      if (idx !== -1) {
        this.reviews[idx].rating = payload.rating;
        this.reviews[idx].comment = payload.comment;
        this.reviews[idx].sellerReply = null; // backend clear reply sau khi buyer edit
      }
      this.actionModal.visible = false;
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update review.");
    }
  },

  async deleteReview(review) {
    if (!confirm("Delete your review? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.VUE_APP_API_URL}/reviews/${review._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      this.reviews = this.reviews.filter(r => r._id !== review._id);
      this.canReview = true;
      this.eligibleOrderId = review.order;
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete review.");
    }
  },

  async handleModalConfirm(payload) {
    if (this.actionModal.type === "review") {
      await this.submitReview(payload);
    } else if (this.actionModal.type === "edit-review") {
      await this.updateReview(payload);
    } else if (this.actionModal.type === "seller-review") {
      if (payload === "__delete_reply__") await this.deleteReply(this.actionModal.review._id);
      else await this.submitReply(this.actionModal.review._id, payload);
    }
  },

  async submitReview(payload) {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${process.env.VUE_APP_API_URL}/orders/review`,
        {
          orderId: this.eligibleOrderId,
          itemId: this.$route.params.id,
          rating: payload.rating,
          comment: payload.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      this.canReview = false;
      this.actionModal.visible = false;
      await this.fetchReviews();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to submit review.");
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  },

  async submitReply(reviewId, content) {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${process.env.VUE_APP_API_URL}/reviews/${reviewId}/reply`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const review = this.reviews.find(r => r._id === reviewId);
      if (review) review.sellerReply = res.data.sellerReply;
      this.actionModal.visible = false;
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to submit reply.");
    }
  },

  async deleteReply(reviewId) {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.VUE_APP_API_URL}/reviews/${reviewId}/reply`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const review = this.reviews.find(r => r._id === reviewId);
      if (review) review.sellerReply = null;
      this.actionModal.visible = false;
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete reply.");
    }
  },


}
};
</script>


<style scoped>
.marketplace-detail-page {
  height: auto;
  min-height: 100vh;
  padding-top: 72px;
  background: var(--bg-body);
  transition: background-color 0.3s;
}

.detail-wrapper {
  padding: 0 32px;
  margin-left: 300px;
  margin-bottom: 40px;
}

.detail-content {
  max-width: 1200px;
}

.marketplace-detail {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  align-items: stretch;
}

.image-block { width: 100%; }

.image-wrapper {
  position: relative;
  width: 100%; height: 420px;
  overflow: hidden; border-radius: 16px;
  background: var(--bg-card);
  box-shadow: 0 4px 12px rgba(0,0,0,0.07);
  cursor: zoom-in;
}

.image-wrapper img { width: 100%; height: 100%; object-fit: cover; }

.nav-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  color: white; font-size: 28px; font-weight: 500;
  border: none; cursor: pointer; z-index: 5;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
}
.nav-arrow:hover { background: rgba(0,0,0,0.65); transform: translateY(-50%) scale(1.05); }
.nav-arrow.left { left: 12px; }
.nav-arrow.right { right: 12px; }

.thumbnails-overlay {
  position: absolute; left: 50%; bottom: 12px;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(6px);
  border-radius: 14px;
}

.thumbnail-strip {
  display: flex; gap: 16px; padding: 4px;
  justify-content: center; overflow-x: auto;
  scrollbar-width: none;
}
.thumbnail-strip::-webkit-scrollbar { display: none; }
.thumbnail-strip img {
  width: 64px; height: 64px; object-fit: cover;
  border-radius: 8px; cursor: pointer; opacity: 0.6;
  flex-shrink: 0; transition: all 0.2s ease;
  background-color: var(--bg-card);
}
.thumbnail-strip img:hover,
.thumbnail-strip img.active { opacity: 1; box-shadow: 0 0 0 2px #FF642F; }

/* ── INFO CARDS ── */
.info {
  background: var(--bg-card);
  padding: 24px; border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
  transition: background-color 0.3s;
}

.info-extra {
  margin-top: 24px;
  background: var(--bg-card);
  padding: 24px; border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; gap: 16px;
  transition: background-color 0.3s;
}

.info h1 { font-size: 26px; margin-bottom: 10px; font-weight: 600; color: var(--text-main); }

.item-title {
  font-size: 26px; font-weight: 600; line-height: 1.3;
  color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis; word-break: break-word;
  position: relative;
}
.item-title:hover::after {
  content: attr(title);
  position: absolute; left: 0; top: 100%; margin-top: 6px;
  background: #111; color: white;
  padding: 6px 10px; border-radius: 6px; font-size: 13px;
  white-space: normal; max-width: 300px; z-index: 10;
}

.price { font-size: 22px; font-weight: 700; color: #FF642F; margin-bottom: 14px; }

.quantity, .condition {
  font-size: 14px; font-style: italic; font-weight: 600;
  margin-bottom: 8px; color: var(--text-main);
}

.delivery-estimate {
  font-size: 14px; color: var(--text-sub);
  margin: 8px 0 12px;
  display: flex; align-items: center; gap: 6px;
}
.delivery-estimate strong { color: #FF642F; }

.sold-out {
  font-size: 14px; font-style: italic; font-weight: 800;
  margin-bottom: 8px; color: #ff4d4f;
}

.buyer-actions { display: flex; gap: 12px; margin-top: 20px; }

.cart-btn {
  flex: 1; background: var(--bg-card);
  border: 2px solid #FF642F; color: #FF642F;
  padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;
  transition: 0.2s;
}
.cart-btn:hover { background: var(--hover-primary); }
.cart-btn:disabled { background: var(--bg-input); border-color: var(--border-color); color: var(--text-sub); cursor: not-allowed; }

.buy-btn {
  flex: 1; background: #FF642F; color: white;
  padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;
  transition: 0.2s;
}
.buy-btn:hover { background: #e05522; }
.buy-btn:disabled { background: #ffb3a2; cursor: not-allowed; }

.report-btn {
  flex: 1; background: var(--bg-card);
  border: 2px solid #f59e0b;   color: #f59e0b;
  padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;
  transition: 0.2s;
}

.report-btn:hover{
  color: white;
  background: #f59e0b;
}

.type {
  display: inline-block; width: fit-content;
  background: #FF642F; color: white;
  padding: 4px 10px; border-radius: 999px; font-size: 12px;
}

.description {
  margin: 16px 0; line-height: 1.5;
  white-space: pre-line; color: var(--text-main);
}

.seller {
  display: flex; align-items: center; gap: 10px;
  margin-top: 24px; padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
.seller span { font-weight: 500; color: var(--text-main); }

.loading { text-align: center; margin-top: 60px; color: var(--text-sub); }

.detail-header {
  color: #FF642F; padding: 16px 20px; margin-bottom: 24px;
  display: flex; justify-content: space-between; align-items: center;
}

.breadcrumb { margin-bottom: 16px; font-size: 14px; color: var(--text-sub); }
.breadcrumb span:first-child { cursor: pointer; color: #FF642F; font-weight: 500; }
.breadcrumb span:first-child:hover { text-decoration: underline; }
.breadcrumb-title {
  max-width: 370px; display: inline-block; vertical-align: bottom;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--text-main);
}

.fullscreen {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
}
.fullscreen img { max-width: 90%; max-height: 90%; background: var(--bg-card); }
.fullscreen .nav-arrow { background: rgba(255,255,255,0.15); color: white; }
.fullscreen .nav-arrow:hover { background: rgba(255,255,255,0.3); }

.owner-actions {
  margin-top: 24px; padding-top: 16px;
  border-top: 1px dashed var(--border-color);
  display: flex; flex-direction: column; gap: 12px;
}

.edit-btn {
  margin-top: auto; padding: 12px; width: 100%;
  background: var(--hover-primary); color: var(--text-main);
  border-radius: 12px; border: none; cursor: pointer;
  font-size: 15px; font-weight: 600; transition: 0.2s;
}
.edit-btn:hover { background: #FF642F; color: white; }

.delete-btn {
  margin-top: auto; padding: 12px; width: 100%;
  background: #ffdddd; color: #ff4d4f;
  border-radius: 12px; border: none; cursor: pointer;
  font-size: 15px; font-weight: 600; transition: 0.2s;
}
.delete-btn:hover { background: #ff4d4f; color: white; }

.deleted-item-box {
  background: var(--bg-card); padding: 40px;
  border-radius: 16px; text-align: center;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
}
.deleted-item-box h2 { color: #ff4d4f; margin-bottom: 12px; }
.deleted-item-box p { font-style: italic; color: var(--text-sub); margin-bottom: 24px; }

.back-btn {
  padding: 10px 20px; border-radius: 999px; border: none;
  background: #FF642F; color: white; font-weight: 600; cursor: pointer;
}

/* ── SELLER ROW ── */
.seller-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 22px; padding-top: 15px;
  border-top: 1px solid var(--border-color);
}
.seller-info { display: flex; align-items: center; gap: 10px; }
.seller-name { font-weight: 600; font-size: 15px; color: var(--text-main); }
.avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }

.chat-btn {
  padding: 9px 15px; border-radius: 10px;
  border: 1px solid #FF642F;
  background: var(--bg-card); color: #FF642F;
  font-weight: 600; cursor: pointer; transition: 0.2s;
}
.chat-btn:hover { background: #FF642F; color: white; }

.action-row { display: flex; gap: 12px; margin-top: 16px; }
.action-row button { flex: 1; padding: 14px; border-radius: 14px; font-weight: 600; cursor: pointer; }

.icon { width: 18px; height: 18px; margin-right: 8px; vertical-align: middle; }

/* ── REVIEWS SECTION ── */
.reviews-section { gap: 0; }

.reviews-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}

.reviews-title-block { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.reviews-title { font-size: 17px; font-weight: 700; color: var(--text-main); }

.rating-summary { display: flex; align-items: center; gap: 6px; }
.avg-stars { display: flex; gap: 1px; }
.avg-star { font-size: 18px; color: var(--border-color); }
.avg-star.full { color: #f5a623; }
.avg-score { font-size: 16px; font-weight: 700; color: var(--text-main); }
.avg-count { font-size: 13px; color: var(--text-sub); }
.no-reviews-yet { font-size: 13px; color: var(--text-sub); font-style: italic; }

.write-review-btn {
  padding: 9px 18px; background: #FF642F; color: white;
  border: none; border-radius: 10px; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: 0.2s; white-space: nowrap;
}
.write-review-btn:hover { background: #e05522; }

/* Review form */
.review-form-box {
  background: var(--hover-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px; padding: 20px; margin-bottom: 24px;
}
.form-title { font-weight: 700; font-size: 15px; margin-bottom: 14px; color: var(--text-main); }
.star-input-row { display: flex; align-items: center; gap: 4px; margin-bottom: 14px; }
.star-input { font-size: 32px; cursor: pointer; color: var(--border-color); transition: color 0.1s; line-height: 1; user-select: none; }
.star-input.active { color: #f5a623; }
.star-label-text { font-size: 13px; color: var(--text-sub); margin-left: 8px; min-width: 75px; }

.review-textarea {
  width: 100%; padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px; font-size: 14px; resize: vertical;
  box-sizing: border-box; font-family: inherit; line-height: 1.5;
  background: var(--bg-card); color: var(--text-main);
  transition: background 0.3s, color 0.3s;
}
.review-textarea:focus { outline: none; border-color: #FF642F; }

.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }

.cancel-review-btn {
  padding: 9px 18px; border: 1px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main);
  border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s;
}
.cancel-review-btn:hover { border-color: #FF642F; color: #FF642F; }

.submit-review-btn {
  padding: 9px 20px; background: #FF642F; color: white;
  border: none; border-radius: 8px; font-weight: 600;
  font-size: 14px; cursor: pointer; transition: 0.2s;
}
.submit-review-btn:hover:not(:disabled) { background: #e05522; }
.submit-review-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.review-error   { color: #e74c3c; font-size: 13px; margin-top: 8px; }
.review-success { color: #27ae60; font-size: 13px; margin-top: 8px; font-weight: 500; }

/* Review list */
.reviews-loading { text-align: center; color: var(--text-sub); padding: 20px 0; font-size: 14px; }
.empty-reviews { text-align: center; padding: 28px 0 10px; color: var(--text-sub); }
.empty-reviews p { font-size: 14px; margin-top: 6px; }

.review-list { display: flex; flex-direction: column; gap: 16px; margin-top: 4px; }

.review-card {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-input);
  transition: box-shadow 0.15s, background-color 0.3s;
}
.review-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }

.review-top { display: flex; gap: 12px; align-items: flex-start; }
.review-main { flex: 1; min-width: 0; }
.review-row1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.review-row2 { display: flex; align-items: center; gap: 6px; margin-top: 3px; flex-wrap: wrap; }
.review-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.review-owner-actions { display: flex; gap: 6px; }

.review-edit-btn {
  padding: 3px 10px; font-size: 12px; font-weight: 500;
  border-radius: 6px; border: 1px solid #FF642F;
  background: var(--bg-card); color: #FF642F;
  cursor: pointer; transition: 0.15s;
}
.review-edit-btn:hover { background: #FF642F; color: white; }

.review-delete-btn {
  padding: 3px 10px; font-size: 12px; font-weight: 500;
  border-radius: 6px; border: 1px solid #ef4444;
  background: var(--bg-card); color: #ef4444;
  cursor: pointer; transition: 0.15s;
}
.review-delete-btn:hover { background: #ef4444; color: white; }

.reviewer-info { display: flex; align-items: center; gap: 10px; }
.reviewer-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border-color); }
.reviewer-name { font-weight: 600; font-size: 14px; color: var(--text-main); }
.review-date { font-size: 12px; color: var(--text-sub); }
.review-order-id { font-size: 12px; color: var(--text-sub); }

.review-stars { display: flex; gap: 2px; }
.rs { font-size: 17px; color: var(--border-color); }
.rs.filled { color: #f5a623; }

.review-comment {
  font-size: 14px; color: var(--text-main);
  line-height: 1.6; margin: 6px 0 0;
  white-space: pre-line;
}
.text-clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.toggle-btn {
  background: none; border: none; color: #FF642F;
  font-size: 12px; font-weight: 500; cursor: pointer;
  padding: 3px 0; display: block;
}
.toggle-btn:hover { text-decoration: underline; }

.show-more-btn {
  width: 100%; padding: 10px;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 8px; color: #FF642F;
  font-weight: 500; font-size: 14px; cursor: pointer;
  transition: 0.2s; margin-top: 4px;
}
.show-more-btn:hover { background: var(--hover-primary); border-color: #FF642F; }

/* ── SELLER REPLY ── */
.seller-reply-box {
  margin-top: 12px;
  background: var(--hover-primary);
  border-left: 3px solid #FF642F;
  border-radius: 0 8px 8px 0;
  padding: 10px 14px;
}
.seller-reply-label {
  font-size: 12px; font-weight: 600; color: #FF642F;
  margin-bottom: 6px; display: flex; align-items: center; gap: 4px;
}
.reply-icon { font-size: 14px; }
.reply-date { font-weight: 400; color: var(--text-sub); }
.seller-reply-content { font-size: 13px; color: var(--text-main); line-height: 1.6; margin: 0; white-space: pre-line; }
.reply-clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.reply-toggle-btn {
  background: none; border: none; color: #FF642F;
  font-size: 12px; font-weight: 500; cursor: pointer;
  padding: 4px 0 0; display: block;
}
.reply-toggle-btn:hover { text-decoration: underline; }

.open-reply-btn {
  background: none; border: none; color: #FF642F;
  font-size: 13px; font-weight: 500; cursor: pointer;
  padding: 0; opacity: 0.75; transition: opacity 0.15s;
}
.open-reply-btn:hover { opacity: 1; }

.reply-form {
  background: var(--hover-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px; padding: 12px;
}
.reply-textarea {
  width: 100%; padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px; font-size: 13px; resize: none;
  box-sizing: border-box; font-family: inherit; line-height: 1.5;
  background: var(--bg-card); color: var(--text-main);
  transition: background 0.3s, color 0.3s;
}
.reply-textarea:focus { outline: none; border-color: #FF642F; }

.reply-form-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; justify-content: flex-end; }
.reply-char-count { font-size: 11px; color: var(--text-sub); margin-right: auto; }

.cancel-reply-btn {
  padding: 6px 14px; border: 1px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main);
  border-radius: 6px; font-size: 13px; cursor: pointer; transition: 0.2s;
}
.cancel-reply-btn:hover { border-color: #FF642F; color: #FF642F; }

.submit-reply-btn {
  padding: 6px 16px; background: #FF642F; color: white;
  border: none; border-radius: 6px; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: 0.2s;
}
.submit-reply-btn:hover:not(:disabled) { background: #e05522; }
.submit-reply-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── HIGHLIGHT ── */
.reviews-highlighted {
  animation: reviews-highlight-fade 3s ease forwards;
  border-radius: 12px;
}
@keyframes reviews-highlight-fade {
  0%   { box-shadow: 0 0 0 3px #FF642F, 0 0 20px rgba(255,100,47,0.35); background: var(--hover-primary); }
  60%  { box-shadow: 0 0 0 3px #FF642F, 0 0 20px rgba(255,100,47,0.35); background: var(--hover-primary); }
  100% { box-shadow: none; background: transparent; }
}

.review-card-highlighted {
  animation: review-card-highlight-fade 3s ease forwards;
  border-radius: 12px;
}
@keyframes review-card-highlight-fade {
  0%   { box-shadow: 0 0 0 3px #FF642F, 0 0 16px rgba(255,100,47,0.3); background: var(--hover-primary); }
  60%  { box-shadow: 0 0 0 3px #FF642F, 0 0 16px rgba(255,100,47,0.3); background: var(--hover-primary); }
  100% { box-shadow: none; background: transparent; }
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .detail-wrapper { margin-left: 0; }
  .marketplace-detail { grid-template-columns: 1fr; }
  .image-wrapper { height: 320px; }
}

@media (max-width: 600px) {
  .detail-wrapper { padding: 0 16px; margin-left: 0; }
  .detail-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .image-wrapper { height: 240px; }
  .thumbnails img { width: 70px; height: 70px; }
  .nav-arrow.left { left: 6px; }
  .nav-arrow.right { right: 6px; }
}
</style>