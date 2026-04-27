<template>
  <div v-if="isVisible" class="comment-modal-overlay" @click="handleOverlayClick">
    <div class="comment-modal-content" @click.stop>
      
      <div class="comment-modal-header">
        <h3>{{ post?.author?.firstname }} {{ post?.author?.lastname }}'s post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="post-detail">
        <div class="post-author-info">
          <img :src="getAvatarUrl(post?.author)" class="author-avatar" alt="avatar" />
          <div class="author-details">
            <strong>{{ post?.author?.firstname }} {{ post?.author?.lastname }}</strong>
            <p class="time">
              {{ formatTime(post?.createdAt) }}
              <span v-if="post?.audience === 'public'">🌍</span>
              <span v-else-if="post?.audience === 'friends'">👥</span>
              <span v-else-if="post?.audience === 'private'">🔒</span>
            </p>
          </div>
        </div>

        <div class="post-content">
          <h3 class="recipe-title">{{ post?.title }}</h3>
          <span class="recipe-category">{{ post?.category }}</span>

          <div class="recipe-body">
            <div v-if="!isContentExpanded">
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ getTruncatedText(post?.ingredients) }}</p>
              
              <template v-if="!shouldShowReadMore">
                 <p class="recipe-section-header">Instructions:</p>
                 <p class="post-text">{{ post?.instructions }}</p>
              </template>
            </div>

            <div v-else>
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ post?.ingredients }}</p>
              
              <p class="recipe-section-header">Instructions:</p>
              <p class="post-text">{{ post?.instructions }}</p>
            </div>
          </div>

          <button v-if="shouldShowReadMore" @click="toggleContent" class="read-more-btn">
            {{ isContentExpanded ? 'Show Less' : 'Show More' }}
          </button>
        </div>
        <div v-if="post?.media" class="post-media-modal">
          <img v-if="post?.mediaType === 'image'" :src="resolveMediaUrl(post.media)" class="post-image-modal" />
          <video v-else-if="post?.mediaType === 'video'" controls class="post-video-modal">
            <source :src="resolveMediaUrl(post.media)" type="video/mp4" />
          </video>
        </div>

        <!-- INGREDIENTS & TOOLS -->
        <div
          v-if="post?.linkedItems?.length"
          class="linked-items-preview"
        >
          <div class="linked-items-header">
            🛒 Ingredients & Tools ({{ linkedItemTotal }})
          </div>

          <div class="linked-item-card">
            <!-- ITEM INFO -->
            <div class="linked-item-left">
              <img
                v-if="currentLinkedItem?.images?.length"
                :src="getItemImage(currentLinkedItem.images)"
                class="linked-item-thumb"
              />

              <div class="linked-item-info">
                <div class="linked-item-title" :title="currentLinkedItem.title">
                  {{ currentLinkedItem.title }}
                </div>

                <div class="linked-item-meta">
                  {{ currentLinkedItem.type }}

                  <span
                    v-if="currentLinkedItem.type === 'tool' && currentLinkedItem.condition"
                  >
                    · {{ currentLinkedItem.condition }}
                  </span>

                  <span
                    v-if="currentLinkedItem.seller?._id === (user._id || user.id)"
                    class="own-item-badge"
                  >
                    YOUR ITEM
                  </span>


                  <button
                    class="view-item-btn"
                    @click="openItem(currentLinkedItem._id)"
                  >
                    View item
                  </button>
                </div>


              </div>
            </div>

            <!-- ARROWS -->
            <div
              v-if="linkedItemTotal > 1"
              class="linked-item-arrows"
            >
              <button
                class="arrow-btn"
                @click="prevItem"
                :disabled="currentItemIndex === 0"
              >
                ‹
              </button>
              <button
                class="arrow-btn"
                @click="nextItem"
                :disabled="currentItemIndex === linkedItemTotal - 1"
              >
                ›
              </button>
            </div>
          </div>

          <div class="linked-item-counter">
            {{ currentItemIndex + 1 }} / {{ linkedItemTotal }}
          </div>
        </div>


        <div v-if="totalRatings > 0" class="rating-statistics">
          <div class="rating-summary">
            <div class="average-rating">
              <span class="rating-number">{{ averageRating }}</span>
              <div class="stars-display">
                <span v-for="star in 5" :key="star" class="star-icon" :class="{ filled: star <= Math.round(averageRating) }">★</span>
              </div>
            </div>
            <div class="rating-count">
              <span>{{ totalRatings }} rating{{ totalRatings > 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <div class="post-stats">
          <span v-if="post?.likes?.length > 0">{{ post.likes.length }} liked</span>
          <span v-if="totalCommentCount > 0">{{ totalCommentCount }} commented</span>
          <span v-if="post?.sharesCount > 0">{{ post.sharesCount }} shared</span>
          <span v-if="postSaveCount > 0" :class="{ updated: saveCountUpdated }">{{ postSaveCount }} saved</span>
        </div>

        <div class="post-actions-modal">
          <button @click="toggleLike" class="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
              :fill="isLiked ? '#FF4444' : 'none'" :stroke="isLiked ? '#FF4444' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-icon lucide-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
            </svg>
            <span>Like</span>
          </button> 
          <button class="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle-more-icon lucide-message-circle-more"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
            <span>Comment</span>
          </button>
          <button @click="sharePost" class="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share2-icon lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            <span>Share</span>
          </button>
          <button @click="toggleSavePost" class="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
              viewBox="0 0 24 24" :fill="isSaved ? '#FFFF00' : 'none'" :stroke="isSaved ? '#FFFF00': 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark-icon lucide-bookmark"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>
            </svg>
            <span>{{ isSaved ? 'Saved' : 'Save' }}</span>
          </button>
        </div>
      </div>

      <div class="comments-section">
        <div class="comment-filter-bar">
          <button @click="commentFilter = 'newest'" :class="{ active: commentFilter === 'newest' }" class="filter-btn">Newest</button>
          <button @click="commentFilter = 'oldest'" :class="{ active: commentFilter === 'oldest' }" class="filter-btn">Oldest</button>
          <button @click="commentFilter = 'rated'" :class="{ active: commentFilter === 'rated' }" class="filter-btn">With Rating</button>
          <button @click="commentFilter = 'normal'" :class="{ active: commentFilter === 'normal' }" class="filter-btn">Comments Only</button>
        </div>

        <div class="comments-list">
          <div v-if="comments.length === 0" class="no-comments">
            <div class="no-comments-icon">💬</div>
            <p>No comments yet</p>
            <p class="sub-text">Be the first to share what you think!</p>
          </div>

          <div v-for="comment in filteredComments" :key="comment._id" :id="`comment-${comment._id}`" class="comment-item" :class="{ 'comment-highlight': highlightedId === comment._id }">
            <img :src="getAvatarUrl(comment.author)" class="comment-avatar" alt="avatar" />
            <div class="comment-content">
              <div class="comment-bubble">
                <strong class="comment-author">{{ comment.author?.firstname }} {{ comment.author?.lastname }}</strong>
                <span v-if="isPostAuthor(comment.author)" class="author-label">Author</span>
                
                <div v-if="comment.rating" class="comment-rating">
                  <span v-for="star in 5" :key="star" class="star-display" :class="{ filled: star <= comment.rating }">★</span>
                  <span class="rating-text-display">{{ comment.rating }} stars</span>
                </div>

                <div v-if="editingCommentId === comment._id" class="edit-comment-container">
                  <div v-if="showEditRating" class="edit-rating-section">
                    <span class="edit-rating-label">Edit Rating:</span>
                    <div class="edit-stars">
                      <span v-for="star in 5" :key="star" @click="editingRating = star" @mouseenter="editingHoverRating = star" @mouseleave="editingHoverRating = 0" class="star" :class="{ filled: star <= (editingHoverRating || editingRating) }">★</span>
                      <span class="edit-rating-value">{{ editingRating }} stars</span>
                    </div>
                  </div>
                  
                  <div class="edit-input-wrapper">
                    <textarea 
                      :ref="'editCommentInput-' + comment._id"
                      v-model="editedContent" 
                      class="edit-textarea-with-emoji" 
                      @keyup.enter="saveComment(comment._id)"
                      @focus="trackFocus('editCommentInput-' + comment._id, 'editedContent', null)"
                    ></textarea>
                    
                    <div class="emoji-wrapper-edit">
                        <button @click.stop="toggleEmojiPicker('edit-comment-' + comment._id)" class="emoji-btn-small">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="'#FFFF00'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-icon lucide-smile"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                        </svg>
                        </button>
                        <div v-if="activeEmojiPicker === 'edit-comment-' + comment._id" class="emoji-popover-up" @click.stop>
                          <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                        </div>
                    </div>
                  </div>
                  
                  <div class="edit-actions">
                    <button @click="saveComment(comment._id)" class="save-btn">Save</button>
                    <button @click="cancelEdit" class="cancel-btn">Cancel</button>
                  </div>
                </div>

                <p v-else class="comment-text">
                  <span v-if="comment.replyToUser" class="reply-to-name">
                    @{{ comment.replyToUser.firstname }} {{ comment.replyToUser.lastname }}
                  </span>
                  {{ comment.content }}
                </p>
              </div>

              <div class="comment-actions">
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                <button @click="toggleCommentLike(comment)" class="comment-action-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                :fill="isCommentLiked(comment) ? '#FF4444' : 'none'" :stroke="isCommentLiked(comment) ? '#FF4444' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-icon lucide-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
                </svg>
                  <span>{{ comment.likeCount || comment.likes?.length || 0 }}</span>
                </button>
                <button v-if="!isMyComment(comment)" @click="toggleReply(comment._id)" class="comment-action-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-reply-icon lucide-reply"><path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/>
                  </svg>Reply
                </button>
                <button v-if="isMyComment(comment)" @click="editComment(comment)" class="comment-action-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
                  </svg>
                  Edit
                </button>
                <button v-if="isMyComment(comment)" @click="deleteComment(comment._id)" class="comment-action-btn" style="color: red;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>

              <div v-if="replyInputs[comment._id] !== undefined" class="reply-section">
                <div class="reply-input-wrapper">
                  <img :src="getAvatarUrl(user)" class="user-avatar-small" alt="avatar" />
                  
                  <div class="input-with-emoji-container">
                    <input
                      :ref="'replyInput-' + comment._id"
                      v-model="replyInputs[comment._id]"
                      @keyup.enter="submitReply(comment._id)"
                      :placeholder="`Reply to ${replyingTo[comment._id]?.firstname} ${replyingTo[comment._id]?.lastname}...`"
                      class="reply-input"
                      @focus="trackFocus('replyInput-' + comment._id, 'replyInputs', comment._id)"
                    />
                    <div class="emoji-wrapper-small">
                       <button @click.stop="toggleEmojiPicker('reply-' + comment._id)" class="emoji-btn-small">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="'#FFFF00'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-icon lucide-smile"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                        </svg>
                       </button>
                       
                    </div>
                    
                  </div>
                  
                  <button 
                    @click="submitReply(comment._id)" 
                    :disabled="!replyInputs[comment._id]?.trim()"
                    class="send-reply-btn"
                  >➤</button>
                </div>
                <div v-if="activeEmojiPicker === 'reply-' + comment._id" class="emoji-popover-up" @click.stop>
                  <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                </div>
              </div>

              <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                <button @click="toggleRepliesVisibility(comment._id)" class="toggle-replies-btn">
                  {{ showReplies[comment._id] ? 'Hide' : 'View' }} {{ comment.replies.length }} 
                  {{ comment.replies.length === 1 ? 'reply' : 'replies' }}
                </button>

                <div v-if="showReplies[comment._id]" class="replies-list">
                  <div v-for="reply in comment.replies" :key="reply._id" class="reply-item">
                    <img :src="getAvatarUrl(reply.author)" class="user-avatar-small" alt="avatar" />
                    <div class="reply-content">
                      <div v-if="editingReplyId === reply._id" class="edit-reply-container">
                        <div class="edit-input-wrapper">
                          <textarea 
                            :ref="'editReplyInput-' + reply._id"
                            v-model="editedReplyContent" 
                            class="edit-reply-input-with-emoji" 
                            @keyup.enter="saveReply(comment._id, reply._id)"
                            @focus="trackFocus('editReplyInput-' + reply._id, 'editedReplyContent', null)"
                          ></textarea>

                          <div class="emoji-wrapper-edit">
                              <button @click.stop="toggleEmojiPicker('edit-reply-' + reply._id)" class="emoji-btn-small">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="'#FFFF00'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-icon lucide-smile"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                                </svg>
                              </button>
                              <div v-if="activeEmojiPicker === 'edit-reply-' + reply._id" class="emoji-popover-up" @click.stop>
                                <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                              </div>
                          </div>
                        </div>

                        <div class="edit-actions">
                          <button @click="saveReply(comment._id, reply._id)" class="save-btn">Save</button>
                          <button @click="cancelEditReply" class="cancel-btn">Cancel</button>
                        </div>
                      </div>
                      <div v-else class="reply-bubble">
                        <strong>{{ reply.author?.firstname }} {{ reply.author?.lastname }}</strong>
                        <span v-if="isPostAuthor(reply.author)" class="author-label">Author</span>
                        <p>
                          <span v-if="reply?.replyTo" class="reply-to-name">@{{ reply?.replyTo?.firstname }} {{ reply?.replyTo?.lastname }}</span>
                          {{ reply.content }}
                        </p>
                      </div>

                      <div class="reply-actions">
                        <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                        <button @click="toggleReplyLike(reply, comment._id)" class="comment-action-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                          :fill="isReplyLiked(reply) ? '#FF4444' : 'none'" :stroke="isReplyLiked(reply) ? '#FF4444' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-icon lucide-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
                          </svg>
                          <span>{{ reply.likeCount || reply.likes?.length || 0 }}</span>
                        </button>
                        <button v-if="!isMyReply(reply)" @click="toggleReplyToReply(reply._id, reply.author)" class="comment-action-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-reply-icon lucide-reply"><path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/>
                          </svg>Reply
                        </button>
                        <button v-if="isMyReply(reply)" @click="startEditReply(reply)" class="comment-action-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
                          </svg>
                          Edit
                        </button>
                        <button v-if="isMyReply(reply)" @click="deleteReply(comment._id, reply._id)" class="comment-action-btn" style="color: red;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>Delete
                        </button>
                      </div>

                      <div v-if="replyInputsReply[reply._id] !== undefined" class="reply-to-reply-input-wrapper">
                        <img :src="getAvatarUrl(user)" class="user-avatar-small" />
                        
                        <div class="input-with-emoji-container">
                          <input
                            :ref="'replyToReplyInput-' + reply._id"
                            v-model="replyInputsReply[reply._id]"
                            :placeholder="`Reply to ${replyingToReply[reply._id]?.firstname} ${replyingToReply[reply._id]?.lastname}...`"
                            class="reply-input"
                            @keypress.enter="submitReplyToReply(comment._id, reply._id)"
                            @focus="trackFocus('replyToReplyInput-' + reply._id, 'replyInputsReply', reply._id)"
                          />
                           <div class="emoji-wrapper-small">
                             <button @click.stop="toggleEmojiPicker('replyToReply-' + reply._id)" class="emoji-btn-small">
                               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="'#FFFF00'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-icon lucide-smile"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                              </svg>
                             </button>
                             
                          </div>
                        </div>

                        <button @click="submitReplyToReply(comment._id, reply._id)" class="send-reply-btn" :disabled="!replyInputsReply[reply._id]?.trim()">➤</button>
                        
                      </div>
                      <div v-if="activeEmojiPicker === 'replyToReply-' + reply._id" class="emoji-popover-up" @click.stop>
                               <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                             </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="add-comment-section">
        <img :src="getAvatarUrl(user)" class="user-avatar" alt="avatar" />
        <div class="comment-input-container">
          <div class="rating-toggle">
            <button @click="showRatingOption = !showRatingOption" :disabled="userHasRated && !showRatingOption" class="toggle-rating-btn" :class="{ disabled: userHasRated && !showRatingOption }">
              <span v-if="!showRatingOption && !userHasRated">Add Rating</span>
              <span v-else-if="!showRatingOption && userHasRated">Already Rated</span>
              <span v-else>Comment Only</span>
            </button>
          </div>

          <div v-if="showRatingOption" class="star-rating-selector">
            <span v-for="star in 5" :key="star" @click="selectedRating = star" @mouseenter="hoverRating = star" @mouseleave="hoverRating = 0" class="star" :class="{ filled: star <= (hoverRating || selectedRating), selected: star <= selectedRating }">★</span>
            <span v-if="selectedRating > 0" class="rating-text">{{ selectedRating }} star{{ selectedRating > 1 ? 's' : '' }}</span>
          </div>

          <div class="comment-input-wrapper">
            <input
              ref="mainCommentInput"
              v-model="newComment"
              @keyup.enter="submitComment"
              :placeholder="showRatingOption ? 'Write a review...' : 'Write a comment...'"
              class="comment-input"
              @focus="trackFocus('mainCommentInput', 'newComment', null)"
            />
            
            <div class="emoji-wrapper-main">
              <button @click.stop="toggleEmojiPicker('main')" class="emoji-btn-main">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="'#FFFF00'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-icon lucide-smile"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                </svg>
              </button>
              <div v-if="activeEmojiPicker === 'main'" class="emoji-popover-main" @click.stop>
                <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
              </div>
            </div>

            <button @click="submitComment" :disabled="!newComment.trim() || (showRatingOption && selectedRating === 0)" class="send-comment-btn">➤</button>
          </div>
        </div>
      </div>
    </div>
  </div>
    <NotificationModal 
      :is-visible="notification.visible" 
      :type="notification.type" 
      :title="notification.title" 
      :message="notification.message" 
      @confirm="closeNotify" 
    />
</template>

<script>
// Import thư viện Emoji
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import NotificationModal from "../notifications/NotificationModal.vue";

export default {
  name: "CommentModal",
  components: {
    EmojiPicker,
    NotificationModal
  },
  props: {
    post: {
      type: Object,
      default: null
    },
    user: {
      type: Object,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    initialSaveCount: {
      type: Number,
      default: 0
    },
    highlightCommentId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      comments: [],
      newComment: '',
      commentLikes: {},
      replyInputs: {},
      editingCommentId: null,
      editedContent: "",

      showReplies: {},
      replyingTo: {},
      editingReplyId: null,
      editedReplyContent: '',
      replyingToReply: {},
      replyInputsReply: {},

      savedPosts: [], 
      postSaveCount: 0, 
      saveCountUpdated: false,

      // Rating logic
      showRatingOption: false,
      selectedRating: 0,
      hoverRating: 0,
      userHasRated: false, 
      localTotalRatings: 0, 
      localAverageRating: 0,
      editingRating: 0,
      showEditRating: false,
      editingHoverRating: 0,

      commentFilter: 'newest', 

      isContentExpanded: false,
      

      // --- Emoji Logic Data ---
      activeEmojiPicker: null, // ID của picker đang mở (null = đóng hết)
      // Lưu trữ thông tin ô input cuối cùng được focus
      lastFocusedInput: { 
        refName: 'mainCommentInput', 
        modelType: 'newComment', // 'newComment', 'replyInputs', 'replyInputsReply'
        key: null // ID của comment/reply (nếu có)
      },

      currentItemIndex: 0,

      highlightedId: null,

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },

    }
  },
  computed: {
    isLiked() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return this.post?.likes && this.post.likes.includes(savedUser?.id);
    },

    isSaved() {
      return this.savedPosts.includes(this.post?._id);
    },

    totalCommentCount() {
      let total = this.comments.length;
      this.comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          total += comment.replies.length;
        }
      });
      return total;
    },

    totalRatings() {
      return this.localTotalRatings || this.post?.totalRatings || 0;
    },

    averageRating() {
      return this.localAverageRating || this.post?.averageRating || 0;
    },

    filteredComments() {
      let filtered = [...this.comments];
      
      if (this.commentFilter === 'rated') {
        filtered = filtered.filter(c => c.rating && c.rating > 0);
      } else if (this.commentFilter === 'normal') {
        filtered = filtered.filter(c => !c.rating || c.rating === 0);
      }
      
      if (this.commentFilter === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (this.commentFilter === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      return filtered;
    },

    shouldShowReadMore() {
      if (!this.post) return false;
      const text = (this.post.ingredients || '') + (this.post.instructions || '');
      const lines = text.split('\n');
      // Hiện nút nếu dài hơn 5 dòng hoặc 200 ký tự
      return lines.length > 5 || text.length > 200;
    },

    currentLinkedItem() {
      if (!this.post?.linkedItems?.length) return null;
      return this.post.linkedItems[this.currentItemIndex];
    },

    linkedItemTotal() {
      return this.post?.linkedItems?.length || 0;
    }


    
  },
  watch: {
    post: {
      handler(newPost) {
        if (newPost) {
          this.localTotalRatings = newPost.totalRatings || 0;
          this.localAverageRating = newPost.averageRating || 0;
          this.fetchComments(newPost._id);
          this.fetchPostSaveCount();
          this.checkUserRating();
          
        }
      },
      immediate: true
    },

    isVisible(newVal) {
      if (newVal && this.post) {
        this.localTotalRatings = this.post.totalRatings || 0;
        this.localAverageRating = this.post.averageRating || 0;
        this.fetchComments(this.post._id);
        this.loadSavedPosts();
        this.fetchPostSaveCount();
        this.checkUserRating();
        
        
        // Auto focus vào ô comment chính
        this.$nextTick(() => {
          if (this.$refs.mainCommentInput) {
             this.$refs.mainCommentInput.focus();
          }
        });

        // Lắng nghe sự kiện click để đóng emoji picker
        document.addEventListener('click', this.closeEmojiPickerOnClickOutside, true);

        if (this.highlightCommentId) {
          this.highlightedId = this.highlightCommentId;
          this.$nextTick(() => {
            setTimeout(() => {
              const el = document.getElementById(`comment-${this.highlightCommentId}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
          });
        }
      } else {
        // Cleanup khi đóng modal
        document.removeEventListener('click', this.closeEmojiPickerOnClickOutside, true);
        this.activeEmojiPicker = null;
        this.highlightedId = null;
      }
    },

    initialSaveCount(newCount) {
      if (newCount !== undefined && newCount !== this.postSaveCount) {
        this.postSaveCount = newCount;
      }
    }
  },
  methods: {
    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `http://localhost:3000/${img}`;
    },

    // --- EMOJI LOGIC METHODS ---
    
    toggleEmojiPicker(pickerId) {
      // Nếu đang mở đúng cái đó thì đóng, ngược lại mở cái mới
      if (this.activeEmojiPicker === pickerId) {
        this.activeEmojiPicker = null;
      } else {
        this.activeEmojiPicker = pickerId;
      }
    },
    
closeEmojiPickerOnClickOutside(event) {
  // Nếu click nằm trong BẤT KỲ vùng emoji nào → bỏ qua
  if (
    event.target.closest('.emoji-wrapper-main') ||
    event.target.closest('.emoji-wrapper-small') ||
    event.target.closest('.emoji-wrapper-edit') ||
    event.target.closest('.emoji-popover-main') ||
    event.target.closest('.emoji-popover-up')
  ) {
    return;
  }

  // Click ngoài → đóng emoji
  this.activeEmojiPicker = null;
},



    // Theo dõi ô input nào đang được focus
    trackFocus(refName, modelType, key) {
      this.lastFocusedInput = { refName, modelType, key };
    },

    insertEmoji(emoji) {
      const { refName, modelType, key } = this.lastFocusedInput;
      const emojiChar = emoji.i;
      
      // Lấy DOM element của input từ $refs
      let inputRef = null;
      if (Array.isArray(this.$refs[refName])) {
        inputRef = this.$refs[refName][0]; // Ref trong v-for trả về mảng
      } else {
        inputRef = this.$refs[refName];
      }

      if (!inputRef) return;

      // Xác định model data cần update
      let currentValue = '';
      if (modelType === 'newComment') {
        currentValue = this.newComment;
      } else if (modelType === 'replyInputs') {
        currentValue = this.replyInputs[key] || '';
      } else if (modelType === 'replyInputsReply') {
        currentValue = this.replyInputsReply[key] || '';
      } else if (modelType === 'editedContent') 
        currentValue = this.editedContent;
        else if (modelType === 'editedReplyContent') 
        currentValue = this.editedReplyContent;

      // Chèn ký tự tại vị trí con trỏ
      const start = inputRef.selectionStart;
      const end = inputRef.selectionEnd;
      const newValue = currentValue.substring(0, start) + emojiChar + currentValue.substring(end);
      
      // Cập nhật lại model
      if (modelType === 'newComment') {
        this.newComment = newValue;
      } else if (modelType === 'replyInputs') {
        this.replyInputs[key] = newValue;
      } else if (modelType === 'replyInputsReply') {
        this.replyInputsReply[key] = newValue;
      } else if (modelType === 'editedContent') 
        this.editedContent = newValue;
        else if (modelType === 'editedReplyContent') 
        this.editedReplyContent = newValue;

      // Đặt lại con trỏ ngay sau emoji vừa chèn
      this.$nextTick(() => {
        inputRef.focus();
        inputRef.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
      });
    },

    // --- END EMOJI LOGIC ---

    closeModal() {
      this.$emit('close');
      this.resetModal();

      if (this.$route.query.postId || this.$route.query.highlightComment) {
        this.$router.replace({ path: '/home' });
      }
    },

    resetModal() {
      this.comments = [];
      this.newComment = '';
      this.replyInputs = {};
      this.showReplies = {};
      this.replyingTo = {};
      this.editingCommentId = null;
      this.editedContent = '';
      this.editingReplyId = null;
      this.editedReplyContent = '';
      this.replyingToReply = {};
      this.replyInputsReply = {};
      this.selectedRating = 0;
      this.showRatingOption = false;
      this.localTotalRatings = 0;    
      this.localAverageRating = 0;   
      this.userHasRated = false;  
      this.isContentExpanded = false; 
      this.contentLineCount = 0;
      this.activeEmojiPicker = null; // Reset emoji state
    },

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      // Cloudinary URL đã có https:// → dùng thẳng, không prefix
      if (author.avatar.startsWith('http')) return author.avatar;
      return `http://localhost:3000/${author.avatar}`;
    },

    resolveMediaUrl(media) {
      if (!media) return '';
      if (media.startsWith('http')) return media;
      return `http://localhost:3000/${media}`;
    },

    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    },

    isPostAuthor(author) {
      return this.post?.author?._id === author?._id;
    },

    async loadSavedPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;

        const res = await fetch(`http://localhost:3000/feeds/users/${savedUser.id}/saved-items`);
        if (res.ok) {
          const data = await res.json();
          this.savedPosts = data.savedItems || [];
        }
      } catch (err) {
        console.error("Failed to load saved posts:", err);
      }
    },

    async fetchPostSaveCount() {
      if (!this.post || !this.post._id) return;

      try {
        const res = await fetch(`http://localhost:3000/posts/${this.post._id}/saves-count`);
        if (res.ok) {
          const data = await res.json();
          this.postSaveCount = data.savesCount || 0;
        }
      } catch (err) {
        console.error("Cannot fetch save count:", err);
        this.postSaveCount = 0;
      }
    },

    async toggleSavePost() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return this.showNotify("error", "Error", "Please login to save posts");

      try {
        const postId = this.post._id;
        const isSaved = this.savedPosts.includes(postId);
        
        const res = await fetch(`http://localhost:3000/feeds/save/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: savedUser.id,
            action: isSaved ? 'unsave' : 'save'
          })
        });

        const data = await res.json();
        
        if (res.ok) {
          this.saveCountUpdated = true;
          setTimeout(() => {
            this.saveCountUpdated = false;
          }, 300);

          if (isSaved) {
            this.savedPosts = this.savedPosts.filter(id => id !== postId);
            this.postSaveCount = Math.max(0, this.postSaveCount - 1);
            this.$emit('save-count-updated', { postId: postId, count: this.postSaveCount });
            this.$emit('save-status-changed', { postId: postId, isSaved: false });
            this.showNotify("success", "Success", data.msg || 'Item unsaved successfully');
          } else {
            this.savedPosts.push(postId);
            this.postSaveCount++;
            this.$emit('save-count-updated', { postId: postId, count: this.postSaveCount });
            this.$emit('save-status-changed', { postId: postId, isSaved: true });
            this.showNotify("success", "Success", data.msg || 'Item saved successfully');
          }
        } else {
          this.showNotify("error", "Error", data.msg || 'Failed to save/unsave item');
        }
      } catch (err) {
        console.error("Cannot save/unsave item:", err);
        this.showNotify("error", "Error", 'Unable to save/unsave item');
      }
    },

    async fetchComments(postId) {
      try {
        const isShare = this.post.isSharePost || false; 
        const url = `http://localhost:3000/comments/posts/${postId}${isShare ? '?isShare=true' : ''}`;
        
        const res = await fetch(url);
        const data = await res.json();
        this.comments = data;
      } catch (err) {
        console.error("Error to fetch comments:", err);
        this.comments = [];
      }
    },

    async submitComment() {
      if (!this.newComment.trim()) return;
      
      if (this.showRatingOption && this.selectedRating === 0) {
        return this.showNotify("error", "Error", 'Please select a rating');
      }

      if (this.showRatingOption && this.userHasRated) {
        return this.showNotify("error", "Error", 'You have already rated this post. You can only rate once');
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !this.post) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: this.newComment,
            authorId: user.id,
            rating: this.showRatingOption ? this.selectedRating : null
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Submit comment fail");

        this.comments.unshift(data.comment);
        
        if (this.showRatingOption && this.selectedRating > 0) {
          this.userHasRated = true;
          await this.fetchRatingStats();
        }
        
        this.newComment = "";
        this.selectedRating = 0;
        this.showRatingOption = false;
        
        this.$emit('commented', data.comment);
        this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
        this.$emit('rating-updated', { 
          postId: this.post._id, 
          totalRatings: this.localTotalRatings,
          averageRating: this.localAverageRating
        });
      } catch (err) {
        console.error("Error to send comment:", err);
        this.showNotify("error", "Error", 'Unable to send comment' + err.message);
      }
    },
      
    async toggleCommentLike(comment) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return this.showNotify("error", "Error", 'Please login to like comments');

      try {
        const res = await fetch(`http://localhost:3000/comments/like/${comment._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();
        if (res.ok && data.comment) {
          const commentIndex = this.comments.findIndex(c => c._id === comment._id);
          if (commentIndex !== -1) {
            this.comments[commentIndex].likes = data.comment.likes;
            if (data.comment.likeCount !== undefined) {
              this.comments[commentIndex].likeCount = data.comment.likeCount;
            }
          }
        }
      } catch (err) {
        console.error("Error to like comment:", err);
      }
    },

    isCommentLiked(comment) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return comment.likes && comment.likes.includes(savedUser?.id);
    },

    editComment(comment) {
      this.editingCommentId = comment._id;
      this.editedContent = comment.content;

      if (comment.rating && comment.rating > 0) {
        this.editingRating = comment.rating;
        this.showEditRating = true;
      } else {
        this.editingRating = 0;
        this.showEditRating = false;
      }
    },

    async saveComment(commentId) {
      if (!this.editedContent.trim()) return;

      try {
        const updateData = { content: this.editedContent };
        
        if (this.showEditRating && this.editingRating > 0) {
          updateData.rating = this.editingRating;
        }
        
        const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        const data = await res.json();
        
        if (res.ok) {
          const commentIndex = this.comments.findIndex(c => c._id === commentId);
          if (commentIndex !== -1) {
            this.comments[commentIndex].content = this.editedContent;
            
            if (this.showEditRating) {
              this.comments[commentIndex].rating = this.editingRating;
            }
            
            if (data.ratingStats) {
              this.localTotalRatings = data.ratingStats.totalRatings;
              this.localAverageRating = data.ratingStats.averageRating;
              
              this.$emit('rating-updated', { 
                postId: this.post._id,
                totalRatings: data.ratingStats.totalRatings,
                averageRating: data.ratingStats.averageRating
              });
            }
          }
          this.cancelEdit();
        }
      } catch (err) {
        console.error("Error to update comment:", err);
        this.showNotify("error", "Error", 'Unable to update comment');
      }
    },

    cancelEdit() {
      this.editingCommentId = null;
      this.editedContent = '';
      this.editingRating = 0;
      this.showEditRating = false;
      this.editingHoverRating = 0;
    },

    async deleteComment(commentId) {
      if (!confirm("Are you sure to delete this comment")) return;

      try {
        const deletedComment = this.comments.find(c => c._id === commentId);
        const hadRating = deletedComment && deletedComment.rating > 0;

        const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          this.comments = this.comments.filter(c => c._id !== commentId);
          
          if (hadRating) {
            const savedUser = JSON.parse(localStorage.getItem("user"));
            if (deletedComment.author._id === savedUser.id) {
              this.userHasRated = false;
            }
            await this.fetchRatingStats();
          }
          
          this.$emit('comment-deleted', commentId);
          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
          this.$emit('rating-updated', { 
            postId: this.post._id,
            totalRatings: this.localTotalRatings,
            averageRating: this.localAverageRating
          });
        }
      } catch (err) {
        console.error("Error to delete comment:", err);
        this.showNotify("error", "Error", 'Unable to delete comment');
      }
    },

    isMyComment(comment) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && comment.author._id === savedUser.id;
    },

    // Reply methods
    toggleReply(commentId) {
      if (this.replyInputs[commentId] !== undefined) {
        delete this.replyInputs[commentId];
        delete this.replyingTo[commentId];
      } else {
        const comment = this.comments.find(c => c._id === commentId);
        this.replyInputs[commentId] = '';
        this.replyingTo[commentId] = comment.author;
        
        // Focus vào input sau khi mở
        this.$nextTick(() => {
           const refName = 'replyInput-' + commentId;
           const el = this.$refs[refName];
           // Nếu ref nằm trong v-for nó sẽ là mảng
           if(el && el[0]) el[0].focus();
        });
      }
    },

    // Reply to reply methods
    toggleReplyToReply(replyId, replyAuthor) {
      if (this.replyInputsReply[replyId] !== undefined) {
        delete this.replyInputsReply[replyId];
        delete this.replyingToReply[replyId];
      } else {
        this.replyInputsReply[replyId] = '';
        this.replyingToReply[replyId] = replyAuthor;

        // Focus vào input
        this.$nextTick(() => {
           const refName = 'replyToReplyInput-' + replyId;
           const el = this.$refs[refName];
           if(el && el[0]) el[0].focus();
        });
      }
    },

    async submitReply(commentId) {
      const replyContent = this.replyInputs[commentId];
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const replyTo = this.replyingTo[commentId];
      const replyToReply = this.replyingToReply[commentId];

      if (!replyContent?.trim()) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: replyContent,
            authorId: savedUser.id,
            replyToUserId: replyTo?._id || null,
            replyToReplyId: replyToReply?._id || null
          })
        });

        const data = await res.json();
        if (res.ok && data.reply) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            comment.replies.push(data.reply);
            this.showReplies[commentId] = true;
          }
          delete this.replyInputs[commentId];
          delete this.replyingTo[commentId];
          delete this.replyingToReply[commentId];

          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
        }
      } catch (err) {
        console.error("Unable to reply:", err);
      }
    },

    async submitReplyToReply(commentId, replyId) {
      const content = this.replyInputsReply[replyId];
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const replyTo = this.replyingToReply[replyId];

      if (!content?.trim()) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            authorId: savedUser.id,
            replyToUserId: replyTo?._id || null
          })
        });

        const data = await res.json();
        if (res.ok && data.reply) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            comment.replies.push(data.reply);
          }
          delete this.replyInputsReply[replyId];
          delete this.replyingToReply[replyId];

          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
        }
      } catch (err) {
        console.error("Error replying to reply:", err);
      }
    },

    toggleRepliesVisibility(commentId) {
      this.showReplies[commentId] = !this.showReplies[commentId];
    },

    async toggleReplyLike(reply, commentId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return this.showNotify("error", "Error", 'Please login to like replies');

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${reply._id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();
        if (res.ok) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            const replyIndex = comment.replies.findIndex(r => r._id === reply._id);
            if (replyIndex !== -1) {
              comment.replies[replyIndex] = data.reply;
            }
          }
        }
      } catch (err) {
        console.error("Error to like reply:", err);
      }
    },

    isReplyLiked(reply) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return reply?.likes?.includes(savedUser?.id);
    },

    isMyReply(reply) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return reply?.author?._id === savedUser?.id;
    },

    async deleteReply(commentId, replyId) {
      if (!confirm("Do you want to delete this reply?")) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            comment.replies = comment.replies.filter(r => r._id !== replyId);
            this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
          }
        } else {
          const err = await res.json();
          this.showNotify("error", "Error", err.msg || 'Fail to delete reply');
        }
      } catch (err) {
        console.error("Error to delete reply:", err);
        this.showNotify("error", "Error", 'Unable to delete reply');
      }
    },

    startReplyingTo(commentId, user, reply) {
      this.replyInputs[commentId] = '';
      this.replyingTo[commentId] = user;
      this.replyingToReply[commentId] = reply;
      this.showReplies[commentId] = true;
    },

    startReplyingToReply(commentId, reply) {
      this.replyInputsReply[reply._id] = '';
      this.replyingToReply[reply._id] = reply.author;
      this.showReplies[commentId] = true;
    },

    startEditReply(reply) {
      this.editingReplyId = reply._id;
      this.editedReplyContent = reply.content;
    },

    cancelEditReply() {
      this.editingReplyId = null;
      this.editedReplyContent = '';
    },

    async saveReply(commentId, replyId) {
      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: this.editedReplyContent })
        });

        const data = await res.json();
        if (res.ok) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            const idx = comment.replies.findIndex(r => r._id === replyId);
            if (idx !== -1) {
              comment.replies[idx] = data.reply;
            }
          }
          this.cancelEditReply();
        }
      } catch (err) {
        console.error("Error to update reply:", err);
      }
    },

    async toggleLike() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return this.showNotify("error", "Error", 'Please login');

      try {
        const res = await fetch(`http://localhost:3000/posts/${this.post._id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: savedUser.username
          })
        });

        const data = await res.json();
        // Don't mutate the prop directly, emit event instead
        this.$emit('liked', { postId: this.post._id, likes: data.likes });
      } catch (err) {
        console.error("Cannot like this post:", err);
        this.showNotify("error", "Error", 'Unable to like this post');
      }
    },

    sharePost() {
      this.$emit('share', this.post);
    },

    async checkUserRating() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser || !this.post) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}`);
        const data = await res.json();
        
        // Check if user has already rated (comment with rating)
        this.userHasRated = data.some(comment => 
          comment.author._id === savedUser.id && comment.rating > 0
        );
      } catch (err) {
        console.error("Error checking user rating:", err);
        this.userHasRated = false;
      }
    },

    async fetchRatingStats() {
      if (!this.post || !this.post._id) return;
      
      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}/rating-stats`);
        if (res.ok) {
          const stats = await res.json();
          this.localTotalRatings = stats.totalRatings || 0;
          this.localAverageRating = stats.averageRating || 0;
        }
      } catch (err) {
        console.error("Cannot fetch rating stats:", err);
      }
    },

   

    getTruncatedText(text) {
      if (!text) return '';
      const lines = text.split('\n');
      
      // Lấy 3 dòng đầu tiên
      if (lines.length > 3) {
        return lines.slice(0, 3).join('\n') + '...';
      }
      
      // Hoặc lấy 150 ký tự đầu tiên
      if (text.length > 150) {
        return text.substring(0, 150) + '...';
      }
      
      return text;
    },

    toggleContent() {
      this.isContentExpanded = !this.isContentExpanded;
    },

    handleOverlayClick() {
      // Nếu đang mở emoji → chỉ đóng emoji, KHÔNG đóng modal
      if (this.activeEmojiPicker) {
        this.activeEmojiPicker = null;
        return;
      }

      // Không mở emoji → đóng modal
      this.closeModal();
    },

    nextItem() {
      if (this.currentItemIndex < this.linkedItemTotal - 1) {
        this.currentItemIndex++;
      }
    },

    prevItem() {
      if (this.currentItemIndex > 0) {
        this.currentItemIndex--;
      }
    },

    openItem(itemId) {
      window.open(`/marketplace/${itemId}`, "_blank");
    },

    showNotify(type, title, message) {
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.visible = true;
    },

    closeNotify() {
      this.notification.visible = false;
    },


  },

  beforeUnmount() {
    document.removeEventListener('click', this.closeEmojiPickerOnClickOutside);
  }
};
</script>

<style scoped>
/* --- CÁC STYLE CŨ (Giữ nguyên) --- */

.comment-modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%; 
  background-color: rgba(0, 0, 0, 0.45);
   display: flex; 
   justify-content: center; 
   align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; }

   .comment-modal-content {
  background: var(--bg-card);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  height: 85vh;        /* Chiều cao cố định */
  max-height: 800px;
  min-height: 500px;
  
  /* Setup Flexbox dọc */
  display: flex;
  flex-direction: column; 
  
  /* Quan trọng: Ẩn thanh cuộn của khung chính để các phần con tự cuộn */
  overflow: hidden; 
  border: 1px solid var(--border-color);
}
/* 2. Header: Cố định, không bị co lại */
.comment-modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  
  /* Quan trọng: Không cho phép header bị co nhỏ khi thiếu chỗ */
  flex-shrink: 0; 
  z-index: 10;
}
.comment-modal-header h3 { 
  margin: 0; 
  font-size: 18px; 
  font-weight: 700; 
  color: var(--text-main); 
  text-align: center; 
}
.close-btn { 
  background: var(--bg-input);
  border: none; 
  border-radius: 50%; 
  width: 36px; 
  height: 36px; 
  font-size: 20px; 
  color: var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; position: absolute; right: 24px; top: 50%; transform: translateY(-50%); }
.close-btn:hover { background: var(--hover-bg); }

.post-detail {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  
  /* Giới hạn chiều cao tối đa (ví dụ 30% màn hình modal) để nhường chỗ cho comment */
  max-height: 30vh; 
  overflow-y: auto; /* Cuộn nếu bài viết dài */
  flex-shrink: 0;   /* Không co lại */
}
.post-author-info { display: flex; align-items: flex-start; margin-bottom: 12px; }
.author-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover; }
.author-details strong { 
  font-size: 15px; font-weight: 600; color: var(--text-main); }
.author-details .time { font-size: 13px; color: var(--text-sub); margin-top: 2px; }

.post-content { 
  font-size: 15px; 
  line-height: 1.4; 
  color: var(--text-main); margin: 12px 0; white-space: pre-line; }
.content-collapsed { max-height: none; overflow: hidden; }
.read-more-btn { background: none; border: none; color: var(--primary); font-weight: 600; font-size: 14px; cursor: pointer; padding: 4px 0; margin-top: 4px; }
.read-more-btn:hover { text-decoration: underline; }

.recipe-content { 
  background: var(--bg-input); 
  border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-top: 12px; }
.recipe-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 5px 5px;
  color: var(--text-main);
}

.recipe-category {
  display: inline-block;
  font-size: 13px;
  background: var(--hover-primary);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-weight: 600;
}

.recipe-section-header {
  font-weight: 700;
  margin: 0 0 10px 0;
  font-size: 13px;
  color: var(--text-main);
}
.recipe-section { margin-bottom: 12px; }
.recipe-section:last-child { margin-bottom: 0; }
.recipe-section strong { color: var(--primary); font-size: 14px; font-weight: 600; display: block; margin-bottom: 6px; }
.recipe-text { 
  font-size: 14px; 
  line-height: 1.5; 
  color: var(--text-main); 
  margin: 0; white-space: pre-line; 
  background: var(--bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid #e3e6ea; }

.post-media-modal { margin: 16px 0; text-align: center; }
.post-image-modal { 
  width: 100%; 
  max-height: 480px; 
  object-fit: cover; 
  border-radius: 12px; 
  display: block; 
}
.post-video-modal { 
  width: 100%; 
  max-height: 300px; 
  object-fit: contain; 
  border-radius: 8px; background-color:black;}
.post-stats { display: flex; gap: 16px; margin: 16px 0 12px 0; font-size: 14px; color: var(--text-sub); }

.post-actions-modal { 
  display: flex; 
  justify-content: space-around; 
  padding: 8px 0; 
  border-top: 1px solid var(--border-color); 
  margin-top: 10px; 
}

.action-btn { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  background: none; 
  border: none; 
  padding: 8px 12px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 500; 
  color: var(--text-sub); flex: 1; justify-content: center; }
.action-btn:hover { color: var(--primary); background: var(--hover-primary); }
.action-icon { width: 20px; height: 20px; }

.comments-section {
  flex-grow: 1;     /* Tự động giãn ra lấp đầy khoảng trống giữa bài viết và footer */
  padding: 10px;
  background-color: var(--bg-body);
  
  overflow-y: auto; /* Bật thanh cuộn cho riêng vùng này */
  min-height: 0;    /* Fix lỗi flexbox trên một số trình duyệt */
}
.comments-list::-webkit-scrollbar { display: none; }
.no-comments { 
  text-align: center; 
  padding: 40px 20px; 
  color: var(--text-sub); 
}
.no-comments-icon { font-size: 48px; margin-bottom: 16px; }

/* Comment Items */
.comment-item { display: flex; margin-bottom: 16px; padding: 8px 4px; }
.comment-avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover; }
.comment-content { flex: 1; min-width: 0; }
.comment-bubble { background: var(--bg-input); border-radius: 16px; padding: 8px 12px; display: inline-block; max-width: 90%; word-wrap: break-word; }
.edit-comment-container { width: 100%; margin-top: 8px; }
.edit-comment-container .edit-textarea { 
  width: 100%; 
  min-height: 80px; 
  padding: 12px 16px; 
  border: 1px solid var(--border-color); 
  border-radius: 12px; 
  resize: vertical; 
  font-family: inherit; 
  font-size: 14px; 
  line-height: 1.4; 
  box-sizing: border-box; 
  background-color: var(--bg-card); color: var(--text-main); 
}
.edit-comment-container .edit-textarea:focus { 
  outline: none; 
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2); 
}
.edit-rating-value {
  margin-left: 8px;
  font-size: 13px;
  color: #856404; 
  
  font-weight: 700; /* Tăng độ đậm một chút cho rõ */
}
.comment-author { 
  font-size: 13px; 
  font-weight: 600; 
  color: var(--text-main); 
  display: inline-flex; 
  margin-bottom: 2px; 
  align-items: center; 
}
.comment-text { 
  font-size: 14px; 
  color: var(--text-main);
   margin: 0; line-height: 1.4; word-wrap: break-word; 
  }
.comment-actions { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-top: 4px; 
  margin-left: 12px; 
  font-size: 12px; color: var(--text-sub); }
.comment-time { font-size: 12px; color: var(--text-sub); }
.comment-action-btn { 
  background: none; 
  border: none; 
  font-size: 12px; 
  font-weight: 500; 
  color: var(--text-sub); 
  cursor: pointer; 
  padding: 0; display: flex; align-items: center; gap: 4px; 
}
.comment-action-btn:hover { 
  text-decoration: underline; 
  color: var(--primary);
}
.action-icon-small { width: 14px; height: 14px; }

/* Add Comment Section (Đã sửa lại cho Emoji) */
.add-comment-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color); 
  background: var(--bg-card);
  gap: 10px;
  
  /* Quan trọng: Không cần position: sticky nữa vì Flexbox đã đẩy nó xuống cuối */
  position: relative; 
  flex-shrink: 0; /* Đảm bảo không bao giờ bị đè bẹp */
  z-index: 20;
}
.user-avatar {
  width: 36px; /* Tăng nhẹ kích thước avatar cho cân đối */
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 0;
}
.comment-input-container {
  flex: 1;
  display: flex;
  flex-direction: row; /* QUAN TRỌNG: Xếp ngang các phần tử */
  align-items: center; /* Căn giữa theo chiều dọc */
  gap: 8px; /* Khoảng cách giữa Nút Rating và Ô Input */
  position: relative; /* Để định vị bảng chọn sao (star selector) */
}

/* Wrapper của comment chính */
.comment-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1; /* Chiếm hết phần không gian còn lại */
  background: var(--bg-input);
  border-radius: 20px;
  padding: 0 12px;
  position: relative;
  height: 36px; /* Chiều cao cố định cho đẹp */
}
.comment-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; padding-right: 8px; color: var(--text-main); }
.comment-input::placeholder { color: var(--text-sub); }

/* --- STYLES MỚI CHO EMOJI --- */

/* 1. Wrapper của Reply Input (có icon emoji bên trong) */
.input-with-emoji-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: 18px;
  padding: 4px 8px 4px 12px;
  position: relative;
}

.reply-input { 
  flex: 1; 
  background: transparent; 
  border: none; 
  outline: none; 
  font-size: 13px; 
  padding: 4px 0; 
  color: var(--text-main);
}

/* 2. Nút Emoji (Main & Small) */
.emoji-wrapper-main { 
  position: relative; 
  display: flex; 
  align-items: center; 
  margin-right: 8px; }
.emoji-wrapper-small { position: relative; display: flex; align-items: center; }

.emoji-btn-main, .emoji-btn-small { 
  background: none; 
  border: none; 
  cursor: pointer; 
  padding: 4px; 
  display: flex; 
  align-items: center;
  opacity: 0.6;
  transition: transform 0.1s; 
}
.emoji-btn-main:hover, .emoji-btn-small:hover { transform: scale(1.1); opacity: 1; }

.icon-emoji-img { width: 20px; height: 20px; } /* Icon ảnh mặt cười */

/* 3. Popover bảng Emoji */
/* Cho comment chính (hiện cao hơn) */
.emoji-popover-main { 
  position: absolute; 
  bottom: 45px; 
  right: 0; 
  z-index: 100; 
  box-shadow: 0 5px 15px rgba(0,0,0,0.2); 
  border-radius: 8px; 
  background: var(--bg-card);
}
/* Cho reply (hiện thấp hơn chút) */
.emoji-wrapper-edit .emoji-popover-up {
  position: absolute;
  bottom: 35px;        /* giữ như cũ */
  right: 30%;  
  top:0;
  margin-top:50px;  
 
  transform: translateX(30px); /* 👈 NHÍCH NHẸ QUA PHẢI */
  
  z-index: 9999;
}


/* Nút gửi tin nhắn */
.send-comment-btn, .send-reply-btn { 
  background: none; 
  border: none; 
  color: var(--primary); 
  font-size: 16px; 
  cursor: pointer; 
  padding: 0 4px; 
  margin-left: 8px; /* Cách emoji ra một chút */
  transition: transform 0.1s; 
  flex-shrink: 0;
}
.send-comment-btn:hover:not(:disabled), .send-reply-btn:hover:not(:disabled) { 
  transform: scale(1.1); color: #FF642F; }
.send-comment-btn:disabled, .send-reply-btn:disabled { color: #bcc0c4; cursor: default; }

/* --- END EMOJI STYLES --- */

/* Rating Toggle */
.rating-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0; /* Xóa margin cũ */
  flex-shrink: 0; /* Đảm bảo nút không bị co nhỏ */
}
.toggle-rating-btn {
  background: var(--hover-primary);
  border: none;
  padding: 0 12px;
  border-radius: 18px; /* Bo tròn kiểu "chip" */
  font-size: 13px;
  cursor: pointer;
  color: var(--primary);
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  height: 36px; /* Chiều cao bằng với ô input */
  display: flex;
  align-items: center;
}
.star-rating-selector {
  display: flex;
  position: absolute;
  bottom: 100%; /* Hiện lên trên container */
  left: 0;      /* Căn trái thẳng hàng với nút */
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bg-card);
  border-radius: 20px;
  margin-bottom: 12px; /* Cách xa nút một chút */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* Thêm bóng đổ cho đẹp */
  border: 1px solid var(--border-color);
  z-index: 10;}
.star { font-size: 20px; cursor: pointer; color: #ddd; }
.star.filled { color: #ffc107; }
.star:hover { transform: scale(1.15); }
.rating-text { font-size: 12px; color: #65676b; margin-left: 6px; align-self: center; }

/* Rating Stats */
.rating-statistics {
  background: var(--hover-primary);
  /* border: 1px solid #ffd966; */
  border-radius: 12px;
  padding: 12px 16px;
  margin: 12px 0;
}
.rating-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.average-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rating-number { font-size: 24px; font-weight: bold; color: var(--primary); margin-right: 8px; }
/* --- Tìm và thay thế đoạn này trong <style scoped> --- */

/* 1. Ngôi sao trong comment */
.star-display {
  font-size: 14px;
  color: #ddd;      /* Màu xám cho sao rỗng */
  margin-right: 1px;
}

.star-display.filled {
  color: #ffc107;   /* MÀU VÀNG (Gold) cho sao đã chọn */
}

/* 2. Chữ hiển thị số sao (Ví dụ: 5 stars) */
.rating-text-display {
  margin-left: 6px;
  font-size: 13px;
  color: #856404;   /* MÀU CAM (Orange) giống phần tổng hợp ở trên */
  font-weight: 700; /* Chữ đậm */
}
.star-icon { font-size: 16px; color: #ddd; }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 13px; color: var(--text-sub); font-weight: 600; }
.updated { animation: pulse 0.3s ease-in-out; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

/* Reply styles */
.reply-section { margin-top: 8px; padding-left: 20px; }
.reply-input-wrapper, .reply-to-reply-input-wrapper { display: flex; align-items: center; gap: 8px; }
.user-avatar-small { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }

.replies-section { 
  margin-top: 12px; 
  padding-left: 20px; 
  border-left: 2px solid var(--border-color); }
.toggle-replies-btn { 
  background: none; 
  border: none; 
  color: var(--primary);
  cursor: pointer; 
  font-size: 12px; font-weight: 600; margin-bottom: 8px; 
}
.reply-item { display: flex; gap: 8px; margin-top: 8px; }
.reply-content { flex: 1; }
.reply-bubble { 
  background-color: var(--bg-input); 
  padding: 6px 10px; 
  border-radius: 12px; 
  display: inline-block; 
  max-width: 75%; 
  word-wrap: break-word; 
}
.reply-bubble strong { 
  font-size: 13px; 
  color: var(--text-main); 
}
.reply-bubble p { font-size: 13px; margin: 0; }
.reply-to-name { 
  color: var(--primary); 
  font-weight: 500; 
  margin-right: 4px; 
}
.author-label { 
  background-color: var(--primary);
  color: white; 
  font-size: 11px; 
  font-weight: 500; 
  padding: 2px 6px; 
  margin-left: 6px; 
  border-radius: 4px; 
}
.reply-actions { display: flex; gap: 8px; margin-top: 2px; font-size: 11px; color: #65676b; margin-left: 10px; }
.reply-time { color: var(--text-sub); font-size: 11px; }

.edit-input-wrapper {
  display: flex;
  align-items: flex-start; /* Căn trên cùng */
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px;
  position: relative;
  transition: border-color 0.2s;
}

.edit-input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.edit-textarea-with-emoji,
.edit-reply-input-with-emoji {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
  min-height: 60px;
  padding-right: 8px;
  color: var(--text-main);
}

/* Nút Emoji trong Edit (đặt ở góc dưới hoặc phải) */
.emoji-wrapper-edit {
  position: relative;
  display: flex;
  align-items: center;
  align-self: flex-end; /* Nằm ở đáy khung */
  margin-left: 4px;
  margin-bottom: 4px; /* Cách đáy một chút */
}

/* Edit Reply */
.edit-reply-container { width: 100%; margin-top: 8px; }
.edit-reply-container .edit-reply-input { width: calc(100% - 40px) !important; min-height: 80px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 12px; resize: vertical; font-family: inherit; font-size: 13px; line-height: 1.4; box-sizing: border-box; background-color: white; color: #1c1e21; }
.edit-actions { display: flex; gap: 8px; margin-top: 8px; }
.save-btn, .cancel-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.save-btn { background-color: var(--primary); color: #fff; }
.cancel-btn { background-color: var(--bg-input); color: var(--text-main); }

/* Filter Bar */
.comment-filter-bar { 
  display: flex; 
  gap: 8px; 
  padding: 12px 16px; 
  background: var(--bg-card); 
  border-bottom: 1px solid var(--border-color); 
  overflow-x: auto; 
}
.filter-btn { 
  padding: 8px 16px; 
  border: 1px solid var(--border-color); background: var(--bg-card);
  border-radius: 20px; 
  font-size: 13px; 
  font-weight: 500; 
  color: var(--text-sub); 
  cursor: pointer; white-space: nowrap; flex-shrink: 0; 
}
.filter-btn:hover { background: var(--primary); color:white; border-color: #FF642F; }
.filter-btn.active { background: var(--primary); color: white; border-color: #FF642F; }

.linked-items-preview {
  margin-top: 16px;
}

.linked-items-header {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.linked-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bg-input);
}

.linked-item-left {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.linked-item-thumb {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.linked-item-info {
  min-width: 0;
}

.linked-item-title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  
}

.linked-item-meta {
  font-size: 12px;
  color: var(--primary);
  margin-top: 2px;
}

.own-item-badge {
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  background: #e6f9ee;
  color: #15803d;
  text-transform: uppercase;
}

.view-item-btn {
  margin-left:10px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  cursor: pointer;
}

.view-item-btn:hover {
  background: var(--hover-primary); 
  color: var(--primary); 
  border-color: var(--primary);
}

.linked-item-arrows {
  display: flex;
  gap: 6px;
}

.arrow-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-color); 
  background: var(--bg-card); 
  color: var(--text-main);
  cursor: pointer;
  font-size: 18px;
}

.arrow-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.linked-item-counter {
margin-top: 6px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub); 
  background: var(--bg-input);
  padding: 3px 10px;
  border-radius: 999px;
  width: fit-content;
}

/* Highlight comment từ notification */
.comment-highlight {
  animation: comment-highlight-fade 3s ease forwards;
  border-radius: 10px;
  padding-left: 10px;
}

@keyframes comment-highlight-fade {
  0%   { 
    box-shadow: inset 3px 0 0 var(--primary); 
    background: var(--hover-primary); 
  }
  60%  { 
    box-shadow: inset 3px 0 0 #FF642F; 
    background: var(--hover-primary); 
  }
  100% { 
    box-shadow: inset 3px 0 0 transparent; 
    background: transparent; 
  }
}


/* Responsive */
@media (max-width: 768px) {
  .comment-modal-content { height: 90vh; max-height: none; }
  .post-detail { max-height: 250px; }
  .comments-section { padding: 0 16px; }
  .add-comment-section { padding: 12px 16px; }
}
</style>