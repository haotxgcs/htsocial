<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal" :class="'modal--' + type">

      <!-- ===== CLOSE BUTTON ===== -->
      <!-- <button class="modal-close" @click="$emit('cancel')"><X /></button> -->

      <!-- ===================== -->
      <!-- STATUS UPDATE         -->
      <!-- ===================== -->
      <div v-if="type === 'status'" class="modal-body">
        <div class="modal-header">
          <div class="modal-icon" :class="status === 'cancelled' ? 'modal-icon--red' : 'modal-icon--blue'">
            <TriangleAlert v-if="status === 'cancelled'" />
            <Package v-else />
          </div>
          <h3 class="modal-title">{{ status === 'cancelled' ? 'Cancel Order' : 'Update Order Status' }}</h3>
          <p class="modal-sub">Order <span class="mono">#{{ order._id.slice(-6) }}</span></p>
        </div>

        <div class="status-current">
          <span class="status-dot" :class="order.status"></span>
          Current: <strong>{{ formatStatus(order.status) }}</strong>
        </div>

        <div class="select-wrap">
          <select v-model="status" class="styled-select" @change="cancelReason = ''">
            <option disabled value="">Select new status...</option>
            <option value="confirmed">✅ Confirmed</option>
            <option value="shipping">🚚 Shipping</option>
            <option value="completed">🎉 Completed</option>
          </select>
        </div>

        <!-- Delivery days input when confirming or shipping -->
        <div v-if="status === 'confirmed' || status === 'shipping'" class="field" style="margin-top:12px;">
          <label class="field-label">
            <Truck/> Estimated Delivery
            <span style="font-size:11px;color:#999;font-weight:400;"> (days from now)</span>
          </label>
          <input
            type="number"
            class="styled-input"
            v-model.number="deliveryDays"
            min="1"
            max="60"
            placeholder="7"
            
          />
          <div style="font-size:12px;color:#999;margin-top:4px;">
            Buyer will see: delivery by <strong>{{ estimatedDateLabel }}</strong>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="$emit('cancel')">Close</button>
          <button
            v-if="status !== 'cancelled'"
            class="btn btn-primary"
            :disabled="!status || submitting"
            @click="submitting = true; $emit('confirm', { status, estimatedDeliveryDays: deliveryDays || 7 })"
          >
            {{ submitting ? 'Updating...' : 'Update Status' }}
          </button>
          <button
            v-else
            class="btn btn-danger"
            :disabled="!cancelReason.trim()"
            @click="$emit('confirm', { status: 'cancelled', reason: cancelReason.trim() })"
          >
            Confirm Cancel
          </button>
        </div>
      </div>


      <!-- ===================== -->
      <!-- REFUND (Seller view)  -->
      <!-- ===================== -->
      <div v-if="type === 'refund'" class="modal-body">
        <div class="modal-header">
          <div class="modal-icon modal-icon--orange"><Repeat /></div>
          <h3 class="modal-title">Refund Request</h3>
          <p class="modal-sub">Order <span class="mono">#{{ refund.orderId.slice(-6) }}</span></p>
        </div>

        <!-- Reason -->
        <div class="info-block">
          <div class="info-label">Reason from buyer</div>
          <div class="info-value">{{ refund.refund?.reason || '—' }}</div>
        </div>

        <!-- Evidence -->
        <div class="info-block">
          <div class="info-label">Evidence</div>
          <div v-if="hasEvidence" class="evidence-grid">
            <div
              v-for="(img, i) in (refund.refund.evidence.images || [])"
              :key="'img-' + i"
              class="evidence-thumb"
              @click="openLightbox(refund.refund.evidence.images, i)"
            >
              <img :src="img" />
              <div class="thumb-overlay"><ZoomIn /></div>
            </div>
            <div
              v-for="(vid, i) in (refund.refund.evidence.videos || [])"
              :key="'vid-' + i"
              class="evidence-thumb evidence-thumb--video"
              @click="openVideo(vid)"
            >
              <div class="video-play-icon"><Play /></div>
              <span class="video-label">Video {{ i + 1 }}</span>
            </div>
          </div>
          <p v-else class="no-evidence">No files attached</p>
        </div>

        <div class="info-block" v-if="refund.refund.status === 'rejected'">
          <div class="info-label">Reject reason from seller</div>
          <div class="info-value">{{ refund.refund?.rejectReason || '—' }}</div>
        </div>

        <!-- Reject reason input -->
        <div class="info-block" v-if="showRejectInput">
          <div class="info-label">Rejection reason <span class="required">*</span></div>
          <textarea v-model="rejectReason" class="styled-textarea" placeholder="Explain why you are rejecting..." rows="2" maxlength="300"></textarea>
          <div class="char-count">{{ rejectReason.length }} / 300</div>
        </div>

        <div class="modal-actions">
          <button v-if="!showRejectInput" class="btn btn-ghost" @click="$emit('cancel')">Close</button>
          <button v-if="!showRejectInput && refund.refund.status ==='requested'" class="btn btn-danger" @click="showRejectInput = true">Reject</button>
          <template v-if="showRejectInput">
            <button class="btn btn-ghost" @click="showRejectInput = false; rejectReason = ''">Back</button>
            <button class="btn btn-danger" :disabled="!rejectReason.trim() || submitting" @click="submitting = true; $emit('confirm', { action: 'reject', rejectReason: rejectReason.trim() })">{{ submitting ? 'Rejecting...' : 'Confirm Reject' }}</button>
          </template>
          <button v-if="!showRejectInput && refund.refund.status ==='requested'" class="btn btn-success" :disabled="submitting" @click="submitting = true; $emit('confirm','approve')">{{ submitting ? 'Processing...' : 'Approve' }}</button>
        </div>
      </div>


      <!-- ===================== -->
      <!-- REQUEST REFUND        -->
      <!-- ===================== -->
      <div v-if="type === 'request-refund'" class="modal-body">
        <div class="modal-header">
          <div class="modal-icon modal-icon--orange"><HandCoins /></div>
          <h3 class="modal-title">Request Refund</h3>
          <p class="modal-sub">Order <span class="mono">#{{ order._id.slice(-6) }}</span></p>
        </div>

        <div class="field">
          <label class="field-label">Reason <span class="required">*</span></label>
          <textarea v-model="refundReason" class="styled-textarea" placeholder="Describe the issue in detail..." rows="3" maxlength="500"></textarea>
          <div class="char-count">{{ refundReason.length }} / 500</div>
        </div>

        <div class="field">
          <label class="field-label">
            Evidence
            <span v-if="requireEvidence" class="badge-required">required</span>
            <span v-else class="badge-optional">optional</span>
            <span class="evidence-counter" :class="{ 'evidence-counter--full': previewFiles.length >= 5 }">
              {{ previewFiles.length }}/5
            </span>
          </label>
          <div
            class="upload-area"
            :class="{ 'upload-area--active': previewFiles.length, 'upload-area--full': previewFiles.length >= 5 }"
            @click="previewFiles.length < 5 && $refs.fileInput.click()"
            @dragover.prevent
            @drop.prevent="previewFiles.length < 5 && onDrop($event)"
          >
            <div v-if="!previewFiles.length" class="upload-placeholder">
              <span class="upload-icon"><CloudUpload /></span>
              <span>Click or drag images / videos here</span>
            </div>
            <div v-else class="preview-grid">
              <div v-for="(f, i) in previewFiles" :key="i" class="preview-item">
                <img v-if="f.type.startsWith('image')" :src="f.url" class="preview-img" />
                <div v-else class="preview-video-tile">
                  <span class="video-icon"><Clapperboard /></span>
                  <span class="video-filename">{{ f.name }}</span>
                </div>
                <button class="remove-btn" @click.stop="removeFile(i)"><X /></button>
              </div>
              <div v-if="previewFiles.length < 5" class="add-more-btn" @click.stop="$refs.fileInput.click()"><Plus /></div>
              <div v-else class="evidence-full-badge">Max 5 files reached</div>
            </div>
          </div>
          <input ref="fileInput" type="file" multiple accept="image/*,video/*" style="display:none" @change="onFileChange" />
          <p class="upload-hint">Supports .JPG, .PNG, .MP4,... &nbsp;&bull;&nbsp; Max 5 files</p>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="$emit('cancel')">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!refundReason.trim() || (requireEvidence && !previewFiles.length) || submitting"
            @click="submitRefund"
          >{{ submitting ? 'Submitting...' : 'Submit Refund' }}</button>
        </div>
      </div>


      <!-- ===================== -->
      <!-- REVIEW (buyer)        -->
      <!-- ===================== -->
      <div v-if="type === 'review'" class="modal-body">
        <div class="modal-header">
          <div class="modal-icon modal-icon--yellow"><Star /></div>
          <h3 class="modal-title">Review Items</h3>
          <p class="modal-sub">Order <span class="mono">#{{ order._id.slice(-6) }}</span></p>
        </div>

        <div v-if="reviewableItems.length === 0" class="all-reviewed">
          <span class="all-reviewed-icon"><BadgeCheck /></span>
          <p>You've reviewed all items in this order!</p>
        </div>

        <div v-else>
          <!-- STEP 1: pick item -->
          <div v-if="!selectedItem">
            <p class="pick-label">Select an item to review:</p>
            <div class="item-pick-list">
              <div v-for="item in reviewableItems" :key="item._id" class="item-pick-row" @click="selectItem(item)">
                <img :src="item.item?.images?.[0] || item.itemSnapshot?.images?.[0]" class="pick-img" />
                <div class="pick-info">
                  <div class="pick-title">{{ item.item?.title || item.itemSnapshot?.title }}</div>
                  <div class="pick-qty">Qty: {{ item.quantity }}</div>
                </div>
                <span class="pick-arrow"><ChevronRight /></span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="$emit('cancel')">Close</button>
            </div>
          </div>

          <!-- STEP 2: write review -->
          <div v-if="selectedItem">
            <button class="back-btn" @click="selectedItem = null"><ChevronLeft /> Back</button>
            <div class="review-item-card">
              <img :src="selectedItem.item?.images?.[0] || selectedItem.itemSnapshot?.images?.[0]" class="review-item-img" />
              <div class="review-item-title">{{ selectedItem.item?.title || selectedItem.itemSnapshot?.title }}</div>
            </div>
            <div class="star-row">
              <span
                v-for="s in 5" :key="s"
                class="star"
                :class="{ active: s <= (reviewDraft.hover || reviewDraft.rating) }"
                @click="reviewDraft.rating = s"
                @mouseover="reviewDraft.hover = s"
                @mouseleave="reviewDraft.hover = 0"
              >{{ s <= (reviewDraft.hover || reviewDraft.rating) ? '\u2605' : '\u2606' }}</span>
              <span class="star-label" :class="{ 'star-label--active': starLabel }">{{ starLabel || 'Tap to rate' }}</span>
            </div>
            <textarea v-model="reviewDraft.comment" class="styled-textarea" placeholder="Share your experience... (optional)" rows="3" maxlength="1000"></textarea>
            <div class="char-count">{{ reviewDraft.comment.length }} / 1000</div>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="$emit('cancel')">Close</button>
              <button class="btn btn-primary" :disabled="!reviewDraft.rating || submittingReview" @click="submitReview">
                {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
              </button>
            </div>
          </div>
        </div>
      </div>


      <!-- ===================== -->
      <!-- EDIT REVIEW (buyer)   -->
      <!-- ===================== -->
      <div v-if="type === 'edit-review'" class="modal-body">
        <div class="modal-header">
          <div class="modal-icon modal-icon--yellow"><Star /></div>
          <h3 class="modal-title">Edit Your Review</h3>
          <p class="modal-sub">Order <span class="mono">#{{ order._id.slice(-6) }}</span></p>
        </div>

        <div class="review-item-card">
          <img :src="order?.items?.[0]?.item?.images?.[0]" class="review-item-img" />
          <div class="review-item-title">{{ order?.items?.[0]?.item?.title }}</div>
        </div>

        <div class="star-row">
          <span
            v-for="s in 5" :key="s"
            class="star"
            :class="{ active: s <= (reviewDraft.hover || reviewDraft.rating) }"
            @click="reviewDraft.rating = s"
            @mouseover="reviewDraft.hover = s"
            @mouseleave="reviewDraft.hover = 0"
          >{{ s <= (reviewDraft.hover || reviewDraft.rating) ? '\u2605' : '\u2606' }}</span>
          <span class="star-label" :class="{ 'star-label--active': starLabel }">{{ starLabel || 'Tap to rate' }}</span>
        </div>

        <textarea v-model="reviewDraft.comment" class="styled-textarea" placeholder="Update your experience... (optional)" rows="3" maxlength="1000"></textarea>
        <div class="char-count">{{ reviewDraft.comment.length }} / 1000</div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="$emit('cancel')">Cancel</button>
          <button class="btn btn-primary" :disabled="!reviewDraft.rating" @click="$emit('confirm', { rating: reviewDraft.rating, comment: reviewDraft.comment })">
            Save Changes
          </button>
        </div>
      </div>


      <!-- ===================== -->
      <!-- SELLER-REVIEW         -->
      <!-- (Seller xem + reply)  -->
      <!-- ===================== -->
      <div v-if="type === 'seller-review'" class="modal-body">        <div class="modal-header">
          <div class="modal-icon modal-icon--yellow"><Star /></div>
          <h3 class="modal-title">Customer Review</h3>
          <p class="modal-sub">Order <span class="mono">#{{typeof review.order === 'object' ? review.order._id.slice(-6) : review.order.toString().slice(-6) }}</span></p>
        </div>

        <!-- Item info -->
        <div class="sr-item-row">
          <img :src="review?.item?.images?.[0]" class="sr-item-img" />
          <div class="sr-item-detail">
            <div class="sr-item-title">{{ review?.item?.title }}</div>
            <div class="sr-item-price">${{ review?.item?.price }}</div>
          </div>
        </div>

        <!-- Stars + rating label -->
        <div class="sr-stars-row">
          <span v-for="s in 5" :key="s" class="rstar" :class="{ filled: s <= (review?.rating || 0) }">★</span>
          <span class="sr-rating-label" :class="ratingClass(review?.rating)">{{ ratingLabel(review?.rating) }}</span>
        </div>

        <!-- Reviewer -->
        <div class="info-block">
          <div class="info-label">Reviewer</div>
          <div class="sr-reviewer-row">
            <img :src="getAvatar(review?.user?.avatar) || '/default-avatar.png'" class="sr-avatar" />
            <div>
              <div class="sr-reviewer-name">{{ review?.user?.firstname }} {{ review?.user?.lastname }}</div>
              <div class="sr-reviewer-date">{{ formatDate(review?.createdAt) }}</div>
              <div class="sr-reviewer-date" v-if="review?.order">Order #{{ typeof review.order === 'object' ? review.order._id.slice(-6) : review.order.toString().slice(-6) }}</div>
            </div>
          </div>
        </div>

        <!-- Comment -->
        <div class="info-block">
          <div class="info-label">Comment</div>
          <div class="info-value sr-clamped" v-if="review?.comment">{{ review.comment }}</div>
          <div class="no-evidence" v-else>No written comment.</div>
        </div>

        <!-- Already replied: show reply + option to edit/delete -->
        <div v-if="review?.sellerReply?.repliedAt && !editingReply">
          <div class="sr-replied-box">
            <div class="sr-replied-label">
              ↩ Your response
              <span class="sr-reply-date">· {{ formatDate(review.sellerReply.repliedAt) }}</span>
            </div>
            <p class="sr-reply-content sr-clamped">{{ review.sellerReply.content }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="$emit('cancel')">Close</button>
            <button class="btn btn-danger" :disabled="submitting" @click="submitting = true; $emit('confirm', '__delete_reply__')">{{ submitting ? 'Deleting...' : 'Delete Reply' }}</button>
            <button class="btn btn-primary" @click="startEditReply">Edit Reply</button>
          </div>
        </div>

        <!-- Reply form (new or editing) -->
        <div v-else>
          <div class="field">
            <label class="field-label">
              {{ review?.sellerReply?.repliedAt ? 'Edit your response' : 'Your Reply' }}
              <span class="required">*</span>
            </label>
            <textarea
              v-model="sellerReplyContent"
              class="styled-textarea"
              placeholder="Write a professional, helpful response..."
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ sellerReplyContent.length }} / 500</div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="cancelReplyEdit">
              {{ review?.sellerReply?.repliedAt ? 'Back' : 'Cancel' }}
            </button>
            <button
              class="btn btn-primary"
              :disabled="!sellerReplyContent.trim() || submitting"
              @click="submitting = true; $emit('confirm', sellerReplyContent.trim())"
            >
              {{ submitting ? 'Saving...' : (review?.sellerReply?.repliedAt ? 'Update Response' : 'Post Response') }}
            </button>
          </div>
        </div>
      </div>


      <!-- ===================== -->
      <!-- CANCEL ORDER (buyer)  -->
      <!-- ===================== -->
      <div v-if="type === 'cancel'" class="modal-body">
        <div class="modal-header">
          <div class="modal-icon modal-icon--red"><TriangleAlert /></div>
          <h3 class="modal-title">{{ actor === "seller" ? "Cancel Order" : "Cancel Order" }}</h3>
          <p class="modal-sub">
            Order <span class="mono">#{{ order._id.slice(-6) }}</span>
            <span v-if="actor === 'seller'" style="margin-left:6px;font-size:11px;background:#fee2e2;color:#b91c1c;padding:2px 7px;border-radius:10px;font-weight:600;">Seller Cancel</span>
            <span v-else style="margin-left:6px;font-size:11px;background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:10px;font-weight:600;">Buyer Cancel</span>
          </p>
        </div>

        <p class="cancel-warning">
          ⚠️ This action cannot be undone. Stock will be restored automatically.
          <span v-if="actor === 'seller' && order?.status === 'shipping'"><br/>🚚 Note: Order is currently shipping. Please coordinate with the delivery service.</span>
        </p>

        <div class="field">
          <label class="field-label">Reason for cancellation <span class="required">*</span></label>

          <!-- Quick reason pills -->
          <div class="reason-pills">
            <button
              v-for="r in cancelReasonPresets" :key="r"
              class="reason-pill"
              :class="{ active: reason === r }"
              @click="reason = r"
            >{{ r }}</button>
          </div>

          <textarea
            v-model="reason"
            class="styled-textarea"
            placeholder="Or describe your reason..."
            rows="2"
            maxlength="300"
            style="margin-top: 10px"
          ></textarea>
          <div class="char-count">{{ reason.length }} / 300</div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="$emit('cancel')">Keep Order</button>
          <button class="btn btn-danger" :disabled="!reason.trim() || submitting" @click="submitting = true; $emit('confirm', reason)">
            Confirm Cancel
          </button>
        </div>
      </div>

    </div>

    <!-- LIGHTBOX -->
    <div v-if="lightbox.visible" class="lightbox" @click.self="lightbox.visible = false">
      <button class="lightbox-close" @click="lightbox.visible = false"><X /></button>
      <button v-if="lightbox.images.length > 1" class="lightbox-nav lightbox-nav--prev" @click="lightbox.index = (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length"><ChevronLeft /></button>
      <img :src="lightbox.images[lightbox.index]" class="lightbox-img" />
      <button v-if="lightbox.images.length > 1" class="lightbox-nav lightbox-nav--next" @click="lightbox.index = (lightbox.index + 1) % lightbox.images.length"><ChevronRight /></button>
      <div class="lightbox-counter" v-if="lightbox.images.length > 1">{{ lightbox.index + 1 }} / {{ lightbox.images.length }}</div>
    </div>

    <!-- VIDEO MODAL -->
    <div v-if="videoModal.visible" class="lightbox" @click.self="videoModal.visible = false">
      <button class="lightbox-close" @click="videoModal.visible = false"><X /></button>
      <video :src="videoModal.url" controls autoplay class="lightbox-video" />
    </div>

  </div>
</template>

<script>
import { CloudUpload, HandCoins, Clapperboard, ChevronLeft, ChevronRight, X, Plus, Package, Repeat, ZoomIn, Play, Star, BadgeCheck, TriangleAlert, Truck } from "lucide-vue-next";

export default {
  name: "ActionModal",
  components: { Package, Repeat, ZoomIn, Play, CloudUpload, HandCoins, Clapperboard, ChevronLeft, ChevronRight, X, Plus, Star, BadgeCheck, TriangleAlert, Truck },

  props: {
    type: String,
    order: Object,
    refund: Object,
    review: Object,
    requireEvidence: { type: Boolean, default: false },
    actor: { type: String, default: "buyer" } // "buyer" | "seller"
  },

  computed: {
    reviewableItems() {
      if (!this.order?.items) return [];
      return this.order.items.filter(i => !i.reviewed);
    },
    starLabel() {
      const map = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
      return map[this.reviewDraft.hover || this.reviewDraft.rating] || '';
    },
    hasEvidence() {
      const ev = this.refund?.refund?.evidence;
      return ev && (ev.images?.length > 0 || ev.videos?.length > 0);
    },
    estimatedDateLabel() {
      const days = this.deliveryDays || 7;
      const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    cancelReasonPresets() {
      if (this.actor === "seller") {
        const base = [
          "Out of stock",
          "Item damaged before shipment",
          "Incorrect order details",
          "Unable to fulfill order",
          "Other"
        ];
        // Neu dang shipping thi co the buyer tu choi nhan
        if (this.order?.status === "shipping") {
          base.splice(0, 0, "Delivery refused by buyer");
        }
        return base;
      }
      // Buyer presets
      return [
        "Changed my mind",
        "Ordered by mistake",
        "Found a better price",
        "Delivery too slow",
        "Other"
      ];
    }
  },

  data() {
    return {
      // Status
      status: "",
      deliveryDays: 7,
      cancelReason: "",
      // Cancel (buyer)
      reason: "",
      // Request refund
      refundReason: "",
      previewFiles: [],
      // Refund reject
      showRejectInput: false,
      rejectReason: "",
      // Buyer review
      selectedItem: null,
      submittingReview: false,
      submitting: false,   // chung cho approve/reject/reply/cancel
      reviewDraft: { rating: 0, hover: 0, comment: "" },
      // Seller reply
      sellerReplyContent: "",
      editingReply: false,
      // Lightbox
      lightbox: { visible: false, images: [], index: 0 },
      videoModal: { visible: false, url: "" }
    };
  },

  watch: {
    // Pre-fill reply content when editing
    review: {
      immediate: true,
      handler(val) {
        if (val?.sellerReply?.content) {
          this.sellerReplyContent = val.sellerReply.content;
        } else {
          this.sellerReplyContent = "";
        }
        this.editingReply = false;
      }
    },
    // Pre-fill reviewDraft + reset submitting khi doi type
    type: {
      immediate: true,
      handler(val) {
        // Reset chong spam moi khi mo modal moi
        this.submitting = false;
        if (val === "edit-review" && this.review) {
          this.reviewDraft = {
            rating: this.review.rating || 0,
            hover: 0,
            comment: this.review.comment || ""
          };
        } else if (val === "review") {
          this.reviewDraft = { rating: 0, hover: 0, comment: "" };
          this.selectedItem = null;
        }
      }
    }
  },

  methods: {
    formatStatus(s) {
      return { pending: 'Pending', confirmed: 'Confirmed', shipping: 'Shipping', completed: 'Completed', cancelled: 'Cancelled', refunded: 'Refunded' }[s] || s;
    },
    ratingLabel(r) {
      return { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" }[r] || "";
    },
    ratingClass(r) {
      return r >= 4 ? "label--green" : r === 3 ? "label--yellow" : "label--red";
    },
    formatDate(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour:"2-digit", minute:"2-digit"});
    },
    getAvatar(avatar) {
      if (!avatar) return '/default-avatar.png'
      if (avatar.startsWith('http')) return avatar  // URL đầy đủ → giữ nguyên
      return `${process.env.VUE_APP_API_URL}/${avatar.replace(/^\/uploads\//, '')}`
    },

    /* ---- Buyer review ---- */
    selectItem(item) {
      this.selectedItem = item;
      this.reviewDraft = { rating: 0, hover: 0, comment: "" };
    },
    async submitReview() {
      this.submittingReview = true;
      this.$emit("confirm", {
        itemId: this.selectedItem.item?._id || this.selectedItem.item,
        rating: this.reviewDraft.rating,
        comment: this.reviewDraft.comment
      });
    },
    reviewSubmitted() {
      this.submittingReview = false;
      this.selectedItem = null;
      this.reviewDraft = { rating: 0, hover: 0, comment: "" };
    },

    /* ---- Seller reply ---- */
    startEditReply() {
      this.sellerReplyContent = this.review?.sellerReply?.content || "";
      this.editingReply = true;
    },
    cancelReplyEdit() {
      if (this.review?.sellerReply?.repliedAt) {
        this.editingReply = false;
      } else {
        this.$emit("cancel");
      }
    },

    /* ---- Refund files ---- */
    onFileChange(e) { this.addFiles(Array.from(e.target.files)); },
    onDrop(e) { this.addFiles(Array.from(e.dataTransfer.files)); },
    addFiles(files) {
      const remaining = 5 - this.previewFiles.length;
      files.slice(0, remaining).forEach(f => {
        this.previewFiles.push({
          file: f, name: f.name, type: f.type,
          url: f.type.startsWith("image") ? URL.createObjectURL(f) : null
        });
      });
    },
    removeFile(i) { this.previewFiles.splice(i, 1); },
    submitRefund() {
      if (this.submitting) return;
      this.submitting = true;
      this.$emit("confirm", {
        reason: this.refundReason,
        files: this.previewFiles.map(f => f.file)
      });
    },

    /* ---- Lightbox ---- */
    openLightbox(images, index = 0) { this.lightbox = { visible: true, images, index }; },
    openVideo(url) { this.videoModal = { visible: true, url }; }
  }
};
</script>

<style scoped>

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999; padding: 20px;
}

.modal {
  background: #fff; border-radius: 20px;
  width: 100%; max-width: 440px; max-height: 88vh;
  overflow-y: auto; position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  animation: modal-pop 0.2s ease;
}
.modal--refund          { max-width: 500px; }
.modal--request-refund  { max-width: 480px; }
.modal--seller-review   { max-width: 480px; }

@keyframes modal-pop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal::-webkit-scrollbar { width: 5px; }
.modal::-webkit-scrollbar-thumb { background: #eee; border-radius: 3px; }

.modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: #f5f5f5; color: #888;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  z-index: 2; transition: background 0.15s, color 0.15s;
}
.modal-close:hover { background: #ffe0d5; color: #FF642F; }

.modal-body { padding: 28px 28px 24px; }

.modal-header { text-align: center; margin-bottom: 20px; padding-right: 24px; }

.modal-icon {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin: 0 auto 12px;
}
.modal-icon--blue   { background: #e8f4fd; color: #3b82f6; }
.modal-icon--orange { background: #fff0e8; color: #f97316; }
.modal-icon--red    { background: #fde8e8; color: #ef4444; }
.modal-icon--yellow { background: #fffae8; color: #f59e0b; }

.modal-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
.modal-sub   { font-size: 13px; color: #999; margin: 0; }

.mono {
  font-family: monospace; background: #f5f5f5;
  padding: 1px 5px; border-radius: 4px; color: #555; font-size: 12px;
}

/* STATUS */
.status-current {
  font-size: 13px; color: #555; background: #fafafa;
  border: 1px solid #eee; border-radius: 10px;
  padding: 10px 14px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.pending   { background: #c8c8c8; }
.status-dot.confirmed { background: #f9cc39; }
.status-dot.shipping  { background: #449af6; }
.status-dot.completed { background: #42fc6d; }
.status-dot.cancelled { background: #ff4959; }

.select-wrap { margin-bottom: 4px; }
.styled-select {
  width: 100%; padding: 12px 40px 12px 14px;
  border: 1.5px solid #e5e5e5; border-radius: 12px;
  font-size: 14px; appearance: none;
  background: #fafafa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;
  cursor: pointer; transition: border-color 0.2s; color: #333;
}
.styled-select:focus { outline: none; border-color: #FF642F; background-color: #fff; }

/* INFO BLOCK */
.info-block {
  background: #fafafa; border: 1px solid #f0f0f0;
  border-radius: 12px; padding: 12px 16px; margin-bottom: 10px;
}
.info-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: #bbb; margin-bottom: 6px;
}
.info-value { font-size: 14px; color: #333; line-height: 1.5; }
.no-evidence { font-size: 13px; color: #ccc; font-style: italic; margin: 0; }

/* Evidence grid */
.evidence-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.evidence-thumb {
  width: 72px; height: 72px; border-radius: 10px;
  overflow: hidden; position: relative; cursor: pointer;
  background: #eee; border: 1px solid #e5e5e5;
}
.evidence-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.evidence-thumb:hover img { transform: scale(1.06); }
.thumb-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s, background 0.2s; color: white;
}
.evidence-thumb:hover .thumb-overlay { opacity: 1; background: rgba(0,0,0,0.3); }
.evidence-thumb--video {
  background: #1a1a2e; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
}
.video-play-icon { color: white; }
.video-label { font-size: 10px; color: rgba(255,255,255,0.7); }

/* FIELDS */
.field { margin-bottom: 16px; }
.field-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #444; margin-bottom: 8px;
}

.styled-input{
  width: 100%;
  box-sizing: border-box;
  min-height: 50px;     /* thấp hơn */
  padding: 12px 14px;
  border-radius: 12px;  /* nhỏ hơn 18px */
  border: 1px solid #e5e5e5;
  font-size: 14px;
  resize: vertical;     /* cho phép kéo nếu cần */
  transition: 0.2s;
  background: #fafafa;
}

.styled-input:focus { outline: none; border-color: #FF642F; background: #fff; }

.required { color: #ef4444; }
.badge-required { font-size: 10px; font-weight: 600; background: #fde8e8; color: #ef4444; padding: 2px 7px; border-radius: 20px; }
.badge-optional { font-size: 10px; font-weight: 500; background: #f0f0f0; color: #999; padding: 2px 7px; border-radius: 20px; }
.evidence-counter { font-size: 11px; font-weight: 600; background: #f0f0f0; color: #666; padding: 2px 8px; border-radius: 20px; margin-left: 6px; }
.evidence-counter--full { background: #fde8e8; color: #ef4444; }

.styled-textarea {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid #e5e5e5; border-radius: 12px;
  font-size: 14px; resize: none; box-sizing: border-box;
  font-family: inherit; line-height: 1.5; color: #333;
  background: #fafafa; transition: border-color 0.2s, background 0.2s;
}
.styled-textarea:focus { outline: none; border-color: #FF642F; background: #fff; }

.char-count { font-size: 11px; color: #bbb; text-align: right; margin-top: 4px; }

/* Upload */
.upload-area {
  border: 2px dashed #e0e0e0; border-radius: 12px; padding: 16px;
  cursor: pointer; min-height: 80px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s, background 0.2s; background: #fafafa;
}
.upload-area:hover, .upload-area--active { border-color: #FF642F; background: #fff8f5; }
.upload-area--full { border-color: #ef4444 !important; background: #fff5f5 !important; cursor: not-allowed; opacity: 0.7; }
.evidence-full-badge { font-size: 11px; color: #ef4444; font-weight: 600; align-self: center; padding: 4px 10px; background: #fde8e8; border-radius: 8px; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #ccc; font-size: 13px; pointer-events: none; }
.upload-icon { color: #ccc; }
.preview-grid { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.preview-item { position: relative; width: 68px; height: 68px; }
.preview-img { width: 68px; height: 68px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
.preview-video-tile { width: 68px; height: 68px; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.video-icon { color: white; }
.video-filename { font-size: 9px; color: rgba(255,255,255,0.6); text-align: center; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.remove-btn {
  position: absolute; top: -5px; right: -5px; width: 18px; height: 18px;
  background: #ef4444; color: white; border: none; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
}
.add-more-btn {
  width: 68px; height: 68px; border: 2px dashed #ddd; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; color: #ccc; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.add-more-btn:hover { border-color: #FF642F; color: #FF642F; }
.upload-hint { font-size: 11px; color: #ccc; margin: 6px 0 0; }

/* CANCEL */
.cancel-warning { font-size: 13px; color: #ef4444; background: #fde8e8; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; }

/* BUYER REVIEW */
.all-reviewed { text-align: center; padding: 20px 0 8px; color: #10b981; }
.all-reviewed-icon { font-size: 32px; display: block; margin-bottom: 8px; }
.all-reviewed p { font-size: 14px; font-weight: 500; margin: 0; }

.pick-label { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 10px; }
.item-pick-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.item-pick-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1.5px solid #eee; border-radius: 12px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.item-pick-row:hover { background: #fff8f5; border-color: #FF642F; }
.pick-img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.pick-info { flex: 1; }
.pick-title { font-size: 13px; font-weight: 500; color: #333; }
.pick-qty { font-size: 12px; color: #999; margin-top: 2px; }
.pick-arrow { color: #ccc; }

.back-btn { background: none; border: none; color: #FF642F; font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 14px; display: flex; align-items: center; gap: 4px; }

.review-item-card { display: flex; align-items: center; gap: 12px; background: #fff8f5; border: 1px solid #ffe0d0; padding: 12px; border-radius: 12px; margin-bottom: 16px; }
.review-item-img { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.review-item-title { font-size: 13px; font-weight: 500; color: #333; line-height: 1.4; }

.star-row { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
.star { font-size: 30px; cursor: pointer; color: #e0e0e0; transition: color 0.1s, transform 0.1s; line-height: 1; user-select: none; }
.star:hover, .star.active { color: #f5a623; transform: scale(1.1); }
.star-label { font-size: 12px; color: #ccc; margin-left: 4px; min-width: 70px; }
.star-label--active { color: #f5a623; font-weight: 600; }

/* SELLER REVIEW */
.sr-item-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0; }
.sr-item-img { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee; }
.sr-item-detail { flex: 1; min-width: 0; }
.sr-item-title { font-size: 14px; font-weight: 600; color: #333; }
.sr-item-price { font-size: 13px; color: #FF642F; margin-top: 2px; }

.sr-stars-row { display: flex; align-items: center; gap: 4px; margin-bottom: 14px; }
.rstar { font-size: 20px; color: #e0e0e0; }
.rstar.filled { color: #f5a623; }
.sr-rating-label { font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-left: 8px; }
.label--green  { background: #dcfce7; color: #15803d; }
.label--yellow { background: #fef9c3; color: #92400e; }
.label--red    { background: #fee2e2; color: #b91c1c; }

.sr-reviewer-row { display: flex; align-items: center; gap: 10px; }
.sr-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #eee; }
.sr-reviewer-name { font-size: 13px; font-weight: 600; color: #333; }
.sr-reviewer-date { font-size: 11px; color: #bbb; margin-top: 2px; }

.sr-replied-box { background: linear-gradient(135deg, #fff8f5, #fff4f0); border-left: 3px solid #FF642F; border-radius: 0 12px 12px 0; padding: 12px 16px; margin-bottom: 4px; }
.sr-replied-label { font-size: 11px; font-weight: 700; color: #FF642F; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.sr-reply-date { font-weight: 400; color: #bbb; }
.sr-reply-content { font-size: 13px; color: #444; margin: 0; line-height: 1.6; white-space: pre-line; }
.sr-clamped { max-height: 80px; overflow-y: auto; scrollbar-width: thin; }

/* ACTIONS */
.modal-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 22px; padding-top: 16px; border-top: 1px solid #f5f5f5;
}

.btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: background 0.15s, transform 0.1s, opacity 0.15s; display: flex; align-items: center; gap: 6px; }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.btn-primary { background: #FF642F; color: white; }
.btn-primary:hover:not(:disabled) { background: #e05522; }
.btn-ghost { background: #f5f5f5; color: #555; }
.btn-ghost:hover:not(:disabled) { background: #ebebeb; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-success { background: #10b981; color: white; }
.btn-success:hover:not(:disabled) { background: #059669; }

/* LIGHTBOX */
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.lightbox-img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 8px; background: #eee;}
.lightbox-video { max-width: 90vw; max-height: 85vh; border-radius: 8px; }
.lightbox-close { position: fixed; top: 18px; right: 22px; width: 36px; height: 36px; background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.lightbox-close:hover { background: rgba(255,255,255,0.3); }
.lightbox-nav { position: fixed; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.lightbox-nav:hover { background: rgba(255,255,255,0.3); }
.lightbox-nav--prev { left: 18px; }
.lightbox-nav--next { right: 18px; }
.lightbox-counter { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.8); font-size: 13px; padding: 4px 14px; border-radius: 20px; }

/* CANCEL REASON BLOCK (in status modal) */
.cancel-reason-block {
  margin-top: 4px;
}

/* Quick reason pills (buyer cancel) */
.reason-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.reason-pill {
  padding: 5px 13px;
  border-radius: 20px;
  border: 1.5px solid #e5e5e5;
  background: white;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.reason-pill:hover  { border-color: #ef4444; color: #ef4444; }
.reason-pill.active { background: #ef4444; color: white; border-color: #ef4444; }

/* Fade-slide transition for cancel reason block */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

</style>